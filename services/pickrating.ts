import { supabase } from '../app/lib/supabase';

/**
 * Pick rating system - calculates user ratings based on:
 * - Correct picks (60-70% weight)
 * - Total picks made (15-20% weight) 
 * - Recency (10-15% weight)
 * - Confidence impact (varies by correctness)
 */

export interface PickStats {
  userId: string;
  username: string;
  correctPicks: number;
  incorrectPicks: number;
  totalPicks: number;
  pendingPicks: number;
  confidenceImpact: number; // aggregate weighted score
  daysSinceLastPick: number;
  lastPickDate: string | null;
  rating: number; // 0-100
}

export interface UserRatingData {
  userId: string;
  username: string;
  email: string;
  weekStats: PickStats;
  monthStats: PickStats;
  allTimeStats: PickStats;
  isAnonymized?: boolean; // True if username is hashed for privacy
  displayName?: string; // Real name or anonymized name
}

export interface LeaderboardUser {
  userId: string;
  displayName: string; // What to show (real name or anonymized)
  isAnonymized: boolean;
  rating: number;
  totalPicks: number;
  correctPicks: number;
  winRate: number;
  lastPickDate: string | null;
  rank: number;
}

/**
 * Get confidence multiplier for a pick
 * High confidence correct: +1.2 boost
 * High confidence incorrect: -1.0 penalty
 * Low confidence correct: +0.6 boost
 * Low confidence incorrect: -0.3 penalty
 */
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
    // Incorrect picks
    switch (confidenceLevel) {
      case 'very high':
      case 'high':
        return -1.0; // Worse to be wrong with high confidence
      case 'medium':
        return -0.5;
      case 'low':
        return -0.3; // Low confidence wrong is less bad
      default:
        return -0.5;
    }
  }
}

/**
 * PRIVACY HELPER FUNCTIONS
 */

/**
 * Get all direct friends of a user
 */
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

/**
 * Get all groups a user is a member of
 */
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

/**
 * Check if two users share any groups
 */
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

/**
 * Check if user B is "known" to user A
 * Known = direct friend OR in same group
 */
export async function isUserKnown(
  currentUserId: string,
  targetUserId: string
): Promise<boolean> {
  try {
    // Check if direct friends
    const { data: friendship, error: friendError } = await supabase
      .from('friendships')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('friend_id', targetUserId)
      .eq('status', 'accepted')
      .single();

    if (!friendError && friendship) {
      return true; // They are friends
    }

    // Check if they share any groups
    const sharedGroups = await getSharedGroups(currentUserId, targetUserId);
    return sharedGroups.length > 0;
  } catch (error) {
    console.error('Error in isUserKnown:', error);
    return false;
  }
}

/**
 * Generate anonymized username
 * Format: User_a3f2b1 (first 6 chars of hashed userId)
 */
export function anonymizeUsername(userId: string): string {
  try {
    // Simple hash: take first 6 chars of userId, converted to alphanumeric
    // Alternative: could use a more sophisticated hash function
    const sanitized = userId
      .replace(/[^a-zA-Z0-9]/g, '') // Remove special chars
      .toLowerCase()
      .substring(0, 6);

    return `User_${sanitized}`;
  } catch (error) {
    console.error('Error anonymizing username:', error);
    return 'User_anon';
  }
}

/**
 * Calculate confidence impact score
 * Aggregates the confidence-weighted performance across picks
 */
function calculateConfidenceImpact(picks: any[]): number {
  if (picks.length === 0) return 0;
  
  let totalImpact = 0;
  let decidedPicksCount = 0;

  picks.forEach(pick => {
    // Only count picks with results (not pending)
    if (pick.correct !== null) {
      const multiplier = getConfidenceMultiplier(pick.confidence, pick.correct);
      totalImpact += multiplier;
      decidedPicksCount++;
    }
  });

  // Return average impact (-1 to +1 scale)
  return decidedPicksCount > 0 ? totalImpact / decidedPicksCount : 0;
}

/**
 * Calculate days since last pick
 */
