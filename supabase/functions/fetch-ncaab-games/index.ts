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
    const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY')
    if (!ODDS_API_KEY) {
      throw new Error('ODDS_API_KEY not set')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch NCAAB odds from The Odds API
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/basketball_ncaab/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`
    
    console.log('Fetching NCAAB games from The Odds API...')
    const response = await fetch(oddsUrl)
    const data = await response.json()
    
    const requestsRemaining = response.headers.get('x-requests-remaining')
    console.log(`Odds API requests remaining: ${requestsRemaining}`)

    if (!Array.isArray(data)) {
      console.log('No games returned or error:', data)
      return new Response(
        JSON.stringify({ success: true, gamesCount: 0, requestsRemaining }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Found ${data.length} NCAAB games`)

    const games = []

    for (const event of data) {
      const gameDate = new Date(event.commence_time)
      const dateStr = gameDate.toISOString().split('T')[0]

      // Create short codes from team names (first 3-4 letters or abbreviation)
      const homeCode = getTeamCode(event.home_team)
      const awayCode = getTeamCode(event.away_team)

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

      if (!spreads) {
        console.log(`No spreads for ${event.away_team} @ ${event.home_team}`)
        continue
      }

      const homeSpread = spreads.find((o: any) => o.name === event.home_team)
      const awaySpread = spreads.find((o: any) => o.name === event.away_team)
      const overUnder = totals?.find((o: any) => o.name === 'Over')
      const homeML = moneylines?.find((o: any) => o.name === event.home_team)
      const awayML = moneylines?.find((o: any) => o.name === event.away_team)

      const gameId = `ncaab_${dateStr}_${awayCode.toLowerCase()}_${homeCode.toLowerCase()}`

      games.push({
        id: gameId,
        external_id: event.id,
        league: 'NCAAB',
        season: 2025,
        week: null, // NCAAB doesn't use weeks
        home_team: event.home_team,
        away_team: event.away_team,
        home_team_code: homeCode,
        away_team_code: awayCode,
        home_team_logo: null, // Too many teams for logos
        away_team_logo: null,
        game_date: event.commence_time,
        home_spread: homeSpread?.point?.toString() || '0',
        away_spread: awaySpread?.point?.toString() || '0',
        over_under_line: overUnder?.point || null,
        home_moneyline: homeML?.price || null,
        away_moneyline: awayML?.price || null,
        game_status: 'pending',
        locked: false,
      })
    }

    console.log(`Prepared ${games.length} games for upsert`)

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
        requestsRemaining,
        games: games.slice(0, 5).map(g => ({
          id: g.id,
          matchup: `${g.away_team} @ ${g.home_team}`,
          spread: g.home_spread,
          total: g.over_under_line
        }))
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

// Helper to create team codes from full names
function getTeamCode(teamName: string): string {
  // Common abbreviations
  const abbreviations: Record<string, string> = {
    'Duke Blue Devils': 'DUKE',
    'North Carolina Tar Heels': 'UNC',
    'Kentucky Wildcats': 'UK',
    'Kansas Jayhawks': 'KU',
    'UCLA Bruins': 'UCLA',
    'Gonzaga Bulldogs': 'GONZ',
    'Villanova Wildcats': 'NOVA',
    'Michigan State Spartans': 'MSU',
    'Michigan Wolverines': 'MICH',
    'Ohio State Buckeyes': 'OSU',
    'Texas Longhorns': 'TEX',
    'Arizona Wildcats': 'ARIZ',
    'Connecticut Huskies': 'UCONN',
    'Louisville Cardinals': 'LOU',
    'Indiana Hoosiers': 'IND',
    'Purdue Boilermakers': 'PUR',
    'Illinois Fighting Illini': 'ILL',
    'Wisconsin Badgers': 'WIS',
    'Iowa Hawkeyes': 'IOWA',
    'Auburn Tigers': 'AUB',
    'Alabama Crimson Tide': 'BAMA',
    'Tennessee Volunteers': 'TENN',
    'Florida Gators': 'FLA',
    'Arkansas Razorbacks': 'ARK',
    'Baylor Bears': 'BAY',
    'Houston Cougars': 'HOU',
    'Creighton Bluejays': 'CREI',
    'Marquette Golden Eagles': 'MARQ',
    'San Diego State Aztecs': 'SDSU',
    'Florida Atlantic Owls': 'FAU',
    'Miami Hurricanes': 'MIA',
    'Texas Tech Red Raiders': 'TTU',
    'Oregon Ducks': 'ORE',
    'Stanford Cardinal': 'STAN',
    'USC Trojans': 'USC',
    'Syracuse Orange': 'SYR',
    'Georgetown Hoyas': 'GTWN',
    'Virginia Cavaliers': 'UVA',
    'North Carolina State Wolfpack': 'NCST',
    'Wake Forest Demon Deacons': 'WAKE',
    'Clemson Tigers': 'CLEM',
    'Georgia Bulldogs': 'UGA',
    'LSU Tigers': 'LSU',
    'Ole Miss Rebels': 'MISS',
    'Mississippi State Bulldogs': 'MSST',
    'Missouri Tigers': 'MIZ',
    'Oklahoma Sooners': 'OU',
    'Oklahoma State Cowboys': 'OKST',
    'Kansas State Wildcats': 'KSU',
    'TCU Horned Frogs': 'TCU',
    'West Virginia Mountaineers': 'WVU',
    'Iowa State Cyclones': 'ISU',
    'Cincinnati Bearcats': 'CIN',
    'Memphis Tigers': 'MEM',
    'Xavier Musketeers': 'XAV',
    'Seton Hall Pirates': 'HALL',
    'Providence Friars': 'PROV',
    'Butler Bulldogs': 'BUT',
    'St. Johns Red Storm': 'STJ',
    'DePaul Blue Demons': 'DEP',
    'Colorado Buffaloes': 'COL',
    'Utah Utes': 'UTAH',
    'Arizona State Sun Devils': 'ASU',
    'Washington Huskies': 'WASH',
    'Northwestern Wildcats': 'NW',
    'Minnesota Golden Gophers': 'MINN',
    'Nebraska Cornhuskers': 'NEB',
    'Penn State Nittany Lions': 'PSU',
    'Maryland Terrapins': 'MD',
    'Rutgers Scarlet Knights': 'RUT',
  }

  if (abbreviations[teamName]) {
    return abbreviations[teamName]
  }

  // For unknown teams, take first word (usually school name) and limit to 4 chars
  const firstWord = teamName.split(' ')[0]
  return firstWord.substring(0, 4).toUpperCase()
}