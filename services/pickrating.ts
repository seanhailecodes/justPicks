import { supabase } from '../app/lib/supabase';

/**
 * Pick rating system - calculates user ratings based on:
 * - Correct picks (60-70% weight)
 * - Total picks made (15-20% weight) 
 * - Recency (10-15% weight)
 * - Confidence impact (varies by correctness)
 * 
 * Sport-aware timeframes:
 * - Week-based sports (NFL, NCAAF): Uses actual week numbers
 * - Date-based sports (NBA, WNBA, etc.): Uses rolling date windows
 * - Event-based sports (UFC, Boxing, PGA): Uses event/tournament windows
 */

// ============================================
// SPORT CONFIGURATION
// ============================================

export type Sport = 
  // Football (week-based)
  | 'nfl' 
  | 'ncaaf'
  // Basketball (date-based)
  | 'nba' 
  | 'wnba' 
  | 'ncaab'
  // Other team sports (date-based)
  | 'mlb' 
  | 'nhl'
  // Soccer (matchday-based, treated as week-based)
  | 'soccer_epl'      // English Premier League
  | 'soccer_laliga'   // La Liga
  | 'soccer_bundesliga'
  | 'soccer_seriea'
  | 'soccer_ligue1'
  | 'soccer_mls'
  | 'soccer_champions_league'
  | 'soccer_world_cup'
  // Combat sports (event-based)
  | 'ufc'
  | 'boxing'
  // Golf (tournament-based)
  | 'pga'
  | 'lpga'
  // Tennis (tournament-based)
  | 'tennis_atp'
  | 'tennis_wta'
  // Motorsports (event-based)
  | 'f1'
  | 'nascar';

// Scheduling model for each sport
type ScheduleModel = 'week' | 'date' | 'event';

interface SportConfig {
  name: string;
  shortName: string;
  scheduleModel: ScheduleModel;
  seasonLength: number;        // days for date-based, weeks for week-based
  weekLabel: string;           // "Week", "Matchday", "Round", etc.
  appStateKey?: string;        // key in app_state table for current week (if week-based)
}

