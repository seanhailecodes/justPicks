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
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('ODDS_API_KEY') || '4004f66c4a3a2905f3152c00dceedc4d'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    let allGames: any[] = []
    let requestsUsed = 0
    let requestsRemaining = 0

    // Fetch odds for each soccer league
    for (const sport of SOCCER_SPORTS) {
      const url = `https://api.the-odds-api.com/v4/sports/${sport.key}/odds/?apiKey=${API_KEY}&regions=us&markets=spreads,totals&oddsFormat=american`
      
      console.log(`Fetching ${sport.name}: ${url}`)
      
      const response = await fetch(url)
      requestsUsed++

      // Get remaining requests from headers
      const remaining = response.headers.get('x-requests-remaining')
      if (remaining) {
        requestsRemaining = parseInt(remaining)
      }

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error for ${sport.name}:`, response.status, errorText)
        continue
      }

      const games = await response.json()
      console.log(`Found ${games.length} games for ${sport.name}`)

      // Add league info to each game
      games.forEach((game: any) => {
        allGames.push({
          ...game,
          subLeague: sport.name,
        })
      })
    }

    console.log(`Total games to upsert: ${allGames.length}`)

    // Transform and upsert to database
    const gamesToUpsert = allGames.map((game) => {
      const gameDate = new Date(game.commence_time)
      
      // Find spreads and totals from bookmakers
      let homeSpread = 0
      let awaySpread = 0
      let overUnderLine = 2.5
      let homeMoneyline = -110
      let awayMoneyline = -110

      // Get first available bookmaker's odds
      if (game.bookmakers && game.bookmakers.length > 0) {
        const bookmaker = game.bookmakers[0]
        
        for (const market of bookmaker.markets || []) {
          if (market.key === 'spreads') {
            const homeOutcome = market.outcomes.find((o: any) => o.name === game.home_team)
            const awayOutcome = market.outcomes.find((o: any) => o.name === game.away_team)
            if (homeOutcome) {
              homeSpread = homeOutcome.point || 0
              homeMoneyline = homeOutcome.price || -110
            }
            if (awayOutcome) {
              awaySpread = awayOutcome.point || 0
              awayMoneyline = awayOutcome.price || -110
            }
          }
          
          if (market.key === 'totals') {
            const overOutcome = market.outcomes.find((o: any) => o.name === 'Over')
            if (overOutcome) {
              overUnderLine = overOutcome.point || 2.5
            }
          }
        }
      }

      // Generate a unique ID
      const dateStr = gameDate.toISOString().split('T')[0]
      const homeCode = game.home_team.substring(0, 4).toLowerCase().replace(/\s/g, '')
      const awayCode = game.away_team.substring(0, 4).toLowerCase().replace(/\s/g, '')
      const gameId = `soccer_${dateStr}_${awayCode}_${homeCode}`

      return {
        id: gameId,
        league: 'SOCCER',
        sub_league: game.subLeague,
        home_team: game.home_team,
        away_team: game.away_team,
        home_team_code: game.home_team.substring(0, 3).toUpperCase(),
        away_team_code: game.away_team.substring(0, 3).toUpperCase(),
        game_date: gameDate.toISOString(),
        home_spread: homeSpread,
        away_spread: awaySpread,
        home_moneyline: homeMoneyline,
        away_moneyline: awayMoneyline,
        over_under_line: overUnderLine,
        season: 2024,
        week: getWeekNumber(gameDate),
        locked: gameDate < new Date(),
        external_id: game.id,
      }
    })

    if (gamesToUpsert.length > 0) {
      const { data, error } = await supabase
        .from('games')
        .upsert(gamesToUpsert, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })

      if (error) {
        console.error('Upsert error:', error)
        throw error
      }

      console.log(`Successfully upserted ${gamesToUpsert.length} soccer games`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        gamesCount: gamesToUpsert.length,
        requestsUsed,
        requestsRemaining,
        leagues: SOCCER_SPORTS.map(s => s.name),
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

// Helper to get week number of the year
function getWeekNumber(date: Date): number {
  const startOfYear = new Date(date.getFullYear(), 0, 1)
  const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000))
  return Math.ceil((days + startOfYear.getDay() + 1) / 7)
}