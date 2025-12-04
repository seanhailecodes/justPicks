import { useEffect, useState } from 'react';
import { 
  ActivityIndicator, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View 
} from 'react-native';
import { 
  getTopPerformersGlobally, 
  getGroupLeaderboard, 
  getTimeframeLabelSync,
  getSportConfig,
  LeaderboardUser,
  Sport 
} from '../services/pickrating';
import { supabase } from '../app/lib/supabase';

interface GroupRatingsProps {
  mode: 'global' | 'group';
  userId: string;
  groupId?: string;
  groupName?: string;
  sport?: Sport;
}

export default function GroupRatingsLeaderboard({ 
  mode, 
  userId, 
  groupId = '163b5d2c-fb32-4b34-8ed0-4d39fa9a3a9b', 
  groupName = 'The Syndicate',
  sport = 'nfl'
}: GroupRatingsProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'season' | 'allTime'>('week');
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentWeek, setCurrentWeek] = useState<number | null>(null);

  // Get sport config for dynamic labels
  const sportConfig = getSportConfig(sport);

  // Fetch current week for week-based sports
  useEffect(() => {
    if (sportConfig.scheduleModel === 'week' && sportConfig.appStateKey) {
      const fetchCurrentWeek = async () => {
        const { data } = await supabase
          .from('app_state')
          .select(sportConfig.appStateKey!)
          .single();
        
        if (data?.[sportConfig.appStateKey!]) {
          setCurrentWeek(data[sportConfig.appStateKey!]);
        }
      };
      fetchCurrentWeek();
    }
  }, [sport, sportConfig]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      console.log('Fetching leaderboard - Mode:', mode, 'UserId:', userId, 'Timeframe:', selectedTimeframe, 'Sport:', sport);
      
      if (!userId) {
        console.log('No userId, returning early');
        setLoading(false);
        return;
      }

      setLoading(true);
      let data: LeaderboardUser[] = [];

      try {
        if (mode === 'global') {
          console.log('Fetching global leaderboard...');
          data = await getTopPerformersGlobally(userId, selectedTimeframe, sport);
          console.log('Global data received:', data);
        } else {
          console.log('Fetching group leaderboard for group:', groupId);
          data = await getGroupLeaderboard(groupId, selectedTimeframe, sport);
          console.log('Group data received:', data);
        }

        setLeaderboardData(data);
      } catch (error) {
        console.error('Error fetching leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [mode, selectedTimeframe, userId, groupId, sport]);

  const getRatingColor = (rating: number) => {
    if (rating >= 80) return '#4CAF50';
    if (rating >= 60) return '#2196F3';
    if (rating >= 40) return '#FF9800';
    return '#F44336';
  };

  const getWinRateColor = (winRate: number) => {
    if (winRate >= 60) return '#4CAF50';
    if (winRate >= 50) return '#2196F3';
    if (winRate >= 40) return '#FF9800';
    return '#F44336';
  };

  // Get dynamic tab labels based on sport
  const getTabLabel = (timeframe: 'week' | 'month' | 'season' | 'allTime'): string => {
    if (sportConfig.scheduleModel === 'week') {
      const lastCompletedWeek = currentWeek ? Math.max(1, currentWeek - 1) : null;
      
      switch (timeframe) {
        case 'week':
          return lastCompletedWeek ? `${sportConfig.weekLabel} ${lastCompletedWeek}` : sportConfig.weekLabel;
        case 'month':
          return `4 ${sportConfig.weekLabel}s`;
        case 'season':
          return 'Season';
        case 'allTime':
          return 'All Time';
        default:
          return 'Week';
      }
    } else if (sportConfig.scheduleModel === 'event') {
      switch (timeframe) {
        case 'week':
          return `Last ${sportConfig.weekLabel}`;
        case 'month':
          return `4 ${sportConfig.weekLabel}s`;
        case 'season':
          return 'Season';
        case 'allTime':
          return 'All Time';
        default:
          return 'Event';
      }
    } else {
      switch (timeframe) {
        case 'week':
          return '7 Days';
        case 'month':
          return '30 Days';
        case 'season':
          return 'Season';
        case 'allTime':
          return 'All Time';
        default:
          return '7 Days';
      }
    }
  };

  const modeTitle = mode === 'global' ? 'Top Performers' : groupName;

  return (
    <View style={styles.container}>
      {/* Group Name Row with Sport Badge */}
      <View style={styles.groupHeader}>
        <Text style={styles.groupName}>{modeTitle}</Text>
        <View style={styles.sportBadge}>
          <Text style={styles.sportBadgeText}>{sportConfig.shortName}</Text>
        </View>
      </View>

      {mode === 'global' && (
        <View style={styles.infoBar}>
          <Text style={styles.infoText}>Top 5 performers • Real names shown for friends & group members</Text>
        </View>
      )}

      {/* Timeframe Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTimeframe === 'week' && styles.tabActive]}
          onPress={() => setSelectedTimeframe('week')}
        >
          <Text style={[styles.tabText, selectedTimeframe === 'week' && styles.tabTextActive]}>
            {getTabLabel('week')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTimeframe === 'month' && styles.tabActive]}
          onPress={() => setSelectedTimeframe('month')}
        >
          <Text style={[styles.tabText, selectedTimeframe === 'month' && styles.tabTextActive]}>
            {getTabLabel('month')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTimeframe === 'season' && styles.tabActive]}
          onPress={() => setSelectedTimeframe('season')}
        >
          <Text style={[styles.tabText, selectedTimeframe === 'season' && styles.tabTextActive]}>
            {getTabLabel('season')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, selectedTimeframe === 'allTime' && styles.tabActive]}
          onPress={() => setSelectedTimeframe('allTime')}
        >
          <Text style={[styles.tabText, selectedTimeframe === 'allTime' && styles.tabTextActive]}>
            {getTabLabel('allTime')}
          </Text>
        </TouchableOpacity>
      </View>

      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading ratings...</Text>
        </View>
      )}

      {!loading && (
        <ScrollView 
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {leaderboardData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No ratings data available</Text>
              <Text style={styles.emptySubtext}>Make some picks to see the leaderboard!</Text>
            </View>
          ) : (
            leaderboardData.map((user) => {
              const ratingColor = getRatingColor(user.rating);
              const winRateColor = getWinRateColor(user.winRate);

              return (
                <View key={user.userId} style={styles.memberCard}>
                  <View style={styles.rankSection}>
                    <Text style={[styles.rankNumber, { color: user.rank === 1 ? '#FFD700' : '#FF6B35' }]}>
                      #{user.rank}
                    </Text>
                    <View style={styles.nameSection}>
                      <View style={styles.nameRow}>
                        <Text style={styles.memberName}>{user.displayName}</Text>
                        {user.isAnonymized && (
                          <View style={styles.anonBadge}>
                            <Text style={styles.anonBadgeText}>Anon</Text>
                          </View>
                        )}
                      </View>
                      {user.lastPickDate && (
                        <Text style={styles.lastPick}>
                          Last pick: {new Date(user.lastPickDate).toLocaleDateString()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.ratingSection}>
                      <Text style={[styles.ratingScore, { color: ratingColor }]}>
                        {user.rating}
                      </Text>
                      <Text style={styles.ratingLabel}>Rating</Text>
                    </View>
                  </View>

                  {/* Performance Stats Row */}
                  <View style={styles.performanceRow}>
                    <View style={styles.stat}>
                      <Text style={styles.statValue}>{user.totalPicks}</Text>
                      <Text style={styles.statLabel}>Picks</Text>
                    </View>
                    
                    <View style={styles.stat}>
                      <View style={styles.correctIncorrectContainer}>
                        <Text style={styles.correctText}>{user.correctPicks}✓</Text>
                        <Text style={styles.incorrectText}>{user.incorrectPicks}✗</Text>
                      </View>
                      <Text style={styles.statLabel}>W-L</Text>
                    </View>

                    <View style={styles.stat}>
                      <Text style={[styles.statValue, { color: winRateColor, fontWeight: 'bold' }]}>
                        {user.winRate}%
                      </Text>
                      <Text style={styles.statLabel}>Win Rate</Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {/* Summary Stats */}
          {leaderboardData.length > 0 && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>
                {mode === 'global' ? 'Top 5' : 'Group'} Stats ({getTimeframeLabelSync(selectedTimeframe, sport, currentWeek || undefined)})
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round(
                      leaderboardData.reduce((sum, u) => sum + u.rating, 0) / 
                      leaderboardData.length
                    )}
                  </Text>
                  <Text style={styles.summaryLabel}>Avg Rating</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {leaderboardData.reduce((sum, u) => sum + u.totalPicks, 0)}
                  </Text>
                  <Text style={styles.summaryLabel}>Total Picks</Text>
                </View>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {Math.round(
                      leaderboardData.reduce((sum, u) => sum + u.winRate, 0) / 
                      leaderboardData.length
                    )}%
                  </Text>
                  <Text style={styles.summaryLabel}>Avg Win%</Text>
                </View>
              </View>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  groupName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  sportBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sportBadgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  infoBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#1C1C1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoText: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 12,
    paddingBottom: 100,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 12,
    fontSize: 14,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8,
  },
  memberCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rankSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  rankNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    width: 35,
  },
  nameSection: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lastPick: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  anonBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  anonBadgeText: {
    color: '#FF9500',
    fontSize: 10,
    fontWeight: '600',
  },
  ratingSection: {
    alignItems: 'center',
  },
  ratingScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  ratingLabel: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
  },
  correctIncorrectContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  correctText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  incorrectText: {
    color: '#F44336',
    fontSize: 16,
    fontWeight: 'bold',
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderTopWidth: 2,
    borderTopColor: '#FF6B35',
  },
  summaryTitle: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
  },
});