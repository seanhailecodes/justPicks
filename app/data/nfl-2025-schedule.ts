// app/data/nfl-2025-schedule.ts
// Master file combining all NFL weeks

import { NFL_WEEK_1_2025, NFLGame } from './schedule/nfl-week1-2025';
import { NFL_WEEK_2_2025 } from './schedule/nfl-week2-2025';
import { NFL_WEEK_3_2025 } from './schedule/nfl-week3-2025';
import { NFL_WEEK_4_2025 } from './schedule/nfl-week4-2025';
import { NFL_WEEK_5_2025 } from './schedule/nfl-week5-2025';
import { NFL_WEEK_6_2025 } from './schedule/nfl-week6-2025';

// Re-export individual weeks for direct import
export { NFL_WEEK_1_2025, NFL_WEEK_2_2025, NFL_WEEK_3_2025, NFL_WEEK_4_2025, NFL_WEEK_5_2025, NFL_WEEK_6_2025 };

// Combine all weeks
export const NFL_2025_SCHEDULE: NFLGame[] = [
  ...NFL_WEEK_1_2025,
  ...NFL_WEEK_2_2025,
  ...NFL_WEEK_3_2025,
  ...NFL_WEEK_4_2025,
  ...NFL_WEEK_5_2025
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
];