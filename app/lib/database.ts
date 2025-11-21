import { supabase } from './supabase'; // Adjust path to your supabase config

export interface Friend {
  id: string;
  username: string;
  display_name: string;
  email: string;
  picks: number;
  accuracy: number;
  status: 'accepted' | 'pending' | 'blocked';
}

export interface GroupStats {
  activePicks: number;
  pendingPicks: number;
  totalFriends: number;
}

// Updated UserGroup interface with performance metrics
export interface UserGroup {
  id: string;
  name: string;
  role: 'primary_owner' | 'owner' | 'member';
  visibility: 'private' | 'public';
  joinType: 'invite_only' | 'request_to_join' | 'open';
  memberCount: number;
  activePicks: number;
  pendingPicks: number;
  // New performance metrics
  rating: number; // Overall accuracy %
  weekAccuracy: number | null; // Last week win % (null if no data)
  monthAccuracy: number | null; // Last month win % (null if no data)
  allTimeAccuracy: number | null; // All time win % (null if no data)
  trend?: 'up' | 'down' | 'neutral';
  totalGroupPicks?: number;
}

// Get friends for current user with their pick statistics
export async function getFriendsWithStats(userId: string): Promise<Friend[]> {
  // Get friendships
  const { data: friendships, error } = await supabase
    .from('friendships')
    .select('friend_id, status')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching friends:', error);
    return [];
  }

  const friendsWithStats = await Promise.all(
    friendships.map(async (friendship) => {
      // Get friend's auth info
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(friendship.friend_id);
      
      if (authError) {
        console.log('Auth error for user:', friendship.friend_id);
        return null;
      }

      // Get pick count for this friend
      const { count: pickCount } = await supabase
        .from('picks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', friendship.friend_id);

      // Get correct picks count for accuracy
      const { count: correctCount } = await supabase
        .from('picks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', friendship.friend_id)
        .eq('correct', true);

      const accuracy = pickCount && pickCount > 0 ? Math.round((correctCount || 0) / pickCount * 100) : 0;

      return {
        id: friendship.friend_id,
        username: authUser.user?.email?.split('@')[0] || 'User',
        display_name: authUser.user?.email?.split('@')[0] || 'User',
        email: authUser.user?.email || '',
        picks: pickCount || 0,
        accuracy,
        status: friendship.status as 'accepted' | 'pending' | 'blocked'
      };
    })
  );

  return friendsWithStats.filter(friend => friend !== null);
}

// Get group statistics for current user
export async function getGroupStats(userId: string): Promise<GroupStats> {
  // Get friend count
  const { count: totalFriends } = await supabase
    .from('friendships')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('status', 'accepted');

  // Get current week active picks
  const { count: activePicks } = await supabase
    .from('picks')
    .select('*', { count: 'exact', head: true })
    .eq('week', 2)
    .eq('season', 2025);

  // Get pending games count
  const { count: pendingPicks } = await supabase
    .from('games')
    .select('*', { count: 'exact', head: true })
    .eq('locked', false)
    .eq('week', 2);

  return {
    activePicks: activePicks || 0,
    pendingPicks: pendingPicks || 0,
    totalFriends: totalFriends || 0
  };
}

export interface GameWithPicks {
  id: string;
  home_team: string;
  away_team: string;
  home_spread: string;
  away_spread: string;
  game_date: string;
  week: number;
  season: number;
  locked: boolean;
  picks: PickWithUser[];
}

export interface PickWithUser {
  id: string;
  user_id: string;
  username: string;
  pick: string;
  confidence: string;
  reasoning: string;
  team_picked: string;
  spread_value: number;
  created_at: string;
  winRate: number;
  totalPicks: number;
  weightedScore: number;
}

export interface GameConsensus {
  homePercentage: number;
  awayPercentage: number;
  recommendation: 'home' | 'away';
  homePicks: number;
  awayPicks: number;
}

