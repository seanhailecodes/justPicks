import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase, calculatePayout, getCurrencySymbol } from '../lib/supabase';
import FeedbackModal from '../../components/FeedbackModal';
import { Sport, getSportConfig } from '../../services/pickrating';
import { APP_SPORTS, SPORT_EMOJI, getDefaultSport, isSportInSeason } from '../../services/activeSport';
import { useSortedSports } from '../../services/useSortedSports';

// Sport logos placeholder (add images here as you expand)
const SPORT_LOGOS: Partial<Record<Sport, any>> = {};

interface SportStats {
  totalPicks: number;
  correctPicks: number;
  incorrectPicks: number;
  upcomingPicks: number;
  winRate: number;
  spreadAccuracy: { percentage: number; wins: number; total: number };
  overUnderAccuracy: { percentage: number; wins: number; total: number };
  tier: string;
  lastWeek?: { record: string; winRate: number };
  lastMonth?: { record: string; winRate: number };
  season?: { record: string; winRate: number };
  pnl?: { amount: number; currency: string } | null;
}

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  created_at: string;
}

const defaultSportStats: SportStats = {
  totalPicks: 0,
  correctPicks: 0,
  incorrectPicks: 0,
  upcomingPicks: 0,
  winRate: 0,
  spreadAccuracy: { percentage: 0, wins: 0, total: 0 },
  overUnderAccuracy: { percentage: 0, wins: 0, total: 0 },
  tier: 'Bronze',
};

const defaultUserProfile: UserProfile = {
  id: '',
  username: null,
  display_name: null,
  email: null,
  created_at: new Date().toISOString()
};

