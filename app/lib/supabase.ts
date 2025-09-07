import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

//  Conditional storage based on platform
const createStorage = () => {
  if (Platform.OS === 'web') {
    // Use localStorage for web
    return {
      getItem: (key: string) => Promise.resolve(localStorage.getItem(key)),
      setItem: (key: string, value: string) => Promise.resolve(localStorage.setItem(key, value)),
      removeItem: (key: string) => Promise.resolve(localStorage.removeItem(key)),
    };
  } else {
    // Use AsyncStorage for mobile
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }
};

const supabaseUrl = 'https://oyedfzsqqqdfrmhbcbwb.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZWRmenNxcXFkZnJtaGJjYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwMDksImV4cCI6MjA3MjE1OTAwOX0.zlQAXksbwfK6y-pIQVgju9e1DG-Kj8Gmbpvvs9TPU5g';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

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

export const savePick = async (
  userId: string, 
  gameId: string, 
  pickedTeam: string, 
  weekNumber: number
) => {
  // First, check if a pick already exists for this user and game
  const { data: existingPick, error: checkError } = await supabase
    .from('picks')
    .select('id')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .single();

  if (checkError && checkError.code !== 'PGRST116') { // PGRST116 means no rows found
    throw checkError;
  }

  let result;

  if (existingPick) {
    // Update existing pick
    result = await supabase
      .from('picks')
      .update({ 
        pick: pickedTeam,
        team_picked: pickedTeam,
        week: weekNumber,
        season: 2025,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingPick.id)
      .select()
      .single();
  } else {
    // Insert new pick
    result = await supabase
      .from('picks')
      .insert({ 
        user_id: userId, 
        game_id: gameId, 
        pick: pickedTeam,
        team_picked: pickedTeam,
        week: weekNumber,
        season: 2025,
        pick_type: 'solo',
        confidence: 'Medium',
        correct: null,
        created_at: new Date().toISOString()
      })
      .select()
      .single();
  }

  if (result.error) {
    throw result.error;
  }
  
  return { success: true, data: result.data };
};

export const deletePick = async (userId: string, gameId: string) => {
  const { error } = await supabase
    .from('picks')
    .delete()
    .eq('user_id', userId)
    .eq('game_id', gameId);
  
  if (error) {
    throw error;
  }
  
  return { success: true };
};

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

export const getUserStats = async (userId: string) => {
  try {
    // Get all picks for the user
    const { data: picks, error: picksError } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId);
    
    if (picksError) {
      throw picksError;
    }

    // Calculate statistics
    const totalPicks = picks?.length || 0;
    const correctPicks = picks?.filter(pick => pick.correct === true).length || 0;
    const incorrectPicks = picks?.filter(pick => pick.correct === false).length || 0;
    const pendingPicks = picks?.filter(pick => pick.correct === null).length || 0;
    
    // Calculate win rate
    const decidedPicks = correctPicks + incorrectPicks;
    const winRate = decidedPicks > 0 ? Math.round((correctPicks / decidedPicks) * 100) : 0;

    // Get current week picks
    const currentWeek = Math.max(...(picks?.map(p => p.week) || [1]), 1);
    const currentWeekPicks = picks?.filter(pick => pick.week === currentWeek).length || 0;

    return {
      success: true,
      data: {
        totalPicks,
        correctPicks,
        incorrectPicks,
        pendingPicks,
        winRate,
        currentWeek,
        currentWeekPicks,
        decidedPicks
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