import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { etDateString, mergeDuplicateGames, filterLockedGames } from "../_shared/games.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// How many players (favorites) to surface per tournament. Golf winner
// markets list ~150 players; showing them all would make the Games tab
// unscannable. The top N by implied win probability keeps the card list
// tight while still covering everyone a casual picker would consider.
const MAX_PLAYERS_PER_TOURNAMENT = 16;

/**
 * Turns a full player name into a short, URL-safe slug for use in game IDs.
 * e.g. "Scottie Scheffler" → "scottie-sche"
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .substring(0, 14);
}

/**
 * Implied win probability from American odds. Used to rank the field so
 * we keep the biggest favorites. +750 → 0.118, -200 → 0.667.
 */
function impliedProbability(americanOdds: number): number {
  if (americanOdds >= 0) return 100 / (americanOdds + 100);
  return -americanOdds / (-americanOdds + 100);
}

/**
 * Best-effort human tournament name. The Odds API gives `sport_title`
 * like "Golf - Masters Tournament Winner"; strip the boilerplate.
 * Falls back to de-slugging the sport key.
 */
function tournamentNameFrom(sportTitle: string | undefined, sportKey: string): string {
  if (sportTitle) {
    const cleaned = sportTitle
      .replace(/^golf\s*-\s*/i, "")
      .replace(/\s*winner$/i, "")
      .trim();
    if (cleaned) return cleaned;
  }
  // golf_masters_tournament_winner → "Masters Tournament"
  return sportKey
    .replace(/^golf_/, "")
    .replace(/_winner$/, "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
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

    // ── 1. Discover active golf tournaments ──────────────────────────────
    // The Odds API exposes one sport key per tournament's outright-winner
    // market, e.g. golf_masters_tournament_winner. We don't hardcode the
    // four majors — we ask the API which golf winner markets are live.
    const sportsResponse = await fetch(
      `https://api.the-odds-api.com/v4/sports/?apiKey=${ODDS_API_KEY}&all=true`
    );
    if (!sportsResponse.ok) {
      const body = await sportsResponse.text();
      throw new Error(`Odds API /sports error ${sportsResponse.status}: ${body}`);
    }
    const allSports = await sportsResponse.json();
    const golfKeys: string[] = (allSports as any[])
      .filter(
        (s) =>
          typeof s.key === "string" &&
          s.key.startsWith("golf_") &&
          s.key.endsWith("_winner") &&
          s.active === true
      )
      .map((s) => s.key);

    console.log(`[fetch-golf-games] Active golf winner markets: ${golfKeys.join(", ") || "(none)"}`);

    if (golfKeys.length === 0) {
      return new Response(
        JSON.stringify({ success: true, gamesCount: 0, message: "No active golf tournaments" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── 2. For each tournament, pull the outright-winner field ──────────
    const allGames: any[] = [];
    let remainingRequests: string | null = null;

    for (const sportKey of golfKeys) {
      const oddsResponse = await fetch(
        `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${ODDS_API_KEY}` +
          `&regions=us&markets=outrights&oddsFormat=american&bookmakers=draftkings,fanduel`
      );
      if (!oddsResponse.ok) {
        const body = await oddsResponse.text();
        console.error(`[fetch-golf-games] ${sportKey} odds error ${oddsResponse.status}: ${body}`);
        continue;
      }
      remainingRequests = oddsResponse.headers.get("x-requests-remaining");
      const events = await oddsResponse.json();
      if (!Array.isArray(events) || events.length === 0) {
        console.log(`[fetch-golf-games] ${sportKey}: no events`);
        continue;
      }

      // An outrights sport key typically returns a single event = the tournament.
      for (const event of events) {
        const tournamentName = tournamentNameFrom(event.sport_title, sportKey);
        const tournamentSlug = slugify(tournamentName);

        // Prefer DraftKings, fall back to FanDuel, then first available.
        const bookmaker =
          event.bookmakers?.find((b: any) => b.key === "draftkings") ||
          event.bookmakers?.find((b: any) => b.key === "fanduel") ||
          event.bookmakers?.[0];
        if (!bookmaker) {
          console.log(`[fetch-golf-games] ${sportKey}: no bookmaker for event ${event.id}`);
          continue;
        }

        const outrightsMarket = bookmaker.markets?.find((m: any) => m.key === "outrights");
        if (!outrightsMarket?.outcomes?.length) {
          console.log(`[fetch-golf-games] ${sportKey}: no outrights outcomes for event ${event.id}`);
          continue;
        }

        // Rank by implied probability (biggest favorites first), keep top N.
        const ranked = (outrightsMarket.outcomes as any[])
          .filter((o) => typeof o.price === "number" && o.name)
          .map((o) => ({ name: o.name as string, price: o.price as number }))
          .sort((a, b) => impliedProbability(b.price) - impliedProbability(a.price))
          .slice(0, MAX_PLAYERS_PER_TOURNAMENT);

        const dateStr = etDateString(event.commence_time);
        const isStarted = new Date(event.commence_time) <= new Date();

        for (const player of ranked) {
          const playerSlug = slugify(player.name);
          // Deterministic ID: sport prefix + ET date + tournament + player.
          const gameId = `pga_${dateStr}_${tournamentSlug}_${playerSlug}`;
          // external_id MUST be unique per player — every player in a
          // tournament shares the Odds API event.id, so we namespace it
          // with the sport key and player slug. The sport key is also
          // what resolve-golf-games needs to look up the winner later.
          const externalId = `${sportKey}|${event.id}|${playerSlug}`;

          allGames.push({
            id: gameId,
            external_id: externalId,
            home_team: player.name,
            // Tournament name rides along in away_team after an em-dash so
            // the card / history / resolver can recover it without a
            // schema migration. The card shows just "The Field".
            away_team: `The Field — ${tournamentName}`,
            home_team_code: null,
            away_team_code: null,
            home_team_logo: null,
            away_team_logo: null,
            // Golf has no point spread — leave spread columns null and
            // drive the pick button off home_moneyline instead.
            home_spread: null,
            away_spread: null,
            over_under_line: null,
            home_moneyline: player.price,
            away_moneyline: null, // "the field" has no single price
            league: "PGA",
            game_date: event.commence_time,
            locked: isStarted,
            season: new Date(event.commence_time).getFullYear(),
            game_status: isStarted ? "in_progress" : "scheduled",
            created_at: new Date().toISOString(),
          });
        }

        console.log(
          `[fetch-golf-games] ${tournamentName}: ${ranked.length} players (of ${outrightsMarket.outcomes.length} in field)`
        );
      }
    }

    if (allGames.length === 0) {
      return new Response(
        JSON.stringify({ success: true, gamesCount: 0, message: "No golf player rows built" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // ── 3. Upsert (skipping started/locked) + self-healing dedupe ───────
    const upsertable = await filterLockedGames(supabase, "PGA", allGames);
    if (upsertable.length > 0) {
      const { error } = await supabase
        .from("games")
        .upsert(upsertable, { onConflict: "id", ignoreDuplicates: false });
      if (error) throw error;
    }

    console.log(
      `Upserted ${upsertable.length} PGA player rows (skipped ${allGames.length - upsertable.length} started/locked)`
    );

    await mergeDuplicateGames(supabase, "PGA", allGames);

    return new Response(
      JSON.stringify({
        success: true,
        gamesCount: allGames.length,
        upsertedCount: upsertable.length,
        tournaments: golfKeys,
        requestsRemaining: remainingRequests,
        players: allGames.map((g: any) => ({
          id: g.id,
          player: g.home_team,
          tournament: g.away_team,
          odds: g.home_moneyline,
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
