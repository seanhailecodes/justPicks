import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Win weight for a pick — copied from resolve-nba-games so golf grading is
 * consistent with every other sport. Golf picks are always moneyline
 * ("this player wins the tournament"), so longshots that hit are worth
 * more and favorites that miss hurt more.
 */
function calcWinWeight(
  correct: boolean | null,
  betType: string | null,
  mlOdds: number | null
): number {
  if (correct === null) return 1.0;
  if (betType !== "moneyline" || mlOdds === null) return 1.0;
  if (correct === true) {
    return mlOdds > 0 ? mlOdds / 100 : 100 / Math.abs(mlOdds);
  }
  return mlOdds > 0 ? 100 / mlOdds : Math.abs(mlOdds) / 100;
}

/**
 * Normalize a player name for cross-source matching. The odds source
 * (home_team) and the results source (winner lookup) format names
 * differently — accents, punctuation, "Jr." etc. Strip all of it.
 * "Matthew Fitzpatrick" / "Matt Fitzpatrick" still won't match, but
 * accents/punctuation/casing will no longer break an otherwise-equal name.
 */
function normalizeName(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Parse "The Field — Masters Tournament" → "Masters Tournament". */
function tournamentNameFromAwayTeam(awayTeam: string | null): string | null {
  if (!awayTeam) return null;
  const idx = awayTeam.indexOf("—");
  if (idx === -1) return null;
  return awayTeam.slice(idx + 1).trim() || null;
}

/** Parse sport key out of external_id "golf_xxx_winner|eventId|playerSlug". */
function sportKeyFromExternalId(externalId: string | null): string | null {
  if (!externalId) return null;
  const key = externalId.split("|")[0];
  return key && key.startsWith("golf_") ? key : null;
}

// ─────────────────────────────────────────────────────────────────────────
// Winner lookup — isolated and swappable. If neither source can confidently
// name a winner, we return null and the tournament is LEFT UNRESOLVED.
// We never guess: a wrong winner would mark every picker incorrect.
// ─────────────────────────────────────────────────────────────────────────

/**
 * Primary: ESPN's public PGA leaderboard JSON. It is purpose-built for
 * golf, reliably exposes finishing position and a completed flag, and
 * needs no API key.
 */
async function winnerFromESPN(tournamentName: string): Promise<string | null> {
  try {
    const res = await fetch(
      "https://site.api.espn.com/apis/site/v2/sports/golf/pga/leaderboard"
    );
    if (!res.ok) {
      console.warn(`[resolve-golf] ESPN leaderboard HTTP ${res.status}`);
      return null;
    }
    const data = await res.json();
    const events: any[] = data?.events ?? [];
    if (events.length === 0) return null;

    const target = normalizeName(tournamentName);
    // Fuzzy-match the tournament by name or shortName (either contains the other).
    const event =
      events.find((e) => {
        const n = normalizeName(e?.name ?? "");
        const sn = normalizeName(e?.shortName ?? "");
        return (
          n === target ||
          sn === target ||
          (n && (n.includes(target) || target.includes(n))) ||
          (sn && (sn.includes(target) || target.includes(sn)))
        );
      }) ?? null;

    if (!event) {
      console.warn(`[resolve-golf] ESPN: no event matching "${tournamentName}"`);
      return null;
    }

    const competition = event?.competitions?.[0];
    const completed =
      competition?.status?.type?.completed === true ||
      event?.status?.type?.completed === true;
    if (!completed) {
      console.log(`[resolve-golf] ESPN: "${event.name}" not completed yet`);
      return null;
    }

    const competitors: any[] = competition?.competitors ?? [];
    // Winner = finishing position 1. ESPN exposes this a few different ways
    // depending on the season's payload shape — check all of them.
    const winner =
      competitors.find((c) => c?.status?.position?.id === "1") ||
      competitors.find((c) => c?.status?.position?.displayValue === "1") ||
      competitors.find((c) => c?.order === 1) ||
      competitors.find((c) => c?.winner === true);

    const name =
      winner?.athlete?.displayName ||
      winner?.athlete?.fullName ||
      winner?.displayName ||
      null;

    if (!name) {
      console.warn(`[resolve-golf] ESPN: "${event.name}" completed but no position-1 athlete found`);
      return null;
    }
    console.log(`[resolve-golf] ESPN winner for "${event.name}": ${name}`);
    return name;
  } catch (e) {
    console.warn("[resolve-golf] ESPN lookup threw:", e);
    return null;
  }
}

/**
 * Fallback: The Odds API scores endpoint for the tournament's sport key.
 * Golf score representation varies (to-par vs. strokes), so this is the
 * fallback, not the primary. We only trust it when the event is flagged
 * completed and exactly one score is unambiguously the leader.
 */
async function winnerFromOddsApi(sportKey: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/scores/?apiKey=${apiKey}&daysFrom=3`
    );
    if (!res.ok) {
      console.warn(`[resolve-golf] Odds API scores HTTP ${res.status} for ${sportKey}`);
      return null;
    }
    const events = await res.json();
    if (!Array.isArray(events)) return null;

    for (const event of events) {
      if (event?.completed !== true) continue;
      const scores: any[] = event?.scores ?? [];
      if (scores.length === 0) continue;

      // Parse numeric scores; in golf the LOWEST wins. Handle "-12", "272", etc.
      const parsed = scores
        .map((s) => ({ name: s?.name as string, score: parseFloat(s?.score) }))
        .filter((s) => s.name && Number.isFinite(s.score));
      if (parsed.length === 0) continue;

      parsed.sort((a, b) => a.score - b.score);
      // Require an unambiguous solo leader — no tie at the top.
      if (parsed.length > 1 && parsed[0].score === parsed[1].score) {
        console.warn(`[resolve-golf] Odds API: tie at top for ${sportKey}, not trusting`);
        return null;
      }
      console.log(`[resolve-golf] Odds API winner for ${sportKey}: ${parsed[0].name}`);
      return parsed[0].name;
    }
    return null;
  } catch (e) {
    console.warn("[resolve-golf] Odds API lookup threw:", e);
    return null;
  }
}

async function getTournamentWinner(
  sportKey: string | null,
  tournamentName: string,
  apiKey: string
): Promise<string | null> {
  // ESPN first (purpose-built for golf), Odds API as the fallback.
  const espn = await winnerFromESPN(tournamentName);
  if (espn) return espn;
  if (sportKey) {
    const odds = await winnerFromOddsApi(sportKey, apiKey);
    if (odds) return odds;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const API_KEY = Deno.env.get("ODDS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      throw new Error("Missing environment variables");
    }
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // Step 1: Find PGA rows that need resolution. A tournament runs ~4 days,
    // so we only attempt rows whose game_date (first tee time) is at least
    // ~3 days old, and cap the lookback so we don't keep re-probing ancient
    // unresolved rows forever.
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { data: unresolvedRows, error: gamesError } = await supabase
      .from("games")
      .select("*")
      .eq("league", "PGA")
      .is("home_score", null)
      .lt("game_date", threeDaysAgo.toISOString())
      .gt("game_date", fourteenDaysAgo.toISOString())
      .order("game_date", { ascending: true });

    if (gamesError) throw gamesError;

    if (!unresolvedRows || unresolvedRows.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No golf rows to resolve", gamesResolved: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Group rows by tournament (one winner lookup per tournament).
    const byTournament = new Map<string, any[]>();
    for (const row of unresolvedRows) {
      const tName = tournamentNameFromAwayTeam(row.away_team) ?? "Unknown Tournament";
      if (!byTournament.has(tName)) byTournament.set(tName, []);
      byTournament.get(tName)!.push(row);
    }
    console.log(
      `[resolve-golf] ${unresolvedRows.length} unresolved rows across ${byTournament.size} tournament(s)`
    );

    let gamesResolved = 0;
    let picksResolved = 0;
    const skipped: string[] = [];

    for (const [tournamentName, rows] of byTournament) {
      const sportKey = sportKeyFromExternalId(rows[0]?.external_id);
      const winnerRaw = await getTournamentWinner(sportKey, tournamentName, API_KEY);

      if (!winnerRaw) {
        // Cannot confirm a winner — LEAVE EVERYTHING UNRESOLVED. We never
        // grade golf picks on a guess. The next cron run tries again.
        console.warn(
          `[resolve-golf] ⚠ Could not determine winner for "${tournamentName}" — leaving ${rows.length} row(s) unresolved`
        );
        skipped.push(tournamentName);
        continue;
      }

      const winnerNorm = normalizeName(winnerRaw);

      for (const game of rows) {
        const playerWon = normalizeName(game.home_team ?? "") === winnerNorm;

        // Update the game row. 1/0 keeps the schema's integer score columns
        // happy and means a future generic resolver pass won't re-touch it.
        const { error: updateError } = await supabase
          .from("games")
          .update({
            home_score: playerWon ? 1 : 0,
            away_score: playerWon ? 0 : 1,
            game_status: "final",
            locked: true,
            resolved_at: new Date().toISOString(),
          })
          .eq("id", game.id);
        if (updateError) {
          console.error(`[resolve-golf] Error updating game ${game.id}:`, updateError);
          continue;
        }
        gamesResolved++;

        // Grade picks on this row. Golf picks are moneyline picks on "home"
        // (the player). Correct iff the picked player actually won.
        const { data: picks, error: picksError } = await supabase
          .from("picks")
          .select("*, bet_type, ml_odds")
          .eq("game_id", game.id);
        if (picksError) {
          console.error(`[resolve-golf] Error fetching picks for ${game.id}:`, picksError);
          continue;
        }

        for (const pick of picks || []) {
          // A golf pick is only meaningful as "home" (this player wins).
          // Defensive: anything else stays null.
          const pickCorrect: boolean | null =
            pick.team_picked === "home" ? playerWon : null;
          const winWeight = calcWinWeight(pickCorrect, pick.bet_type ?? "moneyline", pick.ml_odds);

          const { error: pickUpdateError } = await supabase
            .from("picks")
            .update({ correct: pickCorrect, win_weight: winWeight })
            .eq("id", pick.id);

          if (!pickUpdateError) {
            picksResolved++;
            const emoji = pickCorrect === true ? "✅" : pickCorrect === false ? "❌" : "🤝";
            const resultWord =
              pickCorrect === true ? "Won the tournament!" : pickCorrect === false ? "Didn't win" : "—";
            fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
              },
              body: JSON.stringify({
                userId: pick.user_id,
                title: `${emoji} ${game.home_team}`,
                body: `${tournamentName} · ${resultWord}`,
                url: "/history/picks",
                tag: `pick-${pick.id}`,
              }),
            }).catch((e) => console.warn("[resolve-golf] Push notify failed:", e));
          }
        }
      }

      console.log(
        `[resolve-golf] "${tournamentName}" winner: ${winnerRaw} — resolved ${rows.length} row(s)`
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        gamesResolved,
        picksResolved,
        tournamentsSkipped: skipped,
        message: `Resolved ${gamesResolved} golf row(s), ${picksResolved} pick(s); skipped ${skipped.length} tournament(s) with no confirmed winner`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("resolve-golf-games error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
