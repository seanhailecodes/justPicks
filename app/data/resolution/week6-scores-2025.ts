// app/data/resolution/week6-scores-2025.ts
// NFL Week 6 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_6_SCORES_2025: GameScore[] = [
  // Thursday Night Football - October 10, 2025
  {
    gameId: 'nfl_2025_w6_phi_nyg',
    homeScore: 34,
    awayScore: 17,
    coveredBy: 'home',
    status: 'final',
    notes: 'Giants massive upset over defending champions'
  },

  // Sunday Games - October 12, 2025 (London)
  {
    gameId: 'nfl_2025_w6_den_nyj',
    homeScore: 11,
    awayScore: 13,
    coveredBy: 'away',
    status: 'final',
    notes: 'Broncos edge Jets in defensive struggle, Jets winless at 0-6'
  },

  // Sunday 1:00 PM Games
  {
    gameId: 'nfl_2025_w6_ari_ind',
    homeScore: 31,
    awayScore: 27,
    coveredBy: 'away',
    status: 'final',
    notes: 'Colts barely hold off Cardinals comeback'
  },

  {
    gameId: 'nfl_2025_w6_lac_mia',
    homeScore: 27,
    awayScore: 29,
    coveredBy: 'away',
    status: 'final',
    notes: 'Chargers win thriller on last-second field goal'
  },

  {
    gameId: 'nfl_2025_w6_ne_no',
    homeScore: 19,
    awayScore: 25,
    coveredBy: 'away',
    status: 'final',
    notes: 'Drake Maye leads Patriots to third straight win'
  },

  {
    gameId: 'nfl_2025_w6_cle_pit',
    homeScore: 23,
    awayScore: 9,
    coveredBy: 'home',
    status: 'final',
    notes: 'Steelers dominate Browns, extend Cleveland losing streak'
  },

  {
    gameId: 'nfl_2025_w6_dal_car',
    homeScore: 30,
    awayScore: 27,
    coveredBy: 'home',
    status: 'final',
    notes: 'Panthers upset Cowboys with game-winning FG as time expired'
  },

  {
    gameId: 'nfl_2025_w6_sea_jax',
    homeScore: 12,
    awayScore: 20,
    coveredBy: 'away',
    status: 'final',
    notes: 'Seahawks defense dominates Jaguars'
  },

  {
    gameId: 'nfl_2025_w6_lar_bal',
    homeScore: 3,
    awayScore: 17,
    coveredBy: 'away',
    status: 'final',
    notes: 'Rams defense shuts down Ravens'
  },

  {
    gameId: 'nfl_2025_w6_ten_lv',
    homeScore: 20,
    awayScore: 10,
    coveredBy: 'home',
    status: 'final',
    notes: 'Raiders control Titans throughout'
  },

  // Sunday 4:25 PM Games
  {
    gameId: 'nfl_2025_w6_cin_gb',
    homeScore: 27,
    awayScore: 18,
    coveredBy: 'away',
    status: 'final',
    notes: 'Packers beat Bengals, don\'t cover massive spread'
  },

  {
    gameId: 'nfl_2025_w6_sf_tb',
    homeScore: 30,
    awayScore: 19,
    coveredBy: 'home',
    status: 'final',
    notes: 'Baker Mayfield leads Bucs past banged-up 49ers'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w6_det_kc',
    homeScore: 30,
    awayScore: 17,
    coveredBy: 'home',
    status: 'final',
    notes: 'Chiefs even their record with win over Lions'
  },

  // Monday Night Football - October 13, 2025
  {
    gameId: 'nfl_2025_w6_buf_atl',
    homeScore: 24,
    awayScore: 14,
    coveredBy: 'home',
    status: 'final',
    notes: 'Falcons defense overwhelms Josh Allen'
  },

  {
    gameId: 'nfl_2025_w6_chi_was',
    homeScore: 24,
    awayScore: 25,
    coveredBy: 'away',
    status: 'final',
    notes: 'Bears stun Commanders with game-winning FG as time expired'
  }
];

// Helper function to resolve all Week 6 games
export async function resolveWeek6() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_6_SCORES_2025);
}