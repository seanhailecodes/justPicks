import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GameDetailsScreen() {
  const { id } = useLocalSearchParams();

  // Mock game data
  const gameData = {
    homeTeam: 'Giants',
    awayTeam: 'Cowboys',
    time: 'Tonight 8:00 PM',
    status: 'locked', // 'open', 'locked', 'final'
    finalScore: null,
    spread: { home: 'NYG +3.5', away: 'DAL -3.5' },
  };

  // Mock picks data from different groups
  const groupPicks = [
    {
      groupName: 'Work Friends',
      picks: [
        { user: 'Mike', pick: 'away', confidence: 'High', reasoning: 'Cowboys defense stronger', correct: null },
        { user: 'Sarah', pick: 'home', confidence: 'Medium', reasoning: 'Weather favors home team', correct: null },
        { user: 'You', pick: 'home', confidence: 'Medium', reasoning: 'Giants good at home', correct: null },
        { user: 'John', pick: 'home', confidence: 'Low', reasoning: '', correct: null },
        { user: 'Tom', pick: 'away', confidence: 'High', reasoning: 'Cowboys need this win', correct: null },
      ],
    },
    {
      groupName: 'Family Picks',
      picks: [
        { user: 'Dad', pick: 'away', confidence: 'High', reasoning: 'Trust the Cowboys', correct: null },
        { user: 'Mom', pick: 'home', confidence: 'Medium', reasoning: 'Giants due for a win', correct: null },
        { user: 'You', pick: 'home', confidence: 'Medium', reasoning: 'Giants good at home', correct: null },
      ],
    },
  ];

  const getPickStats = (picks: any[]) => {
    const homePicks = picks.filter(p => p.pick === 'home').length;
    const awayPicks = picks.filter(p => p.pick === 'away').length;
    const homePercentage = Math.round((homePicks / picks.length) * 100);
    const awayPercentage = Math.round((awayPicks / picks.length) * 100);
    return { homePicks, awayPicks, homePercentage, awayPercentage };
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return '#34C759';
      case 'Medium': return '#FF9500';
      case 'Low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const handleBack = () => {
    router.push('/(tabs)/games');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.gameTitle}>{gameData.awayTeam} @ {gameData.homeTeam}</Text>
          <Text style={styles.gameTime}>{gameData.time}</Text>
        </View>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Game Status Banner */}
        {gameData.status === 'locked' && (
          <View style={styles.statusBanner}>
            <Text style={styles.statusIcon}>🔒</Text>
            <Text style={styles.statusText}>Picks are locked</Text>
          </View>
        )}

        {/* Overall Stats */}
        <View style={styles.overallStats}>
          <Text style={styles.sectionTitle}>Overall Consensus</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.teamName}>{gameData.awayTeam}</Text>
              <Text style={styles.spreadText}>{gameData.spread.away}</Text>
              <Text style={styles.percentage}>
                {groupPicks.reduce((acc, g) => acc + getPickStats(g.picks).awayPicks, 0)} picks (
                {Math.round((groupPicks.reduce((acc, g) => acc + getPickStats(g.picks).awayPicks, 0) / 
                  groupPicks.reduce((acc, g) => acc + g.picks.length, 0)) * 100)}%)
              </Text>
            </View>
            <View style={styles.vsText}>
              <Text style={styles.vs}>vs</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.teamName}>{gameData.homeTeam}</Text>
              <Text style={styles.spreadText}>{gameData.spread.home}</Text>
              <Text style={styles.percentage}>
                {groupPicks.reduce((acc, g) => acc + getPickStats(g.picks).homePicks, 0)} picks (
                {Math.round((groupPicks.reduce((acc, g) => acc + getPickStats(g.picks).homePicks, 0) / 
                  groupPicks.reduce((acc, g) => acc + g.picks.length, 0)) * 100)}%)
              </Text>
            </View>
          </View>
        </View>

        {/* Group Picks */}
        {groupPicks.map((group, index) => (
          <View key={index} style={styles.groupSection}>
            <Text style={styles.groupTitle}>{group.groupName}</Text>
            <View style={styles.picksGrid}>
              {group.picks.map((pickData, pickIndex) => (
                <View key={pickIndex} style={styles.pickCard}>
                  <View style={styles.pickHeader}>
                    <Text style={styles.userName}>{pickData.user}</Text>
                    <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(pickData.confidence) }]}>
                      <Text style={styles.confidenceText}>{pickData.confidence}</Text>
                    </View>
                  </View>
                  <Text style={styles.pickChoice}>
                    {pickData.pick === 'home' ? gameData.spread.home : gameData.spread.away}
                  </Text>
                  {pickData.reasoning && (
                    <Text style={styles.reasoning}>"{pickData.reasoning}"</Text>
                  )}
                </View>
              ))}
            </View>
            
            {/* Group Stats */}
            <View style={styles.groupStats}>
              <Text style={styles.groupStatsText}>
                {getPickStats(group.picks).awayPicks} on {gameData.awayTeam} • {getPickStats(group.picks).homePicks} on {gameData.homeTeam}
              </Text>
            </View>
          </View>
        ))}

        {/* Your Pick Summary */}
        <View style={styles.yourPickSummary}>
          <Text style={styles.sectionTitle}>Your Pick</Text>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              You picked <Text style={styles.highlight}>{gameData.spread.home}</Text> in 2 groups
            </Text>
            <Text style={styles.summarySubtext}>
              Confidence: Medium • Shared with 6 friends
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  gameTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameTime: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  statusIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  statusText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  overallStats: {
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  teamName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  spreadText: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  percentage: {
    color: '#8E8E93',
    fontSize: 12,
  },
  vsText: {
    paddingHorizontal: 12,
  },
  vs: {
    color: '#8E8E93',
    fontSize: 14,
  },
  groupSection: {
    marginBottom: 24,
  },
  groupTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  picksGrid: {
    gap: 8,
  },
  pickCard: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  userName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pickChoice: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  reasoning: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 4,
  },
  groupStats: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  groupStatsText: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
  },
  yourPickSummary: {
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  summaryText: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  highlight: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  summarySubtext: {
    color: '#8E8E93',
    fontSize: 14,
  },
});