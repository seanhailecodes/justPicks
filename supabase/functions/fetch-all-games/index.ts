/**
 * fetch-all-games
 *
 * Orchestrator that triggers every individual sport fetch function in parallel.
 * Called by pg_cron every 4 hours so the database always has fresh game listings
 * without any manual intervention.
 *
 * Deployment: supabase functions deploy fetch-all-games
 *
 * pg_cron setup (run once in Supabase SQL editor):
 *   SELECT cron.schedule(
 *     'fetch-all-games',
 *     '0 *\/4 * * *',
 *     $$
 *     SELECT net.http_post(
 *       url := 'https://oyedfzsqqqdfrmhbcbwb.supabase.co/functions/v1/fetch-all-games',
 *       headers := '{"Content-Type":"application/json","Authorization":"Bearer <SERVICE_ROLE_KEY>"}'::jsonb,
 *       body := '{}'::jsonb
 *     );
 *     $$
 *   );
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// All individual sport fetch functions to call
const SPORT_FETCH_FUNCTIONS = [
  { name: "NBA",    fn: "fetch-nba-games"    },
  { name: "NHL",    fn: "fetch-nhl-games"    },
  { name: "NCAAB",  fn: "fetch-ncaab-games"  },
  { name: "Soccer", fn: "fetch-soccer-games" },
  { name: "Golf",   fn: "fetch-golf-games"   },
  { name: "UFC",    fn: "fetch-ufc-games"    },
];

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

  const startTime = Date.now();
  console.log(`[fetch-all-games] Starting fetch for ${SPORT_FETCH_FUNCTIONS.length} sports at ${new Date().toISOString()}`);

  // Call all sport fetch functions in parallel. Failures are isolated per sport.
  const results = await Promise.allSettled(
    SPORT_FETCH_FUNCTIONS.map(async ({ name, fn }) => {
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
          throw new Error(data.error || `HTTP ${res.status}`);
        }

        console.log(`[fetch-all-games] ✅ ${name}: ${data.gamesCount ?? 0} games`);
        return { sport: name, success: true, gamesCount: data.gamesCount ?? 0, requestsRemaining: data.requestsRemaining };
      } catch (err) {
        console.error(`[fetch-all-games] ❌ ${name}: ${err.message}`);
        return { sport: name, success: false, error: err.message };
      }
    })
  );

  const summary = results.map(r => r.status === "fulfilled" ? r.value : { sport: "unknown", success: false, error: "Promise rejected" });
  const succeeded = summary.filter(s => s.success).length;
  const failed = summary.filter(s => !s.success).length;
  const totalGames = summary.reduce((acc, s) => acc + (s.gamesCount ?? 0), 0);
  const elapsed = Date.now() - startTime;

  console.log(`[fetch-all-games] Done in ${elapsed}ms — ${succeeded} sports OK, ${failed} failed, ${totalGames} total games upserted`);

  return new Response(
    JSON.stringify({
      success: true,
      elapsed_ms: elapsed,
      sports_succeeded: succeeded,
      sports_failed: failed,
      total_games: totalGames,
      results: summary,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
  );
});
