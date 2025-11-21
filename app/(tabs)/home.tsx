import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function HomeScreen() {
  const [displayName, setDisplayName] = useState('');
  const [stats, setStats] = useState({
    correct: 0,
    wrong: 0,
    pending: 0,
    accuracy: 0
  });

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        // Extract name from email (part before @)
        const name = user.email.split('@')[0];
        // Capitalize first letter
        const formattedName = name.charAt(0).toUpperCase() + name.slice(1);
        setDisplayName(formattedName);

        // Fetch user's picks
        const { data: picks } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', user.id);

        if (picks) {
          // Count based on the 'correct' field
          const correct = picks.filter(p => p.correct === true).length;
          const wrong = picks.filter(p => p.correct === false).length;
          const pending = picks.filter(p => p.correct === null).length;
          const total = correct + wrong;
          const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

          setStats({ correct, wrong, pending, accuracy });
        }
      }
    };
    
    fetchUserData();
  }, []);

  return (
    <SafeAreaView style={styles.container}>

      {/* Temporary logout button */}
      <TouchableOpacity
        style={{
          position: 'absolute',
          top: 50,
          right: 20,
          backgroundColor: '#FF3B30',
          padding: 10,
          borderRadius: 8,
          zIndex: 999,
        }}
        onPress={async () => {
          await supabase.auth.signOut();
          router.replace('/(auth)/login');
        }}
      >
        <Text style={{ color: '#FFF', fontWeight: 'bold' }}>LOGOUT</Text>
      </TouchableOpacity>

      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening!</Text>
          <Text style={styles.userName}>Hey {displayName || 'there'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(tabs)/notifications')}>
          <Text style={styles.notificationIcon}>🔔</Text>
          <View style={styles.notificationBadge}>
            <Text style={styles.notificationBadgeText}>2</Text>
          </View>
          <Text style={styles.viewLeaderboard}>View Leaderboard →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Card - Now with real data */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Your Prediction Accuracy</Text>
          <Text style={styles.statsValue}>{stats.accuracy}%</Text>
          <View style={styles.statsBreakdown}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statCorrect]}>{stats.correct}</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statWrong]}>{stats.wrong}</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statPending]}>{stats.pending}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.leaderboardButton}
          onPress={() => router.push('/(tabs)/leaderboard')}
        >
          <Text style={styles.leaderboardButtonText}>🏆 View Leaderboard</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/games')}
          >
            <Text style={styles.actionIcon}>🏈</Text>
            <Text style={styles.actionTitle}>Make Picks</Text>
            <Text style={styles.actionDescription}>View today's games</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/groups')}
          >
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionTitle}>My Groups</Text>
            <Text style={styles.actionDescription}>Chat with friends</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Getting Started</Text>
        <View style={styles.tipsCard}>
          <Text style={styles.tipItem}>• Join or create a group with friends</Text>
          <Text style={styles.tipItem}>• Make picks before games start</Text>
          <Text style={styles.tipItem}>• Track your accuracy over time</Text>
          <Text style={styles.tipItem}>• Compete for the top leaderboard spot</Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  notificationIcon: {
    fontSize: 24,
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FF3B30',
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  greeting: {
    color: '#8E8E93',
    fontSize: 14,
  },
  userName: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  statsLabel: {
    color: '#8E8E93',
    fontSize: 14,
  },
  statsValue: {
    color: '#FF6B35',
    fontSize: 36,
    fontWeight: 'bold',
    marginVertical: 8,
  },
  statsBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  statCorrect: {
    color: '#34C759',
  },
  statWrong: {
    color: '#FF3B30',
  },
  statPending: {
    color: '#FF9500',
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  welcomeText: {
    color: '#8E8E93',
    fontSize: 16,
    lineHeight: 24,
  },
  leaderboardButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginBottom: 20,
  },
  leaderboardButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  actionTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  actionDescription: {
    color: '#8E8E93',
    fontSize: 11,
    textAlign: 'center',
  },
  tipsCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  tipItem: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 4,
  },
  viewLeaderboard: {
    color: '#FF6B35',
    fontSize: 14,
    marginTop: 4,
  },
});