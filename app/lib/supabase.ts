import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'
import 'react-native-url-polyfill/auto'

const supabaseUrl = 'https://oyedfzsqqqdfrmhbcbwb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZWRmenNxcXFkZnJtaGJjYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwMDksImV4cCI6MjA3MjE1OTAwOX0.zlQAXksbwfK6y-pIQVgju9e1DG-Kj8Gmbpvvs9TPU5g'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})
// Helper functions for picks
export const savePick = async (userId: string, pickData: {
  game_id: string;
  week: number;
  season: number;
  pick_type: 'solo' | 'group';
  team_picked: 'home' | 'away';
  confidence: 'Low' | 'Medium' | 'High';
  reasoning?: string;
  groups?: string[];
}) => {
  try {
    // Insert or update the pick
    const { data: pick, error: pickError } = await supabase
      .from('picks')
      .upsert({
        user_id: userId,
        game_id: pickData.game_id,
        pick: pickData.team_picked,
        week: pickData.week,
        season: pickData.season,
        pick_type: pickData.pick_type,
        team_picked: pickData.team_picked,
        confidence: pickData.confidence,
        reasoning: pickData.reasoning,
      })
      .select()
      .single();

    if (pickError) throw pickError;

    // If group pick, add group associations
    if (pickData.pick_type === 'group' && pickData.groups && pickData.groups.length > 0) {
      // First, get group IDs from group names
      const { data: groupsData, error: groupsError } = await supabase
        .from('groups')
        .select('id')
        .in('name', pickData.groups);

      if (groupsError) throw groupsError;

      if (groupsData && groupsData.length > 0) {
        const groupAssociations = groupsData.map(group => ({
          pick_id: pick.id,
          group_id: group.id,
        }));

        const { error: groupError } = await supabase
          .from('pick_groups')
          .upsert(groupAssociations);

        if (groupError) throw groupError;
      }
    }

    return { success: true, data: pick };
  } catch (error) {
    console.error('Error saving pick:', error);
    return { success: false, error };
  }
};

export const getUserPicks = async (userId: string, week?: number) => {
  try {
    let query = supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (week) {
      query = query.eq('week', week);
    }

    const { data, error } = await query;

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching picks:', error);
    return { success: false, error };
  }
};

export const getGroupPicks = async (groupName: string, gameId: string) => {
  try {
    // First get the group ID
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('id')
      .eq('name', groupName)
      .single();

    if (groupError) throw groupError;

    // Then get picks for this group and game
    const { data, error } = await supabase
      .from('pick_groups')
      .select(`
        picks!inner(
          *,
          profiles(username, display_name)
        )
      `)
      .eq('group_id', group.id)
      .eq('picks.game_id', gameId);

    if (error) throw error;
    return { success: true, data };
  } catch (error) {
    console.error('Error fetching group picks:', error);
    return { success: false, error };
  }
};