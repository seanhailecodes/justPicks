import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function LeaderboardScreen() {
  const [timeframe, setTimeframe] = useState('week'); // 'week', 'month', 'all'
  const [selectedGroup, setSelectedGroup] = useState('all'); // 'all' or specific group

  const leaderboardData = {
    week: [
      { rank: 1, name: 'Mike', accuracy: 85, wins: 17, total: 20, streak: 5, tier: 'Gold', isYou: false },
      { rank: 2, name: 'You', accuracy: 80, wins: 16, total: 20, streak: 3, tier: 'Diamond', isYou: true },
      { rank: 3, name: 'Sarah', accuracy: 75, wins: 15, total: 20, streak: 2, tier: 'Silver', isYou: false },
      { rank: 4, name: 'John', accuracy: 70, wins: 14, total: 20, streak: 0, tier: 'Silver', isYou: false },
      { rank: 5, name: 'Tom', accuracy: 65, wins: 13, total: 20, streak: 1, tier: 'Bronze', isYou: false },
    ],
    month: [
      { rank: 1, name: 'Sarah', accuracy: 78, wins: 62, total: 80, streak: 8, tier: 'Gold', isYou: false },
      { rank: 2, name: 'Mike', accuracy: 76, wins: 61, total: 80, streak: 5, tier: 'Gold', isYou: false },
      { rank: 3, name: 'You', accuracy: 73, wins: 58, total: 80, streak: 3, tier: 'Diamond', isYou: true },
      { rank: 4, name: 'Dad', accuracy: 68, wins: 54, total: 80, streak: 2, tier: 'Silver', isYou: false },
      { rank: 5, name: 'John', accuracy: 65, wins: 52, total: 80, streak: 0, tier: 'Silver', isYou: false },
    ],
    all: [
      { rank: 1, name: 'You', accuracy: 73, wins: 131, total: 180, streak: 3, tier: 'Diamond', isYou: true },
      { rank: 2, name: 'Mike', accuracy: 71, wins: 128, total: 180, streak: 5, tier: 'Gold', isYou: false },
      { rank: 3, name: 'Sarah', accuracy: 69, wins: 124, total: 180, streak: 8, tier: 'Gold', isYou: false },
      { rank: 4, name: 'Tom', accuracy: 66, wins: 119, total: 180, streak: 1, tier: 'Silver', isYou: false },
      { rank: 5, name: 'John', accuracy: 64, wins: 115, total: 180, streak: 0, tier: 'Silver', isYou: false },
    ],
  };

  const groups = ['All Friends', 'Work Friends', 'Family Picks', 'College Buddies'];

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return '#00D4FF';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return '#8E8E93';
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return '';
    }
  };

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
        {/* Your Stats Card */}
        {leaderboardData[timeframe].find(p => p.isYou) && (
          <View style={styles.yourStatsCard}>
            <Text style={styles.yourStatsTitle}>Your Performance</Text>
            <View style={styles.yourStatsRow}>
              <View style={styles.yourStatItem}>
                <Text style={styles.yourStatValue}>#{leaderboardData[timeframe].find(p => p.isYou)?.rank}</Text>
                <Text style={styles.yourStatLabel}>Rank</Text>
              </View>
              <View style={styles.yourStatItem}>
                <Text style={styles.yourStatValue}>{leaderboardData[timeframe].find(p => p.isYou)?.accuracy}%</Text>
                <Text style={styles.yourStatLabel}>Accuracy</Text>
              </View>
              <View style={styles.yourStatItem}>
                <Text style={styles.yourStatValue}>{leaderboardData[timeframe].find(p => p.isYou)?.streak} 🔥</Text>
                <Text style={styles.yourStatLabel}>Streak</Text>
              </View>
            </View>
          </View>
        )}

        {/* Leaderboard List */}
        {leaderboardData[timeframe].map((player, index) => (
          <TouchableOpacity 
            key={index} 
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
                  {player.name}
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
        ))}

        {/* Stats Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Group Average</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>68%</Text>
              <Text style={styles.summaryLabel}>Avg Accuracy</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>342</Text>
              <Text style={styles.summaryLabel}>Total Picks</Text>
            </View>
          </View>
        </View>
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