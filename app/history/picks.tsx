import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getUserPickHistory, supabase, calculatePayout, getCurrencySymbol } from '../lib/supabase';
import { APP_SPORTS } from '../../services/activeSport';

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
  wager_amount?: number | null;
  potential_win?: number | null;
  currency?: string | null;
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

// Map DB league value → emoji using the single source of truth
const getLeagueEmoji = (league: string): string => {
  const sport = APP_SPORTS.find(s => s.league === league);
  return sport?.emoji ?? '🏆';
};

const RESULT_FILTERS = [
  { key: 'all',       label: 'All',      icon: '' },
  { key: 'correct',   label: 'Wins',     icon: '✅' },
  { key: 'incorrect', label: 'Losses',   icon: '❌' },
  { key: 'upcoming',  label: 'Upcoming', icon: '⏳' },
];

export default function PickHistoryScreen() {
  const { initialFilter } = useLocalSearchParams<{ initialFilter?: string }>();
  const [filter, setFilter] = useState(initialFilter ?? 'all');
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

  // Derive unique leagues present in history (preserving APP_SPORTS order)
  const availableLeagues = ['all', ...APP_SPORTS
    .map(s => s.league)
    .filter(league => pickHistory.some(p => p.games?.league === league))
  ];

  const getFilteredPicks = () => {
    let picks = pickHistory;
    if (sportFilter !== 'all') picks = picks.filter(p => p.games?.league === sportFilter);
    if (filter === 'correct')   return picks.filter(p => p.correct === true);
    if (filter === 'incorrect') return picks.filter(p => p.correct === false);
    if (filter === 'upcoming')  return picks.filter(p => p.correct === null && !isGameInPast(p));
    return picks;
  };

  const getFilteredStats = () => {
    const picks = sportFilter === 'all' ? pickHistory : pickHistory.filter(p => p.games?.league === sportFilter);
    const wageredPicks = picks.filter(p => p.wager_amount != null);
    const resolvedWagers = wageredPicks.filter(p => p.correct !== null);
    const pnlTotal = resolvedWagers.reduce((sum, p) => {
      const payout = p.potential_win ?? calculatePayout(p.wager_amount!);
      return sum + (p.correct ? payout : -p.wager_amount!);
    }, 0);
    const currency = wageredPicks.length > 0 ? (wageredPicks[wageredPicks.length - 1].currency || 'USD') : 'USD';

    // Streak: picks are returned newest-first from history, oldest-first for streak calc
    const resolved = [...picks]
      .filter(p => p.correct !== null)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    let currentStreak = 0;
    let streakType: 'win' | 'loss' | 'none' = 'none';
    let bestStreak = 0;
    let runningWin = 0;
    if (resolved.length > 0) {
      const newest = [...resolved].reverse();
      const first = newest[0].correct;
      streakType = first ? 'win' : 'loss';
      for (const p of newest) {
        if (p.correct === first) currentStreak++;
        else break;
      }
      for (const p of resolved) {
        if (p.correct === true) { runningWin++; if (runningWin > bestStreak) bestStreak = runningWin; }
        else runningWin = 0;
      }
    }

    return {
      correct:       picks.filter(p => p.correct === true).length,
      incorrect:     picks.filter(p => p.correct === false).length,
      upcoming:      picks.filter(p => p.correct === null && !isGameInPast(p)).length,
      wagersEntered: wageredPicks.length,
      pnl:           resolvedWagers.length > 0 ? parseFloat(pnlTotal.toFixed(2)) : null,
      pnlCurrency:   currency,
      currentStreak,
      streakType,
      bestStreak,
    };
  };

  const getResultColor = (pick: PickHistoryItem) => {
    if (pick.correct === true)  return '#34C759';
    if (pick.correct === false) return '#FF3B30';
    if (isGameInPast(pick))     return '#8E8E93';
    return '#FF9500';
  };

  const getResultIcon = (pick: PickHistoryItem) => {
    if (pick.correct === true)  return '✅';
    if (pick.correct === false) return '❌';
    if (isGameInPast(pick))     return '❓';
    return '⏳';
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence?.toLowerCase()) {
      case 'high':   return '#34C759';
      case 'medium': return '#FF9500';
      case 'low':    return '#FF3B30';
      default:       return '#8E8E93';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now  = new Date();
    const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const nowOnly  = new Date(now.getFullYear(),  now.getMonth(),  now.getDate());
    const diffDays = Math.round((nowOnly.getTime() - dateOnly.getTime()) / 86400000);
    if (diffDays <= 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7)  return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatPickChoice = (pick: PickHistoryItem) => {
    if (pick.team_picked && pick.games) {
      return pick.team_picked === 'home' ? pick.games.home_team : pick.games.away_team;
    }
    if (pick.team_picked) {
      const parts = pick.game_id.split('_');
      if (parts.length >= 5) {
        return pick.team_picked === 'home'
          ? parts[3].toUpperCase()
          : parts[4].toUpperCase();
      }
    }
    return pick.team_picked?.toUpperCase() || pick.pick?.toUpperCase() || '';
  };

  const formatGameTitle = (pick: PickHistoryItem) => {
    if (pick.games) return `${pick.games.away_team} @ ${pick.games.home_team}`;
    const parts = pick.game_id.split('_');
    if (parts.length >= 5) return `${parts[4].toUpperCase()} @ ${parts[3].toUpperCase()}`;
    return pick.game_id;
  };

  const formatOverUnderChoice = (pick: PickHistoryItem) => {
    if (!pick.over_under_pick) return null;
    const line = pick.games?.over_under_line;
    const dir  = pick.over_under_pick === 'over' ? 'Over' : 'Under';
    return line ? `${dir} ${line}` : dir;
  };

  const formatScore = (pick: PickHistoryItem) => {
    if (!pick.games || pick.games.home_score == null || pick.games.away_score == null) return null;
    return `${pick.games.away_team} ${pick.games.away_score} – ${pick.games.home_team} ${pick.games.home_score}`;
  };

  const stats = getFilteredStats();
  const winRate = stats.correct + stats.incorrect > 0
    ? Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100)
    : 0;

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
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
          <Text style={styles.loadingText}>Loading pick history…</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Pick History</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Stats bar */}
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#34C759' }]}>{stats.correct}</Text>
          <Text style={styles.statLabel}>Wins</Text>
          {stats.wagersEntered > 0 && (
            <Text style={styles.statSublabel}>{stats.wagersEntered} wagered</Text>
          )}
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF3B30' }]}>{stats.incorrect}</Text>
          <Text style={styles.statLabel}>Losses</Text>
          {stats.wagersEntered > 0 && (
            <Text style={styles.statSublabel}> </Text>
          )}
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FF9500' }]}>{winRate}%</Text>
          <Text style={styles.statLabel}>Win Rate</Text>
          {stats.pnl != null && (
            <Text style={[styles.statSublabel, { color: stats.pnl >= 0 ? '#34C759' : '#FF3B30', fontWeight: '700' }]}>
              {stats.pnl >= 0 ? '+' : ''}{getCurrencySymbol(stats.pnlCurrency)}{Math.abs(stats.pnl).toFixed(2)}
            </Text>
          )}
        </View>
      </View>

      {/* Streak banner */}
      {stats.currentStreak >= 2 && (
        <View style={[
          styles.streakBanner,
          stats.streakType === 'win' ? styles.streakBannerWin : styles.streakBannerLoss,
        ]}>
          <Text style={styles.streakBannerEmoji}>
            {stats.streakType === 'win' ? '🔥' : '🥶'}
          </Text>
          <Text style={[
            styles.streakBannerText,
            stats.streakType === 'win' ? styles.streakBannerTextWin : styles.streakBannerTextLoss,
          ]}>
            {stats.currentStreak} {stats.streakType === 'win' ? 'win' : 'loss'} streak
            {stats.streakType === 'win' && stats.bestStreak > stats.currentStreak
              ? `  ·  Best: ${stats.bestStreak}`
              : ''}
          </Text>
        </View>
      )}

      {/* Sport filter — only shown when 2+ sports present */}
      {availableLeagues.length > 2 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabsContainer}
          contentContainerStyle={styles.tabsContent}
        >
          {availableLeagues.map(league => {
            const active = sportFilter === league;
            const emoji  = league === 'all' ? '🏆' : getLeagueEmoji(league);
            const label  = league === 'all' ? 'All Sports' : league;
            return (
              <TouchableOpacity
                key={league}
                style={[styles.sportTab, active && styles.sportTabActive]}
                onPress={() => setSportFilter(league)}
              >
                <Text style={styles.sportTabEmoji}>{emoji}</Text>
                <Text style={[styles.sportTabText, active && styles.sportTabTextActive]}>{label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Result filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabsContainer}
        contentContainerStyle={styles.tabsContent}
      >
        {RESULT_FILTERS.map(({ key, label, icon }) => {
          const active = filter === key;
          return (
            <TouchableOpacity
              key={key}
              style={[styles.sportTab, active && styles.sportTabActive]}
              onPress={() => setFilter(key)}
            >
              {icon ? <Text style={styles.sportTabEmoji}>{icon}</Text> : null}
              <Text style={[styles.sportTabText, active && styles.sportTabTextActive]}>{label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Pick list */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {getFilteredPicks().length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              {filter === 'upcoming' ? 'No upcoming picks' : filter === 'all' ? 'No picks yet' : `No ${filter === 'correct' ? 'wins' : 'losses'} yet`}
            </Text>
            <Text style={styles.emptyStateSubtext}>
              {filter === 'upcoming' ? 'All your picks have been resolved!' : 'Start making picks to build your history.'}
            </Text>
          </View>
        ) : (
          getFilteredPicks().map(pick => {
            const resultColor = getResultColor(pick);
            const isWeekBased = ['NFL', 'NCAAF'].includes(pick.games?.league ?? '');
            const isExpanded  = expandedIds.has(pick.id);
            return (
              <TouchableOpacity
                key={pick.id}
                activeOpacity={0.85}
                onPress={() => toggleExpand(pick.id)}
                style={[styles.pickCard, { borderLeftColor: resultColor }]}
              >
                {/* Top row: league badge + date + group badge + result icon */}
                <View style={styles.pickHeader}>
                  <View style={styles.pickMeta}>
                    {pick.games?.league && (
                      <View style={styles.leagueBadge}>
                        <Text style={styles.leagueBadgeText}>
                          {getLeagueEmoji(pick.games.league)} {pick.games.league}
                        </Text>
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

                {/* Picked team + confidence + wager + chevron */}
                <View style={styles.pickTitleRow}>
                  <View style={styles.pickRowLeft}>
                    <Text style={styles.pickChoice}>
                      {pick.team_picked ? formatPickChoice(pick) : (formatOverUnderChoice(pick) ?? '—')}
                    </Text>
                    {pick.confidence && (
                      <View style={[styles.confidenceBadge, {
                        backgroundColor: getConfidenceColor(pick.confidence) + '22',
                        borderColor: getConfidenceColor(pick.confidence),
                      }]}>
                        <Text style={[styles.confidenceText, { color: getConfidenceColor(pick.confidence) }]}>
                          {pick.confidence}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.pickCardRight}>
                    {pick.wager_amount != null ? (
                      <Text style={[
                        styles.inlineWager,
                        pick.correct === true  && styles.inlineWagerWon,
                        pick.correct === false && styles.inlineWagerLost,
                      ]}>
                        {getCurrencySymbol(pick.currency || 'USD')}{pick.wager_amount.toFixed(2)}
                      </Text>
                    ) : pick.correct === null && (
                      <TouchableOpacity
                        onPress={() => {
                          const league = pick.games?.league?.toLowerCase() || 'nba';
                          router.push(`/(tabs)/games?gameId=${pick.game_id}&sport=${league}`);
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.addWagerLink}>💰 Add</Text>
                      </TouchableOpacity>
                    )}
                    <Text style={styles.chevron}>{isExpanded ? '▲' : '▼'}</Text>
                  </View>
                </View>

                {/* Expanded details */}
                {isExpanded && (
                  <>
                    <View style={styles.divider} />
                    <Text style={styles.matchupText}>{formatGameTitle(pick)}</Text>
                    {formatScore(pick) && (
                      <Text style={styles.finalScore}>{formatScore(pick)}</Text>
                    )}
                    {pick.over_under_pick && pick.team_picked && (
                      <View style={[styles.pickRow, { marginTop: 8 }]}>
                        <View style={styles.pickRowLeft}>
                          <Text style={styles.pickChoiceSmall}>{formatOverUnderChoice(pick)}</Text>
                          <View style={[styles.confidenceBadge, {
                            backgroundColor: getConfidenceColor(pick.over_under_confidence || 'Medium') + '22',
                            borderColor: getConfidenceColor(pick.over_under_confidence || 'Medium'),
                          }]}>
                            <Text style={[styles.confidenceText, { color: getConfidenceColor(pick.over_under_confidence || 'Medium') }]}>
                              {pick.over_under_confidence || 'Medium'}
                            </Text>
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
                    {pick.wager_amount != null && (
                      <View style={styles.wagerRow}>
                        <Text style={styles.wagerText}>
                          💰 Wagered {getCurrencySymbol(pick.currency || 'USD')}{pick.wager_amount.toFixed(2)}
                        </Text>
                        {pick.correct === true && (
                          <Text style={styles.wagerWon}>
                            +{getCurrencySymbol(pick.currency || 'USD')}{(pick.potential_win ?? calculatePayout(pick.wager_amount!)).toFixed(2)}
                          </Text>
                        )}
                        {pick.correct === false && (
                          <Text style={styles.wagerLost}>
                            -{getCurrencySymbol(pick.currency || 'USD')}{pick.wager_amount.toFixed(2)}
                          </Text>
                        )}
                      </View>
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
    fontSize: 15,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    padding: 4,
    width: 40,
  },
  backIcon: {
    color: '#FFF',
    fontSize: 32,
    lineHeight: 34,
  },
  title: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  placeholder: {
    width: 40,
  },
  // ── Stats bar ──────────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    paddingVertical: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#333',
  },
  statNumber: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statSublabel: {
    color: '#636366',
    fontSize: 11,
    marginTop: 3,
    fontWeight: '500',
  },
  // ── Streak banner ──────────────────────────────────────────
  streakBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  streakBannerWin: {
    backgroundColor: '#34C75918',
    borderWidth: 1,
    borderColor: '#34C75950',
  },
  streakBannerLoss: {
    backgroundColor: '#FF3B3018',
    borderWidth: 1,
    borderColor: '#FF3B3050',
  },
  streakBannerEmoji: {
    fontSize: 18,
  },
  streakBannerText: {
    fontSize: 14,
    fontWeight: '700',
  },
  streakBannerTextWin: {
    color: '#34C759',
  },
  streakBannerTextLoss: {
    color: '#FF3B30',
  },
  // ── Filter tabs (shared by sport + result rows) ────────────
  tabsContainer: {
    maxHeight: 50,
    marginTop: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#1C1C1E',
  },
  tabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 8,
    alignItems: 'center',
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  sportTabActive: {
    backgroundColor: '#FF6B35',
  },
  sportTabEmoji: {
    fontSize: 14,
  },
  sportTabText: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
  },
  sportTabTextActive: {
    color: '#FFF',
  },
  // ── Pick list ──────────────────────────────────────────────
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
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  // ── Pick card ──────────────────────────────────────────────
  pickCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
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
    gap: 6,
    flex: 1,
  },
  leagueBadge: {
    backgroundColor: '#FF6B3518',
    borderWidth: 1,
    borderColor: '#FF6B3560',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  leagueBadgeText: {
    color: '#FF6B35',
    fontSize: 11,
    fontWeight: '700',
  },
  groupBadge: {
    backgroundColor: '#007AFF18',
    borderWidth: 1,
    borderColor: '#007AFF60',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  groupBadgeText: {
    color: '#007AFF',
    fontSize: 11,
    fontWeight: '700',
  },
  pickDate: {
    color: '#636366',
    fontSize: 12,
    fontWeight: '500',
  },
  resultIcon: {
    fontSize: 18,
  },
  pickTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    flexShrink: 1,
  },
  pickCardRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inlineWager: {
    color: '#636366',
    fontSize: 13,
    fontWeight: '600',
  },
  addWagerLink: {
    color: '#FF6B35',
    fontSize: 12,
    fontWeight: '600',
  },
  inlineWagerWon: {
    color: '#34C759',
  },
  inlineWagerLost: {
    color: '#FF3B30',
  },
  chevron: {
    color: '#48484A',
    fontSize: 10,
    marginLeft: 8,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#2C2C2E',
    marginVertical: 10,
  },
  matchupText: {
    color: '#8E8E93',
    fontSize: 13,
    marginBottom: 2,
  },
  finalScore: {
    color: '#636366',
    fontSize: 12,
    marginBottom: 4,
  },
  pickChoiceSmall: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  pickRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
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
    color: '#636366',
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 6,
    lineHeight: 17,
  },
  weekText: {
    color: '#48484A',
    fontSize: 11,
    marginTop: 8,
  },
  wagerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  wagerText: {
    color: '#8E8E93',
    fontSize: 12,
  },
  wagerWon: {
    color: '#34C759',
    fontSize: 12,
    fontWeight: '700',
  },
  wagerLost: {
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '700',
  },
});
