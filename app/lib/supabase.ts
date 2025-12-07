import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';
import storage from './storage';

const supabaseUrl = 'https://oyedfzsqqqdfrmhbcbwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZWRmenNxcXFkZnJtaGJjYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwMDksImV4cCI6MjA3MjE1OTAwOX0.zlQAXksbwfK6y-pIQVgju9e1DG-Kj8Gmbpvvs9TPU5g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// ========== AUTH FUNCTIONS ==========

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
};

export const signUp = async (email: string, password: string, username: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
      },
    },
  });
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true, data: user };
};

// ========== WEEK MANAGEMENT FUNCTIONS ==========

export const getCurrentWeek = async () => {
  const { data, error } = await supabase
    .from('app_state')
    .select('current_week')
    .single();
  
  if (error) {
    console.error('Error getting current week:', error);
    return 1; // Default to week 1
  }
  
  return data?.current_week || 1;
};

export const updateCurrentWeek = async (weekNumber: number) => {
  const { error } = await supabase
    .from('app_state')
    .update({ 
      current_week: weekNumber,
      updated_at: new Date().toISOString()
    })
    .eq('id', 1);
  
  if (error) {
    return { success: false, error: error.message };
  }
  
  return { success: true };
};

export const populateWeekGames = async (weekNumber: number, games: any[]) => {
  const getSpreadValue = (spreadString: string): number => {
    const match = spreadString.match(/([+-]\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  const convertTo24Hour = (timeStr: string): string => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (period === 'PM' && hour24 !== 12) hour24 += 12;
    else if (period === 'AM' && hour24 === 12) hour24 = 0;
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
  };

  const gamesToInsert = games.map(game => {
    const gameDateTime = `${game.date}T${convertTo24Hour(game.time)}-04:00`;
    
    return {
      id: game.id,
      week: game.week,
      season: 2025,
      home_team: game.homeTeamShort,
      away_team: game.awayTeamShort,
      home_spread: getSpreadValue(game.spread.home),
      away_spread: getSpreadValue(game.spread.away),
      over_under_line: game.overUnder || null,
      league: 'NFL',
      game_date: gameDateTime,
      locked: false,
    };
  });

  console.log('First game being inserted:', JSON.stringify(gamesToInsert[0], null, 2));

  const { error } = await supabase
    .from('games')
    .upsert(gamesToInsert, { onConflict: 'id', ignoreDuplicates: false });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, count: gamesToInsert.length };
};

// ========== GAMES FUNCTIONS ==========

export const getGames = async (weekNumber?: number) => {
  let query = supabase
    .from('games')
    .select('*')
    .order('game_date', { ascending: true });
  
  if (weekNumber) {
    query = query.eq('week', weekNumber);
  }
  
  const { data, error } = await query;
  
  if (error) {
    throw error;
  }
  
  return data;
};

// ========== PICKS FUNCTIONS ==========

export const getUserPicks = async (userId: string, weekNumber?: number) => {
  // First get the picks
  let picksQuery = supabase
    .from('picks')
    .select('*')
    .eq('user_id', userId);

  if (weekNumber) {
    picksQuery = picksQuery.eq('week', weekNumber);
  }

  const { data: picks, error: picksError } = await picksQuery.order('created_at', { ascending: false });
  
  if (picksError) {
    throw picksError;
  }

  if (!picks || picks.length === 0) {
    return { success: true, data: [] };
  }

  // Get unique game IDs from picks
  const gameIds = [...new Set(picks.map(pick => pick.game_id))];

  // Get games data for those IDs
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, home_team, away_team, game_date')
    .in('id', gameIds);

  if (gamesError) {
    throw gamesError;
  }

  // Create a map for quick game lookup
  const gamesMap = new Map(games?.map(game => [game.id, game]) || []);

  // Combine picks with games data
  const picksWithGames = picks.map(pick => ({
    ...pick,
    games: gamesMap.get(pick.game_id) || null
  }));
  
  return { success: true, data: picksWithGames };
};

export const getUserPickHistory = async (userId: string) => {
  // First get the picks
  const { data: picks, error: picksError } = await supabase
    .from('picks')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (picksError) {
    throw picksError;
  }

  if (!picks || picks.length === 0) {
    return [];
  }

  // Get unique game IDs from picks
  const gameIds = [...new Set(picks.map(pick => pick.game_id))];

  // Get games data for those IDs
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, home_team, away_team, game_date')
    .in('id', gameIds);

  if (gamesError) {
    throw gamesError;
  }

  // Create a map for quick game lookup
  const gamesMap = new Map(games?.map(game => [game.id, game]) || []);

  // Combine picks with games data
  const picksWithGames = picks.map(pick => ({
    ...pick,
    games: gamesMap.get(pick.game_id) || null
  }));

  // Remove duplicates - keep the most recent pick for each game
  const uniquePicks = picksWithGames.reduce((acc, pick) => {
    const existingPick = acc.find(p => p.game_id === pick.game_id);
    if (!existingPick) {
      acc.push(pick);
    } else {
      // Keep the more recent pick
      if (new Date(pick.created_at) > new Date(existingPick.created_at)) {
        const index = acc.indexOf(existingPick);
        acc[index] = pick;
      }
    }
    return acc;
  }, [] as any[]);
  
  // Sort by created_at descending
  return uniquePicks.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
};

// Updated savePick function that preserves existing pick data
// Replace the existing savePick function in supabase.ts with this one

export const savePick = async (userId: string, pickData: {
  game_id: string;
  pick: string;
  team_picked: string | null;
  confidence: 'Low' | 'Medium' | 'High';
  reasoning: string;
  pick_type: 'solo' | 'group';
  groups: string[];
  spread_value: number | string;
  week: number;
  overUnderPick?: string | null;
  overUnderConfidence?: string | null;
  spread_line_at_pick?: number | null;
  total_line_at_pick?: number | null;
  time_before_game_minutes?: number | null;
  picked_at_time?: string | null;
  picked_day_of_week?: string | null;
  spread_size?: number | null;
  spread_category?: string | null;
  picked_favorite?: boolean | null;
  picked_team?: string | null;
  opponent_team?: string | null;
  pick_source?: string | null;
}): Promise<{ success: boolean; data?: any; error?: string }> => {
  try {
    // First, check if a pick already exists for this game
    const { data: existingPick, error: fetchError } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .eq('game_id', pickData.game_id)
      .single();

    // Determine if this is a spread/ML pick or O/U pick
    const isSpreadOrML = pickData.pick === 'home' || pickData.pick === 'away';
    const isOverUnder = pickData.overUnderPick === 'over' || pickData.overUnderPick === 'under';

    // Build the payload, preserving existing values for the other pick type
    let payload: any = {
      user_id: userId,
      game_id: pickData.game_id,
      pick_type: pickData.pick_type,
      reasoning: pickData.reasoning || '',
      season: 2025,
      week: pickData.week,
    };

    if (isSpreadOrML) {
      // Saving a spread/ML pick - preserve existing O/U data
      payload.pick = pickData.pick;
      payload.team_picked = pickData.team_picked;
      payload.confidence = pickData.confidence;
      payload.spread_size = pickData.spread_size ?? null;
      payload.spread_category = pickData.spread_category ?? null;
      payload.picked_favorite = pickData.picked_favorite ?? null;
      payload.picked_team = pickData.picked_team ?? null;
      payload.opponent_team = pickData.opponent_team ?? null;
      
      // Preserve existing O/U pick if it exists
      if (existingPick) {
        payload.over_under_pick = existingPick.over_under_pick;
        payload.over_under_confidence = existingPick.over_under_confidence;
      }
    } else if (isOverUnder) {
      // Saving an O/U pick - preserve existing spread/ML data
      payload.over_under_pick = pickData.overUnderPick;
      payload.over_under_confidence = pickData.overUnderConfidence;
      
      // Preserve existing spread pick if it exists
      if (existingPick) {
        payload.pick = existingPick.pick;
        payload.team_picked = existingPick.team_picked;
        payload.confidence = existingPick.confidence;
      } else {
        // No existing pick, need to set pick to something (required field)
        payload.pick = pickData.overUnderPick;
        payload.team_picked = null;
        payload.confidence = pickData.overUnderConfidence || 'Medium';
      }
    }

    let result;
    
    if (existingPick && !fetchError) {
      // Update existing pick
      result = await supabase
        .from('picks')
        .update(payload)
        .eq('id', existingPick.id)
        .select()
        .single();
    } else {
      // Insert new pick
      result = await supabase
        .from('picks')
        .insert({
          ...payload,
          correct: null,
          over_under_correct: null,
          created_at: new Date().toISOString()
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('Supabase error:', result.error);
      return { success: false, error: result.error.message };
    }

    // Handle group sharing - batch insert all at once
    if (pickData.pick_type === 'group' && pickData.groups?.length > 0 && result.data) {
      const pickId = result.data.id;
      
      // Build batch of group_picks to insert
      const groupPicksToInsert = pickData.groups.map(groupId => ({
        group_id: groupId,
        pick_id: pickId,
        user_id: userId,
        shared_at: new Date().toISOString()
      }));
      
      // Use upsert to handle duplicates gracefully
      await supabase
        .from('group_picks')
        .upsert(groupPicksToInsert, { 
          onConflict: 'group_id,pick_id',
          ignoreDuplicates: true 
        });
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error in savePick:', error);
    return { success: false, error: String(error) };
  }
};
// ========== GROUPS FUNCTIONS ==========

export const getGroups = async () => {
  const { data, error } = await supabase
    .from('groups')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const getGroupDetails = async (groupId: string) => {
  const { data, error } = await supabase
    .from('groups')
    .select(`
      *,
      group_members (
        user_id,
        role
      )
    `)
    .eq('id', groupId)
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const joinGroup = async (userId: string, groupId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .insert({
      user_id: userId,
      group_id: groupId,
      role: 'member'
    })
    .select()
    .single();
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const leaveGroup = async (userId: string, groupId: string) => {
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('user_id', userId)
    .eq('group_id', groupId);
  
  if (error) {
    throw error;
  }
  
  return { success: true };
};

export const createGroup = async (name: string, description: string, createdBy: string) => {
  // First create the group
  const { data: group, error: groupError } = await supabase
    .from('groups')
    .insert({
      name,
      description,
      created_by: createdBy
    })
    .select()
    .single();
  
  if (groupError) {
    throw groupError;
  }
  
  // Then add the creator as an admin member
  const { error: memberError } = await supabase
    .from('group_members')
    .insert({
      user_id: createdBy,
      group_id: group.id,
      role: 'admin'
    });
  
  if (memberError) {
    throw memberError;
  }
  
  return group;
};

export const getGroupMembers = async (groupId: string) => {
  const { data, error } = await supabase
    .from('group_members')
    .select(`
      *,
      users (
        id,
        email,
        username
      )
    `)
    .eq('group_id', groupId);
  
  if (error) {
    throw error;
  }
  
  return data;
};

export const getGroupPicks = async (groupId: string, weekNumber?: number) => {
  // Get all member IDs for the group
  const { data: members, error: membersError } = await supabase
    .from('group_members')
    .select('user_id')
    .eq('group_id', groupId);
  
  if (membersError) {
    throw membersError;
  }
  
  const userIds = members.map(m => m.user_id);
  
  // Get picks for all members
  let picksQuery = supabase
    .from('picks')
    .select(`
      *,
      users (
        id,
        email,
        username
      )
    `)
    .in('user_id', userIds);
  
  if (weekNumber) {
    picksQuery = picksQuery.eq('week', weekNumber);
  }
  
  const { data: picks, error: picksError } = await picksQuery;
  
  if (picksError) {
    throw picksError;
  }
  
  return picks;
};

// ========== USER STATS & PROFILE ==========


export const getUserStats = async (userId: string) => {
  try {
    // Get all picks for the user
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (picksError) {
      throw picksError;
    }

    // Get current week from app_state
    const { data: appState } = await supabase
      .from('app_state')
      .select('current_week')
      .single();
    
    const currentWeek = appState?.current_week || 1;

    // Get current week's games to check which are still upcoming (not locked)
    const { data: currentWeekGames } = await supabase
      .from('games')
      .select('id, locked, game_date')
      .eq('week', currentWeek)
      .eq('season', 2025);

    // Create a set of game IDs that are still upcoming (not locked)
    const upcomingGameIds = new Set(
      currentWeekGames
        ?.filter(game => {
          // Game is upcoming if not locked AND game_date is in the future
          if (game.locked) return false;
          const gameDate = new Date(game.game_date);
          return gameDate > new Date();
        })
        .map(game => game.id) || []
    );

    // Helper function to calculate stats for a subset of picks
    const calculateStats = (pickSubset: any[]) => {
      const spreadPicks = pickSubset.filter(pick => pick.team_picked !== null);
      const spreadCorrect = spreadPicks.filter(pick => pick.correct === true).length;
      const spreadIncorrect = spreadPicks.filter(pick => pick.correct === false).length;
      const spreadTotal = spreadCorrect + spreadIncorrect;
      const spreadWinRate = spreadTotal > 0 ? Math.round((spreadCorrect / spreadTotal) * 100) : 0;

      const ouPicks = pickSubset.filter(pick => pick.over_under_pick !== null);
      const ouCorrect = ouPicks.filter(pick => pick.over_under_correct === true).length;
      const ouIncorrect = ouPicks.filter(pick => pick.over_under_correct === false).length;
      const ouTotal = ouCorrect + ouIncorrect;
      const ouWinRate = ouTotal > 0 ? Math.round((ouCorrect / ouTotal) * 100) : 0;

      const totalCorrect = spreadCorrect + ouCorrect;
      const totalIncorrect = spreadIncorrect + ouIncorrect;
      const totalDecided = totalCorrect + totalIncorrect;
      const overallWinRate = totalDecided > 0 ? Math.round((totalCorrect / totalDecided) * 100) : 0;

      return {
        correct: totalCorrect,
        incorrect: totalIncorrect,
        decided: totalDecided,
        winRate: overallWinRate,
        spreadAccuracy: {
          percentage: spreadWinRate,
          wins: spreadCorrect,
          total: spreadTotal
        },
        overUnderAccuracy: {
          percentage: ouWinRate,
          wins: ouCorrect,
          total: ouTotal
        }
      };
    };

    // Calculate for different time periods
    // Last Week = most recently completed week
    const lastWeek = currentWeek > 1 ? currentWeek - 1 : currentWeek;
    const lastWeekPicks = picks?.filter(pick => pick.week === lastWeek && pick.season === 2025) || [];
    
    // Last Month = last 4 weeks including current
    const lastMonthStartWeek = Math.max(1, currentWeek - 3);
    const lastMonthPicks = picks?.filter(pick => 
      pick.week >= lastMonthStartWeek && 
      pick.week <= currentWeek && 
      pick.season === 2025
    ) || [];
    
    // Season = all picks from 2025 season (or all picks if season field doesn't exist)
    const seasonPicks = picks?.filter(pick => !pick.season || pick.season === 2025) || [];
    
    // All Time = all picks ever
    const allTimePicks = picks || [];

    // Debug logging
    console.log('=== STATS CALCULATION DEBUG ===');
    console.log('Total picks in database:', picks?.length);
    console.log('Current week:', currentWeek);
    console.log('Last week (Week ' + lastWeek + '):', lastWeekPicks.length, 'picks');
    console.log('Last month (Weeks ' + lastMonthStartWeek + '-' + currentWeek + '):', lastMonthPicks.length, 'picks');
    console.log('Season 2025:', seasonPicks.length, 'picks');
    console.log('All time:', allTimePicks.length, 'picks');
    
    // Show sample pick to see structure
    if (picks && picks.length > 0) {
      console.log('Sample pick:', JSON.stringify(picks[0], null, 2));
    }

    const lastWeekStats = calculateStats(lastWeekPicks);
    const lastMonthStats = calculateStats(lastMonthPicks);
    const seasonStats = calculateStats(seasonPicks);
    const allTimeStats = calculateStats(allTimePicks);

    console.log('Season stats calculated:', {
      correct: seasonStats.correct,
      incorrect: seasonStats.incorrect,
      decided: seasonStats.decided,
      winRate: seasonStats.winRate
    });
    console.log('Last week stats:', lastWeekStats);
    console.log('Last month stats:', lastMonthStats);
    console.log('All time stats:', allTimeStats);

    // Calculate UPCOMING PICKS correctly:
    // Only count picks for current week games that haven't started yet
    const upcomingPicks = picks?.filter(pick => 
      pick.week === currentWeek && 
      pick.season === 2025 &&
      upcomingGameIds.has(pick.game_id)
    ).length || 0;

    console.log('Upcoming game IDs:', upcomingGameIds.size);
    console.log('Upcoming picks (current week, unlocked games):', upcomingPicks);
    console.log('=== END DEBUG ===');

    // Total decided picks (for display as "Total Picks")
    const totalDecidedPicks = seasonStats.decided;
    
    // Current week picks count
    const currentWeekPicks = picks?.filter(pick => pick.week === currentWeek).length || 0;

    return {
      success: true,
      data: {
        // Use decided picks as "Total Picks" for cleaner display
        totalPicks: totalDecidedPicks,
        correctPicks: seasonStats.correct,
        incorrectPicks: seasonStats.incorrect,
        // NEW: upcomingPicks only counts current week, unlocked games
        pendingPicks: upcomingPicks,
        upcomingPicks: upcomingPicks,
        winRate: seasonStats.winRate,
        currentWeek,
        currentWeekPicks,
        decidedPicks: seasonStats.decided,
        
        // Time period breakdowns
        lastWeek: {
          record: `${lastWeekStats.correct}-${lastWeekStats.incorrect}`,
          winRate: lastWeekStats.winRate,
          correct: lastWeekStats.correct,
          incorrect: lastWeekStats.incorrect
        },
        lastMonth: {
          record: `${lastMonthStats.correct}-${lastMonthStats.incorrect}`,
          winRate: lastMonthStats.winRate,
          correct: lastMonthStats.correct,
          incorrect: lastMonthStats.incorrect
        },
        season: {
          record: `${seasonStats.correct}-${seasonStats.incorrect}`,
          winRate: seasonStats.winRate,
          correct: seasonStats.correct,
          incorrect: seasonStats.incorrect
        },
        allTime: {
          record: `${allTimeStats.correct}-${allTimeStats.incorrect}`,
          winRate: allTimeStats.winRate,
          correct: allTimeStats.correct,
          incorrect: allTimeStats.incorrect
        },
        
        // Default to season stats for main display
        spreadAccuracy: seasonStats.spreadAccuracy,
        overUnderAccuracy: seasonStats.overUnderAccuracy
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user stats'
    };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    // First get the user's auth data
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      throw authError;
    }

    // Try to get profile from profiles table if it exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    // If profiles table doesn't exist or no profile found, use auth data
    if (profileError) {
      // Return basic profile from auth metadata
      return {
        id: user?.id,
        email: user?.email,
        username: user?.user_metadata?.username || user?.email?.split('@')[0],
        created_at: user?.created_at,
        avatar_url: user?.user_metadata?.avatar_url || null,
      };
    }
    
    return profile;
  } catch (error) {
    console.error('Error getting user profile:', error);
    // Return minimal profile on error
    return {
      id: userId,
      email: '',
      username: 'User',
      created_at: new Date().toISOString(),
      avatar_url: null,
    };
  }
};

