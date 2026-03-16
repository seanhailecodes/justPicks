import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Calculate who covered the spread
function calculateCoveredBy(
  homeScore: number,
  awayScore: number,
  homeSpread: number
): 'home' | 'away' | 'push' {
  const homeWithSpread = homeScore + homeSpread
  const scoreDiff = homeWithSpread - awayScore
  
  if (scoreDiff > 0) return 'home'
  if (scoreDiff < 0) return 'away'
  return 'push'
}

// Resolve over/under result
function resolveOverUnder(
  overUnderPick: 'over' | 'under',
  totalPoints: number,
  overUnderLine: number
): boolean | null {
  if (totalPoints === overUnderLine) return null // push
  if (overUnderPick === 'over') {
    return totalPoints > overUnderLine
  } else {
    return totalPoints < overUnderLine
  }
}

// Calculate win weight for a pick
function calcWinWeight(correct: boolean | null, betType: string | null, mlOdds: number | null): number {
  if (!correct) return 1.0
  if (betType !== 'moneyline' || mlOdds === null) return 1.0
  if (mlOdds > 0) return mlOdds / 100
  return 100 / Math.abs(mlOdds)
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

    // Step 1: Find NBA games that need resolution
    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)
    
    const { data: unresolvedGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .eq('league', 'NBA')
      .is('home_score', null)
      .lt('game_date', now.toISOString())
      .gt('game_date', threeDaysAgo.toISOString())
      .order('game_date', { ascending: true })

    if (gamesError) {
      throw gamesError
    }

    if (!unresolvedGames || unresolvedGames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No games to resolve', gamesResolved: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${unresolvedGames.length} unresolved NBA games`)

    // Step 2: Fetch scores from The Odds API
    const url = `https://api.the-odds-api.com/v4/sports/basketball_nba/scores/?apiKey=${API_KEY}&daysFrom=3`
    
    console.log('Fetching NBA scores from The Odds API...')
    const response = await fetch(url)
    
    const requestsRemaining = response.headers.get('x-requests-remaining')
    console.log(`Odds API requests remaining: ${requestsRemaining}`)

    if (!response.ok) {
      throw new Error(`Scores API error: ${response.status}`)
    }

    const allScores = await response.json()
    console.log(`Fetched ${allScores.length} scores`)

    // Step 3: Match and resolve games
    let gamesResolved = 0
    let picksResolved = 0

    for (const game of unresolvedGames) {
      // Find matching score by external_id
      const score = allScores.find((s: any) => s.id === game.external_id)
      
      if (!score || !score.completed) {
        console.log(`No completed score for: ${game.away_team} @ ${game.home_team} (external_id: ${game.external_id})`)
        continue
      }

      const homeScoreData = score.scores?.find((s: any) => s.name === game.home_team)
      const awayScoreData = score.scores?.find((s: any) => s.name === game.away_team)

      if (!homeScoreData || !awayScoreData) {
        console.log(`Score data missing for: ${game.away_team} @ ${game.home_team}`)
        continue
      }

      const homeScore = parseInt(homeScoreData.score)
      const awayScore = parseInt(awayScoreData.score)
      const homeSpread = game.home_spread !== null && game.home_spread !== undefined ? parseFloat(game.home_spread) : null
      const overUnderLine = game.over_under_line

      // Calculate who covered (only if spread data exists)
      const coveredBy = homeSpread !== null ? calculateCoveredBy(homeScore, awayScore, homeSpread) : null
      const totalPoints = homeScore + awayScore

      console.log(`Resolving: ${game.away_team} ${awayScore} @ ${game.home_team} ${homeScore} | Spread: ${homeSpread ?? 'N/A'} | Covered: ${coveredBy ?? 'unresolvable'}`)

      // Update game with final scores
      const { error: updateError } = await supabase
        .from('games')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          game_status: 'final',
          locked: true,
        })
        .eq('id', game.id)

      if (updateError) {
        console.error(`Error updating game ${game.id}:`, updateError)
        continue
      }

      gamesResolved++

      // Resolve all picks for this game
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('*, bet_type, ml_odds')
        .eq('game_id', game.id)

      if (picksError) {
        console.error(`Error fetching picks for game ${game.id}:`, picksError)
        continue
      }

      for (const pick of picks || []) {
        // Resolve spread pick — leave null if spread data was missing at game time
        let spreadCorrect: boolean | null = null
        if (pick.team_picked && coveredBy !== null) {
          if (coveredBy === 'push') {
            spreadCorrect = null
          } else {
            spreadCorrect = pick.team_picked === coveredBy
          }
        }

        // Resolve over/under pick
        let overUnderCorrect: boolean | null = null
        if (pick.over_under_pick && overUnderLine) {
          overUnderCorrect = resolveOverUnder(pick.over_under_pick, totalPoints, overUnderLine)
        }

        // Calculate win weight (use spreadCorrect as the primary correctness indicator)
        const winWeight = calcWinWeight(spreadCorrect, pick.bet_type, pick.ml_odds)

        // Update pick
        const { error: pickUpdateError } = await supabase
          .from('picks')
          .update({
            correct: spreadCorrect,
            over_under_correct: overUnderCorrect,
            win_weight: winWeight
          })
          .eq('id', pick.id)

        if (!pickUpdateError) {
          picksResolved++
          console.log(`  Pick ${pick.id}: Spread=${spreadCorrect}, O/U=${overUnderCorrect}`)

          // Send push notification to this user
          const resultText = spreadCorrect === true ? '✅ Correct!' : spreadCorrect === false ? '❌ Incorrect' : '🤝 Push'
          const gameTitle = `${game.away_team} @ ${game.home_team}`
          fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
            body: JSON.stringify({
              userId: pick.user_id,
              title: `NBA Pick ${resultText}`,
              body: `${gameTitle} — Final: ${awayScore}-${homeScore}`,
              url: '/history/picks',
              tag: `pick-${pick.id}`,
            }),
          }).catch((e) => console.warn('Push notify failed:', e))
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        gamesResolved,
        picksResolved,
        requestsRemaining,
        message: `Resolved ${gamesResolved} games and ${picksResolved} picks`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})