const SPORT_CONFIG: Record<Sport, SportConfig> = {
  // Football - Week-based
  nfl: {
    name: 'NFL',
    shortName: 'NFL',
    scheduleModel: 'week',
    seasonLength: 18,
    weekLabel: 'Week',
    appStateKey: 'current_week'
  },
  ncaaf: {
    name: 'College Football',
    shortName: 'NCAAF',
    scheduleModel: 'week',
    seasonLength: 15,
    weekLabel: 'Week',
    appStateKey: 'current_ncaaf_week'
  },

  // Basketball - Date-based
  nba: {
    name: 'NBA',
    shortName: 'NBA',
    scheduleModel: 'date',
    seasonLength: 180,  // ~6 months
    weekLabel: 'Days'
  },
  wnba: {
    name: 'WNBA',
    shortName: 'WNBA',
    scheduleModel: 'date',
    seasonLength: 120,  // ~4 months
    weekLabel: 'Days'
  },
  ncaab: {
    name: 'College Basketball',
    shortName: 'NCAAB',
    scheduleModel: 'date',
    seasonLength: 150,  // ~5 months
    weekLabel: 'Days'
  },

  // Other team sports - Date-based
  mlb: {
    name: 'MLB',
    shortName: 'MLB',
    scheduleModel: 'date',
    seasonLength: 180,
    weekLabel: 'Days'
  },
  nhl: {
    name: 'NHL',
    shortName: 'NHL',
    scheduleModel: 'date',
    seasonLength: 180,
    weekLabel: 'Days'
  },

  // Soccer - Matchday-based (treated as week-based)
  soccer_epl: {
    name: 'English Premier League',
    shortName: 'EPL',
    scheduleModel: 'week',
    seasonLength: 38,
    weekLabel: 'Matchday',
    appStateKey: 'current_epl_matchday'
  },
  soccer_laliga: {
    name: 'La Liga',
    shortName: 'La Liga',
    scheduleModel: 'week',
    seasonLength: 38,
    weekLabel: 'Matchday',
    appStateKey: 'current_laliga_matchday'
  },
  soccer_bundesliga: {
    name: 'Bundesliga',
    shortName: 'Bundesliga',
    scheduleModel: 'week',
    seasonLength: 34,
    weekLabel: 'Matchday',
    appStateKey: 'current_bundesliga_matchday'
  },
  soccer_seriea: {
    name: 'Serie A',
    shortName: 'Serie A',
    scheduleModel: 'week',
    seasonLength: 38,
    weekLabel: 'Matchday',
    appStateKey: 'current_seriea_matchday'
  },
  soccer_ligue1: {
    name: 'Ligue 1',
    shortName: 'Ligue 1',
    scheduleModel: 'week',
    seasonLength: 38,
    weekLabel: 'Matchday',
    appStateKey: 'current_ligue1_matchday'
  },
  soccer_mls: {
    name: 'MLS',
    shortName: 'MLS',
    scheduleModel: 'week',
    seasonLength: 34,
    weekLabel: 'Week',
    appStateKey: 'current_mls_week'
  },
  soccer_champions_league: {
    name: 'UEFA Champions League',
    shortName: 'UCL',
    scheduleModel: 'week',
    seasonLength: 13,  // Group stage + knockouts
    weekLabel: 'Matchday',
    appStateKey: 'current_ucl_matchday'
  },
  soccer_world_cup: {
    name: 'FIFA World Cup',
    shortName: 'World Cup',
    scheduleModel: 'week',
    seasonLength: 7,  // Group stage + knockouts
    weekLabel: 'Matchday',
    appStateKey: 'current_worldcup_matchday'
  },

  // Combat sports - Event-based
  ufc: {
    name: 'UFC',
    shortName: 'UFC',
    scheduleModel: 'event',
    seasonLength: 365,
    weekLabel: 'Event'
  },
  boxing: {
    name: 'Boxing',
    shortName: 'Boxing',
    scheduleModel: 'event',
    seasonLength: 365,
    weekLabel: 'Event'
  },

  // Golf - Tournament-based
  pga: {
    name: 'PGA Tour',
    shortName: 'PGA',
    scheduleModel: 'event',
    seasonLength: 300,
    weekLabel: 'Tournament'
  },
  lpga: {
    name: 'LPGA Tour',
    shortName: 'LPGA',
    scheduleModel: 'event',
    seasonLength: 300,
    weekLabel: 'Tournament'
  },

  // Tennis - Tournament-based
  tennis_atp: {
    name: 'ATP Tour',
    shortName: 'ATP',
    scheduleModel: 'event',
    seasonLength: 330,
    weekLabel: 'Tournament'
  },
  tennis_wta: {
    name: 'WTA Tour',
    shortName: 'WTA',
    scheduleModel: 'event',
    seasonLength: 330,
    weekLabel: 'Tournament'
  },

  // Motorsports - Event-based
  f1: {
    name: 'Formula 1',
    shortName: 'F1',
    scheduleModel: 'event',
    seasonLength: 280,
    weekLabel: 'Race'
  },
  nascar: {
    name: 'NASCAR',
    shortName: 'NASCAR',
    scheduleModel: 'event',
    seasonLength: 300,
    weekLabel: 'Race'
  }
};

// Helper to get sport config
export function getSportConfig(sport: Sport): SportConfig {
  return SPORT_CONFIG[sport];
}

// Helper to get all sports by category
export function getSportsByCategory(): Record<string, Sport[]> {
  return {
    football: ['nfl', 'ncaaf'],
    basketball: ['nba', 'wnba', 'ncaab'],
    baseball: ['mlb'],
    hockey: ['nhl'],
    soccer: [
      'soccer_epl', 'soccer_laliga', 'soccer_bundesliga', 
      'soccer_seriea', 'soccer_ligue1', 'soccer_mls',
      'soccer_champions_league', 'soccer_world_cup'
    ],
    combat: ['ufc', 'boxing'],
    golf: ['pga', 'lpga'],
    tennis: ['tennis_atp', 'tennis_wta'],
    motorsports: ['f1', 'nascar']
  };
}

// ============================================
// INTERFACES
// ============================================

export interface PickStats {
  userId: string;
  username: string;
  correctPicks: number;
  incorrectPicks: number;
  totalPicks: number;
  pendingPicks: number;
  confidenceImpact: number;
  daysSinceLastPick: number;
  lastPickDate: string | null;
  rating: number;
}

export interface UserRatingData {
  userId: string;
  username: string;
  email: string;
  weekStats: PickStats;
  monthStats: PickStats;
  allTimeStats: PickStats;
  isAnonymized?: boolean;
  displayName?: string;
}

