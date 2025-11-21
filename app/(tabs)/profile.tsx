import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase, getUserStats, getUserProfile } from '../lib/supabase';

interface UserStats {
  accuracy: number;
  totalPicks: number;
  correctPicks: number;
  incorrectPicks: number;
  wrongPicks: number;
  pendingPicks: number;
  spreadAccuracy: { percentage: number; wins: number; total: number };
  overUnderAccuracy: { percentage: number; wins: number; total: number };
  winRate: number;
  currentWeek: number;
  currentWeekPicks: number;
  decidedPicks: number;
  lastWeek?: { record: string; winRate: number };
  lastMonth?: { record: string; winRate: number };
  season?: { record: string; winRate: number };
  allTime?: { record: string; winRate: number };
}

interface UserProfile {
  id: string;
  username: string | null;
  display_name: string | null;
  email: string | null;
  created_at: string;
}

const defaultUserStats: UserStats = {
  accuracy: 0,
  totalPicks: 0,
  correctPicks: 0,
  incorrectPicks: 0,
  wrongPicks: 0,
  pendingPicks: 0,
  spreadAccuracy: { percentage: 0, wins: 0, total: 0 },
  overUnderAccuracy: { percentage: 0, wins: 0, total: 0 },
  winRate: 0,
  currentWeek: 1,
  currentWeekPicks: 0,
  decidedPicks: 0
};

const defaultUserProfile: UserProfile = {
  id: '',
  username: null,
  display_name: null,
  email: null,
  created_at: new Date().toISOString()
};

