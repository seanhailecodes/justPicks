import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maps DB league name → Odds API sport key(s)
const LEAGUE_ODDS_KEYS: Record<string, string[]> = {
  NBA:   ['basketball_nba'],
  NFL:   ['americanfootball_nfl'],
  NCAAB: ['basketball_ncaab'],
  NHL:   ['icehockey_nhl'],
  MLB:   ['baseball_mlb'],
  SOCCER: [
    'soccer_uefa_champs_league',
    'soccer_fifa_world_cup',
    'soccer_epl',
    'soccer_usa_mls',
  ],
}

function calculateCoveredBy(
  homeScore: number,
  awayScore: number,
  homeSpread: number
): 'home' | 'away' | 'push' {
  const diff = homeScore + homeSpread - awayScore
  if (diff > 0) return 'home'
  if (diff < 0) return 'away'
  return 'push'
}

function resolveOverUnder(
  pick: 'over' | 'under',
  total: number,
  line: number
): boolean | null {
  if (total === line) return null
  return pick === 'over' ? total > line : total < line
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('ODDS_API_KEY')
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    if (!API_KEY) throw new Error('ODDS_API_KEY not set')

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    const now = new Date()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000)

    // Step 1: Find all unresolved games across every sport
    const { data: unresolvedGames, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .is('home_score', null)
      .lt('game_date', now.toISOString())
      .gt('game_date', threeDaysAgo.toISOString())

    if (gamesError) throw gamesError

    if (!unresolvedGames || unresolvedGames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No games to resolve', gamesResolved: 0, picksResolved: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Group by league so we only hit the API for leagues that need it
    const byLeague: Record<string, typeof unresolvedGames> = {}
    for (const game of unresolvedGames) {
      const league = game.league as string
      if (!byLeague[league]) byLeague[league] = []
      byLeague[league].push(game)
    }

    console.log(`Unresolved games by league: ${JSON.stringify(Object.fromEntries(Object.entries(byLeague).map(([k,v]) => [k, v.length])))}`)

    // Step 3: Fetch scores only for leagues that have unresolved games
    const scoresByExternalId = new Map<string, any>()
    let lastRequestsRemaining = 'unknown'

    for (const league of Object.keys(byLeague)) {
      const oddsKeys = LEAGUE_ODDS_KEYS[league]
      if (!oddsKeys) {
        console.log(`No Odds API key configured for league: ${league}`)
        continue
      }

      for (const oddsKey of oddsKeys) {
        const url = `https://api.the-odds-api.com/v4/sports/${oddsKey}/scores/?apiKey=${API_KEY}&daysFrom=3`
        console.log(`Fetching scores: ${oddsKey}`)
        const res = await fetch(url)
        lastRequestsRemaining = res.headers.get('x-requests-remaining') ?? lastRequestsRemaining

        if (!res.ok) {
          console.error(`Scores API error for ${oddsKey}: ${res.status}`)
          continue
        }

        const scores = await res.json()
        for (const s of scores) {
          if (s.completed) scoresByExternalId.set(s.id, s)
        }
        console.log(`  Got ${scores.filter((s:any) => s.completed).length} completed scores from ${oddsKey}`)
      }
    }

    // Step 4: Resolve each game
    let gamesResolved = 0
    let picksResolved = 0

    for (const game of unresolvedGames) {
      const score = scoresByExternalId.get(game.external_id)

      if (!score || !score.completed) {
        console.log(`Not yet final: ${game.away_team} @ ${game.home_team} (${game.league})`)
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
      const coveredBy = homeSpread !== null ? calculateCoveredBy(homeScore, awayScore, homeSpread) : null
      const totalPoints = homeScore + awayScore

      console.log(`Resolving ${game.league}: ${game.away_team} ${awayScore} @ ${game.home_team} ${homeScore} | Spread covered: ${coveredBy ?? 'unresolvable (no spread data)'}`)

      // Update game record
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ home_score: homeScore, away_score: awayScore, game_status: 'final', locked: true })
        .eq('id', game.id)

      if (gameUpdateError) {
        console.error(`Error updating game ${game.id}:`, gameUpdateError)
        continue
      }

      gamesResolved++

      // Fetch and resolve picks for this game
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .eq('game_id', game.id)
        .is('correct', null)  // Only resolve picks not yet resolved

      if (picksError) {
        console.error(`Error fetching picks for game ${game.id}:`, picksError)
        continue
      }

      for (const pick of picks || []) {
        // Leave null if spread data was missing — never guess
        let spreadCorrect: boolean | null = null
        if (pick.team_picked && coveredBy !== null) {
          spreadCorrect = coveredBy === 'push' ? null : pick.team_picked === coveredBy
        }

        let overUnderCorrect: boolean | null = null
        if (pick.over_under_pick && overUnderLine) {
          overUnderCorrect = resolveOverUnder(pick.over_under_pick, totalPoints, overUnderLine)
        }

        const { error: pickError } = await supabase
          .from('picks')
          .update({ correct: spreadCorrect, over_under_correct: overUnderCorrect })
          .eq('id', pick.id)

        if (!pickError) {
          picksResolved++
          console.log(`  Pick ${pick.id}: spread=${spreadCorrect}, o/u=${overUnderCorrect}`)
        }
      }
    }

    const summary = {
      success: true,
      gamesResolved,
      picksResolved,
      requestsRemaining: lastRequestsRemaining,
      message: `Resolved ${gamesResolved} games and ${picksResolved} picks across all sports`,
    }

    console.log(JSON.stringify(summary))
    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (error) {
    console.error('resolve-all-games error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
