import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';
import { getFriendsWithStats, getGroupStats, Friend, GroupStats } from '../lib/database';

export default function GroupsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStats>({ activePicks: 0, pendingPicks: 0, totalFriends: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Load friends and stats
      const [friendsData, statsData] = await Promise.all([
        getFriendsWithStats(user.id),
        getGroupStats(user.id)
      ]);

      setFriends(friendsData);
      setGroupStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend => 
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFriend = () => {
    router.push('/(auth)/find-friends');
  };

  const handleViewPicks = () => {
    router.push('/group/group-picks?groups=Work Friends,Family Picks');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#FFF', fontSize: 18 }}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Our Picks</Text>
        <TouchableOpacity onPress={handleAddFriend}>
          <Text style={styles.addButton}>+ Add Friends</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Group Card */}
        <View style={styles.groupCard}>
          <View style={styles.groupHeader}>
            <View>
              <Text style={styles.groupTitle}>Our Picks</Text>
              <Text style={styles.groupSubtitle}>All your friends in one place</Text>
            </View>
            <Text style={styles.memberCount}>{groupStats.totalFriends} friends</Text>
          </View>
          
          <View style={styles.groupStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{groupStats.activePicks}</Text>
              <Text style={styles.statLabel}>Picks Made</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={[styles.statValue, styles.pendingColor]}>{groupStats.pendingPicks}</Text>
              <Text style={styles.statLabel}>Picks Pending</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.discussButton} onPress={handleViewPicks}>
            <Text style={styles.discussButtonText}>See Group Picks →</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search friends..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Friends List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Friends ({friends.length})</Text>
          
          {filteredFriends.map(friend => (
            <View key={friend.id} style={styles.friendCard}>
              <View style={styles.friendInfo}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {friend.username.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View>
                  <Text style={styles.friendName}>@{friend.username}</Text>
                  <Text style={styles.friendStats}>
                    {friend.picks} picks • {friend.accuracy}% accurate
                  </Text>
                </View>
              </View>
              {friend.status === 'pending' && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>Pending</Text>
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Empty State */}
        {friends.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>No friends yet</Text>
            <Text style={styles.emptyText}>
              Add friends to start making picks together
            </Text>
            <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
              <Text style={styles.addFriendButtonText}>Find Friends</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎯 About Our Picks</Text>
          <Text style={styles.infoText}>
            This is your default group with all your friends. Make picks on games and see how you stack up against everyone!
          </Text>
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  addButton: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
  },
  memberCount: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  groupStats: {
    flexDirection: 'row',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#444',
    marginHorizontal: 20,
  },
  pendingColor: {
    color: '#FF9500',
  },
  discussButton: {
    alignItems: 'center',
  },
  discussButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  searchIcon: {
    marginRight: 8,
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  friendCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  friendInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  friendName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  friendStats: {
    color: '#8E8E93',
    fontSize: 13,
  },
  pendingBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFriendButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addFriendButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  infoTitle: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
});