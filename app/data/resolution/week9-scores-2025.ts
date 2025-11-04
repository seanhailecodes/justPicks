// app/data/resolution/week9-scores-2025.ts
// NFL Week 9 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_9_SCORES_2025: GameScore[] = [
  // Thursday Night Football - October 30, 2025
  {
    gameId: 'nfl_2025_w9_bal_mia',
    homeScore: 6,
    awayScore: 28,
    status: 'final',
    notes: 'Ravens dominate as Lamar returns with 4 TDs'
  },

  // Sunday Games - November 2, 2025
  {
    gameId: 'nfl_2025_w9_lac_ten',
    homeScore: 20,
    awayScore: 27,
    status: 'final',
    notes: 'Chargers win despite early pick-six'
  },

  {
    gameId: 'nfl_2025_w9_atl_ne',
    homeScore: 24,
    awayScore: 23,
    status: 'final',
    notes: 'Patriots escape after missed XP by Romo'
  },

  {
    gameId: 'nfl_2025_w9_sf_nyg',
    homeScore: 24,
    awayScore: 34,
    status: 'final',
    notes: '49ers win as McCaffrey dominates'
  },

  {
    gameId: 'nfl_2025_w9_ind_pit',
    homeScore: 27,
    awayScore: 20,
    status: 'final',
    notes: 'Steelers defense forces 6 turnovers'
  },

  {
    gameId: 'nfl_2025_w9_hou_den',
    homeScore: 18,
    awayScore: 15,
    status: 'final',
    notes: 'Broncos win on last-second FG by Lutz'
  },

  {
    gameId: 'nfl_2025_w9_car_gb',
    homeScore: 13,
    awayScore: 16,
    status: 'final',
    notes: 'Panthers upset Packers on final-play FG'
  },

  {
    gameId: 'nfl_2025_w9_min_det',
    homeScore: 24,
    awayScore: 27,
    status: 'final',
    notes: 'Vikings upset Lions as McCarthy returns'
  },

  {
    gameId: 'nfl_2025_w9_chi_cin',
    homeScore: 42,
    awayScore: 47,
    status: 'final',
    notes: 'Bears win thriller on 58-yard TD with :25 left'
  },

  {
    gameId: 'nfl_2025_w9_no_lar',
    homeScore: 34,
    awayScore: 10,
    status: 'final',
    notes: 'Rams dominate in Tyler Shough debut'
  },

  {
    gameId: 'nfl_2025_w9_jax_lv',
    homeScore: 29,
    awayScore: 30,
    status: 'final',
    notes: 'Jaguars win in OT after record 68-yard FG'
  },

  // Sunday Afternoon/Evening
  {
    gameId: 'nfl_2025_w9_kc_buf',
    homeScore: 28,
    awayScore: 21,
    status: 'final',
    notes: 'Bills beat Chiefs behind Allen perfection'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w9_sea_was',
    homeScore: 14,
    awayScore: 38,
    status: 'final',
    notes: 'Seahawks dominate, Daniels injured'
  },

  // Monday Night Football - November 3, 2025
  {
    gameId: 'nfl_2025_w9_ari_dal',
    homeScore: 17,
    awayScore: 27,
    status: 'final',
    notes: 'Cardinals end 5-game skid at Dallas'
  }
];

// Helper function to resolve all Week 9 games
export async function resolveWeek9() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_9_SCORES_2025);
}