import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Turns a full player name into a short, URL-safe slug for use in game IDs.
 * e.g. "Scottie Scheffler" → "scottie-sche"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 12);
}

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

    // NOTE: Golf player-vs-player matchup odds are not available in The Odds API
    // at the current subscription tier. Only outright tournament winner markets
    // exist (golf_masters_tournament_winner, golf_us_open_winner, etc.).
    // This function is temporarily disabled until a suitable sport key is confirmed.
    console.log("[fetch-golf-games] Golf matchup odds not available — skipping fetch.");
    return new Response(
      JSON.stringify({ success: true, gamesCount: 0, message: "Golf matchup odds not available in current Odds API plan" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );

    const games = oddsData.map((event: any) => {
      // The Odds API assigns one golfer as "home" and one as "away" arbitrarily
      const homePlayer = event.home_team as string;
      const awayPlayer = event.away_team as string;

      // Prefer DraftKings, fall back to FanDuel, then first available
      const bookmaker =
        event.bookmakers?.find((b: any) => b.key === "draftkings") ||
        event.bookmakers?.find((b: any) => b.key === "fanduel") ||
        event.bookmakers?.[0];

      let homeMoneyline: number | null = null;
      let awayMoneyline: number | null = null;

      if (bookmaker) {
        const h2hMarket = bookmaker.markets?.find((m: any) => m.key === "h2h");
        if (h2hMarket) {
          const homeOutcome = h2hMarket.outcomes?.find((o: any) => o.name === homePlayer);
          const awayOutcome = h2hMarket.outcomes?.find((o: any) => o.name === awayPlayer);
          homeMoneyline = homeOutcome?.price ?? null;
          awayMoneyline = awayOutcome?.price ?? null;
        }
      }

      const gameDate = new Date(event.commence_time);
      const dateStr = gameDate.toISOString().split("T")[0];

      // Build a deterministic ID from date and player slugs
      const gameId = `pga_${dateStr}_${slugify(awayPlayer)}_vs_${slugify(homePlayer)}`;

      // Reuse home_spread / away_spread columns to surface the h2h moneyline odds
      // on the game card pick buttons (no traditional spread exists in golf).
      const homeSpreadDisplay = homeMoneyline !== null ? homeMoneyline.toString() : null;
      const awaySpreadDisplay = awayMoneyline !== null ? awayMoneyline.toString() : null;

      const isStarted = new Date(event.commence_time) <= new Date();

      return {
        id: gameId,
        external_id: event.id,
        home_team: homePlayer,
        away_team: awayPlayer,
        // No team codes for golf — display full name (displayMode: 'name')
        home_team_code: null,
        away_team_code: null,
        home_team_logo: null,
        away_team_logo: null,
        // Spread columns repurposed to show moneyline odds for pick buttons
        home_spread: homeSpreadDisplay,
        away_spread: awaySpreadDisplay,
        // No over/under line for golf h2h matchups
        over_under_line: null,
        home_moneyline: homeMoneyline,
        away_moneyline: awayMoneyline,
        league: "PGA",
        game_date: event.commence_time,
        locked: isStarted,
        season: 2025,
        game_status: isStarted ? "in_progress" : "scheduled",
        created_at: new Date().toISOString(),
      };
    });

    const { error } = await supabase
      .from("games")
      .upsert(games, { onConflict: "id", ignoreDuplicates: false });

    if (error) throw error;

    console.log(`Upserted ${games.length} PGA golf matchups`);

    return new Response(
      JSON.stringify({
        success: true,
        gamesCount: games.length,
        requestsRemaining: remainingRequests,
        matchups: games.map((g: any) => ({
          id: g.id,
          matchup: `${g.away_team} vs. ${g.home_team}`,
          awayOdds: g.away_moneyline,
          homeOdds: g.home_moneyline,
          date: g.game_date,
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    console.error("fetch-golf-games error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
