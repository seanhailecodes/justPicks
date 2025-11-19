// app/data/resolution/week11-scores-2025.ts
// NFL Week 11 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_11_SCORES_2025: GameScore[] = [
  // Thursday Night Football - November 13, 2025
  {
    gameId: 'nfl_2025_w11_nyj_ne',
    homeScore: 27,
    awayScore: 14,
    status: 'final',
    notes: 'poor offensive outing for NY',
  },

  // Sunday International - November 16, 2025
  {
    gameId: 'nfl_2025_w11_was_mia',
    homeScore: 16,
    awayScore: 13,
    status: 'final',
    notes: 'Miami squeaks it out in OT'
  },

  // Sunday 1:00 PM ET Games - November 16, 2025
  {
    gameId: 'nfl_2025_w11_car_atl',
    homeScore: 27,
    awayScore: 30,
    status: 'final',
    notes: 'Cats win in OT, Atl loses Penix'
  },

  {
    gameId: 'nfl_2025_w11_tb_buf',
    homeScore: 44,
    awayScore: 32,
    status: 'final',
    notes: 'Bills win back and forth high scoring affair'
  },

  {
    gameId: 'nfl_2025_w11_hou_ten',
    homeScore: 23,
    awayScore: 28,
    status: 'final',
    notes: 'Texans win over Titans'
  },

  {
    gameId: 'nfl_2025_w11_no_car',
    homeScore: 13,
    awayScore: 16,
    status: 'final',
    notes: 'Panthers win in close one'
  },

  {
    gameId: 'nfl_2025_w11_chi_min',
    homeScore: 17,
    awayScore: 19,
    status: 'final',
    notes: 'Vikings edge Bears'
  },

  {
    gameId: 'nfl_2025_w11_gb_nyg',
    homeScore: 20,
    awayScore: 27,
    status: 'final',
    notes: 'Packers overcome Giants'
  },

  {
    gameId: 'nfl_2025_w11_cin_pit',
    homeScore: 34,
    awayScore: 12,
    status: 'final',
    notes: 'Steelers pull away in 2nd half'
  },

  {
    gameId: 'nfl_2025_w11_lac_jax',
    homeScore: 35,
    awayScore: 6,
    status: 'final',
    notes: 'Jags dominate for win'
  },

  // Sunday 4:05 PM ET Games - November 16, 2025
  {
    gameId: 'nfl_2025_w11_sea_lar',
    homeScore: 21,
    awayScore: 19,
    status: 'final',
    notes: 'Seahawks win close one'
  },

  {
    gameId: 'nfl_2025_w11_sf_ari',
    homeScore: 22,
    awayScore: 41,
    status: 'final',
    notes: '49ers roll'
  },

  // Sunday 4:25 PM ET Games - November 16, 2025
  {
    gameId: 'nfl_2025_w11_bal_cle',
    homeScore: 16,
    awayScore: 23,
    status: 'final',
    notes: 'Ravens win defensive battle'
  },

  {
    gameId: 'nfl_2025_w11_kc_den',
    homeScore: 22,
    awayScore: 19,
    status: 'final',
    notes: 'Broncos edge Chiefs'
  },

  // Sunday Night Football - November 16, 2025
  {
    gameId: 'nfl_2025_w11_det_phi',
    homeScore: 16,
    awayScore: 9,
    status: 'final',
    notes: 'Defensive matchup, Eagles win'
  },

  // Monday Night Football - November 17, 2025
  {
    gameId: 'nfl_2025_w11_dal_lv',
    homeScore: 16,
    awayScore: 33,
    status: 'final',
    notes: 'Cowboys dominate Monday night'
  }
];

// Helper function to resolve all Week 11 games
export async function resolveWeek11() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_11_SCORES_2025);
}