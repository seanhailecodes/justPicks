import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening!</Text>
          <Text style={styles.userName}>Hey Alex</Text>
        </View>
        <TouchableOpacity>
          <Ionicons name="notifications-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Your Prediction Accuracy</Text>
          <Text style={styles.statsValue}>73%</Text>
          <View style={styles.statsBreakdown}>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statCorrect]}>24</Text>
              <Text style={styles.statLabel}>Correct</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statWrong]}>9</Text>
              <Text style={styles.statLabel}>Wrong</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, styles.statPending]}>3</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Welcome to justPicks!</Text>
        <Text style={styles.welcomeText}>
          Start making predictions with your friends. Join a group or create your own to get started.
        </Text>
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
});