// app/(tabs)/games.tsx
import PickModal from '@/components/PickModal';
import { NFLGame } from '@/data/nfl-week1-2025';
import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
    formatDateLabel,
    getGamesByWeek,
    WEEK_INFO
} from '../data/nfl-2025-schedule';

interface PickData {
  pick: string;
  confidence: string;
  reasoning?: string;
  groups: string[];
  type: 'solo' | 'group';
  gameId?: string;
  timestamp?: string;
}

export default function GamesScreen() {
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<NFLGame | null>(null);
  const [userPicks, setUserPicks] = useState<Map<string, PickData>>(new Map());

  // Get all games for selected week
  const gamesForWeek = getGamesByWeek(selectedWeek);

  // Helper function to calculate time until game
  const getTimeToLock = (gameDate: string, gameTime: string): string => {
    try {
      const now = new Date();
      const [time, period] = gameTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      const gameDateTime = new Date(gameDate);
      
      // Convert to 24-hour format
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;
      
      gameDateTime.setHours(hour24, minutes, 0, 0);
      
      const diffMs = gameDateTime.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffHours / 24);
      
      if (diffMs < 0) return 'LOCKED';
      if (diffDays > 0) return `${diffDays}d to lock`;
      if (diffHours > 0) return `${diffHours}h to lock`;
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      return `${diffMinutes}m to lock`;
    } catch (error) {
      return '2h to lock'; // Fallback for development
    }
  };

  const handlePickSelection = (game: NFLGame) => {
    setSelectedGame(game);
    setShowPickModal(true);
  };

  const handlePickSubmit = (pickData: PickData) => {
    console.log('Pick submitted:', pickData);
    
    if (selectedGame) {
      // Store the user's pick
      const newPicks = new Map(userPicks);
      newPicks.set(selectedGame.id, {
        ...pickData,
        gameId: selectedGame.id,
        timestamp: new Date().toISOString()
      });
      setUserPicks(newPicks);
    }
    
    setShowPickModal(false);
    setSelectedGame(null);
    
    if (pickData.type === 'group' && pickData.groups.length > 0) {
      router.push('/group/1');
    }
  };

  const handleViewDetails = (gameId: string) => {
    router.push(`/game/${gameId}`);
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return '#34C759';
      case 'Medium': return '#FF9500';
      case 'Low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const getLockTimeColor = (timeToLock: string) => {
    if (timeToLock === 'LOCKED') return '#FF3B30';
    if (timeToLock.includes('h')) {
      const hours = parseInt(timeToLock);
      if (hours <= 2) return '#FF9500';
    }
    if (timeToLock.includes('m')) return '#FF3B30';
    return '#34C759';
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Games</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Week Selector */}
      <ScrollView 
        horizontal 
        style={styles.weekFilter} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.weekFilterContent}
      >
        {WEEK_INFO.map(week => (
          <TouchableOpacity
            key={week.week}
            style={[
              styles.weekChip,
              selectedWeek === week.week && styles.weekChipActive
            ]}
            onPress={() => {
              setSelectedWeek(week.week);
            }}
          >
            <Text style={[
              styles.weekChipText,
              selectedWeek === week.week && styles.weekChipTextActive
            ]}>
              {week.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {gamesForWeek.length === 0 ? (
          <View style={styles.noGamesCard}>
            <Text style={styles.noGamesText}>No games scheduled for this week</Text>
          </View>
        ) : (
          gamesForWeek.map(game => {
            const userPick = userPicks.get(game.id);
            const timeToLock = getTimeToLock(game.date, game.time);
            const hasLines = game.spread.value !== 0;
            
            return (
              <View key={game.id} style={styles.gameCard}>
                {game.isPrimetime && (
                  <View style={styles.primetimeBadge}>
                    <Text style={styles.primetimeText}>
                      {game.isNeutralSite && game.venue.includes('Brazil') ? '🌍 BRAZIL' : 
                       game.isNeutralSite && game.venue.includes('Dublin') ? '🍀 DUBLIN' :
                       '🌟 PRIMETIME'}
                    </Text>
                  </View>
                )}
                
                <View style={styles.gameHeader}>
                  <View>
                    <Text style={styles.gameTitle}>
                      {game.awayTeamShort} @ {game.homeTeamShort}
                    </Text>
                    <Text style={styles.gameInfo}>
                      {formatDateLabel(game.date)} • {game.time}
                    </Text>
                    <Text style={styles.gameTv}>
                      {game.tv[0]}
                    </Text>
                    {game.isNeutralSite && (
                      <Text style={styles.neutralSite}>📍 {game.venue}</Text>
                    )}
                  </View>
                  <Text style={[
                    styles.lockTime,
                    { color: getLockTimeColor(timeToLock) }
                  ]}>
                    {timeToLock}
                  </Text>
                </View>

                {hasLines && (
                  <View style={styles.oddsInfo}>
                    <Text style={styles.oddsText}>O/U: {game.overUnder || 'TBD'}</Text>
                    {game.moneyline.home !== 0 && (
                      <Text style={styles.oddsText}>
                        ML: {game.homeTeamShort} {game.moneyline.home > 0 ? '+' : ''}{game.moneyline.home}
                      </Text>
                    )}
                  </View>
                )}

                <View style={styles.pickOptions}>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      userPick?.pick === game.spread.away && styles.pickButtonSelected,
                      !hasLines && styles.pickButtonDisabled
                    ]}
                    onPress={() => hasLines && handlePickSelection(game)}
                    disabled={timeToLock === 'LOCKED' || !hasLines}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      userPick?.pick === game.spread.away && styles.pickButtonTextSelected
                    ]}>
                      {hasLines ? game.spread.away : `${game.awayTeamShort} -`}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      userPick?.pick === game.spread.home && styles.pickButtonSelected,
                      !hasLines && styles.pickButtonDisabled
                    ]}
                    onPress={() => hasLines && handlePickSelection(game)}
                    disabled={timeToLock === 'LOCKED' || !hasLines}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      userPick?.pick === game.spread.home && styles.pickButtonTextSelected
                    ]}>
                      {hasLines ? game.spread.home : `${game.homeTeamShort} -`}
                    </Text>
                  </TouchableOpacity>
                </View>

                {!hasLines && (
                  <Text style={styles.linesComingSoon}>Lines coming soon</Text>
                )}

                {userPick && (
                  <View style={styles.pickStatus}>
                    <View style={styles.pickStatusLeft}>
                      <Text style={styles.pickTypeLabel}>
                        {userPick.type === 'solo' ? '🎯 Solo Pick' : '👥 Group Pick'}
                      </Text>
                      {userPick.confidence && (
                        <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(userPick.confidence) }]}>
                          <Text style={styles.confidenceText}>{userPick.confidence}</Text>
                        </View>
                      )}
                    </View>
                    
                    {userPick.groups && userPick.groups.length > 0 ? (
                      <Text style={styles.groupsText}>
                        Shared with: {userPick.groups.join(', ')}
                      </Text>
                    ) : (
                      <Text style={styles.soloText}>Personal tracking only</Text>
                    )}
                  </View>
                )}

                {userPick && userPick.type === 'group' && (
                  <TouchableOpacity 
                    style={styles.viewDetailsButton}
                    onPress={() => handleViewDetails(game.id)}
                  >
                    <Text style={styles.viewDetailsText}>View All Group Picks →</Text>
                  </TouchableOpacity>
                )}

                {!userPick && timeToLock !== 'LOCKED' && hasLines && (
                  <Text style={styles.noPickText}>Tap to make your pick</Text>
                )}

                {timeToLock === 'LOCKED' && !userPick && (
                  <Text style={styles.lockedText}>Picks locked - Game started</Text>
                )}
              </View>
            );
          })
        )}

        {selectedWeek === 1 && (
          <View style={styles.helpBanner}>
            <Text style={styles.helpTitle}>🏈 2025 NFL Season Week {selectedWeek}</Text>
            <Text style={styles.helpText}>
              {selectedWeek === 1 ? 
                'The defending Super Bowl champion Eagles host the Cowboys in the season kickoff. Make your picks before games lock!' :
                `Week ${selectedWeek} features ${gamesForWeek.length} exciting matchups!`
              }
            </Text>
          </View>
        )}
      </ScrollView>

      {selectedGame && (
        <PickModal
          visible={showPickModal}
          onClose={() => {
            setShowPickModal(false);
            setSelectedGame(null);
          }}
          onSubmit={handlePickSubmit}
          game={{
            homeTeam: selectedGame.homeTeamShort,
            awayTeam: selectedGame.awayTeamShort,
            spread: selectedGame.spread,
            time: `${formatDateLabel(selectedGame.date)} ${selectedGame.time}`
          }}
          currentPick={userPicks.get(selectedGame.id)?.pick}
          groups={userPicks.get(selectedGame.id)?.groups || []}
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
  dateFilter: {
    maxHeight: 40,
    marginBottom: 16,
  },
  dateFilterContent: {
    paddingHorizontal: 24,
    gap: 8,
  },
  dateChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  dateChipActive: {
    backgroundColor: '#007AFF',
  },
  dateChipText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  dateChipTextActive: {
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
  noGamesCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  noGamesText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    position: 'relative',
  },
  primetimeBadge: {
    position: 'absolute',
    top: -8,
    right: 16,
    backgroundColor: '#FF6B35',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  primetimeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameInfo: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 2,
  },
  gameTv: {
    color: '#8E8E93',
    fontSize: 12,
  },
  neutralSite: {
    color: '#007AFF',
    fontSize: 12,
    marginTop: 2,
  },
  oddsInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  oddsText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  lockTime: {
    fontSize: 14,
    fontWeight: '600',
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
  pickButtonDisabled: {
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
  linesComingSoon: {
    color: '#FF9500',
    fontSize: 12,
    textAlign: 'center',
    marginTop: -4,
    marginBottom: 8,
    fontStyle: 'italic',
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
  // Additional styles that might have been missed
  messageInput: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
  },
  input: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    color: '#FFF',
    fontSize: 14,
  },
});