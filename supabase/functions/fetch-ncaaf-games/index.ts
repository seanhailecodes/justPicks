import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { etDateString, mergeDuplicateGames, filterLockedGames, isSaneSpread, seasonForDate, pruneDelistedGames } from '../_shared/games.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// FBS programs with ESPN logos. ESPN's team ids are per school, so the
// ids below are the same ones fetch-ncaab-games uses for the schools that
// appear in both lists. Names are spelled the way The Odds API sends them
// (a few schools come through with more than one spelling).
// Logo URL pattern: https://a.espncdn.com/i/teamlogos/ncaa/500/{id}.png
const NCAAF_TEAMS: Record<string, { code: string; espnId: number }> = {
  // SEC
  'Alabama Crimson Tide': { code: 'BAMA', espnId: 333 },
  'Arkansas Razorbacks': { code: 'ARK', espnId: 8 },
  'Auburn Tigers': { code: 'AUB', espnId: 2 },
  'Florida Gators': { code: 'FLA', espnId: 57 },
  'Georgia Bulldogs': { code: 'UGA', espnId: 61 },
  'Kentucky Wildcats': { code: 'UK', espnId: 96 },
  'LSU Tigers': { code: 'LSU', espnId: 99 },
  'Mississippi State Bulldogs': { code: 'MSST', espnId: 344 },
  'Mississippi St Bulldogs': { code: 'MSST', espnId: 344 },
  'Missouri Tigers': { code: 'MIZ', espnId: 142 },
  'Oklahoma Sooners': { code: 'OU', espnId: 201 },
  'Ole Miss Rebels': { code: 'MISS', espnId: 145 },
  'Mississippi Rebels': { code: 'MISS', espnId: 145 },
  'South Carolina Gamecocks': { code: 'SCAR', espnId: 2579 },
  'Tennessee Volunteers': { code: 'TENN', espnId: 2633 },
  'Texas Longhorns': { code: 'TEX', espnId: 251 },
  'Texas A&M Aggies': { code: 'TAMU', espnId: 245 },
  'Vanderbilt Commodores': { code: 'VAN', espnId: 238 },

  // Big Ten
  'Illinois Fighting Illini': { code: 'ILL', espnId: 356 },
  'Indiana Hoosiers': { code: 'IND', espnId: 84 },
  'Iowa Hawkeyes': { code: 'IOWA', espnId: 2294 },
  'Maryland Terrapins': { code: 'MD', espnId: 120 },
  'Michigan Wolverines': { code: 'MICH', espnId: 130 },
  'Michigan State Spartans': { code: 'MSU', espnId: 127 },
  'Michigan St Spartans': { code: 'MSU', espnId: 127 },
  'Minnesota Golden Gophers': { code: 'MINN', espnId: 135 },
  'Nebraska Cornhuskers': { code: 'NEB', espnId: 158 },
  'Northwestern Wildcats': { code: 'NW', espnId: 77 },
  'Ohio State Buckeyes': { code: 'OSU', espnId: 194 },
  'Ohio St Buckeyes': { code: 'OSU', espnId: 194 },
  'Oregon Ducks': { code: 'ORE', espnId: 2483 },
  'Penn State Nittany Lions': { code: 'PSU', espnId: 213 },
  'Penn St Nittany Lions': { code: 'PSU', espnId: 213 },
  'Purdue Boilermakers': { code: 'PUR', espnId: 2509 },
  'Rutgers Scarlet Knights': { code: 'RUT', espnId: 164 },
  'UCLA Bruins': { code: 'UCLA', espnId: 26 },
  'USC Trojans': { code: 'USC', espnId: 30 },
  'Washington Huskies': { code: 'WASH', espnId: 264 },
  'Wisconsin Badgers': { code: 'WIS', espnId: 275 },

  // Big 12
  'Arizona Wildcats': { code: 'ARIZ', espnId: 12 },
  'Arizona State Sun Devils': { code: 'ASU', espnId: 9 },
  'Arizona St Sun Devils': { code: 'ASU', espnId: 9 },
  'Baylor Bears': { code: 'BAY', espnId: 239 },
  'BYU Cougars': { code: 'BYU', espnId: 252 },
  'Cincinnati Bearcats': { code: 'CIN', espnId: 2132 },
  'Colorado Buffaloes': { code: 'COL', espnId: 38 },
  'Houston Cougars': { code: 'HOU', espnId: 248 },
  'Iowa State Cyclones': { code: 'ISU', espnId: 66 },
  'Iowa St Cyclones': { code: 'ISU', espnId: 66 },
  'Kansas Jayhawks': { code: 'KU', espnId: 2305 },
  'Kansas State Wildcats': { code: 'KSU', espnId: 2306 },
  'Kansas St Wildcats': { code: 'KSU', espnId: 2306 },
  'Oklahoma State Cowboys': { code: 'OKST', espnId: 197 },
  'Oklahoma St Cowboys': { code: 'OKST', espnId: 197 },
  'TCU Horned Frogs': { code: 'TCU', espnId: 2628 },
  'Texas Tech Red Raiders': { code: 'TTU', espnId: 2641 },
  'UCF Knights': { code: 'UCF', espnId: 2116 },
  'Utah Utes': { code: 'UTAH', espnId: 254 },
  'West Virginia Mountaineers': { code: 'WVU', espnId: 277 },

  // ACC
  'Boston College Eagles': { code: 'BC', espnId: 103 },
  'California Golden Bears': { code: 'CAL', espnId: 25 },
  'Clemson Tigers': { code: 'CLEM', espnId: 228 },
  'Duke Blue Devils': { code: 'DUKE', espnId: 150 },
  'Florida State Seminoles': { code: 'FSU', espnId: 52 },
  'Florida St Seminoles': { code: 'FSU', espnId: 52 },
  'Georgia Tech Yellow Jackets': { code: 'GT', espnId: 59 },
  'Louisville Cardinals': { code: 'LOU', espnId: 97 },
  'Miami Hurricanes': { code: 'MIA', espnId: 2390 },
  'NC State Wolfpack': { code: 'NCST', espnId: 152 },
  'North Carolina State Wolfpack': { code: 'NCST', espnId: 152 },
  'North Carolina Tar Heels': { code: 'UNC', espnId: 153 },
  'Pittsburgh Panthers': { code: 'PITT', espnId: 221 },
  'SMU Mustangs': { code: 'SMU', espnId: 2567 },
  'Stanford Cardinal': { code: 'STAN', espnId: 24 },
  'Syracuse Orange': { code: 'SYR', espnId: 183 },
  'Virginia Cavaliers': { code: 'UVA', espnId: 258 },
  'Virginia Tech Hokies': { code: 'VT', espnId: 259 },
  'Wake Forest Demon Deacons': { code: 'WAKE', espnId: 154 },

  // Independents
  'Notre Dame Fighting Irish': { code: 'ND', espnId: 87 },
  'UConn Huskies': { code: 'UCONN', espnId: 41 },
  'Connecticut Huskies': { code: 'UCONN', espnId: 41 },

  // Pac-12
  'Oregon State Beavers': { code: 'ORST', espnId: 204 },
  'Oregon St Beavers': { code: 'ORST', espnId: 204 },
  'Washington State Cougars': { code: 'WSU', espnId: 265 },
  'Washington St Cougars': { code: 'WSU', espnId: 265 },

  // Mountain West
  'Boise State Broncos': { code: 'BSU', espnId: 68 },
  'Boise St Broncos': { code: 'BSU', espnId: 68 },
  'Colorado State Rams': { code: 'CSU', espnId: 36 },
  'Colorado St Rams': { code: 'CSU', espnId: 36 },
  'Fresno State Bulldogs': { code: 'FRES', espnId: 278 },
  'Fresno St Bulldogs': { code: 'FRES', espnId: 278 },
  'Nevada Wolf Pack': { code: 'NEV', espnId: 2440 },
  'New Mexico Lobos': { code: 'UNM', espnId: 167 },
  'San Diego State Aztecs': { code: 'SDSU', espnId: 21 },
  'San Diego St Aztecs': { code: 'SDSU', espnId: 21 },
  'San Jose State Spartans': { code: 'SJSU', espnId: 23 },
  'San José State Spartans': { code: 'SJSU', espnId: 23 },
  'San Jose St Spartans': { code: 'SJSU', espnId: 23 },
  'UNLV Rebels': { code: 'UNLV', espnId: 2439 },
  'Utah State Aggies': { code: 'USU', espnId: 328 },
  'Utah St Aggies': { code: 'USU', espnId: 328 },
  'Air Force Falcons': { code: 'AF', espnId: 2005 },
  'Wyoming Cowboys': { code: 'WYO', espnId: 2751 },
  'Hawaii Rainbow Warriors': { code: 'HAW', espnId: 62 },

  // American
  'Army Black Knights': { code: 'ARMY', espnId: 349 },
  'Navy Midshipmen': { code: 'NAVY', espnId: 2426 },
  'Memphis Tigers': { code: 'MEM', espnId: 235 },
  'Tulane Green Wave': { code: 'TULN', espnId: 2655 },
  'Tulsa Golden Hurricane': { code: 'TLSA', espnId: 202 },
  'South Florida Bulls': { code: 'USF', espnId: 58 },
  'Temple Owls': { code: 'TEM', espnId: 218 },
  'East Carolina Pirates': { code: 'ECU', espnId: 151 },
  'UAB Blazers': { code: 'UAB', espnId: 5 },
  'North Texas Mean Green': { code: 'UNT', espnId: 249 },
  'UTSA Roadrunners': { code: 'UTSA', espnId: 2636 },
  'Rice Owls': { code: 'RICE', espnId: 242 },
  'Charlotte 49ers': { code: 'CLT', espnId: 2429 },
  'Florida Atlantic Owls': { code: 'FAU', espnId: 2226 },

  // Sun Belt
  'Appalachian State Mountaineers': { code: 'APP', espnId: 2026 },
  'Appalachian St Mountaineers': { code: 'APP', espnId: 2026 },
  'Coastal Carolina Chanticleers': { code: 'CCU', espnId: 324 },
  'Georgia Southern Eagles': { code: 'GASO', espnId: 290 },
  'Georgia State Panthers': { code: 'GAST', espnId: 2247 },
  'James Madison Dukes': { code: 'JMU', espnId: 256 },
  'Marshall Thundering Herd': { code: 'MRSH', espnId: 276 },
  'Old Dominion Monarchs': { code: 'ODU', espnId: 295 },
  'South Alabama Jaguars': { code: 'USA', espnId: 6 },
  'Southern Mississippi Golden Eagles': { code: 'USM', espnId: 2572 },
  'Southern Miss Golden Eagles': { code: 'USM', espnId: 2572 },
  'Texas State Bobcats': { code: 'TXST', espnId: 326 },
  'Troy Trojans': { code: 'TROY', espnId: 2653 },
  'Arkansas State Red Wolves': { code: 'ARST', espnId: 2032 },
  "Louisiana Ragin' Cajuns": { code: 'ULL', espnId: 309 },
  'Louisiana Ragin Cajuns': { code: 'ULL', espnId: 309 },
  'UL Monroe Warhawks': { code: 'ULM', espnId: 2433 },
  'Louisiana Monroe Warhawks': { code: 'ULM', espnId: 2433 },

  // MAC
  'Akron Zips': { code: 'AKR', espnId: 2006 },
  'Ball State Cardinals': { code: 'BALL', espnId: 2050 },
  'Bowling Green Falcons': { code: 'BGSU', espnId: 189 },
  'Buffalo Bulls': { code: 'BUFF', espnId: 2084 },
  'Central Michigan Chippewas': { code: 'CMU', espnId: 2117 },
  'Eastern Michigan Eagles': { code: 'EMU', espnId: 2199 },
  'Kent State Golden Flashes': { code: 'KENT', espnId: 2309 },
  'Miami (OH) RedHawks': { code: 'M-OH', espnId: 193 },
  'Northern Illinois Huskies': { code: 'NIU', espnId: 2459 },
  'Ohio Bobcats': { code: 'OHIO', espnId: 195 },
  'Toledo Rockets': { code: 'TOL', espnId: 2649 },
  'Western Michigan Broncos': { code: 'WMU', espnId: 2711 },
  'UMass Minutemen': { code: 'MASS', espnId: 113 },
  'Massachusetts Minutemen': { code: 'MASS', espnId: 113 },

  // Conference USA
  'Liberty Flames': { code: 'LIB', espnId: 2335 },
  'Western Kentucky Hilltoppers': { code: 'WKU', espnId: 98 },
  'Middle Tennessee Blue Raiders': { code: 'MTSU', espnId: 2393 },
  'Louisiana Tech Bulldogs': { code: 'LT', espnId: 2348 },
  'UTEP Miners': { code: 'UTEP', espnId: 2638 },
  'Jacksonville State Gamecocks': { code: 'JVST', espnId: 55 },
  'Sam Houston State Bearkats': { code: 'SHSU', espnId: 2534 },
  'Sam Houston Bearkats': { code: 'SHSU', espnId: 2534 },
  'Kennesaw State Owls': { code: 'KENN', espnId: 338 },
  'New Mexico State Aggies': { code: 'NMSU', espnId: 166 },
  'New Mexico St Aggies': { code: 'NMSU', espnId: 166 },
  'Florida International Panthers': { code: 'FIU', espnId: 2229 },
  'FIU Panthers': { code: 'FIU', espnId: 2229 },
  'Delaware Blue Hens': { code: 'DEL', espnId: 48 },
  'Missouri State Bears': { code: 'MOST', espnId: 2623 },
}

