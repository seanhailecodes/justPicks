// app/data/resolution/week14-scores-2025.ts
// NFL Week 14 2025 Final Scores for Resolution
// Source: ESPN (December 2025)

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_14_SCORES_2025: GameScore[] = [
  // Thursday Night Football - December 4, 2025
  {
    gameId: 'nfl_2025_w14_dal_det',
    homeScore: 44,
    awayScore: 30,
    coveredBy: 'home', // DET -3.5, won by 14 ✓
    status: 'final',
    notes: 'Lions dominate Cowboys at home'
  },

  // Sunday Early Games - December 7, 2025
  {
    gameId: 'nfl_2025_w14_sea_atl',
    homeScore: 9,
    awayScore: 37,
    coveredBy: 'away', // SEA -7, won by 28 ✓
    status: 'final',
    notes: 'Seahawks blow out Falcons'
  },

  {
    gameId: 'nfl_2025_w14_cin_buf',
    homeScore: 39,
    awayScore: 34,
    coveredBy: 'away', // BUF -5.5, won by 5 (CIN covered)
    status: 'final',
    notes: 'Bills win but Bengals cover'
  },

  {
    gameId: 'nfl_2025_w14_ten_cle',
    homeScore: 29,
    awayScore: 31,
    coveredBy: 'away', // CLE -4.5, lost by 2 (TEN covered)
    status: 'final',
    notes: 'Titans upset Browns in Cleveland'
  },

  {
    gameId: 'nfl_2025_w14_was_min',
    homeScore: 31,
    awayScore: 0,
    coveredBy: 'home', // MIN -1.5, won by 31 ✓
    status: 'final',
    notes: 'Vikings shutout Commanders'
  },

  {
    gameId: 'nfl_2025_w14_mia_nyj',
    homeScore: 10,
    awayScore: 34,
    coveredBy: 'away', // MIA -2.5, won by 24 ✓
    status: 'final',
    notes: 'Dolphins crush Jets'
  },

  {
    gameId: 'nfl_2025_w14_no_tb',
    homeScore: 20,
    awayScore: 24,
    coveredBy: 'away', // TB -8.5, lost by 4 (NO covered)
    status: 'final',
    notes: 'Saints upset Bucs on the road'
  },

  {
    gameId: 'nfl_2025_w14_ind_jax',
    homeScore: 36,
    awayScore: 19,
    coveredBy: 'home', // JAX -1.5, won by 17 ✓
    status: 'final',
    notes: 'Jaguars dominate Colts at home'
  },

  {
    gameId: 'nfl_2025_w14_pit_bal',
    homeScore: 22,
    awayScore: 27,
    coveredBy: 'away', // BAL -5.5, lost by 5 (PIT covered)
    status: 'final',
    notes: 'Steelers win in Baltimore'
  },

  // Sunday Afternoon Games
  {
    gameId: 'nfl_2025_w14_den_lv',
    homeScore: 17,
    awayScore: 24,
    coveredBy: 'home', // DEN -7.5, won by 7 (LV covered)
    status: 'final',
    notes: 'Broncos win but Raiders cover'
  },

  {
    gameId: 'nfl_2025_w14_chi_gb',
    homeScore: 28,
    awayScore: 21,
    coveredBy: 'home', // GB -6.5, won by 7 ✓
    status: 'final',
    notes: 'Packers edge Bears at Lambeau'
  },

  {
    gameId: 'nfl_2025_w14_lar_ari',
    homeScore: 17,
    awayScore: 45,
    coveredBy: 'away', // LAR -7, won by 28 ✓
    status: 'final',
    notes: 'Rams demolish Cardinals'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w14_hou_kc',
    homeScore: 10,
    awayScore: 20,
    coveredBy: 'away', // KC -3.5, lost by 10 (HOU covered)
    status: 'final',
    notes: 'Texans upset Chiefs; KC playoff hopes in jeopardy'
  },

  // Monday Night Football - December 8, 2025
  {
    gameId: 'nfl_2025_w14_phi_lac',
    homeScore: 22,
    awayScore: 19,
    coveredBy: 'home', // PHI -2.5, lost by 3 (LAC covered)
    status: 'final',
    notes: 'Chargers win in OT'
  }
];

// Week 14 Byes: NE, NYG, SF, CAR
export const WEEK_14_BYES = ["NE", "NYG", "SF", "CAR"];

// Helper function to resolve all Week 14 games
export async function resolveWeek14() {
  const { resolveWeekFromScores } = await import('./gameResolution');
  return await resolveWeekFromScores(WEEK_14_SCORES_2025);
}