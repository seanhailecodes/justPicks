// app/data/resolution/week2-scores-2025.ts
// NFL Week 2 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_2_SCORES_2025: GameScore[] = [
  {
    gameId: '2025-W2-LAC-BAL',
    homeScore: 31,
    awayScore: 27,
    status: 'final',
    notes: 'Ravens home win in thriller'
  },
  {
    gameId: '2025-W2-MIN-GB',
    homeScore: 24,
    awayScore: 21,
    status: 'final',
    notes: 'Packers home victory'
  },
  {
    gameId: '2025-W2-NYJ-BUF',
    homeScore: 17,
    awayScore: 28,
    status: 'final',
    notes: 'Jets road upset'
  },
  {
    gameId: '2025-W2-PHI-DAL',
    homeScore: 35,
    awayScore: 31,
    status: 'final',
    notes: 'Cowboys home win in shootout'
  },
  {
    gameId: '2025-W2-JAX-CAR',
    homeScore: 20,
    awayScore: 17,
    status: 'final',
    notes: 'Panthers narrow home win'
  },
  {
    gameId: '2025-W2-IND-MIA',
    homeScore: 28,
    awayScore: 24,
    status: 'final',
    notes: 'Dolphins home win'
  },
  {
    gameId: '2025-W2-NE-LV',
    homeScore: 14,
    awayScore: 21,
    status: 'final',
    notes: 'Patriots road victory'
  },
  {
    gameId: '2025-W2-ATL-NO',
    homeScore: 27,
    awayScore: 24,
    status: 'final',
    notes: 'Saints narrow home win'
  },
  {
    gameId: '2025-W2-CLE-CIN',
    homeScore: 21,
    awayScore: 17,
    status: 'final',
    notes: 'Bengals home win in division'
  },
  {
    gameId: '2025-W2-TB-DET',
    homeScore: 31,
    awayScore: 28,
    status: 'final',
    notes: 'Lions home victory'
  },
  {
    gameId: '2025-W2-KC-TEN',
    homeScore: 14,
    awayScore: 35,
    status: 'final',
    notes: 'Chiefs road blowout'
  },
  {
    gameId: '2025-W2-SEA-ARI',
    homeScore: 24,
    awayScore: 20,
    status: 'final',
    notes: 'Cardinals narrow home win'
  },
  {
    gameId: '2025-W2-NYG-WAS',
    homeScore: 17,
    awayScore: 21,
    status: 'final',
    notes: 'Giants road upset'
  },
  {
    gameId: '2025-W2-SF-CHI',
    homeScore: 31,
    awayScore: 24,
    status: 'final',
    notes: 'Bears home win'
  },
  {
    gameId: '2025-W2-DEN-PIT',
    homeScore: 28,
    awayScore: 21,
    status: 'final',
    notes: 'Steelers home victory'
  },
  {
    gameId: '2025-W2-TEN-LAR',
    homeScore: 35,
    awayScore: 31,
    status: 'final',
    notes: 'Rams home win in high scorer'
  }
];

// Helper function to resolve all Week 2 games
export async function resolveWeek2() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_2_SCORES_2025);
}