function getTeamInfo(teamName: string): { code: string; logo: string | null } {
  const team = NCAAF_TEAMS[teamName]

  if (team) {
    return {
      code: team.code,
      logo: `https://a.espncdn.com/i/teamlogos/ncaa/500/${team.espnId}.png`
    }
  }

  // Unknown (FCS opponents, new spellings): code from the name, no logo.
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

    // Fetch NCAAF odds from The Odds API. One request covers the whole FBS
    // slate the books have posted (roughly the coming week).
    const oddsUrl = `https://api.the-odds-api.com/v4/sports/americanfootball_ncaaf/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american`
    
    console.log('Fetching NCAAF games from The Odds API...')
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

    console.log(`Found ${data.length} NCAAF games`)

    const games = []

    for (const event of data) {
      const dateStr = etDateString(event.commence_time)

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
      // Reject absurd spread values (data-feed glitches / alt-line bleed).
      // College lines legitimately reach the 40s and 50s, so the NCAAF
      // ceiling in isSaneSpread is higher than the pro leagues'.
      if (!isSaneSpread(homeSpread?.point, 'NCAAF') || !isSaneSpread(awaySpread?.point, 'NCAAF')) {
        console.warn(`[NCAAF] Rejected absurd spread for ${event.away_team} @ ${event.home_team}: home=${homeSpread?.point}, away=${awaySpread?.point}`)
        continue
      }

      const gameId = `ncaaf_${dateStr}_${awayInfo.code.toLowerCase()}_${homeInfo.code.toLowerCase()}`

      games.push({
        id: gameId,
        external_id: event.id,
        league: 'NCAAF',
        // Aug–Jan season, named for the year it starts (same July-1 rule
        // as the NFL) — matches seasonForLeague() in the app.
        season: seasonForDate(new Date(event.commence_time), 'cross-year'),
        // Date-grouped in the app like NCAAB; college "weeks" (Week 0,
        // bye-heavy Saturdays) don't map cleanly onto the NFL week strip.
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
      const upsertable = await filterLockedGames(supabase, 'NCAAF', games)
      const { error } = await supabase
        .from('games')
        .upsert(upsertable, { onConflict: 'id' })

      if (error) {
        console.error('Upsert error:', error)
        throw error
      }

      await mergeDuplicateGames(supabase, 'NCAAF', games)
    }

    // Remove games the book de-listed since the last fetch.
    await pruneDelistedGames(
      supabase, 'NCAAF',
      data.map((e: any) => e.id),
      data.length ? new Date(Math.max(...data.map((e: any) => +new Date(e.commence_time)))).toISOString() : null,
    )

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