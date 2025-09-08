import { NFL_WEEK_1_2025 } from '@/app/data/nfl-week1-2025';
import { NFL_WEEK_2_2025 } from '@/app/data/nfl-week2-2025';
import PickModal from '@/components/PickModal';
import { Session } from '@supabase/supabase-js';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserPicks, savePick, supabase } from '../lib/supabase';

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
  selectedPick?: 'home' | 'away' | null;
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
  const [selectedWeek, setSelectedWeek] = useState('Week 1');
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [userPicks, setUserPicks] = useState<Map<string, any>>(new Map());
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [games, setGames] = useState<Game[]>([]);

  const sports = ['Football', 'Basketball', 'College', 'Other'];
  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];

  // Load user picks from database
  const loadUserPicks = async (userId: string) => {
    try {
      const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
      const result = await getUserPicks(userId, weekNumber);
        
      if (result.success && result.data) {
        const picksMap = new Map();
        result.data.forEach(pick => {
          picksMap.set(pick.game_id, {
            pick: pick.team_picked,
            pickType: pick.pick_type,
            confidence: pick.confidence,
            groups: [],
            reasoning: pick.reasoning,
          });
        });
        setUserPicks(picksMap);
        // Load games after picks are set
        loadGamesFromDatabase();
      }
    } catch (error) {
      console.error('Error loading picks:', error);
    }
  };

  // Load games from database
  const loadGamesFromDatabase = async () => {
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

      // Transform database games to Game interface
      const transformedGames: Game[] = (dbGames || []).map((dbGame, index) => ({
        id: index + 1,
        homeTeam: dbGame.home_team,
        awayTeam: dbGame.away_team,
        league: 'NFL',
        gameDate: dbGame.game_date.split(' ')[0],
        gameTime: (() => {
          try {
            console.log('Processing game_date:', dbGame.game_date);
            
            // Parse the ISO datetime from database
            const gameDate = new Date(dbGame.game_date);
            
            if (isNaN(gameDate.getTime())) {
              console.warn('Invalid date format:', dbGame.game_date);
              return "TBD";
            }
            
            // Format to readable time in Eastern Time
            const timeString = gameDate.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
              timeZone: 'America/New_York'
            });
            
            console.log('Converted time:', timeString);
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
        selectedPick: userPicks.get(dbGame.id)?.pick || null,
        pickType: userPicks.get(dbGame.id)?.pickType || null,
        confidence: userPicks.get(dbGame.id)?.confidence || null,
        groups: userPicks.get(dbGame.id)?.groups || [],
        reasoning: userPicks.get(dbGame.id)?.reasoning || '',
        originalId: dbGame.id,
      }));

      setGames(transformedGames);
      console.log('Loaded', transformedGames.length, 'games from database');
    } catch (error) {
      console.error('Error in loadGamesFromDatabase:', error);
    }
  };

  // Authentication check
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('IMMEDIATE AUTH CHECK:', session);
      
      if (session) {
        setSession(session);
        console.log('User is logged in:', session.user.phone);
      } else {
        console.log('No active session found');
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
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      setSession(session);
      if (session?.user) {
        loadUserPicks(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        loadUserPicks(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load picks when week changes
  useEffect(() => {
    if (session?.user) {
      loadUserPicks(session.user.id);
    }
  }, [selectedWeek, session]);

  // Load games when week changes (removed userPicks dependency)
  useEffect(() => {
    if (userPicks.size === 0) {
      loadGamesFromDatabase();
    }
  }, [selectedWeek]);

  // Calculate time until game locks
  const getTimeToLock = (gameDate: string, gameTime: string): string => {
    try {
      console.log('Calculating lock time for:', gameDate, gameTime);
      
      // Create a proper Date object by combining gameDate and parsed time
      const gameDateObj = new Date(gameDate);
      
      // Parse the display time (e.g., "8:20 PM") back to hours/minutes
      const timeMatch = gameTime.match(/(\d{1,2}):(\d{2})\s?(AM|PM)/i);
      if (!timeMatch) {
        console.warn('Could not parse time:', gameTime);
        return 'Soon';
      }
      
      const [, hours, minutes, period] = timeMatch;
      let hour24 = parseInt(hours);
      const min = parseInt(minutes);
      
      // Convert to 24-hour format
      if (period.toUpperCase() === 'PM' && hour24 !== 12) {
        hour24 += 12;
      } else if (period.toUpperCase() === 'AM' && hour24 === 12) {
        hour24 = 0;
      }
      
      // Set the time on the game date (assuming Eastern Time)
      gameDateObj.setHours(hour24, min, 0, 0);
      
      console.log('Game starts at:', gameDateObj);
      console.log('Current time:', currentTime);
      
      // Calculate difference
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
        console.error('gameDate:', gameDate, 'gameTime:', gameTime);
        return 'Soon';
      }
    };

  // Get lock time style based on urgency
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

  // Add this helper function near the top with other helper functions
  const canEditPick = (gameDate: string, gameTime: string): boolean => {
    const timeToLock = getTimeToLock(gameDate, gameTime);
    return timeToLock !== 'LOCKED';
  };


  // Handle pick selection
  const handlePickSelection = (game: Game) => {
    const timeToLock = getTimeToLock(game.gameDate, game.gameTime);
    if (timeToLock === 'LOCKED') {
      alert('This game has already started. Picks are locked.');
      return;
    }
    setSelectedGame(game);
    setShowPickModal(true);
  };

  // Handle view details navigation
  const handleViewDetails = (gameId: string | number) => {
    console.log('=== NAVIGATION DEBUG ===');
    console.log('Game ID being passed:', gameId);
    console.log('Game ID type:', typeof gameId);
    console.log('========================');
    router.push(`/game/${gameId}`);
  };

  // Handle pick submission
  const handlePickSubmit = async (pickData: PickData) => {
    try {
      console.log('1. Pick submitted - starting process');
      console.log('2. Pick data received:', pickData);
      
      setShowPickModal(false);
      setSelectedGame(null);
      console.log('3. Modal closed successfully');
      
      // Use actual logged-in user ID
      if (!session?.user?.id) {
        alert('Please log in to make picks');
        return;
      }
      const userId = session.user.id;
      console.log('4. Using actual user ID:', userId);

      if (selectedGame && selectedGame.originalId) {
        console.log('5. Saving pick for game:', selectedGame.originalId);
        
        setIsLoading(true);
        const weekNumber = parseInt(selectedWeek.replace('Week ', ''));
        
    const result = await savePick(
        userId,
        selectedGame.originalId,
        pickData.pick,
        weekNumber
              );

        if (result.success) {
          console.log('6. Pick saved to Supabase successfully!');
          
          const newPicks = new Map(userPicks);
          newPicks.set(selectedGame.originalId, {
            pick: pickData.pick,
            pickType: pickData.type,
            confidence: pickData.confidence,
            groups: pickData.groups || [],
            reasoning: pickData.reasoning || '',
          });
          setUserPicks(newPicks);
          
          // Reload games to show the updated pick
          loadGamesFromDatabase();
          
          console.log('7. Pick saved to local state and games reloaded');
        }
        else {
          console.error('6. Failed to save:', result.error);
          alert('Failed to save pick. Check console.');
        }
        
        setIsLoading(false);
      }
      
      console.log('8. All operations completed');
      
    } catch (error) {
      console.error('ERROR:', error);
      setIsLoading(false);
      alert('Error saving pick');
    }
  };

  // Get confidence color
  const getConfidenceColor = (confidence?: string | null) => {
    switch (confidence) {
      case 'High': return '#34C759';
      case 'Medium': return '#FF9500';
      case 'Low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  // Format game date time
  const formatGameDateTime = (date: string, time: string): string => {
    const gameDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (gameDate.toDateString() === today.toDateString()) {
      return `Today ${time}`;
    }
    if (gameDate.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow ${time}`;
    }
    const options: Intl.DateTimeFormatOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    return `${gameDate.toLocaleDateString('en-US', options)} ${time}`;
  };


  // Helper function to extract spread value from string like "NYJ +3" -> 3
    const getSpreadValue = (spreadString: string): number => {
      const match = spreadString.match(/([+-]\d+\.?\d*)/);
      return match ? parseFloat(match[1]) : 0;
    };

  // Development function to populate games

const populateAllGames = async () => {
  console.log('Starting clean database population...');
  
  if (__DEV__) {
    try {
      const allGames = [...NFL_WEEK_1_2025, ...NFL_WEEK_2_2025];
      
      const games = allGames.map(game => {
        // Convert the game time to 24-hour format for database storage
        const convertTo24Hour = (timeStr: string): string => {
          const [time, period] = timeStr.split(' ');
          let [hours, minutes] = time.split(':');
          let hour24 = parseInt(hours);
          
          if (period === 'PM' && hour24 !== 12) {
            hour24 += 12;
          } else if (period === 'AM' && hour24 === 12) {
            hour24 = 0;
          }
          
          return `${hour24.toString().padStart(2, '0')}:${minutes}:00`;
        };

        // Create proper ISO datetime string
        const gameDateTime = `${game.date}T${convertTo24Hour(game.time)}`;
        
        return {
          id: game.id,
          week: game.week,
          season: 2025,
          home_team: game.homeTeamShort,
          away_team: game.awayTeamShort,
          home_spread: getSpreadValue(game.spread.home),
          away_spread: getSpreadValue(game.spread.away),
          league: 'NFL',
          game_date: gameDateTime, // This preserves the actual game time
          locked: false,
        };
      });

      console.log('Sample game with preserved time:', games[0]);

      const { data, error } = await supabase
        .from('games')
        .insert(games);

      if (error) {
        console.error('Population error:', error);
        alert(`Error: ${error.message}`);
      } else {
        alert(`Success! Populated ${games.length} games with correct times`);
      }
    } catch (err) {
      console.error('Population failed:', err);
      alert('Population failed - check console');
    }
  }
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
        {weeks.map(week => (
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

              {game.selectedPick && (
                <View style={styles.pickStatus}>
                  <View style={styles.pickStatusLeft}>
                    <Text style={styles.pickTypeLabel}>
                      {game.pickType === 'solo' ? '🎯 Solo Pick' : '👥 Group Pick'}
                    </Text>
                    {game.confidence && (
                      <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(game.confidence) }]}>
                        <Text style={styles.confidenceText}>{game.confidence}</Text>
                      </View>
                    )}
                  </View>
                  
                  {game.groups && game.groups.length > 0 ? (
                    <Text style={styles.groupsText}>
                      Shared with: {game.groups.join(', ')}
                    </Text>
                  ) : (
                    <Text style={styles.soloText}>Personal tracking only</Text>
                  )}

                  {/* Enhanced pick status and edit functionality */}
                  <View style={styles.pickActionRow}>
                    {canEditPick(game.gameDate, game.gameTime) ? (
                      <TouchableOpacity 
                        style={styles.editPickButton}
                        onPress={() => handlePickSelection(game)}
                      >
                        <Text style={styles.editPickText}>✏️ Edit Pick</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={styles.pickLockedText}>
                        🔒 Pick locked - Game started
                      </Text>
                    )}
                    
                    <Text style={styles.pickConfirmText}>
                      Your pick: {game.selectedPick === 'home' ? game.spread.home : game.spread.away}
                    </Text>
                  </View>
                </View>
              )}

              {game.selectedPick && game.pickType === 'group' && !isLocked && (
                <TouchableOpacity 
                  style={styles.viewDetailsButton}
                  onPress={() => handleViewDetails(game.originalId)}
                >
                  <Text style={styles.viewDetailsText}>See Group Picks →</Text>
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
          <TouchableOpacity 
            onPress={populateAllGames}
            style={{
              backgroundColor: '#FF6B35',
              padding: 16,
              margin: 16,
              borderRadius: 8,
              borderWidth: 2,
              borderColor: '#FFF',
            }}
          >
            <Text style={{ color: '#FFF', textAlign: 'center', fontWeight: 'bold' }}>
              DEV: Populate Games Database
            </Text>
          </TouchableOpacity>
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
          }}
          currentPick={selectedGame.selectedPick || undefined}
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
  // Add these to your StyleSheet.create section:
  pickActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  editPickButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  editPickText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  pickLockedText: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '600',
  },
  pickConfirmText: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
  },
});