import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface GameDetails {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeTeamShort: string;
  awayTeamShort: string;
  spread: { home: string; away: string; value: number };
  time: string;
  date: string;
  locked: boolean;
  timeToLock: string;
}

interface FriendPick {
  id: string;
  username: string;
  pick: 'home' | 'away';
  confidence: string;
  confidenceValue: number;
  confidenceColor: string;
  reasoning?: string;
  timestamp: string;
  winRate: number;
  totalPicks: number;
}

export default function GroupPicksScreen() {
  const { gameId } = useLocalSearchParams();
  const [gameData, setGameData] = useState<GameDetails | null>(null);
  const [friendPicks, setFriendPicks] = useState<FriendPick[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (gameId) {
      loadGameData(gameId as string);
    }
  }, [gameId]);

  const loadGameData = async (id: string) => {
    setIsLoading(true);
    try {
      console.log('Loading game data for ID:', id);

      // First, fetch the game details from the games table
      const { data: gameData, error: gameError } = await supabase
        .from('games')
        .select('*')
        .eq('id', id)
        .single();

      if (gameError) {
        console.error('Error fetching game:', gameError);
        throw gameError;
      }

      console.log('Game data loaded:', gameData);

      // Transform game data to match our interface
      const game: GameDetails = {
        id: gameData.id,
        homeTeam: gameData.home_team,
        awayTeam: gameData.away_team,
        homeTeamShort: gameData.home_team,
        awayTeamShort: gameData.away_team,
        spread: {
          home: `${gameData.home_team} ${gameData.home_spread > 0 ? '+' : ''}${gameData.home_spread}`,
          away: `${gameData.away_team} ${gameData.away_spread > 0 ? '+' : ''}${gameData.away_spread}`,
          value: Math.abs(gameData.home_spread),
        },
        time: new Date(gameData.game_date).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true
        }),
        date: new Date(gameData.game_date).toLocaleDateString(),
        locked: gameData.locked || false,
        timeToLock: '2h', // Calculate this based on game_date if needed
      };

      setGameData(game);

      // REPLACE lines 85-112 in your game/[gameId].tsx with this code:

      // Fetch all picks for this game
      const { data: picksData, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .eq('game_id', id);

      if (picksError) {
        console.error('Error fetching picks:', picksError);
        setFriendPicks([]);
        return;
      }

      console.log('Picks data loaded:', picksData);

      // Get current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      if (!currentUser) {
        setFriendPicks([]);
        return;
      }

      // Get all groups the current user is in
      const { data: userGroups } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', currentUser.id);

      const userGroupIds = userGroups?.map(g => g.group_id) || [];

      // Get all members from those groups
      const { data: groupMembers } = await supabase
        .from('group_members')
        .select('user_id')
        .in('group_id', userGroupIds);

      const groupMateIds = new Set(groupMembers?.map(m => m.user_id) || []);

      // Fetch display names from profiles
      const userIds = Array.from(new Set(picksData?.map(p => p.user_id) || []));
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Transform picks with usernames
      const picks: FriendPick[] = (picksData || []).map((pick, index) => {
        let username = 'Unknown';
        
        if (pick.user_id === currentUser.id) {
          username = 'You';
        } else if (groupMateIds.has(pick.user_id)) {
          const profile = profileMap.get(pick.user_id);
          if (profile) {
            username = profile.display_name || profile.username || 'Friend';
          }
        }

        return {
          id: pick.id.toString(),
          username,
          pick: pick.team_picked as 'home' | 'away',
          confidence: pick.confidence,
          confidenceValue: pick.confidence === 'High' ? 85 : pick.confidence === 'Medium' ? 65 : 45,
          confidenceColor: pick.confidence === 'High' ? '#34C759' : pick.confidence === 'Medium' ? '#FFCC00' : '#FF9500',
          reasoning: pick.reasoning || 'No reasoning provided',
          timestamp: new Date(pick.created_at).toLocaleString(),
          winRate: 70 + (index * 5),
          totalPicks: 20 + (index * 10),
        };
      });

      setFriendPicks(picks);
      console.log('Processed picks:', picks.length);

      setFriendPicks(picks);
      console.log('Processed picks:', picks.length);

    } catch (error) {
      console.error('Error loading game data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weighted consensus
  const calculateConsensus = () => {
    if (!friendPicks.length) return null;

    let homeScore = 0;
    let awayScore = 0;
    let totalWeight = 0;

    friendPicks.forEach(pick => {
      const weight = pick.confidenceValue * (1 + pick.winRate / 100);
      totalWeight += weight;
      
      if (pick.pick === 'home') {
        homeScore += weight;
      } else {
        awayScore += weight;
      }
    });

    const homePercentage = Math.round((homeScore / (homeScore + awayScore)) * 100);
    const awayPercentage = 100 - homePercentage;

    return {
      homeScore,
      awayScore,
      homePercentage,
      awayPercentage,
      totalWeight,
      recommendation: homePercentage > 50 ? 'home' : 'away',
      strength: Math.abs(homePercentage - 50),
    };
  };

  const consensus = calculateConsensus();

  // Count picks
  const homePicks = friendPicks.filter(p => p.pick === 'home').length;
  const awayPicks = friendPicks.filter(p => p.pick === 'away').length;
  const totalPicks = friendPicks.length;
  const pendingPicks = Math.max(0, 10 - totalPicks); // Assuming 10 total friends

  const handleBack = () => {
    router.back();
  };

  const getPickDisplay = (pick: string) => {
    if (!gameData) return '';
    return pick === 'home' ? gameData.spread.home : gameData.spread.away;
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading game details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!gameData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Game not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>
            {gameData.awayTeamShort} @ {gameData.homeTeamShort}
          </Text>
          <Text style={styles.headerTime}>{gameData.date} • {gameData.time}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Game Info Card */}
        <View style={styles.gameCard}>
          <Text style={styles.gameTime}>{gameData.time}</Text>
          {!gameData.locked && (
            <View style={styles.lockWarning}>
              <Text style={styles.lockIcon}>🕐</Text>
              <Text style={styles.lockText}>Picks lock in {gameData.timeToLock}</Text>
            </View>
          )}
        </View>

        {/* Consensus Card */}
        {consensus && (
          <View style={styles.consensusCard}>
            <Text style={styles.consensusTitle}>Community Consensus</Text>
            
            <View style={styles.consensusBoxes}>
              <TouchableOpacity 
                style={[
                  styles.consensusBox,
                  consensus.recommendation === 'away' && styles.consensusBoxActive
                ]}
              >
                <Text style={styles.consensusTeamName}>{gameData.awayTeamShort}</Text>
                <Text style={styles.consensusSpread}>{gameData.spread.away}</Text>
                <Text style={styles.consensusCount}>{awayPicks} picks ({consensus.awayPercentage}%)</Text>
              </TouchableOpacity>
              
              <Text style={styles.vsText}>vs</Text>
              
              <TouchableOpacity 
                style={[
                  styles.consensusBox,
                  consensus.recommendation === 'home' && styles.consensusBoxActive
                ]}
              >
                <Text style={styles.consensusTeamName}>{gameData.homeTeamShort}</Text>
                <Text style={styles.consensusSpread}>{gameData.spread.home}</Text>
                <Text style={styles.consensusCount}>{homePicks} picks ({consensus.homePercentage}%)</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{homePicks}</Text>
            <Text style={styles.statLabel}>{gameData.homeTeamShort}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{awayPicks}</Text>
            <Text style={styles.statLabel}>{gameData.awayTeamShort}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingPicks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Friends' Picks */}
        <Text style={styles.sectionTitle}>Community Picks</Text>
        
        {friendPicks.length > 0 ? (
          friendPicks.map(friend => (
            <View key={friend.id} style={styles.pickCard}>
              <View style={styles.pickHeader}>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{friend.username}</Text>
                  <View style={styles.winRateBadge}>
                    <Text style={styles.winRateText}>{friend.winRate}% wins</Text>
                  </View>
                </View>
                <View style={styles.pickInfo}>
                  <View style={[styles.confidenceBadge, { backgroundColor: friend.confidenceColor }]}>
                    <Text style={styles.confidenceText}>
                      {friend.confidence}
                    </Text>
                  </View>
                </View>
              </View>
              
              <View style={styles.pickContent}>
                <Text style={styles.pickChoice}>{getPickDisplay(friend.pick)}</Text>
                {friend.reasoning && (
                  <Text style={styles.reasoning}>"{friend.reasoning}"</Text>
                )}
              </View>
            </View>
          ))
        ) : (
          <View style={styles.noPicksCard}>
            <Text style={styles.noPicksText}>No picks yet for this game</Text>
            <Text style={styles.noPicksSubtext}>Be the first to make a prediction!</Text>
          </View>
        )}

        {/* Your Pick Reminder */}
        {!gameData.locked && (
          <TouchableOpacity 
            style={styles.makePickButton}
            onPress={() => router.push('/(tabs)/games')}
          >
            <Text style={styles.makePickButtonText}>
              Haven't made your pick? Tap here
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#FFF',
    fontSize: 32,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerSubtitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerTime: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    width: 48,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  gameTime: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  lockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  lockIcon: {
    marginRight: 6,
    fontSize: 14,
  },
  lockText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  consensusCard: {
    marginBottom: 20,
  },
  consensusTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  consensusBoxes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  consensusBox: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  consensusBoxActive: {
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  consensusTeamName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  consensusSpread: {
    color: '#FF6B35',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  consensusCount: {
    color: '#8E8E93',
    fontSize: 12,
  },
  vsText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  statNumber: {
    color: '#FF6B35',
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  pickCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: {
    flex: 1,
  },
  username: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  winRateBadge: {
    backgroundColor: 'rgba(52, 199, 89, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  winRateText: {
    color: '#34C759',
    fontSize: 11,
    fontWeight: '600',
  },
  pickInfo: {
    alignItems: 'flex-end',
  },
  pickContent: {
    marginTop: 8,
  },
  pickChoice: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
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
  reasoning: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  noPicksCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    marginBottom: 20,
  },
  noPicksText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  noPicksSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  makePickButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  makePickButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});