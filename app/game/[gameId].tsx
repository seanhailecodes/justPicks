import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GroupPicksScreen() {
  const { gameId } = useLocalSearchParams();

  // Mock data for the game
  const gameData = {
    homeTeam: 'Giants',
    awayTeam: 'Cowboys',
    spread: { home: 'NYG +3.5', away: 'DAL -3.5' },
    time: 'Tonight 8:00 PM',
    locked: false,
    timeToLock: '2h',
  };

  // Mock picks from friends with win rates
  const friendPicks = [
    {
      id: 1,
      username: 'miketheman',
      pick: 'away',
      confidence: 'High',
      confidenceValue: 80,
      confidenceColor: '#34C759',
      reasoning: "Cowboys defense has been shaky lately, but Giants offense is even worse. Taking Cowboys to cover easily.",
      timestamp: '5 min ago',
      winRate: 75,
      totalPicks: 48,
    },
    {
      id: 2,
      username: 'sarah_picks',
      pick: 'home',
      confidence: 'Medium',
      confidenceValue: 60,
      confidenceColor: '#FFCC00',
      reasoning: "Weather report shows 15mph winds. This could affect Dak's passing game. Giants keep it close at home.",
      timestamp: '12 min ago',
      winRate: 68,
      totalPicks: 31,
    },
    {
      id: 3,
      username: 'johnny99',
      pick: 'home',
      confidence: 'Very High',
      confidenceValue: 95,
      confidenceColor: '#00C7BE',
      reasoning: "Giants are 4-1 ATS at home this season. Cowboys struggling on the road. This line is way off - hammer the Giants!",
      timestamp: '28 min ago',
      winRate: 82,
      totalPicks: 45,
    },
    {
      id: 4,
      username: 'pickmaster',
      pick: 'away',
      confidence: 'Low',
      confidenceValue: 40,
      confidenceColor: '#FF9500',
      reasoning: "Not confident but leaning Cowboys. Short week for both teams.",
      timestamp: '1 hour ago',
      winRate: 58,
      totalPicks: 12,
    },
    {
      id: 5,
      username: 'betsy_sharp',
      pick: 'home',
      confidence: 'High',
      confidenceValue: 80,
      confidenceColor: '#34C759',
      reasoning: "Daniel Jones has been solid at home. Giants defense will keep this close.",
      timestamp: '2 hours ago',
      winRate: 71,
      totalPicks: 55,
    },
  ];

  // Calculate weighted consensus
  const calculateConsensus = () => {
    let homeScore = 0;
    let awayScore = 0;
    let totalWeight = 0;

    friendPicks.forEach(pick => {
      // Weight = confidence * (1 + winRate/100)
      // This gives win rate a 0-100% boost to the confidence score
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
      strength: Math.abs(homePercentage - 50), // How strong is the consensus
    };
  };

  const consensus = calculateConsensus();

  // Count picks
  const homePicks = friendPicks.filter(p => p.pick === 'home').length;
  const awayPicks = friendPicks.filter(p => p.pick === 'away').length;
  const totalPicks = friendPicks.length;
  const pendingPicks = 5 - totalPicks; // Assuming 5 total friends

  const handleBack = () => {
    router.back();
  };

  const getPickDisplay = (pick: string) => {
    return pick === 'home' ? gameData.spread.home : gameData.spread.away;
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>{'<'}</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>
            {gameData.awayTeam} @ {gameData.homeTeam}
          </Text>
          <Text style={styles.headerTime}>{gameData.time}</Text>
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
        <View style={styles.consensusCard}>
          <Text style={styles.consensusTitle}>Overall Consensus</Text>
          
          <View style={styles.consensusBoxes}>
            <TouchableOpacity 
              style={[
                styles.consensusBox,
                consensus.recommendation === 'away' && styles.consensusBoxActive
              ]}
            >
              <Text style={styles.consensusTeamName}>{gameData.awayTeam}</Text>
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
              <Text style={styles.consensusTeamName}>{gameData.homeTeam}</Text>
              <Text style={styles.consensusSpread}>{gameData.spread.home}</Text>
              <Text style={styles.consensusCount}>{homePicks} picks ({consensus.homePercentage}%)</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{homePicks}</Text>
            <Text style={styles.statLabel}>Giants</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{awayPicks}</Text>
            <Text style={styles.statLabel}>Cowboys</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{pendingPicks}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Friends' Picks */}
        <Text style={styles.sectionTitle}>Our Picks</Text>
        
        {friendPicks.map(friend => (
          <View key={friend.id} style={styles.pickCard}>
            <View style={styles.pickHeader}>
              <View style={styles.userInfo}>
                <Text style={styles.username}>{friend.username === 'You' ? 'You' : friend.username.charAt(0).toUpperCase() + friend.username.slice(1)}</Text>
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
        ))}

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
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
    paddingHorizontal: 16,
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