import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Modal, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { getFriendsWithStats, getGroupStats, getUserGroups, Friend, GroupStats, UserGroup } from '../lib/database';

export default function GroupsScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [friends, setFriends] = useState<Friend[]>([]);
  const [groupStats, setGroupStats] = useState<GroupStats>({ activePicks: 0, pendingPicks: 0, totalFriends: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [creatingGroup, setCreatingGroup] = useState(false);
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<UserGroup | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    loadUserAndData();
  }, []);

  const loadUserAndData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No authenticated user');
        setLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      const [friendsData, statsData, groupsData] = await Promise.all([
        getFriendsWithStats(user.id),
        getGroupStats(user.id),
        getUserGroups(user.id)
      ]);

      setFriends(friendsData);
      setGroupStats(statsData);
      setUserGroups(groupsData);
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
    router.push('/group/group-picks?groupId=163b5d2c-fb32-4b34-8ed0-4d39fa9a3a9b&groupName=The%20Syndicate');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    if (!currentUserId) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    setCreatingGroup(true);
    
    try {
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          created_by: currentUserId
        })
        .select()
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUserId,
          role: 'primary_owner'
        });

      if (memberError) throw memberError;

      Alert.alert('Success!', `Group "${newGroupName}" created successfully!`);
      setShowCreateGroupModal(false);
      setNewGroupName('');
      loadUserAndData();
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreatingGroup(false);
    }
  };

  const handleSendInvite = async () => {
    if (!inviteEmail.trim()) {
      Alert.alert('Error', 'Please enter an email address');
      return;
    }

    if (!selectedGroupForInvite || !currentUserId) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    setSendingInvite(true);

    try {
      const { data: invite, error: dbError } = await supabase
        .from('group_invites')
        .insert({
          group_id: selectedGroupForInvite.id,
          invited_by: currentUserId,
          invitee_email: inviteEmail.trim().toLowerCase(),
          status: 'pending',
        })
        .select()
        .single();

      if (dbError) throw dbError;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', currentUserId)
        .single();

      const inviterName = profile?.display_name || profile?.username || 'A friend';

      const { data, error: functionError } = await supabase.functions.invoke('send-invite', {
        body: {
          inviteeEmail: inviteEmail.trim(),
          groupName: selectedGroupForInvite.name,
          inviterName: inviterName,
          groupId: selectedGroupForInvite.id,
          inviteId: invite.id,
        },
      });

      if (functionError) throw functionError;

      Alert.alert(
        '📧 Invite Sent!',
        `We've sent an email invitation to ${inviteEmail}. They'll receive instructions to join "${selectedGroupForInvite.name}".`
      );
      
      setShowInviteModal(false);
      setInviteEmail('');
    } catch (error) {
      console.error('Error sending invite:', error);
      Alert.alert('Error', 'Failed to send invite. Please try again.');
    } finally {
      setSendingInvite(false);
    }
  };

  // Helper function to format accuracy display
  const formatAccuracy = (accuracy: number | null) => {
    if (accuracy === null) return '🏈'; // No data yet
    return `${accuracy}%`;
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
        <Text style={styles.title}>Squad</Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => router.push('/group/create')}
          >
            <Text style={styles.actionButtonText}>➕ Create Group</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleAddFriend}
          >
            <Text style={styles.actionButtonText}>👥 Add Friends</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.browseButton}
          onPress={() => router.push('/group/browse-groups')}
        >
          <Text style={styles.browseButtonText}>🔍 Browse Public Groups</Text>
        </TouchableOpacity>

        {userGroups.map((group) => (
          <View key={group.id} style={styles.groupCard}>
            <View style={styles.groupHeader}>
              <View>
                <Text style={styles.groupTitle}>{group.name}</Text>
                <View style={styles.groupBadges}>
                  {group.role === 'primary_owner' && (
                    <View style={styles.ownerBadge}>
                      <Text style={styles.badgeText}>👑 Owner</Text>
                    </View>
                  )}
                  {group.visibility === 'public' && (
                    <View style={styles.publicBadge}>
                      <Text style={styles.badgeText}>🌐 Public</Text>
                    </View>
                  )}
                </View>

                {/* DEV ONLY: Test Accept Invite */}
                {__DEV__ && (
                  <TouchableOpacity 
                    style={[styles.actionButton, { backgroundColor: '#9B59B6', marginTop: 12 }]}
                    onPress={() => router.push('/accept-invite/9c8a54d9-0030-4664-b36a-e38e6f897044')}
                  >
                    <Text style={styles.actionButtonText}>🧪 [DEV] Test Accept Invite</Text>
                  </TouchableOpacity>
                )}

              </View>
              <Text style={styles.memberCount}>{group.memberCount} members</Text>
            </View>
            
            {/* NEW: Performance Metrics Grid */}
            <View style={styles.performanceGrid}>
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>
                  {formatAccuracy(group.rating)}
                  {group.trend === 'up' && <Text style={styles.trendUp}> ↑</Text>}
                  {group.trend === 'down' && <Text style={styles.trendDown}> ↓</Text>}
                </Text>
                <Text style={styles.performanceLabel}>Group Rating</Text>
              </View>
              
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>{formatAccuracy(group.weekAccuracy)}</Text>
                <Text style={styles.performanceLabel}>Last Week</Text>
              </View>
              
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>{formatAccuracy(group.monthAccuracy)}</Text>
                <Text style={styles.performanceLabel}>Last Month</Text>
              </View>
              
              <View style={styles.performanceStat}>
                <Text style={styles.performanceValue}>{formatAccuracy(group.allTimeAccuracy)}</Text>
                <Text style={styles.performanceLabel}>All Time</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.discussButton} 
              onPress={() => router.push(`/group/group-picks?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
            >
              <Text style={styles.discussButtonText}>See Group Picks →</Text>
            </TouchableOpacity>

            {group.role === 'primary_owner' && (
              <>
                <TouchableOpacity 
                  style={styles.inviteButton}
                  onPress={() => {
                    setSelectedGroupForInvite(group);
                    setShowInviteModal(true);
                  }}
                >
                  <Text style={styles.inviteButtonText}>📧 Invite Members</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.settingsButton}
                  onPress={() => router.push(`/group/settings?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
                >
                  <Text style={styles.settingsButtonText}>⚙️ Group Settings</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        ))}

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

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🎯 About Syndicate Picks</Text>
          <Text style={styles.infoText}>
            This is your default group with all your friends. Make picks on games and see how you stack up against everyone!
          </Text>
        </View>
      </ScrollView>

      <Modal
        visible={showCreateGroupModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowCreateGroupModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Group</Text>
            <Text style={styles.modalSubtitle}>
              Choose a name for your group. You'll be able to invite friends after creating it.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="Group name (e.g., 'Fantasy Football Crew')"
              placeholderTextColor="#666"
              value={newGroupName}
              onChangeText={setNewGroupName}
              autoFocus
              maxLength={50}
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButtonCreate, creatingGroup && styles.modalButtonDisabled]}
                onPress={handleCreateGroup}
                disabled={creatingGroup}
              >
                <Text style={styles.modalButtonCreateText}>
                  {creatingGroup ? 'Creating...' : 'Create Group'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showInviteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Invite to {selectedGroupForInvite?.name}</Text>
            <Text style={styles.modalSubtitle}>
              Enter the email address of someone you know personally. They'll receive an invitation to join your group.
            </Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="friend@example.com"
              placeholderTextColor="#666"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButtonCreate, sendingInvite && styles.modalButtonDisabled]}
                onPress={handleSendInvite}
                disabled={sendingInvite}
              >
                <Text style={styles.modalButtonCreateText}>
                  {sendingInvite ? 'Sending...' : 'Send Invite'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  browseButton: {
    backgroundColor: '#2C2C2E',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  browseButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
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
  groupBadges: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  ownerBadge: {
    backgroundColor: '#FFD700',
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
  badgeText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  memberCount: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  // NEW: Performance metrics styles
  performanceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  performanceStat: {
    width: '50%',
    alignItems: 'center',
    paddingVertical: 12,
  },
  performanceValue: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  performanceLabel: {
    color: '#8E8E93',
    fontSize: 12,
  },
  trendUp: {
    color: '#34C759',
    fontSize: 20,
  },
  trendDown: {
    color: '#FF3B30',
    fontSize: 20,
  },
  // Old styles removed: groupStats, statItem, statValue, statLabel, statDivider, pendingColor
  discussButton: {
    alignItems: 'center',
  },
  discussButtonText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  inviteButton: {
    marginTop: 12,
    paddingVertical: 10,
    backgroundColor: '#34C759',
    borderRadius: 8,
    alignItems: 'center',
  },
  inviteButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  settingsButton: {
    marginTop: 8,
    paddingVertical: 10,
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#444',
  },
  settingsButtonText: {
    color: '#FFF',
    fontSize: 14,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  modalInput: {
    backgroundColor: '#2C2C2E',
    borderRadius: 8,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancelText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonCreate: {
    flex: 1,
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCreateText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtonDisabled: {
    opacity: 0.5,
  },
});