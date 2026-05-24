import { supabase, getCurrentSeason } from './supabase'; // Adjust path to your supabase config

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

// Updated UserGroup interface with performance metrics and sport
export interface UserGroup {
  id: string;
  name: string;
  sport: string; // 'nfl' | 'nba' | 'ncaab' | 'ncaaf' | etc.
  role: 'primary_owner' | 'owner' | 'member';
  visibility: 'private' | 'public';
  joinType: 'invite_only' | 'request_to_join' | 'open';
  memberCount: number;
  activePicks: number;
  pendingPicks: number;
  createdAt: string;
  // Performance metrics
  rating: number | null; // Overall accuracy %
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
    .eq('season', getCurrentSeason());

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

// Calculate group accuracy metrics from group_picks table only
export async function getGroupAccuracy(groupId: string, season?: number): Promise<{
  rating: number | null;
  weekAccuracy: number | null;
  monthAccuracy: number | null;
  allTimeAccuracy: number | null;
  totalPicks: number;
  trend: 'up' | 'down' | 'neutral';
}> {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  // Get all picks shared to this group (via group_picks junction table)
  const { data: groupPicks, error: groupPicksError } = await supabase
    .from('group_picks')
    .select(`
      pick_id,
      shared_at,
      picks (
        id,
        correct,
        game_id
      )
    `)
    .eq('group_id', groupId);
    
  if (groupPicksError) {
    console.error('Error fetching group picks:', groupPicksError);
    return {
      rating: null,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: 0,
      trend: 'neutral'
    };
  }
  
  if (!groupPicks?.length) {
    // No picks shared to this group yet
    return {
      rating: null,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: 0,
      trend: 'neutral'
    };
  }
  
  // Filter to only scored picks (correct is not null)
  const scoredPicks = groupPicks.filter(gp => (gp.picks as any)?.correct !== null);
  
  if (!scoredPicks.length) {
    return {
      rating: null,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: groupPicks.length, // Show total picks even if not scored yet
      trend: 'neutral'
    };
  }
  
  // Get game dates for time-based filtering
  // This group's sport — the rating must reflect only this sport's
  // games, not every pick a member auto-shares into the group.
  const { data: groupRow } = await supabase
    .from('groups').select('sport').eq('id', groupId).single();
  const groupSport = (groupRow?.sport || 'nfl').toLowerCase();

  const gameIds = [...new Set(scoredPicks.map(p => (p.picks as any)?.game_id).filter(Boolean))];
  const { data: games } = await supabase
    .from('games')
    .select('id, game_date, league, season')
    .in('id', gameIds);
    
  if (!games) {
    return {
      rating: null,
      weekAccuracy: null,
      monthAccuracy: null,
      allTimeAccuracy: null,
      totalPicks: groupPicks.length,
      trend: 'neutral'
    };
  }
  
  // Create a map of game_id to game_date
  const gameMap = new Map(games.map(g => [g.id, { date: new Date(g.game_date), league: (g.league || '').toLowerCase(), season: g.season as number }]));
  
  // Add game data to picks — keep only this group's sport, and (when a
  // season is given) only that season. For a past season the week/month
  // windows naturally come up empty, so it reads as a season summary.
  const picksWithDates = scoredPicks.map(gp => {
    const pick: any = gp.picks;
    const g = gameMap.get(pick?.game_id);
    return { correct: pick?.correct, gameDate: g?.date, league: g?.league, season: g?.season };
  }).filter(p => p.gameDate && p.league === groupSport && (season == null || p.season === season));
  
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
    rating: allTimeAccuracy,
    weekAccuracy,
    monthAccuracy,
    allTimeAccuracy,
    totalPicks: groupPicks.length,
    trend
  };
}

// ============================================================
// SEASON RECAP — end-of-season summary for a group.
//
// Aggregates every pick shared to the group for ONE season into a
// leaderboard, hot streaks, biggest misses, trends and totals.
// Powers the out-of-season "2025-26 Season" view on the group
// screen (when a sport is out of season we show this instead of
// the week-by-week strip).
//
// Scoped to the group's own sport + the requested season so an
// NFL group's recap never mixes in members' NBA/MLB picks.
// ============================================================

