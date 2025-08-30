import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function PickHistoryScreen() {
  const [filter, setFilter] = useState('all'); // 'all', 'correct', 'incorrect', 'pending'

  const pickHistory = [
    {
      id: 1,
      date: 'Today',
      game: 'Cowboys @ Giants',
      pick: 'NYG +3.5',
      result: 'pending',
      confidence: 'Medium',
      groups: ['Work Friends', 'Family Picks'],
    },
    {
      id: 2,
      date: 'Yesterday',
      game: 'Lakers @ Warriors',
      pick: 'GSW -4.5',
      result: 'correct',
      score: 'GSW 118, LAL 108',
      confidence: 'High',
      groups: ['Work Friends'],
    },
    {
      id: 3,
      date: 'Dec 26',
      game: 'Chiefs @ Raiders',
      pick: 'KC -7.5',
      result: 'incorrect',
      score: 'KC 20, LV 14',
      confidence: 'High',
      groups: ['Family Picks'],
    },
    {
      id: 4,
      date: 'Dec 25',
      game: 'Celtics @ Bucks',
      pick: 'Over 228.5',
      result: 'correct',
      score: 'BOS 119, MIL 116 (Total: 235)',
      confidence: 'Medium',
      groups: ['College Buddies'],
    },
    {
      id: 5,
      date: 'Dec 24',
      game: 'Ravens @ 49ers',
      pick: 'BAL +3.5',
      result: 'correct',
      score: 'SF 19, BAL 17',
      confidence: 'Low',
      groups: ['Work Friends'],
    },
  ];

  const getFilteredPicks = () => {
    if (filter === 'all') return pickHistory;
    return pickHistory.filter(pick => pick.result === filter);
  };

  const getResultColor = (result: string) => {
    switch (result) {
      case 'correct': return '#34C759';
      case 'incorrect': return '#FF3B30';
      case 'pending': return '#FF9500';
      default: return '#8E8E93';
    }
  };

  const getResultIcon = (result: string) => {
    switch (result) {
      case 'correct': return '✅';
      case 'incorrect': return '❌';
      case 'pending': return '⏳';
      default: return '';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'High': return '#34C759';
      case 'Medium': return '#FF9500';
      case 'Low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const stats = {
    total: pickHistory.length,
    correct: pickHistory.filter(p => p.result === 'correct').length,
    incorrect: pickHistory.filter(p => p.result === 'incorrect').length,
    pending: pickHistory.filter(p => p.result === 'pending').length,
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pick History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats Summary */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.correct}</Text>
          <Text style={styles.statLabel}>Correct</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{stats.incorrect}</Text>
          <Text style={styles.statLabel}>Wrong</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF6B35' }]}>
            {Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <ScrollView 
        horizontal 
        style={styles.filterContainer}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'correct', 'incorrect', 'pending'].map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterChip, filter === filterType && styles.filterChipActive]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[styles.filterChipText, filter === filterType && styles.filterChipTextActive]}>
              {filterType === 'all' ? 'All Picks' : 
               filterType === 'correct' ? '✅ Wins' :
               filterType === 'incorrect' ? '❌ Losses' : '⏳ Pending'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {getFilteredPicks().map(pick => (
          <TouchableOpacity key={pick.id} style={styles.pickCard}>
            <View style={styles.pickHeader}>
              <View>
                <Text style={styles.pickDate}>{pick.date}</Text>
                <Text style={styles.pickGame}>{pick.game}</Text>
              </View>
              <Text style={styles.resultIcon}>{getResultIcon(pick.result)}</Text>
            </View>

            <View style={styles.pickDetails}>
              <Text style={styles.pickChoice}>{pick.pick}</Text>
              <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(pick.confidence) }]}>
                <Text style={styles.confidenceText}>{pick.confidence}</Text>
              </View>
            </View>

            {pick.score && (
              <Text style={styles.scoreText}>{pick.score}</Text>
            )}

            <View style={styles.pickFooter}>
              <Text style={styles.groupsText}>
                Shared with: {pick.groups.join(', ')}
              </Text>
              <Text style={[styles.resultText, { color: getResultColor(pick.result) }]}>
                {pick.result.charAt(0).toUpperCase() + pick.result.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
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
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 16,
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  filterContainer: {
    maxHeight: 50,
    marginTop: 16,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#FF6B35',
  },
  filterChipText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#FFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  pickDate: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  pickGame: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  resultIcon: {
    fontSize: 24,
  },
  pickDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pickChoice: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 12,
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  confidenceText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  scoreText: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 8,
  },
  pickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  groupsText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
});