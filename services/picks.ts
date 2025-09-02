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
  
  try {
    const { data, error } = await supabase
      .from('picks')
      .upsert({
        user_id: userId,
        game_id: pickData.game_id,
        pick: pickData.pick,
        confidence: pickData.confidence,
        reasoning: pickData.reasoning,
        created_at: new Date().toISOString(),
      })
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