/**
 * activeSport.ts
 * Single source of truth for sport season detection.
 * Import getDefaultSport() anywhere you need the current active sport.
 */

export type SportKey = 'nfl' | 'nba' | 'ncaab' | 'ncaaf' | 'soccer_epl' | 'nhl' | 'mlb' | 'ufc' | 'pga';

interface SeasonConfig {
  key: SportKey;
  enabled: boolean;
  // [startMonth, startDay, endMonth, endDay] — 1-indexed months
  season?: [number, number, number, number];
}

const SPORT_SEASONS: SeasonConfig[] = [
  { key: 'nfl',       enabled: true,  season: [9, 1,  2, 15] },
  { key: 'nba',       enabled: true,  season: [10, 1, 6, 30] },
  { key: 'ncaab',     enabled: true,  season: [11, 1, 4, 10] },
  { key: 'ncaaf',     enabled: false, season: [8, 24, 1, 20] },
  { key: 'soccer_epl',enabled: false, season: [8, 1,  5, 31] },
  { key: 'nhl',       enabled: false, season: [10, 1, 6, 30] },
  { key: 'mlb',       enabled: false, season: [3, 20, 10, 31] },
  { key: 'ufc',       enabled: false },
  { key: 'pga',       enabled: false },
];

/**
 * Returns true if today falls within the sport's defined season.
 * Handles seasons that span the new year (e.g. NFL Sep–Feb).
 * Tries both "season started this year" and "season started last year"
 * so mid-season sports are detected correctly regardless of the current month.
 */
export function isSportInSeason(season?: [number, number, number, number]): boolean {
  if (!season) return false;
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

/**
 * Returns the key of the first enabled sport currently in season.
 * Falls back to the first enabled sport if nothing is in season.
 */
export function getDefaultSport(): SportKey {
  const active = SPORT_SEASONS.find(s => s.enabled && isSportInSeason(s.season));
  return active?.key ?? SPORT_SEASONS.find(s => s.enabled)?.key ?? 'nba';
}