export interface LeaderboardUser {
  userId: string;
  displayName: string;
  isAnonymized: boolean;
  rating: number;
  totalPicks: number;
  correctPicks: number;
  incorrectPicks: number;
  pendingPicks: number;
  winRate: number;
  lastPickDate: string | null;
  rank: number;
}

// ============================================
// CACHING
// ============================================

// Cache for current week/matchday per sport
const weekCache: Record<string, { week: number; fetchedAt: number }> = {};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get current week/matchday for a week-based sport
 */
async function getCurrentWeek(sport: Sport): Promise<number> {
  const config = SPORT_CONFIG[sport];
  
  if (config.scheduleModel !== 'week' || !config.appStateKey) {
    return 1; // Default for non-week-based sports
  }

  const cacheKey = config.appStateKey;
  
  // Return cached value if still valid
  if (weekCache[cacheKey] && Date.now() - weekCache[cacheKey].fetchedAt < CACHE_TTL) {
    return weekCache[cacheKey].week;
  }

  try {
    const { data, error } = await supabase
      .from('app_state')
      .select(config.appStateKey)
      .single();

    if (error) {
      console.error(`Error fetching current week for ${sport}:`, error);
      return 1;
    }

    const week = data?.[config.appStateKey] || 1;
    
    weekCache[cacheKey] = {
      week,
      fetchedAt: Date.now()
    };

    return week;
  } catch (error) {
    console.error(`Error in getCurrentWeek for ${sport}:`, error);
    return 1;
  }
}

// ============================================
// CONFIDENCE MULTIPLIERS
// ============================================

function getConfidenceMultiplier(confidence: string, isCorrect: boolean): number {
  const confidenceLevel = confidence?.toLowerCase() || 'medium';
  
  if (isCorrect) {
    switch (confidenceLevel) {
      case 'very high':
      case 'high':
        return 1.2;
      case 'medium':
        return 1.0;
      case 'low':
        return 0.6;
      default:
        return 1.0;
    }
  } else {
    switch (confidenceLevel) {
      case 'very high':
      case 'high':
        return -1.0;
      case 'medium':
        return -0.5;
      case 'low':
        return -0.3;
      default:
        return -0.5;
    }
  }
}

// ============================================
// PRIVACY HELPERS
// ============================================

export async function getUserFriends(userId: string): Promise<string[]> {
  try {
    const { data: friendships, error } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching friends:', error);
      return [];
    }

    return (friendships || []).map(f => f.friend_id);
  } catch (error) {
    console.error('Error in getUserFriends:', error);
    return [];
  }
}

export async function getUserGroups(userId: string): Promise<string[]> {
  try {
    const { data: groupMemberships, error } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching user groups:', error);
      return [];
    }

    return (groupMemberships || []).map(g => g.group_id);
  } catch (error) {
    console.error('Error in getUserGroups:', error);
    return [];
  }
}

export async function getSharedGroups(
  userId1: string,
  userId2: string
): Promise<string[]> {
  try {
    const groups1 = await getUserGroups(userId1);
    const groups2 = await getUserGroups(userId2);

    const shared = groups1.filter(g => groups2.includes(g));
    return shared;
  } catch (error) {
    console.error('Error in getSharedGroups:', error);
    return [];
  }
}

export async function isUserKnown(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('friend_id', targetUserId)
      .eq('status', 'accepted')
      .single();

    if (!friendError && friendship) {
      return true;
    }

    const sharedGroups = await getSharedGroups(currentUserId, targetUserId);
    return sharedGroups.length > 0;
  } catch (error) {
    console.error('Error in isUserKnown:', error);
    return false;
  }
}

export function anonymizeUsername(userId: string): string {
  try {
    const sanitized = userId
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .substring(0, 6);

    return `User_${sanitized}`;
  } catch (error) {
    console.error('Error anonymizing username:', error);
    return 'User_anon';
  }
}

// ============================================
// STATS CALCULATIONS
// ============================================

function calculateConfidenceImpact(picks: any[]): number {
  if (picks.length === 0) return 0;
  
  let totalImpact = 0;
  let decidedPicksCount = 0;

  picks.forEach(pick => {
    if (pick.correct !== null) {
      const multiplier = getConfidenceMultiplier(pick.confidence, pick.correct);
      totalImpact += multiplier;
      decidedPicksCount++;
    }
  });

  return decidedPicksCount > 0 ? totalImpact / decidedPicksCount : 0;
}

