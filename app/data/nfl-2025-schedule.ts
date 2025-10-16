// app/data/nfl-2025-schedule.ts
// Master file combining all NFL weeks

import { NFL_WEEK_1_2025, NFLGame } from './schedule/nfl-week1-2025';
import { NFL_WEEK_2_2025 } from './schedule/nfl-week2-2025';
import { NFL_WEEK_3_2025 } from './schedule/nfl-week3-2025';
import { NFL_WEEK_4_2025 } from './schedule/nfl-week4-2025';
import { NFL_WEEK_5_2025 } from './schedule/nfl-week5-2025';
import { NFL_WEEK_6_2025 } from './schedule/nfl-week6-2025';
import { NFL_WEEK_7_2025 } from './schedule/nfl-week7-2025';
// import { NFL_WEEK_8_2025 } from './schedule/nfl-week8-2025';
// import { NFL_WEEK_9_2025 } from './schedule/nfl-week9-2025';
// import { NFL_WEEK_10_2025 } from './schedule/nfl-week10-2025';
// import { NFL_WEEK_11_2025 } from './schedule/nfl-week11-2025';
// import { NFL_WEEK_12_2025 } from './schedule/nfl-week12-2025';
// import { NFL_WEEK_13_2025 } from './schedule/nfl-week13-2025';
// import { NFL_WEEK_14_2025 } from './schedule/nfl-week14-2025';
// import { NFL_WEEK_15_2025 } from './schedule/nfl-week15-2025';
// import { NFL_WEEK_16_2025 } from './schedule/nfl-week16-2025';
// import { NFL_WEEK_17_2025 } from './schedule/nfl-week17-2025';
// import { NFL_WEEK_18_2025 } from './schedule/nfl-week18-2025';

// Re-export individual weeks for direct import
export { NFL_WEEK_1_2025, NFL_WEEK_2_2025, NFL_WEEK_3_2025, NFL_WEEK_4_2025, NFL_WEEK_5_2025, NFL_WEEK_6_2025 };
//add week by week
// NFL_WEEK_7_2025, NFL_WEEK_8_2025, NFL_WEEK_9_2025, NFL_WEEK_10_2025, NFL_WEEK_11_2025, NFL_WEEK_12_2025, NFL_WEEK_13_2025, NFL_WEEK_14_2025, NFL_WEEK_15_2025, NFL_WEEK_16_2025, NFL_WEEK_17_2025, NFL_WEEK_18_2025

export const ALL_WEEKS_REGISTRY: Record<number, NFLGame[]> = {
  1: NFL_WEEK_1_2025,
  2: NFL_WEEK_2_2025,
  3: NFL_WEEK_3_2025,
  4: NFL_WEEK_4_2025,
  5: NFL_WEEK_5_2025,
  6: NFL_WEEK_6_2025,
  7: NFL_WEEK_7_2025,
  // 8: NFL_WEEK_8_2025,
  // 9: NFL_WEEK_9_2025,
  // 10: NFL_WEEK_10_2025,
  // 11: NFL_WEEK_11_2025,
  // 12: NFL_WEEK_12_2025,
  // 13: NFL_WEEK_13_2025,
  // 14: NFL_WEEK_14_2025,
  // 15: NFL_WEEK_15_2025,
  // 16: NFL_WEEK_16_2025,
  // 17: NFL_WEEK_17_2025,
  // 18: NFL_WEEK_18_2025,
  // Add new weeks here
};



// Combine all weeks
export const NFL_2025_SCHEDULE: NFLGame[] = [
  ...NFL_WEEK_1_2025,
  ...NFL_WEEK_2_2025,
  ...NFL_WEEK_3_2025,
  ...NFL_WEEK_4_2025,
  ...NFL_WEEK_5_2025,
  ...NFL_WEEK_6_2025,
  ...NFL_WEEK_7_2025,
  // ...NFL_WEEK_8_2025,
  // ...NFL_WEEK_9_2025,
  // ...NFL_WEEK_10_2025,
  // ...NFL_WEEK_11_2025,
  // ...NFL_WEEK_12_2025,
  // ...NFL_WEEK_13_2025,
  // ...NFL_WEEK_14_2025,
  // ...NFL_WEEK_15_2025,
  // ...NFL_WEEK_16_2025,
  // ...NFL_WEEK_17_2025,
  // ...NFL_WEEK_18_2025,
  // Add new weeks here
];

// Helper functions
export const getGamesByWeek = (week: number): NFLGame[] => {
  return NFL_2025_SCHEDULE.filter(game => game.week === week);
};

export const getGamesByDate = (date: string): NFLGame[] => {
  return NFL_2025_SCHEDULE.filter(game => game.date === date);
};

export const getGameById = (id: string): NFLGame | undefined => {
  return NFL_2025_SCHEDULE.find(game => game.id === id);
};

export const getWeekDates = (week: number): string[] => {
  const games = getGamesByWeek(week);
  const uniqueDates = [...new Set(games.map(game => game.date))];
  return uniqueDates.sort();
};

export const getWeekSchedule = (weekNumber: number): NFLGame[] => {
  return ALL_WEEKS_REGISTRY[weekNumber] || [];
};

export const hasScheduleForWeek = (weekNumber: number): boolean => {
  return weekNumber in ALL_WEEKS_REGISTRY && ALL_WEEKS_REGISTRY[weekNumber].length > 0;
};

export const getAvailableWeeks = (): number[] => {
  return Object.keys(ALL_WEEKS_REGISTRY).map(Number).sort((a, b) => a - b);
};


export const formatDateLabel = (date: string): string => {
  // Parse the date string properly (YYYY-MM-DD format)
  const [year, month, day] = date.split('-').map(Number);
  const d = new Date(year, month - 1, day); // month is 0-indexed in JS
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${months[d.getMonth()]} ${d.getDate()}`;
};

// Week info for navigation
export const WEEK_INFO = [
  { week: 1, label: 'Week 1', startDate: '2025-09-04', endDate: '2025-09-08' },
  { week: 2, label: 'Week 2', startDate: '2025-09-11', endDate: '2025-09-15' },
  { week: 3, label: 'Week 3', startDate: '2025-09-18', endDate: '2025-09-22' },
  { week: 4, label: 'Week 4', startDate: '2025-09-25', endDate: '2025-09-29' },
  { week: 5, label: 'Week 5', startDate: '2025-10-02', endDate: '2025-10-07' },   
  { week: 6, label: 'Week 6', startDate: '2025-10-09', endDate: '2025-10-16' },  
  { week: 7, label: 'Week 7', startDate: '2025-10-16', endDate: '2025-10-23' }, 
];