export default function ProfileScreen() {
  const [selectedSport, setSelectedSport] = useState<Sport>(getDefaultSport());
  const [hiddenIdentity, setHiddenIdentity] = useState(true);
  const [showFeedback, setShowFeedback] = useState(false);
  const [sportStats, setSportStats] = useState<Record<Sport, SportStats>>({} as Record<Sport, SportStats>);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const sortedSports = useSortedSports(userProfile?.id ?? null);

  const sportScrollRef = useRef<ScrollView>(null);

  const menuItems = [
    { id: 'history',    title: 'Pick History',  icon: '📊' },
    { id: 'howItWorks', title: 'How it Works',  icon: '🎯' },
    { id: 'feedback',   title: 'Send Feedback', icon: '💬' },
    { id: 'support',    title: 'Support',       icon: '❓' },
  ];

  useEffect(() => {
    loadUserData();
  }, []);

  // Reload stats when sport changes
  useEffect(() => {
    if (userProfile?.id && !sportStats[selectedSport]) {
      loadSportStats(userProfile.id, selectedSport);
    }
  }, [selectedSport, userProfile]);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Set basic profile
        setUserProfile({
          id: user.id,
          username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
          display_name: null,
          email: user.email || null,
          created_at: user.created_at || new Date().toISOString()
        });
        
        // Load stats for default sport
        await loadSportStats(user.id, getDefaultSport());
        
        // userSports is derived from AVAILABLE_SPORTS — no setter needed
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setUserProfile(defaultUserProfile);
    } finally {
      setLoading(false);
    }
  };

  const loadSportStats = async (userId: string, sport: Sport) => {
    try {
      // Map sport key to league name in database — must match APP_SPORTS[].league values
      const leagueMap: Record<string, string> = {
        nfl:    'NFL',
        nba:    'NBA',
        ncaab:  'NCAAB',
        ncaaf:  'NCAAF',
        nhl:    'NHL',
        mlb:    'MLB',
        soccer: 'SOCCER',
        ufc:    'UFC',
        pga:    'PGA',
      };

      const league = leagueMap[sport];
      if (!league) {
        setSportStats(prev => ({ ...prev, [sport]: defaultSportStats }));
        return;
      }

      // Get all picks for user
      const { data: allPicks, error: picksError } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', userId);

      if (picksError) {
        console.error('Error fetching picks:', picksError);
        setSportStats(prev => ({ ...prev, [sport]: defaultSportStats }));
        return;
      }

      // Get game IDs from picks
      const gameIds = [...new Set(allPicks?.map(p => p.game_id) || [])];
      
      if (gameIds.length === 0) {
        setSportStats(prev => ({ ...prev, [sport]: defaultSportStats }));
        return;
      }

      // Get games for those picks — exclude voided games so they don't count as pending
      const { data: games, error: gamesError } = await supabase
        .from('games')
        .select('id, league, game_status')
        .in('id', gameIds)
        .eq('league', league)
        .neq('game_status', 'voided');

      if (gamesError) {
        console.error('Error fetching games:', gamesError);
        setSportStats(prev => ({ ...prev, [sport]: defaultSportStats }));
        return;
      }

      // Filter picks to only those for this league
      const leagueGameIds = new Set(games?.map(g => g.id) || []);
      const picks = allPicks?.filter(p => leagueGameIds.has(p.game_id)) || [];

      // Calculate statistics
      const totalPicks = picks.length;
      const correctPicks = picks.filter(p => p.correct === true).length;
      const incorrectPicks = picks.filter(p => p.correct === false).length;
      const pendingPicks = picks.filter(p => p.correct === null).length;
      
      const decidedPicks = correctPicks + incorrectPicks;
      const winRate = decidedPicks > 0 ? Math.round((correctPicks / decidedPicks) * 100) : 0;

      // Spread accuracy
      const spreadPicks = picks.filter(p => p.team_picked);
      const spreadCorrect = spreadPicks.filter(p => p.correct === true).length;
      const spreadDecided = spreadPicks.filter(p => p.correct !== null).length;
      const spreadPercentage = spreadDecided > 0 ? Math.round((spreadCorrect / spreadDecided) * 100) : 0;

      // Over/Under accuracy
      const ouPicks = picks.filter(p => p.over_under_pick);
      const ouCorrect = ouPicks.filter(p => p.over_under_correct === true).length;
      const ouDecided = ouPicks.filter(p => p.over_under_correct !== null).length;
      const ouPercentage = ouDecided > 0 ? Math.round((ouCorrect / ouDecided) * 100) : 0;

      // Last week (7 days)
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const lastWeekPicks = picks.filter(p => new Date(p.created_at) >= oneWeekAgo);
      const lwWins = lastWeekPicks.filter(p => p.correct === true).length;
      const lwLosses = lastWeekPicks.filter(p => p.correct === false).length;
      const lwTotal = lwWins + lwLosses;

      // Last month (30 days)
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      const lastMonthPicks = picks.filter(p => new Date(p.created_at) >= oneMonthAgo);
      const lmWins = lastMonthPicks.filter(p => p.correct === true).length;
      const lmLosses = lastMonthPicks.filter(p => p.correct === false).length;
      const lmTotal = lmWins + lmLosses;

      // P&L — only for decided picks that have a wager_amount
      const wageredPicks = picks.filter(p => p.wager_amount != null && p.correct !== null);
      let pnl: { amount: number; currency: string } | null = null;
      if (wageredPicks.length > 0) {
        const currency = wageredPicks[wageredPicks.length - 1].currency || 'USD';
        const total = wageredPicks.reduce((sum, p) => {
          return sum + (p.correct ? calculatePayout(p.wager_amount) : -p.wager_amount);
        }, 0);
        pnl = { amount: parseFloat(total.toFixed(2)), currency };
      }

      const stats: SportStats = {
        totalPicks: decidedPicks,
        correctPicks,
        incorrectPicks,
        upcomingPicks: pendingPicks,
        winRate,
        spreadAccuracy: { percentage: spreadPercentage, wins: spreadCorrect, total: spreadDecided },
        overUnderAccuracy: { percentage: ouPercentage, wins: ouCorrect, total: ouDecided },
        tier: getTierFromWinRate(winRate),
        lastWeek: lwTotal > 0 ? { record: `${lwWins}-${lwLosses}`, winRate: Math.round((lwWins / lwTotal) * 100) } : undefined,
        lastMonth: lmTotal > 0 ? { record: `${lmWins}-${lmLosses}`, winRate: Math.round((lmWins / lmTotal) * 100) } : undefined,
        pnl,
      };

      setSportStats(prev => ({ ...prev, [sport]: stats }));
    } catch (error) {
      console.error('Error loading sport stats:', error);
      setSportStats(prev => ({ ...prev, [sport]: defaultSportStats }));
    }
  };

  const getTierFromWinRate = (winRate: number): string => {
    if (winRate >= 70) return 'Diamond';
    if (winRate >= 60) return 'Gold';
    if (winRate >= 50) return 'Silver';
    return 'Bronze';
  };

  const handleMenuPress = (itemId: string) => {
    if (itemId === 'history') {
      router.push('/history/picks');
    } else if (itemId === 'howItWorks') {
      router.push('/onboarding');
    } else if (itemId === 'feedback') {
      setShowFeedback(true);
    } else if (itemId === 'support') {
      router.push('/support');
    }
  };

  const handleSignOut = async () => {
    try {
      router.replace('/(auth)/login');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return '#00D4FF';
      case 'Gold': return '#FFD700';
      case 'Silver': return '#C0C0C0';
      case 'Bronze': return '#CD7F32';
      default: return '#8E8E93';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'Diamond': return '💎';
      case 'Gold': return '🥇';
      case 'Silver': return '🥈';
      case 'Bronze': return '🥉';
      default: return '🎯';
    }
  };

  const getTierWidth = (tier: string) => {
    switch (tier) {
      case 'Diamond': return '100%';
      case 'Gold': return '75%';
      case 'Silver': return '50%';
      case 'Bronze': return '25%';
      default: return '0%';
    }
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'Diamond':
        return '• Elite picker with proven track record\n• Excellent across all pick types\n• Trusted by the community';
      case 'Gold':
        return '• Strong, consistent performer\n• Good balance of risk and reward\n• Above average in most categories';
      case 'Silver':
        return '• Solid fundamental picker\n• Prefers safer picks\n• Building confidence and skills';
      case 'Bronze':
        return '• New or developing picker\n• Learning the ropes\n• Focus on improving accuracy';
      default:
        return '';
    }
  };

  const formatMemberSince = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  // Get display name for sport tab (handle soccer_epl -> Soccer)
  const getSportDisplayName = (sport: Sport): string => {
    const config = getSportConfig(sport);
    if (sport === 'soccer_epl') return 'Soccer';
    return config?.shortName || sport.toUpperCase();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading profile...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading profile data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStats = sportStats[selectedSport] || defaultSportStats;
  const sportConfig = getSportConfig(selectedSport);
  const displayName = userProfile.display_name || userProfile.username || 'PickMaster';
  const sportDisplayName = getSportDisplayName(selectedSport);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Sport Tabs */}
      <ScrollView
        ref={sportScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.sportTabsContainer}
        contentContainerStyle={styles.sportTabsContent}
      >
        {sortedSports.map(({ key: sport, enabled, emoji, label, season }) => {
          const isSelected = selectedSport === sport;
          const inSeason = enabled && isSportInSeason(season);
          const isComingSoon = !enabled;
          const isOffSeason = enabled && !inSeason;
          const logo = SPORT_LOGOS[sport];

          return (
            <TouchableOpacity
              key={sport}
              style={[
                styles.sportTab,
                isSelected && styles.sportTabActive,
                isOffSeason && styles.sportTabOffSeason,
                isComingSoon && styles.sportTabDisabled,
              ]}
              onPress={() => !isComingSoon && setSelectedSport(sport)}
              disabled={isComingSoon}
            >
              {logo ? (
                <Image source={logo} style={styles.sportLogo} resizeMode="contain" />
              ) : emoji ? (
                <Text style={[styles.sportEmoji, (isOffSeason || isComingSoon) && styles.sportEmojiDisabled]}>{emoji}</Text>
              ) : null}
              <Text style={[
                styles.sportTabText,
                isSelected && styles.sportTabTextActive,
                isOffSeason && styles.sportTabTextOffSeason,
                isComingSoon && styles.sportTabTextDisabled,
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🎯</Text>
          </View>
          <Text style={styles.username}>{displayName}</Text>
          <Text style={styles.profileInfo}>
            {hiddenIdentity ? 'Hidden Identity' : userProfile.email} • Member since {formatMemberSince(userProfile.created_at)}
          </Text>
        </View>

        {/* Sport-Specific Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statsCardHeader}>
            <Text style={styles.sectionTitle}>{sportDisplayName} Record</Text>
            <View style={[styles.tierBadge, { backgroundColor: getTierColor(currentStats.tier) + '33' }]}>
              <Text style={[styles.tierBadgeText, { color: getTierColor(currentStats.tier) }]}>
                {getTierIcon(currentStats.tier)} {currentStats.tier}
              </Text>
            </View>
          </View>

          {/* Main Stats */}
          <View style={styles.mainStatsRow}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{currentStats.winRate}%</Text>
              <Text style={styles.mainStatLabel}>Win Rate</Text>
            </View>
            <View style={styles.mainStatDivider} />
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatRecord}>
                {currentStats.correctPicks}-{currentStats.incorrectPicks}
              </Text>
              <Text style={styles.mainStatLabel}>Season Record</Text>
            </View>
          </View>

          {/* Picks Summary */}
          <View style={styles.picksSummary}>
            <View style={styles.picksSummaryItem}>
              <Text style={styles.picksSummaryValue}>{currentStats.totalPicks}</Text>
              <Text style={styles.picksSummaryLabel}>Total Picks</Text>
            </View>
            <TouchableOpacity
              style={styles.picksSummaryItem}
              onPress={() => router.push('/history/picks?initialFilter=upcoming')}
              disabled={currentStats.upcomingPicks === 0}
            >
              <Text style={[styles.picksSummaryValue, { color: '#FF9500' }]}>
                {currentStats.upcomingPicks}
              </Text>
              <Text style={[styles.picksSummaryLabel, currentStats.upcomingPicks > 0 && { color: '#FF9500' }]}>
                Pending {currentStats.upcomingPicks > 0 ? '›' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {/* P&L row — only shown when user has wagered picks */}
          {currentStats.pnl != null && (
            <View style={styles.pnlRow}>
              <Text style={styles.pnlLabel}>💰 Season P&L</Text>
              <Text style={[
                styles.pnlValue,
                { color: currentStats.pnl.amount >= 0 ? '#34C759' : '#FF3B30' }
              ]}>
                {currentStats.pnl.amount >= 0 ? '+' : ''}
                {getCurrencySymbol(currentStats.pnl.currency)}
                {Math.abs(currentStats.pnl.amount).toFixed(2)}
              </Text>
            </View>
          )}

          {/* Breakdown */}
          <View style={styles.breakdownSection}>
            <Text style={styles.breakdownTitle}>BREAKDOWN</Text>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Spread:</Text>
              <Text style={styles.breakdownValue}>
                {currentStats.spreadAccuracy.percentage}% ({currentStats.spreadAccuracy.wins}/{currentStats.spreadAccuracy.total})
              </Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Over/Under:</Text>
              <Text style={styles.breakdownValue}>
                {currentStats.overUnderAccuracy.percentage}% ({currentStats.overUnderAccuracy.wins}/{currentStats.overUnderAccuracy.total})
              </Text>
            </View>
          </View>

          {/* Time Period Stats */}
          {(currentStats.lastWeek || currentStats.lastMonth) && (
            <View style={styles.timePeriodSection}>
              <Text style={styles.breakdownTitle}>RECENT PERFORMANCE</Text>
              {currentStats.lastWeek && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Last Week:</Text>
                  <Text style={styles.breakdownValue}>
                    {currentStats.lastWeek.record} ({currentStats.lastWeek.winRate}%)
                  </Text>
                </View>
              )}
              {currentStats.lastMonth && (
                <View style={styles.breakdownRow}>
                  <Text style={styles.breakdownLabel}>Last Month:</Text>
                  <Text style={styles.breakdownValue}>
                    {currentStats.lastMonth.record} ({currentStats.lastMonth.winRate}%)
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Tier Rating Card */}
        <View style={styles.tierCard}>
          <Text style={styles.sectionTitle}>{sportDisplayName} Picker Rating</Text>
          <View style={styles.tierBarContainer}>
            <View style={[styles.tierBar, { 
              width: getTierWidth(currentStats.tier), 
              backgroundColor: getTierColor(currentStats.tier) 
            }]} />
          </View>
          <Text style={[styles.tierLevelText, { color: getTierColor(currentStats.tier) }]}>
            {getTierIcon(currentStats.tier)} {currentStats.tier} Tier
          </Text>
          <Text style={styles.tierDescription}>
            {getTierDescription(currentStats.tier)}
          </Text>
        </View>

        {/* Identity Settings */}
        <View style={styles.identityCard}>
          <Text style={styles.sectionTitle}>Identity Settings</Text>
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Hidden Identity</Text>
            <Switch
              value={hiddenIdentity}
              onValueChange={setHiddenIdentity}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor={hiddenIdentity ? '#FFF' : '#8E8E93'}
            />
          </View>
          <Text style={styles.switchDescription}>
            Your real name is hidden from other users
          </Text>
        </View>

        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map(item => (
            <TouchableOpacity 
              key={item.id} 
              style={styles.menuItem}
              onPress={() => handleMenuPress(item.id)}
            >
              <View style={styles.menuItemLeft}>
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={styles.menuTitle}>{item.title}</Text>
              </View>
              <Text style={styles.menuArrow}>›</Text>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FeedbackModal visible={showFeedback} onClose={() => setShowFeedback(false)} />
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
  errorText: {
    color: '#FF3B30',
    fontSize: 16,
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
  settingsIcon: {
    fontSize: 24,
  },
  sportTabsContainer: {
    maxHeight: 50,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  sportTabsContent: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sportTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    gap: 6,
  },
  sportTabActive: {
    backgroundColor: '#FF6B35',
  },
  sportLogo: {
    width: 20,
    height: 20,
  },
  sportEmoji: {
    fontSize: 16,
  },
  sportTabText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  sportTabTextActive: {
    color: '#FFF',
  },
  sportTabOffSeason: {
    opacity: 0.5,
    borderWidth: 1,
    borderColor: '#444',
  },
  sportTabTextOffSeason: {
    color: '#666',
  },
  sportTabDisabled: {
    opacity: 0.25,
  },
  sportTabTextDisabled: {
    color: '#444',
  },
  sportEmojiDisabled: {
    opacity: 0.4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 16,
    paddingBottom: 100,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    backgroundColor: '#1C1C1E',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  avatarEmoji: {
    fontSize: 40,
  },
  username: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileInfo: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  statsCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tierBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  mainStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  mainStatItem: {
    alignItems: 'center',
    flex: 1,
  },
  mainStatDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  mainStatValue: {
    color: '#FF6B35',
    fontSize: 36,
    fontWeight: 'bold',
  },
  mainStatRecord: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  mainStatLabel: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 4,
  },
  picksSummary: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  picksSummaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  picksSummaryValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  picksSummaryLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
  },
  pnlRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
    marginTop: 4,
  },
  pnlLabel: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pnlValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  breakdownSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  breakdownTitle: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  breakdownLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  breakdownValue: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  timePeriodSection: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    marginTop: 8,
  },
  tierCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  tierBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginTop: 16,
    marginBottom: 12,
  },
  tierBar: {
    height: 8,
    borderRadius: 4,
  },
  tierLevelText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  tierDescription: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
  },
  identityCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  switchLabel: {
    color: '#FFF',
    fontSize: 16,
  },
  switchDescription: {
    color: '#8E8E93',
    fontSize: 13,
  },
  menuContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  menuTitle: {
    color: '#FFF',
    fontSize: 16,
  },
  menuArrow: {
    color: '#8E8E93',
    fontSize: 20,
  },
  signOutButton: {
    padding: 16,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});