function getDaysSinceLastPick(picks: any[]): number {
  if (picks.length === 0) return 999;
  
  const lastPick = picks[0];
  const lastPickDate = new Date(lastPick.created_at);
  const now = new Date();
  const diffMs = now.getTime() - lastPickDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

export function calculateRating(stats: {
  correctPicks: number;
  totalPicks: number;
  confidenceImpact: number;
  daysSinceLastPick: number;
}): number {
  const { correctPicks, totalPicks, confidenceImpact, daysSinceLastPick } = stats;

  if (totalPicks === 0) return 0;

  const accuracy = correctPicks / totalPicks;
  const accuracyScore = accuracy * 70;

  const pickBonus = Math.min(20, (totalPicks / 20) * 20);

  let recencyPenalty = 0;
  if (daysSinceLastPick > 0) {
    recencyPenalty = Math.min(10, (daysSinceLastPick / 14) * 10);
  }

  const confidenceModifier = 1 + (confidenceImpact * 0.2);

  let rating = (accuracyScore + pickBonus - recencyPenalty) * confidenceModifier;
  
  return Math.min(100, Math.max(0, Math.round(rating)));
}

// ============================================
// PICK FETCHING BY SPORT TYPE
// ============================================

/**
 * Week-based sports: Get picks for specific week(s)
 */
async function getWeekBasedPicks(
  userId: string,
  weeks: number[],
  sport: Sport,
  season?: number
): Promise<any[]> {
  try {
    // Default season based on current date
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth();
    // For fall sports (NFL, NCAAF), season spans two years
    const defaultSeason = currentMonth >= 8 ? currentYear : currentYear - 1;
    const targetSeason = season || (sport === 'nfl' || sport === 'ncaaf' ? 2025 : defaultSeason);

    // Get game IDs for the specified weeks
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('id')
      .in('week', weeks)
      .eq('season', targetSeason)
      .eq('sport', sport);

    if (gamesError || !games || games.length === 0) {
      // Fallback: try without sport filter for backward compatibility
      const { data: fallbackGames } = await supabase
        .from('games')
        .select('id')
        .in('week', weeks)
        .eq('season', targetSeason);
      
      if (!fallbackGames || fallbackGames.length === 0) {
        return [];
      }
      
      const gameIds = fallbackGames.map(g => g.id);
      const { data: picks } = await supabase
        .from('picks')
        .select('id, user_id, game_id, confidence, correct, created_at')
        .eq('user_id', userId)
        .in('game_id', gameIds)
        .order('created_at', { ascending: false });
      
      return picks || [];
    }

    const gameIds = games.map(g => g.id);

    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('id, user_id, game_id, confidence, correct, created_at')
      .eq('user_id', userId)
      .in('game_id', gameIds)
      .order('created_at', { ascending: false });

    if (picksError) {
      console.error('Error fetching picks:', picksError);
      return [];
    }

    return picks || [];
  } catch (error) {
    console.error('Error in getWeekBasedPicks:', error);
    return [];
  }
}

/**
 * Date-based sports: Get picks within a date range
 */
async function getDateBasedPicks(
  userId: string,
  daysBack: number,
  sport?: Sport
): Promise<any[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    cutoffDate.setHours(0, 0, 0, 0);

    let query = supabase
      .from('picks')
      .select('id, user_id, game_id, confidence, correct, created_at')
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    // If sport specified, filter by sport (requires game join)
    // For now, we'll fetch all and filter if needed in the future

    const { data: picks, error } = await query;

    if (error) {
      console.error('Error fetching picks:', error);
      return [];
    }

    return picks || [];
  } catch (error) {
    console.error('Error in getDateBasedPicks:', error);
    return [];
  }
}

/**
 * Event-based sports: Get picks for recent events
 * Uses date-based approach with event-appropriate windows
 */
async function getEventBasedPicks(
  userId: string,
  eventsBack: number,
  sport: Sport
): Promise<any[]> {
  // Event-based sports use larger date windows
  // 1 "event" ≈ 7 days for UFC/Boxing, 4 days for golf tournaments
  const daysPerEvent = sport === 'pga' || sport === 'lpga' ? 4 : 7;
  const daysBack = eventsBack * daysPerEvent;
  
  return getDateBasedPicks(userId, daysBack, sport);
}

