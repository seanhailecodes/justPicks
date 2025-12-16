import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Major college basketball programs with ESPN logos
// ESPN URL pattern: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
const NCAAB_TEAMS: Record<string, { code: string; espnId: number }> = {
  // ACC
  'Duke Blue Devils': { code: 'DUKE', espnId: 150 },
  'North Carolina Tar Heels': { code: 'UNC', espnId: 153 },
  'Virginia Cavaliers': { code: 'UVA', espnId: 258 },
  'Miami Hurricanes': { code: 'MIA', espnId: 2390 },
  'Florida State Seminoles': { code: 'FSU', espnId: 52 },
  'Florida St Seminoles': { code: 'FSU', espnId: 52 },
  'Louisville Cardinals': { code: 'LOU', espnId: 97 },
  'Syracuse Orange': { code: 'SYR', espnId: 183 },
  'Notre Dame Fighting Irish': { code: 'ND', espnId: 87 },
  'Clemson Tigers': { code: 'CLEM', espnId: 228 },
  'Wake Forest Demon Deacons': { code: 'WAKE', espnId: 154 },
  'NC State Wolfpack': { code: 'NCST', espnId: 152 },
  'North Carolina State Wolfpack': { code: 'NCST', espnId: 152 },
  'North Carolina St Wolfpack': { code: 'NCST', espnId: 152 },
  'Virginia Tech Hokies': { code: 'VT', espnId: 259 },
  'Boston College Eagles': { code: 'BC', espnId: 103 },
  'Pittsburgh Panthers': { code: 'PITT', espnId: 221 },
  'Georgia Tech Yellow Jackets': { code: 'GT', espnId: 59 },
  'SMU Mustangs': { code: 'SMU', espnId: 2567 },
  'California Golden Bears': { code: 'CAL', espnId: 25 },
  'Stanford Cardinal': { code: 'STAN', espnId: 24 },
  
  // Big Ten
  'Michigan State Spartans': { code: 'MSU', espnId: 127 },
  'Michigan St Spartans': { code: 'MSU', espnId: 127 },
  'Michigan Wolverines': { code: 'MICH', espnId: 130 },
  'Purdue Boilermakers': { code: 'PUR', espnId: 2509 },
  'Illinois Fighting Illini': { code: 'ILL', espnId: 356 },
  'Indiana Hoosiers': { code: 'IND', espnId: 84 },
  'Ohio State Buckeyes': { code: 'OSU', espnId: 194 },
  'Ohio St Buckeyes': { code: 'OSU', espnId: 194 },
  'Wisconsin Badgers': { code: 'WIS', espnId: 275 },
  'Iowa Hawkeyes': { code: 'IOWA', espnId: 2294 },
  'Minnesota Golden Gophers': { code: 'MINN', espnId: 135 },
  'Maryland Terrapins': { code: 'MD', espnId: 120 },
  'Penn State Nittany Lions': { code: 'PSU', espnId: 213 },
  'Penn St Nittany Lions': { code: 'PSU', espnId: 213 },
  'Rutgers Scarlet Knights': { code: 'RUT', espnId: 164 },
  'Nebraska Cornhuskers': { code: 'NEB', espnId: 158 },
  'Northwestern Wildcats': { code: 'NW', espnId: 77 },
  'UCLA Bruins': { code: 'UCLA', espnId: 26 },
  'USC Trojans': { code: 'USC', espnId: 30 },
  'Oregon Ducks': { code: 'ORE', espnId: 2483 },
  'Oregon State Beavers': { code: 'ORST', espnId: 204 },
  'Oregon St Beavers': { code: 'ORST', espnId: 204 },
  'Washington Huskies': { code: 'WASH', espnId: 264 },
  'Washington State Cougars': { code: 'WSU', espnId: 265 },
  'Washington St Cougars': { code: 'WSU', espnId: 265 },
  
  // Big 12
  'Kansas Jayhawks': { code: 'KU', espnId: 2305 },
  'Baylor Bears': { code: 'BAY', espnId: 239 },
  'Texas Tech Red Raiders': { code: 'TTU', espnId: 2641 },
  'TCU Horned Frogs': { code: 'TCU', espnId: 2628 },
  'Oklahoma State Cowboys': { code: 'OKST', espnId: 197 },
  'Oklahoma St Cowboys': { code: 'OKST', espnId: 197 },
  'Kansas State Wildcats': { code: 'KSU', espnId: 2306 },
  'Kansas St Wildcats': { code: 'KSU', espnId: 2306 },
  'West Virginia Mountaineers': { code: 'WVU', espnId: 277 },
  'Iowa State Cyclones': { code: 'ISU', espnId: 66 },
  'Iowa St Cyclones': { code: 'ISU', espnId: 66 },
  'Cincinnati Bearcats': { code: 'CIN', espnId: 2132 },
  'Houston Cougars': { code: 'HOU', espnId: 248 },
  'UCF Knights': { code: 'UCF', espnId: 2116 },
  'BYU Cougars': { code: 'BYU', espnId: 252 },
  'Texas Longhorns': { code: 'TEX', espnId: 251 },
  'Arizona Wildcats': { code: 'ARIZ', espnId: 12 },
  'Arizona State Sun Devils': { code: 'ASU', espnId: 9 },
  'Arizona St Sun Devils': { code: 'ASU', espnId: 9 },
  'Colorado Buffaloes': { code: 'COL', espnId: 38 },
  'Utah Utes': { code: 'UTAH', espnId: 254 },
  'Utah State Aggies': { code: 'USU', espnId: 328 },
  'Utah St Aggies': { code: 'USU', espnId: 328 },
  
  // SEC
  'Kentucky Wildcats': { code: 'UK', espnId: 96 },
  'Tennessee Volunteers': { code: 'TENN', espnId: 2633 },
  'Auburn Tigers': { code: 'AUB', espnId: 2 },
  'Alabama Crimson Tide': { code: 'BAMA', espnId: 333 },
  'Arkansas Razorbacks': { code: 'ARK', espnId: 8 },
  'Florida Gators': { code: 'FLA', espnId: 57 },
  'LSU Tigers': { code: 'LSU', espnId: 99 },
  'Texas A&M Aggies': { code: 'TAMU', espnId: 245 },
  'Missouri Tigers': { code: 'MIZ', espnId: 142 },
  'Ole Miss Rebels': { code: 'MISS', espnId: 145 },
  'Mississippi Rebels': { code: 'MISS', espnId: 145 },
  'Mississippi State Bulldogs': { code: 'MSST', espnId: 344 },
  'Mississippi St Bulldogs': { code: 'MSST', espnId: 344 },
  'Georgia Bulldogs': { code: 'UGA', espnId: 61 },
  'South Carolina Gamecocks': { code: 'SCAR', espnId: 2579 },
  'Vanderbilt Commodores': { code: 'VAN', espnId: 238 },
  'Oklahoma Sooners': { code: 'OU', espnId: 201 },
  
  // Big East
  'UConn Huskies': { code: 'UCONN', espnId: 41 },
  'Connecticut Huskies': { code: 'UCONN', espnId: 41 },
  'Villanova Wildcats': { code: 'NOVA', espnId: 222 },
  'Creighton Bluejays': { code: 'CREI', espnId: 156 },
  'Marquette Golden Eagles': { code: 'MARQ', espnId: 269 },
  'Xavier Musketeers': { code: 'XAV', espnId: 2752 },
  'Providence Friars': { code: 'PROV', espnId: 2507 },
  'Seton Hall Pirates': { code: 'HALL', espnId: 2550 },
  'Butler Bulldogs': { code: 'BUT', espnId: 2086 },
  'St. Johns Red Storm': { code: 'STJ', espnId: 2599 },
  "St. John's Red Storm": { code: 'STJ', espnId: 2599 },
  "St John's Red Storm": { code: 'STJ', espnId: 2599 },
  'Georgetown Hoyas': { code: 'GTWN', espnId: 46 },
  'DePaul Blue Demons': { code: 'DEP', espnId: 305 },
  
  // Other Major Programs
  'Gonzaga Bulldogs': { code: 'GONZ', espnId: 2250 },
  'Memphis Tigers': { code: 'MEM', espnId: 235 },
  'San Diego State Aztecs': { code: 'SDSU', espnId: 21 },
  'San Diego St Aztecs': { code: 'SDSU', espnId: 21 },
  'Nevada Wolf Pack': { code: 'NEV', espnId: 2440 },
  'New Mexico Lobos': { code: 'UNM', espnId: 167 },
  'New Mexico State Aggies': { code: 'NMSU', espnId: 166 },
  'New Mexico St Aggies': { code: 'NMSU', espnId: 166 },
  'Saint Marys Gaels': { code: 'SMC', espnId: 2608 },
  "Saint Mary's Gaels": { code: 'SMC', espnId: 2608 },
  'VCU Rams': { code: 'VCU', espnId: 2670 },
  'Dayton Flyers': { code: 'DAY', espnId: 2168 },
  'Florida Atlantic Owls': { code: 'FAU', espnId: 2226 },
  'Wichita State Shockers': { code: 'WICH', espnId: 2724 },
  'Wichita St Shockers': { code: 'WICH', espnId: 2724 },
  'Boise State Broncos': { code: 'BSU', espnId: 68 },
  'Boise St Broncos': { code: 'BSU', espnId: 68 },
  'Colorado State Rams': { code: 'CSU', espnId: 36 },
  'Colorado St Rams': { code: 'CSU', espnId: 36 },
  'Fresno State Bulldogs': { code: 'FRES', espnId: 278 },
  'Fresno St Bulldogs': { code: 'FRES', espnId: 278 },
  'UNLV Rebels': { code: 'UNLV', espnId: 2439 },
  'San Jose State Spartans': { code: 'SJSU', espnId: 23 },
  'San Jose St Spartans': { code: 'SJSU', espnId: 23 },
  
  // Additional Mid-Majors
  'Murray State Racers': { code: 'MUR', espnId: 93 },
  'Murray St Racers': { code: 'MUR', espnId: 93 },
  'Belmont Bruins': { code: 'BEL', espnId: 2057 },
  'Drake Bulldogs': { code: 'DRKE', espnId: 2181 },
  'Loyola Chicago Ramblers': { code: 'LUC', espnId: 2350 },
  'Richmond Spiders': { code: 'RICH', espnId: 257 },
  'Saint Louis Billikens': { code: 'SLU', espnId: 139 },
  'George Mason Patriots': { code: 'GMU', espnId: 2244 },
  'Davidson Wildcats': { code: 'DAV', espnId: 2166 },
  'Chattanooga Mocs': { code: 'CHAT', espnId: 236 },
  'Furman Paladins': { code: 'FUR', espnId: 231 },
  'Kent State Golden Flashes': { code: 'KENT', espnId: 2309 },
  'Kent St Golden Flashes': { code: 'KENT', espnId: 2309 },
  'Akron Zips': { code: 'AKR', espnId: 2006 },
  'Ball State Cardinals': { code: 'BALL', espnId: 2050 },
  'Ball St Cardinals': { code: 'BALL', espnId: 2050 },
  'Bowling Green Falcons': { code: 'BGSU', espnId: 189 },
  'Buffalo Bulls': { code: 'BUFF', espnId: 2084 },
  'Central Michigan Chippewas': { code: 'CMU', espnId: 2117 },
  'Eastern Michigan Eagles': { code: 'EMU', espnId: 2199 },
  'Miami (OH) RedHawks': { code: 'M-OH', espnId: 193 },
  'Northern Illinois Huskies': { code: 'NIU', espnId: 2459 },
  'Ohio Bobcats': { code: 'OHIO', espnId: 195 },
  'Toledo Rockets': { code: 'TOL', espnId: 2649 },
  'Western Michigan Broncos': { code: 'WMU', espnId: 2711 },
}

function getTeamInfo(teamName: string): { code: string; logo: string | null } {
  const team = NCAAB_TEAMS[teamName]
  
  if (team) {
    return {
      code: team.code,
      logo: `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`
    }
  }
  
  // For unknown teams, create a code from the name
  const firstWord = teamName.split(' ')[0]
  return {
    code: firstWord.substring(0, 4).toUpperCase(),
    logo: null
  }
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

      const homeInfo = getTeamInfo(event.home_team)
      const awayInfo = getTeamInfo(event.away_team)

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

      const gameId = `ncaab_${dateStr}_${awayInfo.code.toLowerCase()}_${homeInfo.code.toLowerCase()}`

      games.push({
        id: gameId,
        external_id: event.id,
        league: 'NCAAB',
        season: 2025,
        week: null,
        home_team: event.home_team,
        away_team: event.away_team,
        home_team_code: homeInfo.code,
        away_team_code: awayInfo.code,
        home_team_logo: homeInfo.logo,
        away_team_logo: awayInfo.logo,
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
          total: g.over_under_line,
          hasLogos: !!(g.home_team_logo && g.away_team_logo)
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