function getDaysSinceLastPick(picks: any[]): number {
  if (picks.length === 0) return 999; // No picks = very inactive
  
  const lastPick = picks[0]; // Already sorted by created_at DESC
  const lastPickDate = new Date(lastPick.created_at);
  const now = new Date();
  const diffMs = now.getTime() - lastPickDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
}

/**
 * Calculate user rating (0-100 scale)
 */
export function calculateRating(stats: {
  correctPicks: number;
  totalPicks: number;
  confidenceImpact: number;
  daysSinceLastPick: number;
}): number {
  const { correctPicks, totalPicks, confidenceImpact, daysSinceLastPick } = stats;

  if (totalPicks === 0) return 0;

  // Base accuracy score (0-70 points)
  const accuracy = correctPicks / totalPicks;
  const accuracyScore = accuracy * 70;

  // Participation bonus (0-20 points)
  // Encourages making picks: 10 picks = 10 pts, 20+ picks = 20 pts
  const pickBonus = Math.min(20, (totalPicks / 20) * 20);

  // Recency penalty (0-10 points deducted)
  // No picks in 7+ days = -10
  // Last pick today = 0 penalty
  let recencyPenalty = 0;
  if (daysSinceLastPick > 0) {
    recencyPenalty = Math.min(10, (daysSinceLastPick / 14) * 10);
  }

  // Confidence modifier (0.8 to 1.2 multiplier)
  // Positive confidence impact = bonus, negative = penalty
  const confidenceModifier = 1 + (confidenceImpact * 0.2);

  // Final calculation
  let rating = (accuracyScore + pickBonus - recencyPenalty) * confidenceModifier;
  
  // Clamp to 0-100
  return Math.min(100, Math.max(0, Math.round(rating)));
}

/**
 * Fetch and calculate all picks for a user in a timeframe
 */
async function getPicksInTimeframe(
  userId: string,
  daysBack: number
): Promise<any[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);
    cutoffDate.setHours(0, 0, 0, 0);

    const { data: picks, error } = await supabase
      .from('picks')
      .select(`
        id,
        user_id,
        game_id,
        confidence,
        correct,
        created_at
      `)
      .eq('user_id', userId)
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching picks:', error);
      return [];
    }

    return picks || [];
  } catch (error) {
    console.error('Error in getPicksInTimeframe:', error);
    return [];
  }
}

/**
 * Calculate stats for a specific timeframe
 */
