import { router } from 'expo-router';
import { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Image, ImageSourcePropType, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase, getUserStats, getUserProfile } from '../lib/supabase';
import { Sport, getSportConfig } from '../../services/pickrating';

// Sport logos - uncomment as you add logo files
const SPORT_LOGOS: Partial<Record<Sport, ImageSourcePropType>> = {
  // nfl: require('../../assets/images/nfl.png'),
  // nba: require('../../assets/images/nba.png'),
};

// Fallback emojis
const SPORT_EMOJIS: Partial<Record<Sport, string>> = {
  nfl: '🏈',
  ncaaf: '🏈',
  nba: '🏀',
  ncaab: '🏀',
  soccer_epl: '⚽',
  ufc: '🥊',
};

// Sports user has made picks in (will be dynamic later)
const AVAILABLE_SPORTS: Sport[] = ['nfl'];

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
  const [selectedSport, setSelectedSport] = useState<Sport>('nfl');
  const [hiddenIdentity, setHiddenIdentity] = useState(true);
  const [sportStats, setSportStats] = useState<Record<Sport, SportStats>>({} as Record<Sport, SportStats>);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [userSports, setUserSports] = useState<Sport[]>(['nfl']); // Sports user has picks in

  const sportScrollRef = useRef<ScrollView>(null);

  const menuItems = [
    { id: 'history', title: 'Pick History', icon: '📊' },
    { id: 'friends', title: 'Friends & Groups', icon: '👥' },
    { id: 'privacy', title: 'Privacy Settings', icon: '🔒' },
    { id: 'account', title: 'Account Settings', icon: '⚙️' },
    { id: 'support', title: 'Support', icon: '❓' },
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
        
        // Load stats for default sport (NFL)
        await loadSportStats(user.id, 'nfl');
        
        // TODO: Fetch which sports user has picks in
        // For now, just NFL
        setUserSports(['nfl']);
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
      // For now, use existing getUserStats (which is NFL-focused)
      // TODO: Update getUserStats to accept sport parameter
      const statsResult = await getUserStats(userId);
      
      if (statsResult?.success && statsResult?.data) {
        const decidedPicks = (statsResult.data.correctPicks || 0) + (statsResult.data.incorrectPicks || 0);
        
        const stats: SportStats = {
          totalPicks: decidedPicks,
          correctPicks: statsResult.data.correctPicks || 0,
          incorrectPicks: statsResult.data.incorrectPicks || 0,
          upcomingPicks: statsResult.data.upcomingPicks ?? statsResult.data.pendingPicks ?? 0,
          winRate: statsResult.data.winRate || 0,
          spreadAccuracy: statsResult.data.spreadAccuracy || { percentage: 0, wins: 0, total: 0 },
          overUnderAccuracy: statsResult.data.overUnderAccuracy || { percentage: 0, wins: 0, total: 0 },
          tier: getTierFromWinRate(statsResult.data.winRate || 0),
          lastWeek: statsResult.data.lastWeek,
          lastMonth: statsResult.data.lastMonth,
          season: statsResult.data.season,
        };
        
        setSportStats(prev => ({
          ...prev,
          [sport]: stats
        }));
      } else {
        setSportStats(prev => ({
          ...prev,
          [sport]: defaultSportStats
        }));
      }
    } catch (error) {
      console.error('Error loading sport stats:', error);
      setSportStats(prev => ({
        ...prev,
        [sport]: defaultSportStats
      }));
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
    } else {
      console.log('Navigate to:', itemId);
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
        {userSports.map(sport => {
          const config = getSportConfig(sport);
          const isSelected = selectedSport === sport;
          const logo = SPORT_LOGOS[sport];
          const emoji = SPORT_EMOJIS[sport];

          return (
            <TouchableOpacity
              key={sport}
              style={[styles.sportTab, isSelected && styles.sportTabActive]}
              onPress={() => setSelectedSport(sport)}
            >
              {logo ? (
                <Image source={logo} style={styles.sportLogo} resizeMode="contain" />
              ) : emoji ? (
                <Text style={styles.sportEmoji}>{emoji}</Text>
              ) : null}
              <Text style={[styles.sportTabText, isSelected && styles.sportTabTextActive]}>
                {config.shortName}
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
            <Text style={styles.sectionTitle}>{sportConfig.shortName} Record</Text>
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
            <View style={styles.picksSummaryItem}>
              <Text style={[styles.picksSummaryValue, { color: '#FF9500' }]}>
                {currentStats.upcomingPicks}
              </Text>
              <Text style={styles.picksSummaryLabel}>Upcoming</Text>
            </View>
          </View>

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
          <Text style={styles.sectionTitle}>{sportConfig.shortName} Picker Rating</Text>
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