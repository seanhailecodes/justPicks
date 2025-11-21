import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AcceptInviteScreen() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [accepting, setAccepting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    loadInvite();
  }, []);

  const loadInvite = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Not logged in - redirect to login
        Alert.alert(
          'Login Required',
          'Please log in to accept this invitation',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }]
        );
        return;
      }

      setCurrentUserId(user.id);

      // Fetch the invite
      const { data: inviteData, error } = await supabase
        .from('group_invites')
        .select(`
          *,
          groups (
            id,
            name
          )
        `)
        .eq('id', inviteId)
        .single();

      if (error) throw error;

      // Fetch inviter profile separately
      if (inviteData) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, display_name')
          .eq('id', inviteData.invited_by)
          .single();
        
        inviteData.profiles = profileData;
      }

      // Check if invite is valid
      if (!inviteData) {
        Alert.alert('Invalid Invite', 'This invitation does not exist.');
        return;
      }

      if (inviteData.status !== 'pending') {
        Alert.alert('Invite Already Used', 'This invitation has already been used.');
        return;
      }

      // Check if expired
      const expiresAt = new Date(inviteData.expires_at);
      if (expiresAt < new Date()) {
        Alert.alert('Invite Expired', 'This invitation has expired.');
        return;
      }

      // Check if user email matches
      if (inviteData.invitee_email.toLowerCase() !== user.email?.toLowerCase()) {
        Alert.alert(
          'Wrong Account',
          `This invitation was sent to ${inviteData.invitee_email}. You are logged in as ${user.email}.`
        );
        return;
      }

      setInvite(inviteData);
    } catch (error) {
      console.error('Error loading invite:', error);
      Alert.alert('Error', 'Failed to load invitation.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!invite || !currentUserId) return;

    setAccepting(true);

    try {
      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: currentUserId,
          role: 'member'
        });

      if (memberError) throw memberError;

      // Update invite status
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ status: 'accepted' })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      Alert.alert(
        '🎉 Success!',
        `You've joined "${invite.groups.name}"!`,
        [
          {
            text: 'View Group',
            onPress: () => router.replace(`/group/group-picks?groupId=${invite.group_id}&groupName=${encodeURIComponent(invite.groups.name)}`)
          }
        ]
      );
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      
      // Check if user is already a member
      if (error.code === '23505') {
        Alert.alert('Already a Member', "You're already a member of this group!");
        router.replace('/(tabs)/groups');
      } else {
        Alert.alert('Error', 'Failed to accept invitation. Please try again.');
      }
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading invitation...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invite) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorTitle}>Invalid Invitation</Text>
          <TouchableOpacity 
            style={styles.button}
            onPress={() => router.replace('/(tabs)/groups')}
          >
            <Text style={styles.buttonText}>Go to Groups</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const inviterName = invite.profiles?.display_name || invite.profiles?.username || 'Someone';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>You've been invited!</Text>
        
        <View style={styles.inviteCard}>
          <Text style={styles.inviteText}>
            <Text style={styles.bold}>{inviterName}</Text> has invited you to join
          </Text>
          <Text style={styles.groupName}>{invite.groups.name}</Text>
          <Text style={styles.subtitle}>on justPicks</Text>
        </View>

        <TouchableOpacity 
          style={[styles.acceptButton, accepting && styles.buttonDisabled]}
          onPress={handleAcceptInvite}
          disabled={accepting}
        >
          <Text style={styles.acceptButtonText}>
            {accepting ? 'Joining...' : 'Accept Invitation'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.declineButton}
          onPress={() => router.replace('/(tabs)/groups')}
        >
          <Text style={styles.declineButtonText}>Maybe Later</Text>
        </TouchableOpacity>

        <Text style={styles.footer}>
          This invitation expires in {Math.ceil((new Date(invite.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} days
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    color: '#FFF',
    fontSize: 16,
    marginTop: 16,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 32,
    textAlign: 'center',
  },
  inviteCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 32,
    marginBottom: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
    width: '100%',
  },
  inviteText: {
    color: '#FFF',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 16,
  },
  bold: {
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  groupName: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  declineButton: {
    paddingVertical: 16,
    paddingHorizontal: 48,
    marginBottom: 32,
  },
  declineButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF6B35',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  footer: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
});