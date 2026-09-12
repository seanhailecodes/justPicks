// app/data/resolution/week7-scores-2025.ts
// NFL Week 7 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_7_SCORES_2025: GameScore[] = [
  // Thursday Night Football - October 16, 2025
  {
    gameId: 'nfl_2025_w7_pit_cin',
    homeScore: 33,
    awayScore: 31,
    coveredBy: 'home',
    status: 'final',
    notes: 'Bengals upset Steelers, Ja\'Marr Chase 16 receptions'
  },

  // Sunday Games - October 19, 2025 (London)
  {
    gameId: 'nfl_2025_w7_lar_jax',
    homeScore: 7,
    awayScore: 35,
    coveredBy: 'away',
    status: 'final',
    notes: 'Stafford throws 5 TDs in London blowout'
  },

  // Sunday 1:00 PM Games
  {
    gameId: 'nfl_2025_w7_no_chi',
    homeScore: 26,
    awayScore: 14,
    coveredBy: 'home',
    status: 'final',
    notes: 'Bears roll past Saints at home'
  },

  {
    gameId: 'nfl_2025_w7_car_nyj',
    homeScore: 6,
    awayScore: 13,
    coveredBy: 'away',
    status: 'final',
    notes: 'Panthers edge winless Jets in defensive struggle'
  },

  {
    gameId: 'nfl_2025_w7_mia_cle',
    homeScore: 31,
    awayScore: 6,
    coveredBy: 'home',
    status: 'final',
    notes: 'Browns dominate Dolphins, 3 Tua INTs'
  },

  {
    gameId: 'nfl_2025_w7_phi_min',
    homeScore: 22,
    awayScore: 28,
    coveredBy: 'away',
    status: 'final',
    notes: 'Hurts and Brown connect for 2 TDs'
  },

  {
    gameId: 'nfl_2025_w7_ne_ten',
    homeScore: 13,
    awayScore: 31,
    coveredBy: 'away',
    status: 'final',
    notes: 'Drake Maye leads Pats to 4th straight win'
  },

  {
    gameId: 'nfl_2025_w7_lv_kc',
    homeScore: 31,
    awayScore: 0,
    coveredBy: 'home',
    status: 'final',
    notes: 'Chiefs shutout Raiders, Rashee Rice returns'
  },

  // Sunday 4:05 PM Games
  {
    gameId: 'nfl_2025_w7_nyg_den',
    homeScore: 33,
    awayScore: 32,
    coveredBy: 'away',
    status: 'final',
    notes: 'Bo Nix leads historic 33-point 4th quarter comeback'
  },

  {
    gameId: 'nfl_2025_w7_ind_lac',
    homeScore: 24,
    awayScore: 38,
    coveredBy: 'away',
    status: 'final',
    notes: 'Colts improve to 6-1, best record in NFL'
  },

  // Sunday 4:25 PM Games
  {
    gameId: 'nfl_2025_w7_was_dal',
    homeScore: 44,
    awayScore: 22,
    coveredBy: 'home',
    status: 'final',
    notes: 'Cowboys offense explodes, Prescott 4 TDs'
  },

  {
    gameId: 'nfl_2025_w7_gb_ari',
    homeScore: 23,
    awayScore: 27,
    coveredBy: 'away',
    status: 'final',
    notes: 'Packers survive late rally in Arizona'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w7_atl_sf',
    homeScore: 20,
    awayScore: 10,
    coveredBy: 'home',
    status: 'final',
    notes: 'CMC dominates, 49ers defense stifles Falcons'
  },

  // Monday Night Football - October 20, 2025
  {
    gameId: 'nfl_2025_w7_tb_det',
    homeScore: 24,
    awayScore: 9,
    coveredBy: 'home',
    status: 'final',
    notes: 'Jahmyr Gibbs 218 yards, Lions dominate'
  },

  {
    gameId: 'nfl_2025_w7_hou_sea',
    homeScore: 27,
    awayScore: 19,
    coveredBy: 'home',
    status: 'final',
    notes: 'Seahawks overcome 4 turnovers to beat Texans'
  }
];

// Helper function to resolve all Week 7 games
export async function resolveWeek7() {
  const { resolveWeekFromScores } = await import('./gameResolution');
  return await resolveWeekFromScores(WEEK_7_SCORES_2025);
}