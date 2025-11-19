// app/data/resolution/resolveAllWeeks.ts
// One-time script to resolve all past weeks using the registry

import { resolveWeekFromScores } from './gameResolution';
import { getAvailableScoreWeeks, getWeekScores } from './allScores';

export async function resolveAllPastWeeks() {
  console.log('🔄 Starting resolution for all past weeks...\n');
  
  // Get all weeks that have scores files
  const availableWeeks = getAvailableScoreWeeks();
  
  console.log(`Found score files for ${availableWeeks.length} weeks: ${availableWeeks.join(', ')}`);
  
  let totalGamesResolved = 0;
  const results = [];
  
  for (const weekNum of availableWeeks) {
    try {
      console.log(`\n📅 Resolving Week ${weekNum}...`);
      const scores = getWeekScores(weekNum);
      
      if (!scores || scores.length === 0) {
        console.log(`⚠️ Week ${weekNum}: No scores found, skipping`);
        continue;
      }
      
      const result = await resolveWeekFromScores(scores);
      
      if (result.success) {
        console.log(`✅ Week ${weekNum}: Resolved ${result.gamesResolved} games`);
        totalGamesResolved += result.gamesResolved;
        results.push({ week: weekNum, success: true, games: result.gamesResolved });
      } else {
        console.log(`❌ Week ${weekNum}: Failed`);
        results.push({ week: weekNum, success: false, games: 0 });
      }
    } catch (error) {
      console.error(`❌ Week ${weekNum} error:`, error);
      results.push({ week: weekNum, success: false, games: 0, error: error.message });
    }
  }
  
  console.log('\n\n🎉 ====== RESOLUTION COMPLETE ======');
  console.log(`Total games resolved: ${totalGamesResolved}`);
  console.log(`Weeks processed: ${availableWeeks.join(', ')}`);
  console.log('\nResults by week:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} Week ${r.week}: ${r.games} games${r.error ? ` (${r.error})` : ''}`);
  });
  
  return {
    success: true,
    totalGamesResolved,
    weeksProcessed: availableWeeks.length,
    weekResults: results
  };
}