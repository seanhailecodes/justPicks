// Shared helpers for game-fetching edge functions.
//
// Two utilities live here:
//
// 1. etDateString(iso): YYYY-MM-DD in America/New_York. Used for stable
//    game IDs in US leagues so that small commence_time updates that cross
//    UTC midnight (e.g. 7:10 PM ET → 8:10 PM ET, which crosses 00:00 UTC)
//    don't generate a new game ID and a duplicate row.
//
// 2. mergeDuplicateGames(): self-healing sweep. After upsert, any historical
//    rows with the same external_id but a stale id (from before the ET fix
//    or from a commence_time shift) are reconciled here. Picks are migrated
//    to the surviving (current) id, then the stale row is deleted.

export function etDateString(iso: string): string {
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

// Season label for a game, derived from its date instead of a hardcoded year.
//   'cross-year' (NBA / NHL / NCAAB / NFL / soccer): the season is named for the
//     year it STARTS, using a July-1 cutoff — matching the app's
//     getCurrentSeason() convention (e.g. a May 2026 NBA game → 2025).
//   'calendar' (MLB / WNBA / UFC / Boxing / golf): single-year sports, tagged
//     with the calendar year of the event.
export function seasonForDate(date: Date, model: "cross-year" | "calendar"): number {
  const year = date.getFullYear();
  if (model === "calendar") return year;
  return date.getMonth() >= 6 ? year : year - 1;
}

interface GameRow {
  id: string;
  external_id?: string | null;
  game_date?: string | null;
  home_spread?: unknown;
  away_spread?: unknown;
  over_under_line?: unknown;
  home_moneyline?: unknown;
  away_moneyline?: unknown;
}

// A candidate is "priced" if a book has posted at least one real market value
// (spread, total, or moneyline). Storing unpriced games produces blank/null
// lines in the app — e.g. tournament/series fixtures listed before odds open.
// Sports that always carry a market, or that pre-filter (golf/soccer), are
// unaffected; this is a no-op for them.
function isPriced(g: GameRow): boolean {
  return [g.home_spread, g.away_spread, g.over_under_line, g.home_moneyline, g.away_moneyline]
    .some((v) => v !== null && v !== undefined);
}

// Sanity-check a spread point value before writing it. Any sportsbook
// listing an NBA/NFL/etc. spread north of ±30 is almost certainly a
// data feed glitch (or an alternate-spread leak). Better to drop it
// than to corrupt the row.
export function isSaneSpread(point: number | null | undefined, league: string): boolean {
  if (point === null || point === undefined) return true; // null is fine
  const abs = Math.abs(point);
  // Reasonable upper bounds per league. Anything above is suspicious.
  const ceilingByLeague: Record<string, number> = {
    NBA: 30, WNBA: 30, NCAAB: 50, NFL: 30, NHL: 5, MLB: 5, SOCCER: 5,
  };
  const ceiling = ceilingByLeague[league] ?? 50;
  return abs <= ceiling;
}

// Filter out games that we shouldn't be writing odds to. We only upsert
// rows for games that haven't started yet — anything else means the API
// might be returning a live in-game line that doesn't reflect the
// pre-game spread, and writing it would corrupt the row.
//
// A game is considered "off-limits" if any of these are true:
//   - locked = true                                (resolver has finalized it)
//   - game_status in ('in_progress', 'final')      (started or done)
//   - game_date <= now                             (commence time has passed)
export async function filterLockedGames(
  supabase: any,
  league: string,
  candidateGames: GameRow[]
): Promise<GameRow[]> {
  if (candidateGames.length === 0) return candidateGames;

  // Drop candidates a book hasn't priced yet (no spread, total, or moneyline).
  const priced = candidateGames.filter(isPriced);
  const droppedUnpriced = candidateGames.length - priced.length;
  if (droppedUnpriced > 0) console.log(`[${league}] Dropped ${droppedUnpriced} unpriced candidate(s) (no market posted yet)`);
  candidateGames = priced;
  if (candidateGames.length === 0) return candidateGames;

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  // First pass: drop any candidate whose game_date is already in the past.
  // Catches the brand-new-row case (no existing DB row yet) where the API
  // listed a game that already started.
  const upcomingCandidates = candidateGames.filter((g) => {
    if (!g.game_date) return true;
    const t = new Date(g.game_date).getTime();
    return Number.isFinite(t) ? t > now : true;
  });
  const droppedByTime = candidateGames.length - upcomingCandidates.length;
  if (droppedByTime > 0) console.log(`[${league}] Dropped ${droppedByTime} candidate(s) whose game_date is in the past`);

  if (upcomingCandidates.length === 0) return upcomingCandidates;

  // Second pass: drop any candidate whose existing DB row is locked,
  // in_progress, final, or whose stored game_date already passed.
  const ids = upcomingCandidates.map((g) => g.id);
  const { data: offLimits } = await supabase
    .from("games")
    .select("id")
    .eq("league", league)
    .in("id", ids)
    .or(`locked.eq.true,game_status.eq.final,game_status.eq.in_progress,game_date.lte.${nowIso}`);

  if (!offLimits || offLimits.length === 0) return upcomingCandidates;
  const offLimitsIds = new Set((offLimits as any[]).map((r) => r.id));
  const filtered = upcomingCandidates.filter((g) => !offLimitsIds.has(g.id));
  const skippedByDb = upcomingCandidates.length - filtered.length;
  if (skippedByDb > 0) console.log(`[${league}] Skipped ${skippedByDb} started/locked game(s) from upsert`);
  return filtered;
}

// Remove games the book has de-listed. After a fetch we know the authoritative
// set of still-live events (the feed response). Any of OUR rows for this league
// that are unlocked, still upcoming, pick-free, fall within the window the feed
// actually covered, and whose external_id is NOT in that set were pulled by the
// book — e.g. a conditional Finals matchup ("X @ Y") that's no longer possible
// once the prior series ends, or a postponed/cancelled game. We delete those so
// they stop polluting the slate (and stop tripping the conditional-matchup
// filter) instead of lingering until their date passes.
//
// Safety rails:
//   - Empty feed → no-op (treat as an outage; never mass-delete).
//   - Only within [now, maxFeedDate] — never touch games beyond the feed's
//     horizon (a book simply hasn't listed them yet).
//   - Never delete a row that has picks — orphaning a user's pick is worse than
//     a stale row; those are left for manual review.
export async function pruneDelistedGames(
  supabase: any,
  league: string,
  liveExternalIds: Array<string | null | undefined>,
  maxFeedDate: string | null,
): Promise<number> {
  const live = new Set(liveExternalIds.filter(Boolean) as string[]);
  if (live.size === 0 || !maxFeedDate) return 0; // outage / nothing to compare against

  const nowIso = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("games")
    .select("id, external_id")
    .eq("league", league)
    .eq("locked", false)
    .gt("game_date", nowIso)
    .lte("game_date", maxFeedDate);

  if (error || !rows) {
    if (error) console.error(`[${league}] Prune query failed:`, error);
    return 0;
  }

  const phantomIds = (rows as any[])
    .filter((r) => !live.has(r.external_id))
    .map((r) => r.id);
  if (phantomIds.length === 0) return 0;

  // Protect any phantom that somehow has picks attached.
  const { data: picked } = await supabase
    .from("picks")
    .select("game_id")
    .in("game_id", phantomIds);
  const pickedSet = new Set((picked ?? []).map((p: any) => p.game_id));
  const deletable = phantomIds.filter((id) => !pickedSet.has(id));
  if (deletable.length === 0) return 0;

  const { error: delErr } = await supabase.from("games").delete().in("id", deletable);
  if (delErr) {
    console.error(`[${league}] Prune delete failed:`, delErr);
    return 0;
  }
  console.log(`[${league}] Pruned ${deletable.length} de-listed game(s): ${deletable.join(", ")}`);
  return deletable.length;
}

export async function mergeDuplicateGames(
  supabase: any,
  league: string,
  currentGames: GameRow[]
): Promise<number> {
  const externalIds = currentGames.map((g) => g.external_id).filter(Boolean) as string[];
  if (externalIds.length === 0) return 0;

  const { data: allRows, error } = await supabase
    .from("games")
    .select("id, external_id")
    .eq("league", league)
    .in("external_id", externalIds);

  if (error) {
    console.error(`[${league}] Dedupe sweep query failed:`, error);
    return 0;
  }
  if (!allRows) return 0;

  const currentIds = new Set(currentGames.map((g) => g.id));
  const stale = allRows.filter((r: any) => !currentIds.has(r.id));

  let merged = 0;
  for (const staleRow of stale) {
    const survivor = currentGames.find((g) => g.external_id === staleRow.external_id);
    if (!survivor) continue;

    const { error: pickErr } = await supabase
      .from("picks")
      .update({ game_id: survivor.id })
      .eq("game_id", staleRow.id);
    if (pickErr) {
      console.error(`[${league}] Failed to migrate picks ${staleRow.id} -> ${survivor.id}:`, pickErr);
      continue;
    }

    const { error: delErr } = await supabase.from("games").delete().eq("id", staleRow.id);
    if (delErr) {
      console.error(`[${league}] Failed to delete stale row ${staleRow.id}:`, delErr);
      continue;
    }

    console.log(`[${league}] Merged stale row ${staleRow.id} -> ${survivor.id}`);
    merged++;
  }

  if (merged > 0) console.log(`[${league}] Merged ${merged} duplicate row(s)`);
  return merged;
}