// Get games with picks for a specific week from ALL users
export async function getGamesWithGroupPicks(userId: string, week: number, season: number = 2025): Promise<GameWithPicks[]> {
  // Get games for the week
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('week', week)
    .eq('season', season)
    .order('game_date');

  if (gamesError) {
    console.error('Error fetching games:', gamesError);
    return [];
  }

  // Get ALL picks for these games from ALL users
  const { data: picks, error: picksError } = await supabase
    .from('picks')
    .select('*')
    .eq('week', week)
    .eq('season', season);

  if (picksError) {
    console.error('Error fetching picks:', picksError);
    return [];
  }

  // Get unique user IDs from picks
  const uniqueUserIds = [...new Set(picks?.map(p => p.user_id) || [])];
  
  // Get user info for pick authors
  const userPromises = uniqueUserIds.map(async (uid) => {
    if (uid === userId) {
      return { id: uid, username: 'You' };
    }
    
    // For other users, try to get their email from profiles or use generic username
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, username, display_name')
        .eq('id', uid)
        .single();
      
      if (profile) {
        return {
          id: uid,
          username: profile.username || profile.display_name || profile.email?.split('@')[0] || 'User'
        };
      }
    } catch (error) {
      console.log('Could not get profile for:', uid);
    }
    
    // Fallback to generic username
    return {
      id: uid,
      username: 'User'
    };
  });

  const users = await Promise.all(userPromises);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.username]));

  // Get pick and accuracy stats for each user
  const userStatsPromises = uniqueUserIds.map(async (uid) => {
    const { count: totalPicks } = await supabase
      .from('picks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid);

    const { count: correctPicks } = await supabase
      .from('picks')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', uid)
      .eq('correct', true);

    return {
      user_id: uid,
      totalPicks: totalPicks || 0,
      winRate: totalPicks ? Math.round((correctPicks || 0) / totalPicks * 100) : 0
    };
  });

  const userStats = await Promise.all(userStatsPromises);
  const statsMap = Object.fromEntries(userStats.map(s => [s.user_id, s]));

  // Combine games with their picks
  const gamesWithPicks: GameWithPicks[] = games.map(game => {
    const gamePicks = picks?.filter(pick => pick.game_id === game.id) || [];
    
    const picksWithUser: PickWithUser[] = gamePicks.map(pick => {
      const stats = statsMap[pick.user_id] || { totalPicks: 0, winRate: 0 };
      const confidenceValue = getConfidenceValue(pick.confidence);
      
      return {
        id: pick.id,
        user_id: pick.user_id,
        username: userMap[pick.user_id] || 'User',
        pick: pick.pick,
        confidence: pick.confidence,
        reasoning: pick.reasoning,
        team_picked: pick.team_picked,
        spread_value: pick.spread_value,
        created_at: pick.created_at,
        winRate: stats.winRate,
        totalPicks: stats.totalPicks,
        weightedScore: confidenceValue * (1 + stats.winRate / 100)
      };
    }).sort((a, b) => b.weightedScore - a.weightedScore);

    return {
      id: game.id,
      home_team: game.home_team,
      away_team: game.away_team,
      home_spread: `${game.home_team} ${game.home_spread}`,
      away_spread: `${game.away_team} ${game.away_spread}`,
      game_date: game.game_date,
      week: game.week,
      season: game.season,
      locked: game.locked,
      picks: picksWithUser
    };
  });

  return gamesWithPicks;
}

// Helper function to convert confidence text to numeric value
function getConfidenceValue(confidence: string): number {
  switch (confidence?.toLowerCase()) {
    case 'very high': return 95;
    case 'high': return 85;
    case 'medium': return 60;
    case 'low': return 40;
    default: return 50;
  }
}

// Calculate consensus for picks
export function calculateConsensus(picks: PickWithUser[]): GameConsensus | null {
  if (!picks || picks.length === 0) return null;

  let homeScore = 0;
  let awayScore = 0;

  picks.forEach(pick => {
    const weight = pick.weightedScore || 0;
    if (pick.pick === 'home') {
      homeScore += weight;
    } else {
      awayScore += weight;
    }
  });

  const totalScore = homeScore + awayScore;
  if (totalScore === 0) return null;
  
  const homePercentage = Math.round((homeScore / totalScore) * 100);
  const awayPercentage = 100 - homePercentage;

  return {
    homePercentage,
    awayPercentage,
    recommendation: homePercentage > 50 ? 'home' : 'away',
    homePicks: picks.filter(p => p.pick === 'home').length,
    awayPicks: picks.filter(p => p.pick === 'away').length,
  };
}

