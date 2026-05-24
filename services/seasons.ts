// seasons.ts
//
// Season list + labels for the season-over-season picker.
//
// A "season" is identified by the year it starts in — the value stored
// in games.season (e.g. 2025 = the 2025-26 NFL season). The picker is
// driven off games.season because that is set per-sport correctly,
// whereas getCurrentSeason() is a single NFL/NBA-oriented global value.

import { supabase, getCurrentSeason } from '../app/lib/supabase';

export interface SeasonOption {
  value: number;      // season start year, e.g. 2025
  label: string;      // display label, e.g. "2025-26"
  isCurrent: boolean; // the newest season available
}

/** Format a season start-year as a "2025-26" style label. */
export function formatSeason(season: number): string {
  const endYY = ((season + 1) % 100).toString().padStart(2, '0');
  return `${season}-${endYY}`;
}

/**
 * Seasons to offer in the picker — derived from the seasons that
 * actually exist in the games table, newest first. The newest is
 * flagged as the current season. Falls back to getCurrentSeason()
 * if the games table can't be read.
 */
export async function getSeasonOptions(): Promise<SeasonOption[]> {
  let seasons: number[] = [];

  const { data, error } = await supabase
    .from('games')
    .select('season')
    .not('season', 'is', null);

  if (!error && data) {
    seasons = [...new Set(data.map((g: any) => g.season as number))]
      .filter((s): s is number => typeof s === 'number' && !Number.isNaN(s))
      .sort((a, b) => b - a);
  }

  if (seasons.length === 0) {
    seasons = [getCurrentSeason()];
  }

  return seasons.map((s, i) => ({
    value: s,
    label: formatSeason(s),
    isCurrent: i === 0,
  }));
}
