import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NFL team mappings
const NFL_TEAMS: Record<string, { code: string; logo: string }> = {
  'Arizona Cardinals': { code: 'ARI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ari.png' },
  'Atlanta Falcons': { code: 'ATL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/atl.png' },
  'Baltimore Ravens': { code: 'BAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/bal.png' },
  'Buffalo Bills': { code: 'BUF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/buf.png' },
  'Carolina Panthers': { code: 'CAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/car.png' },
  'Chicago Bears': { code: 'CHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/chi.png' },
  'Cincinnati Bengals': { code: 'CIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cin.png' },
  'Cleveland Browns': { code: 'CLE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/cle.png' },
  'Dallas Cowboys': { code: 'DAL', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/dal.png' },
  'Denver Broncos': { code: 'DEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/den.png' },
  'Detroit Lions': { code: 'DET', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/det.png' },
  'Green Bay Packers': { code: 'GB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/gb.png' },
  'Houston Texans': { code: 'HOU', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/hou.png' },
  'Indianapolis Colts': { code: 'IND', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ind.png' },
  'Jacksonville Jaguars': { code: 'JAX', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/jax.png' },
  'Kansas City Chiefs': { code: 'KC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/kc.png' },
  'Las Vegas Raiders': { code: 'LV', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lv.png' },
  'Los Angeles Chargers': { code: 'LAC', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lac.png' },
  'Los Angeles Rams': { code: 'LAR', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/lar.png' },
  'Miami Dolphins': { code: 'MIA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/mia.png' },
  'Minnesota Vikings': { code: 'MIN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/min.png' },
  'New England Patriots': { code: 'NE', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ne.png' },
  'New Orleans Saints': { code: 'NO', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/no.png' },
  'New York Giants': { code: 'NYG', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyg.png' },
  'New York Jets': { code: 'NYJ', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/nyj.png' },
  'Philadelphia Eagles': { code: 'PHI', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/phi.png' },
  'Pittsburgh Steelers': { code: 'PIT', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/pit.png' },
  'San Francisco 49ers': { code: 'SF', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sf.png' },
  'Seattle Seahawks': { code: 'SEA', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/sea.png' },
  'Tampa Bay Buccaneers': { code: 'TB', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/tb.png' },
  'Tennessee Titans': { code: 'TEN', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/ten.png' },
  'Washington Commanders': { code: 'WAS', logo: 'https://a.espncdn.com/i/teamlogos/nfl/500/wsh.png' },
}

// Calculate NFL week from date
// 2025 NFL Season: Week 1 starts Sept 4, 2025
function getNFLWeek(gameDate: Date): number {
  const seasonStart = new Date('2025-09-02T00:00:00Z') // Tuesday before Week 1
  const diffMs = gameDate.getTime() - seasonStart.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const week = Math.floor(diffDays / 7) + 1
  return Math.max(1, Math.min(18, week)) // Clamp to 1-18
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY')
    if (!ODDS_API_KEY) {
      throw new Error('ODDS_API_KEY not set')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch NFL odds from The Odds API
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_nfl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`
    
    const response = await fetch(oddsUrl)
    const data = await response.json()
    
    const requestsRemaining = response.headers.get('x-requests-remaining')
    console.log(`Odds API requests remaining: ${requestsRemaining}`)

    if (!Array.isArray(data)) {
      throw new Error('Invalid response from Odds API')
    }

    const games = []

    for (const event of data) {
      const homeTeamData = NFL_TEAMS[event.home_team]
      const awayTeamData = NFL_TEAMS[event.away_team]

      if (!homeTeamData || !awayTeamData) {
        console.log(`Unknown team: ${event.home_team} or ${event.away_team}`)
        continue
      }

      const gameDate = new Date(event.commence_time)
      const week = getNFLWeek(gameDate)
      const dateStr = gameDate.toISOString().split('T')[0]

      // Find best odds (prefer DraftKings, then FanDuel)
      let spreads = null
      let totals = null
      let moneylines = null

      for (const bookmaker of event.bookmakers || []) {
        if (bookmaker.key === 'draftkings' || bookmaker.key === 'fanduel') {
          for (const market of bookmaker.markets || []) {
            if (market.key === 'spreads' && !spreads) {
              spreads = market.outcomes
            }
            if (market.key === 'totals' && !totals) {
              totals = market.outcomes
            }
            if (market.key === 'h2h' && !moneylines) {
              moneylines = market.outcomes
            }
          }
          if (spreads && totals && moneylines) break
        }
      }

      // Fallback to first available bookmaker
      if (!spreads || !totals) {
        for (const bookmaker of event.bookmakers || []) {
          for (const market of bookmaker.markets || []) {
            if (market.key === 'spreads' && !spreads) {
              spreads = market.outcomes
            }
            if (market.key === 'totals' && !totals) {
              totals = market.outcomes
            }
            if (market.key === 'h2h' && !moneylines) {
              moneylines = market.outcomes
            }
          }
          if (spreads && totals) break
        }
      }

      if (!spreads || !totals) {
        console.log(`No odds for ${event.away_team} @ ${event.home_team}`)
        continue
      }

      const homeSpread = spreads.find((o: any) => o.name === event.home_team)
      const awaySpread = spreads.find((o: any) => o.name === event.away_team)
      const overUnder = totals.find((o: any) => o.name === 'Over')
      const homeML = moneylines?.find((o: any) => o.name === event.home_team)
      const awayML = moneylines?.find((o: any) => o.name === event.away_team)

      const gameId = `nfl_${dateStr}_${awayTeamData.code.toLowerCase()}_${homeTeamData.code.toLowerCase()}`

      games.push({
        id: gameId,
        external_id: event.id,
        league: 'NFL',
        season: 2025,
        week: week,
        home_team: event.home_team,
        away_team: event.away_team,
        home_team_code: homeTeamData.code,
        away_team_code: awayTeamData.code,
        home_team_logo: homeTeamData.logo,
        away_team_logo: awayTeamData.logo,
        game_date: event.commence_time,
        home_spread: homeSpread?.point?.toString() || '0',
        away_spread: awaySpread?.point?.toString() || '0',
        over_under_line: overUnder?.point || null,
        home_moneyline: homeML?.price || null,
        away_moneyline: awayML?.price || null,
        locked: false,
      })
    }

    // Upsert games to database
    if (games.length > 0) {
      const { error } = await supabase
        .from('games')
        .upsert(games, { onConflict: 'id' })

      if (error) {
        console.error('Upsert error:', error)
        throw error
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        gamesCount: games.length,
        requestsRemaining: requestsRemaining
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})