// FIXED FUNCTION: Calculate group accuracy metrics across different time periods
export async function getGroupAccuracy(groupId: string): Promise<{
  rating: number;
  weekAccuracy: number | null;
  monthAccuracy: number | null;
  allTimeAccuracy: number | null;
  totalPicks: number;
  trend: 'up' | 'down' | 'neutral';
}> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Get all group members
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);
    
  if (!members?.length) {
    return {
      rating: 0,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: 0,
      trend: 'neutral'
    };
  }
  
  const memberIds = members.map(m => m.user_id);
  
  // Get all picks for group members that have been scored (correct is not null)
  // We're NOT filtering by locked anymore since that field isn't being set properly
  const { data: allPicks } = await supabase
    .from('picks')
    .select('*')
    .in('user_id', memberIds)
    .not('correct', 'is', null);
    
  if (!allPicks?.length) {
    return {
      rating: 0,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: 0,
      trend: 'neutral'
    };
  }
  
  // Now get the game dates for these picks
  const gameIds = [...new Set(allPicks.map(p => p.game_id))];
  const { data: games } = await supabase
    .from('games')
    .select('id, game_date')
    .in('id', gameIds);
    
  if (!games) {
    return {
      rating: 0,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: 0,
      trend: 'neutral'
    };
  }
  
  // Create a map of game_id to game_date
  const gameMap = new Map(games.map(g => [g.id, new Date(g.game_date)]));
  
  // Add game dates to picks
  const picksWithDates = allPicks.map(pick => ({
    ...pick,
    gameDate: gameMap.get(pick.game_id)
  })).filter(p => p.gameDate); // Only keep picks where we found the game
  
  // Helper to calculate accuracy for a set of picks
  const calculateAccuracy = (filteredPicks: any[]) => {
    if (!filteredPicks.length || filteredPicks.length < 3) return null; // Need at least 3 picks
    const correct = filteredPicks.filter(p => p.correct === true).length;
    return Math.round((correct / filteredPicks.length) * 100);
  };
  
  // Filter picks by time period
  const weekPicks = picksWithDates.filter(p => p.gameDate && p.gameDate > oneWeekAgo);
  const monthPicks = picksWithDates.filter(p => p.gameDate && p.gameDate > oneMonthAgo);
  
  const weekAccuracy = calculateAccuracy(weekPicks);
  const monthAccuracy = calculateAccuracy(monthPicks);
  const allTimeAccuracy = calculateAccuracy(picksWithDates);
  
  // Calculate trend (only show arrows for significant changes)
  let trend: 'up' | 'down' | 'neutral' = 'neutral';
  if (weekAccuracy !== null && monthAccuracy !== null) {
    if (weekAccuracy > monthAccuracy + 5) trend = 'up';
    else if (weekAccuracy < monthAccuracy - 5) trend = 'down';
  }
  
  return {
    rating: allTimeAccuracy || 0,
    weekAccuracy,
    monthAccuracy,
    allTimeAccuracy,
    totalPicks: picksWithDates.length,
    trend
  };
}

// Get user groups with performance metrics
export async function getUserGroups(userId: string): Promise<UserGroup[]> {
  try {
    // Get all groups user is a member of
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id, role')
      .eq('user_id', userId);

    if (memberError) throw memberError;
    if (!memberships || memberships.length === 0) return [];

    const groupIds = memberships.map(m => m.group_id);

    // Get group details
    const { data: groups, error: groupError } = await supabase
      .from('groups')
      .select('id, name, visibility, join_type')
      .in('id', groupIds);

    if (groupError) throw groupError;

    // For each group, get member count, pick stats, and accuracy metrics
    const userGroups: UserGroup[] = await Promise.all(
      groups.map(async (group) => {
        const membership = memberships.find(m => m.group_id === group.id);
        
        // Get member count
        const { count: memberCount } = await supabase
          .from('group_members')
          .select('*', { count: 'exact', head: true })
          .eq('group_id', group.id);

        // Get current week
        const { data: appState } = await supabase
          .from('app_state')
          .select('current_week')
          .single();
        
        const currentWeek = appState?.current_week || 12;

        // Get games for current week
        const { data: games } = await supabase
          .from('games')
          .select('id, locked')
          .eq('week', currentWeek)
          .eq('season', 2025);

        let activePicks = 0;
        let pendingPicks = 0;

        if (games) {
          const lockedGameIds = games.filter(g => g.locked).map(g => g.id);
          const unlockedGameIds = games.filter(g => !g.locked).map(g => g.id);

          // Count picks for this group
          const { count: active } = await supabase
            .from('picks')
            .select('*', { count: 'exact', head: true })
            .in('game_id', lockedGameIds);

          const { count: pending } = await supabase
            .from('picks')
            .select('*', { count: 'exact', head: true })
            .in('game_id', unlockedGameIds);

          activePicks = active || 0;
          pendingPicks = pending || 0;
        }

        // Get group accuracy metrics
        const accuracyStats = await getGroupAccuracy(group.id);

        return {
          id: group.id,
          name: group.name,
          role: membership?.role || 'member',
          visibility: group.visibility || 'private',
          joinType: group.join_type || 'invite_only',
          memberCount: memberCount || 0,
          activePicks,
          pendingPicks,
          // Add performance metrics
          rating: accuracyStats.rating,
          weekAccuracy: accuracyStats.weekAccuracy,
          monthAccuracy: accuracyStats.monthAccuracy,
          allTimeAccuracy: accuracyStats.allTimeAccuracy,
          trend: accuracyStats.trend,
          totalGroupPicks: accuracyStats.totalPicks
        };
      })
    );

    return userGroups;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
}