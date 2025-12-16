import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NBA team mapping for logos (ESPN CDN)
const NBA_TEAMS: Record<string, { code: string; logo: string }> = {
  "Atlanta Hawks": { code: "ATL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/atl.png" },
  "Boston Celtics": { code: "BOS", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bos.png" },
  "Brooklyn Nets": { code: "BKN", logo: "https://a.espncdn.com/i/teamlogos/nba/500/bkn.png" },
  "Charlotte Hornets": { code: "CHA", logo: "https://a.espncdn.com/i/teamlogos/nba/500/cha.png" },
  "Chicago Bulls": { code: "CHI", logo: "https://a.espncdn.com/i/teamlogos/nba/500/chi.png" },
  "Cleveland Cavaliers": { code: "CLE", logo: "https://a.espncdn.com/i/teamlogos/nba/500/cle.png" },
  "Dallas Mavericks": { code: "DAL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/dal.png" },
  "Denver Nuggets": { code: "DEN", logo: "https://a.espncdn.com/i/teamlogos/nba/500/den.png" },
  "Detroit Pistons": { code: "DET", logo: "https://a.espncdn.com/i/teamlogos/nba/500/det.png" },
  "Golden State Warriors": { code: "GSW", logo: "https://a.espncdn.com/i/teamlogos/nba/500/gs.png" },
  "Houston Rockets": { code: "HOU", logo: "https://a.espncdn.com/i/teamlogos/nba/500/hou.png" },
  "Indiana Pacers": { code: "IND", logo: "https://a.espncdn.com/i/teamlogos/nba/500/ind.png" },
  "Los Angeles Clippers": { code: "LAC", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lac.png" },
  "Los Angeles Lakers": { code: "LAL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/lal.png" },
  "Memphis Grizzlies": { code: "MEM", logo: "https://a.espncdn.com/i/teamlogos/nba/500/mem.png" },
  "Miami Heat": { code: "MIA", logo: "https://a.espncdn.com/i/teamlogos/nba/500/mia.png" },
  "Milwaukee Bucks": { code: "MIL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/mil.png" },
  "Minnesota Timberwolves": { code: "MIN", logo: "https://a.espncdn.com/i/teamlogos/nba/500/min.png" },
  "New Orleans Pelicans": { code: "NOP", logo: "https://a.espncdn.com/i/teamlogos/nba/500/no.png" },
  "New York Knicks": { code: "NYK", logo: "https://a.espncdn.com/i/teamlogos/nba/500/ny.png" },
  "Oklahoma City Thunder": { code: "OKC", logo: "https://a.espncdn.com/i/teamlogos/nba/500/okc.png" },
  "Orlando Magic": { code: "ORL", logo: "https://a.espncdn.com/i/teamlogos/nba/500/orl.png" },
  "Philadelphia 76ers": { code: "PHI", logo: "https://a.espncdn.com/i/teamlogos/nba/500/phi.png" },
  "Phoenix Suns": { code: "PHX", logo: "https://a.espncdn.com/i/teamlogos/nba/500/phx.png" },
  "Portland Trail Blazers": { code: "POR", logo: "https://a.espncdn.com/i/teamlogos/nba/500/por.png" },
  "Sacramento Kings": { code: "SAC", logo: "https://a.espncdn.com/i/teamlogos/nba/500/sac.png" },
  "San Antonio Spurs": { code: "SAS", logo: "https://a.espncdn.com/i/teamlogos/nba/500/sa.png" },
  "Toronto Raptors": { code: "TOR", logo: "https://a.espncdn.com/i/teamlogos/nba/500/tor.png" },
  "Utah Jazz": { code: "UTA", logo: "https://a.espncdn.com/i/teamlogos/nba/500/utah.png" },
  "Washington Wizards": { code: "WAS", logo: "https://a.espncdn.com/i/teamlogos/nba/500/wsh.png" },
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const ODDS_API_KEY = Deno.env.get("ODDS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!ODDS_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch NBA odds from The Odds API
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_nba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american&bookmakers=draftkings,fanduel`
    );

    if (!oddsResponse.ok) {
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }

    const oddsData = await oddsResponse.json();
    console.log(`Fetched ${oddsData.length} NBA games from Odds API`);

    // Check remaining requests
    const remainingRequests = oddsResponse.headers.get("x-requests-remaining");
    console.log(`Odds API requests remaining: ${remainingRequests}`);

    // Transform and prepare games for upsert
    const games = oddsData.map((game: any) => {
      const homeTeam = game.home_team;
      const awayTeam = game.away_team;
      const homeTeamInfo = NBA_TEAMS[homeTeam] || { code: homeTeam.substring(0, 3).toUpperCase(), logo: null };
      const awayTeamInfo = NBA_TEAMS[awayTeam] || { code: awayTeam.substring(0, 3).toUpperCase(), logo: null };

      // Get DraftKings odds (fallback to FanDuel)
      const bookmaker = game.bookmakers?.find((b: any) => b.key === "draftkings") 
        || game.bookmakers?.find((b: any) => b.key === "fanduel")
        || game.bookmakers?.[0];

      let homeSpread = null;
      let awaySpread = null;
      let overUnderLine = null;
      let homeMoneyline = null;
      let awayMoneyline = null;

      if (bookmaker) {
        // Get spreads
        const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === "spreads");
        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === awayTeam);
          homeSpread = homeOutcome?.point?.toString() || null;
          awaySpread = awayOutcome?.point?.toString() || null;
        }

        // Get totals
        const totalsMarket = bookmaker.markets?.find((m: any) => m.key === "totals");
        if (totalsMarket) {
          const overOutcome = totalsMarket.outcomes?.find((o: any) => o.name === "Over");
          overUnderLine = overOutcome?.point || null;
        }

        // Get moneylines
        const h2hMarket = bookmaker.markets?.find((m: any) => m.key === "h2h");
        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = h2hMarket.outcomes?.find((o: any) => o.name === awayTeam);
          homeMoneyline = homeOutcome?.price || null;
          awayMoneyline = awayOutcome?.price || null;
        }
      }

      // Generate a consistent ID based on teams and date
      const gameDate = new Date(game.commence_time);
      const dateStr = gameDate.toISOString().split("T")[0];
      const gameId = `nba_${dateStr}_${awayTeamInfo.code}_${homeTeamInfo.code}`.toLowerCase();

      return {
        id: gameId,
        external_id: game.id,
        home_team: homeTeam,
        away_team: awayTeam,
        home_team_code: homeTeamInfo.code,
        away_team_code: awayTeamInfo.code,
        home_team_logo: homeTeamInfo.logo,
        away_team_logo: awayTeamInfo.logo,
        home_spread: homeSpread,
        away_spread: awaySpread,
        over_under_line: overUnderLine,
        home_moneyline: homeMoneyline,
        away_moneyline: awayMoneyline,
        league: "NBA",
        game_date: game.commence_time,
        locked: new Date(game.commence_time) <= new Date(),
        season: 2025,
        game_status: new Date(game.commence_time) <= new Date() ? "in_progress" : "scheduled",
        created_at: new Date().toISOString(),
      };
    });

    // Upsert games to database
    const { data, error } = await supabase
      .from("games")
      .upsert(games, { onConflict: "id", ignoreDuplicates: false })
      .select();

    if (error) {
      throw error;
    }

    console.log(`Upserted ${games.length} NBA games`);

    return new Response(
      JSON.stringify({
        success: true,
        gamesCount: games.length,
        requestsRemaining: remainingRequests,
        games: games.map((g: any) => ({
          id: g.id,
          matchup: `${g.away_team} @ ${g.home_team}`,
          spread: g.home_spread,
          total: g.over_under_line,
        })),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});