/**
 * Universal pick fetcher - routes to appropriate method based on sport
 */
async function getPicksForTimeframe(
  userId: string,
  timeframe: 'week' | 'month' | 'season' | 'allTime',
  sport: Sport = 'nfl'
): Promise<any[]> {
  const config = SPORT_CONFIG[sport];

  if (config.scheduleModel === 'week') {
    const currentWeek = await getCurrentWeek(sport);
    // Use previous completed week for "week" filter (current week has pending games)
    const lastCompletedWeek = Math.max(1, currentWeek - 1);
    
    let weeks: number[];
    switch (timeframe) {
      case 'week':
        // Previous completed week only
        weeks = [lastCompletedWeek];
        break;
      case 'month':
        // Last 4 completed weeks
        weeks = Array.from({ length: 4 }, (_, i) => lastCompletedWeek - i).filter(w => w >= 1);
        break;
      case 'season':
        // All completed weeks this season (1 through last completed)
        weeks = Array.from({ length: lastCompletedWeek }, (_, i) => i + 1);
        break;
      case 'allTime':
        // All possible weeks
        weeks = Array.from({ length: config.seasonLength }, (_, i) => i + 1);
        break;
      default:
        weeks = [lastCompletedWeek];
    }
    
    return getWeekBasedPicks(userId, weeks, sport);
    
  } else if (config.scheduleModel === 'event') {
    let eventsBack: number;
    switch (timeframe) {
      case 'week':
        eventsBack = 1;  // Current/most recent event
        break;
      case 'month':
        eventsBack = 4;  // Last ~4 events
        break;
      case 'season':
        eventsBack = 20; // ~20 events
        break;
      case 'allTime':
        eventsBack = 100;
        break;
      default:
        eventsBack = 1;
    }
    
    return getEventBasedPicks(userId, eventsBack, sport);
    
  } else {
    // Date-based
    let daysBack: number;
    switch (timeframe) {
      case 'week':
        daysBack = 7;
        break;
      case 'month':
        daysBack = 30;
        break;
      case 'season':
        daysBack = config.seasonLength;
        break;
      case 'allTime':
        daysBack = 999;
        break;
      default:
        daysBack = 7;
    }
    
    return getDateBasedPicks(userId, daysBack, sport);
  }
}

/**
 * Calculate stats for a specific timeframe
 */
async function calculateTimeframeStats(
  userId: string,
  timeframe: 'week' | 'month' | 'season' | 'allTime',
  username: string,
  sport: Sport = 'nfl'
): Promise<PickStats> {
  const picks = await getPicksForTimeframe(userId, timeframe, sport);

  const correctPicks = picks.filter(p => p.correct === true).length;
  const incorrectPicks = picks.filter(p => p.correct === false).length;
  const pendingPicks = picks.filter(p => p.correct === null).length;
  const totalPicks = picks.length;
  const decidedPicks = correctPicks + incorrectPicks;

  const confidenceImpact = calculateConfidenceImpact(picks);
  const daysSinceLastPick = getDaysSinceLastPick(picks);
  
  const rating = calculateRating({
    correctPicks,
    totalPicks: decidedPicks > 0 ? decidedPicks : totalPicks,
    confidenceImpact,
    daysSinceLastPick
  });

  return {
    userId,
    username,
    correctPicks,
    incorrectPicks,
    totalPicks,
    pendingPicks,
    confidenceImpact,
    daysSinceLastPick,
    lastPickDate: picks.length > 0 ? picks[0].created_at : null,
    rating
  };
}

// ============================================
// PUBLIC API
// ============================================

/**
 * Get all group members with their ratings
 */
export async function getGroupMembersRatings(
  groupId: string,
  sport: Sport = 'nfl'
): Promise<UserRatingData[]> {
  try {
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return [];
    }

    if (!groupMembers || groupMembers.length === 0) {
      return [];
    }

    const userIds = groupMembers.map(m => m.user_id);
    const ratings: UserRatingData[] = [];

    for (const oderId of userIds) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, username')
          .eq('id', oderId)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', oderId);
          continue;
        }

        const weekStats = await calculateTimeframeStats(oderId, 'week', profile.username, sport);
        const monthStats = await calculateTimeframeStats(oderId, 'month', profile.username, sport);
        const allTimeStats = await calculateTimeframeStats(oderId, 'allTime', profile.username, sport);

        ratings.push({
          oderId,
          username: profile.username || 'User',
          email: profile.email || '',
          weekStats,
          monthStats,
          allTimeStats
        });
      } catch (error) {
        console.error('Error calculating ratings for user:', oderId, error);
      }
    }

    return ratings;
  } catch (error) {
    console.error('Error in getGroupMembersRatings:', error);
    return [];
  }
}

