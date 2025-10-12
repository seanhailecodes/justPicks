// app/data/resolution/all-scores.ts
// Central registry for ALL game scores

import { GameScore } from './week1-scores-2025';
import { WEEK_1_SCORES_2025 } from './week1-scores-2025';
import { WEEK_2_SCORES_2025 } from './week2-scores-2025';
import { WEEK_5_SCORES_2025 } from './week5-scores-2025';
// Uncomment when files are created:
// import { WEEK_3_SCORES_2025 } from './week3-scores-2025';
// import { WEEK_4_SCORES_2025 } from './week4-scores-2025';
// import { WEEK_6_SCORES_2025 } from './week6-scores-2025';

// Registry for automatic lookup
export const ALL_SCORES_REGISTRY: Record<number, GameScore[]> = {
  1: WEEK_1_SCORES_2025,
  2: WEEK_2_SCORES_2025,
  5: WEEK_5_SCORES_2025,
  // Uncomment as you add scores:
  // 3: WEEK_3_SCORES_2025,
  // 4: WEEK_4_SCORES_2025,
  // 6: WEEK_6_SCORES_2025,
};

// Get scores for a specific week
export const getWeekScores = (weekNumber: number): GameScore[] | null => {
  return ALL_SCORES_REGISTRY[weekNumber] || null;
};

// Check if scores exist for a week
export const hasScoresForWeek = (weekNumber: number): boolean => {
  return weekNumber in ALL_SCORES_REGISTRY;
};

// Get all weeks that have scores
export const getAvailableScoreWeeks = (): number[] => {
  return Object.keys(ALL_SCORES_REGISTRY).map(Number).sort((a, b) => a - b);
};