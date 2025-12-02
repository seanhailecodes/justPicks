// app/data/resolution/week13-scores-2025.ts
// NFL Week 13 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_13_SCORES_2025: GameScore[] = [
  // Thanksgiving Games - November 27, 2025
  {
    gameId: 'nfl_2025_w13_gb_det',
    homeScore: 24,
    awayScore: 31,
    coveredBy: 'away', // DET -2.5, lost to GB (GB covered)
    status: 'final',
    notes: 'Packers sweep season series'
  },

  {
    gameId: 'nfl_2025_w13_kc_dal',
    homeScore: 31,
    awayScore: 28,
    coveredBy: 'home', // KC -4, lost to DAL (DAL covered)
    status: 'final',
    notes: 'Cowboys upset Chiefs on Thanksgiving'
  },

  {
    gameId: 'nfl_2025_w13_cin_bal',
    homeScore: 14,
    awayScore: 32,
    coveredBy: 'away', // BAL -7.5, lost by 18 (CIN covered)
    status: 'final',
    notes: 'Bengals dominate with Burrow back'
  },

  // Black Friday - November 28, 2025
  {
    gameId: 'nfl_2025_w13_chi_phi',
    homeScore: 15,
    awayScore: 24,
    coveredBy: 'away', // PHI -7, lost by 9 (CHI covered)
    status: 'final',
    notes: 'Bears rush for 281 yards in upset'
  },

  // Sunday Early Games - November 30, 2025
  {
    gameId: 'nfl_2025_w13_sf_cle',
    homeScore: 8,
    awayScore: 26,
    coveredBy: 'away', // SF -7.5, won by 18 ✓
    status: 'final',
    notes: '49ers defense dominates'
  },

  {
    gameId: 'nfl_2025_w13_ari_tb',
    homeScore: 20,
    awayScore: 17,
    coveredBy: 'push', // TB -3, won by exactly 3 (PUSH)
    status: 'final',
    notes: 'Bucs win but push on spread'
  },

  {
    gameId: 'nfl_2025_w13_hou_ind',
    homeScore: 16,
    awayScore: 20,
    coveredBy: 'away', // IND -3.5, lost to HOU (HOU covered)
    status: 'final',
    notes: 'Texans win 4th straight'
  },

  {
    gameId: 'nfl_2025_w13_no_mia',
    homeScore: 21,
    awayScore: 17,
    coveredBy: 'away', // MIA -8.5, won by 4 (NO covered)
    status: 'final',
    notes: 'Saints keep it close in Miami'
  },

  {
    gameId: 'nfl_2025_w13_atl_nyj',
    homeScore: 27,
    awayScore: 24,
    coveredBy: 'home', // ATL -2.5, lost to NYJ (NYJ covered)
    status: 'final',
    notes: 'Jets win on FG as time expires'
  },

  {
    gameId: 'nfl_2025_w13_jax_ten',
    homeScore: 3,
    awayScore: 25,
    coveredBy: 'away', // JAX -6.5, won by 22 ✓
    status: 'final',
    notes: 'Jaguars cruise over Titans'
  },

  {
    gameId: 'nfl_2025_w13_lar_car',
    homeScore: 31,
    awayScore: 28,
    coveredBy: 'home', // LAR -13, lost to CAR (CAR covered)
    status: 'final',
    notes: 'Panthers shock Rams with 3 turnovers'
  },

  // Sunday Afternoon Games - November 30, 2025
  {
    gameId: 'nfl_2025_w13_min_sea',
    homeScore: 26,
    awayScore: 0,
    coveredBy: 'home', // SEA -2.5, won by 26 ✓
    status: 'final',
    notes: 'Vikings shut out for first time since 2007'
  },

  {
    gameId: 'nfl_2025_w13_buf_pit',
    homeScore: 7,
    awayScore: 26,
    coveredBy: 'away', // BUF -4, won by 19 ✓
    status: 'final',
    notes: 'Bills dominate in Pittsburgh'
  },

  {
    gameId: 'nfl_2025_w13_lv_lac',
    homeScore: 31,
    awayScore: 14,
    coveredBy: 'home', // LAC -10, won by 17 ✓
    status: 'final',
    notes: 'Chargers handle division rival'
  },

  // Sunday Night Football - November 30, 2025
  {
    gameId: 'nfl_2025_w13_den_was',
    homeScore: 26,
    awayScore: 27,
    coveredBy: 'home', // DEN -6.5, won by 1 in OT (WAS covered)
    status: 'final',
    notes: 'Broncos survive wild OT affair'
  },

  // Monday Night Football - December 1, 2025
  {
    gameId: 'nfl_2025_w13_nyg_ne',
    homeScore: 33,
    awayScore: 15,
    coveredBy: 'home', // NE -7.5, won by 18 ✓
    status: 'final',
    notes: 'Patriots move to 11-2, best in NFL'
  }
];

// Helper function to resolve all Week 13 games
export async function resolveWeek13() {
  const { resolveWeekFromScores } = await import('./gameResolution');
  return await resolveWeekFromScores(WEEK_13_SCORES_2025);
}