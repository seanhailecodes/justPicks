// app/services/picks.ts
import { supabase } from '../app/lib/supabase';

export type PickData = {
  game_id: string;
  pick: string; // 'home' or 'away'
  confidence: 'Low' | 'Medium' | 'High';
  reasoning?: string;
  pick_type: 'solo' | 'group';
  groups?: string[];
};

export const savePick = async (userId: string, pickData: PickData) => {
  console.log('savePick called with:', { userId, pickData });
  
  // Create the insert object so we can log it
  const insertData = {
    user_id: userId,
    game_id: pickData.game_id,
    pick: pickData.pick,  // This should not be null
    team_picked: pickData.pick,
    confidence: pickData.confidence,
    reasoning: pickData.reasoning || '',
    pick_type: pickData.pick_type,
    groups: pickData.groups,
    season: 2025,
    week: 1,
    spread_value: 0,
    created_at: new Date().toISOString(),
  };
  
  console.log('EXACT DATA being sent to Supabase:', JSON.stringify(insertData, null, 2));
  
  try {
    const { data, error } = await supabase
      .from('picks')
      .upsert(insertData)
      .select()
      .single();

    console.log('Supabase response:', { data, error });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error saving pick:', error);
    return { success: false, error };
  }
};

export const getGamesForWeek = async (week: number) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .like('id', `2025_W${week}_%`)
      .order('game_date', { ascending: true });

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching games:', error);
    return { success: false, error, data: [] };
  }
};


export const getGameById = async (gameId: string) => {
  try {
    const { data, error } = await supabase
      .from('games')
      .select('*')
      .eq('id', gameId)
      .single();

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching game:', error);
    return { success: false, error };
  }
};

export const getUserPicks = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching picks:', error);
    return { success: false, error };
  }
};

export const getPicksForGame = async (gameId: string) => {
  try {
    const { data, error } = await supabase
      .from('picks')
      .select('*')
      .eq('game_id', gameId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching picks for game:', error);
    return { success: false, error, data: [] };
  }
};