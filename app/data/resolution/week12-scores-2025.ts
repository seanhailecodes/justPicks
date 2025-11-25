// app/data/resolution/week12-scores-2025.ts
// NFL Week 12 2025 ACTUAL Final Scores for Resolution
// Source: ESPN, CBS Sports, FOX Sports (verified via web search)

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_12_SCORES_2025: GameScore[] = [
  // Thursday Night Football - November 20, 2025
  {
    gameId: 'nfl_2025_w12_buf_hou',
    homeScore: 23,
    awayScore: 19,
    coveredBy: 'home',  // HOU -3.5, won by 4
    status: 'final',
    notes: 'Texans defense with 8 sacks on Allen'
  },

  // Sunday Games - November 23, 2025
  {
    gameId: 'nfl_2025_w12_nyj_bal',
    homeScore: 23,
    awayScore: 10,
    coveredBy: 'away',  // BAL -7, won by 13
    status: 'final',
    notes: 'Derrick Henry 2 rushing TDs'
  },

  {
    gameId: 'nfl_2025_w12_pit_chi',
    homeScore: 31,
    awayScore: 28,
    coveredBy: 'push',  // CHI -3, won by 3
    status: 'final',
    notes: 'Bears hold on with Caleb Williams'
  },

  {
    gameId: 'nfl_2025_w12_ne_cin',
    homeScore: 20,
    awayScore: 26,
    coveredBy: 'home',  // NE -7.5, won by 6
    status: 'final',
    notes: 'Patriots win 9th straight'
  },

  {
    gameId: 'nfl_2025_w12_nyg_det',
    homeScore: 34,
    awayScore: 27,
    coveredBy: 'away',  // DET -13.5, won by 7 in OT
    status: 'final',
    notes: 'Gibbs 69-yard OT touchdown'
  },

  {
    gameId: 'nfl_2025_w12_min_gb',
    homeScore: 23,
    awayScore: 6,
    coveredBy: 'home',  // GB -6.5, won by 17
    status: 'final',
    notes: 'Packers defense dominates Vikings'
  },

  {
    gameId: 'nfl_2025_w12_ind_kc',
    homeScore: 23,
    awayScore: 20,
    coveredBy: 'away',  // KC +3, won by 3 in OT
    status: 'final',
    notes: 'Chiefs comeback from 11 down in 4th'
  },

  {
    gameId: 'nfl_2025_w12_sea_ten',
    homeScore: 24,
    awayScore: 30,
    coveredBy: 'push',  // SEA -6, won by 6
    status: 'final',
    notes: 'Smith-Njigba 167 yards, 2 TDs'
  },

  {
    gameId: 'nfl_2025_w12_cle_lv',
    homeScore: 10,
    awayScore: 24,
    coveredBy: 'away',  // CLE -10, won by 14
    status: 'final',
    notes: 'Shedeur Sanders first NFL win'
  },

  {
    gameId: 'nfl_2025_w12_atl_no',
    homeScore: 10,
    awayScore: 24,
    coveredBy: 'away',  // ATL -3.5, won by 14
    status: 'final',
    notes: 'Cousins 2 TD passes in win'
  },

  {
    gameId: 'nfl_2025_w12_jax_ari',
    homeScore: 24,
    awayScore: 27,
    coveredBy: 'away',  // ARI +2.5, lost by 3 in OT
    status: 'final',
    notes: 'Jags overcome 3 Lawrence INTs'
  },

  {
    gameId: 'nfl_2025_w12_phi_dal',
    homeScore: 24,
    awayScore: 21,
    coveredBy: 'home',  // DAL +4.5, won by 3
    status: 'final',
    notes: 'Cowboys 24 unanswered points'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w12_tb_lar',
    homeScore: 34,
    awayScore: 7,
    coveredBy: 'home',  // LAR -7.5, won by 27
    status: 'final',
    notes: 'Stafford 3 TDs, Rams to 9-2'
  },

  // Monday Night Football
  {
    gameId: 'nfl_2025_w12_car_sf',
    homeScore: 20,
    awayScore: 9,
    coveredBy: 'home',  // SF -7, won by 11
    status: 'final',
    notes: 'McCaffrey vs former team, Purdy 3 INTs'
  }
];

// Teams on bye Week 12: Denver Broncos, Los Angeles Chargers, Miami Dolphins, Washington Commanders

// Helper function to resolve all Week 12 games
export async function resolveWeek12() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_12_SCORES_2025);
}