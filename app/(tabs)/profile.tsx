import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function ProfileScreen() {
  const [hiddenIdentity, setHiddenIdentity] = useState(true);

  const userStats = {
    accuracy: 73,
    riskLevel: 'Diamond',  // Diamond, Gold, Silver, Bronze
    totalPicks: 180,
    spreadAccuracy: { percentage: 68, wins: 34, total: 50 },
    moneylineAccuracy: { percentage: 81, wins: 65, total: 80 },
    overUnderAccuracy: { percentage: 72, wins: 36, total: 50 },
    parlayAccuracy: { percentage: 45, wins: 9, total: 20 },
  };

  const menuItems = [
    { id: 'history', title: 'Pick History', icon: '📊' },
    { id: 'friends', title: 'Friends & Groups', icon: '👥' },
    { id: 'privacy', title: 'Privacy Settings', icon: '🔒' },
    { id: 'account', title: 'Account Settings', icon: '⚙️' },
    { id: 'support', title: 'Support', icon: '❓' },
  ];

  const handleMenuPress = (itemId: string) => {
    if (itemId === 'history') {
      router.push('/history/picks');
    } else {
      // TODO: Navigate to other screens
      console.log('Navigate to:', itemId);
    }
  };

  const handleSignOut = () => {
    // TODO: Implement sign out
    router.replace('/(auth)/login');
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
          <Text style={styles.username}>PickMaster47</Text>
          <Text style={styles.profileInfo}>Hidden Identity • Member since Dec 2024</Text>
          <Text style={[styles.riskLevel, { color: getRiskLevelColor(userStats.riskLevel) }]}>
            💎 {userStats.riskLevel} Tier Picker
          </Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Prediction Profile</Text>
          
          <View style={styles.mainStats}>
            <View style={styles.mainStatItem}>
              <Text style={styles.mainStatValue}>{userStats.accuracy}%</Text>
              <Text style={styles.mainStatLabel}>Accuracy</Text>
            </View>
            <View style={styles.mainStatItem}>
              <Text style={[styles.mainStatValue, { color: getRiskLevelColor(userStats.riskLevel), fontSize: 24 }]}>
                💎 {userStats.riskLevel}
              </Text>
              <Text style={styles.mainStatLabel}>Tier Rating</Text>
            </View>
          </View>

          <View style={styles.detailedStats}>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Spread Picks:</Text>
              <Text style={[styles.statRowValue, { color: '#FF9500' }]}>
                {userStats.spreadAccuracy.percentage}% ({userStats.spreadAccuracy.wins}/{userStats.spreadAccuracy.total})
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Moneyline:</Text>
              <Text style={[styles.statRowValue, { color: '#34C759' }]}>
                {userStats.moneylineAccuracy.percentage}% ({userStats.moneylineAccuracy.wins}/{userStats.moneylineAccuracy.total})
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Over/Under:</Text>
              <Text style={[styles.statRowValue, { color: '#FF6B35' }]}>
                {userStats.overUnderAccuracy.percentage}% ({userStats.overUnderAccuracy.wins}/{userStats.overUnderAccuracy.total})
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statRowLabel}>Parlays (2-3 legs):</Text>
              <Text style={[styles.statRowValue, { color: '#FF3B30' }]}>
                {userStats.parlayAccuracy.percentage}% ({userStats.parlayAccuracy.wins}/{userStats.parlayAccuracy.total})
              </Text>
            </View>
          </View>
        </View>

        {/* Risk Assessment */}
        <View style={styles.riskCard}>
          <Text style={styles.sectionTitle}>Picker Rating</Text>
          <View style={styles.riskBarContainer}>
            <View style={[styles.riskBar, { width: getRiskLevelWidth(userStats.riskLevel), backgroundColor: getRiskLevelColor(userStats.riskLevel) }]} />
          </View>
          <Text style={[styles.riskLevelText, { color: getRiskLevelColor(userStats.riskLevel) }]}>
            💎 {userStats.riskLevel} Tier
          </Text>
          <Text style={styles.riskDescription}>
            {getRiskLevelDescription(userStats.riskLevel)}
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