import PickModal from '@/components/PickModal';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GamesScreen() {
  const [selectedSport, setSelectedSport] = useState('Football');
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [showSharePrompt, setShowSharePrompt] = useState(false);

  const sports = ['Football', 'Basketball', 'College', 'Other'];

  const [games, setGames] = useState(() => {
    const now = new Date();
    const today = new Date(now);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const in3Days = new Date(now);
    in3Days.setDate(in3Days.getDate() + 3);
    const in5Days = new Date(now);
    in5Days.setDate(in5Days.getDate() + 5);
    const in10Days = new Date(now);
    in10Days.setDate(in10Days.getDate() + 10);
    
    return [
      {
        id: 1,
        homeTeam: 'Giants',
        awayTeam: 'Cowboys',
        league: 'NFL',
        gameDate: new Date(today.setHours(20, 0, 0, 0)), // Today 8pm
        spread: { away: 'DAL -3.5', home: 'NYG +3.5' },
        selectedPick: null,
        pickType: null,
        confidence: null,
        groups: [],
      },
      {
        id: 2,
        homeTeam: 'Warriors',
        awayTeam: 'Lakers',
        league: 'NBA',
        gameDate: new Date(today.setHours(22, 30, 0, 0)), // Today 10:30pm
        spread: { away: 'LAL +4.5', home: 'GSW -4.5' },
        selectedPick: null,
        pickType: null,
        confidence: null,
        groups: [],
      },
      {
        id: 3,
        homeTeam: 'Heat',
        awayTeam: 'Celtics',
        league: 'NBA',
        gameDate: new Date(tomorrow.setHours(19, 0, 0, 0)), // Tomorrow 7pm
        spread: { away: 'BOS -5.5', home: 'MIA +5.5' },
        selectedPick: null,
        pickType: null,
        confidence: null,
        groups: [],
      },
      {
        id: 4,
        homeTeam: 'Chiefs',
        awayTeam: 'Bills',
        league: 'NFL',
        gameDate: new Date(in3Days.setHours(20, 15, 0, 0)), // 3 days from now 8:15pm
        spread: { away: 'BUF +2.5', home: 'KC -2.5' },
        selectedPick: null,
        pickType: null,
        confidence: null,
        groups: [],
      },
      {
        id: 5,
        homeTeam: 'Suns',
        awayTeam: 'Nuggets',
        league: 'NBA',
        gameDate: new Date(in10Days.setHours(21, 0, 0, 0)), // 10 days from now 9pm
        spread: { away: 'DEN -4', home: 'PHX +4' },
        selectedPick: null,
        pickType: null,
        confidence: null,
        groups: [],
      },
    ];
  });

  // Helper functions for date grouping
  const formatGameTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const formatGameDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const gameDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    if (gameDateOnly.getTime() === today.getTime()) return 'Today';
    if (gameDateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTimeToLock = (gameDate: Date) => {
    const now = new Date();
    const diffMs = gameDate.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMs < 0) return 'Locked';
    if (diffHours < 1) return `${Math.floor(diffMs / (1000 * 60))}m to lock`;
    if (diffHours < 24) return `${diffHours}h to lock`;
    return `${diffDays}d to lock`;
  };

  const getDateGroup = (gameDate: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);
    const twoWeeks = new Date(today);
    twoWeeks.setDate(twoWeeks.getDate() + 14);
    
    const gameDateOnly = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
    
    if (gameDateOnly.getTime() === today.getTime()) return 'Today';
    if (gameDateOnly.getTime() === tomorrow.getTime()) return 'Tomorrow';
    if (gameDateOnly < nextWeek) return 'This Week';
    if (gameDateOnly < twoWeeks) return 'Next Week';
    
    return `${gameDate.toLocaleDateString('en-US', { month: 'long' })} Games`;
  };

  // Group games by date
  const groupedGames = games.reduce((groups, game) => {
    const group = getDateGroup(game.gameDate);
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(game);
    return groups;
  }, {} as Record<string, typeof games>);

  // Order for groups
  const groupOrder = ['Today', 'Tomorrow', 'This Week', 'Next Week'];
  const sortedGroups = Object.keys(groupedGames).sort((a, b) => {
    const aIndex = groupOrder.indexOf(a);
    const bIndex = groupOrder.indexOf(b);
    
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  const handlePickSelection = (game: any) => {
    setSelectedGame(game);
    setShowPickModal(true);
  };

  const handlePickSubmit = (pickData: any) => {
    console.log('Pick submitted:', pickData);
    
    // Update the game with the new pick data
    if (selectedGame) {
      setGames(prevGames => 
        prevGames.map(game => 
          game.id === selectedGame.id 
            ? {
                ...game,
                selectedPick: pickData.pick,
                pickType: pickData.type,
                confidence: pickData.confidence,
                groups: pickData.groups,
              }
            : game
        )
      );
    }
    
    setShowPickModal(false);
    
    // If it's a solo pick, show the share prompt
    if (pickData.type === 'solo') {
      setShowSharePrompt(true);
    } else if (pickData.type === 'group' && pickData.groups.length > 0) {
      router.push('/group/1');
    }
  };

  const handleViewDetails = (gameId: number) => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Games</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.helpButton}>
            <Text style={styles.helpIcon}>?</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        horizontal 
        style={styles.sportFilter} 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.sportFilterContent}
      >
        {sports.map(sport => (
          <TouchableOpacity
            key={sport}
            style={[
              styles.sportChip,
              selectedSport === sport && styles.sportChipActive
            ]}
            onPress={() => setSelectedSport(sport)}
          >
            <Text style={[
              styles.sportChipText,
              selectedSport === sport && styles.sportChipTextActive
            ]}>
              {sport}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortedGroups.map(group => {
          const gamesInGroup = groupedGames[group]
            .filter(game => selectedSport === 'Football' ? game.league === 'NFL' : 
                           selectedSport === 'Basketball' ? game.league === 'NBA' :
                           selectedSport === 'College' ? game.league === 'NCAAF' || game.league === 'NCAAB' :
                           true);
          
          if (gamesInGroup.length === 0) return null;
          
          return (
            <View key={group}>
              <Text style={styles.dateGroupHeader}>{group}</Text>
              {gamesInGroup.map(game => (
                <View key={game.id} style={styles.gameCard}>
                  <View style={styles.gameHeader}>
                    <View>
                      <Text style={styles.gameTitle}>
                        {game.awayTeam} @ {game.homeTeam}
                      </Text>
                      <Text style={styles.gameInfo}>
                        {game.league} • {formatGameDate(game.gameDate)} {formatGameTime(game.gameDate)} EST
                      </Text>
                    </View>
                    <Text style={[
                      styles.lockTime,
                      getTimeToLock(game.gameDate).includes('h') && parseInt(getTimeToLock(game.gameDate)) <= 2 && styles.lockTimeUrgent
                    ]}>
                      {getTimeToLock(game.gameDate)}
                    </Text>
                  </View>

                  <View style={styles.pickOptions}>
                    <TouchableOpacity
                      style={[
                        styles.pickButton,
                        game.selectedPick === 'away' && styles.pickButtonSelected
                      ]}
                      onPress={() => handlePickSelection(game)}
                    >
                      <Text style={[
                        styles.pickButtonText,
                        game.selectedPick === 'away' && styles.pickButtonTextSelected
                      ]}>
                        {game.spread.away}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.pickButton,
                        game.selectedPick === 'home' && styles.pickButtonSelected
                      ]}
                      onPress={() => handlePickSelection(game)}
                    >
                      <Text style={[
                        styles.pickButtonText,
                        game.selectedPick === 'home' && styles.pickButtonTextSelected
                      ]}>
                        {game.spread.home}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {game.selectedPick && (
                    <View style={styles.pickStatus}>
                      <View style={styles.pickStatusLeft}>
                        <Text style={styles.pickTypeLabel}>
                          {game.pickType === 'solo' ? '🎯 Solo Pick' : '👥 Group Pick'}
                        </Text>
                        {game.confidence && (
                          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(game.confidence) }]}>
                            <Text style={styles.confidenceText}>{game.confidence}</Text>
                          </View>
                        )}
                      </View>
                      
                      {game.groups.length > 0 ? (
                        <Text style={styles.groupsText}>
                          Shared with: {game.groups.join(', ')}
                        </Text>
                      ) : (
                        <Text style={styles.soloText}>Personal tracking only</Text>
                      )}
                    </View>
                  )}

                  {game.selectedPick && game.pickType === 'group' && (
                    <TouchableOpacity 
                      style={styles.viewDetailsButton}
                      onPress={() => handleViewDetails(game.id)}
                    >
                      <Text style={styles.viewDetailsText}>View All Group Picks →</Text>
                    </TouchableOpacity>
                  )}

                  {!game.selectedPick && (
                    <Text style={styles.noPickText}>Tap to make your pick</Text>
                  )}
                </View>
              ))}
            </View>
          );
        })}

        <View style={styles.helpBanner}>
          <Text style={styles.helpTitle}>💡 How to Make Picks</Text>
          <Text style={styles.helpText}>
            Tap any game below to select your pick. You can choose to track it solo or share with groups.
          </Text>
        </View>
      </ScrollView>

      {selectedGame && (
        <PickModal
          visible={showPickModal}
          onClose={() => {
            setShowPickModal(false);
            setSelectedGame(null);
          }}
          onSubmit={handlePickSubmit}
          game={selectedGame}
          currentPick={selectedGame.selectedPick}
          groups={selectedGame.groups}
        />
      )}

      <SharePromptModal
        visible={showSharePrompt}
        onClose={() => {
          setShowSharePrompt(false);
        }}
        onShare={() => {
          setShowSharePrompt(false);
          router.push('/(tabs)/groups');
        }}
      />
    </SafeAreaView>
  );
}

