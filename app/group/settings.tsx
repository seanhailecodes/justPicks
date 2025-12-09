import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View, Alert, ActivityIndicator } from 'react-native';
import { supabase } from '../lib/supabase';

interface GroupDetails {
  id: string;
  name: string;
  created_by: string;
  visibility: string;
  require_approval: boolean;
  invite_code: string;
  created_at: string;
  memberCount: number;
  adminCount: number;
}

export default function GroupSettingsScreen() {
  const { groupId, groupName } = useLocalSearchParams();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [canDeleteGroup, setCanDeleteGroup] = useState(false);
  const [isOnlyMember, setIsOnlyMember] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (groupId) {
      loadGroupDetails();
    }
  }, [groupId]);

  const loadGroupDetails = async () => {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in');
        router.back();
        return;
      }
      setCurrentUserId(user.id);

      // Get group info
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (groupError) throw groupError;

      // Check if current user is owner
      const { data: membership } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      // Count total members
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId);

      // Count admins (not including primary_owner)
      const { count: adminCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupId)
        .eq('role', 'admin');

      // User can delete if they're the owner OR the only member left
      const isOwner = membership?.role === 'primary_owner';
      const onlyMember = memberCount === 1;
      setCanDeleteGroup(isOwner || onlyMember);
      setIsOnlyMember(onlyMember);

      setGroup({
        ...groupData,
        memberCount: memberCount || 0,
        adminCount: adminCount || 0,
      });
    } catch (error) {
      console.error('Error loading group details:', error);
      Alert.alert('Error', 'Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${groupName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: confirmLeave,
        },
      ]
    );
  };

  const confirmLeave = async () => {
    if (!currentUserId) return;

    setLeaving(true);

    try {
      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', currentUserId);

      if (error) throw error;

      Alert.alert('Left Group', `You have left "${groupName}".`);
      router.replace('/(tabs)/groups');
    } catch (error) {
      console.error('Error leaving group:', error);
      Alert.alert('Error', 'Failed to leave group. Please try again.');
    } finally {
      setLeaving(false);
    }
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      'Delete Group',
      `Are you sure you want to delete "${groupName}"?\n\n${
        (group?.adminCount || 0) > 0
          ? 'The first admin will become the new owner.'
          : 'This action cannot be undone and will delete the group for all members.'
      }`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    if (!group || !currentUserId) return;

    // Double-check permission
    if (!canDeleteGroup) {
      Alert.alert('Error', 'You do not have permission to delete this group.');
      return;
    }

    setDeleting(true);

    try {
      // Check if there are any admins
      const { data: admins, error: adminsError } = await supabase
        .from('group_members')
        .select('*')
        .eq('group_id', groupId)
        .eq('role', 'admin')
        .limit(1);

      if (adminsError) throw adminsError;

      if (admins && admins.length > 0) {
        // Promote first admin to primary_owner
        const { error: promoteError } = await supabase
          .from('group_members')
          .update({ role: 'primary_owner' })
          .eq('id', admins[0].id);

        if (promoteError) throw promoteError;

        // Remove current owner from group
        const { error: removeError } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId)
          .eq('user_id', currentUserId);

        if (removeError) throw removeError;

        Alert.alert(
          'Group Transferred',
          'You have left the group and ownership has been transferred to an admin.'
        );
      } else {
        // No admins - delete the entire group
        // First delete all group picks
        await supabase
          .from('group_picks')
          .delete()
          .eq('group_id', groupId);

        // Delete all group members
        const { error: membersError } = await supabase
          .from('group_members')
          .delete()
          .eq('group_id', groupId);

        if (membersError) throw membersError;

        // Delete any group invites
        await supabase
          .from('group_invites')
          .delete()
          .eq('group_id', groupId);

        // Finally delete the group
        const { error: deleteError } = await supabase
          .from('groups')
          .delete()
          .eq('id', groupId);

        if (deleteError) throw deleteError;

        Alert.alert('Group Deleted', 'The group has been permanently deleted.');
      }

      // Navigate back to groups list
      router.replace('/(tabs)/groups');
    } catch (error) {
      console.error('Error deleting group:', error);
      Alert.alert('Error', 'Failed to delete group. Please try again.');
    } finally {
      setDeleting(false);
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

  if (!group) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={styles.errorText}>Group not found</Text>
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
        <Text style={styles.title}>Group Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Group Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Name</Text>
            <Text style={styles.infoValue}>{group.name}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Members</Text>
            <Text style={styles.infoValue}>{group.memberCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Admins</Text>
            <Text style={styles.infoValue}>{group.adminCount}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Visibility</Text>
            <Text style={styles.infoValue}>
              {group.visibility === 'private' ? '🔒 Private' : '🌐 Public'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Requires Approval</Text>
            <Text style={styles.infoValue}>
              {group.require_approval ? 'Yes' : 'No'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created</Text>
            <Text style={styles.infoValue}>
              {new Date(group.created_at).toLocaleDateString()}
            </Text>
          </View>
        </View>

        {/* Owner or only member: Delete Group */}
        {canDeleteGroup ? (
          <View style={styles.dangerZone}>
            <Text style={styles.dangerTitle}>Danger Zone</Text>
            <Text style={styles.dangerDescription}>
              {isOnlyMember
                ? 'You are the only member. Deleting this group will permanently remove it. This action cannot be undone.'
                : group.adminCount > 0
                  ? 'Deleting will transfer ownership to the first admin and remove you from the group.'
                  : 'Deleting this group will permanently remove it for all members. This action cannot be undone.'}
            </Text>
            
            <TouchableOpacity 
              style={[styles.deleteButton, deleting && styles.buttonDisabled]}
              onPress={handleDeleteGroup}
              disabled={deleting}
            >
              <Text style={styles.deleteButtonText}>
                {deleting ? 'Deleting...' : '🗑️ Delete Group'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Non-owner: Leave Group */
          <View style={styles.leaveSection}>
            <Text style={styles.leaveSectionTitle}>Membership</Text>
            <Text style={styles.leaveDescription}>
              Leave this group to stop receiving picks and updates from its members.
            </Text>
            
            <TouchableOpacity 
              style={[styles.leaveButton, leaving && styles.buttonDisabled]}
              onPress={handleLeaveGroup}
              disabled={leaving}
            >
              <Text style={styles.leaveButtonText}>
                {leaving ? 'Leaving...' : '👋 Leave Group'}
              </Text>
            </TouchableOpacity>
          </View>
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
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  infoLabel: {
    color: '#8E8E93',
    fontSize: 16,
  },
  infoValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  codeText: {
    fontFamily: 'monospace',
    letterSpacing: 2,
  },
  dangerZone: {
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 59, 48, 0.3)',
  },
  dangerTitle: {
    color: '#FF3B30',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  dangerDescription: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  leaveSection: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  leaveSectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  leaveDescription: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  leaveButton: {
    backgroundColor: '#FF9500',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
  },
});