/**
 * Get ratings for a specific user across all timeframes
 */
export async function getUserRatings(
  userId: string,
  sport: Sport = 'nfl'
): Promise<UserRatingData | null> {
  try {
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, username')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Could not fetch profile:', profileError);
      return null;
    }

    const weekStats = await calculateTimeframeStats(userId, 'week', profile.username, sport);
    const monthStats = await calculateTimeframeStats(userId, 'month', profile.username, sport);
    const allTimeStats = await calculateTimeframeStats(userId, 'allTime', profile.username, sport);

    return {
      userId,
      username: profile.username || 'User',
      email: profile.email || '',
      weekStats,
      monthStats,
      allTimeStats
    };
  } catch (error) {
    console.error('Error getting user ratings:', error);
    return null;
  }
}

/**
 * Rank group members by rating for a specific timeframe
 */
export async function rankGroupMembers(
  groupId: string,
  timeframe: 'week' | 'month' | 'allTime' = 'week',
  sport: Sport = 'nfl'
): Promise<Array<PickStats & { rank: number }>> {
  const ratings = await getGroupMembersRatings(groupId, sport);

  const statsKey =
    timeframe === 'week'
      ? 'weekStats'
      : timeframe === 'month'
      ? 'monthStats'
      : 'allTimeStats';

  const ranked = ratings
    .map((user) => ({
      ...user[statsKey as keyof typeof user],
      rank: 0
    }))
    .sort((a, b) => b.rating - a.rating)
    .map((stat, index) => ({
      ...stat,
      rank: index + 1
    }));

  return ranked;
}

/**
 * Get top 5 global performers with privacy/anonymization
 */
export async function getTopPerformersGlobally(
  currentUserId: string,
  timeframe: 'week' | 'month' | 'season' | 'allTime' = 'week',
  sport: Sport = 'nfl'
): Promise<LeaderboardUser[]> {
  try {
    const userGroups = await getUserGroups(currentUserId);
    
    if (userGroups.length === 0) {
      return [];
    }

    const { data: groupMembers, error: groupMembersError } = await supabase
      .from('group_members')
      .select('user_id')
      .in('group_id', userGroups);

    if (groupMembersError) {
      console.error('Error fetching group members:', groupMembersError);
      return [];
    }

    const userFriends = await getUserFriends(currentUserId);

    const userIdsSet = new Set<string>();
    (groupMembers || []).forEach(gm => userIdsSet.add(gm.user_id));
    userFriends.forEach(friendId => userIdsSet.add(friendId));

    userIdsSet.delete(currentUserId);
    const userIds = Array.from(userIdsSet);

    if (userIds.length === 0) {
      return [];
    }

    const allUsersWithRatings: Array<LeaderboardUser> = [];

    for (const oderId of userIds) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', oderId)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', oderId);
          continue;
        }

        const stats = await calculateTimeframeStats(oderId, timeframe, profile.username, sport);

        const isKnown = await isUserKnown(currentUserId, oderId);

        const decidedPicks = stats.correctPicks + stats.incorrectPicks;

        allUsersWithRatings.push({
          oderId,
          displayName: isKnown ? profile.username : anonymizeUsername(oderId),
          isAnonymized: !isKnown,
          rating: stats.rating,
          totalPicks: stats.totalPicks,
          correctPicks: stats.correctPicks,
          incorrectPicks: stats.incorrectPicks,
          pendingPicks: stats.pendingPicks,
          winRate: decidedPicks > 0 ? Math.round((stats.correctPicks / decidedPicks) * 100) : 0,
          lastPickDate: stats.lastPickDate,
          rank: 0
        });
      } catch (error) {
        console.error('Error calculating rating for user:', oderId, error);
      }
    }

    const topPerformers = allUsersWithRatings
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 5)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    return topPerformers;
  } catch (error) {
    console.error('Error in getTopPerformersGlobally:', error);
    return [];
  }
}