const SharePromptModal = ({ visible, onClose, onShare }: any) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.sharePromptOverlay}>
        <View style={styles.sharePromptContent}>
          <Text style={styles.sharePromptTitle}>Share with Friends?</Text>
          <Text style={styles.sharePromptText}>
            Would you like to share this pick with your groups? You can always share it later from My Groups.
          </Text>
          
          <View style={styles.sharePromptButtons}>
            <TouchableOpacity 
              style={styles.sharePromptButtonSecondary}
              onPress={onClose}
            >
              <Text style={styles.sharePromptButtonTextSecondary}>Not Now</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.sharePromptButtonPrimary}
              onPress={onShare}
            >
              <Text style={styles.sharePromptButtonTextPrimary}>Share Pick</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

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
  calendarIcon: {
    fontSize: 24,
  },
  sportFilter: {
    maxHeight: 40,
    marginBottom: 16,
  },
  sportFilterContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  sportChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sportChipActive: {
    backgroundColor: '#FF6B35',
  },
  sportChipText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  sportChipTextActive: {
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
  gameCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  gameInfo: {
    color: '#8E8E93',
    fontSize: 14,
  },
  lockTime: {
    color: '#34C759',
    fontSize: 14,
    fontWeight: '600',
  },
  lockTimeUrgent: {
    color: '#FF9500',
  },
  pickOptions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonSelected: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  pickButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pickButtonTextSelected: {
    color: '#FFF',
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
  sharePromptOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sharePromptContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  sharePromptTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  sharePromptText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
    textAlign: 'center',
  },
  sharePromptButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  sharePromptButtonSecondary: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sharePromptButtonPrimary: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  sharePromptButtonTextSecondary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  sharePromptButtonTextPrimary: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateGroupHeader: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
});