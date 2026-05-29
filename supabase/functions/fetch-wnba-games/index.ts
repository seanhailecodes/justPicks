import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { etDateString, mergeDuplicateGames, filterLockedGames, isSaneSpread } from "../_shared/games.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// WNBA team mapping for logos (ESPN CDN)
const WNBA_TEAMS: Record<string, { code: string; logo: string }> = {
  "Atlanta Dream": { code: "ATL", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/atl.png" },
  "Chicago Sky": { code: "CHI", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/chi.png" },
  "Connecticut Sun": { code: "CON", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/con.png" },
  "Dallas Wings": { code: "DAL", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/dal.png" },
  "Golden State Valkyries": { code: "GS", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/gs.png" },
  "Indiana Fever": { code: "IND", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/ind.png" },
  "Las Vegas Aces": { code: "LV", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/lv.png" },
  "Los Angeles Sparks": { code: "LA", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/la.png" },
  "Minnesota Lynx": { code: "MIN", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/min.png" },
  "New York Liberty": { code: "NY", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/ny.png" },
  "Phoenix Mercury": { code: "PHX", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/phx.png" },
  "Portland Fire": { code: "POR", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/por.png" },
  "Seattle Storm": { code: "SEA", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/sea.png" },
  "Toronto Tempo": { code: "TOR", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/tor.png" },
  "Washington Mystics": { code: "WSH", logo: "https://a.espncdn.com/i/teamlogos/wnba/500/wsh.png" },
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

    // Fetch WNBA odds from The Odds API
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/basketball_wnba/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=spreads,totals,h2h&oddsFormat=american&bookmakers=draftkings,fanduel`
    );

    if (!oddsResponse.ok) {
      throw new Error(`Odds API error: ${oddsResponse.status}`);
    }

    const oddsData = await oddsResponse.json();
    console.log(`Fetched ${oddsData.length} WNBA games from Odds API`);

    // Check remaining requests
    const remainingRequests = oddsResponse.headers.get("x-requests-remaining");
    console.log(`Odds API requests remaining: ${remainingRequests}`);

    // Transform and prepare games for upsert
    const games = oddsData.map((game: any) => {
      const homeTeam = game.home_team;
      const awayTeam = game.away_team;
      const homeTeamInfo = WNBA_TEAMS[homeTeam] || { code: homeTeam.substring(0, 3).toUpperCase(), logo: null };
      const awayTeamInfo = WNBA_TEAMS[awayTeam] || { code: awayTeam.substring(0, 3).toUpperCase(), logo: null };

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
        // Get spreads. Reject absurd values (no real WNBA spread is ±30+) —
        // those tend to be data-feed artifacts or alternate-line bleed-through.
        const spreadsMarket = bookmaker.markets?.find((m: any) => m.key === "spreads");
        if (spreadsMarket) {
          const homeOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === homeTeam);
          const awayOutcome = spreadsMarket.outcomes?.find((o: any) => o.name === awayTeam);
          const homePoint = homeOutcome?.point;
          const awayPoint = awayOutcome?.point;
          if (isSaneSpread(homePoint, "WNBA") && isSaneSpread(awayPoint, "WNBA")) {
            homeSpread = homePoint?.toString() || null;
            awaySpread = awayPoint?.toString() || null;
          } else {
            console.warn(`[WNBA] Rejected absurd spread for ${awayTeam} @ ${homeTeam}: home=${homePoint}, away=${awayPoint}`);
          }
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

      // Generate a consistent ID based on teams and date (ET, not UTC, so
      // late-evening games don't flip date when commence_time is updated).
      const dateStr = etDateString(game.commence_time);
      const gameId = `wnba_${dateStr}_${awayTeamInfo.code}_${homeTeamInfo.code}`.toLowerCase();

      // WNBA plays within a single calendar year (May–Oct), so the season is
      // simply the year the game takes place in — no spillover like the
      // NBA's Oct–Jun season.
      const season = new Date(game.commence_time).getFullYear();

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
        league: "WNBA",
        game_date: game.commence_time,
        locked: new Date(game.commence_time) <= new Date(),
        season: season,
        game_status: new Date(game.commence_time) <= new Date() ? "in_progress" : "scheduled",
        created_at: new Date().toISOString(),
      };
    });

    // Don't upsert rows that are already locked/final — protects post-game
    // spreads from being overwritten by stale/glitched API data.
    const upsertable = await filterLockedGames(supabase, "WNBA", games);

    // Upsert games to database
    const { data, error } = await supabase
      .from("games")
      .upsert(upsertable, { onConflict: "id", ignoreDuplicates: false })
      .select();

    if (error) {
      throw error;
    }

    console.log(`Upserted ${games.length} WNBA games`);

    await mergeDuplicateGames(supabase, "WNBA", games);

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
