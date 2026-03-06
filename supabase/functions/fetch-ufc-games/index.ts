import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Converts a fighter name into a short slug for use in game IDs.
 * e.g. "Max Holloway" → "max-hollow"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
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

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch UFC fight odds. Each event is a fight between two fighters.
    // We only need h2h (who wins the fight) — no spread or totals for MMA picks.
    const oddsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/mma_mixed_martial_arts/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=american&bookmakers=draftkings,fanduel`
    );

    if (!oddsResponse.ok) {
      const body = await oddsResponse.text();
      throw new Error(`Odds API error ${oddsResponse.status}: ${body}`);
    }

    const oddsData = await oddsResponse.json();
    const remainingRequests = oddsResponse.headers.get("x-requests-remaining");
    console.log(`Fetched ${oddsData.length} UFC fights. Requests remaining: ${remainingRequests}`);

    const games = oddsData.map((event: any) => {
      // The Odds API assigns one fighter as "home" and one as "away"
      const homeFighter = event.home_team as string;
      const awayFighter = event.away_team as string;

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
          const homeOutcome = h2hMarket.outcomes?.find((o: any) => o.name === homeFighter);
          const awayOutcome = h2hMarket.outcomes?.find((o: any) => o.name === awayFighter);
          homeMoneyline = homeOutcome?.price ?? null;
          awayMoneyline = awayOutcome?.price ?? null;
        }
      }

      const gameDate = new Date(event.commence_time);
      const dateStr = gameDate.toISOString().split("T")[0];

      // Deterministic ID: sport prefix + date + fighter slugs
      const gameId = `ufc_${dateStr}_${slugify(awayFighter)}_vs_${slugify(homeFighter)}`;

      // Repurpose spread columns to show h2h moneyline odds on the pick buttons.
      // UFC has no traditional point spread — users just pick who wins the fight.
      const homeSpreadDisplay = homeMoneyline !== null ? homeMoneyline.toString() : null;
      const awaySpreadDisplay = awayMoneyline !== null ? awayMoneyline.toString() : null;

      const isStarted = new Date(event.commence_time) <= new Date();

      return {
        id: gameId,
        external_id: event.id,
        home_team: homeFighter,
        away_team: awayFighter,
        // No team codes for MMA — display full fighter name (displayMode: 'fighter')
        home_team_code: null,
        away_team_code: null,
        home_team_logo: null,
        away_team_logo: null,
        // Spread columns repurposed for moneyline odds display on pick buttons
        home_spread: homeSpreadDisplay,
        away_spread: awaySpreadDisplay,
        // No over/under for basic fight picks (round totals could be added later)
        over_under_line: null,
        home_moneyline: homeMoneyline,
        away_moneyline: awayMoneyline,
        league: "UFC",
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

    console.log(`Upserted ${games.length} UFC fights`);

    return new Response(
      JSON.stringify({
        success: true,
        gamesCount: games.length,
        requestsRemaining: remainingRequests,
        fights: games.map((g: any) => ({
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
    console.error("fetch-ufc-games error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
