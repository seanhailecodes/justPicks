import { getWeekSchedule, hasScheduleForWeek } from '@/app/data/nfl-2025-schedule';
import { getWeekScores, hasScoresForWeek } from '@/app/data/resolution/allScores';
import { resolveWeekFromScores } from '@/app/data/resolution/gameResolution';
import PicksTicket, { TicketPick } from '@/components/PicksTicket';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserPicks, savePick, supabase, getCurrentWeek, updateCurrentWeek, populateWeekGames } from '../lib/supabase';
import { getUserGroups } from '../lib/database';


// Type definitions
interface GameSpread {
  away: string;
  home: string;
}

interface Game {
  id: number;
  homeTeam: string;
  awayTeam: string;
  league: string;
  gameDate: string;
  gameTime: string;
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

export default function GamesScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Football');
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPicks, setUserPicks] = useState<Map<string, any>>(new Map());
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState<number | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [pendingPicks, setPendingPicks] = useState<TicketPick[]>([]);
  const [userGroups, setUserGroups] = useState<{id: string; name: string}[]>([]);

  const sports = ['Football', 'Basketball', 'College', 'Other'];

  const autoResolveWeek = async () => {
    const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
    
    if (!hasScoresForWeek(weekNumber)) {
      alert(`❌ No scores file found for Week ${weekNumber}.`);
      return;
    }
    
    const scores = getWeekScores(weekNumber);
    
    if (!scores || scores.length === 0) {
      alert(`❌ Week ${weekNumber} scores are empty.`);
      return;
    }
    
    try {
      const result = await resolveWeekFromScores(scores);
      
      if (result.success) {
        alert(`✅ Successfully resolved ${result.gamesResolved} games for Week ${weekNumber}!`);
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
              setSelectedWeek(`Week ${nextWeek}`);
            } else {
              Alert.alert('❌ Error', result.error || 'Failed to update week');
            }
          }
        }
      ]
    );
  };

  const allWeeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14', 'Week 15', 'Week 16', 'Week 17', 'Week 18'];
  const visibleWeeks = allWeeks.filter(week => {
    const weekNum = parseInt(week.replace('Week ', ''));
    return weekNum >= (currentWeekNumber || 12) - 1;
  });

  const autoPopulateWeek = async () => {
    const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
    
    if (!hasScheduleForWeek(weekNumber)) {
      alert(`❌ No schedule file found for Week ${weekNumber}.`);
      return;
    }
    
    const schedule = getWeekSchedule(weekNumber);
    
    if (schedule.length === 0) {
      alert(`❌ Week ${weekNumber} schedule is empty.`);
      return;
    }

    const result = await populateWeekGames(weekNumber, schedule);
    
    if (result.success) {
      alert(`✅ Successfully populated ${result.count} games for Week ${weekNumber}!`);
      loadGamesFromDatabase();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  const loadUserPicks = async (userId: string) => {
    try {
      const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
      const result = await getUserPicks(userId, weekNumber);
      
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
      const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
      
      const { data: dbGames, error } = await supabase
        .from('games')
        .select('*')
        .eq('week', weekNumber)
        .eq('season', 2025)
        .order('game_date', { ascending: true });

      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      if (!dbGames || dbGames.length === 0) {
        setGames([]);
        return;
      }

      const picks = picksToUse || userPicks;

      const transformedGames: Game[] = (dbGames || []).map((dbGame, index) => ({
        id: index + 1,
        homeTeam: dbGame.home_team,
        awayTeam: dbGame.away_team,
        league: 'NFL',
        gameDate: dbGame.game_date.split('T')[0],
        gameTime: (() => {
          try {
            const gameDate = new Date(dbGame.game_date);
            if (isNaN(gameDate.getTime())) return "TBD";
            return gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York'
            });
          } catch (error) {
            return "TBD";
          }
        })(),
        spread: {
          home: `${dbGame.home_team} ${dbGame.home_spread > 0 ? '+' : ''}${dbGame.home_spread}`,
          away: `${dbGame.away_team} ${dbGame.away_spread > 0 ? '+' : ''}${dbGame.away_spread}`,
        },
        homeSpreadValue: dbGame.home_spread,
        awaySpreadValue: dbGame.away_spread,
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
      }));

      setGames(transformedGames);
    } catch (error) {
      console.error('Error in loadGamesFromDatabase:', error);
    }
  };

  useEffect(() => {
    const loadCurrentWeek = async () => {
      const weekNum = await getCurrentWeek();
      setCurrentWeekNumber(weekNum);
      setSelectedWeek(`Week ${weekNum}`);
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
      if (session?.user && selectedWeek) loadUserPicks(session.user.id);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user && selectedWeek) {
        setTimeout(() => loadUserPicks(session.user.id), 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitializing && selectedWeek) {
      if (session?.user) {
        loadUserPicks(session.user.id);
      } else {
        loadGamesFromDatabase();
      }
    }
  }, [selectedWeek, session, isInitializing]);

  const getTimeToLock = (gameDate: string, gameTime: string): string => {
    try {
      const timeMatch = gameTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!timeMatch) return 'Soon';
      
      const [, hours, minutes, period] = timeMatch;
      let hour24 = parseInt(hours);
      const min = parseInt(minutes);
      
      if (period.toUpperCase() === 'PM' && hour24 !== 12) hour24 += 12;
      else if (period.toUpperCase() === 'AM' && hour24 === 12) hour24 = 0;
      
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

  const handleCellPress = (game: Game, betType: 'spread' | 'total' | 'moneyline', side: 'home' | 'away' | 'over' | 'under') => {
    const timeToLock = getTimeToLock(game.gameDate, game.gameTime);
    if (timeToLock === 'LOCKED') {
      alert('This game has already started. Picks are locked.');
      return;
    }

    // Check if this pick already exists in pending
    const existingIndex = pendingPicks.findIndex(
      p => p.gameId === game.originalId && p.betType === betType
    );

    if (existingIndex >= 0) {
      // If same side, remove it (toggle off)
      if (pendingPicks[existingIndex].side === side) {
        setPendingPicks(prev => prev.filter((_, i) => i !== existingIndex));
      } else {
        // If different side (e.g. switching home to away), update it
        setPendingPicks(prev => prev.map((p, i) => 
          i === existingIndex 
            ? { ...p, side, line: getLineForPick(game, betType, side) }
            : p
        ));
      }
    } else {
      // Add new pick
      const newPick: TicketPick = {
        gameId: game.originalId!,
        gameLabel: `${game.awayTeam} @ ${game.homeTeam}`,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        betType,
        side,
        line: getLineForPick(game, betType, side),
        odds: '-110',
        confidence: 'Medium',
      };
      setPendingPicks(prev => [...prev, newPick]);
    }
  };

  const getLineForPick = (game: Game, betType: 'spread' | 'total' | 'moneyline', side: string): string => {
    if (betType === 'spread') {
      if (side === 'home') return formatSpread(game.homeSpreadValue);
      return formatSpread(game.awaySpreadValue);
    }
    if (betType === 'total') {
      if (side === 'over') return `O ${game.overUnder}`;
      return `U ${game.overUnder}`;
    }
    // moneyline
    if (side === 'home') return formatMoneyline(game.homeMoneyline || -110);
    return formatMoneyline(game.awayMoneyline || -110);
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

    setIsLoading(true);
    const weekNumber = parseInt(selectedWeek?.replace('Week ', '') || '1');

    try {
      // Save each pick
      for (const pick of picks) {
        const game = games.find(g => g.originalId === pick.gameId);
        if (!game) continue;

        // Determine if it's a spread/moneyline pick (home/away) or O/U pick
        const isSpreadOrML = pick.betType === 'spread' || pick.betType === 'moneyline';
        const isTotal = pick.betType === 'total';
        
        const pickData = {
          game_id: pick.gameId,
          pick: pick.side,  // Always set - 'home', 'away', 'over', or 'under'
          team_picked: isSpreadOrML ? pick.side : null,
          confidence: isSpreadOrML ? pick.confidence : 'Medium',  // Spread/ML confidence
          reasoning: '',
          pick_type: pickType,
          groups: groupIds,
          spread_value: pick.betType === 'spread' 
            ? (pick.side === 'home' ? game.homeSpreadValue : game.awaySpreadValue)
            : 0,
          week: weekNumber,
          overUnderPick: isTotal ? pick.side : null,
          overUnderConfidence: isTotal ? pick.confidence : null,
        };

        await savePick(session.user.id, pickData);
      }

      // Clear pending picks and refresh
      setPendingPicks([]);
      await refreshUserPicks();
      
      Alert.alert('✅ Saved!', `${picks.length} pick${picks.length > 1 ? 's' : ''} saved successfully!`);
    } catch (error) {
      console.error('Error saving picks:', error);
      alert('Error saving picks');
    } finally {
      setIsLoading(false);
    }
  };

  // Load user groups when session is available
  useEffect(() => {
    const loadGroups = async () => {
      if (session?.user?.id) {
        const groups = await getUserGroups(session.user.id);
        setUserGroups(groups.map(g => ({ id: g.id, name: g.name })));
      }
    };
    loadGroups();
  }, [session]);

  const formatGameDateTime = (date: string, time: string): string => {
    const [year, month, day] = date.split('-').map(Number);
    const gameDate = new Date(year, month - 1, day);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const gameDateOnly = new Date(gameDate);
    gameDateOnly.setHours(0, 0, 0, 0);
    
    if (gameDateOnly.getTime() === today.getTime()) return `Today, ${time}`;
    if (gameDateOnly.getTime() === tomorrow.getTime()) return `Tomorrow, ${time}`;
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${gameDate.toLocaleDateString('en-US', options)}, ${time}`;
  };

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

      <ScrollView 
        horizontal 
        style={styles.weekFilter} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekFilterContent}
      >
        {visibleWeeks.map(week => (
          <TouchableOpacity
            key={week}
            style={[styles.weekChip, selectedWeek === week && styles.weekChipActive]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text style={[styles.weekChipText, selectedWeek === week && styles.weekChipTextActive]}>
              {week}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        horizontal 
        style={styles.sportFilter} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sportFilterContent}
      >
        {sports.map(sport => (
          <TouchableOpacity
            key={sport}
            style={[styles.sportChip, selectedSport === sport && styles.sportChipActive]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[styles.sportChipText, selectedSport === sport && styles.sportChipTextActive]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {games.length > 0 ? (
          games.map(game => {
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
                  <Text style={styles.columnHeader}>WINNER</Text>
                </View>

                {/* Away Team Row */}
                <View style={styles.gridRow}>
                  <View style={styles.teamColumn}>
                    <Text style={styles.teamName}>{game.awayTeam}</Text>
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

                  {/* Away Moneyline */}
                  <TouchableOpacity
                    style={[
                      styles.betCell,
                      isCellSelected('moneyline', 'away') === 'pending' && styles.betCellPending,
                      isCellSelected('moneyline', 'away') === 'saved' && styles.betCellSaved,
                      isLocked && styles.betCellLocked
                    ]}
                    onPress={() => !isLocked && handleCellPress(game, 'moneyline', 'away')}
                    disabled={isLocked}
                  >
                    <Text style={[styles.betLine, isCellSelected('moneyline', 'away') && styles.betLineSelected]}>
                      {formatMoneyline(game.awayMoneyline || -110)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Home Team Row */}
                <View style={styles.gridRow}>
                  <View style={styles.teamColumn}>
                    <Text style={styles.teamName}>{game.homeTeam}</Text>
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

                  {/* Home Moneyline */}
                  <TouchableOpacity
                    style={[
                      styles.betCell,
                      isCellSelected('moneyline', 'home') === 'pending' && styles.betCellPending,
                      isCellSelected('moneyline', 'home') === 'saved' && styles.betCellSaved,
                      isLocked && styles.betCellLocked
                    ]}
                    onPress={() => !isLocked && handleCellPress(game, 'moneyline', 'home')}
                    disabled={isLocked}
                  >
                    <Text style={[styles.betLine, isCellSelected('moneyline', 'home') && styles.betLineSelected]}>
                      {formatMoneyline(game.homeMoneyline || -110)}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Game Info Footer */}
                <View style={styles.gameFooter}>
                  <Text style={styles.gameDateTime}>
                    📅 {formatGameDateTime(game.gameDate, game.gameTime)}
                  </Text>
                  {isLocked ? (
                    <Text style={styles.lockedBadge}>🔒 Locked</Text>
                  ) : (
                    <Text style={styles.timeToLock}>⏱ {timeToLock}</Text>
                  )}
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.noGamesCard}>
            <Text style={styles.noGamesText}>No {selectedSport} games scheduled for {selectedWeek}</Text>
            <Text style={styles.noGamesSubtext}>Check back later or try another week</Text>
          </View>
        )}

        {__DEV__ && (
          <View style={styles.devSection}>
            <Text style={styles.devLabel}>🛠 Dev Tools</Text>
            <TouchableOpacity onPress={autoPopulateWeek} style={styles.devButton}>
              <Text style={styles.devButtonText}>📥 Populate {selectedWeek}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={autoResolveWeek} style={[styles.devButton, { backgroundColor: '#007AFF' }]}>
              <Text style={styles.devButtonText}>✅ Resolve {selectedWeek}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={advanceToNextWeek} style={[styles.devButton, { backgroundColor: '#34C759' }]}>
              <Text style={styles.devButtonText}>⏭️ Advance Week</Text>
            </TouchableOpacity>
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
  weekFilter: {
    maxHeight: 40,
    marginBottom: 8,
  },
  weekFilterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  weekChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  weekChipActive: {
    backgroundColor: '#FF6B35',
  },
  weekChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  weekChipTextActive: {
    color: '#FFF',
  },
  sportFilter: {
    maxHeight: 40,
    marginBottom: 16,
  },
  sportFilterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  sportChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sportChipActive: {
    backgroundColor: '#FF6B35',
  },
  sportChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sportChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 180, // Extra space for picks ticket
  },
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
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
  teamName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
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
  betLine: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  betLineSelected: {
    color: '#FFF',
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
  gameDateTime: {
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