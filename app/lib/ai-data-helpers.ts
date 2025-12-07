// ============================================
// AI DATA COLLECTION HELPERS
// Add to your lib/ folder
// ============================================

import { supabase } from './supabase';

// ============================================
// TYPES
// ============================================

export interface GameView {
  id: string;
  user_id: string;
  game_id: string;
  first_viewed_at: string;
  last_viewed_at: string;
  view_count: number;
  total_view_seconds: number;
  expanded_details: boolean;
  viewed_team_stats: boolean;
  viewed_injuries: boolean;
  viewed_weather: boolean;
  viewed_public_betting: boolean;
  added_to_ticket: boolean;
  removed_from_ticket: boolean;
  final_action: string | null;
  pick_id: string | null;
  week: number;
  season: number;
}

export interface TeamSituation {
  team: string;
  week: number;
  season: number;
  opponent: string;
  is_home: boolean;
  days_rest: number;
  prev_game_date: string | null;
  is_short_rest: boolean;
  coming_off_bye: boolean;
  travel_miles: number;
  timezone_change: number;
  wins: number;
  losses: number;
  streak: number;
  ats_wins: number;
  ats_losses: number;
  injury_impact_score: number;
  qb_status: string;
  qb_name: string;
  key_injuries: any[];
}

export interface UserPreferences {
  favorite_teams: string[];
  avoided_teams: string[];
  risk_tolerance: 'conservative' | 'moderate' | 'aggressive' | 'degen';
  preferred_bet_types: string[];
  prefer_underdogs: boolean;
  fade_public: boolean;
  fade_public_threshold: number;
  avoid_thursday: boolean;
  experience_level: string;
}

export type PickSource = 'gut' | 'research' | 'model' | 'following_expert' | 'contrarian' | 
  'revenge' | 'streak' | 'matchup' | 'injury_news' | 'weather' | 'ai_suggested' | 'other';

// ============================================
// GAME VIEW TRACKING
// ============================================

/**
 * Track when a user views a game card
 * Call this when user taps/views a game
 */
export const trackGameView = async (
  userId: string,
  gameId: string,
  week: number,
  season: number = 2025
): Promise<void> => {
  try {
    // Check if view exists
    const { data: existing } = await supabase
      .from('user_game_views')
      .select('id, view_count')
      .eq('user_id', userId)
      .eq('game_id', gameId)
      .single();

    if (existing) {
      // Update existing view
      await supabase
        .from('user_game_views')
        .update({
          last_viewed_at: new Date().toISOString(),
          view_count: existing.view_count + 1
        })
        .eq('id', existing.id);
    } else {
      // Create new view
      await supabase
        .from('user_game_views')
        .insert({
          user_id: userId,
          game_id: gameId,
          week,
          season,
          view_count: 1
        });
    }
  } catch (error) {
    console.error('Error tracking game view:', error);
  }
};

/**
 * Track additional engagement with a game
 * Call when user expands details, views injuries, etc.
 */
export const trackGameEngagement = async (
  userId: string,
  gameId: string,
  engagement: {
    expanded_details?: boolean;
    viewed_team_stats?: boolean;
    viewed_injuries?: boolean;
    viewed_weather?: boolean;
    viewed_public_betting?: boolean;
    view_duration_seconds?: number;
  }
): Promise<void> => {
  try {
    const updates: any = {};
    
    if (engagement.expanded_details) updates.expanded_details = true;
    if (engagement.viewed_team_stats) updates.viewed_team_stats = true;
    if (engagement.viewed_injuries) updates.viewed_injuries = true;
    if (engagement.viewed_weather) updates.viewed_weather = true;
    if (engagement.viewed_public_betting) updates.viewed_public_betting = true;
    if (engagement.view_duration_seconds) {
      // Add to total
      const { data: existing } = await supabase
        .from('user_game_views')
        .select('total_view_seconds')
        .eq('user_id', userId)
        .eq('game_id', gameId)
        .single();
      
      updates.total_view_seconds = (existing?.total_view_seconds || 0) + engagement.view_duration_seconds;
    }

    await supabase
      .from('user_game_views')
      .update(updates)
      .eq('user_id', userId)
      .eq('game_id', gameId);
  } catch (error) {
    console.error('Error tracking engagement:', error);
  }
};

