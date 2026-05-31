import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { etDateString, mergeDuplicateGames, filterLockedGames, isSaneSpread, seasonForDate } from "../_shared/games.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// MLB team mapping for logos (ESPN CDN).
// Note: ESPN uses 2-letter codes for a few teams (kc, sd, sf, tb). The `code`
// field is what we display in the app; the logo URL uses ESPN's specific slug.
// "Athletics" (rebrand from "Oakland Athletics") is included as a separate key
// so The Odds API returning either name resolves correctly.
const MLB_TEAMS: Record<string, { code: string; logo: string }> = {
  "Arizona Diamondbacks":  { code: "ARI", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/ari.png" },
  "Atlanta Braves":        { code: "ATL", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/atl.png" },
  "Baltimore Orioles":     { code: "BAL", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bal.png" },
  "Boston Red Sox":        { code: "BOS", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/bos.png" },
  "Chicago Cubs":          { code: "CHC", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/chc.png" },
  "Chicago White Sox":     { code: "CHW", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/chw.png" },
  "Cincinnati Reds":       { code: "CIN", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cin.png" },
  "Cleveland Guardians":   { code: "CLE", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/cle.png" },
  "Colorado Rockies":      { code: "COL", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/col.png" },
  "Detroit Tigers":        { code: "DET", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/det.png" },
  "Houston Astros":        { code: "HOU", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/hou.png" },
  "Kansas City Royals":    { code: "KC",  logo: "https://a.espncdn.com/i/teamlogos/mlb/500/kc.png" },
  "Los Angeles Angels":    { code: "LAA", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/laa.png" },
  "Los Angeles Dodgers":   { code: "LAD", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/lad.png" },
  "Miami Marlins":         { code: "MIA", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/mia.png" },
  "Milwaukee Brewers":     { code: "MIL", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/mil.png" },
  "Minnesota Twins":       { code: "MIN", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/min.png" },
  "New York Mets":         { code: "NYM", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nym.png" },
  "New York Yankees":      { code: "NYY", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/nyy.png" },
  "Oakland Athletics":     { code: "OAK", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/oak.png" },
  "Athletics":             { code: "ATH", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/oak.png" },
  "Philadelphia Phillies": { code: "PHI", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/phi.png" },
  "Pittsburgh Pirates":    { code: "PIT", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/pit.png" },
  "San Diego Padres":      { code: "SD",  logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sd.png" },
  "San Francisco Giants":  { code: "SF",  logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sf.png" },
  "Seattle Mariners":      { code: "SEA", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/sea.png" },
  "St. Louis Cardinals":   { code: "STL", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/stl.png" },
  "Tampa Bay Rays":        { code: "TB",  logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tb.png" },
  "Texas Rangers":         { code: "TEX", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tex.png" },
  "Toronto Blue Jays":     { code: "TOR", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/tor.png" },
  "Washington Nationals":  { code: "WSH", logo: "https://a.espncdn.com/i/teamlogos/mlb/500/wsh.png" },
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

    // Fetch MLB odds from The Odds API. MLB "spreads" is the run-line
    // (typically ±1.5); h2h is moneyline; totals is over/under.
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/baseball_mlb/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american&bookmakers=draftkings,fanduel`
    );

    if (!oddsResponse.ok) {
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }

    const oddsData = await oddsResponse.json();
    console.log(`Fetched ${oddsData.length} MLB games from Odds API`);

    const remainingRequests = oddsResponse.headers.get("x-requests-remaining");
    console.log(`Odds API requests remaining: ${remainingRequests}`);

    const games = oddsData.map((game: any) => {
      const homeTeam = game.home_team;
      const awayTeam = game.away_team;
      const homeTeamInfo = MLB_TEAMS[homeTeam] || { code: homeTeam.substring(0, 3).toUpperCase(), logo: null };
      const awayTeamInfo = MLB_TEAMS[awayTeam] || { code: awayTeam.substring(0, 3).toUpperCase(), logo: null };

      // Prefer DraftKings, fall back to FanDuel, then any.
      const bookmaker = game.bookmakers?.find((b: any) => b.key === "draftkings")
        || game.bookmakers?.find((b: any) => b.key === "fanduel")
        || game.bookmakers?.[0];

      let homeSpread = null;
      let awaySpread = null;
      let overUnderLine = null;
      let homeMoneyline = null;
      let awayMoneyline = null;

      if (bookmaker) {
        // Run-line spreads. _shared/games.ts caps MLB at ±5; anything beyond
        // is almost certainly a bad data point and gets rejected.
        const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === "spreads");
        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === awayTeam);
          const homePoint = homeOutcome?.point;
          const awayPoint = awayOutcome?.point;
          if (isSaneSpread(homePoint, "MLB") && isSaneSpread(awayPoint, "MLB")) {
            homeSpread = homePoint?.toString() || null;
            awaySpread = awayPoint?.toString() || null;
          } else {
            console.warn(`[MLB] Rejected absurd spread for ${awayTeam} @ ${homeTeam}: home=${homePoint}, away=${awayPoint}`);
          }
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

      // Consistent ID based on ET date + team codes, so a late-night game
      // doesn't flip date when commence_time updates.
      const dateStr = etDateString(game.commence_time);
      const gameId = `mlb_${dateStr}_${awayTeamInfo.code}_${homeTeamInfo.code}`.toLowerCase();

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
        league: "MLB",
        game_date: game.commence_time,
        locked: new Date(game.commence_time) <= new Date(),
        season: seasonForDate(new Date(game.commence_time), "calendar"),
        game_status: new Date(game.commence_time) <= new Date() ? "in_progress" : "scheduled",
        created_at: new Date().toISOString(),
      };
    });

    // Don't overwrite locked/final rows — protects post-game lines from being
    // overwritten by stale/glitched feed data.
    const upsertable = await filterLockedGames(supabase, "MLB", games);

    const { error } = await supabase
      .from("games")
      .upsert(upsertable, { onConflict: "id", ignoreDuplicates: false })
      .select();

    if (error) {
      throw error;
    }

    console.log(`Upserted ${games.length} MLB games`);

    await mergeDuplicateGames(supabase, "MLB", games);

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
