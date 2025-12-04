import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

interface PublicGroup {
  id: string;
  name: string;
  created_by: string;
  visibility: string;
  require_approval: boolean;
  invite_code: string;
  created_at: string;
  sport: string;
  memberCount: number;
  ownerUsername: string;
}

export default function BrowseGroupsScreen() {
  const [groups, setGroups] = useState<PublicGroup[]>([]);
  const [filteredGroups, setFilteredGroups] = useState<PublicGroup[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [joiningGroupId, setJoiningGroupId] = useState<string | null>(null);

  useEffect(() => {
    loadPublicGroups();
  }, []);

  useEffect(() => {
    // Filter groups based on search query
    if (searchQuery.trim() === '') {
      setFilteredGroups(groups);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = groups.filter(group => 
        group.name.toLowerCase().includes(query) ||
        group.ownerUsername.toLowerCase().includes(query)
      );
      setFilteredGroups(filtered);
    }
  }, [searchQuery, groups]);

  const loadPublicGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Get groups the user is already a member of
      const { data: userMemberships } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('user_id', user.id);

      const memberGroupIds = new Set(userMemberships?.map(m => m.group_id) || []);

      // Get all public groups
      const { data: publicGroups, error: groupsError } = await supabase
        .from('groups')
        .select('*')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });

      if (groupsError) {
        console.error('Error fetching public groups:', groupsError);
        throw groupsError;
      }

      console.log('Public groups found:', publicGroups?.length || 0);

      // Filter out groups user is already a member of (in JS - more reliable than Supabase .not())
      const availableGroups = (publicGroups || []).filter(
        group => !memberGroupIds.has(group.id)
      );

      console.log('Available groups (excluding already joined):', availableGroups.length);

      // Get member counts and owner info for each group
      const groupsWithDetails = await Promise.all(
        availableGroups.map(async (group) => {
          // Get member count
          const { count } = await supabase
            .from('group_members')
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id);

          // Get owner username
          const { data: ownerData } = await supabase
            .from('profiles')
            .select('username, display_name')
            .eq('id', group.created_by)
            .single();

          return {
            ...group,
            memberCount: count || 0,
            ownerUsername: ownerData?.username || ownerData?.display_name || 'Unknown'
          };
        })
      );

      setGroups(groupsWithDetails);
      setFilteredGroups(groupsWithDetails);
    } catch (error) {
      console.error('Error loading public groups:', error);
      Alert.alert('Error', 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinGroup = async (group: PublicGroup) => {
    if (!currentUserId) {
      Alert.alert('Error', 'You must be logged in to join groups');
      return;
    }

    setJoiningGroupId(group.id);

    try {
      if (group.require_approval) {
        // Create join request (future feature)
        Alert.alert(
          'Approval Required',
          'This group requires owner approval. This feature is coming soon!',
          [{ text: 'OK' }]
        );
        setJoiningGroupId(null);
        return;
      } else {
        // Join directly
        const { error } = await supabase
          .from('group_members')
          .insert({
            group_id: group.id,
            user_id: currentUserId,
            role: 'member'
          });

        if (error) throw error;

        Alert.alert(
          'Success!',
          `You've joined "${group.name}"!`,
          [
            {
              text: 'OK',
              onPress: () => router.replace('/(tabs)/groups')
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
    } finally {
      setJoiningGroupId(null);
    }
  };

  const getSportEmoji = (sport: string) => {
    switch (sport) {
      case 'nfl': return '🏈';
      case 'nba': return '🏀';
      case 'mlb': return '⚾';
      case 'nhl': return '🏒';
      case 'soccer_epl': return '⚽';
      default: return '🏈';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Browse Groups</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search groups..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filteredGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No groups found' : 'No public groups available'}
            </Text>
            <Text style={styles.emptyText}>
              {searchQuery 
                ? 'Try a different search term'
                : 'Create your own group to get started!'}
            </Text>
          </View>
        ) : (
          filteredGroups.map((group) => (
            <View key={group.id} style={styles.groupCard}>
              <View style={styles.groupHeader}>
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupOwner}>by @{group.ownerUsername}</Text>
                  <View style={styles.groupBadges}>
                    <View style={styles.sportBadge}>
                      <Text style={styles.badgeText}>
                        {getSportEmoji(group.sport)} {(group.sport || 'nfl').toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.publicBadge}>
                      <Text style={styles.badgeText}>🌐 Public</Text>
                    </View>
                    {group.require_approval && (
                      <View style={styles.approvalBadge}>
                        <Text style={styles.badgeText}>✓ Approval Required</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={styles.memberCount}>{group.memberCount} members</Text>
              </View>

              <Text style={styles.groupDate}>
                Created {new Date(group.created_at).toLocaleDateString()}
              </Text>

              <TouchableOpacity 
                style={[
                  styles.joinButton,
                  joiningGroupId === group.id && styles.joinButtonDisabled
                ]}
                onPress={() => handleJoinGroup(group)}
                disabled={joiningGroupId === group.id}
              >
                <Text style={styles.joinButtonText}>
                  {joiningGroupId === group.id 
                    ? 'Joining...' 
                    : group.require_approval 
                      ? '✉️ Request to Join' 
                      : '➕ Join Group'}
                </Text>
              </TouchableOpacity>
            </View>
          ))
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#FFF',
    fontSize: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 12,
    margin: 16,
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupOwner: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 8,
  },
  groupBadges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  sportBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  publicBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  approvalBadge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  memberCount: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  groupDate: {
    color: '#666',
    fontSize: 12,
    marginBottom: 16,
  },
  joinButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    opacity: 0.5,
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
});