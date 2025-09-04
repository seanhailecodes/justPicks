import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
  weightedScore?: number;
}

export default function GroupPicksScreen() {
  const searchParams = useLocalSearchParams();
  const groups = (searchParams.groups as string)?.split(',') || ['Work Friends'];
  
  const [selectedGroup, setSelectedGroup] = useState(groups[0]);
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [gamesData, setGamesData] = useState<any[]>([]);
  const [friendPicksByGame, setFriendPicksByGame] = useState<Record<string, FriendPick[]>>({});

  useEffect(() => {
    loadGamesAndPicks();
  }, [selectedWeek, selectedGroup]);

  const loadGamesAndPicks = () => {
    // Week 1 games with actual team names
    const weekGames = [
      {
        id: '2025_W1_DAL_NYG',
        homeTeam: 'Giants',
        awayTeam: 'Cowboys',
        homeTeamShort: 'NYG',
        awayTeamShort: 'DAL',
        spread: { home: 'NYG +3.5', away: 'DAL -3.5' },
        time: 'Sun 1:00 PM',
        date: 'Sep 7',
        timeToLock: '24h',
      },
      {
        id: '2025_W1_RAV_CHI',
        homeTeam: 'Bears',
        awayTeam: 'Ravens',
        homeTeamShort: 'CHI',
        awayTeamShort: 'RAV',
        spread: { home: 'CHI -3', away: 'RAV +3' },
        time: 'Sun 1:00 PM',
        date: 'Sep 7',
        timeToLock: '24h',
      },
      {
        id: '2025_W1_STE_FAL',
        homeTeam: 'Falcons',
        awayTeam: 'Steelers', 
        homeTeamShort: 'ATL',
        awayTeamShort: 'PIT',
        spread: { home: 'ATL -3', away: 'PIT +3' },
        time: 'Sun 1:00 PM',
        date: 'Sep 7',
        timeToLock: '24h',
      },
      {
        id: '2025_W1_BUF_MIA',
        homeTeam: 'Dolphins',
        awayTeam: 'Bills',
        homeTeamShort: 'MIA',
        awayTeamShort: 'BUF',
        spread: { home: 'MIA +2.5', away: 'BUF -2.5' },
        time: 'Sun 4:25 PM',
        date: 'Sep 7',
        timeToLock: '28h',
      },
      {
        id: '2025_W1_GB_PHI',
        homeTeam: 'Eagles',
        awayTeam: 'Packers',
        homeTeamShort: 'PHI',
        awayTeamShort: 'GB',
        spread: { home: 'PHI -4.5', away: 'GB +4.5' },
        time: 'Sun 8:20 PM',
        date: 'Sep 7',
        timeToLock: '32h',
      }
    ];
    
    setGamesData(weekGames);

    // Generate mock picks for each game
    const allPicksByGame: Record<string, FriendPick[]> = {};
    
    weekGames.forEach(game => {
      const mockPicks: FriendPick[] = [
        {
          id: `${game.id}_1`,
          username: 'miketheman',
          pick: Math.random() > 0.5 ? 'home' : 'away',
          confidence: 'High',
          confidenceValue: 85,
          confidenceColor: '#34C759',
          reasoning: `I like the ${Math.random() > 0.5 ? game.homeTeamShort : game.awayTeamShort} to cover here`,
          timestamp: '5 min ago',
          winRate: 75,
          totalPicks: 48,
        },
        {
          id: `${game.id}_2`,
          username: 'sarah_picks',
          pick: Math.random() > 0.5 ? 'home' : 'away',
          confidence: 'Medium',
          confidenceValue: 60,
          confidenceColor: '#FF9500',
          reasoning: `${game.homeTeamShort} at home is tough to beat`,
          timestamp: '12 min ago',
          winRate: 68,
          totalPicks: 31,
        },
        {
          id: `${game.id}_3`,
          username: 'You',
          pick: 'home',
          confidence: 'High',
          confidenceValue: 80,
          confidenceColor: '#34C759',
          reasoning: 'My analysis favors the home team',
          timestamp: 'Just now',
          winRate: 73,
          totalPicks: 36,
        },
        // Add some members who haven't picked yet for variety
        ...(Math.random() > 0.7 ? [{
          id: `${game.id}_4`,
          username: 'johnny99',
          pick: 'away' as const,
          confidence: 'Very High',
          confidenceValue: 95,
          confidenceColor: '#00C7BE',
          reasoning: `${game.awayTeamShort} wins big on the road`,
          timestamp: '28 min ago',
          winRate: 82,
          totalPicks: 45,
        }] : [])
      ];

      // Calculate weighted scores and sort
      const picksWithScores = mockPicks.map(pick => ({
        ...pick,
        weightedScore: pick.confidenceValue * (1 + pick.winRate / 100)
      }));
      
      picksWithScores.sort((a, b) => (b.weightedScore || 0) - (a.weightedScore || 0));
      allPicksByGame[game.id] = picksWithScores;
    });
    
    setFriendPicksByGame(allPicksByGame);
  };

  // Calculate consensus for a specific game
  const calculateGameConsensus = (picks: FriendPick[]) => {
    if (!picks || picks.length === 0) return null;

    let homeScore = 0;
    let awayScore = 0;

    picks.forEach(pick => {
      const weight = pick.weightedScore || 0;
      if (pick.pick === 'home') {
        homeScore += weight;
      } else {
        awayScore += weight;
      }
    });

    const totalScore = homeScore + awayScore;
    if (totalScore === 0) return null;
    
    const homePercentage = Math.round((homeScore / totalScore) * 100);
    const awayPercentage = 100 - homePercentage;

    return {
      homePercentage,
      awayPercentage,
      recommendation: homePercentage > 50 ? 'home' : 'away',
      homePicks: picks.filter(p => p.pick === 'home').length,
      awayPicks: picks.filter(p => p.pick === 'away').length,
    };
  };

  if (!gamesData.length) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Group Picks</Text>
          <Text style={styles.headerSubtitle}>Week {selectedWeek} • {selectedGroup}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Week Selector */}
      <ScrollView 
        horizontal 
        style={styles.weekSelector}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekSelectorContent}
      >
        {[1, 2, 3, 4, 5, 6, 7, 8].map((weekNum) => (
          <TouchableOpacity
            key={weekNum}
            style={[
              styles.weekChip,
              selectedWeek === weekNum && styles.weekChipActive
            ]}
            onPress={() => setSelectedWeek(weekNum)}
          >
            <Text style={[
              styles.weekChipText,
              selectedWeek === weekNum && styles.weekChipTextActive
            ]}>
              Week {weekNum}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Group Selector if multiple groups */}
      {groups.length > 1 && (
        <ScrollView 
          horizontal 
          style={styles.groupSelector}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupSelectorContent}
        >
          {groups.map(group => (
            <TouchableOpacity
              key={group}
              style={[
                styles.groupChip,
                selectedGroup === group && styles.groupChipActive
              ]}
              onPress={() => setSelectedGroup(group)}
            >
              <Text style={[
                styles.groupChipText,
                selectedGroup === group && styles.groupChipTextActive
              ]}>
                {group}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Loop through all games for the week */}
        {gamesData.map(game => {
          const gamePicks = friendPicksByGame[game.id] || [];
          const consensus = calculateGameConsensus(gamePicks);
          
          return (
            <View key={game.id} style={styles.gameSection}>
              {/* Game Header */}
              <TouchableOpacity 
                style={styles.gameHeader}
                onPress={() => router.push(`/game/${game.id}`)}
              >
                <View>
                  <Text style={styles.gameTitle}>
                    {game.awayTeamShort} @ {game.homeTeamShort}
                  </Text>
                  <Text style={styles.gameTime}>{game.date} • {game.time}</Text>
                </View>
                <View style={styles.gameHeaderRight}>
                  <Text style={styles.lockTime}>⏰ {game.timeToLock}</Text>
                  {consensus && (
                    <Text style={styles.consensusSummary}>
                      {consensus.homePicks}-{consensus.awayPicks}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {/* Mini Consensus Bar */}
              {consensus && (
                <View style={styles.miniConsensusBar}>
                  <View 
                    style={[
                      styles.miniBarFill,
                      styles.awayBarFill,
                      { flex: consensus.awayPercentage }
                    ]}
                  >
                    <Text style={styles.miniBarText}>{game.spread.away}</Text>
                  </View>
                  <View 
                    style={[
                      styles.miniBarFill,
                      styles.homeBarFill,
                      { flex: consensus.homePercentage }
                    ]}
                  >
                    <Text style={styles.miniBarText}>{game.spread.home}</Text>
                  </View>
                </View>
              )}

              {/* Top Picks for this game */}
              <View style={styles.picksContainer}>
                {gamePicks.length > 0 ? (
                  gamePicks.slice(0, 3).map((pick, index) => (
                    <View key={pick.id} style={styles.miniPickCard}>
                      <View style={styles.miniPickHeader}>
                        <Text style={[
                          styles.miniUsername,
                          pick.username === 'You' && styles.miniUsernameYou
                        ]}>
                          {pick.username}
                        </Text>
                        <View style={styles.miniPickInfo}>
                          <Text style={styles.miniPickChoice}>
                            {pick.pick === 'home' ? game.spread.home : game.spread.away}
                          </Text>
                          <View style={[styles.miniConfidenceDot, { backgroundColor: pick.confidenceColor }]} />
                        </View>
                      </View>
                      {pick.reasoning && (
                        <Text style={styles.miniReasoning} numberOfLines={1}>
                          "{pick.reasoning}"
                        </Text>
                      )}
                    </View>
                  ))
                ) : (
                  <Text style={styles.noPicksText}>No picks yet for this game</Text>
                )}
                
                {gamePicks.length > 3 && (
                  <TouchableOpacity 
                    style={styles.viewMoreButton}
                    onPress={() => router.push(`/game/${game.id}`)}
                  >
                    <Text style={styles.viewMoreText}>
                      View all {gamePicks.length} picks →
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Summary Stats */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Week {selectedWeek} Summary</Text>
          <Text style={styles.summaryText}>
            {gamesData.length} games • {Object.values(friendPicksByGame).flat().length} total picks
          </Text>
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
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 2,
  },
  headerRight: {
    width: 48,
  },
  weekSelector: {
    maxHeight: 40,
    marginVertical: 8,
  },
  weekSelectorContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  weekChip: {
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  weekChipActive: {
    backgroundColor: '#FF6B35',
  },
  weekChipText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  weekChipTextActive: {
    color: '#FFF',
  },
  groupSelector: {
    maxHeight: 50,
    marginVertical: 12,
  },
  groupSelectorContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  groupChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  groupChipActive: {
    backgroundColor: '#FF6B35',
  },
  groupChipText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  groupChipTextActive: {
    color: '#FFF',
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
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  consensusTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  consensusMain: {
    alignItems: 'center',
    marginBottom: 16,
  },
  consensusLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  consensusPick: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  consensusStrengthBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
  },
  consensusStrengthText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  consensusBarContainer: {
    marginBottom: 8,
  },
  consensusBar: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  consensusBarFill: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  awayBarFill: {
    backgroundColor: '#FF6B35',
  },
  homeBarFill: {
    backgroundColor: '#007AFF',
  },
  consensusBarText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  consensusLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  consensusTeamLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  consensusExplainer: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
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
  sectionHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  pickCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  rankBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#FF6B35',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingRight: 40,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  usernameYou: {
    color: '#FF6B35',
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  winRate: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '600',
  },
  statDivider: {
    color: '#8E8E93',
    fontSize: 12,
    marginHorizontal: 4,
  },
  totalPicks: {
    color: '#8E8E93',
    fontSize: 12,
  },
  pickInfo: {
    alignItems: 'flex-end',
  },
  pickChoice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  confidenceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  reasoningContainer: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  reasoning: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  pickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    color: '#8E8E93',
    fontSize: 12,
  },
  weightedScore: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
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
  gameSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#2C2C2E',
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  gameHeaderRight: {
    alignItems: 'flex-end',
  },
  lockTime: {
    color: '#FF9500',
    fontSize: 11,
    marginBottom: 4,
  },
  consensusSummary: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
  },
  miniConsensusBar: {
    flexDirection: 'row',
    height: 24,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#2C2C2E',
  },
  miniBarFill: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniBarText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  picksContainer: {
    padding: 12,
  },
  miniPickCard: {
    marginBottom: 8,
  },
  miniPickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  miniUsername: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '500',
  },
  miniUsernameYou: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  miniPickInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniPickChoice: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  miniConfidenceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  miniReasoning: {
    color: '#8E8E93',
    fontSize: 11,
    fontStyle: 'italic',
  },
  noPicksText: {
    color: '#8E8E93',
    fontSize: 13,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 8,
  },
  viewMoreButton: {
    marginTop: 8,
    alignItems: 'center',
  },
  viewMoreText: {
    color: '#FF6B35',
    fontSize: 13,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  summaryTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    color: '#FFF',
    fontSize: 14,
  },
});