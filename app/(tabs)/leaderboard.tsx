import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../lib/supabase';

const SPORTS = [
  { id: 'nfl', label: '🏈 NFL', league: 'NFL' },
  { id: 'nba', label: '🏀 NBA', league: 'NBA' },
  { id: 'ncaaf', label: '🏈 NCAAF', league: 'NCAAF', disabled: true },
  { id: 'ncaab', label: '🏀 NCAAB', league: 'NCAAB', disabled: true },
];

const TIME_PERIODS = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'season', label: 'Season' },
  { key: 'all', label: 'All Time' }
];

interface LeaderboardPlayer {
  userId: string;
  name: string;
  accuracy: number;
  wins: number;
  losses: number;
  total: number;
  rank: number;
  isYou: boolean;
}

interface UserGroup {
  id: string;
  name: string;
}

export default function LeaderboardScreen() {
  const router = useRouter();
  const [selectedSport, setSelectedSport] = useState(SPORTS[0]);
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'season' | 'all'>('week');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardPlayer[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserGroups();
  }, [selectedSport]);

  useEffect(() => {
    fetchLeaderboardData();
  }, [selectedSport, timeframe, selectedGroupId]);

  const loadUserGroups = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setCurrentUserId(user.id);

    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(id, name, sport)')
      .eq('user_id', user.id);

    const groups: UserGroup[] = [];
    memberships?.forEach(m => {
      const group = m.groups as any;
      if (group && (group.sport === selectedSport.id || !group.sport)) {
        groups.push({ id: group.id, name: group.name });
      }
    });

    setUserGroups(groups);
    setSelectedGroupId(null);
  };

  const fetchLeaderboardData = async () => {
    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) setCurrentUserId(user.id);

    // Build games query with time filter FIRST
    let gamesQuery = supabase
      .from('games')
      .select('id')
      .eq('league', selectedSport.league);

    const now = new Date();

    // Apply time filter to games based on game_date
    if (timeframe === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      gamesQuery = gamesQuery.gte('game_date', weekAgo.toISOString());
    } else if (timeframe === 'month') {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      gamesQuery = gamesQuery.gte('game_date', monthAgo.toISOString());
    } else if (timeframe === 'season') {
      gamesQuery = gamesQuery.eq('season', 2025);
    }
    // 'all' time has no filter

    const { data: games } = await gamesQuery;
    const gameIds = games?.map(g => g.id) || [];

    if (gameIds.length === 0) {
      setLeaderboardData([]);
      setLoading(false);
      return;
    }

    // Get picks for those filtered games
    let picksQuery = supabase
      .from('picks')
      .select('user_id, correct, created_at')
      .in('game_id', gameIds)
      .not('correct', 'is', null);

    if (selectedGroupId) {
      const { data: members } = await supabase
        .from('group_members')
        .select('user_id')
        .eq('group_id', selectedGroupId);

      const groupMemberIds = members?.map(m => m.user_id) || [];
      if (groupMemberIds.length > 0) {
        picksQuery = picksQuery.in('user_id', groupMemberIds);
      }
    }

    const { data: picks, error } = await picksQuery;

    if (error) {
      console.error('Error fetching picks:', error);
      setLoading(false);
      return;
    }

    const userStats: Record<string, { wins: number; losses: number }> = {};

    picks?.forEach(pick => {
      if (!userStats[pick.user_id]) {
        userStats[pick.user_id] = { wins: 0, losses: 0 };
      }
      if (pick.correct === true) {
        userStats[pick.user_id].wins++;
      } else if (pick.correct === false) {
        userStats[pick.user_id].losses++;
      }
    });

    const userIds = Object.keys(userStats);
    let profileMap: Record<string, string> = {};

    if (userIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, username')
        .in('id', userIds);

      profiles?.forEach(p => {
        profileMap[p.id] = p.display_name || p.username || 'Player';
      });
    }

    const leaderboard: LeaderboardPlayer[] = Object.entries(userStats).map(([userId, stats]) => {
      const total = stats.wins + stats.losses;
      const accuracy = total > 0 ? Math.round((stats.wins / total) * 100) : 0;

      return {
        userId,
        name: profileMap[userId] || 'Player',
        accuracy,
        wins: stats.wins,
        losses: stats.losses,
        total,
        rank: 0,
        isYou: userId === user?.id
      };
    });

    leaderboard.sort((a, b) => {
      if (b.accuracy === a.accuracy) return b.wins - a.wins;
      return b.accuracy - a.accuracy;
    });

    leaderboard.forEach((player, index) => {
      player.rank = index + 1;
    });

    setLeaderboardData(leaderboard);
    setLoading(false);
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 70) return '#34C759';
    if (accuracy >= 55) return '#FF9500';
    return '#FF3B30';
  };

  const yourStats = leaderboardData.find(p => p.isYou);

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Leaderboard</Text>

      {/* Sport Tabs */}
      <View style={styles.filterSection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipContainer}>
            {SPORTS.map(sport => (
              <TouchableOpacity
                key={sport.id}
                style={[
                  styles.chip,
                  selectedSport.id === sport.id && styles.chipActive,
                  sport.disabled && styles.chipDisabled
                ]}
                onPress={() => !sport.disabled && setSelectedSport(sport)}
                disabled={sport.disabled}
              >
                <Text style={[
                  styles.chipText,
                  selectedSport.id === sport.id && styles.chipTextActive,
                  sport.disabled && styles.chipTextDisabled
                ]}>
                  {sport.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Group Filter - only show if user has groups */}
      {userGroups.length > 0 && (
        <View style={styles.filterSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.chipContainer}>
              <TouchableOpacity
                style={[styles.chip, !selectedGroupId && styles.chipActive]}
                onPress={() => setSelectedGroupId(null)}
              >
                <Text style={[styles.chipText, !selectedGroupId && styles.chipTextActive]}>
                  Everyone
                </Text>
              </TouchableOpacity>

              {userGroups.map(group => (
                <TouchableOpacity
                  key={group.id}
                  style={[styles.chip, selectedGroupId === group.id && styles.chipActive]}
                  onPress={() => setSelectedGroupId(group.id)}
                >
                  <Text style={[styles.chipText, selectedGroupId === group.id && styles.chipTextActive]}>
                    {group.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>
      )}

      {/* Time Period */}
      <View style={styles.timeRow}>
        {TIME_PERIODS.map(period => (
          <TouchableOpacity
            key={period.key}
            style={[styles.timeChip, timeframe === period.key && styles.timeChipActive]}
            onPress={() => setTimeframe(period.key as any)}
          >
            <Text style={[styles.timeChipText, timeframe === period.key && styles.timeChipTextActive]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.centered}>
            <Text style={styles.mutedText}>Loading rankings...</Text>
          </View>
        ) : (
          <>
            {yourStats && (
              <View style={styles.yourStatsCard}>
                <View style={styles.yourStatsRow}>
                  <View style={styles.yourStatItem}>
                    <Text style={styles.yourStatValue}>{getRankDisplay(yourStats.rank)}</Text>
                    <Text style={styles.yourStatLabel}>Rank</Text>
                  </View>
                  <View style={styles.yourStatItem}>
                    <Text style={[styles.yourStatValue, { color: getAccuracyColor(yourStats.accuracy) }]}>
                      {yourStats.accuracy}%
                    </Text>
                    <Text style={styles.yourStatLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.yourStatItem}>
                    <Text style={styles.yourStatValue}>{yourStats.wins}-{yourStats.losses}</Text>
                    <Text style={styles.yourStatLabel}>Record</Text>
                  </View>
                </View>
              </View>
            )}

            {leaderboardData.length === 0 ? (
              <View style={styles.centered}>
                <Text style={styles.emptyText}>No picks yet for this period</Text>
                <Text style={styles.mutedText}>
                  Make some {selectedSport.league} picks to appear here!
                </Text>
                <TouchableOpacity 
                  style={styles.makePicksButton}
                  onPress={() => router.push('/(tabs)/games')}
                >
                  <Text style={styles.makePicksText}>Make Picks</Text>
                </TouchableOpacity>
              </View>
            ) : (
              leaderboardData.map((player) => (
                <View
                  key={player.userId}
                  style={[styles.playerCard, player.isYou && styles.playerCardYou]}
                >
                  <Text style={[styles.rank, player.rank <= 3 && styles.rankTop]}>
                    {getRankDisplay(player.rank)}
                  </Text>
                  <View style={styles.playerInfo}>
                    <Text style={[styles.playerName, player.isYou && styles.playerNameYou]}>
                      {player.isYou ? 'You' : player.name}
                    </Text>
                    <Text style={styles.playerRecord}>{player.wins}-{player.losses}</Text>
                  </View>
                  <Text style={[styles.accuracy, { color: getAccuracyColor(player.accuracy) }]}>
                    {player.accuracy}%
                  </Text>
                </View>
              ))
            )}

            {leaderboardData.length > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>{leaderboardData.length}</Text>
                    <Text style={styles.summaryLabel}>Players</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {leaderboardData.reduce((acc, p) => acc + p.total, 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Picks</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {Math.round(leaderboardData.reduce((acc, p) => acc + p.accuracy, 0) / leaderboardData.length) || 0}%
                    </Text>
                    <Text style={styles.summaryLabel}>Avg</Text>
                  </View>
                </View>
              </View>
            )}
          </>
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
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterSection: {
    height: 44,
    marginBottom: 4,
  },
  chipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  chip: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    marginRight: 8,
  },
  chipActive: {
    backgroundColor: '#FF6B35',
  },
  chipDisabled: {
    opacity: 0.4,
  },
  chipText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  chipTextActive: {
    color: '#FFF',
  },
  chipTextDisabled: {
    color: '#8E8E93',
  },
  timeRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  timeChip: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  timeChipActive: {
    backgroundColor: '#FF6B35',
  },
  timeChipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  timeChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  centered: {
    padding: 40,
    alignItems: 'center',
  },
  mutedText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  makePicksButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  makePicksText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  yourStatsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  yourStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  yourStatItem: {
    alignItems: 'center',
  },
  yourStatValue: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  yourStatLabel: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 14,
    marginBottom: 8,
  },
  playerCardYou: {
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  rank: {
    width: 40,
    color: '#8E8E93',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  rankTop: {
    fontSize: 22,
  },
  playerInfo: {
    flex: 1,
    marginLeft: 8,
  },
  playerName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  playerNameYou: {
    color: '#FF6B35',
  },
  playerRecord: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  accuracy: {
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 14,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
});