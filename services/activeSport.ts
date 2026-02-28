/**
 * activeSport.ts
 * Single source of truth for all sport configuration across the app.
 *
 * To add/enable a sport: update APP_SPORTS below.
 * All screens import from here — no local sport lists needed.
 */

import { Sport } from './pickrating';

export type { Sport };

export type DisplayMode = 'code' | 'name' | 'fighter';

export interface AppSport {
  key: Sport;
  label: string;
  emoji: string;
  league: string;        // DB league value used in queries
  enabled: boolean;      // false = shown but grayed out (coming soon)
  displayMode: DisplayMode;
  season?: [number, number, number, number]; // [startMonth, startDay, endMonth, endDay]
}

// ============================================================
// MASTER SPORT LIST — edit this to add/enable/disable sports
// ============================================================
export const APP_SPORTS: AppSport[] = [
  { key: 'nfl',   label: 'NFL',    emoji: '🏈', league: 'NFL',    enabled: true,  displayMode: 'code', season: [9, 1, 2, 15]   },
  { key: 'nba',   label: 'NBA',    emoji: '🏀', league: 'NBA',    enabled: true,  displayMode: 'code', season: [10, 1, 6, 30]  },
  { key: 'ncaab', label: 'NCAAB',  emoji: '🏀', league: 'NCAAB', enabled: true,  displayMode: 'name', season: [11, 1, 4, 10]  },
  { key: 'soccer',label: 'Soccer', emoji: '⚽', league: 'SOCCER', enabled: true,  displayMode: 'name', season: [8, 1, 5, 31]   },
  { key: 'ncaaf', label: 'NCAAF',  emoji: '🏈', league: 'NCAAF', enabled: false, displayMode: 'name', season: [8, 24, 1, 20]  },
  { key: 'nhl',   label: 'NHL',    emoji: '🏒', league: 'NHL',   enabled: false, displayMode: 'code', season: [10, 1, 6, 30]  },
  { key: 'mlb',   label: 'MLB',    emoji: '⚾', league: 'MLB',   enabled: false, displayMode: 'code', season: [3, 20, 10, 31] },
  { key: 'ufc',   label: 'UFC',    emoji: '🥊', league: 'UFC',   enabled: false, displayMode: 'fighter'                       },
  { key: 'pga',   label: 'PGA',    emoji: '⛳', league: 'PGA',   enabled: false, displayMode: 'name'                          },
];

// Convenience: only the sports users can actually tap
export const ENABLED_SPORTS = APP_SPORTS.filter(s => s.enabled);

// Quick emoji lookup by sport key
export const SPORT_EMOJI: Partial<Record<Sport, string>> = Object.fromEntries(
  APP_SPORTS.map(s => [s.key, s.emoji])
) as Partial<Record<Sport, string>>;

// ============================================================
// SEASON DETECTION
// ============================================================

/**
 * Returns true if today falls within the sport's defined season.
 * Tries both "season started this year" and "season started last year"
 * so mid-season sports are detected correctly regardless of current month.
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
 * Returns the first enabled sport currently in season.
 * Falls back to the first enabled sport if nothing is in season.
 */
export function getDefaultSport(): Sport {
  const active = APP_SPORTS.find(s => s.enabled && isSportInSeason(s.season));
  return active?.key ?? ENABLED_SPORTS[0]?.key ?? 'nba';
}

/**
 * Returns the full AppSport config for a given key.
 */
export function getSport(key: Sport): AppSport {
  return APP_SPORTS.find(s => s.key === key) ?? APP_SPORTS[0];
}