/**
 * Track when user adds a game to their picks ticket
 */
export const trackAddedToTicket = async (
  userId: string,
  gameId: string
): Promise<void> => {
  try {
    await supabase
      .from('user_game_views')
      .update({ 
        added_to_ticket: true,
        removed_from_ticket: false 
      })
      .eq('user_id', userId)
      .eq('game_id', gameId);
  } catch (error) {
    console.error('Error tracking added to ticket:', error);
  }
};

/**
 * Track when user removes a game from their picks ticket
 */
export const trackRemovedFromTicket = async (
  userId: string,
  gameId: string
): Promise<void> => {
  try {
    await supabase
      .from('user_game_views')
      .update({ 
        removed_from_ticket: true 
      })
      .eq('user_id', userId)
      .eq('game_id', gameId);
  } catch (error) {
    console.error('Error tracking removed from ticket:', error);
  }
};

/**
 * Mark game view with final action when pick is saved
 */
export const trackPickMade = async (
  userId: string,
  gameId: string,
  pickId: string,
  betType: 'spread' | 'total' | 'moneyline'
): Promise<void> => {
  try {
    await supabase
      .from('user_game_views')
      .update({
        final_action: `picked_${betType}`,
        pick_id: pickId
      })
      .eq('user_id', userId)
      .eq('game_id', gameId);
  } catch (error) {
    console.error('Error tracking pick made:', error);
  }
};

/**
 * Get games user viewed but didn't pick (consideration data)
 */
export const getUnpickedViews = async (
  userId: string,
  week: number
): Promise<GameView[]> => {
  const { data, error } = await supabase
    .from('user_game_views')
    .select('*')
    .eq('user_id', userId)
    .eq('week', week)
    .is('pick_id', null);

  if (error) {
    console.error('Error getting unpicked views:', error);
    return [];
  }
  return data || [];
};


// ============================================
// TEAM SITUATIONS
// ============================================

/**
 * Get team situation for a specific team/week
 */
export const getTeamSituation = async (
  team: string,
  week: number,
  season: number = 2025
): Promise<TeamSituation | null> => {
  const { data, error } = await supabase
    .from('team_situations')
    .select('*')
    .eq('team', team)
    .eq('week', week)
    .eq('season', season)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting team situation:', error);
  }
  return data;
};

/**
 * Get all team situations for a week
 */
export const getWeekTeamSituations = async (
  week: number,
  season: number = 2025
): Promise<TeamSituation[]> => {
  const { data, error } = await supabase
    .from('team_situations')
    .select('*')
    .eq('week', week)
    .eq('season', season);

  if (error) {
    console.error('Error getting week situations:', error);
    return [];
  }
  return data || [];
};

/**
 * Calculate days between two dates
 */
const daysBetween = (date1: string | Date, date2: string | Date): number => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Upsert team situation (for admin/data population)
 */
export const upsertTeamSituation = async (
  situation: Partial<TeamSituation> & { team: string; week: number }
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('team_situations')
    .upsert({
      ...situation,
      season: situation.season || 2025,
      updated_at: new Date().toISOString()
    }, { onConflict: 'team,week,season' });

  if (error) {
    console.error('Error upserting team situation:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
};

/**
 * Batch upsert team situations for a week
 */
export const populateWeekTeamSituations = async (
  situations: Array<Partial<TeamSituation> & { team: string; week: number }>
): Promise<{ success: boolean; count: number; error?: string }> => {
  const payload = situations.map(s => ({
    ...s,
    season: s.season || 2025,
    updated_at: new Date().toISOString()
  }));

  const { error } = await supabase
    .from('team_situations')
    .upsert(payload, { onConflict: 'team,week,season' });

  if (error) {
    console.error('Error populating team situations:', error);
    return { success: false, count: 0, error: error.message };
  }
  return { success: true, count: situations.length };
};


// ============================================
// USER PREFERENCES
// ============================================

/**
 * Get user preferences
 */
export const getUserPreferences = async (
  userId: string
): Promise<UserPreferences | null> => {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting preferences:', error);
  }
  return data;
};

/**
 * Save user preferences
 */
export const saveUserPreferences = async (
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<{ success: boolean; error?: string }> => {
  const { error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

  if (error) {
    console.error('Error saving preferences:', error);
    return { success: false, error: error.message };
  }
  return { success: true };
};


// ============================================
// USER ANALYTICS
// ============================================

/**
 * Get user analytics
 */
export const getUserAnalytics = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_analytics')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error getting analytics:', error);
  }
  return data;
};

