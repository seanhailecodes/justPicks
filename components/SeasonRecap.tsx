// SeasonRecap.tsx
//
// End-of-season summary for a group, shown on the group-picks
// screen when the group's sport is out of season (or when an
// older season is selected). Replaces the week-by-week strip.
//
// Five cards: Leaderboard, Hot Streaks, Biggest Misses, Trends,
// Season Totals. Data comes from getSeasonRecap() — every card
// hides itself when it has nothing real to show.

import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getSeasonRecap, SeasonRecapData } from '../app/lib/database';

interface SeasonRecapProps {
  groupId: string;
  season: number;
  seasonLabel: string;
  // Public groups display fun aliases instead of real names.
  resolveName?: (userId: string, fallback: string) => string;
}

export default function SeasonRecap({ groupId, season, seasonLabel, resolveName }: SeasonRecapProps) {
  const [recap, setRecap] = useState<SeasonRecapData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getSeasonRecap(groupId, season)
      .then(data => { if (!cancelled) setRecap(data); })
      .catch(err => { console.error('Season recap error:', err); if (!cancelled) setRecap(null); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [groupId, season]);

  const name = (userId: string, fallback: string) =>
    resolveName ? resolveName(userId, fallback) : fallback;

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Building {seasonLabel} recap…</Text>
      </View>
    );
  }

  if (!recap || !recap.hasData) {
    return (
      <View style={styles.centered}>
        <Text style={{ fontSize: 36, marginBottom: 12 }}>📅</Text>
        <Text style={styles.emptyTitle}>No {seasonLabel} recap yet</Text>
        <Text style={styles.emptySub}>
          Once this group's {seasonLabel} picks are graded, the season
          summary will appear here.
        </Text>
      </View>
    );
  }

  const medal = (i: number) => (i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`);

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.screenTitle}>{seasonLabel} Season Recap</Text>
      <Text style={styles.screenSub}>
        {recap.scoredPicks} graded picks · {recap.pickerCount} member
        {recap.pickerCount === 1 ? '' : 's'}
      </Text>

      {/* ---- Leaderboard ---- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Leaderboard</Text>
        {recap.leaderboard.map((m, i) => (
          <View key={m.userId} style={[styles.row, i === 0 && styles.rowTop]}>
            <Text style={styles.rank}>{medal(i)}</Text>
            <View style={styles.rowMain}>
              <Text style={styles.rowName}>{name(m.userId, m.name)}</Text>
              <Text style={styles.rowMeta}>
                {m.wins}-{m.picks - m.wins} · {m.picks} picks
              </Text>
            </View>
            <Text style={[styles.rowStat, i === 0 && styles.rowStatTop]}>{m.accuracy}%</Text>
          </View>
        ))}
      </View>

      {/* ---- Hot Streaks ---- */}
      {recap.hotStreaks.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🔥 Hot Streaks</Text>
          {recap.hotStreaks.map(m => (
            <View key={m.userId} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{name(m.userId, m.name)}</Text>
                <Text style={styles.rowMeta}>
                  {m.currentStreak > 0
                    ? `Riding ${m.currentStreak} straight`
                    : m.currentStreak < 0
                      ? `Cooled off (${-m.currentStreak} L)`
                      : 'Season high'}
                </Text>
              </View>
              <Text style={styles.streakStat}>{m.bestStreak} 🔥</Text>
            </View>
          ))}
        </View>
      )}

      {/* ---- Biggest Misses ---- */}
      {recap.biggestMisses.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💀 Biggest Misses</Text>
          <Text style={styles.cardHint}>Didn't cover by the widest margins</Text>
          {recap.biggestMisses.map((miss, i) => (
            <View key={i} style={styles.row}>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>
                  {miss.pickLabel}
                  {miss.badBeat ? '  💔' : ''}
                </Text>
                <Text style={styles.rowMeta}>
                  {name(miss.userId, miss.name)}
                  {miss.matchup ? ` · ${miss.matchup}` : ''}
                </Text>
              </View>
              <Text style={styles.missStat}>−{miss.missedBy}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ---- Trends ---- */}
      {recap.trends.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📈 Trends</Text>
          {recap.trends.map((t, i) => (
            <View key={i} style={styles.trendRow}>
              <Text style={styles.trendEmoji}>{t.emoji}</Text>
              <View style={styles.rowMain}>
                <Text style={styles.rowName}>{t.label}</Text>
                <Text style={styles.rowMeta}>{t.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ---- Season Totals ---- */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Season Totals</Text>
        <View style={styles.totalsRow}>
          <View style={styles.totalCell}>
            <Text style={styles.totalNum}>
              {recap.groupAccuracy != null ? `${recap.groupAccuracy}%` : '—'}
            </Text>
            <Text style={styles.totalLabel}>Group Accuracy</Text>
          </View>
          <View style={styles.totalCell}>
            <Text style={styles.totalNum}>
              {recap.totalCorrect}-{recap.scoredPicks - recap.totalCorrect}
            </Text>
            <Text style={styles.totalLabel}>Record</Text>
          </View>
          <View style={styles.totalCell}>
            <Text style={styles.totalNum}>{recap.scoredPicks}</Text>
            <Text style={styles.totalLabel}>Graded Picks</Text>
          </View>
        </View>
      </View>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 8 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: { color: '#8E8E93', fontSize: 14, marginTop: 12 },
  emptyTitle: { color: '#FFF', fontSize: 17, fontWeight: '700', marginBottom: 6 },
  emptySub: { color: '#8E8E93', fontSize: 13, textAlign: 'center', lineHeight: 19 },

  screenTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  screenSub: { color: '#8E8E93', fontSize: 13, marginTop: 2, marginBottom: 16 },

  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  cardHint: { color: '#8E8E93', fontSize: 12, marginBottom: 8 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  rowTop: { borderTopWidth: 0 },
  rank: {
    width: 30,
    fontSize: 15,
    fontWeight: '700',
    color: '#8E8E93',
  },
  rowMain: { flex: 1 },
  rowName: { color: '#FFF', fontSize: 15, fontWeight: '600' },
  rowMeta: { color: '#8E8E93', fontSize: 12, marginTop: 2 },
  rowStat: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  rowStatTop: { color: '#00E676' },
  streakStat: { color: '#FF6B35', fontSize: 15, fontWeight: '700' },
  missStat: { color: '#FF453A', fontSize: 16, fontWeight: '700' },

  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  trendEmoji: { width: 30, fontSize: 18 },

  totalsRow: { flexDirection: 'row', marginTop: 8 },
  totalCell: { flex: 1, alignItems: 'center' },
  totalNum: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  totalLabel: { color: '#8E8E93', fontSize: 11, marginTop: 4, textAlign: 'center' },
});
