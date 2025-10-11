import { supabase } from '../../lib/supabase';

export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  notes?: string;
}

interface Pick {
  id: string;
  game_id: string;
  team_picked: 'home' | 'away';
  confidence: string;
  spread_value?: number; 
}

interface GameResult {
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push'; 
  status: 'final' | 'cancelled';
}

function resolvePickResult(pick: Pick, gameResult: GameResult): 'win' | 'loss' | 'push' {
  if (gameResult.status === 'cancelled') return 'push';
  
  // If the game was a push, everyone gets a push regardless of their pick
  if (gameResult.coveredBy === 'push') return 'push';
  
  // Otherwise check if user's pick matches who covered
  return pick.team_picked === gameResult.coveredBy ? 'win' : 'loss';
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
    // Step 1: Update the game with final scores
    const result = await setGameResultManual(score.gameId, score.homeScore, score.awayScore);
    if (result.success) resolved++;
    
    // Step 2: Resolve all picks for this game (THIS IS MISSING!)
    const { data: picks } = await supabase
      .from('picks')
      .select('*')
      .eq('game_id', score.gameId);
    
    if (picks) {
      for (const pick of picks) {
        const pickResult = resolvePickResult(pick, {
            homeScore: score.homeScore,
            awayScore: score.awayScore,
            coveredBy: score.coveredBy, // ADD THIS LINE
            status: score.status
        });
        
        // Update the pick with the result
        await supabase
          .from('picks')
          .update({ status: pickResult })
          .eq('id', pick.id);
      }
    }
  }
  
  return { success: true, gamesResolved: resolved };
}
