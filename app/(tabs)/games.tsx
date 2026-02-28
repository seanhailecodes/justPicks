import { getWeekSchedule, hasScheduleForWeek } from '@/app/data/nfl-2025-schedule';
import { getWeekScores, hasScoresForWeek } from '@/app/data/resolution/allScores';
import { resolveWeekFromScores } from '@/app/data/resolution/gameResolution';
import PicksTicket, { TicketPick } from '@/components/PicksTicket';
import { Session } from '@supabase/supabase-js';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserPicks, savePick, supabase, getCurrentWeek, updateCurrentWeek, populateWeekGames } from '../lib/supabase';
import { getUserGroups } from '../lib/database';
import { 
  trackGameView, 
  trackAddedToTicket, 
  trackRemovedFromTicket,
} from '../lib/ai-data-helpers';
import { useNotificationContext } from '../../components/NotificationContext';

// Type definitions
interface GameSpread {
  away: string;
  home: string;
}

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeTeamCode?: string;
  awayTeamCode?: string;
  homeTeamLogo?: string;
  awayTeamLogo?: string;
  league: string;
  gameDate: string;
  gameTime: string;
  gameDateTimeLocal: Date;
  spread: GameSpread;
  homeSpreadValue: number;
  awaySpreadValue: number;
  overUnder?: number;
  homeMoneyline?: number;
  awayMoneyline?: number;
  selectedPick?: 'home' | 'away' | null;
  selectedOverUnderPick?: 'over' | 'under' | null;
  overUnderConfidence?: string | null;
  pickType?: 'solo' | 'group' | null;
  confidence?: 'Low' | 'Medium' | 'High' | null;
  groups?: string[];
  reasoning?: string;
  originalId?: string;
}

interface PickData {
  pick: 'home' | 'away';
  confidence: 'Low' | 'Medium' | 'High';
  reasoning?: string;
  groups: string[];
  type: 'solo' | 'group';
}

// Sport configuration with displayMode
interface SportConfig {
  key: string;
  label: string;
  emoji: string;
  league: string;
  enabled: boolean;
  displayMode: 'code' | 'name' | 'fighter';
  // Season as [startMonth, startDay, endMonth, endDay] (1-indexed months)
  season?: [number, number, number, number];
}

const SPORTS: SportConfig[] = [
  { key: 'nfl',   label: 'NFL',    emoji: '🏈', league: 'NFL',    enabled: true,  displayMode: 'code', season: [9, 1, 2, 15] },
  { key: 'nba',   label: 'NBA',    emoji: '🏀', league: 'NBA',    enabled: true,  displayMode: 'code', season: [10, 1, 6, 30] },
  { key: 'ncaab', label: 'NCAAB',  emoji: '🏀', league: 'NCAAB', enabled: true,  displayMode: 'name', season: [11, 1, 4, 10] },
  { key: 'soccer',label: 'Soccer', emoji: '⚽', league: 'SOCCER', enabled: true,  displayMode: 'name', season: [8, 1, 5, 31] },
  { key: 'ncaaf', label: 'NCAAF',  emoji: '🏈', league: 'NCAAF', enabled: false, displayMode: 'name', season: [8, 24, 1, 20] },
  { key: 'nhl',   label: 'NHL',    emoji: '🏒', league: 'NHL',   enabled: false, displayMode: 'code', season: [10, 1, 6, 30] },
  { key: 'mlb',   label: 'MLB',    emoji: '⚾', league: 'MLB',   enabled: false, displayMode: 'code', season: [3, 20, 10, 31] },
];

// Returns true if the given sport is currently in season.
// Tries both "season started this year" and "season started last year"
// so mid-season sports (e.g. NBA Oct–Jun) are detected correctly in any month.
const isSportInSeason = (sport: SportConfig): boolean => {
  if (!sport.season) return false;
  const [startMonth, startDay, endMonth, endDay] = sport.season;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const startYear of [now.getFullYear(), now.getFullYear() - 1]) {
    const start = new Date(startYear, startMonth - 1, startDay);
    // If end month is before start month the season crosses New Year
    const endYear = endMonth < startMonth ? startYear + 1 : startYear;
    const end = new Date(endYear, endMonth - 1, endDay);
    if (today >= start && today <= end) return true;
  }
  return false;
};

// Helper to ensure date string is treated as UTC
const toUTCDateString = (dateStr: string): string => {
  if (!dateStr) return '';
  return dateStr.endsWith('Z') ? dateStr : dateStr.replace(' ', 'T') + 'Z';
};

