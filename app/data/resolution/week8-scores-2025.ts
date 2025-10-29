// app/data/resolution/week8-scores-2025.ts
// NFL Week 8 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_8_SCORES_2025: GameScore[] = [
  // Thursday Night Football - October 23, 2025
  {
    gameId: 'nfl_2025_w8_min_lac',
    homeScore: 37,
    awayScore: 10,
    status: 'final',
    notes: 'Chargers dominate at home, Herbert 3 TDs'
  },

  // Sunday Games - October 26, 2025
  {
    gameId: 'nfl_2025_w8_chi_bal',
    homeScore: 23,
    awayScore: 16,
    status: 'final',
    notes: 'Ravens first win in 42 days with Huntley'
  },

  {
    gameId: 'nfl_2025_w8_cle_ne',
    homeScore: 31,
    awayScore: 17,
    status: 'final',
    notes: 'Patriots fifth straight win'
  },

  {
    gameId: 'nfl_2025_w8_nyg_phi',
    homeScore: 38,
    awayScore: 20,
    status: 'final',
    notes: 'Eagles dominant, Barkley 2 TDs vs former team'
  },

  {
    gameId: 'nfl_2025_w8_sf_hou',
    homeScore: 26,
    awayScore: 15,
    status: 'final',
    notes: 'Texans control both lines, Stroud 318 yards'
  },

  {
    gameId: 'nfl_2025_w8_mia_atl',
    homeScore: 31,
    awayScore: 24,
    status: 'final',
    notes: 'Falcons home win, Robinson & London big games'
  },

  {
    gameId: 'nfl_2025_w8_nyj_cin',
    homeScore: 38,
    awayScore: 39,
    status: 'final',
    notes: 'Jets first win! 23 4th quarter points, Breece Hall throws TD'
  },

  {
    gameId: 'nfl_2025_w8_buf_car',
    homeScore: 42,
    awayScore: 17,
    status: 'final',
    notes: 'Bills cruise, James Cook 216 rushing yards'
  },

  {
    gameId: 'nfl_2025_w8_tb_no',
    homeScore: 27,
    awayScore: 14,
    status: 'final',
    notes: 'Bucs 4 takeaways, Saints bench Rattler for Shough'
  },

  {
    gameId: 'nfl_2025_w8_dal_den',
    homeScore: 44,
    awayScore: 24,
    status: 'final',
    notes: 'Broncos fifth straight win, embarrass Cowboys'
  },

  {
    gameId: 'nfl_2025_w8_ten_ind',
    homeScore: 38,
    awayScore: 14,
    status: 'final',
    notes: 'Colts seventh win, Taylor 153 yards 3 TDs'
  },

  // Sunday Night Football
  {
    gameId: 'nfl_2025_w8_gb_pit',
    homeScore: 35,
    awayScore: 25,
    status: 'final',
    notes: 'Packers surge past Steelers, Love 3 TDs to Kraft'
  },

  // Monday Night Football
  {
    gameId: 'nfl_2025_w8_was_kc',
    homeScore: 28,
    awayScore: 7,
    status: 'final',
    notes: 'Chiefs pull away, Mahomes 299 yards 3 TDs'
  }
];

// Helper function to resolve all Week 8 games
export async function resolveWeek8() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_8_SCORES_2025);
}