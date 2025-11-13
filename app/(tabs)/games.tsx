import { getWeekSchedule, hasScheduleForWeek } from '@/app/data/nfl-2025-schedule';
import { getWeekScores, hasScoresForWeek } from '@/app/data/resolution/allScores';
import { resolveWeekFromScores } from '@/app/data/resolution/gameResolution';
import PickModal from '@/components/PickModal';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getUserPicks, savePick, supabase, getCurrentWeek, updateCurrentWeek, populateWeekGames } from '../lib/supabase';


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
  overUnder?: number;
  selectedPick?: 'home' | 'away' | null;
  selectedOverUnderPick?: 'over' | 'under' | null;
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

interface NFLGame {
  id: string;
  week: number;
  date: string;
  time: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamShort: string;
  awayTeamShort: string;
  spread: {
    home: string;
    away: string;
    value: number;
  };
  overUnder: number;
  moneyline: {
    home: number;
    away: number;
  };
  venue: string;
  tv: string[];
  isPrimetime: boolean;
  isNeutralSite?: boolean;
}

export default function GamesScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState('Football');
  const [selectedWeek, setSelectedWeek] = useState('Week 4');
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPicks, setUserPicks] = useState<Map<string, any>>(new Map());
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);
  const [currentWeekNumber, setCurrentWeekNumber] = useState(4);

  const sports = ['Football', 'Basketball', 'College', 'Other'];

  // Replace your testResolution function with this:
  const autoResolveWeek = async () => {
    const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
    
    // Check if scores exist
    if (!hasScoresForWeek(weekNumber)) {
      alert(`❌ No scores file found for Week ${weekNumber}.\n\nPlease create app/data/resolution/week${weekNumber}-scores-2025.ts first.`);
      return;
    }
    
    const scores = getWeekScores(weekNumber);
    
    if (!scores || scores.length === 0) {
      alert(`❌ Week ${weekNumber} scores are empty.`);
      return;
    }
    
    console.log(`Resolving ${scores.length} games for Week ${weekNumber}...`);
    
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

    // Automate for the following week
    const advanceToNextWeek = async () => {
      const currentWeek = await getCurrentWeek();
      const nextWeek = currentWeek + 1;
      
      // Check if next week schedule exists
      if (!hasScheduleForWeek(nextWeek)) {
        Alert.alert(
          '⚠️ Cannot Advance',
          `Schedule file for Week ${nextWeek} doesn't exist yet.`,
          [{ text: 'OK' }]
        );
        return;
      }
      
      // Show confirmation dialog
      Alert.alert(
        '🔄 Advance Week?',
        `Advance from Week ${currentWeek} to Week ${nextWeek}?\n\nThis will:\n• Update the current week in the database\n• Show Week ${nextWeek} by default for all users`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
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

  // Filter weeks to only show current and future
  const allWeeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9', 'Week 10', 'Week 11', 'Week 12', 'Week 13', 'Week 14', 'Week 15', 'Week 16', 'Week 17', 'Week 18' ];
  const visibleWeeks = allWeeks.filter(week => {
    const weekNum = parseInt(week.replace('Week ', ''));
    return weekNum >= currentWeekNumber - 1; // Show 1 week back, current, and future
  });

  // Helper function to extract spread value from string like "NYJ +3" -> 3
  const getSpreadValue = (spreadString: string): number => {
    const match = spreadString.match(/([+-]\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 0;
  };

  // Development function to populate games automatically for selected week
  const autoPopulateWeek = async () => {
    const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
    
    // Check if schedule exists
    if (!hasScheduleForWeek(weekNumber)) {
      alert(`❌ No schedule file found for Week ${weekNumber}.\n\nPlease create app/data/schedule/nfl-week${weekNumber}-2025.ts first.`);
      return;
    }
    
    // Get the schedule
    const schedule = getWeekSchedule(weekNumber);
    
    if (schedule.length === 0) {
      alert(`❌ Week ${weekNumber} schedule is empty.`);
      return;
    }

    console.log(`Populating ${schedule.length} games for Week ${weekNumber}...`);
    
    // Populate the games
    const result = await populateWeekGames(weekNumber, schedule);
    
    if (result.success) {
      alert(`✅ Successfully populated ${result.count} games for Week ${weekNumber}!`);
      loadGamesFromDatabase();
    } else {
      alert(`❌ Error: ${result.error}`);
    }
  };

  // Load user picks from database
  const loadUserPicks = async (userId: string) => {
    try {
      const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
      const result = await getUserPicks(userId, weekNumber);
      
      // Always create picks map, even if empty
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
          });
        });
      }
      
      setUserPicks(picksMap);
     // Pass the picksMap directly instead of relying on state
      await loadGamesFromDatabase(picksMap);
      
    } 
      catch (error) {
      console.error('Error loading picks:', error);
      await loadGamesFromDatabase(new Map());
    }
  };

  /// Refresh user picks from database
  const refreshUserPicks = async () => {
    if (session?.user) {
      console.log('Refreshing user picks for user:', session.user.id);
      await loadUserPicks(session.user.id);
    }
  };


  // Load games from database
  const loadGamesFromDatabase = async (picksToUse?: Map<string, any>) => {
    try {
      console.log('Loading games from database for week:', selectedWeek);
      const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
      
      const { data: dbGames, error } = await supabase
        .from('games')
        .select('*')
        .eq('week', weekNumber)
        .eq('season', 2025);

      if (error) {
        console.error('Error loading games:', error);
        return;
      }

      if (!dbGames || dbGames.length === 0) {
        console.log(`No games in database for week ${weekNumber}`);
        setGames([]);
        return;
      }

      const picks = picksToUse || userPicks;

      console.log('=== DEBUGGING DATES ===');
        dbGames.forEach(game => {
          console.log(`${game.away_team} @ ${game.home_team}`);
          console.log(`Raw DB date: ${game.game_date}`);
          console.log(`Split date: ${game.game_date.split('T')[0]}`);
          console.log('---');
        });
        console.log('=== END DEBUG ===');

      // Transform database games to Game interface
      const transformedGames: Game[] = (dbGames || []).map((dbGame, index) => ({
        id: index + 1,
        homeTeam: dbGame.home_team,
        awayTeam: dbGame.away_team,
        league: 'NFL',
        gameDate: dbGame.game_date.split('T')[0],
        gameTime: (() => {
          try {
            const gameDate = new Date(dbGame.game_date);
            
            if (isNaN(gameDate.getTime())) {
              console.warn('Invalid date format:', dbGame.game_date);
              return "TBD";
            }
            
            const timeString = gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York'
            });
            
            return timeString;
            
          } catch (error) {
            console.error('Time parsing error:', error, 'for date:', dbGame.game_date);
            return "TBD";
          }
        })(),
        spread: {
          home: `${dbGame.home_team} ${dbGame.home_spread > 0 ? '+' : ''}${dbGame.home_spread}`,
          away: `${dbGame.away_team} ${dbGame.away_spread > 0 ? '+' : ''}${dbGame.away_spread}`,
        },
        overUnder: dbGame.over_under || undefined, 
        selectedPick: picks.get(dbGame.id)?.pick || null,
        selectedOverUnderPick: picks.get(dbGame.id)?.overUnderPick || null,
        pickType: picks.get(dbGame.id)?.pickType || null,
        confidence: picks.get(dbGame.id)?.confidence || null,
        groups: picks.get(dbGame.id)?.groups || [],
        reasoning: picks.get(dbGame.id)?.reasoning || '',
        originalId: dbGame.id,
      }));

      setGames(transformedGames);
      console.log('Loaded', transformedGames.length, 'games from database');
    } catch (error) {
      console.error('Error in loadGamesFromDatabase:', error);
    }
  };

  // Load current week from database
  useEffect(() => {
    const loadCurrentWeek = async () => {
      const weekNum = await getCurrentWeek();
      setCurrentWeekNumber(weekNum);
      setSelectedWeek(`Week ${weekNum}`);
    };
    
    loadCurrentWeek();
  }, []);

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
      }
    };
    
    checkAuth();
  }, []);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Auth state listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        loadUserPicks(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        setTimeout(() => {
          loadUserPicks(session.user.id);
        }, 500);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user) {
      loadUserPicks(session.user.id);
    } else {
      loadGamesFromDatabase();
    }
  }, [selectedWeek, session]);

  // Calculate time until game locks
  const getTimeToLock = (gameDate: string, gameTime: string): string => {
    try {
      const timeMatch = gameTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!timeMatch) {
        return 'Soon';
      }
      
      const [, hours, minutes, period] = timeMatch;
      let hour24 = parseInt(hours);
      const min = parseInt(minutes);
      
      if (period.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      // Parse date components and create date object in local time
      const [year, month, day] = gameDate.split('-').map(Number);
      const gameDateObj = new Date(year, month - 1, day, hour24, min, 0, 0);

      const diffMs = gameDateObj.getTime() - currentTime.getTime();
      
      if (diffMs <= 0) {
        return 'LOCKED';
      }
        
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffDays > 0) {
        return `${diffDays}d ${diffHours % 24}h`;
      }
      if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes % 60}m`;
      }
      if (diffMinutes > 0) {
        return `${diffMinutes}m`;
      }
      
      return 'LOCKED';
        
    } catch (error) {
      console.error('Error calculating time to lock:', error);
      return 'Soon';
    }
  };

  const getLockTimeStyle = (timeToLock: string) => {
    if (timeToLock === 'LOCKED') return styles.lockTimeLocked;
    if (timeToLock.includes('m') && !timeToLock.includes('h') && !timeToLock.includes('d')) {
      return styles.lockTimeUrgent;
    }
    if (timeToLock.includes('h') && !timeToLock.includes('d')) {
      const hours = parseInt(timeToLock);
      if (hours <= 2) return styles.lockTimeUrgent;
      if (hours <= 6) return styles.lockTimeWarning;
    }
    return styles.lockTimeNormal;
  };

  const handlePickSelection = (game: Game) => {
    const timeToLock = getTimeToLock(game.gameDate, game.gameTime);
    if (timeToLock === 'LOCKED') {
      alert('This game has already started. Picks are locked.');
      return;
    }
    setSelectedGame(game);
    setShowPickModal(true);
  };

  const handleViewDetails = (gameId: string | number) => {
    router.push(`/game/${gameId}`);
  };

  const handlePickSubmit = async (pickData: PickData) => {
  try {
    console.log('1. Pick submitted - starting process');
    setShowPickModal(false);
    
    if (!session?.user?.id) {
      alert('Please log in to make picks');
      return;
    }

    if (selectedGame && selectedGame.originalId) {
      setIsLoading(true);
      const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
      
      const result = await savePick(session.user.id, {
        game_id: selectedGame.originalId,
        pick: pickData.pick as string,
        team_picked: pickData.pick,
        confidence: pickData.confidence as 'Low' | 'Medium' | 'High',
        reasoning: pickData.reasoning || '',
        pick_type: pickData.type,
        groups: pickData.groups,
        spread_value: 0,
        week: weekNumber,
        overUnderPick: pickData.overUnderPick,
      });

      if (result.success) {
        console.log('Pick saved successfully!');
        // Force refresh picks from database instead of manual state updates
        await refreshUserPicks();
      } else {
        console.error('Failed to save pick:', result.error);
        alert('Failed to save pick');
      }
      
      setIsLoading(false);
    }
    
    setSelectedGame(null);
    
  } catch (error) {
      console.error('=== PICK SAVE ERROR ===');
      console.error('Error object:', error);
      console.error('Error message:', error.message);
      console.error('Selected game:', selectedGame);
      console.error('Original ID:', selectedGame?.originalId);
      console.error('User ID:', session?.user?.id);
      console.error('========================');
      setIsLoading(false);
      alert('Error saving pick');
    }
};

  const getConfidenceColor = (confidence?: string | null) => {
    switch (confidence) {
      case 'High': return '#34C759';
      case 'Medium': return '#FF9500';
      case 'Low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const formatGameDateTime = (date: string, time: string): string => {
    // Parse as local date to avoid timezone shifts
    const [year, month, day] = date.split('-').map(Number);
    const gameDate = new Date(year, month - 1, day); // month is 0-indexed
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const gameDateOnly = new Date(gameDate);
    gameDateOnly.setHours(0, 0, 0, 0);
    
    if (gameDateOnly.getTime() === today.getTime()) {
      return `Today ${time}`;
    }
    if (gameDateOnly.getTime() === tomorrow.getTime()) {
      return `Tomorrow ${time}`;
    }
    
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${gameDate.toLocaleDateString('en-US', options)} ${time}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Games</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
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
            style={[
              styles.weekChip,
              selectedWeek === week && styles.weekChipActive
            ]}
            onPress={() => setSelectedWeek(week)}
          >
            <Text style={[
              styles.weekChipText,
              selectedWeek === week && styles.weekChipTextActive
            ]}>
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
            style={[
              styles.sportChip,
              selectedSport === sport && styles.sportChipActive
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[
              styles.sportChipText,
              selectedSport === sport && styles.sportChipTextActive
            ]}>
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
            
            return (
              <View key={game.id} style={[styles.gameCard, isLocked && styles.gameCardLocked]}>
                <View style={styles.gameHeader}>
                  <View>
                    <Text style={styles.gameTitle}>
                      {game.awayTeam} @ {game.homeTeam}
                    </Text>
                    <Text style={styles.gameInfo}>
                      {game.league} • {formatGameDateTime(game.gameDate, game.gameTime)}
                    </Text>
                  </View>
                  <View style={styles.lockTimeContainer}>
                    <Text style={[styles.lockTime, getLockTimeStyle(timeToLock)]}>
                      {isLocked ? '🔒 ' : '🕐 '}{timeToLock}
                    </Text>
                    {!isLocked && timeToLock.includes('m') && !timeToLock.includes('h') && (
                      <Text style={styles.lockTimeSubtext}>Hurry!</Text>
                    )}
                  </View>
                </View>

                <View style={styles.pickOptions}>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      game.selectedPick === 'away' && styles.pickButtonSelected,
                      isLocked && styles.pickButtonLocked
                    ]}
                    onPress={() => !isLocked && handlePickSelection(game)}
                    disabled={isLocked}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      game.selectedPick === 'away' && styles.pickButtonTextSelected,
                      isLocked && styles.pickButtonTextLocked
                    ]}>
                      {game.spread.away}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      game.selectedPick === 'home' && styles.pickButtonSelected,
                      isLocked && styles.pickButtonLocked
                    ]}
                    onPress={() => !isLocked && handlePickSelection(game)}
                    disabled={isLocked}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      game.selectedPick === 'home' && styles.pickButtonTextSelected,
                      isLocked && styles.pickButtonTextLocked
                    ]}>
                      {game.spread.home}
                    </Text>
                  </TouchableOpacity>
                </View>

                {game.selectedPick && !isLocked && (
                  <View style={styles.pickStatus}>
                    <View style={styles.pickStatusLeft}>
                      <Text style={styles.pickTypeLabel}>
                        {game.pickType === 'solo' ? '🎯 Solo Pick' : '👥 Shared with The Syndicate'}
                      </Text>
                      {game.confidence && (
                        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(game.confidence) }]}>
                          <Text style={styles.confidenceText}>{game.confidence}</Text>
                        </View>
                      )}
                    </View>
                    
                    {game.pickType === 'solo' ? (
                      <Text style={styles.soloText}>Personal tracking only</Text>
                    ) : (
                      <Text style={styles.groupsText}>Everyone can see your pick</Text>
                    )}
                  </View>
                )}

                {game.selectedPick && game.pickType === 'group' && !isLocked && (
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => handleViewDetails(game.originalId)}
                  >
                    <Text style={styles.viewDetailsText}>See Everyone's Picks →</Text>
                  </TouchableOpacity>
                )}

                {!game.selectedPick && !isLocked && (
                  <Text style={styles.noPickText}>Tap to make your pick</Text>
                )}

                {isLocked && !game.selectedPick && (
                  <Text style={styles.lockedText}>
                    No pick made - game has started
                  </Text>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.noGamesCard}>
            <Text style={styles.noGamesText}>No {selectedSport} games scheduled for {selectedWeek}</Text>
            <Text style={styles.noGamesSubtext}>Check back later or try another week</Text>
          </View>
        )}

        <View style={styles.helpBanner}>
          <Text style={styles.helpTitle}>💡 How Lock Times Work</Text>
          <Text style={styles.helpText}>
            Picks lock when the game starts. Make your picks early to discuss with friends!
          </Text>
        </View>
        
        {__DEV__ && (
          <>
            <TouchableOpacity 
              onPress={autoPopulateWeek}
              style={styles.devButton}
            >
              <Text style={styles.devButtonText}>
                📥 Populate {selectedWeek} Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={autoResolveWeek}
              style={[styles.devButton, { backgroundColor: '#007AFF' }]}
            >
              <Text style={styles.devButtonText}>
                ✅ Resolve {selectedWeek} Games
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              onPress={advanceToNextWeek}
              style={[styles.devButton, { backgroundColor: '#34C759' }]}
            >
              <Text style={styles.devButtonText}>
                ⏭️ Advance to Next Week
              </Text>
            </TouchableOpacity>
          </>
        )}
      
      </ScrollView>
      {selectedGame && showPickModal && (
        <PickModal
          visible={showPickModal}
          onClose={() => {
            setShowPickModal(false);
            setSelectedGame(null);
          }}
          onSubmit={handlePickSubmit}
          game={{
            homeTeam: selectedGame.homeTeam,
            awayTeam: selectedGame.awayTeam,
            spread: selectedGame.spread,
            time: formatGameDateTime(selectedGame.gameDate, selectedGame.gameTime),
            overUnder: selectedGame.overUnder, 
          }}
          currentPick={selectedGame.selectedPick || undefined}
          currentOverUnderPick={selectedGame.selectedOverUnderPick || undefined}

          groups={selectedGame.groups || []}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  helpButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  helpIcon: {
    color: '#FFF',
    fontSize: 12,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  calendarIcon: {
    fontSize: 24,
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
    padding: 24,
    paddingTop: 0,
    paddingBottom: 100,
  },
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  gameCardLocked: {
    opacity: 0.7,
    borderWidth: 1,
    borderColor: '#333',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameInfo: {
    color: '#8E8E93',
    fontSize: 14,
  },
  lockTimeContainer: {
    alignItems: 'flex-end',
  },
  lockTime: {
    fontSize: 14,
    fontWeight: '600',
  },
  lockTimeNormal: {
    color: '#34C759',
  },
  lockTimeWarning: {
    color: '#FFCC00',
  },
  lockTimeUrgent: {
    color: '#FF9500',
  },
  lockTimeLocked: {
    color: '#FF3B30',
  },
  lockTimeSubtext: {
    color: '#FF9500',
    fontSize: 11,
    marginTop: 2,
    fontStyle: 'italic',
  },
  pickOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonSelected: {
    backgroundColor: '#FF6B35',
  },
  pickButtonLocked: {
    opacity: 0.5,
  },
  pickButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pickButtonTextSelected: {
    color: '#FFF',
  },
  pickButtonTextLocked: {
    color: '#8E8E93',
  },
  pickStatus: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  pickStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  pickTypeLabel: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  groupsText: {
    color: '#8E8E93',
    fontSize: 13,
  },
  soloText: {
    color: '#8E8E93',
    fontSize: 13,
    fontStyle: 'italic',
  },
  noPickText: {
    color: '#8E8E93',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  lockedText: {
    color: '#FF3B30',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 8,
  },
  viewDetailsButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  viewDetailsText: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  helpBanner: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  helpTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helpText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  noGamesCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 40,
    marginBottom: 16,
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
  devButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    margin: 16,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
  },
  devButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 14,
  },

});