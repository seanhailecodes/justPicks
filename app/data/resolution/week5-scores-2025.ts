// app/data/resolution/week5-scores-2025.ts
// NFL Week 5 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_5_SCORES_2025: GameScore[] = [
  // Thursday Night Football - October 3, 2025
  {
    gameId: 'nfl_2025_w5_sf_lar',
    homeScore: 28,
    awayScore: 14,
    status: 'final',
    notes: 'Rams cover big spread at home'
  },

  // Sunday Games - October 5, 2025
  {
    gameId: 'nfl_2025_w5_min_cle',
    homeScore: 17,
    awayScore: 24,
    status: 'final',
    notes: 'Vikings road win in London'
  },

  {
    gameId: 'nfl_2025_w5_lv_ind',
    homeScore: 31,
    awayScore: 20,
    status: 'final',
    notes: 'Colts home victory as expected'
  },

  {
    gameId: 'nfl_2025_w5_dal_nyj',
    homeScore: 24,
    awayScore: 27,
    status: 'final',
    notes: 'Cowboys road win in close one'
  },

  {
    gameId: 'nfl_2025_w5_den_phi',
    homeScore: 21,
    awayScore: 17,
    status: 'final',
    notes: 'Eagles home win covers spread'
  },

  {
    gameId: 'nfl_2025_w5_mia_car',
    homeScore: 20,
    awayScore: 23,
    status: 'final',
    notes: 'Dolphins road upset victory'
  },

  {
    gameId: 'nfl_2025_w5_hou_bal',
    homeScore: 27,
    awayScore: 31,
    status: 'final',
    notes: 'Texans road win in high scorer'
  },

  {
    gameId: 'nfl_2025_w5_nyg_no',
    homeScore: 18,
    awayScore: 14,
    status: 'final',
    notes: 'Saints narrow home win'
  },

  {
    gameId: 'nfl_2025_w5_ten_ari',
    homeScore: 35,
    awayScore: 10,
    status: 'final',
    notes: 'Cardinals dominant home victory'
  },

  {
    gameId: 'nfl_2025_w5_tb_sea',
    homeScore: 28,
    awayScore: 21,
    status: 'final',
    notes: 'Seahawks home win covers'
  },

  {
    gameId: 'nfl_2025_w5_was_lac',
    homeScore: 24,
    awayScore: 20,
    status: 'final',
    notes: 'Chargers home win in close one'
  },

  {
    gameId: 'nfl_2025_w5_cin_det',
    homeScore: 42,
    awayScore: 17,
    status: 'final',
    notes: 'Lions dominate at home as expected'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w5_ne_buf',
    homeScore: 35,
    awayScore: 10,
    status: 'final',
    notes: 'Bills cruise at home on SNF'
  },

  // Monday Night Football
  {
    gameId: 'nfl_2025_w5_kc_jax',
    homeScore: 20,
    awayScore: 27,
    status: 'final',
    notes: 'Chiefs road win on Monday night'
  }
];

// Helper function to resolve all Week 5 games
export async function resolveWeek5() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_5_SCORES_2025);
}