/**
 * Refresh user analytics (recalculate from picks)
 * Call this after game results are in
 */
export const refreshUserAnalytics = async (userId: string): Promise<void> => {
  try {
    // Get all resolved picks
    const { data: picks } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .not('correct', 'is', null);

    if (!picks || picks.length === 0) return;

    // Calculate stats
    const stats = {
      total_picks: picks.length,
      total_wins: picks.filter(p => p.correct === true).length,
      total_losses: picks.filter(p => p.correct === false).length,
      win_rate: 0,
      
      // By confidence
      high_conf: { picks: 0, wins: 0, losses: 0, rate: 0 },
      medium_conf: { picks: 0, wins: 0, losses: 0, rate: 0 },
      low_conf: { picks: 0, wins: 0, losses: 0, rate: 0 },
      
      // By game context
      primetime_stats: { picks: 0, wins: 0, losses: 0, rate: 0 },
      divisional_stats: { picks: 0, wins: 0, losses: 0, rate: 0 },
      
      // Favorites vs underdogs
      favorite_stats: { picks: 0, wins: 0, losses: 0, rate: 0 },
      underdog_stats: { picks: 0, wins: 0, losses: 0, rate: 0 },
      
      // Home vs away
      home_stats: { picks: 0, wins: 0, losses: 0, rate: 0 },
      away_stats: { picks: 0, wins: 0, losses: 0, rate: 0 },
      
      // Team records
      team_stats: {} as Record<string, { picks: number; wins: number; losses: number; rate: number }>,
    };

    // Calculate win rate
    const resolved = stats.total_wins + stats.total_losses;
    stats.win_rate = resolved > 0 ? Math.round((stats.total_wins / resolved) * 100 * 100) / 100 : 0;

    // Process each pick
    picks.forEach(pick => {
      const isWin = pick.correct === true;
      
      // By confidence
      const conf = (pick.confidence || 'Medium').toLowerCase();
      if (conf === 'high') {
        stats.high_conf.picks++;
        if (isWin) stats.high_conf.wins++; else stats.high_conf.losses++;
      } else if (conf === 'low') {
        stats.low_conf.picks++;
        if (isWin) stats.low_conf.wins++; else stats.low_conf.losses++;
      } else {
        stats.medium_conf.picks++;
        if (isWin) stats.medium_conf.wins++; else stats.medium_conf.losses++;
      }
      
      // By game context
      if (pick.game_is_primetime) {
        stats.primetime_stats.picks++;
        if (isWin) stats.primetime_stats.wins++; else stats.primetime_stats.losses++;
      }
      if (pick.game_is_divisional) {
        stats.divisional_stats.picks++;
        if (isWin) stats.divisional_stats.wins++; else stats.divisional_stats.losses++;
      }
      
      // Favorite vs underdog
      if (pick.picked_favorite === true) {
        stats.favorite_stats.picks++;
        if (isWin) stats.favorite_stats.wins++; else stats.favorite_stats.losses++;
      } else if (pick.picked_favorite === false) {
        stats.underdog_stats.picks++;
        if (isWin) stats.underdog_stats.wins++; else stats.underdog_stats.losses++;
      }
      
      // Home vs away
      if (pick.team_picked === 'home') {
        stats.home_stats.picks++;
        if (isWin) stats.home_stats.wins++; else stats.home_stats.losses++;
      } else if (pick.team_picked === 'away') {
        stats.away_stats.picks++;
        if (isWin) stats.away_stats.wins++; else stats.away_stats.losses++;
      }
      
      // Team specific
      if (pick.picked_team) {
        if (!stats.team_stats[pick.picked_team]) {
          stats.team_stats[pick.picked_team] = { picks: 0, wins: 0, losses: 0, rate: 0 };
        }
        stats.team_stats[pick.picked_team].picks++;
        if (isWin) {
          stats.team_stats[pick.picked_team].wins++;
        } else {
          stats.team_stats[pick.picked_team].losses++;
        }
      }
    });

    // Calculate rates
    const calcRate = (obj: { picks: number; wins: number; losses: number; rate: number }) => {
      const total = obj.wins + obj.losses;
      obj.rate = total > 0 ? Math.round((obj.wins / total) * 100 * 100) / 100 : 0;
    };

    calcRate(stats.high_conf);
    calcRate(stats.medium_conf);
    calcRate(stats.low_conf);
    calcRate(stats.primetime_stats);
    calcRate(stats.divisional_stats);
    calcRate(stats.favorite_stats);
    calcRate(stats.underdog_stats);
    calcRate(stats.home_stats);
    calcRate(stats.away_stats);
    
    Object.values(stats.team_stats).forEach(calcRate);

    // Find best/worst teams
    const teamEntries = Object.entries(stats.team_stats)
      .filter(([_, s]) => s.picks >= 3) // Minimum 3 picks
      .sort((a, b) => b[1].rate - a[1].rate);
    
    const best_teams = teamEntries.slice(0, 3).map(([team]) => team);
    const worst_teams = teamEntries.slice(-3).reverse().map(([team]) => team);

    // Upsert analytics
    await supabase
      .from('user_analytics')
      .upsert({
        user_id: userId,
        ...stats,
        best_teams,
        worst_teams,
        last_updated: new Date().toISOString()
      }, { onConflict: 'user_id' });

  } catch (error) {
    console.error('Error refreshing analytics:', error);
  }
};


