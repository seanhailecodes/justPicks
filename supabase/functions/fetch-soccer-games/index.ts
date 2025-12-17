import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// League IDs from API-Football
const LEAGUES = {
  CHAMPIONS_LEAGUE: 2,
  WORLD_CUP: 1,
  MLS: 253,
}

const LEAGUE_NAMES: Record<number, string> = {
  2: 'Champions League',
  1: 'World Cup',
  253: 'MLS',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const API_KEY = Deno.env.get('API_FOOTBALL_KEY') || '4004f66c4a3a2905f3152c00dceedc4d'
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
    const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Get today and next 14 days
    const today = new Date()
    const endDate = new Date(today)
    endDate.setDate(endDate.getDate() + 14)

    const formatDate = (d: Date) => d.toISOString().split('T')[0]

    let allGames: any[] = []
    let requestsUsed = 0

    // Fetch fixtures for each league
    for (const [leagueName, leagueId] of Object.entries(LEAGUES)) {
      const url = `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2024&from=${formatDate(today)}&to=${formatDate(endDate)}`
      
      console.log(`Fetching ${leagueName}: ${url}`)
      
      const response = await fetch(url, {
        headers: {
          'x-apisports-key': API_KEY,
        },
      })

      const data = await response.json()
      requestsUsed++

      if (data.errors && Object.keys(data.errors).length > 0) {
        console.error(`API Error for ${leagueName}:`, data.errors)
        continue
      }

      const fixtures = data.response || []
      console.log(`Found ${fixtures.length} fixtures for ${leagueName}`)

      // Now fetch odds for these fixtures
      for (const fixture of fixtures) {
        const fixtureId = fixture.fixture.id
        
        // Fetch odds for this fixture
        const oddsUrl = `https://v3.football.api-sports.io/odds?fixture=${fixtureId}`
        const oddsResponse = await fetch(oddsUrl, {
          headers: {
            'x-apisports-key': API_KEY,
          },
        })
        const oddsData = await oddsResponse.json()
        requestsUsed++

        let asianHandicap = { home: 0, away: 0, line: 0 }
        let overUnder = { line: 2.5, over: -110, under: -110 }

        // Parse odds if available
        if (oddsData.response && oddsData.response.length > 0) {
          const bookmakers = oddsData.response[0]?.bookmakers || []
          
          for (const bookmaker of bookmakers) {
            for (const bet of bookmaker.bets || []) {
              // Asian Handicap
              if (bet.name === 'Asian Handicap' && bet.values?.length > 0) {
                const homeVal = bet.values.find((v: any) => v.value?.includes('Home'))
                const awayVal = bet.values.find((v: any) => v.value?.includes('Away'))
                if (homeVal && awayVal) {
                  // Parse handicap value like "Home -0.5"
                  const homeMatch = homeVal.value.match(/([-+]?\d+\.?\d*)/)
                  if (homeMatch) {
                    asianHandicap.line = parseFloat(homeMatch[1])
                    asianHandicap.home = parseFloat(homeVal.odd) || -110
                    asianHandicap.away = parseFloat(awayVal.odd) || -110
                  }
                }
                break
              }
              
              // Over/Under (Goals)
              if (bet.name === 'Goals Over/Under' && bet.values?.length > 0) {
                const overVal = bet.values.find((v: any) => v.value?.startsWith('Over'))
                const underVal = bet.values.find((v: any) => v.value?.startsWith('Under'))
                if (overVal && underVal) {
                  // Parse like "Over 2.5"
                  const lineMatch = overVal.value.match(/(\d+\.?\d*)/)
                  if (lineMatch) {
                    overUnder.line = parseFloat(lineMatch[1])
                    overUnder.over = parseFloat(overVal.odd) || -110
                    overUnder.under = parseFloat(underVal.odd) || -110
                  }
                }
                break
              }
            }
          }
        }

        allGames.push({
          fixture,
          leagueId,
          asianHandicap,
          overUnder,
        })
      }

      // Respect rate limits - small delay between leagues
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    console.log(`Total games to upsert: ${allGames.length}`)

    // Transform and upsert to database
    const gamesToUpsert = allGames.map(({ fixture, leagueId, asianHandicap, overUnder }) => {
      const gameDate = new Date(fixture.fixture.date)
      const homeTeam = fixture.teams.home
      const awayTeam = fixture.teams.away

      // Generate a unique ID
      const gameId = `soccer_${leagueId}_${fixture.fixture.id}`

      return {
        id: gameId,
        league: 'SOCCER',
        sub_league: LEAGUE_NAMES[leagueId] || 'Soccer',
        home_team: homeTeam.name,
        away_team: awayTeam.name,
        home_team_code: homeTeam.name.substring(0, 3).toUpperCase(),
        away_team_code: awayTeam.name.substring(0, 3).toUpperCase(),
        home_team_logo: homeTeam.logo,
        away_team_logo: awayTeam.logo,
        game_date: gameDate.toISOString(),
        home_spread: asianHandicap.line,
        away_spread: -asianHandicap.line,
        home_moneyline: asianHandicap.home,
        away_moneyline: asianHandicap.away,
        over_under_line: overUnder.line,
        season: 2024,
        week: getWeekNumber(gameDate),
        locked: gameDate < new Date(),
        external_id: fixture.fixture.id.toString(),
        venue: fixture.fixture.venue?.name || null,
        status: fixture.fixture.status?.short || 'NS',
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

    // Get remaining requests from API response headers
    const requestsRemaining = 100 - requestsUsed // Approximate for free tier

    return new Response(
      JSON.stringify({
        success: true,
        gamesCount: gamesToUpsert.length,
        requestsUsed,
        requestsRemaining,
        leagues: Object.keys(LEAGUES),
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