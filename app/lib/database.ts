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

return friendsWithStats.filter(friend => friend !== null);}

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

// Get games with picks for a specific week and user's friends
export async function getGamesWithGroupPicks(userId: string, week: number, season: number = 2025): Promise<GameWithPicks[]> {
  console.log('=== DEBUGGING GROUP PICKS QUERY ===');
  console.log('User ID:', userId);
  console.log('Week:', week, 'Season:', season);

  // Get user's friends
  const { data: friendships, error: friendError } = await supabase
    .from('friendships')
    .select('friend_id')
    .eq('user_id', userId)
    .eq('status', 'accepted');

  console.log('Friendships query result:', friendships);
  console.log('Friendships error:', friendError);

  const friendIds = friendships?.map(f => f.friend_id) || [];
  const allUserIds = [userId, ...friendIds];
  console.log('All user IDs to query:', allUserIds);

  // Get games for the week
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('*')
    .eq('week', week)
    .eq('season', season)
    .order('game_date');

  console.log('Games query result:', games?.length, 'games found');
  console.log('Games error:', gamesError);

  if (gamesError) {
    console.error('Error fetching games:', gamesError);
    return [];
  }

  // Get all picks for these games from friends and user
  const { data: picks, error: picksError } = await supabase
    .from('picks')
    .select('*')
    .in('user_id', allUserIds)
    .eq('week', week)
    .eq('season', season);

  console.log('Picks query result:', picks?.length, 'picks found');
  console.log('Picks error:', picksError);
  console.log('===================================');

  // ... rest of your existing function

  // Get user info for pick authors
  const userPromises = allUserIds.map(async (uid) => {
    if (uid === userId) {
      return { id: uid, username: 'You' };
    }
    
    const { data: authUser } = await supabase.auth.admin.getUserById(uid);
    return {
      id: uid,
      username: authUser.user?.email?.split('@')[0] || 'User'
    };
  });

  const users = await Promise.all(userPromises);
  const userMap = Object.fromEntries(users.map(u => [u.id, u.username]));

  // Get pick and accuracy stats for each user
  const userStatsPromises = allUserIds.map(async (uid) => {
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
    const gamePicks = picks.filter(pick => pick.game_id === game.id);
    
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