export interface SeasonRecapMember {
  userId: string;
  name: string;
  picks: number;          // scored picks (correct is true/false)
  wins: number;
  accuracy: number;       // 0-100
  bestStreak: number;     // longest win streak this season
  worstStreak: number;    // longest losing streak this season
  currentStreak: number;  // streak ending on the latest pick (+win / -loss)
}

export interface SeasonRecapMiss {
  userId: string;
  name: string;
  matchup: string;        // "AWY @ HOM"
  pickLabel: string;      // "Cowboys -3.5"
  missedBy: number;       // points short of covering (always positive)
  badBeat: boolean;
}

export interface SeasonRecapTrend {
  emoji: string;
  label: string;
  detail: string;
}

export interface SeasonRecapData {
  season: number;
  hasData: boolean;
  scoredPicks: number;
  totalCorrect: number;
  groupAccuracy: number | null;
  pickerCount: number;            // distinct members who picked
  leaderboard: SeasonRecapMember[];
  hotStreaks: SeasonRecapMember[];
  coldStreaks: SeasonRecapMember[];
  biggestMisses: SeasonRecapMiss[];
  trends: SeasonRecapTrend[];
}

export async function getSeasonRecap(groupId: string, season: number): Promise<SeasonRecapData> {
  const empty: SeasonRecapData = {
    season, hasData: false, scoredPicks: 0, totalCorrect: 0,
    groupAccuracy: null, pickerCount: 0,
    leaderboard: [], hotStreaks: [], coldStreaks: [], biggestMisses: [], trends: [],
  };

  // Group sport — only this sport's games count toward the recap.
  const { data: groupRow } = await supabase
    .from('groups').select('sport').eq('id', groupId).single();
  const groupSport = (groupRow?.sport || 'nfl').toLowerCase();

  // Members
  const { data: members } = await supabase
    .from('group_members').select('user_id').eq('group_id', groupId);
  const memberIds = [...new Set((members || []).map(m => m.user_id))];
  if (memberIds.length === 0) return empty;

  // Picks shared to this group by its members
  const { data: picks } = await supabase
    .from('picks')
    .select('id, user_id, game_id, pick, team_picked, picked_team, spread_value, correct, cover_margin, was_close, bad_beat, pick_source, picked_favorite, with_public, created_at')
    .contains('groups', [groupId])
    .in('user_id', memberIds);
  if (!picks || picks.length === 0) return empty;

  // Games — used to filter by sport + season and to label matchups.
  const gameIds = [...new Set(picks.map(p => p.game_id).filter(Boolean))];
  const { data: games } = await supabase
    .from('games')
    .select('id, game_date, league, season, home_team, away_team')
    .in('id', gameIds);
  const gameMap = new Map((games || []).map((g: any) => [g.id, g]));

  // Keep only this season + this sport.
  const seasonPicks = picks.filter((p: any) => {
    const g = gameMap.get(p.game_id);
    return g && (g.league || '').toLowerCase() === groupSport && g.season === season;
  });
  if (seasonPicks.length === 0) return { ...empty, pickerCount: 0 };

  // Member names
  const { data: profiles } = await supabase
    .from('profiles').select('id, display_name, username').in('id', memberIds);
  const nameMap = new Map(
    (profiles || []).map((p: any) => [p.id, p.username || p.display_name || 'Member'])
  );

  // ---- Per-member aggregation ----
  const byMember = new Map<string, any[]>();
  seasonPicks.forEach((p: any) => {
    if (!byMember.has(p.user_id)) byMember.set(p.user_id, []);
    byMember.get(p.user_id)!.push(p);
  });

  const memberStats: SeasonRecapMember[] = [];
  byMember.forEach((mPicks, userId) => {
    const scored = mPicks.filter(p => p.correct === true || p.correct === false);
    if (scored.length === 0) return;

    // Order chronologically by game date so streaks read correctly.
    scored.sort((a, b) => {
      const da = new Date(gameMap.get(a.game_id)?.game_date || a.created_at).getTime();
      const db = new Date(gameMap.get(b.game_id)?.game_date || b.created_at).getTime();
      return da - db;
    });

    const wins = scored.filter(p => p.correct === true).length;

    // Longest win streak and longest losing streak
    let best = 0, worst = 0, winRun = 0, lossRun = 0;
    scored.forEach(p => {
      if (p.correct === true) {
        winRun += 1; best = Math.max(best, winRun); lossRun = 0;
      } else {
        lossRun += 1; worst = Math.max(worst, lossRun); winRun = 0;
      }
    });

    // Current streak — walk back from the most recent pick
    let current = 0;
    for (let i = scored.length - 1; i >= 0; i--) {
      const won = scored[i].correct === true;
      if (i === scored.length - 1) current = won ? 1 : -1;
      else if (won && current > 0) current += 1;
      else if (!won && current < 0) current -= 1;
      else break;
    }

    memberStats.push({
      userId,
      name: nameMap.get(userId) || 'Member',
      picks: scored.length,
      wins,
      accuracy: Math.round((wins / scored.length) * 100),
      bestStreak: best,
      worstStreak: worst,
      currentStreak: current,
    });
  });

  if (memberStats.length === 0) return { ...empty, pickerCount: 0 };

  // Leaderboard — best accuracy first, tie-break on volume.
  const leaderboard = [...memberStats].sort(
    (a, b) => b.accuracy - a.accuracy || b.picks - a.picks
  );

  // Hot streaks — longest WIN streak each member put together (2+).
  const hotStreaks = [...memberStats]
    .filter(m => m.bestStreak >= 2)
    .sort((a, b) => b.bestStreak - a.bestStreak || b.accuracy - a.accuracy);

  // Cold streaks — longest LOSING streak each member hit (2+).
  // Its own category so it never gets mixed into Hot Streaks.
  const coldStreaks = [...memberStats]
    .filter(m => m.worstStreak >= 2)
    .sort((a, b) => b.worstStreak - a.worstStreak || a.accuracy - b.accuracy);

  // ---- Biggest misses — losses ranked by how far short they fell ----
  const biggestMisses: SeasonRecapMiss[] = seasonPicks
    .filter((p: any) => p.correct === false && p.cover_margin != null)
    .map((p: any) => {
      const g = gameMap.get(p.game_id);
      const team = p.team_picked || p.picked_team
        || (p.pick === 'home' ? g?.home_team : g?.away_team) || 'Pick';
      const spread = p.spread_value != null
        ? ` ${Number(p.spread_value) > 0 ? '+' : ''}${p.spread_value}` : '';
      return {
        userId: p.user_id,
        name: nameMap.get(p.user_id) || 'Member',
        matchup: g ? `${g.away_team} @ ${g.home_team}` : '',
        pickLabel: `${team}${spread}`,
        missedBy: Math.abs(Number(p.cover_margin)),
        badBeat: p.bad_beat === true,
      };
    })
    .sort((a, b) => b.missedBy - a.missedBy)
    .slice(0, 5);

  // ---- Totals ----
  const allScored = seasonPicks.filter((p: any) => p.correct === true || p.correct === false);
  const totalCorrect = allScored.filter((p: any) => p.correct === true).length;
  const groupAccuracy = allScored.length > 0
    ? Math.round((totalCorrect / allScored.length) * 100) : null;

  // ---- Trends — only surface splits backed by real data ----
  const trends: SeasonRecapTrend[] = [];
  const winRate = (arr: any[]): number | null =>
    arr.length ? Math.round((arr.filter(p => p.correct === true).length / arr.length) * 100) : null;

  // Favorites vs underdogs
  const favs = allScored.filter((p: any) => p.picked_favorite === true);
  const dogs = allScored.filter((p: any) => p.picked_favorite === false);
  if (favs.length >= 3 && dogs.length >= 3) {
    const fr = winRate(favs)!, dr = winRate(dogs)!;
    const better = fr >= dr ? 'favorites' : 'underdogs';
    trends.push({
      emoji: better === 'favorites' ? '⭐' : '🐶',
      label: `Stronger on ${better}`,
      detail: `Favorites ${fr}% (${favs.length}) · Underdogs ${dr}% (${dogs.length})`,
    });
  } else if (favs.length + dogs.length >= 3) {
    const favShare = Math.round((favs.length / (favs.length + dogs.length)) * 100);
    trends.push({
      emoji: favShare >= 60 ? '⭐' : favShare <= 40 ? '🐶' : '⚖️',
      label: favShare >= 60 ? 'Favorite-leaning group'
        : favShare <= 40 ? 'Underdog-leaning group' : 'Balanced fav/dog mix',
      detail: `${favShare}% of picks were on favorites`,
    });
  }

  // With the public vs contrarian
  const withPub = allScored.filter((p: any) => p.with_public === true);
  const fade = allScored.filter((p: any) => p.with_public === false);
  if (withPub.length >= 3 && fade.length >= 3) {
    const wr = winRate(withPub)!, fp = winRate(fade)!;
    trends.push({
      emoji: '👥',
      label: fp > wr ? 'Sharp — fading the public pays off' : 'Rides with the public',
      detail: `With public ${wr}% · Contrarian ${fp}%`,
    });
  }

  // Pick-source distribution
  const withSource = seasonPicks.filter((p: any) => p.pick_source);
  if (withSource.length >= 3) {
    const counts = new Map<string, number>();
    withSource.forEach((p: any) => counts.set(p.pick_source, (counts.get(p.pick_source) || 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top) {
      const label = top[0].replace(/_/g, ' ');
      trends.push({
        emoji: '🧭',
        label: `Go-to approach: ${label}`,
        detail: `${top[1]} of ${withSource.length} picks cited "${label}"`,
      });
    }
  }

  // Bad beats
  const badBeats = seasonPicks.filter((p: any) => p.bad_beat === true).length;
  if (badBeats > 0) {
    trends.push({
      emoji: '💔',
      label: `${badBeats} bad beat${badBeats === 1 ? '' : 's'}`,
      detail: 'Picks that were covering until the final whistle',
    });
  }

  // Close games
  const closeGames = allScored.filter((p: any) => p.was_close === true);
  if (closeGames.length >= 3) {
    const cr = winRate(closeGames);
    if (cr != null) {
      trends.push({
        emoji: '🎯',
        label: `${cr}% in nail-biters`,
        detail: `${closeGames.length} picks decided by a close margin`,
      });
    }
  }

  return {
    season,
    hasData: true,
    scoredPicks: allScored.length,
    totalCorrect,
    groupAccuracy,
    pickerCount: memberStats.length,
    leaderboard,
    hotStreaks,
    coldStreaks,
    biggestMisses,
    trends,
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

    // Get group details INCLUDING sport field and creation date for sorting
    const { data: groups, error: groupError } = await supabase
      .from('groups')
      .select('id, name, sport, visibility, join_type, created_at')
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
          .eq('season', getCurrentSeason());

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
          sport: group.sport || 'nfl', // Default to 'nfl' if not set
          role: membership?.role || 'member',
          visibility: group.visibility || 'private',
          joinType: group.join_type || 'invite_only',
          memberCount: memberCount || 0,
          createdAt: group.created_at,
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

    // Sort: active groups (with picks) first, then by most recently created
    userGroups.sort((a, b) => {
      const aActive = (a.totalGroupPicks ?? 0) > 0;
      const bActive = (b.totalGroupPicks ?? 0) > 0;
      if (aActive !== bActive) return aActive ? -1 : 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return userGroups;
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return [];
  }
}