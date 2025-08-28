import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function GamesScreen() {
  const [selectedSport, setSelectedSport] = useState('Football');

  const sports = ['Football', 'Basketball', 'College', 'Other'];

  const games = [
    {
      id: 1,
      homeTeam: 'Giants',
      awayTeam: 'Cowboys',
      league: 'NFL',
      date: 'Today 8:00 PM EST',
      timeToLock: '2h to lock',
      spread: { away: 'DAL -3.5', home: 'NYG +3.5' },
      selectedPick: 'home',
      pickType: 'solo', // 'solo' or 'group'
      confidence: 'Medium',
      groups: [], // empty for solo picks
    },
    {
      id: 2,
      homeTeam: 'Warriors',
      awayTeam: 'Lakers',
      league: 'NBA',
      date: 'Tonight 10:30 PM EST',
      timeToLock: '5h to lock',
      moneyline: { away: 'LAL ML', home: 'GSW ML' },
      selectedPick: null,
      pickType: null,
      groups: [],
    },
    {
      id: 3,
      homeTeam: 'Heat',
      awayTeam: 'Celtics',
      league: 'NBA',
      date: 'Tomorrow 7:00 PM EST',
      timeToLock: '24h to lock',
      spread: { away: 'BOS -5.5', home: 'MIA +5.5' },
      selectedPick: 'away',
      pickType: 'group',
      confidence: 'High',
      groups: ['Work Friends', 'Family Picks'],
    },
  ];

  const handlePickSelection = (gameId: number, pick: string) => {
    // TODO: Open pick modal to choose solo or group
    console.log('Select pick:', gameId, pick);
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
        <TouchableOpacity>
          <Text style={styles.calendarIcon}>📅</Text>
        </TouchableOpacity>
      </View>

      {/* Sport Filter */}
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
        {games.map(game => (
          <View key={game.id} style={styles.gameCard}>
            {/* Game Header */}
            <View style={styles.gameHeader}>
              <View>
                <Text style={styles.gameTitle}>
                  {game.awayTeam} @ {game.homeTeam}
                </Text>
                <Text style={styles.gameInfo}>
                  {game.league} • {game.date}
                </Text>
              </View>
              <Text style={[
                styles.lockTime,
                game.timeToLock.includes('2h') && styles.lockTimeUrgent
              ]}>
                {game.timeToLock}
              </Text>
            </View>

            {/* Pick Options */}
            <View style={styles.pickOptions}>
              {game.spread && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      game.selectedPick === 'away' && styles.pickButtonSelected
                    ]}
                    onPress={() => handlePickSelection(game.id, 'away')}
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
                    onPress={() => handlePickSelection(game.id, 'home')}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      game.selectedPick === 'home' && styles.pickButtonTextSelected
                    ]}>
                      {game.spread.home}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
              {game.moneyline && (
                <>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      game.selectedPick === 'away' && styles.pickButtonSelected
                    ]}
                    onPress={() => handlePickSelection(game.id, 'away')}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      game.selectedPick === 'away' && styles.pickButtonTextSelected
                    ]}>
                      {game.moneyline.away}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.pickButton,
                      game.selectedPick === 'home' && styles.pickButtonSelected
                    ]}
                    onPress={() => handlePickSelection(game.id, 'home')}
                  >
                    <Text style={[
                      styles.pickButtonText,
                      game.selectedPick === 'home' && styles.pickButtonTextSelected
                    ]}>
                      {game.moneyline.home}
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Pick Status */}
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

            {/* View Details Button for games with picks */}
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

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎯 Solo Picks</Text>
          <Text style={styles.infoText}>
            Track your personal picks without sharing. Great for building confidence before joining groups!
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
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
    backgroundColor: '#2C2C2E',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonSelected: {
    backgroundColor: '#FF6B35',
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
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
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
});