async function calculateTimeframeStats(
  userId: string,
  daysBack: number,
  username: string
): Promise<PickStats> {
  const picks = await getPicksInTimeframe(userId, daysBack);

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

/**
 * Get all group members with their ratings
 */
export async function getGroupMembersRatings(
  groupId: string
): Promise<UserRatingData[]> {
  try {
    // First, get all members in the group
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

    // For each member, calculate their ratings
    const userIds = groupMembers.map(m => m.user_id);
    const ratings: UserRatingData[] = [];

    for (const userId of userIds) {
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, username')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', userId);
          continue;
        }

        // Calculate stats for each timeframe
        const weekStats = await calculateTimeframeStats(userId, 7, profile.username);
        const monthStats = await calculateTimeframeStats(userId, 30, profile.username);
        const allTimeStats = await calculateTimeframeStats(userId, 999, profile.username);

        ratings.push({
          userId,
          username: profile.username || 'User',
          email: profile.email || '',
          weekStats,
          monthStats,
          allTimeStats
        });
      } catch (error) {
        console.error('Error calculating ratings for user:', userId, error);
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
export async function getUserRatings(userId: string): Promise<UserRatingData | null> {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, username')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('Could not fetch profile:', profileError);
      return null;
    }

    // Calculate stats for each timeframe
    const weekStats = await calculateTimeframeStats(userId, 7, profile.username);
    const monthStats = await calculateTimeframeStats(userId, 30, profile.username);
    const allTimeStats = await calculateTimeframeStats(userId, 999, profile.username);

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
  timeframe: 'week' | 'month' | 'allTime' = 'week'
): Promise<Array<PickStats & { rank: number }>> {
  const ratings = await getGroupMembersRatings(groupId);

  // Map timeframe to stats key
  const statsKey =
    timeframe === 'week'
      ? 'weekStats'
      : timeframe === 'month'
      ? 'monthStats'
      : 'allTimeStats';

  // Extract stats and sort by rating (descending)
  const ranked = ratings
    .map((user, index) => ({
      ...user[statsKey as keyof typeof user],
      rank: 0 // Will be updated
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
 * Shows: top performers user knows about + top unknown performers
 */
export async function getTopPerformersGlobally(
  currentUserId: string,
  timeframe: 'week' | 'month' | 'season' | 'allTime' = 'week'
): Promise<LeaderboardUser[]> {
  try {
    // Convert timeframe to daysBack
    const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'season' ? 120 : 999;

    // Step 1: Get all groups for current user
    const userGroups = await getUserGroups(currentUserId);
    
    if (userGroups.length === 0) {
      return []; // No groups, no leaderboard
    }

    // Step 2: Get all members from all user's groups
    const { data: groupMembers, error: groupMembersError } = await supabase
      .from('group_members')
      .select('user_id')
      .in('group_id', userGroups);

    if (groupMembersError) {
      console.error('Error fetching group members:', groupMembersError);
      return [];
    }

    // Step 3: Get user's direct friends
    const userFriends = await getUserFriends(currentUserId);

    // Combine into unique set of user IDs (group members + direct friends)
    const userIdsSet = new Set<string>();
    (groupMembers || []).forEach(gm => userIdsSet.add(gm.user_id));
    userFriends.forEach(friendId => userIdsSet.add(friendId));

    // Remove current user from the set
    userIdsSet.delete(currentUserId);
    const userIds = Array.from(userIdsSet);

    if (userIds.length === 0) {
      return [];
    }

    // Step 4: Calculate ratings for all these users
    const allUsersWithRatings: Array<LeaderboardUser> = [];

    for (const userId of userIds) {
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', userId);
          continue;
        }

        // Calculate rating for timeframe
        const stats = await calculateTimeframeStats(userId, daysBack, profile.username);

        // Check if this user is known to current user
        const isKnown = await isUserKnown(currentUserId, userId);

        allUsersWithRatings.push({
          userId,
          displayName: isKnown ? profile.username : anonymizeUsername(userId),
          isAnonymized: !isKnown,
          rating: stats.rating,
          totalPicks: stats.totalPicks,
          correctPicks: stats.correctPicks,
          winRate: stats.totalPicks > 0 ? Math.round((stats.correctPicks / stats.totalPicks) * 100) : 0,
          lastPickDate: stats.lastPickDate,
          rank: 0 // Will be updated
        });
      } catch (error) {
        console.error('Error calculating rating for user:', userId, error);
      }
    }

    // Step 5: Sort by rating and take top 5
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
 * Shows real names for everyone (same group = known)
 */
export async function getGroupLeaderboard(
  groupId: string,
  timeframe: 'week' | 'month' | 'season' | 'allTime' = 'week'
): Promise<LeaderboardUser[]> {
  try {
    // Convert timeframe to daysBack
    const daysBack = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'season' ? 120 : 999;

    // Step 1: Get all members in this group
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

    // Step 2: Calculate ratings for all members
    const leaderboardUsers: LeaderboardUser[] = [];

    for (const userId of userIds) {
      try {
        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, username, email')
          .eq('id', userId)
          .single();

        if (profileError) {
          console.warn('Could not fetch profile for user:', userId);
          continue;
        }

        // Calculate rating for timeframe
        const stats = await calculateTimeframeStats(userId, daysBack, profile.username);

        leaderboardUsers.push({
          userId,
          displayName: profile.username, // Always real name in group
          isAnonymized: false,
          rating: stats.rating,
          totalPicks: stats.totalPicks,
          correctPicks: stats.correctPicks,
          winRate: stats.totalPicks > 0 ? Math.round((stats.correctPicks / stats.totalPicks) * 100) : 0,
          lastPickDate: stats.lastPickDate,
          rank: 0 // Will be updated
        });
      } catch (error) {
        console.error('Error calculating rating for user:', userId, error);
      }
    }

    // Step 3: Sort by rating and assign ranks
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