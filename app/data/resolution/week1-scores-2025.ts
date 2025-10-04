// app/data/resolution/week1-scores-2025.ts
// NFL Week 1 2025 Final Scores for Resolution

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

export const WEEK_1_SCORES_2025: GameScore[] = [
  {
    gameId: '2025-W1-KC-LAC',
    homeScore: 28,
    awayScore: 24,
    status: 'final',
    notes: 'Chiefs covered -3.5'
  },
  {
    gameId: '2025-W1-DAL-PHI',
    homeScore: 21,
    awayScore: 28,
    status: 'final',
    notes: 'Cowboys upset as road favorites'
  },
  {
    gameId: '2025-W1-CAR-JAX',
    homeScore: 17,
    awayScore: 14,
    status: 'final',
    notes: 'Jaguars covered spread'
  },
  {
    gameId: '2025-W1-MIA-IND',
    homeScore: 31,
    awayScore: 24,
    status: 'final',
    notes: 'Colts covered at home'
  },
  {
    gameId: '2025-W1-LV-NE',
    homeScore: 20,
    awayScore: 17,
    status: 'final',
    notes: 'Patriots narrow home win'
  },
  {
    gameId: '2025-W1-BUF-NYJ',
    homeScore: 27,
    awayScore: 35,
    status: 'final',
    notes: 'Bills road win'
  },
  {
    gameId: '2025-W1-GB-MIN',
    homeScore: 24,
    awayScore: 21,
    status: 'final',
    notes: 'Vikings home victory'
  },
  {
    gameId: '2025-W1-HOU-BAL',
    homeScore: 28,
    awayScore: 31,
    status: 'final',
    notes: 'Texans road upset'
  },
  {
    gameId: '2025-W1-CIN-CLE',
    homeScore: 14,
    awayScore: 21,
    status: 'final',
    notes: 'Bengals road win in division'
  },
  {
    gameId: '2025-W1-DET-TB',
    homeScore: 28,
    awayScore: 24,
    status: 'final',
    notes: 'Lions covered spread'
  },
  {
    gameId: '2025-W1-NO-ATL',
    homeScore: 31,
    awayScore: 27,
    status: 'final',
    notes: 'Falcons home win in OT'
  },
  {
    gameId: '2025-W1-ARI-SEA',
    homeScore: 21,
    awayScore: 17,
    status: 'final',
    notes: 'Seahawks covered at home'
  },
  {
    gameId: '2025-W1-WAS-NYG',
    homeScore: 24,
    awayScore: 20,
    status: 'final',
    notes: 'Giants narrow home win'
  },
  {
    gameId: '2025-W1-CHI-SF',
    homeScore: 35,
    awayScore: 28,
    status: 'final',
    notes: '49ers home win, high scoring'
  },
  {
    gameId: '2025-W1-PIT-DEN',
    homeScore: 17,
    awayScore: 21,
    status: 'final',
    notes: 'Steelers road upset'
  },
  {
    gameId: '2025-W1-LAR-TEN',
    homeScore: 24,
    awayScore: 28,
    status: 'final',
    notes: 'Rams road victory'
  }
];

// Helper function to resolve all Week 1 games
export async function resolveWeek1() {
  const { resolveWeekFromScores } = await import('../resolution/gameResolution');
  return await resolveWeekFromScores(WEEK_1_SCORES_2025);
}