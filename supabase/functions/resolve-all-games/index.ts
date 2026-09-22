import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Maps DB league name → Odds API sport key(s)
const LEAGUE_ODDS_KEYS: Record<string, string[]> = {
  NBA:   ['basketball_nba'],
  WNBA:  ['basketball_wnba'],
  NFL:   ['americanfootball_nfl'],
  NCAAF: ['americanfootball_ncaaf'],
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

// Minimum time (ms) after kickoff before a game can plausibly be final.
// Skipping games younger than this avoids paying for a scores call that
// can only ever return "not yet final" (the cron runs every 30 minutes).
const MIN_GAME_DURATION_MS: Record<string, number> = {
  NFL:    3.0 * 3_600_000,
  NCAAF:  3.3 * 3_600_000,
  NBA:    2.2 * 3_600_000,
  WNBA:   2.0 * 3_600_000,
  NCAAB:  1.9 * 3_600_000,
  NHL:    2.4 * 3_600_000,
  MLB:    2.5 * 3_600_000,
  SOCCER: 1.8 * 3_600_000,
}

// Retry a Supabase call on transient gateway errors (5xx / "Gateway Timeout").
// The resolver's first action is a cold DB read; on the free tier that first
// hop through the API gateway intermittently 504s and would otherwise abort
// the whole run. Three attempts, 1.5 s → 3 s backoff.
async function withRetry<T extends { error: any }>(label: string, fn: () => PromiseLike<T>, attempts = 3): Promise<T> {
  let last: T | undefined
  for (let i = 0; i < attempts; i++) {
    const res = await fn()
    if (!res.error) return res
    const msg = String(res.error?.message ?? '')
    const transient = /gateway|timeout|502|503|504|fetch failed/i.test(msg)
    last = res
    if (!transient || i === attempts - 1) break
    const delay = 1500 * (i + 1)
    console.warn(`${label}: transient error "${msg}", retrying in ${delay}ms (${i + 1}/${attempts - 1})`)
    await new Promise((r) => setTimeout(r, delay))
  }
  return last as T
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

function straightUpWinner(homeScore: number, awayScore: number): 'home' | 'away' | null {
  if (homeScore > awayScore) return 'home'
  if (awayScore > homeScore) return 'away'
  return null
}

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseFloat(String(v))
  return Number.isNaN(n) ? null : n
}

// Grade one picks row against a final score. `correct` is the row's own
// bet: a spread row on the spread, a moneyline row on the straight-up
// winner (a tie is a push), a totals row on the over/under. Legacy spread
// rows that also carry an over/under keep it as a second leg in
// over_under_correct. `gradable` is false when the line needed to grade
// the bet is missing from both the pick snapshot and the game row — such
// a pick is left unresolved rather than silently marked a push.
function gradePick(
  pick: any,
  homeScore: number,
  awayScore: number,
  fallbackHomeSpread: number | null,
  fallbackOverUnder: number | null,
): { correct: boolean | null; overUnderCorrect: boolean | null; gradable: boolean } {
  const totalPoints = homeScore + awayScore
  const pickHomeSpread = toNum(pick.spread_line_at_pick) ?? fallbackHomeSpread
  const pickOverUnder = toNum(pick.total_line_at_pick) ?? fallbackOverUnder

  let spreadCorrect: boolean | null = null
  let spreadGradable = false
  if (pick.team_picked && pickHomeSpread !== null) {
    const coveredBy = calculateCoveredBy(homeScore, awayScore, pickHomeSpread)
    spreadCorrect = coveredBy === 'push' ? null : pick.team_picked === coveredBy
    spreadGradable = true
  }

  let overUnderCorrect: boolean | null = null
  let ouGradable = false
  if (pick.over_under_pick && pickOverUnder !== null) {
    overUnderCorrect = resolveOverUnder(pick.over_under_pick, totalPoints, pickOverUnder)
    ouGradable = true
  }

  if (pick.bet_type === 'total') {
    return { correct: overUnderCorrect, overUnderCorrect, gradable: ouGradable }
  }
  if (pick.bet_type === 'moneyline') {
    const winner = straightUpWinner(homeScore, awayScore)
    const correct = pick.team_picked ? (winner === null ? null : pick.team_picked === winner) : null
    return { correct, overUnderCorrect, gradable: !!pick.team_picked }
  }
  return { correct: spreadCorrect, overUnderCorrect, gradable: spreadGradable }
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
    const { data: candidateGames, error: gamesError } = await withRetry('games query', () =>
      supabase
        .from('games')
        .select('id, league, external_id, game_date, home_team, away_team, home_spread, over_under_line')
        .is('home_score', null)
        .lt('game_date', now.toISOString())
        .gt('game_date', threeDaysAgo.toISOString())
    )

    if (gamesError) throw gamesError

    // Only games that have been running long enough to be final. Anything
    // younger would cost a scores credit and come back "not yet final".
    const unresolvedGames = (candidateGames ?? []).filter((g: any) => {
      const minMs = MIN_GAME_DURATION_MS[g.league as string]
      if (!minMs) return true // unknown league → let the league gate below decide
      return now.getTime() - new Date(g.game_date).getTime() >= minMs
    })
    if ((candidateGames?.length ?? 0) > unresolvedGames.length) {
      console.log(`Skipping ${(candidateGames!.length - unresolvedGames.length)} game(s) still in progress`)
    }

    if (!unresolvedGames || unresolvedGames.length === 0) {
      console.log('No games to resolve')
    }

    // Step 2: Group by league so we only hit the API for leagues that need it
    const byLeague: Record<string, typeof unresolvedGames> = {}
    for (const game of unresolvedGames ?? []) {
      const league = game.league as string
      if (!byLeague[league]) byLeague[league] = []
      byLeague[league].push(game)
    }

    console.log(`Unresolved games by league: ${JSON.stringify(Object.fromEntries(Object.entries(byLeague).map(([k,v]) => [k, v.length])))}`)

    // Step 3: Fetch scores only for leagues that have unresolved games
    const scoresByExternalId = new Map<string, any>()
    let lastRequestsRemaining = 'unknown'

    for (const league of Object.keys(byLeague)) {
      // PGA (and the event-based combat sports) have dedicated resolvers
      // that grade differently — golf on tournament winner, not a numeric
      // two-team score. Skip them here so this generic pass never touches them.
      if (league === 'PGA' || league === 'UFC' || league === 'BOXING') {
        console.log(`Skipping ${league} — handled by its dedicated resolver (resolve-golf-games / event resolvers)`)
        continue
      }

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
      // Dedicated-resolver leagues are graded elsewhere — never here.
      if (game.league === 'PGA' || game.league === 'UFC' || game.league === 'BOXING') {
        continue
      }

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
      // Fallback line/total — used only for legacy picks without snapshot.
      const fallbackHomeSpread = game.home_spread !== null && game.home_spread !== undefined ? parseFloat(game.home_spread) : null
      const fallbackOverUnder = game.over_under_line

      console.log(`Resolving ${game.league}: ${game.away_team} ${awayScore} @ ${game.home_team} ${homeScore} | Spread (game row): ${fallbackHomeSpread ?? 'N/A'}`)

      // Update game record
      const { error: gameUpdateError } = await supabase
        .from('games')
        .update({ home_score: homeScore, away_score: awayScore, game_status: 'final', locked: true, resolved_at: now.toISOString() })
        .eq('id', game.id)

      if (gameUpdateError) {
        console.error(`Error updating game ${game.id}:`, gameUpdateError)
        continue
      }

      gamesResolved++

      // Fetch and resolve picks for this game. A push is `correct` null
      // WITH resolved_at set, so filter on resolved_at — filtering on
      // `correct` re-graded every push on every run.
      const { data: picks, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .eq('game_id', game.id)
        .is('resolved_at', null)

      if (picksError) {
        console.error(`Error fetching picks for game ${game.id}:`, picksError)
        continue
      }

      for (const pick of picks || []) {
        const { correct, overUnderCorrect, gradable } = gradePick(pick, homeScore, awayScore, fallbackHomeSpread, toNum(fallbackOverUnder))
        if (!gradable) {
          console.log(`  Pick ${pick.id}: no line to grade ${pick.bet_type} — left unresolved`)
          continue
        }

        const { error: pickError } = await supabase
          .from('picks')
          .update({ correct, over_under_correct: overUnderCorrect, resolved_at: now.toISOString() })
          .eq('id', pick.id)

        if (!pickError) {
          picksResolved++
          console.log(`  Pick ${pick.id}: correct=${correct}, o/u=${overUnderCorrect}`)
        }
      }
    }

    // Step 5: Sweep — grade any pick still unresolved on a game that is
    // already final. Step 1 only looks at games without a score, so a pick
    // that slipped through when its game resolved (older resolver versions
    // never graded 'total' rows; a hand-graded batch never stamped
    // resolved_at) was never revisited. Unresolved picks are the small set
    // (this week's open tickets plus any stragglers), so start from them
    // and look up only their games — never the other way round, which
    // would put hundreds of game ids in one URL in NCAAB season.
    let picksSwept = 0
    const threeWeeksAgo = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000)
    const { data: openPicks, error: openPicksError } = await withRetry('open picks query', () =>
      supabase
        .from('picks')
        .select('*')
        .is('resolved_at', null)
        .gt('created_at', threeWeeksAgo.toISOString())
    )
    if (openPicksError) console.error('Sweep: open picks query failed:', openPicksError)

    const openGameIds = [...new Set((openPicks ?? []).map((p: any) => p.game_id).filter(Boolean))]
    if (openGameIds.length > 0) {
      const { data: finalGames, error: finalGamesError } = await supabase
        .from('games')
        .select('id, league, home_score, away_score, home_spread, over_under_line')
        .in('id', openGameIds)
        .eq('game_status', 'final')
        .not('home_score', 'is', null)
        .not('away_score', 'is', null)
      if (finalGamesError) console.error('Sweep: final games query failed:', finalGamesError)

      const gameById = new Map<string, any>(
        (finalGames ?? [])
          .filter((g: any) => g.league !== 'PGA' && g.league !== 'UFC' && g.league !== 'BOXING')
          .map((g: any) => [g.id, g])
      )

      for (const pick of openPicks ?? []) {
        const g = gameById.get(pick.game_id)
        if (!g) continue // game not final yet (or graded elsewhere)
        const homeScore = parseInt(g.home_score)
        const awayScore = parseInt(g.away_score)
        if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) continue
        const { correct, overUnderCorrect, gradable } = gradePick(pick, homeScore, awayScore, toNum(g.home_spread), toNum(g.over_under_line))
        if (!gradable) {
          console.log(`  Sweep: pick ${pick.id} has no line to grade — left unresolved`)
          continue
        }
        const { error: pickError } = await supabase
          .from('picks')
          .update({ correct, over_under_correct: overUnderCorrect, resolved_at: now.toISOString() })
          .eq('id', pick.id)
        if (!pickError) {
          picksSwept++
          console.log(`  Sweep: pick ${pick.id} (${pick.bet_type}) correct=${correct}, o/u=${overUnderCorrect}`)
        }
      }
    }

    const summary = {
      success: true,
      gamesResolved,
      picksResolved,
      picksSwept,
      requestsRemaining: lastRequestsRemaining,
      message: `Resolved ${gamesResolved} games and ${picksResolved} picks across all sports; swept ${picksSwept} stale pick(s)`,
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
