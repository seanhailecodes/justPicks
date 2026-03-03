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
  const [userPickId, setUserPickId] = useState<string | null>(null);
  const [userPickTeam, setUserPickTeam] = useState<string | null>(null);
  const [removingPick, setRemovingPick] = useState(false);

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

      // Parse game_date as UTC (normalize to ensure Z suffix)
      const rawDate = gameData.game_date as string;
      const normalized = rawDate.includes('T') ? rawDate : rawDate.replace(' ', 'T');
      const hasTimezone = normalized.endsWith('Z') || /[+-]\d{2}:?\d{2}$/.test(normalized);
      const gameDateUTC = new Date(hasTimezone ? normalized : normalized + 'Z');

      // Format date with Today/Tomorrow labels
      const formatDate = (d: Date): string => {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
        return d.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });
      };

      // Calculate real timeToLock
      const calcTimeToLock = (d: Date): string => {
        const diffMs = d.getTime() - Date.now();
        if (diffMs <= 0) return 'LOCKED';
        const diffMin = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMin / 60);
        const diffDays = Math.floor(diffHrs / 24);
        if (diffDays > 0) return `${diffDays}d ${diffHrs % 24}h`;
        if (diffHrs > 0) return `${diffHrs}h ${diffMin % 60}m`;
        return `${diffMin}m`;
      };

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
        time: gameDateUTC.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
        date: formatDate(gameDateUTC),
        locked: gameData.locked || false,
        timeToLock: calcTimeToLock(gameDateUTC),
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

      // Store the current user's pick ID and team for remove functionality
      const myPick = picksData?.find(p => p.user_id === currentUser.id);
      setUserPickId(myPick ? myPick.id.toString() : null);
      setUserPickTeam(myPick ? myPick.team_picked : null);

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

  const removePick = async () => {
    if (!userPickId) return;
    setRemovingPick(true);
    try {
      const { error } = await supabase
        .from('picks')
        .delete()
        .eq('id', userPickId);
      if (error) throw error;
      setUserPickId(null);
      setUserPickTeam(null);
      // Remove from community list too
      setFriendPicks(prev => prev.filter(p => p.id !== userPickId));
    } catch (e) {
      console.error('Error removing pick:', e);
    } finally {
      setRemovingPick(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/games');
    }
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

  const pickedTeamName = userPickTeam === 'home' ? gameData.homeTeam : gameData.awayTeam;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
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
        {/* Game Status Card */}
        <View style={styles.gameCard}>
          {gameData.locked ? (
            <View style={styles.lockedBanner}>
              <Text style={styles.lockedIcon}>🔒</Text>
              <Text style={styles.lockedText}>Picks are locked</Text>
            </View>
          ) : (
            <View style={styles.lockWarning}>
              <Text style={styles.lockIcon}>🕐</Text>
              <Text style={styles.lockText}>Picks lock in {gameData.timeToLock}</Text>
            </View>
          )}

          {/* Your pick banner */}
          {userPickId ? (
            <View style={styles.myPickBanner}>
              <View style={styles.myPickBannerLeft}>
                <Text style={styles.myPickCheck}>✓</Text>
                <View>
                  <Text style={styles.myPickBannerLabel}>Your pick</Text>
                  <Text style={styles.myPickBannerTeam}>{pickedTeamName}</Text>
                </View>
              </View>
              {!gameData.locked && (
                <TouchableOpacity onPress={removePick} disabled={removingPick} style={styles.removePickButton}>
                  <Text style={styles.removePickText}>{removingPick ? '…' : 'Remove'}</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : null}
        </View>

        {/* Consensus Card */}
        {consensus && (
          <View style={styles.consensusCard}>
            <Text style={styles.consensusTitle}>Community Consensus</Text>

            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarAway, { flex: consensus.awayPercentage }]} />
              <View style={[styles.progressBarHome, { flex: consensus.homePercentage }]} />
            </View>
            <View style={styles.progressLabels}>
              <Text style={styles.progressLabelAway}>{gameData.awayTeamShort} {consensus.awayPercentage}%</Text>
              <Text style={styles.progressLabelHome}>{consensus.homePercentage}% {gameData.homeTeamShort}</Text>
            </View>

            <View style={styles.consensusBoxes}>
              <View style={[styles.consensusBox, consensus.recommendation === 'away' && styles.consensusBoxActive]}>
                <Text style={styles.consensusTeamName}>{gameData.awayTeamShort}</Text>
                <Text style={styles.consensusSpread}>{gameData.spread.away}</Text>
                <Text style={styles.consensusCount}>{awayPicks} picks</Text>
              </View>

              <Text style={styles.vsText}>vs</Text>

              <View style={[styles.consensusBox, consensus.recommendation === 'home' && styles.consensusBoxActive]}>
                <Text style={styles.consensusTeamName}>{gameData.homeTeamShort}</Text>
                <Text style={styles.consensusSpread}>{gameData.spread.home}</Text>
                <Text style={styles.consensusCount}>{homePicks} picks</Text>
              </View>
            </View>
          </View>
        )}

        {/* Community Picks */}
        <Text style={styles.sectionTitle}>Community Picks</Text>

        {friendPicks.length > 0 ? (
          friendPicks.map(friend => (
            <View
              key={friend.id}
              style={[styles.pickCard, friend.username === 'You' && styles.pickCardHighlighted]}
            >
              <View style={styles.pickHeader}>
                <View style={styles.userInfo}>
                  <Text style={[styles.username, friend.username === 'You' && styles.usernameYou]}>
                    {friend.username}
                  </Text>
                </View>
                <View style={[styles.confidenceBadge, { backgroundColor: friend.confidenceColor }]}>
                  <Text style={styles.confidenceText}>{friend.confidence}</Text>
                </View>
              </View>
              <Text style={styles.pickChoice}>{getPickDisplay(friend.pick)}</Text>
              {friend.reasoning && friend.reasoning !== 'No reasoning provided' && (
                <Text style={styles.reasoning}>"{friend.reasoning}"</Text>
              )}
            </View>
          ))
        ) : (
          <View style={styles.noPicksCard}>
            <Text style={styles.noPicksText}>No picks yet</Text>
            <Text style={styles.noPicksSubtext}>Be the first to make a prediction!</Text>
          </View>
        )}

        {/* CTA — only show if no pick and not locked */}
        {!userPickId && !gameData.locked && (
          <TouchableOpacity
            style={styles.makePickButton}
            onPress={() => router.push('/(tabs)/games')}
          >
            <Text style={styles.makePickButtonText}>Haven't made your pick? Tap here</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8E8E93', fontSize: 16 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  backButton: { padding: 8, width: 44 },
  backIcon: { color: '#FF6B35', fontSize: 36, lineHeight: 36 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerSubtitle: { color: '#FFF', fontSize: 17, fontWeight: '700' },
  headerTime: { color: '#8E8E93', fontSize: 13, marginTop: 2 },
  headerRight: { width: 44 },

  // Scroll
  content: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 100 },

  // Game status card
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  lockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  lockedIcon: { fontSize: 16 },
  lockedText: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
  lockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'center',
    gap: 6,
  },
  lockIcon: { fontSize: 14 },
  lockText: { color: '#FF9500', fontSize: 14, fontWeight: '600' },

  // Your pick banner
  myPickBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(52, 199, 89, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52, 199, 89, 0.3)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  myPickBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  myPickCheck: { color: '#34C759', fontSize: 20, fontWeight: '700' },
  myPickBannerLabel: { color: '#8E8E93', fontSize: 11, fontWeight: '500' },
  myPickBannerTeam: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  removePickButton: {
    backgroundColor: 'rgba(255, 59, 48, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removePickText: { color: '#FF3B30', fontSize: 12, fontWeight: '600' },

  // Consensus
  consensusCard: { marginBottom: 20 },
  consensusTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  progressBarContainer: {
    flexDirection: 'row',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
    backgroundColor: '#333',
  },
  progressBarAway: { backgroundColor: '#8E8E93' },
  progressBarHome: { backgroundColor: '#FF6B35' },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  progressLabelAway: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  progressLabelHome: { color: '#FF6B35', fontSize: 12, fontWeight: '600' },
  consensusBoxes: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  consensusBox: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  consensusBoxActive: { borderColor: '#FF6B35' },
  consensusTeamName: { color: '#FFF', fontSize: 13, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  consensusSpread: { color: '#FF6B35', fontSize: 17, fontWeight: '800', marginBottom: 6 },
  consensusCount: { color: '#8E8E93', fontSize: 12 },
  vsText: { color: '#555', fontSize: 13, fontWeight: '600' },

  // Community picks
  sectionTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 12 },
  pickCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pickCardHighlighted: {
    borderColor: 'rgba(255, 107, 53, 0.4)',
    backgroundColor: '#242424',
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userInfo: { flex: 1 },
  username: { color: '#8E8E93', fontSize: 14, fontWeight: '600' },
  usernameYou: { color: '#FF6B35' },
  pickChoice: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 4 },
  confidenceBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  confidenceText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  reasoning: { color: '#666', fontSize: 13, fontStyle: 'italic', marginTop: 4 },

  noPicksCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
  },
  noPicksText: { color: '#FFF', fontSize: 15, fontWeight: '600', marginBottom: 6 },
  noPicksSubtext: { color: '#8E8E93', fontSize: 13 },

  makePickButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  makePickButtonText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});