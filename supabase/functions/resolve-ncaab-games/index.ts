import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('ODDS_API_KEY')
    if (!API_KEY) {
      throw new Error('ODDS_API_KEY not set')
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    let resolvedCount = 0
    let requestsRemaining = 0

    // Get unresolved NCAAB games from past 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: unresolvedGames, error: fetchError } = await supabase
      .from('games')
      .select('id, external_id, home_team, away_team, home_spread')
      .eq('league', 'NCAAB')
      .eq('locked', false)
      .lt('game_date', new Date().toISOString())
      .gte('game_date', threeDaysAgo.toISOString())

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${unresolvedGames?.length || 0} unresolved NCAAB games`)

    if (!unresolvedGames || unresolvedGames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, resolvedCount: 0, message: 'No games to resolve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch scores from The Odds API
    const url = `https://api.the-odds-api.com/v4/sports/basketball_ncaab/scores/?apiKey=${API_KEY}&daysFrom=3`
    
    console.log('Fetching NCAAB scores...')
    const response = await fetch(url)
    
    const remaining = response.headers.get('x-requests-remaining')
    if (remaining) {
      requestsRemaining = parseInt(remaining)
    }

    if (!response.ok) {
      throw new Error(`Scores API error: ${response.status}`)
    }

    const allScores = await response.json()
    console.log(`Fetched ${allScores.length} scores`)

    // Match scores to games and resolve
    for (const game of unresolvedGames) {
      // Find matching score by external_id
      const score = allScores.find((s: any) => s.id === game.external_id)
      
      if (!score || !score.completed) {
        continue
      }

      const homeScore = score.scores?.find((s: any) => s.name === game.home_team)?.score
      const awayScore = score.scores?.find((s: any) => s.name === game.away_team)?.score

      if (homeScore === undefined || awayScore === undefined) {
        console.log(`No scores found for ${game.away_team} @ ${game.home_team}`)
        continue
      }

      const homeScoreNum = parseInt(homeScore)
      const awayScoreNum = parseInt(awayScore)
      const homeSpread = parseFloat(game.home_spread) || 0

      // Calculate if home team covered the spread
      // Home covers if: (homeScore + homeSpread) > awayScore
      const homeScoreWithSpread = homeScoreNum + homeSpread
      const homeCovered = homeScoreWithSpread > awayScoreNum
      const push = homeScoreWithSpread === awayScoreNum

      let winner = 'away'
      if (push) {
        winner = 'push'
      } else if (homeCovered) {
        winner = 'home'
      }

      // Update game with results
      const { error: updateError } = await supabase
        .from('games')
        .update({
          locked: true,
          game_status: 'final',
          home_score: homeScoreNum,
          away_score: awayScoreNum,
          winner: winner,
        })
        .eq('id', game.id)

      if (updateError) {
        console.error(`Error updating game ${game.id}:`, updateError)
        continue
      }

      // Update picks for this game
      const { data: picks, error: picksSelectError } = await supabase
        .from('picks')
        .select('id, team_picked')
        .eq('game_id', game.id)

      if (!picksSelectError && picks) {
        for (const pick of picks) {
          let correct: boolean | null = null
          
          if (!push) {
            correct = pick.team_picked === winner
          }

          await supabase
            .from('picks')
            .update({ correct })
            .eq('id', pick.id)
        }
      }

      resolvedCount++
      console.log(`Resolved: ${game.away_team} @ ${game.home_team} - ${awayScoreNum}-${homeScoreNum}, winner: ${winner}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        resolvedCount,
        totalUnresolved: unresolvedGames.length,
        requestsRemaining,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})