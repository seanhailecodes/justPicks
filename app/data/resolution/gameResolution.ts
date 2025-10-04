import { supabase } from '../../lib/supabase';

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
  notes?: string;
}

interface GameResult {
  homeScore: number;
  awayScore: number;
  status: 'final' | 'cancelled';
}

function resolvePickResult(pick: Pick, gameResult: GameResult): 'win' | 'loss' | 'push' {
  if (gameResult.status === 'cancelled') return 'push';
  
  const { homeScore, awayScore } = gameResult;
  const actualSpread = homeScore - awayScore; // Positive means home won by X
  
  if (pick.team_picked === 'home') {
    // User picked home team
    const coverMargin = actualSpread - pick.spread_value;
    if (coverMargin > 0) return 'win';
    if (coverMargin < 0) return 'loss';
    return 'push'; // Exactly hit the spread
  } else {
    // User picked away team  
    const coverMargin = (-actualSpread) - pick.spread_value;
    if (coverMargin > 0) return 'win';
    if (coverMargin < 0) return 'loss';
    return 'push';
  }

}
  
export async function setGameResultManual(
  gameId: string, 
  homeScore: number, 
  awayScore: number
) {
  // Update the game with final scores
  const { data, error } = await supabase
    .from('games')
    .update({
      home_score: homeScore,
      away_score: awayScore,
      game_status: 'final',
      resolved_at: new Date().toISOString()
    })
    .eq('id', gameId);

  if (error) {
    console.error('Error updating game:', error);
    return { success: false, error };
  }

  console.log(`Updated game ${gameId}: ${homeScore}-${awayScore}`);
  return { success: true, gameUpdated: true };
}

export async function resolveWeekFromScores(weekScores: GameScore[]) {
  console.log(`Starting resolution for ${weekScores.length} games...`);
  let resolved = 0;
  
  for (const score of weekScores) {
    const result = await setGameResultManual(score.gameId, score.homeScore, score.awayScore);
    if (result.success) resolved++;
  }
  
  return { success: true, gamesResolved: resolved };
}

