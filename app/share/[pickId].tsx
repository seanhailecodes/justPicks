import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  SafeAreaView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

interface SharedPick {
  id: string;
  pickerName: string;
  pickedTeam: string | null;
  betType: string;
  pickLabel: string;        // "Cowboys -3.5" or "Over 48.5"
  spread: string | null;
  gameTitle: string;        // "DAL @ PHI"
  league: string;
  gameDate: string;
  correct: boolean | null;
  homeScore: number | null;
  awayScore: number | null;
  homeTeam: string;
  awayTeam: string;
}

const LEAGUE_EMOJI: Record<string, string> = {
  NBA: '🏀', NFL: '🏈', NHL: '🏒', NCAAB: '🎓', Soccer: '⚽',
};

export default function SharePickScreen() {
  const { pickId } = useLocalSearchParams<{ pickId: string }>();
  const [loading, setLoading] = useState(true);
  const [pick, setPick] = useState<SharedPick | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (pickId) loadPick();
  }, [pickId]);

  // Inject OG meta tags on web so iMessage / Twitter render a card
  useEffect(() => {
    if (Platform.OS !== 'web' || !pick) return;
    const setMeta = (property: string, content: string) => {
      let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute('property', property);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const emoji = pick.correct === true ? '✅' : pick.correct === false ? '❌' : '⏳';
    const resultText = pick.correct === true ? 'Won' : pick.correct === false ? 'Lost' : 'Pending';
    const scoreText = pick.homeScore != null && pick.awayScore != null
      ? ` · ${pick.awayTeam} ${pick.awayScore}–${pick.homeTeam} ${pick.homeScore}`
      : '';

    setMeta('og:title', `${emoji} ${pick.pickerName} picked ${pick.pickLabel}`);
    setMeta('og:description', `${pick.gameTitle}${scoreText} · ${resultText} · justPicks`);
    setMeta('og:url', `https://justpicks.app/share/${pickId}`);
    setMeta('og:site_name', 'justPicks');

    document.title = `${pick.pickerName}'s pick on justPicks`;
  }, [pick]);

  const loadPick = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('picks')
        .select(`
          id, pick, team_picked, bet_type, over_under_pick,
          correct, user_id,
          games (
            home_team, away_team, home_team_code, away_team_code,
            home_spread, away_spread, over_under_line,
            home_score, away_score, game_date, league
          ),
          profiles (display_name, username)
        `)
        .eq('id', pickId)
        .single();

      if (fetchError || !data) {
        setError('Pick not found.');
        setLoading(false);
        return;
      }

      const game = data.games as any;
      const profile = data.profiles as any;
      const pickerName = profile?.display_name || profile?.username || 'A friend';

      // Build human-readable pick label
      let pickLabel = '';
      if (data.bet_type === 'total' || data.over_under_pick) {
        const line = game?.over_under_line;
        pickLabel = `${data.over_under_pick === 'over' ? 'Over' : 'Under'} ${line ?? ''}`.trim();
      } else {
        // spread or moneyline
        const teamCode = data.team_picked === 'home'
          ? (game?.home_team_code || game?.home_team)
          : (game?.away_team_code || game?.away_team);
        const spreadVal = data.team_picked === 'home' ? game?.home_spread : game?.away_spread;
        const spreadStr = spreadVal != null
          ? ` ${parseFloat(spreadVal) > 0 ? '+' : ''}${parseFloat(spreadVal)}`
          : '';
        pickLabel = `${teamCode}${spreadStr}`;
      }

      const pickedTeam = data.team_picked === 'home'
        ? game?.home_team
        : data.team_picked === 'away'
          ? game?.away_team
          : null;

      const awayCode = game?.away_team_code || game?.away_team || '';
      const homeCode = game?.home_team_code || game?.home_team || '';

      setPick({
        id: data.id,
        pickerName,
        pickedTeam,
        betType: data.bet_type || 'spread',
        pickLabel,
        spread: null,
        gameTitle: `${awayCode} @ ${homeCode}`,
        league: game?.league || 'NBA',
        gameDate: game?.game_date || '',
        correct: data.correct,
        homeScore: game?.home_score ?? null,
        awayScore: game?.away_score ?? null,
        homeTeam: game?.home_team || '',
        awayTeam: game?.away_team || '',
      });

      // Check if current user is the owner
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id === data.user_id) setIsOwner(true);
    } catch (err) {
      console.error('Error loading shared pick:', err);
      setError('Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleShare = async () => {
    if (!pick) return;
    const emoji = pick.correct === true ? '✅' : pick.correct === false ? '❌' : '🎯';
    const resultText = pick.correct === true
      ? ' — and it won!'
      : pick.correct === false
        ? ' — took the L.'
        : ' — still pending.';

    try {
      await Share.share({
        message: `${emoji} I picked ${pick.pickLabel} in ${pick.gameTitle}${resultText}\n\njustpicks.app/share/${pick.id}`,
        url: `https://justpicks.app/share/${pick.id}`,
        title: `${pick.pickerName}'s pick on justPicks`,
      });
    } catch (_) {}
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !pick) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorEmoji}>🤷</Text>
          <Text style={styles.errorTitle}>Pick not found</Text>
          <Text style={styles.errorSub}>{error || 'This pick may have been removed.'}</Text>
          <TouchableOpacity style={styles.ctaButton} onPress={() => router.replace('/(tabs)/home')}>
            <Text style={styles.ctaButtonText}>Go to justPicks</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const emoji = pick.correct === true ? '✅' : pick.correct === false ? '❌' : '⏳';
  const resultLabel = pick.correct === true ? 'COVERED' : pick.correct === false ? "DIDN'T COVER" : 'PENDING';
  const resultColor = pick.correct === true ? '#34C759' : pick.correct === false ? '#FF3B30' : '#8E8E93';
  const leagueEmoji = LEAGUE_EMOJI[pick.league] || '🏆';
  const hasScore = pick.homeScore != null && pick.awayScore != null;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>justPicks</Text>
        </View>

        {/* Pick card */}
        <View style={styles.card}>
          {/* League + result badge */}
          <View style={styles.cardTop}>
            <View style={styles.leagueBadge}>
              <Text style={styles.leagueBadgeText}>{leagueEmoji} {pick.league}</Text>
            </View>
            <View style={[styles.resultBadge, { backgroundColor: resultColor + '22', borderColor: resultColor }]}>
              <Text style={[styles.resultBadgeText, { color: resultColor }]}>{emoji} {resultLabel}</Text>
            </View>
          </View>

          {/* Picker */}
          <Text style={styles.pickerLabel}>{pick.pickerName} picked</Text>

          {/* The pick */}
          <Text style={styles.pickChoice}>{pick.pickLabel}</Text>

          {/* Matchup */}
          <Text style={styles.gameTitle}>{pick.gameTitle}</Text>

          {/* Final score if available */}
          {hasScore && (
            <View style={styles.scoreBadge}>
              <Text style={styles.scoreText}>
                Final: {pick.awayTeam} {pick.awayScore} – {pick.homeTeam} {pick.homeScore}
              </Text>
            </View>
          )}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          {isOwner && (
            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
              <Text style={styles.shareButtonText}>📤 Share This Pick</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => router.replace('/(tabs)/home')}
          >
            <Text style={styles.ctaButtonText}>Make Your Own Picks →</Text>
          </TouchableOpacity>
          <Text style={styles.tagline}>Track picks. No money. Just bragging rights.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12, padding: 32 },
  content: { flex: 1, padding: 24, justifyContent: 'space-between' },
  header: { alignItems: 'center', paddingTop: 8, paddingBottom: 24 },
  appName: { color: '#FF6B35', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#2C2C2E',
    gap: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  leagueBadge: { backgroundColor: '#1C1C1E', borderRadius: 8, paddingVertical: 4, paddingHorizontal: 10 },
  leagueBadgeText: { color: '#8E8E93', fontSize: 12, fontWeight: '600' },
  resultBadge: { borderRadius: 8, borderWidth: 1, paddingVertical: 4, paddingHorizontal: 10 },
  resultBadgeText: { fontSize: 12, fontWeight: '700' },
  pickerLabel: { color: '#636366', fontSize: 13 },
  pickChoice: { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 0.5 },
  gameTitle: { color: '#8E8E93', fontSize: 15, fontWeight: '500' },
  scoreBadge: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  scoreText: { color: '#EBEBF5', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  ctas: { gap: 12, alignItems: 'center' },
  shareButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  shareButtonText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  ctaButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  ctaButtonText: { color: '#EBEBF5', fontSize: 15, fontWeight: '600' },
  tagline: { color: '#3A3A3C', fontSize: 12, textAlign: 'center' },
  errorEmoji: { fontSize: 48 },
  errorTitle: { color: '#FFF', fontSize: 22, fontWeight: '800' },
  errorSub: { color: '#8E8E93', fontSize: 14, textAlign: 'center' },
});
