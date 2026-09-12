// app/data/resolution/week11-scores-2025.ts
// NFL Week 11 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_11_SCORES_2025: GameScore[] = [
  // Thursday Night Football - November 13, 2025
  {
    gameId: 'nfl_2025_w11_nyj_ne',
    homeScore: 27,
    awayScore: 14,
    coveredBy: 'home', // NE -11.5, won by 13 ✓
    status: 'final',
    notes: 'poor offensive outing for NY',
  },

  // Sunday International - November 16, 2025
  {
    gameId: 'nfl_2025_w11_was_mia',
    homeScore: 16,
    awayScore: 13,
    coveredBy: 'home', // MIA -2, won by 3 ✓
    status: 'final',
    notes: 'Miami squeaks it out in OT'
  },

  // Sunday 1:00 PM ET Games - November 16, 2025
  {
    gameId: 'nfl_2025_w11_car_atl',
    homeScore: 27,
    awayScore: 30,
    coveredBy: 'away', // CAR +3.5, won by 3 (didn't cover) ✓
    status: 'final',
    notes: 'Cats win in OT, Atl loses Penix'
  },

  {
    gameId: 'nfl_2025_w11_tb_buf',
    homeScore: 44,
    awayScore: 32,
    coveredBy: 'home', // BUF -5.5, won by 12 ✓
    status: 'final',
    notes: 'Bills win back and forth high scoring affair'
  },

  {
    gameId: 'nfl_2025_w11_hou_ten',
    homeScore: 23,
    awayScore: 28,
    coveredBy: 'away', // HOU -7.5, won by 5 (didn't cover) ✓
    status: 'final',
    notes: 'Texans win over Titans'
  },

  {
    gameId: 'nfl_2025_w11_chi_min',
    homeScore: 17,
    awayScore: 19,
    coveredBy: 'away', // CHI +3, lost by 2 (covered) ✓
    status: 'final',
    notes: 'Vikings edge Bears'
  },

  {
    gameId: 'nfl_2025_w11_gb_nyg',
    homeScore: 20,
    awayScore: 27,
    coveredBy: 'away', // GB -4.5, won by 7 ✓
    status: 'final',
    notes: 'Packers overcome Giants'
  },

  {
    gameId: 'nfl_2025_w11_cin_pit',
    homeScore: 34,
    awayScore: 12,
    coveredBy: 'home', // PIT -5.5, won by 22 ✓
    status: 'final',
    notes: 'Steelers pull away in 2nd half'
  },

  {
    gameId: 'nfl_2025_w11_lac_jax',
    homeScore: 35,
    awayScore: 6,
    coveredBy: 'home', // JAX +7.5, won by 29 ✓
    status: 'final',
    notes: 'Jags dominate for win'
  },

  // Sunday 4:05 PM ET Games - November 16, 2025
  {
    gameId: 'nfl_2025_w11_sea_lar',
    homeScore: 21,
    awayScore: 19,
    coveredBy: 'away', // SEA +2.5, lost by 2 (covered) ✓
    status: 'final',
    notes: 'Seahawks win close one'
  },

  {
    gameId: 'nfl_2025_w11_sf_ari',
    homeScore: 22,
    awayScore: 41,
    coveredBy: 'away', // SF +5.5, won by 19 ✓
    status: 'final',
    notes: '49ers roll'
  },

  // Sunday 4:25 PM ET Games - November 16, 2025
  {
    gameId: 'nfl_2025_w11_bal_cle',
    homeScore: 16,
    awayScore: 23,
    coveredBy: 'away', // BAL -10.5, won by 7 (didn't cover) ✓
    status: 'final',
    notes: 'Ravens win defensive battle'
  },

  {
    gameId: 'nfl_2025_w11_kc_den',
    homeScore: 22,
    awayScore: 19,
    coveredBy: 'home', // DEN +3.5, lost by 3 (covered) ✓
    status: 'final',
    notes: 'Broncos edge Chiefs'
  },

  // Sunday Night Football - November 16, 2025
  {
    gameId: 'nfl_2025_w11_det_phi',
    homeScore: 16,
    awayScore: 9,
    coveredBy: 'home', // PHI +1.5, won by 7 ✓
    status: 'final',
    notes: 'Defensive matchup, Eagles win'
  },

  // Monday Night Football - November 17, 2025
  {
    gameId: 'nfl_2025_w11_dal_lv',
    homeScore: 16,
    awayScore: 33,
    coveredBy: 'away', // DAL -3.5, won by 17 ✓
    status: 'final',
    notes: 'Cowboys dominate Monday night'
  }
];

// Helper function to resolve all Week 11 games
export async function resolveWeek11() {
  const { resolveWeekFromScores } = await import('./gameResolution');
  return await resolveWeekFromScores(WEEK_11_SCORES_2025);
}