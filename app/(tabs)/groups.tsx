import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Modal, SafeAreaView, ScrollView, Share, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { getGroupStats, getUserGroups, GroupStats, UserGroup } from '../lib/database';
import { supabase } from '../lib/supabase';

export default function GroupsScreen() {
  const [groupStats, setGroupStats] = useState<GroupStats>({ activePicks: 0, pendingPicks: 0, totalFriends: 0 });
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupPublic, setNewGroupPublic] = useState(false);
  const [creatingGroup, setCreatingGroup] = useState(false);

  const ADMIN_USER_ID = '64a6ef63-2b66-4e03-9152-b766ec0926aa';
  const [userGroups, setUserGroups] = useState<UserGroup[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedGroupForInvite, setSelectedGroupForInvite] = useState<UserGroup | null>(null);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

      const [statsData, groupsData] = await Promise.all([
        getGroupStats(user.id),
        getUserGroups(user.id)
      ]);

      setGroupStats(statsData);
      setUserGroups(groupsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
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
      const isAdmin = currentUserId === ADMIN_USER_ID;
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: newGroupName.trim(),
          created_by: currentUserId,
          visibility: isAdmin && newGroupPublic ? 'public' : 'private',
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

  const handleShareInviteLink = async () => {
    if (!selectedGroupForInvite) return;

    try {
      // Get the group's invite code
      const { data: groupData } = await supabase
        .from('groups')
        .select('invite_code')
        .eq('id', selectedGroupForInvite.id)
        .single();

      const inviteCode = groupData?.invite_code;
      
      if (!inviteCode) {
        Alert.alert('Error', 'No invite code found for this group');
        return;
      }

  const inviteLink = `https://justpicks.app/join/${inviteCode}`;
      // Alternative deep link: dontbet://join/${inviteCode}

      const result = await Share.share({
        message: `Join my group "${selectedGroupForInvite.name}" on justPicks! 🏈\n\nUse code: ${inviteCode}`,
        url: inviteLink,
        title: `Join ${selectedGroupForInvite.name} on justPicks`,
    });

      if (result.action === Share.sharedAction) {
        // User shared successfully
        setShowInviteModal(false);
      }
    } catch (error) {
      console.error('Error sharing invite link:', error);
      Alert.alert('Error', 'Failed to share invite link');
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
    setInviteMessage(null);

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

      // Race the function call against a 10s timeout so it can't hang forever
      const invokePromise = supabase.functions.invoke('send-invite', {
        body: {
          inviteeEmail: inviteEmail.trim(),
          groupName: selectedGroupForInvite.name,
          inviterName: inviterName,
          groupId: selectedGroupForInvite.id,
          inviteId: invite.id,
        },
      });
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Request timed out. Please try again.')), 10000)
      );

      const { data, error: functionError } = await Promise.race([invokePromise, timeoutPromise]) as any;

      if (functionError) {
        // Try to extract the real Resend error from the response body
        let errorMsg = 'Failed to send email';
        try {
          const body = await (functionError as any).context?.json?.();
          if (body?.error) errorMsg = body.error;
        } catch (_) {}
        throw new Error(errorMsg);
      }
      if (data?.error) throw new Error(data.error);

      setInviteMessage({ type: 'success', text: `✅ Invite sent to ${inviteEmail.trim()}!` });
      setInviteEmail('');
      // Auto-close after a beat so user sees the confirmation
      setTimeout(() => {
        setShowInviteModal(false);
        setInviteMessage(null);
      }, 2000);
    } catch (error: any) {
      console.error('Error sending invite:', error);
      setInviteMessage({ type: 'error', text: error?.message || 'Failed to send invite. Please try again.' });
    } finally {
      setSendingInvite(false);
    }
  };

  // Helper function to format accuracy display
  const formatAccuracy = (accuracy: number | null) => {
    if (accuracy === null || accuracy === undefined) return '—'; // No data yet
    return `${accuracy}%`;
  };

  // Helper to get sport emoji
  const getSportEmoji = (sport?: string) => {
    switch (sport?.toLowerCase()) {
      case 'nba': return '🏀';
      case 'ncaab': return '🏀';
      case 'nhl': return '🏒';
      case 'mlb': return '⚾';
      default: return '🏈'; // NFL default
    }
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
              <View style={styles.groupTitleContainer}>
                <Text style={styles.groupTitle} numberOfLines={2}>{group.name}</Text>
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
                  {/* Sport badge */}
                  {group.sport && (
                    <View style={styles.sportBadge}>
                      <Text style={styles.badgeText}>{getSportEmoji(group.sport)} {group.sport?.toUpperCase()}</Text>
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
              <Text style={styles.memberCount}>{group.memberCount} {group.memberCount === 1 ? 'member' : 'members'}</Text>
            </View>
            
            {/* Performance Metrics Grid - only show if group has picks */}
            {(group.totalGroupPicks ?? 0) > 0 ? (
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
            ) : (
              <TouchableOpacity 
                style={styles.makePicksButton}
                onPress={() => router.push({ 
                  pathname: '/(tabs)/games', 
                  params: { sport: group.sport || 'nfl' } 
                })}
              >
                <Text style={styles.makePicksButtonText}>{getSportEmoji(group.sport)} Make Picks</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={styles.discussButton} 
              onPress={() => router.push(`/group/group-picks?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
            >
              <Text style={styles.discussButtonText}>See Group Picks →</Text>
            </TouchableOpacity>

            {/* Any member can invite in public groups; only owner in private */}
            {(group.role === 'primary_owner' || group.visibility === 'public') && (
              <TouchableOpacity
                style={styles.inviteButton}
                onPress={() => {
                  setSelectedGroupForInvite(group);
                  setShowInviteModal(true);
                }}
              >
                <Text style={styles.inviteButtonText}>📧 Invite Members</Text>
              </TouchableOpacity>
            )}

            {group.role === 'primary_owner' && (
              <TouchableOpacity
                style={styles.settingsButton}
                onPress={() => router.push(`/group/settings?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`)}
              >
                <Text style={styles.settingsButtonText}>⚙️ Group Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

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

            {currentUserId === ADMIN_USER_ID && (
              <TouchableOpacity
                style={styles.publicToggleRow}
                onPress={() => setNewGroupPublic(p => !p)}
              >
                <Text style={styles.publicToggleLabel}>🌐 Make Public Group</Text>
                <View style={[styles.publicToggle, newGroupPublic && styles.publicToggleOn]}>
                  <Text style={styles.publicToggleText}>{newGroupPublic ? 'ON' : 'OFF'}</Text>
                </View>
              </TouchableOpacity>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowCreateGroupModal(false);
                  setNewGroupName('');
                  setNewGroupPublic(false);
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

      {/* UPDATED: Invite Modal with Share Link option */}
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
              Share an invite link or send a direct email invitation.
            </Text>

            {/* Share Link Button - Primary option */}
            <TouchableOpacity 
              style={styles.shareButton}
              onPress={handleShareInviteLink}
            >
              <Text style={styles.shareButtonText}>🔗 Share Invite Link</Text>
            </TouchableOpacity>

            <Text style={styles.orDivider}>— or send email —</Text>
            
            <TextInput
              style={styles.modalInput}
              placeholder="friend@example.com"
              placeholderTextColor="#666"
              value={inviteEmail}
              onChangeText={setInviteEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            
            {inviteMessage && (
              <Text style={[
                styles.inviteInlineMessage,
                { color: inviteMessage.type === 'success' ? '#34C759' : '#FF3B30' }
              ]}>
                {inviteMessage.text}
              </Text>
            )}

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteMessage(null);
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
                  {sendingInvite ? 'Sending...' : 'Send Email'}
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
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  groupTitleContainer: {
    flex: 1,
    flexShrink: 1,
    marginRight: 12,
  },
  groupTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  groupBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  sportBadge: {
    backgroundColor: '#007AFF',
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
    flexShrink: 0,
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
  makePicksButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 14,
    marginBottom: 16,
    alignItems: 'center',
  },
  makePicksButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  trendUp: {
    color: '#34C759',
    fontSize: 20,
  },
  trendDown: {
    color: '#FF3B30',
    fontSize: 20,
  },
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
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#444',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteInlineMessage: {
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
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
  publicToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 4,
    paddingVertical: 8,
  },
  publicToggleLabel: {
    color: '#FFF',
    fontSize: 15,
  },
  publicToggle: {
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  publicToggleOn: {
    backgroundColor: '#34C759',
  },
  publicToggleText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  // New styles for share link
  shareButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  shareButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  orDivider: {
    color: '#8E8E93',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
  },
});