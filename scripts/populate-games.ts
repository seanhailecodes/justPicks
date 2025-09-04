import { supabase } from '../lib/supabase';
import { NFL_WEEK_1_2025 } from '../app/data/nfl-week1-2025';
import { NFL_WEEK_2_2025 } from '../app/data/nfl-week2-2025';
import { NFL_WEEK_3_2025 } from '../app/data/nfl-week3-2025';
import { NFL_WEEK_4_2025 } from '../app/data/nfl-week4-2025';
// import { NFL_WEEK_5_2025 } from '../app/data/nfl-week5-2025';
// import { NFL_WEEK_6_2025 } from '../app/data/nfl-week6-2025';
// import { NFL_WEEK_7_2025 } from '../app/data/nfl-week7-2025';
// import { NFL_WEEK_8_2025 } from '../app/data/nfl-week8-2025';
// import { NFL_WEEK_9_2025 } from '../app/data/nfl-week9-2025';
// import { NFL_WEEK_10_2025 } from '../app/data/nfl-week10-2025';
// import { NFL_WEEK_11_2025 } from '../app/data/nfl-week11-2025';
// import { NFL_WEEK_12_2025 } from '../app/data/nfl-week12-2025';
// import { NFL_WEEK_13_2025 } from '../app/data/nfl-week13-2025';
// import { NFL_WEEK_14_2025 } from '../app/data/nfl-week14-2025';
// import { NFL_WEEK_15_2025 } from '../app/data/nfl-week15-2025';
// import { NFL_WEEK_16_2025 } from '../app/data/nfl-week16-2025';
// import { NFL_WEEK_17_2025 } from '../app/data/nfl-week17-2025';

async function populateGames() {
  console.log('Starting game population...');
  
  // Combine all weeks
  const allGames = [
    ...NFL_WEEK_1_2025,
    ...NFL_WEEK_2_2025,
    ...NFL_WEEK_3_2025,
    ...NFL_WEEK_4_2025,
    // Add more weeks here
  ];
  
  // Transform to match your games table
  const games = allGames.map(game => ({
    id: game.id,
    week: game.week,
    season: 2025,
    home_team: game.homeTeamShort,
    away_team: game.awayTeamShort,
    game_time: new Date(`${game.date} ${game.time}`).toISOString(),
    game_date: new Date(`${game.date} ${game.time} EST`).toISOString(),
    // Add other fields based on your table structure
  }));

  // Insert in batches of 100 to avoid timeout
  const batchSize = 100;
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);
    
    const { data, error } = await supabase
      .from('games')
      .upsert(batch)
      .select();

    if (error) {
      console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
    } else {
      console.log(`Inserted batch ${i / batchSize + 1}: ${data.length} games`);
    }
  }
  
  console.log(`Total games processed: ${games.length}`);
}

populateGames();