export default function ProfileScreen() {
  const [hiddenIdentity, setHiddenIdentity] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

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

  const loadUserData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      // Set default stats first
      setUserStats(defaultUserStats);
      
      // Set basic profile
      setUserProfile({
        id: user.id,
        username: user.user_metadata?.username || user.email?.split('@')[0] || 'User',
        display_name: null,
        email: user.email || null,
        created_at: user.created_at || new Date().toISOString()
      });
      
      // Try to load real stats (but don't fail if it doesn't work)
      try {
        const statsResult = await getUserStats(user.id);
        if (statsResult?.success && statsResult?.data) {
        setUserStats({
            ...defaultUserStats,
            totalPicks: statsResult.data.totalPicks || 0,
            correctPicks: statsResult.data.correctPicks || 0,
            incorrectPicks: statsResult.data.incorrectPicks || 0,
            wrongPicks: statsResult.data.incorrectPicks || 0,
            pendingPicks: statsResult.data.pendingPicks || 0,
            winRate: statsResult.data.winRate || 0,
            accuracy: statsResult.data.winRate || 0,
            currentWeek: statsResult.data.currentWeek || 1,
            currentWeekPicks: statsResult.data.currentWeekPicks || 0,
            decidedPicks: statsResult.data.decidedPicks || 0,
            spreadAccuracy: statsResult.data.spreadAccuracy || { percentage: 0, wins: 0, total: 0 },
            overUnderAccuracy: statsResult.data.overUnderAccuracy || { percentage: 0, wins: 0, total: 0 },
            // Time period data
            lastWeek: statsResult.data.lastWeek,
            lastMonth: statsResult.data.lastMonth,
            season: statsResult.data.season,
            allTime: statsResult.data.allTime
          });
        }
      } catch (statsError) {
        console.log('Stats loading failed, using defaults');
      }
    }
  } catch (error) {
    console.error('Error loading user data:', error);
    setUserStats(defaultUserStats);
    setUserProfile(defaultUserProfile);
  } finally {
    setLoading(false);
  }
};

  const handleMenuPress = (itemId: string) => {
    if (itemId === 'history') {
      router.push('/history/picks');
    } else {
      // TODO: Navigate to other screens
      console.log('Navigate to:', itemId);
    }
  };

  const handleSignOut = async () => {
    try {
      router.replace('/(auth)/login'); // Redirect FIRST
      await supabase.auth.signOut(); // Then sign out
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getRiskLevel = (accuracy: number) => {
    if (accuracy >= 70) return 'Diamond';
    if (accuracy >= 60) return 'Gold';
    if (accuracy >= 50) return 'Silver';
    return 'Bronze';
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'Diamond':
        return '#00D4FF';
      case 'Gold':
        return '#FFD700';
      case 'Silver':
        return '#C0C0C0';
      case 'Bronze':
        return '#CD7F32';
      default:
        return '#8E8E93';
    }
  };

  const getRiskLevelWidth = (level: string) => {
    switch (level) {
      case 'Diamond':
        return '100%';
      case 'Gold':
        return '75%';
      case 'Silver':
        return '50%';
      case 'Bronze':
        return '25%';
      default:
        return '0%';
    }
  };

  const getRiskLevelDescription = (level: string) => {
    switch (level) {
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

  if (!userStats || !userProfile) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading profile data</Text>
        </View>
      </SafeAreaView>
    );
  }

  const riskLevel = getRiskLevel(userStats.accuracy);
  const displayName = userProfile.display_name || userProfile.username || 'PickMaster';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <TouchableOpacity>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

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
          <Text style={[styles.riskLevel, { color: getRiskLevelColor(riskLevel) }]}>
            {riskLevel === 'Diamond' ? '💎' : riskLevel === 'Gold' ? '🥇' : riskLevel === 'Silver' ? '🥈' : '🥉'} {riskLevel} Tier Picker
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Prediction Profile</Text>
          
          {/* Time Period Stats */}
          <View style={styles.timePeriodStats}>
            <View style={styles.timePeriodRow}>
              <Text style={styles.timePeriodLabel}>Last Week:</Text>
              <Text style={styles.timePeriodValue}>
                {userStats.lastWeek?.record || '0-0'} ({userStats.lastWeek?.winRate || 0}%)
              </Text>
            </View>
            <View style={styles.timePeriodRow}>
              <Text style={styles.timePeriodLabel}>Last Month:</Text>
              <Text style={styles.timePeriodValue}>
                {userStats.lastMonth?.record || '0-0'} ({userStats.lastMonth?.winRate || 0}%)
              </Text>
            </View>
            <View style={styles.timePeriodRow}>
              <Text style={styles.timePeriodLabel}>Season 2025:</Text>
              <Text style={[styles.timePeriodValue, styles.timePeriodHighlight]}>
                {userStats.season?.record || '0-0'} ({userStats.season?.winRate || 0}%)
              </Text>
            </View>
            <View style={styles.timePeriodRow}>
              <Text style={styles.timePeriodLabel}>All Time:</Text>
              <Text style={styles.timePeriodValue}>
                {userStats.allTime?.record || '0-0'} ({userStats.allTime?.winRate || 0}%)
              </Text>
            </View>
          </View>

          <View style={styles.mainStats}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{userStats.accuracy}%</Text>
              <Text style={styles.mainStatLabel}>Season Accuracy</Text>
            </View>
            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: getRiskLevelColor(riskLevel), fontSize: 24 }]}>
                {riskLevel === 'Diamond' ? '💎' : riskLevel === 'Gold' ? '🥇' : riskLevel === 'Silver' ? '🥈' : '🥉'} {riskLevel}
              </Text>
              <Text style={styles.mainStatLabel}>Tier Rating</Text>
            </View>
          </View>

          <View style={styles.detailedStats}>
            <Text style={styles.detailedStatsTitle}>Season Breakdown:</Text>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Spread Picks:</Text>
              <Text style={[styles.statRowValue, { color: '#FF9500' }]}>
                {userStats.spreadAccuracy.percentage}% ({userStats.spreadAccuracy.wins}/{userStats.spreadAccuracy.total})
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Over/Under:</Text>
              <Text style={[styles.statRowValue, { color: '#FF6B35' }]}>
                {userStats.overUnderAccuracy.percentage}% ({userStats.overUnderAccuracy.wins}/{userStats.overUnderAccuracy.total})
              </Text>
            </View>
          </View>

          {/* Total Picks Summary */}
          <View style={styles.totalPicksRow}>
            <Text style={styles.totalPicksLabel}>Total Picks: {userStats.totalPicks}</Text>
            <Text style={styles.totalPicksBreakdown}>
              ✅ {userStats.correctPicks} • ❌ {userStats.wrongPicks} • ⏳ {userStats.pendingPicks}
            </Text>
          </View>
        </View>

        {/* Risk Assessment */}
        <View style={styles.riskCard}>
          <Text style={styles.sectionTitle}>Picker Rating</Text>
          <View style={styles.riskBarContainer}>
            <View style={[styles.riskBar, { width: getRiskLevelWidth(riskLevel), backgroundColor: getRiskLevelColor(riskLevel) }]} />
          </View>
          <Text style={[styles.riskLevelText, { color: getRiskLevelColor(riskLevel) }]}>
            {riskLevel === 'Diamond' ? '💎' : riskLevel === 'Gold' ? '🥇' : riskLevel === 'Silver' ? '🥈' : '🥉'} {riskLevel} Tier
          </Text>
          <Text style={styles.riskDescription}>
            {getRiskLevelDescription(riskLevel)}
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
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
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  timePeriodStats: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  timePeriodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  timePeriodLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  timePeriodValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  timePeriodHighlight: {
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  mainStatItem: {
    alignItems: 'center',
  },
  mainStatValue: {
    color: '#FF6B35',
    fontSize: 32,
    fontWeight: 'bold',
  },
  mainStatLabel: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 4,
  },
  detailedStats: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
  },
  detailedStatsTitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statRowLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statRowValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  totalPicksRow: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 16,
    marginTop: 8,
    alignItems: 'center',
  },
  totalPicksLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  totalPicksBreakdown: {
    color: '#8E8E93',
    fontSize: 14,
  },
  riskCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  riskBarContainer: {
    height: 8,
    backgroundColor: '#333',
    borderRadius: 4,
    marginBottom: 12,
  },
  riskBar: {
    height: 8,
    borderRadius: 4,
  },
  riskLevelText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  riskDescription: {
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