// app/data/resolution/week10-scores-2025.ts
// NFL Week 10 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_10_SCORES_2025: GameScore[] = [
  // Thursday Night Football - November 6, 2025
  {
    gameId: 'nfl_2025_w10_lv_den',
    homeScore: 10,
    awayScore: 7,
    status: 'final',
    notes: 'Broncos ugly win extends streak to 7',
  },

  // Sunday International - November 9, 2025
  {
    gameId: 'nfl_2025_w10_atl_ind',
    homeScore: 31,
    awayScore: 25,
    status: 'final',
    notes: 'Colts win in OT as Taylor rushes for 244'
  },

  // Sunday 1:00 PM ET - November 9, 2025
  {
    gameId: 'nfl_2025_w10_nyg_chi',
    homeScore: 24,
    awayScore: 20,
    status: 'final',
    notes: 'Bears rally late as Williams leads comeback'
  },

  {
    gameId: 'nfl_2025_w10_mia_buf',
    homeScore: 13,
    awayScore: 30,
    status: 'final',
    notes: 'Dolphins shock Bills, snap 7-game losing streak'
  },

  {
    gameId: 'nfl_2025_w10_ne_tb',
    homeScore: 23,
    awayScore: 28,
    status: 'final',
    notes: 'Patriots upset Bucs behind Drake Maye'
  },

  {
    gameId: 'nfl_2025_w10_no_car',
    homeScore: 7,
    awayScore: 17,
    status: 'final',
    notes: 'Saints rookie Tyler Shough leads upset'
  },

  {
    gameId: 'nfl_2025_w10_jax_hou',
    homeScore: 30,
    awayScore: 29,
    status: 'final',
    notes: 'Texans epic comeback from 29-10 down'
  },

  {
    gameId: 'nfl_2025_w10_bal_min',
    homeScore: 19,
    awayScore: 27,
    status: 'final',
    notes: 'Ravens win 3rd straight behind Jackson'
  },

  {
    gameId: 'nfl_2025_w10_cle_nyj',
    homeScore: 27,
    awayScore: 20,
    status: 'final',
    notes: 'Jets win with 2 special teams TDs'
  },

  // Sunday 4:05/4:25 PM ET - November 9, 2025
  {
    gameId: 'nfl_2025_w10_ari_sea',
    homeScore: 44,
    awayScore: 22,
    status: 'final',
    notes: 'Seahawks dominate for 4th straight win'
  },

  {
    gameId: 'nfl_2025_w10_sf_lar',
    homeScore: 42,
    awayScore: 26,
    status: 'final',
    notes: 'Rams roll as Stafford throws 4 TDs'
  },

  {
    gameId: 'nfl_2025_w10_det_was',
    homeScore: 22,
    awayScore: 44,
    status: 'final',
    notes: 'Lions dominant offensive display'
  },

  // Sunday Night Football - November 9, 2025
  {
    gameId: 'nfl_2025_w10_pit_lac',
    homeScore: 25,
    awayScore: 10,
    status: 'final',
    notes: 'Chargers cruise past Steelers'
  },

  // Monday Night Football - November 10, 2025
  {
    gameId: 'nfl_2025_w10_phi_gb',
    homeScore: 7,
    awayScore: 10,
    status: 'final',
    notes: 'Eagles win defensive battle at Lambeau'
  }
];

// Helper function to resolve all Week 10 games
export async function resolveWeek10() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_10_SCORES_2025);
}