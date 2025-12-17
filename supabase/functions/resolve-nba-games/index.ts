import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// API-Sports endpoint
const API_SPORTS_URL = 'https://v1.basketball.api-sports.io'

interface GameScore {
  gameId: string
  homeScore: number
  awayScore: number
  status: 'final' | 'cancelled'
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const API_SPORTS_KEY = Deno.env.get('API_SPORTS_KEY')
    if (!API_SPORTS_KEY) {
      throw new Error('API_SPORTS_KEY not set')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Step 1: Find NFL games that need resolution
    // Games where: game_date has passed, not yet resolved (home_score is null)
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

    // Step 2: Fetch scores from API-Sports
    // Get games from the last 3 days
    const dateFrom = threeDaysAgo.toISOString().split('T')[0]
    const dateTo = now.toISOString().split('T')[0]
    
    const scoresUrl = `${API_SPORTS_URL}/games?league=12&season=2024-2025&date=${dateFrom}`
    console.log(`Fetching scores from: ${scoresUrl}`)
    
    const scoresResponse = await fetch(scoresUrl, {
      headers: {
        'x-apisports-key': API_SPORTS_KEY,
      }
    })

    const scoresData = await scoresResponse.json()
    console.log(`API response: ${scoresData.results} games found`)

    if (!scoresData.response || scoresData.response.length === 0) {
      // Try fetching multiple dates
      const allScores: any[] = []
      for (let i = 0; i < 3; i++) {
        const checkDate = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = checkDate.toISOString().split('T')[0]
        
        const dayResponse = await fetch(`${API_SPORTS_URL}/games?league=1&season=2024&date=${dateStr}`, {
          headers: { 'x-apisports-key': API_SPORTS_KEY }
        })
        const dayData = await dayResponse.json()
        if (dayData.response) {
          allScores.push(...dayData.response)
        }
      }
      scoresData.response = allScores
    }

    // Build a map of team name -> score for matching
    const scoresByTeams: Map<string, { home: number, away: number, status: string }> = new Map()
    
    for (const game of scoresData.response || []) {
      if (game.game?.status?.short === 'FT' || game.game?.status?.short === 'AOT') {
        const homeTeam = game.teams?.home?.name
        const awayTeam = game.teams?.away?.name
        const homeScore = game.scores?.home?.total
        const awayScore = game.scores?.away?.total
        
        if (homeTeam && awayTeam && homeScore !== null && awayScore !== null) {
          // Create key from both teams (sorted for consistency)
          const key = [homeTeam.toLowerCase(), awayTeam.toLowerCase()].sort().join('|')
          scoresByTeams.set(key, { home: homeScore, away: awayScore, status: 'final' })
          console.log(`Score found: ${awayTeam} ${awayScore} @ ${homeTeam} ${homeScore}`)
        }
      }
    }

    // Step 3: Match and resolve games
    let gamesResolved = 0
    let picksResolved = 0

    for (const game of unresolvedGames) {
      // Try to find matching score
      const homeNormalized = game.home_team.toLowerCase()
      const awayNormalized = game.away_team.toLowerCase()
      const key = [homeNormalized, awayNormalized].sort().join('|')
      
      // Also try partial matching (team name might be slightly different)
      let matchedScore = scoresByTeams.get(key)
      
      if (!matchedScore) {
        // Try fuzzy match - check if team names contain each other
        for (const [scoreKey, score] of scoresByTeams) {
          const [team1, team2] = scoreKey.split('|')
          if ((homeNormalized.includes(team1) || team1.includes(homeNormalized)) &&
              (awayNormalized.includes(team2) || team2.includes(awayNormalized))) {
            matchedScore = score
            break
          }
          if ((homeNormalized.includes(team2) || team2.includes(homeNormalized)) &&
              (awayNormalized.includes(team1) || team1.includes(awayNormalized))) {
            // Teams are swapped - need to swap scores
            matchedScore = { home: score.away, away: score.home, status: score.status }
            break
          }
        }
      }

      if (!matchedScore) {
        console.log(`No score found for: ${game.away_team} @ ${game.home_team}`)
        continue
      }

      const { home: homeScore, away: awayScore } = matchedScore
      const homeSpread = parseFloat(game.home_spread) || 0
      const overUnderLine = game.over_under_line

      // Calculate who covered
      const coveredBy = calculateCoveredBy(homeScore, awayScore, homeSpread)
      const totalPoints = homeScore + awayScore

      console.log(`Resolving: ${game.away_team} ${awayScore} @ ${game.home_team} ${homeScore} | Spread: ${homeSpread} | Covered: ${coveredBy}`)

      // Update game with final scores
      const { error: updateError } = await supabase
        .from('games')
        .update({
          home_score: homeScore,
          away_score: awayScore,
          game_status: 'final',
          locked: true,
          resolved_at: new Date().toISOString()
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
        .select('*')
        .eq('game_id', game.id)

      if (picksError) {
        console.error(`Error fetching picks for game ${game.id}:`, picksError)
        continue
      }

      for (const pick of picks || []) {
        // Resolve spread pick
        let spreadCorrect: boolean | null = null
        if (pick.team_picked) {
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

        // Update pick
        const { error: pickUpdateError } = await supabase
          .from('picks')
          .update({
            correct: spreadCorrect,
            over_under_correct: overUnderCorrect
          })
          .eq('id', pick.id)

        if (!pickUpdateError) {
          picksResolved++
          console.log(`  Pick ${pick.id}: Spread=${spreadCorrect}, O/U=${overUnderCorrect}`)
        }
      }
    }

    // Step 4: Check if week is complete and advance if needed
    if (gamesResolved > 0) {
      // Get current week
      const { data: appState } = await supabase
        .from('app_state')
        .select('current_week')
        .single()

      const currentWeek = appState?.current_week || 15

      // Check if all games in current week are resolved
      const { data: remainingGames } = await supabase
        .from('games')
        .select('id')
        .eq('league', 'NBA')
        .eq('week', currentWeek)
        .is('home_score', null)

      if (!remainingGames || remainingGames.length === 0) {
        // All games resolved - advance to next week
        const nextWeek = currentWeek + 1
        if (nextWeek <= 18) {
          await supabase
            .from('app_state')
            .update({ current_week: nextWeek })
            .eq('id', 1) // or however your app_state is keyed

          console.log(`✅ Week ${currentWeek} complete! Advanced to Week ${nextWeek}`)
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        gamesResolved,
        picksResolved,
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