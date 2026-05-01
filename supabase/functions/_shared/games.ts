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

interface GameRow {
  id: string;
  external_id?: string | null;
  game_date?: string | null;
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
    NBA: 30, NCAAB: 50, NFL: 30, NHL: 5, MLB: 5, SOCCER: 5,
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
