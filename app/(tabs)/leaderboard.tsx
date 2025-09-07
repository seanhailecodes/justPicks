import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LeaderboardScreen() {
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'all'
  const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' or specific group
  const [leaderboardData, setLeaderboardData] = useState({
    week: [],
    month: [],
    all: []
  });
  const [currentUserId, setCurrentUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboardData();
  }, [timeframe, selectedGroup]);

  const fetchLeaderboardData = async () => {
    setLoading(true);
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }

    // Build date filter based on timeframe
    let dateFilter = new Date();
    if (timeframe === 'week') {
      dateFilter.setDate(dateFilter.getDate() - 7);
    } else if (timeframe === 'month') {
      dateFilter.setMonth(dateFilter.getMonth() - 1);
    } else {
      dateFilter = null; // All time
    }

    // Fetch all picks
    let query = supabase
      .from('picks')
      .select('user_id, correct, created_at');
    
    if (dateFilter) {
      query = query.gte('created_at', dateFilter.toISOString());
    }

    if (selectedGroup !== 'all') {
      // Add group filter if needed
      // query = query.contains('groups', [selectedGroup]);
    }

    const { data: picks, error } = await query;

    if (error) {
      console.error('Error fetching picks:', error);
      setLoading(false);
      return;
    }

    // Process picks by user
    const userStats = {};
    picks?.forEach(pick => {
      if (!userStats[pick.user_id]) {
        userStats[pick.user_id] = {
          userId: pick.user_id,
          correct: 0,
          wrong: 0,
          pending: 0,
          total: 0,
          streak: 0
        };
      }
      
      userStats[pick.user_id].total++;
      if (pick.correct === true) {
        userStats[pick.user_id].correct++;
      } else if (pick.correct === false) {
        userStats[pick.user_id].wrong++;
      } else {
        userStats[pick.user_id].pending++;
      }
    });

    // Fetch user emails from auth.users
    const userIds = Object.keys(userStats);
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    // If admin API doesn't work, fetch from a view or use current user's email
    let userEmails = {};
    if (usersError || !users) {
      // For current user, we already have their email
      if (user) {
        userEmails[user.id] = user.email;
      }
      // For others, we'll show "Player" for now
    } else {
      users.forEach(u => {
        userEmails[u.id] = u.email;
      });
    }

    // Calculate rankings and format data
    const leaderboard = Object.values(userStats).map(stats => {
      const completed = stats.correct + stats.wrong;
      const accuracy = completed > 0 ? Math.round((stats.correct / completed) * 100) : 0;
      
      // Extract name from email or use default
      let displayName = 'Player';
      const email = userEmails[stats.userId];
      if (email) {
        displayName = email.split('@')[0];
        displayName = displayName.charAt(0).toUpperCase() + displayName.slice(1);
      }
      
      return {
        userId: stats.userId,
        name: displayName,
        accuracy: accuracy,
        wins: stats.correct,
        total: completed,
        pending: stats.pending,
        streak: 0, // You'd need to calculate this from consecutive wins
        tier: getTier(accuracy),
        isYou: stats.userId === user?.id
      };
    });

    // Sort by accuracy and assign ranks
    leaderboard.sort((a, b) => {
      // Sort by accuracy first, then by total picks as tiebreaker
      if (b.accuracy === a.accuracy) {
        return b.total - a.total;
      }
      return b.accuracy - a.accuracy;
    });
    
    leaderboard.forEach((player, index) => {
      player.rank = index + 1;
    });

    // Update state for current timeframe
    setLeaderboardData(prev => ({
      ...prev,
      [timeframe]: leaderboard
    }));
    
    setLoading(false);
  };

  const getTier = (accuracy) => {
    if (accuracy >= 80) return 'Diamond';
    if (accuracy >= 70) return 'Gold';
    if (accuracy >= 60) return 'Silver';
    return 'Bronze';
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'Diamond': return '#00D4FF';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return '#8E8E93';
    }
  };

  const getRankEmoji = (rank) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

  const groups = ['All Friends', 'Work Friends', 'Family Picks', 'College Buddies'];
  const currentData = leaderboardData[timeframe] || [];
  const yourStats = currentData.find(p => p.isYou);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>

      {/* Group Filter */}
      <ScrollView 
        horizontal 
        style={styles.groupFilter}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.groupFilterContent}
      >
        {groups.map((group, index) => (
          <TouchableOpacity
            key={group}
            style={[
              styles.groupChip,
              selectedGroup === (index === 0 ? 'all' : group) && styles.groupChipActive
            ]}
            onPress={() => setSelectedGroup(index === 0 ? 'all' : group)}
          >
            <Text style={[
              styles.groupChipText,
              selectedGroup === (index === 0 ? 'all' : group) && styles.groupChipTextActive
            ]}>
              {group}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Timeframe Selector */}
      <View style={styles.timeframeContainer}>
        {['week', 'month', 'all'].map(period => (
          <TouchableOpacity
            key={period}
            style={[styles.timeframeButton, timeframe === period && styles.timeframeButtonActive]}
            onPress={() => setTimeframe(period)}
          >
            <Text style={[styles.timeframeText, timeframe === period && styles.timeframeTextActive]}>
              {period === 'week' ? 'This Week' : period === 'month' ? 'This Month' : 'All Time'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading rankings...</Text>
          </View>
        ) : (
          <>
            {/* Your Stats Card */}
            {yourStats && (
              <View style={styles.yourStatsCard}>
                <Text style={styles.yourStatsTitle}>Your Performance</Text>
                <View style={styles.yourStatsRow}>
                  <View style={styles.yourStatItem}>
                    <Text style={styles.yourStatValue}>#{yourStats.rank}</Text>
                    <Text style={styles.yourStatLabel}>Rank</Text>
                  </View>
                  <View style={styles.yourStatItem}>
                    <Text style={styles.yourStatValue}>{yourStats.accuracy}%</Text>
                    <Text style={styles.yourStatLabel}>Accuracy</Text>
                  </View>
                  <View style={styles.yourStatItem}>
                    <Text style={styles.yourStatValue}>{yourStats.streak} 🔥</Text>
                    <Text style={styles.yourStatLabel}>Streak</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Leaderboard List */}
            {currentData.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No picks yet for this period</Text>
              </View>
            ) : (
              currentData.map((player, index) => (
                <TouchableOpacity 
                  key={`${player.userId}-${index}`} 
                  style={[styles.playerCard, player.isYou && styles.playerCardYou]}
                >
                  <View style={styles.rankContainer}>
                    {player.rank <= 3 ? (
                      <Text style={styles.rankEmoji}>{getRankEmoji(player.rank)}</Text>
                    ) : (
                      <Text style={styles.rankNumber}>#{player.rank}</Text>
                    )}
                  </View>

                  <View style={styles.playerInfo}>
                    <View style={styles.playerHeader}>
                      <Text style={[styles.playerName, player.isYou && styles.playerNameYou]}>
                        {player.isYou ? 'You' : player.name}
                      </Text>
                      <View style={[styles.tierBadge, { backgroundColor: getTierColor(player.tier) }]}>
                        <Text style={styles.tierText}>{player.tier}</Text>
                      </View>
                    </View>
                    <Text style={styles.playerStats}>
                      {player.wins}/{player.total} picks ({player.accuracy}%)
                    </Text>
                  </View>

                  <View style={styles.streakContainer}>
                    {player.streak > 0 && (
                      <>
                        <Text style={styles.streakNumber}>{player.streak}</Text>
                        <Text style={styles.streakEmoji}>🔥</Text>
                      </>
                    )}
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Stats Summary */}
            {currentData.length > 0 && (
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Group Average</Text>
                <View style={styles.summaryStats}>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {Math.round(currentData.reduce((acc, p) => acc + p.accuracy, 0) / currentData.length) || 0}%
                    </Text>
                    <Text style={styles.summaryLabel}>Avg Accuracy</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={styles.summaryValue}>
                      {currentData.reduce((acc, p) => acc + p.total, 0)}
                    </Text>
                    <Text style={styles.summaryLabel}>Total Picks</Text>
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
  header: {
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  groupFilter: {
    maxHeight: 50,
    marginTop: 16,
  },
  groupFilterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  groupChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  groupChipActive: {
    backgroundColor: '#FF6B35',
  },
  groupChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  groupChipTextActive: {
    color: '#FFF',
  },
  timeframeContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  timeframeButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
  },
  timeframeButtonActive: {
    backgroundColor: '#FF6B35',
  },
  timeframeText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  timeframeTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  yourStatsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  yourStatsTitle: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
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
    fontSize: 24,
    fontWeight: 'bold',
  },
  yourStatLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  playerCardYou: {
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankEmoji: {
    fontSize: 24,
  },
  rankNumber: {
    color: '#8E8E93',
    fontSize: 18,
    fontWeight: 'bold',
  },
  playerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  playerName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
  playerNameYou: {
    color: '#FF6B35',
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tierText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  playerStats: {
    color: '#8E8E93',
    fontSize: 14,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakNumber: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 4,
  },
  streakEmoji: {
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  summaryTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FF6B35',
    fontSize: 20,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
});