import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserPickHistory, supabase } from '../lib/supabase';

interface PickHistoryItem {
  id: string;
  game_id: string;
  pick: string;
  team_picked: string;
  confidence: string;
  reasoning: string;
  result: boolean | null;
  correct: boolean | null;
  created_at: string;
  week: number;
  season: number;
  pick_type: string;
  games?: {
    home_team: string;
    away_team: string;
    game_date: string;
    home_score: number | null;
    away_score: number | null;
  };
}

export default function PickHistoryScreen() {
  const [filter, setFilter] = useState('all'); // 'all', 'correct', 'incorrect', 'pending'
  const [pickHistory, setPickHistory] = useState<PickHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPickHistory();
  }, []);

  const loadPickHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const history = await getUserPickHistory(user.id);
        setPickHistory(history || []);
      }
    } catch (error) {
      console.error('Error loading pick history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredPicks = () => {
    if (filter === 'all') return pickHistory;
    if (filter === 'correct') return pickHistory.filter(pick => pick.correct === true);
    if (filter === 'incorrect') return pickHistory.filter(pick => pick.correct === false);
    if (filter === 'pending') return pickHistory.filter(pick => pick.correct === null);
    return pickHistory;
  };

  const getResultColor = (result: boolean | null) => {
    if (result === true) return '#34C759';
    if (result === false) return '#FF3B30';
    return '#FF9500'; // pending
  };

  const getResultIcon = (result: boolean | null) => {
    if (result === true) return '✅';
    if (result === false) return '❌';
    return '⏳'; // pending
  };

  const getResultText = (result: boolean | null) => {
    if (result === true) return 'Correct';
    if (result === false) return 'Incorrect';
    return 'Pending';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high': return '#34C759';
      case 'medium': return '#FF9500';
      case 'low': return '#FF3B30';
      default: return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatGameTitle = (pick: PickHistoryItem) => {
    if (pick.games) {
      return `${pick.games.away_team} @ ${pick.games.home_team}`;
    }
    // Fallback to game_id parsing if games data isn't available
    const parts = pick.game_id.split('-');
    if (parts.length >= 4) {
      return `${parts[3]} @ ${parts[2]}`;
    }
    return pick.game_id;
  };

  const formatPickChoice = (pick: PickHistoryItem) => {
    if (pick.pick_type === 'spread') {
      return `${pick.team_picked.toUpperCase()} (Spread)`;
    }
    if (pick.pick_type === 'moneyline') {
      return `${pick.team_picked.toUpperCase()} (ML)`;
    }
    if (pick.pick_type === 'over_under') {
      return `${pick.pick === 'over' ? 'Over' : 'Under'}`;
    }
    return pick.team_picked.toUpperCase();
  };

  const formatScore = (pick: PickHistoryItem) => {
    // Since we don't have games data, we can't show scores
    // Could be enhanced later if you add game results to your database
    return null;
  };

  const stats = {
    total: pickHistory.length,
    correct: pickHistory.filter(p => p.correct === true).length,
    incorrect: pickHistory.filter(p => p.correct === false).length,
    pending: pickHistory.filter(p => p.correct === null).length,
  };

  const winRate = stats.correct + stats.incorrect > 0 
    ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
    : 0;

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Pick History</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading pick history...</Text>
        </View>
      </SafeAreaView>
    );
  }

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
            {winRate}%
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
        {getFilteredPicks().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {filter === 'all' ? 'No picks yet' : `No ${filter} picks`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' 
                ? 'Start making picks to see your history here!'
                : `You don't have any ${filter} picks yet.`
              }
            </Text>
          </View>
        ) : (
          getFilteredPicks().map(pick => (
            <TouchableOpacity key={pick.id} style={styles.pickCard}>
              <View style={styles.pickHeader}>
                <View>
                  <Text style={styles.pickDate}>{formatDate(pick.created_at)}</Text>
                  <Text style={styles.pickGame}>{formatGameTitle(pick)}</Text>
                </View>
                <Text style={styles.resultIcon}>{getResultIcon(pick.correct)}</Text>
              </View>

              <View style={styles.pickDetails}>
                <Text style={styles.pickChoice}>{formatPickChoice(pick)}</Text>
                <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(pick.confidence) }]}>
                  <Text style={styles.confidenceText}>{pick.confidence || 'Medium'}</Text>
                </View>
              </View>

              {formatScore(pick) && (
                <Text style={styles.scoreText}>{formatScore(pick)}</Text>
              )}

              {pick.reasoning && (
                <Text style={styles.reasoningText}>"{pick.reasoning}"</Text>
              )}

              <View style={styles.pickFooter}>
                <Text style={styles.weekText}>
                  Week {pick.week} • {pick.pick_type.replace('_', ' ').toUpperCase()}
                </Text>
                <Text style={[styles.resultText, { color: getResultColor(pick.correct) }]}>
                  {getResultText(pick.correct)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 16,
    marginTop: 16,
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
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
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
  reasoningText: {
    color: '#8E8E93',
    fontSize: 13,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  pickFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  resultText: {
    fontSize: 12,
    fontWeight: '600',
  },
});