// ============================================
// AI CONTEXT BUILDER
// Build complete context for AI recommendations
// ============================================

export interface AIContext {
  user: {
    preferences: UserPreferences | null;
    analytics: any;
    recentPicks: any[];
    unpickedViews: GameView[];
  };
  game: {
    details: any;
    homeTeamSituation: TeamSituation | null;
    awayTeamSituation: TeamSituation | null;
  };
  userHistoryForSimilarGames: any[];
}

/**
 * Build complete AI context for a specific game
 */
export const buildAIContext = async (
  userId: string,
  gameId: string,
  week: number
): Promise<AIContext> => {
  // Fetch all data in parallel
  const [
    preferencesResult,
    analyticsResult,
    recentPicksResult,
    unpickedViewsResult,
    gameResult
  ] = await Promise.all([
    getUserPreferences(userId),
    getUserAnalytics(userId),
    supabase.from('picks').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20),
    getUnpickedViews(userId, week),
    supabase.from('games').select('*').eq('id', gameId).single()
  ]);

  const game = gameResult.data;
  
  // Get team situations if game exists
  let homeTeamSituation = null;
  let awayTeamSituation = null;
  
  if (game) {
    [homeTeamSituation, awayTeamSituation] = await Promise.all([
      getTeamSituation(game.home_team, week),
      getTeamSituation(game.away_team, week)
    ]);
  }

  // Find similar historical picks
  let userHistoryForSimilarGames: any[] = [];
  if (game && analyticsResult) {
    // Find picks with similar characteristics
    const { data: similarPicks } = await supabase
      .from('picks')
      .select('*')
      .eq('user_id', userId)
      .not('correct', 'is', null)
      .eq('game_is_primetime', game.is_primetime || false)
      .limit(10);
    
    userHistoryForSimilarGames = similarPicks || [];
  }

  return {
    user: {
      preferences: preferencesResult,
      analytics: analyticsResult,
      recentPicks: recentPicksResult.data || [],
      unpickedViews: unpickedViewsResult
    },
    game: {
      details: game,
      homeTeamSituation,
      awayTeamSituation
    },
    userHistoryForSimilarGames
  };
};

/**
 * Format AI context as a prompt-ready string
 */
