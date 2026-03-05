import { router, useLocalSearchParams } from 'expo-router';
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
  over_under_pick: string | null;
  over_under_confidence: string | null;
  over_under_correct: boolean | null;
  created_at: string;
  week: number;
  season: number;
  pick_type: string;
  games?: {
    home_team: string;
    away_team: string;
    game_date: string;
    league: string;
    home_score: number | null;
    away_score: number | null;
    over_under_line: number | null;
  };
}

export default function PickHistoryScreen() {
  const { initialFilter } = useLocalSearchParams<{ initialFilter?: string }>();
  const [filter, setFilter] = useState(initialFilter ?? 'all'); // 'all', 'correct', 'incorrect', 'upcoming'
  const [sportFilter, setSportFilter] = useState('all');
  const [pickHistory, setPickHistory] = useState<PickHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const isGameInPast = (pick: PickHistoryItem): boolean => {
    // Use game_date if available; fall back to created_at for orphaned picks
    // whose game record no longer exists — they are always in the past.
    const raw = pick.games?.game_date ?? pick.created_at;
    const dateStr = raw.endsWith('Z') ? raw : raw.replace(' ', 'T') + 'Z';
    return new Date(dateStr) < new Date();
  };

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

  // Derive unique leagues from pick history for the sport filter
  const availableLeagues = ['all', ...Array.from(new Set(
    pickHistory.map(p => p.games?.league).filter(Boolean) as string[]
  )).sort()];

  const getFilteredPicks = () => {
    let picks = pickHistory;
    if (sportFilter !== 'all') picks = picks.filter(p => p.games?.league === sportFilter);
    if (filter === 'correct') return picks.filter(pick => pick.correct === true);
    if (filter === 'incorrect') return picks.filter(pick => pick.correct === false);
    if (filter === 'upcoming') return picks.filter(pick => pick.correct === null && !isGameInPast(pick));
    if (filter === 'unresolved') return picks.filter(pick => pick.correct === null && isGameInPast(pick));
    return picks;
  };

  const getFilteredStats = () => {
    const picks = sportFilter === 'all' ? pickHistory : pickHistory.filter(p => p.games?.league === sportFilter);
    return {
      correct: picks.filter(p => p.correct === true).length,
      incorrect: picks.filter(p => p.correct === false).length,
      upcoming: picks.filter(p => p.correct === null).length,
    };
  };

  const getResultColor = (pick: PickHistoryItem) => {
    if (pick.correct === true) return '#34C759';
    if (pick.correct === false) return '#FF3B30';
    if (isGameInPast(pick)) return '#8E8E93'; // unresolved past game
    return '#FF9500'; // upcoming
  };

  const getResultIcon = (pick: PickHistoryItem) => {
    if (pick.correct === true) return '✅';
    if (pick.correct === false) return '❌';
    if (isGameInPast(pick)) return '❓';
    return '⏳';
  };

  const getResultText = (pick: PickHistoryItem) => {
    if (pick.correct === true) return 'Correct';
    if (pick.correct === false) return 'Incorrect';
    if (isGameInPast(pick)) return 'Unresolved';
    return 'Upcoming';
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
    
    // Reset times to midnight for accurate day comparison
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const diffTime = nowOnly.getTime() - dateOnly.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Today';
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
    const parts = pick.game_id.split('_');
    if (parts.length >= 5) {
      return `${parts[4].toUpperCase()} @ ${parts[3].toUpperCase()}`;
    }
    return pick.game_id;
  };

  const formatPickChoice = (pick: PickHistoryItem) => {
    // For spread/moneyline picks - show actual team name
    if (pick.team_picked && pick.games) {
      const teamName = pick.team_picked === 'home' ? pick.games.home_team : pick.games.away_team;
      return teamName;
    }
    
    // Fallback if no games data - try to parse from game_id
    if (pick.team_picked) {
      const parts = pick.game_id.split('_');
      if (parts.length >= 5) {
        const awayTeam = parts[4].toUpperCase();
        const homeTeam = parts[3].toUpperCase();
        return pick.team_picked === 'home' ? homeTeam : awayTeam;
      }
    }
    
    return pick.team_picked?.toUpperCase() || pick.pick?.toUpperCase() || '';
  };

  const formatOverUnderChoice = (pick: PickHistoryItem) => {
    if (!pick.over_under_pick) return null;
    const line = pick.games?.over_under_line;
    if (line) {
      return `${pick.over_under_pick === 'over' ? 'Over' : 'Under'} ${line}`;
    }
    return pick.over_under_pick === 'over' ? 'Over' : 'Under';
  };

  const formatScore = (pick: PickHistoryItem) => {
    if (!pick.games) return null;
    // Check for both null and undefined
    if (pick.games.home_score == null || pick.games.away_score == null) return null;
    return `${pick.games.away_team} ${pick.games.away_score} - ${pick.games.home_team} ${pick.games.home_score}`;
  };

  const stats = getFilteredStats();
  const winRate = stats.correct + stats.incorrect > 0
    ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
    : 0;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/home');
    }
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
          <Text style={styles.statLabel}>Wins</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{stats.incorrect}</Text>
          <Text style={styles.statLabel}>Losses</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF6B35' }]}>
            {winRate}%
          </Text>
          <Text style={styles.statLabel}>Win Rate</Text>
        </View>
      </View>

      {/* Sport Filter */}
      {availableLeagues.length > 2 && (
        <ScrollView
          horizontal
          style={styles.filterContainer}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {availableLeagues.map(league => (
            <TouchableOpacity
              key={league}
              style={[styles.filterChip, sportFilter === league && styles.filterChipActive]}
              onPress={() => setSportFilter(league)}
            >
              <Text style={[styles.filterChipText, sportFilter === league && styles.filterChipTextActive]}>
                {league === 'all' ? 'All Sports' : league}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Result Filter Tabs */}
      <ScrollView
        horizontal
        style={styles.filterContainer}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterContent}
      >
        {['all', 'correct', 'incorrect', 'upcoming', 'unresolved'].map(filterType => (
          <TouchableOpacity
            key={filterType}
            style={[styles.filterChip, filter === filterType && styles.filterChipActive]}
            onPress={() => setFilter(filterType)}
          >
            <Text style={[styles.filterChipText, filter === filterType && styles.filterChipTextActive]}>
              {filterType === 'all' ? 'All' :
               filterType === 'correct' ? '✅ Wins' :
               filterType === 'incorrect' ? '❌ Losses' :
               filterType === 'upcoming' ? '⏳ Upcoming' : '❓ Unresolved'}
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
              {filter === 'all' ? 'No picks yet' : 
               filter === 'upcoming' ? 'No upcoming picks' : `No ${filter} picks`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'all' 
                ? 'Start making picks to see your history here!'
                : filter === 'upcoming'
                ? 'All your picks have been resolved!'
                : `You don't have any ${filter} picks yet.`
              }
            </Text>
          </View>
        ) : (
          getFilteredPicks().map(pick => {
            const resultColor = getResultColor(pick);
            const isWeekBased = ['NFL', 'NCAAF'].includes(pick.games?.league ?? '');
            const isExpanded = expandedIds.has(pick.id);
            return (
              <TouchableOpacity
                key={pick.id}
                activeOpacity={0.85}
                onPress={() => toggleExpand(pick.id)}
                style={[styles.pickCard, { borderLeftColor: resultColor }]}
              >
                {/* Always visible: meta + game title + result icon */}
                <View style={styles.pickHeader}>
                  <View style={styles.pickMeta}>
                    {pick.games?.league && (
                      <View style={styles.leagueBadge}>
                        <Text style={styles.leagueBadgeText}>{pick.games.league}</Text>
                      </View>
                    )}
                    <Text style={styles.pickDate}>{formatDate(pick.created_at)}</Text>
                    {pick.pick_type === 'group' && (
                      <View style={styles.groupBadge}>
                        <Text style={styles.groupBadgeText}>GROUP</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.resultIcon}>{getResultIcon(pick)}</Text>
                </View>

                {/* Collapsed: show picked team + confidence + result */}
                <View style={styles.pickTitleRow}>
                  <View style={styles.pickRowLeft}>
                    <Text style={styles.pickChoice}>
                      {pick.team_picked ? formatPickChoice(pick) : formatOverUnderChoice(pick) ?? '—'}
                    </Text>
                    {pick.team_picked && (
                      <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(pick.confidence) + '33', borderColor: getConfidenceColor(pick.confidence) }]}>
                        <Text style={[styles.confidenceText, { color: getConfidenceColor(pick.confidence) }]}>{pick.confidence || 'Medium'}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <>
                    <View style={styles.divider} />

                    {/* Full matchup */}
                    <Text style={styles.matchupText}>{formatGameTitle(pick)}</Text>

                    {/* Final score */}
                    {formatScore(pick) && (
                      <Text style={styles.finalScore}>{formatScore(pick)}</Text>
                    )}

                    {/* O/U pick (if separate from spread) */}
                    {pick.over_under_pick && pick.team_picked && (
                      <View style={[styles.pickRow, { marginTop: 8 }]}>
                        <View style={styles.pickRowLeft}>
                          <Text style={styles.pickChoiceSmall}>{formatOverUnderChoice(pick)}</Text>
                          <View style={[styles.confidenceBadge, { backgroundColor: getConfidenceColor(pick.over_under_confidence || 'Medium') + '33', borderColor: getConfidenceColor(pick.over_under_confidence || 'Medium') }]}>
                            <Text style={[styles.confidenceText, { color: getConfidenceColor(pick.over_under_confidence || 'Medium') }]}>{pick.over_under_confidence || 'Medium'}</Text>
                          </View>
                        </View>
                        {pick.over_under_correct !== null && (
                          <Text style={[styles.pickResultText, { color: pick.over_under_correct ? '#34C759' : '#FF3B30' }]}>
                            {pick.over_under_correct ? 'Correct' : 'Incorrect'}
                          </Text>
                        )}
                      </View>
                    )}

                    {pick.reasoning && pick.reasoning !== 'No reasoning provided' && (
                      <Text style={styles.reasoningText}>"{pick.reasoning}"</Text>
                    )}

                    {isWeekBased && pick.week ? (
                      <Text style={styles.weekText}>Week {pick.week}</Text>
                    ) : null}
                  </>
                )}
              </TouchableOpacity>
            );
          })
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
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500', // default orange; overridden inline
  },
  pickHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  leagueBadge: {
    backgroundColor: '#FF6B3522',
    borderWidth: 1,
    borderColor: '#FF6B35',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leagueBadgeText: {
    color: '#FF6B35',
    fontSize: 10,
    fontWeight: '700',
  },
  groupBadge: {
    backgroundColor: '#007AFF22',
    borderWidth: 1,
    borderColor: '#007AFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupBadgeText: {
    color: '#007AFF',
    fontSize: 10,
    fontWeight: '700',
  },
  pickDate: {
    color: '#8E8E93',
    fontSize: 12,
  },
  resultIcon: {
    fontSize: 20,
  },
  pickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  pickGame: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
    marginRight: 8,
  },
  chevron: {
    color: '#555',
    fontSize: 10,
  },
  matchupText: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 2,
  },
  finalScore: {
    color: '#8E8E93',
    fontSize: 12,
    marginBottom: 4,
  },
  pickChoiceSmall: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#2C2C2E',
    marginVertical: 10,
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  pickRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pickChoice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  pickResultText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  confidenceText: {
    fontSize: 11,
    fontWeight: '700',
  },
  reasoningText: {
    color: '#8E8E93',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
  },
  weekText: {
    color: '#555',
    fontSize: 11,
    marginTop: 8,
  },
});