// Group games by date label
const groupGamesByDate = (games: Game[]): Map<string, Game[]> => {
  const groups = new Map<string, Game[]>();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  games.forEach(game => {
    const gameDate = new Date(game.gameDateTimeLocal);
    gameDate.setHours(0, 0, 0, 0);
    
    let label: string;
    if (gameDate.getTime() === today.getTime()) {
      label = 'Today';
    } else if (gameDate.getTime() === tomorrow.getTime()) {
      label = 'Tomorrow';
    } else {
      label = gameDate.toLocaleDateString(undefined, { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }

    if (!groups.has(label)) {
      groups.set(label, []);
    }
    groups.get(label)!.push(game);
  });

  return groups;
};

// Team display component - shows logo if available
// displayMode: 'code' for pro sports (NFL, NBA), 'name' for college/soccer, 'fighter' for combat sports
const TeamDisplay = ({ logo, code, name, displayMode }: { 
  logo?: string; 
  code?: string; 
  name: string;
  displayMode: 'code' | 'name' | 'fighter';
}) => (
  <View style={styles.teamInfo}>
    {logo ? (
      <Image 
        source={{ uri: logo }} 
        style={styles.teamLogo}
        resizeMode="contain"
      />
    ) : null}
    <Text style={styles.teamName} numberOfLines={1}>
      {displayMode === 'code' ? (code || name) : name}
    </Text>
  </View>
);

export default function GamesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { showPickConfirmation } = useNotificationContext();
  
  // Initialize sport from URL param if present, otherwise pick first active sport
  const getInitialSport = (): SportConfig => {
    if (params.sport) {
      const sportKey = (params.sport as string).toLowerCase();
      const sportConfig = SPORTS.find(s => s.key === sportKey);
      if (sportConfig && sportConfig.enabled) {
        return sportConfig;
      }
    }
    // Pick first enabled sport that is currently in season
    const activeSport = SPORTS.find(s => s.enabled && isSportInSeason(s));
    // Fall back to first enabled sport if nothing is in season
    return activeSport ?? SPORTS.find(s => s.enabled) ?? SPORTS[0];
  };
  
  const [selectedSport, setSelectedSport] = useState<SportConfig>(getInitialSport);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPicks, setUserPicks] = useState<Map<string, any>>(new Map());
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingPicks, setPendingPicks] = useState<TicketPick[]>([]);
  const [userGroups, setUserGroups] = useState<{id: string; name: string; sport: string}[]>([]);
  const [hasLoadedInitialSport, setHasLoadedInitialSport] = useState(false);

  // Get grouped games
  const groupedGames = groupGamesByDate(games);

  // Handle incoming sport parameter changes (for when navigating while already on the screen)
  useEffect(() => {
    if (params.sport) {
      const sportKey = (params.sport as string).toLowerCase();
      const sportConfig = SPORTS.find(s => s.key === sportKey);
      if (sportConfig && sportConfig.enabled && sportConfig.key !== selectedSport.key) {
        setSelectedSport(sportConfig);
      }
    }
  }, [params.sport]);

  const autoResolveWeek = async () => {
    if (!currentWeekNumber) return;
    
    if (!hasScoresForWeek(currentWeekNumber)) {
      alert(`❌ No scores file found for Week ${currentWeekNumber}.`);
      return;
    }
    
    const scores = getWeekScores(currentWeekNumber);
    
    if (!scores || scores.length === 0) {
      alert(`❌ Week ${currentWeekNumber} scores are empty.`);
      return;
    }
    
    try {
      const result = await resolveWeekFromScores(scores);
      
      if (result.success) {
        alert(`✅ Successfully resolved ${result.gamesResolved} games for Week ${currentWeekNumber}!`);
        loadGamesFromDatabase();
      } else {
        alert(`❌ Error resolving games. Check console for details.`);
      }
    } catch (error) {
      console.error('Resolution error:', error);
      alert(`❌ Error: ${error.message}`);
    }
  };

  const advanceToNextWeek = async () => {
    const currentWeek = await getCurrentWeek();
    const nextWeek = currentWeek + 1;
    
    if (!hasScheduleForWeek(nextWeek)) {
      Alert.alert('⚠️ Cannot Advance', `Schedule file for Week ${nextWeek} doesn't exist yet.`);
      return;
    }
    
    Alert.alert(
      '🔄 Advance Week?',
      `Advance from Week ${currentWeek} to Week ${nextWeek}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Advance',
          onPress: async () => {
            const result = await updateCurrentWeek(nextWeek);
            if (result.success) {
              Alert.alert('✅ Success', `Advanced to Week ${nextWeek}!`);
              setCurrentWeekNumber(nextWeek);
              loadGamesFromDatabase();
            } else {
              Alert.alert('❌ Error', result.error || 'Failed to update week');
            }
          }
        }
      ]
    );
  };

  const autoPopulateWeek = async () => {
    if (!currentWeekNumber) return;
    
    if (!hasScheduleForWeek(currentWeekNumber)) {
      alert(`❌ No schedule file found for Week ${currentWeekNumber}.`);
      return;
    }
    
    const schedule = getWeekSchedule(currentWeekNumber);
    
    if (schedule.length === 0) {
      alert(`❌ Week ${currentWeekNumber} schedule is empty.`);
      return;
    }

    const result = await populateWeekGames(currentWeekNumber, schedule);
    
    if (result.success) {
      alert(`✅ Successfully populated ${result.count} games for Week ${currentWeekNumber}!`);
      loadGamesFromDatabase();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const loadUserPicks = async (userId: string) => {
    try {
      // Load all picks for this user (we'll filter by game later)
      const result = await getUserPicks(userId, null);
      
      const picksMap = new Map();
      
      if (result.success && result.data) {
        result.data.forEach(pick => {
          picksMap.set(pick.game_id, {
            pick: pick.team_picked,
            pickType: pick.pick_type,
            confidence: pick.confidence,
            groups: [],
            reasoning: pick.reasoning,
            overUnderPick: pick.over_under_pick,
            overUnderConfidence: pick.over_under_confidence,
          });
        });
      }
      
      setUserPicks(picksMap);
      await loadGamesFromDatabase(picksMap);
      
    } catch (error) {
      console.error('Error loading picks:', error);
      await loadGamesFromDatabase(new Map());
    }
  };

  const refreshUserPicks = async () => {
    if (session?.user) {
      await loadUserPicks(session.user.id);
    }
  };

  const loadGamesFromDatabase = async (picksToUse?: Map<string, any>) => {
    try {
      const now = new Date();
      
      let query = supabase
        .from('games')
        .select('*')
        .eq('league', selectedSport.league)
        .eq('locked', false)
        .gte('game_date', now.toISOString())
        .order('game_date', { ascending: true })
        .limit(50); // Get next 50 upcoming games

      const { data: dbGames, error } = await query;

      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      if (!dbGames || dbGames.length === 0) {
        setGames([]);
        return;
      }

      const picks = picksToUse || userPicks;

      const transformedGames: Game[] = (dbGames || []).map((dbGame, index) => {
        // Parse date as UTC
        const utcDateStr = toUTCDateString(dbGame.game_date);
        const gameDateTime = new Date(utcDateStr);
        
        return {
          id: index + 1,
          homeTeam: dbGame.home_team,
          awayTeam: dbGame.away_team,
          homeTeamCode: dbGame.home_team_code,
          awayTeamCode: dbGame.away_team_code,
          homeTeamLogo: dbGame.home_team_logo,
          awayTeamLogo: dbGame.away_team_logo,
          league: dbGame.league || 'NFL',
          gameDateTimeLocal: gameDateTime,
          gameDate: `${gameDateTime.getFullYear()}-${String(gameDateTime.getMonth() + 1).padStart(2, '0')}-${String(gameDateTime.getDate()).padStart(2, '0')}`,
          gameTime: (() => {
            try {
              if (isNaN(gameDateTime.getTime())) return "TBD";
              return gameDateTime.toLocaleTimeString(undefined, {
                hour: 'numeric',
                minute: '2-digit',
              });
            } catch (error) {
              return "TBD";
            }
          })(),
          spread: {
            home: `${dbGame.home_team_code || dbGame.home_team} ${parseFloat(dbGame.home_spread) > 0 ? '+' : ''}${dbGame.home_spread}`,
            away: `${dbGame.away_team_code || dbGame.away_team} ${parseFloat(dbGame.away_spread) > 0 ? '+' : ''}${dbGame.away_spread}`,
          },
          homeSpreadValue: parseFloat(dbGame.home_spread) || 0,
          awaySpreadValue: parseFloat(dbGame.away_spread) || 0,
          overUnder: dbGame.over_under_line ?? undefined,
          homeMoneyline: dbGame.home_moneyline ?? -110,
          awayMoneyline: dbGame.away_moneyline ?? -110,
          selectedPick: picks.get(dbGame.id)?.pick || null,
          selectedOverUnderPick: picks.get(dbGame.id)?.overUnderPick || null,
          pickType: picks.get(dbGame.id)?.pickType || null,
          confidence: picks.get(dbGame.id)?.confidence || null,
          overUnderConfidence: picks.get(dbGame.id)?.overUnderConfidence || null,
          groups: picks.get(dbGame.id)?.groups || [],
          reasoning: picks.get(dbGame.id)?.reasoning || '',
          originalId: dbGame.id,
        };
      });

      setGames(transformedGames);
    } catch (error) {
      console.error('Error in loadGamesFromDatabase:', error);
    }
  };

  useEffect(() => {
    const loadCurrentWeek = async () => {
      const weekNum = await getCurrentWeek();
      setCurrentWeekNumber(weekNum);
      setIsInitializing(false);
    };
    loadCurrentWeek();
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setSession(session);
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) loadUserPicks(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => loadUserPicks(session.user.id), 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Reload games when sport changes
  useEffect(() => {
    if (!isInitializing && hasLoadedInitialSport) {
      if (session?.user) {
        loadUserPicks(session.user.id);
      } else {
        loadGamesFromDatabase();
      }
    }
  }, [selectedSport]);

  // Initial load when session is ready
  useEffect(() => {
    if (!isInitializing && !hasLoadedInitialSport) {
      setHasLoadedInitialSport(true);
      if (session?.user) {
        loadUserPicks(session.user.id);
      } else {
        loadGamesFromDatabase();
      }
    }
  }, [isInitializing, session]);

  const getTimeToLock = (gameDate: string, gameTime: string): string => {
    try {
      // Parse the time from gameTime string
      const timeMatch = gameTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
      if (!timeMatch) return 'Soon';
      
      let hour24 = parseInt(timeMatch[1]);
      const min = parseInt(timeMatch[2]);
      const period = timeMatch[3];
      
      // Convert to 24-hour if AM/PM present
      if (period) {
        if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
        else if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
      }
      
      const [year, month, day] = gameDate.split('-').map(Number);
      const gameDateObj = new Date(year, month - 1, day, hour24, min, 0, 0);
      const diffMs = gameDateObj.getTime() - currentTime.getTime();
      
      if (diffMs <= 0) return 'LOCKED';
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) return `${diffDays}d ${diffHours % 24}h`;
      if (diffHours > 0) return `${diffHours}h ${diffMinutes % 60}m`;
      if (diffMinutes > 0) return `${diffMinutes}m`;
      
      return 'LOCKED';
    } catch (error) {
      return 'Soon';
    }
  };

  const handleCellPress = (game: Game, betType: 'spread' | 'total', side: 'home' | 'away' | 'over' | 'under') => {
    const timeToLock = getTimeToLock(game.gameDate, game.gameTime);
    if (timeToLock === 'LOCKED') {
      alert('This game has already started. Picks are locked.');
      return;
    }

    // Track game view (first interaction with this game)
    if (session?.user?.id && game.originalId) {
      trackGameView(session.user.id, game.originalId, currentWeekNumber || 0);
    }

    setPendingPicks(prev => {
      // Find existing pick with same gameId AND betType
      const existingIndex = prev.findIndex(
        p => p.gameId === game.originalId && p.betType === betType
      );

      if (existingIndex >= 0) {
        // If same side, remove it (toggle off)
        if (prev[existingIndex].side === side) {
          // Track removal from ticket
          if (session?.user?.id && game.originalId) {
            trackRemovedFromTicket(session.user.id, game.originalId);
          }
          return prev.filter((_, i) => i !== existingIndex);
        } else {
          // If different side (e.g. switching home to away), update it
          return prev.map((p, i) => 
            i === existingIndex 
              ? { ...p, side, line: getLineForPick(game, betType, side) }
              : p
          );
        }
      } else {
        // Add new pick - track added to ticket
        if (session?.user?.id && game.originalId) {
          trackAddedToTicket(session.user.id, game.originalId);
        }
        
        const newPick: TicketPick = {
          gameId: game.originalId!,
          gameLabel: `${game.awayTeamCode || game.awayTeam} @ ${game.homeTeamCode || game.homeTeam}`,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          betType,
          side,
          line: getLineForPick(game, betType, side),
          odds: '-110',
          confidence: 'Medium',
        };
        return [...prev, newPick];
      }
  });
};

  const getLineForPick = (game: Game, betType: 'spread' | 'total', side: string): string => {
    if (betType === 'spread') {
      if (side === 'home') return formatSpread(game.homeSpreadValue);
      return formatSpread(game.awaySpreadValue);
    }
    if (betType === 'total') {
      if (side === 'over') return `O ${game.overUnder}`;
      return `U ${game.overUnder}`;
    }
    return '';
  };

  const handleUpdatePick = (gameId: string, betType: string, updates: Partial<TicketPick>) => {
    setPendingPicks(prev => prev.map(p => 
      p.gameId === gameId && p.betType === betType 
        ? { ...p, ...updates }
        : p
    ));
  };

  const handleRemovePick = (gameId: string, betType: string) => {
    setPendingPicks(prev => prev.filter(p => !(p.gameId === gameId && p.betType === betType)));
  };

  const handleClearPicks = () => {
    setPendingPicks([]);
  };

  const handleSavePicks = async (picks: TicketPick[], groupIds: string[], pickType: 'solo' | 'group') => {
    if (!session?.user?.id) {
      alert('Please log in to make picks');
      return;
    }

    // Validate that groups are selected if sharing to groups
    if (pickType === 'group' && groupIds.length === 0) {
      Alert.alert('No Groups Selected', 'Please select at least one group or choose Solo.');
      return;
    }

    // Debug log to track what's being saved
    console.log('=== SAVING PICKS ===');
    console.log('pickType:', pickType);
    console.log('groupIds:', groupIds);
    console.log('userGroups available:', userGroups);

    const now = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const pickedDayOfWeek = days[now.getDay()];

    const pickPromises = picks.map(async (pick) => {
      const game = games.find(g => g.originalId === pick.gameId);
      if (!game) return null;

      const isSpread = pick.betType === 'spread';
      const isTotal = pick.betType === 'total';
      
      // Calculate timing context safely
      let timeBeforeGame = 0;
      let pickedAtTime = 'early_week';
      try {
        const timeMatch = game.gameTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)?/i);
        if (timeMatch) {
          let hour = parseInt(timeMatch[1]);
          const min = parseInt(timeMatch[2]);
          const period = timeMatch[3];
          if (period) {
            if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12;
            if (period.toUpperCase() === 'AM' && hour === 12) hour = 0;
          }
          const gameDateTime = new Date(`${game.gameDate}T${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}:00`);
          timeBeforeGame = Math.max(0, Math.floor((gameDateTime.getTime() - now.getTime()) / (1000 * 60)));
          
          const hoursBeforeGame = timeBeforeGame / 60;
          if (hoursBeforeGame < 4) pickedAtTime = 'game_day';
          else if (hoursBeforeGame < 48) pickedAtTime = 'mid_week';
        }
      } catch (e) {
        // Keep defaults if parsing fails
      }
      
      // Determine spread size category
      const spreadSize = Math.abs(game.homeSpreadValue || 0);
      let spreadCategory = 'medium';
      if (spreadSize <= 1) spreadCategory = 'pk';
      else if (spreadSize <= 3) spreadCategory = 'small';
      else if (spreadSize > 7) spreadCategory = 'large';
      
      // Determine if picking favorite
      const pickedFavorite = pick.side === 'home' 
        ? (game.homeSpreadValue || 0) < 0 
        : (game.awaySpreadValue || 0) < 0;

      const pickData = {
        game_id: pick.gameId,
        pick: pick.side,
        team_picked: isSpread ? pick.side : null,
        confidence: isSpread ? pick.confidence : 'Medium',
        reasoning: pick.notes || '',
        pick_type: pickType,
        groups: groupIds,
        spread_value: pick.betType === 'spread' 
          ? (pick.side === 'home' ? game.homeSpreadValue : game.awaySpreadValue)
          : 0,
        week: currentWeekNumber || 0,
        overUnderPick: isTotal ? pick.side : null,
        overUnderConfidence: isTotal ? pick.confidence : null,
        
        // AI Context fields
        spread_line_at_pick: game.homeSpreadValue,
        total_line_at_pick: game.overUnder,
        time_before_game_minutes: timeBeforeGame,
        picked_at_time: pickedAtTime,
        picked_day_of_week: pickedDayOfWeek,
        spread_size: spreadSize,
        spread_category: spreadCategory,
        picked_favorite: isSpread ? pickedFavorite : null,
        picked_team: isSpread 
          ? (pick.side === 'home' ? game.homeTeam : game.awayTeam) 
          : null,
        opponent_team: isSpread 
          ? (pick.side === 'home' ? game.awayTeam : game.homeTeam) 
          : null,
      };

      console.log('Saving pick with data:', JSON.stringify(pickData, null, 2));

      return savePick(session.user.id, pickData);
    });

    try {
      await Promise.all(pickPromises);
      setPendingPicks([]);
      
      // Show notification modal
      showPickConfirmation(picks.length);
      
      refreshUserPicks();
    } catch (error) {
      console.error('Error saving picks:', error);
      Alert.alert('❌ Error', 'Failed to save picks. Please try again.');
    }
  };

  // Load user groups when session is available
  useEffect(() => {
    const loadGroups = async () => {
      if (session?.user?.id) {
        const groups = await getUserGroups(session.user.id);
        console.log('Loaded user groups:', groups);
        setUserGroups(groups.map(g => ({ id: g.id, name: g.name, sport: g.sport })));
      }
    };
    loadGroups();
  }, [session]);

  const formatSpread = (value: number): string => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  const formatMoneyline = (value: number): string => {
    if (value > 0) return `+${value}`;
    return value.toString();
  };

  if (isInitializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FFF', fontSize: 18 }}>Loading games...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Games</Text>
      </View>

      {/* Sport Tabs - matching Home screen style */}
      <ScrollView 
        horizontal 
        style={styles.sportTabsContainer} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sportTabsContent}
      >
        {SPORTS.map(sport => {
          const isSelected = selectedSport.key === sport.key;
          return (
            <TouchableOpacity
              key={sport.key}
              style={[
                styles.sportTab,
                isSelected && styles.sportTabActive,
                !sport.enabled && styles.sportTabDisabled
              ]}
              onPress={() => sport.enabled && setSelectedSport(sport)}
              disabled={!sport.enabled}
            >
              <Text style={styles.sportEmoji}>{sport.emoji}</Text>
              <Text style={[
                styles.sportTabText,
                isSelected && styles.sportTabTextActive,
                !sport.enabled && styles.sportTabTextDisabled
              ]}>
                {sport.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {games.length > 0 ? (
          Array.from(groupedGames.entries()).map(([dateLabel, dateGames]) => (
            <View key={dateLabel}>
              {/* Date Header */}
              <View style={styles.dateHeader}>
                <View style={styles.dateHeaderLine} />
                <Text style={styles.dateHeaderText}>{dateLabel}</Text>
                <View style={styles.dateHeaderLine} />
              </View>

              {/* Games for this date */}
              {dateGames.map(game => {
                const timeToLock = getTimeToLock(game.gameDate, game.gameTime);
                const isLocked = timeToLock === 'LOCKED';
                
                // Helper to check if a cell is selected (saved or pending)
                const isCellSelected = (betType: string, side: string) => {
                  // Check pending picks first
                  const pending = pendingPicks.find(
                    p => p.gameId === game.originalId && p.betType === betType && p.side === side
                  );
                  if (pending) return 'pending';
                  
                  // Check saved picks
                  if (betType === 'spread' && game.selectedPick === side) return 'saved';
                  if (betType === 'total') {
                    if (side === 'over' && game.selectedOverUnderPick === 'over') return 'saved';
                    if (side === 'under' && game.selectedOverUnderPick === 'under') return 'saved';
                  }
                  return false;
                };
                
                return (
                  <View key={game.id} style={[styles.gameCard, isLocked && styles.gameCardLocked]}>
                    {/* Column Headers */}
                    <View style={styles.gridHeader}>
                      <View style={styles.teamColumnHeader} />
                      <Text style={styles.columnHeader}>SPREAD</Text>
                      <Text style={styles.columnHeader}>TOTAL</Text>
                      <Text style={styles.columnHeader}>ML</Text>
                    </View>

                    {/* Away Team Row */}
                    <View style={styles.gridRow}>
                      <View style={styles.teamColumn}>
                        <TeamDisplay 
                          logo={game.awayTeamLogo} 
                          code={game.awayTeamCode} 
                          name={game.awayTeam}
                          displayMode={selectedSport.displayMode}
                        />
                      </View>
                      
                      {/* Away Spread */}
                      <TouchableOpacity
                        style={[
                          styles.betCell,
                          isCellSelected('spread', 'away') === 'pending' && styles.betCellPending,
                          isCellSelected('spread', 'away') === 'saved' && styles.betCellSaved,
                          isLocked && styles.betCellLocked
                        ]}
                        onPress={() => !isLocked && handleCellPress(game, 'spread', 'away')}
                        disabled={isLocked}
                      >
                        <Text style={[styles.betLine, isCellSelected('spread', 'away') && styles.betLineSelected]}>
                          {formatSpread(game.awaySpreadValue)}
                        </Text>
                        <Text style={[styles.betOdds, isCellSelected('spread', 'away') && styles.betOddsSelected]}>
                          -110
                        </Text>
                      </TouchableOpacity>

                      {/* Over */}
                      <TouchableOpacity
                        style={[
                          styles.betCell,
                          isCellSelected('total', 'over') === 'pending' && styles.betCellPending,
                          isCellSelected('total', 'over') === 'saved' && styles.betCellSaved,
                          isLocked && styles.betCellLocked
                        ]}
                        onPress={() => !isLocked && handleCellPress(game, 'total', 'over')}
                        disabled={isLocked}
                      >
                        <Text style={[styles.betLine, isCellSelected('total', 'over') && styles.betLineSelected]}>
                          O {game.overUnder}
                        </Text>
                        <Text style={[styles.betOdds, isCellSelected('total', 'over') && styles.betOddsSelected]}>
                          -110
                        </Text>
                      </TouchableOpacity>

                      {/* Away Moneyline - Display Only */}
                      <View style={[styles.betCell, styles.betCellDisabled]}>
                        <Text style={styles.betLineDisabled}>
                          {formatMoneyline(game.awayMoneyline || -110)}
                        </Text>
                      </View>
                    </View>

                    {/* Home Team Row */}
                    <View style={styles.gridRow}>
                      <View style={styles.teamColumn}>
                        <TeamDisplay 
                          logo={game.homeTeamLogo} 
                          code={game.homeTeamCode} 
                          name={game.homeTeam}
                          displayMode={selectedSport.displayMode}
                        />
                      </View>
                      
                      {/* Home Spread */}
                      <TouchableOpacity
                        style={[
                          styles.betCell,
                          isCellSelected('spread', 'home') === 'pending' && styles.betCellPending,
                          isCellSelected('spread', 'home') === 'saved' && styles.betCellSaved,
                          isLocked && styles.betCellLocked
                        ]}
                        onPress={() => !isLocked && handleCellPress(game, 'spread', 'home')}
                        disabled={isLocked}
                      >
                        <Text style={[styles.betLine, isCellSelected('spread', 'home') && styles.betLineSelected]}>
                          {formatSpread(game.homeSpreadValue)}
                        </Text>
                        <Text style={[styles.betOdds, isCellSelected('spread', 'home') && styles.betOddsSelected]}>
                          -110
                        </Text>
                      </TouchableOpacity>

                      {/* Under */}
                      <TouchableOpacity
                        style={[
                          styles.betCell,
                          isCellSelected('total', 'under') === 'pending' && styles.betCellPending,
                          isCellSelected('total', 'under') === 'saved' && styles.betCellSaved,
                          isLocked && styles.betCellLocked
                        ]}
                        onPress={() => !isLocked && handleCellPress(game, 'total', 'under')}
                        disabled={isLocked}
                      >
                        <Text style={[styles.betLine, isCellSelected('total', 'under') && styles.betLineSelected]}>
                          U {game.overUnder}
                        </Text>
                        <Text style={[styles.betOdds, isCellSelected('total', 'under') && styles.betOddsSelected]}>
                          -110
                        </Text>
                      </TouchableOpacity>

                      {/* Home Moneyline - Display Only */}
                      <View style={[styles.betCell, styles.betCellDisabled]}>
                        <Text style={styles.betLineDisabled}>
                          {formatMoneyline(game.homeMoneyline || -110)}
                        </Text>
                      </View>
                    </View>

                    {/* Game Info Footer */}
                    <View style={styles.gameFooter}>
                      <Text style={styles.gameTime}>
                        🕐 {game.gameTime}
                      </Text>
                      {isLocked ? (
                        <Text style={styles.lockedBadge}>🔒 Locked</Text>
                      ) : (
                        <Text style={styles.timeToLock}>⏱ {timeToLock}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))
        ) : (
          <View style={styles.noGamesCard}>
            <Text style={styles.noGamesText}>
              No upcoming {selectedSport.label} games available
            </Text>
            <Text style={styles.noGamesSubtext}>Check back later for new games</Text>
          </View>
        )}

        {/* Dev Tools */}
        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>🛠 Dev Tools (Week {currentWeekNumber})</Text>
            {selectedSport.key === 'nfl' && (
              <>
                <TouchableOpacity onPress={autoPopulateWeek} style={styles.devButton}>
                  <Text style={styles.devButtonText}>📥 Populate Week {currentWeekNumber}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={autoResolveWeek} style={[styles.devButton, { backgroundColor: '#007AFF' }]}>
                  <Text style={styles.devButtonText}>✅ Resolve Week {currentWeekNumber}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={advanceToNextWeek} style={[styles.devButton, { backgroundColor: '#34C759' }]}>
                  <Text style={styles.devButtonText}>⏭️ Advance Week</Text>
                </TouchableOpacity>
              </>
            )}
            {selectedSport.key === 'nba' && (
              <TouchableOpacity 
                onPress={async () => {
                  const response = await fetch('https://jyqclrlmbsnwwqakfbwo.supabase.co/functions/v1/fetch-nba-games', {
                    method: 'POST',
                    headers: {
                      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5cWNscmxtYnNud3dxYWtmYndvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU2NjIxOTcsImV4cCI6MjA4MTIzODE5N30.dOj_ihr-SbQ-hdYDqmtsFDorK-cJ0OCFovjiBwAQZhw',
                      'Content-Type': 'application/json'
                    }
                  });
                  const data = await response.json();
                  Alert.alert('NBA Fetch', `Fetched ${data.gamesCount} games. Requests remaining: ${data.requestsRemaining}`);
                  loadGamesFromDatabase();
                }} 
                style={styles.devButton}
              >
                <Text style={styles.devButtonText}>🏀 Fetch NBA Games</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>

      {/* Picks Ticket */}
      <PicksTicket
        picks={pendingPicks}
        onUpdatePick={handleUpdatePick}
        onRemovePick={handleRemovePick}
        onSave={handleSavePicks}
        onClear={handleClearPicks}
        userGroups={userGroups}
        currentSport={selectedSport.key}
        userId={session?.user?.id}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  sportTabsContainer: {
    maxHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sportTabsContent: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  sportTabActive: {
    backgroundColor: '#FF6B35',
  },
  sportTabDisabled: {
    opacity: 0.4,
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  sportTabTextActive: {
    color: '#FFF',
  },
  sportTabTextDisabled: {
    color: '#666',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180,
  },
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dateHeaderText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 16,
  },
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  gameCardLocked: {
    opacity: 0.6,
  },
  gridHeader: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  teamColumnHeader: {
    flex: 1.5,
  },
  columnHeader: {
    flex: 1,
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  gridRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    paddingVertical: 4,
  },
  teamColumn: {
    flex: 1.5,
    paddingVertical: 12,
  },
  teamInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamLogo: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  teamName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    flexShrink: 1,
  },
  betCell: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    marginHorizontal: 4,
    marginVertical: 4,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  betCellPending: {
    backgroundColor: '#FF6B35',
    borderWidth: 2,
    borderColor: '#FF8F5C',
  },
  betCellSaved: {
    backgroundColor: '#2D5A27',
    borderWidth: 2,
    borderColor: '#34C759',
  },
  betCellLocked: {
    opacity: 0.4,
  },
  betCellDisabled: {
    backgroundColor: '#1C1C1E',
    opacity: 0.6,
  },
  betLine: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  betLineSelected: {
    color: '#FFF',
  },
  betLineDisabled: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  betOdds: {
    color: '#9B8AFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  betOddsSelected: {
    color: '#FFD4C4',
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  gameTime: {
    color: '#8E8E93',
    fontSize: 13,
  },
  timeToLock: {
    color: '#34C759',
    fontSize: 13,
    fontWeight: '600',
  },
  lockedBadge: {
    color: '#FF3B30',
    fontSize: 13,
    fontWeight: '600',
  },
  noGamesCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  noGamesText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noGamesSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  devSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  devLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 12,
  },
  devButton: {
    backgroundColor: '#FF6B35',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  devButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },
});