import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// NHL team mapping for logos (ESPN CDN)
const NHL_TEAMS: Record<string, { code: string; logo: string }> = {
  "Anaheim Ducks":          { code: "ANA", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/ana.png" },
  "Boston Bruins":          { code: "BOS", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/bos.png" },
  "Buffalo Sabres":         { code: "BUF", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/buf.png" },
  "Calgary Flames":         { code: "CGY", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/cgy.png" },
  "Carolina Hurricanes":    { code: "CAR", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/car.png" },
  "Chicago Blackhawks":     { code: "CHI", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/chi.png" },
  "Colorado Avalanche":     { code: "COL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/col.png" },
  "Columbus Blue Jackets":  { code: "CBJ", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/cbj.png" },
  "Dallas Stars":           { code: "DAL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/dal.png" },
  "Detroit Red Wings":      { code: "DET", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/det.png" },
  "Edmonton Oilers":        { code: "EDM", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/edm.png" },
  "Florida Panthers":       { code: "FLA", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/fla.png" },
  "Los Angeles Kings":      { code: "LAK", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/lak.png" },
  "Minnesota Wild":         { code: "MIN", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/min.png" },
  "Montreal Canadiens":     { code: "MTL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/mtl.png" },
  "Nashville Predators":    { code: "NSH", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nsh.png" },
  "New Jersey Devils":      { code: "NJD", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/njd.png" },
  "New York Islanders":     { code: "NYI", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nyi.png" },
  "New York Rangers":       { code: "NYR", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/nyr.png" },
  "Ottawa Senators":        { code: "OTT", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/ott.png" },
  "Philadelphia Flyers":    { code: "PHI", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/phi.png" },
  "Pittsburgh Penguins":    { code: "PIT", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/pit.png" },
  "San Jose Sharks":        { code: "SJS", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/sjs.png" },
  "Seattle Kraken":         { code: "SEA", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/sea.png" },
  "St. Louis Blues":        { code: "STL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/stl.png" },
  "Tampa Bay Lightning":    { code: "TBL", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/tb.png" },
  "Toronto Maple Leafs":    { code: "TOR", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/tor.png" },
  "Utah Hockey Club":       { code: "UTA", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/utah.png" },
  "Vancouver Canucks":      { code: "VAN", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/van.png" },
  "Vegas Golden Knights":   { code: "VGK", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/vgk.png" },
  "Washington Capitals":    { code: "WSH", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/wsh.png" },
  "Winnipeg Jets":          { code: "WPG", logo: "https://a.espncdn.com/i/teamlogos/nhl/500/wpg.png" },
};

Deno.serve(async (req) => {
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

    // Fetch NHL odds from The Odds API
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/icehockey_nhl/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american&bookmakers=draftkings,fanduel`
    );

    if (!oddsResponse.ok) {
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }

    const oddsData = await oddsResponse.json();
    console.log(`Fetched ${oddsData.length} NHL games from Odds API`);

    const remainingRequests = oddsResponse.headers.get("x-requests-remaining");
    console.log(`Odds API requests remaining: ${remainingRequests}`);

    const games = oddsData.map((game: any) => {
      const homeTeam = game.home_team;
      const awayTeam = game.away_team;
      const homeTeamInfo = NHL_TEAMS[homeTeam] || { code: homeTeam.substring(0, 3).toUpperCase(), logo: null };
      const awayTeamInfo = NHL_TEAMS[awayTeam] || { code: awayTeam.substring(0, 3).toUpperCase(), logo: null };

      const bookmaker = game.bookmakers?.find((b: any) => b.key === "draftkings")
        || game.bookmakers?.find((b: any) => b.key === "fanduel")
        || game.bookmakers?.[0];

      let homeSpread = null;
      let awaySpread = null;
      let overUnderLine = null;
      let homeMoneyline = null;
      let awayMoneyline = null;

      if (bookmaker) {
        const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === "spreads");
        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === awayTeam);
          homeSpread = homeOutcome?.point?.toString() || null;
          awaySpread = awayOutcome?.point?.toString() || null;
        }

        const totalsMarket = bookmaker.markets?.find((m: any) => m.key === "totals");
        if (totalsMarket) {
          const overOutcome = totalsMarket.outcomes?.find((o: any) => o.name === "Over");
          overUnderLine = overOutcome?.point || null;
        }

        const h2hMarket = bookmaker.markets?.find((m: any) => m.key === "h2h");
        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = h2hMarket.outcomes?.find((o: any) => o.name === awayTeam);
          homeMoneyline = homeOutcome?.price || null;
          awayMoneyline = awayOutcome?.price || null;
        }
      }

      const gameDate = new Date(game.commence_time);
      const dateStr = gameDate.toISOString().split("T")[0];
      const gameId = `nhl_${dateStr}_${awayTeamInfo.code}_${homeTeamInfo.code}`.toLowerCase();

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
        league: "NHL",
        game_date: game.commence_time,
        locked: new Date(game.commence_time) <= new Date(),
        season: 2025,
        game_status: new Date(game.commence_time) <= new Date() ? "in_progress" : "scheduled",
        created_at: new Date().toISOString(),
      };
    });

    const { data, error } = await supabase
      .from("games")
      .upsert(games, { onConflict: "id", ignoreDuplicates: false })
      .select();

    if (error) throw error;

    console.log(`Upserted ${games.length} NHL games`);

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
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
