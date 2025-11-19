// app/data/resolution/gameResolution.ts
import { supabase } from '../../lib/supabase';

// NEW: Simplified interface - you only need to provide scores!
export interface GameScore {
  gameId: string;
  homeScore: number;
  awayScore: number;
  status?: 'final' | 'cancelled';
  notes?: string;
}

interface Pick {
  id: string;
  game_id: string;
  team_picked: 'home' | 'away';
  confidence: string;
  spread_value?: number;
  over_under_pick?: 'over' | 'under';
}

interface GameResult {
  homeScore: number;
  awayScore: number;
  coveredBy: 'home' | 'away' | 'push';
  status: 'final' | 'cancelled';
}

// NEW: Auto-calculate who covered the spread
function calculateCoveredBy(
  homeScore: number,
  awayScore: number,
  homeSpread: number
): 'home' | 'away' | 'push' {
  // Apply the spread to home team's score
  const homeWithSpread = homeScore + homeSpread;
  const scoreDiff = homeWithSpread - awayScore;
  
  if (scoreDiff > 0) return 'home';
  if (scoreDiff < 0) return 'away';
  return 'push';
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

function resolveOverUnderResult(
  overUnderPick: 'over' | 'under',
  totalPoints: number,
  overUnderLine: number
): 'win' | 'loss' | 'push' {
  // If total equals the line exactly, it's a push
  if (totalPoints === overUnderLine) return 'push';
  
  // Check if the pick was correct
  if (overUnderPick === 'over') {
    return totalPoints > overUnderLine ? 'win' : 'loss';
  } else {
    return totalPoints < overUnderLine ? 'win' : 'loss';
  }
}

export async function resolveWeekFromScores(weekScores: GameScore[]) {
  console.log(`Starting resolution for ${weekScores.length} games...`);
  let resolved = 0;
  
  for (const score of weekScores) {
    // Step 1: Get the game details (including spreads and over/under)
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('home_spread, away_spread, over_under_line')
      .eq('id', score.gameId)
      .single();
    
    if (gameError || !game) {
      console.error(`Error fetching game ${score.gameId}:`, gameError);
      continue;
    }
    
    // Step 2: Calculate who covered the spread
    const coveredBy = calculateCoveredBy(
      score.homeScore,
      score.awayScore,
      game.home_spread
    );
    
    console.log(`${score.gameId}: Home ${score.homeScore} - Away ${score.awayScore} | Spread: ${game.home_spread} | Covered by: ${coveredBy}`);
    
    // Step 3: Update the game with final scores
    const result = await setGameResultManual(score.gameId, score.homeScore, score.awayScore);
    if (result.success) resolved++;
    
    // Step 4: Calculate total points for over/under
    const totalPoints = score.homeScore + score.awayScore;
    const overUnderLine = game.over_under_line;
    
    // Step 5: Resolve all picks for this game
    const { data: picks } = await supabase
      .from('picks')
      .select('*')
      .eq('game_id', score.gameId);
    
    if (picks) {
      console.log(`  Resolving ${picks.length} picks...`);
      
      for (const pick of picks) {
        // Resolve spread pick
        const spreadResult = resolvePickResult(pick, {
          homeScore: score.homeScore,
          awayScore: score.awayScore,
          coveredBy: coveredBy,
          status: score.status || 'final'
        });
        
        // Resolve over/under pick (if they made one)
        let overUnderCorrect = null;
        if (pick.over_under_pick && overUnderLine) {
          const overUnderResult = resolveOverUnderResult(
            pick.over_under_pick,
            totalPoints,
            overUnderLine
          );
          overUnderCorrect = overUnderResult === 'win' ? true : overUnderResult === 'loss' ? false : null;
        }
        
        // Update the pick with both results
        await supabase
          .from('picks')
          .update({
            correct: spreadResult === 'win' ? true : spreadResult === 'loss' ? false : null,
            over_under_correct: overUnderCorrect
          })
          .eq('id', pick.id);
        
        console.log(`    Pick ${pick.id}: Spread=${spreadResult}, O/U=${overUnderCorrect === true ? 'win' : overUnderCorrect === false ? 'loss' : 'null'}`);
      }
    }
  }
  
  console.log(`✅ Resolution complete! Resolved ${resolved} games.`);
  return { success: true, gamesResolved: resolved };
}