export const formatAIPrompt = (context: AIContext): string => {
  const { user, game } = context;
  
  let prompt = `## User Profile\n`;
  
  if (user.analytics) {
    prompt += `- Overall Record: ${user.analytics.total_wins}-${user.analytics.total_losses} (${user.analytics.win_rate}%)\n`;
    prompt += `- Favorite Record: ${user.analytics.favorite_stats?.wins || 0}-${user.analytics.favorite_stats?.losses || 0}\n`;
    prompt += `- Underdog Record: ${user.analytics.underdog_stats?.wins || 0}-${user.analytics.underdog_stats?.losses || 0}\n`;
    prompt += `- Primetime Record: ${user.analytics.primetime_stats?.wins || 0}-${user.analytics.primetime_stats?.losses || 0}\n`;
    if (user.analytics.best_teams?.length) {
      prompt += `- Best Teams: ${user.analytics.best_teams.join(', ')}\n`;
    }
    if (user.analytics.worst_teams?.length) {
      prompt += `- Worst Teams: ${user.analytics.worst_teams.join(', ')}\n`;
    }
  }
  
  if (user.preferences) {
    prompt += `- Risk Tolerance: ${user.preferences.risk_tolerance}\n`;
    prompt += `- Fade Public: ${user.preferences.fade_public ? 'Yes' : 'No'}\n`;
    if (user.preferences.favorite_teams?.length) {
      prompt += `- Favorite Teams: ${user.preferences.favorite_teams.join(', ')}\n`;
    }
  }
  
  prompt += `\n## Game Details\n`;
  if (game.details) {
    prompt += `- Matchup: ${game.details.away_team} @ ${game.details.home_team}\n`;
    prompt += `- Spread: ${game.details.home_team} ${game.details.home_spread}\n`;
    prompt += `- Total: ${game.details.over_under_line}\n`;
    prompt += `- Primetime: ${game.details.is_primetime ? 'Yes' : 'No'}\n`;
    prompt += `- Divisional: ${game.details.is_divisional ? 'Yes' : 'No'}\n`;
  }
  
  if (game.homeTeamSituation) {
    prompt += `\n## ${game.details?.home_team} Situation\n`;
    prompt += `- Days Rest: ${game.homeTeamSituation.days_rest}\n`;
    prompt += `- Record: ${game.homeTeamSituation.wins}-${game.homeTeamSituation.losses}\n`;
    prompt += `- Streak: ${game.homeTeamSituation.streak > 0 ? 'W' : 'L'}${Math.abs(game.homeTeamSituation.streak)}\n`;
    prompt += `- Injury Score: ${game.homeTeamSituation.injury_impact_score}/10\n`;
    prompt += `- QB Status: ${game.homeTeamSituation.qb_status}\n`;
  }
  
  if (game.awayTeamSituation) {
    prompt += `\n## ${game.details?.away_team} Situation\n`;
    prompt += `- Days Rest: ${game.awayTeamSituation.days_rest}\n`;
    prompt += `- Travel: ${game.awayTeamSituation.travel_miles} miles\n`;
    prompt += `- Record: ${game.awayTeamSituation.wins}-${game.awayTeamSituation.losses}\n`;
    prompt += `- Streak: ${game.awayTeamSituation.streak > 0 ? 'W' : 'L'}${Math.abs(game.awayTeamSituation.streak)}\n`;
    prompt += `- Injury Score: ${game.awayTeamSituation.injury_impact_score}/10\n`;
    prompt += `- QB Status: ${game.awayTeamSituation.qb_status}\n`;
  }
  
  return prompt;
};


// ============================================
// ENHANCED SAVE PICK (with full context)
// ============================================

/**
 * Calculate time until game in minutes
 */
export const calculateTimeBeforeGame = (gameDate: string): number => {
  const game = new Date(gameDate);
  const now = new Date();
  const diffMs = game.getTime() - now.getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60)));
};

/**
 * Determine pick timing category
 */
export const getPickTimingCategory = (minutesBeforeGame: number): string => {
  const hoursBeforeGame = minutesBeforeGame / 60;
  if (hoursBeforeGame < 4) return 'game_day';
  if (hoursBeforeGame < 48) return 'mid_week';
  return 'early_week';
};

/**
 * Get day of week from date
 */
export const getDayOfWeek = (date: Date): string => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};