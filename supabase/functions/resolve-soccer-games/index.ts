import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// The Odds API sport keys for soccer
const SOCCER_SPORTS = [
  { key: 'soccer_uefa_champs_league', name: 'Champions League' },
  { key: 'soccer_usa_mls', name: 'MLS' },
  { key: 'soccer_fifa_world_cup', name: 'World Cup' },
]

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

    // Get unresolved soccer games from past 3 days
    const threeDaysAgo = new Date()
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3)

    const { data: unresolvedGames, error: fetchError } = await supabase
      .from('games')
      .select('id, external_id, home_team, away_team, home_spread, sub_league')
      .eq('league', 'SOCCER')
      .eq('locked', false)
      .lt('game_date', new Date().toISOString())
      .gte('game_date', threeDaysAgo.toISOString())

    if (fetchError) {
      throw fetchError
    }

    console.log(`Found ${unresolvedGames?.length || 0} unresolved soccer games`)

    if (!unresolvedGames || unresolvedGames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, resolvedCount: 0, message: 'No games to resolve' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Fetch scores for each soccer league
    const allScores: any[] = []
    
    for (const sport of SOCCER_SPORTS) {
      const url = `https://api.the-odds-api.com/v4/sports/${sport.key}/scores/?apiKey=${API_KEY}&daysFrom=3`
      
      console.log(`Fetching scores for ${sport.name}`)
      const response = await fetch(url)
      
      const remaining = response.headers.get('x-requests-remaining')
      if (remaining) {
        requestsRemaining = parseInt(remaining)
      }

      if (!response.ok) {
        console.error(`Error fetching ${sport.name} scores:`, response.status)
        continue
      }

      const scores = await response.json()
      allScores.push(...scores)
    }

    console.log(`Fetched ${allScores.length} total scores`)

    // Match scores to games and resolve
    for (const game of unresolvedGames) {
      // Find matching score by external_id
      const score = allScores.find(s => s.id === game.external_id)
      
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
      // Home spread is typically negative if they're favored
      // Home covers if: (homeScore + homeSpread) > awayScore
      const homeScoreWithSpread = homeScoreNum + homeSpread
      const homeCovered = homeScoreWithSpread > awayScoreNum
      const push = homeScoreWithSpread === awayScoreNum

      // Update game with results
      const { error: updateError } = await supabase
        .from('games')
        .update({
          locked: true,
          game_status: 'final',
          home_score: homeScoreNum,
          away_score: awayScoreNum,
          winner: push ? 'push' : (homeCovered ? 'home' : 'away'),
        })
        .eq('id', game.id)

      if (updateError) {
        console.error(`Error updating game ${game.id}:`, updateError)
        continue
      }

      // Update picks for this game
      const { error: picksError } = await supabase
        .from('picks')
        .update({
          correct: push ? null : supabase.sql`CASE WHEN team_picked = ${homeCovered ? 'home' : 'away'} THEN true ELSE false END`,
        })
        .eq('game_id', game.id)

      if (picksError) {
        console.error(`Error updating picks for game ${game.id}:`, picksError)
      }

      resolvedCount++
      console.log(`Resolved: ${game.away_team} @ ${game.home_team} - ${awayScoreNum}-${homeScoreNum}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        resolvedCount,
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