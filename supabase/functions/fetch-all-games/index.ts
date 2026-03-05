/**
 * fetch-all-games
 *
 * Orchestrator that triggers individual sport fetch functions.
 * Accepts an optional `sports` array in the request body to limit which sports
 * are fetched. Sports that are out of season are automatically skipped.
 *
 * Called by multiple pg_cron jobs on sport-specific schedules to minimize
 * Odds API credit consumption.
 *
 * Cron jobs (run setup SQL in Supabase SQL editor — see cron-fetch-all-games.sql):
 *   NBA:            Daily 7:30am ET  (12:30 UTC) + 2pm ET (19:00 UTC)
 *   NCAAB + NHL:    Daily 10am ET    (15:00 UTC)
 *   Soccer/Golf/UFC: Mon + Sat 10am ET (15:00 UTC)
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All individual sport fetch functions
const SPORT_FETCH_FUNCTIONS: Array<{
  name: string;
  fn: string;
  season: [number, number, number, number] | null;
}> = [
  { name: "NBA",    fn: "fetch-nba-games",    season: [10, 1, 6, 30]  },
  { name: "NHL",    fn: "fetch-nhl-games",    season: [10, 1, 6, 30]  },
  { name: "NCAAB",  fn: "fetch-ncaab-games",  season: [11, 1, 4, 10]  },
  { name: "Soccer", fn: "fetch-soccer-games", season: [8, 1, 5, 31]   },
  { name: "Golf",   fn: "fetch-golf-games",   season: null             }, // no fixed season
  { name: "UFC",    fn: "fetch-ufc-games",    season: null             }, // no fixed season
];

/**
 * Returns true if today falls within the sport's defined season window.
 * Checks both "season started this year" and "season started last year"
 * so mid-season sports spanning Jan 1 are handled correctly.
 * Sports with no season defined (null) are always considered active.
 */
function isSportInSeason(season: [number, number, number, number] | null): boolean {
  if (!season) return true; // no season restriction → always fetch if requested
  const [startMonth, startDay, endMonth, endDay] = season;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const startYear of [now.getFullYear(), now.getFullYear() - 1]) {
    const start = new Date(startYear, startMonth - 1, startDay);
    const endYear = endMonth < startMonth ? startYear + 1 : startYear;
    const end = new Date(endYear, endMonth - 1, endDay);
    if (today >= start && today <= end) return true;
  }
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ success: false, error: "Missing environment variables" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }

  // Parse optional sports filter from request body
  let requestedSports: string[] | null = null;
  try {
    const body = await req.json();
    if (Array.isArray(body?.sports) && body.sports.length > 0) {
      requestedSports = body.sports.map((s: string) => s.toUpperCase());
    }
  } catch {
    // No body or invalid JSON → fetch all sports
  }

  const startTime = Date.now();
  const dateStr = new Date().toISOString();

  // Determine which sports to fetch
  const toFetch = SPORT_FETCH_FUNCTIONS.filter(sport => {
    // If a sports list was provided, only include requested sports
    if (requestedSports && !requestedSports.includes(sport.name.toUpperCase())) {
      return false;
    }
    // Skip sports that are out of season
    if (!isSportInSeason(sport.season)) {
      console.log(`[fetch-all-games] ⏭️ ${sport.name}: out of season, skipping`);
      return false;
    }
    return true;
  });

  console.log(`[fetch-all-games] Starting fetch for ${toFetch.length} sport(s) at ${dateStr}: ${toFetch.map(s => s.name).join(", ")}`);

  // Call all selected sport fetch functions in parallel — failures are isolated
  const results = await Promise.allSettled(
    toFetch.map(async ({ name, fn }) => {
      const url = `${SUPABASE_URL}/functions/v1/${fn}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({}),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || `Odds API error: ${res.status}`);
        }

        console.log(`[fetch-all-games] ✅ ${name}: ${data.gamesCount ?? 0} games`);
        return { sport: name, success: true, gamesCount: data.gamesCount ?? 0, requestsRemaining: data.requestsRemaining };
      } catch (err) {
        console.error(`[fetch-all-games] ❌ ${name}: ${err.message}`);
        return { sport: name, success: false, error: err.message };
      }
    })
  );

  const summary = results.map(r =>
    r.status === "fulfilled" ? r.value : { sport: "unknown", success: false, error: "Promise rejected" }
  );
  const succeeded = summary.filter(s => s.success).length;
  const failed    = summary.filter(s => !s.success).length;
  const totalGames = summary.reduce((acc, s) => acc + ((s as any).gamesCount ?? 0), 0);
  const elapsed = Date.now() - startTime;

  console.log(`[fetch-all-games] Done in ${elapsed}ms — ${succeeded} OK, ${failed} failed, ${totalGames} total games upserted`);

  return new Response(
    JSON.stringify({
      success: true,
      elapsed_ms: elapsed,
      sports_requested: requestedSports ?? "all",
      sports_fetched: toFetch.map(s => s.name),
      sports_succeeded: succeeded,
      sports_failed: failed,
      total_games: totalGames,
      results: summary,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
});