/**
 * Get all members in a specific group with their ratings
 */
export async function getGroupLeaderboard(
  groupId: string,
  timeframe: 'week' | 'month' | 'season' | 'allTime' = 'week',
  sport: Sport = 'nfl'
): Promise<LeaderboardUser[]> {
  try {
    const { data: groupMembers, error: membersError } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId);

    if (membersError) {
      console.error('Error fetching group members:', membersError);
      return [];
    }

    if (!groupMembers || groupMembers.length === 0) {
      return [];
    }

    const userIds = groupMembers.map(m => m.user_id);

    const leaderboardUsers: LeaderboardUser[] = [];

    for (const oderId of userIds) {
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', oderId)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', oderId);
          continue;
        }

        const stats = await calculateTimeframeStats(oderId, timeframe, profile.username, sport);

        const decidedPicks = stats.correctPicks + stats.incorrectPicks;

        leaderboardUsers.push({
          userId: oderId,
          displayName: profile.username,
          isAnonymized: false,
          rating: stats.rating,
          totalPicks: stats.totalPicks,
          correctPicks: stats.correctPicks,
          incorrectPicks: stats.incorrectPicks,
          pendingPicks: stats.pendingPicks,
          winRate: decidedPicks > 0 ? Math.round((stats.correctPicks / decidedPicks) * 100) : 0,
          lastPickDate: stats.lastPickDate,
          rank: 0
        });
      } catch (error) {
        console.error('Error calculating rating for user:', oderId, error);
      }
    }

    const ranked = leaderboardUsers
      .sort((a, b) => b.rating - a.rating)
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }));

    return ranked;
  } catch (error) {
    console.error('Error in getGroupLeaderboard:', error);
    return [];
  }
}

// ============================================
// DISPLAY HELPERS
// ============================================

/**
 * Get timeframe display label based on sport
 */
export async function getTimeframeLabel(
  timeframe: 'week' | 'month' | 'season' | 'allTime',
  sport: Sport
): Promise<string> {
  const config = SPORT_CONFIG[sport];

  if (config.scheduleModel === 'week') {
    const currentWeek = await getCurrentWeek(sport);
    const lastCompletedWeek = Math.max(1, currentWeek - 1);
    
    switch (timeframe) {
      case 'week':
        return `${config.weekLabel} ${lastCompletedWeek}`;
      case 'month':
        return `Last 4 ${config.weekLabel}s`;
      case 'season':
        return `${new Date().getFullYear()} Season`;
      case 'allTime':
        return 'All Time';
    }
  } else if (config.scheduleModel === 'event') {
    switch (timeframe) {
      case 'week':
        return `Recent ${config.weekLabel}`;
      case 'month':
        return `Last 4 ${config.weekLabel}s`;
      case 'season':
        return 'This Season';
      case 'allTime':
        return 'All Time';
    }
  } else {
    switch (timeframe) {
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'season':
        return 'This Season';
      case 'allTime':
        return 'All Time';
    }
  }
}

/**
 * Sync version for UI (uses cached week or defaults)
 */
export function getTimeframeLabelSync(
  timeframe: 'week' | 'month' | 'season' | 'allTime',
  sport: Sport,
  currentWeek?: number
): string {
  const config = SPORT_CONFIG[sport];

  if (config.scheduleModel === 'week') {
    // Use previous completed week (current week has pending games)
    const lastCompletedWeek = currentWeek ? Math.max(1, currentWeek - 1) : 1;
    
    switch (timeframe) {
      case 'week':
        return `${config.weekLabel} ${lastCompletedWeek}`;
      case 'month':
        return `Last 4 ${config.weekLabel}s`;
      case 'season':
        return `${new Date().getFullYear()} Season`;
      case 'allTime':
        return 'All Time';
    }
  } else if (config.scheduleModel === 'event') {
    switch (timeframe) {
      case 'week':
        return `Recent ${config.weekLabel}`;
      case 'month':
        return `Last 4 ${config.weekLabel}s`;
      case 'season':
        return 'This Season';
      case 'allTime':
        return 'All Time';
    }
  } else {
    switch (timeframe) {
      case 'week':
        return 'Last 7 Days';
      case 'month':
        return 'Last 30 Days';
      case 'season':
        return 'This Season';
      case 'allTime':
        return 'All Time';
    }
  }
}