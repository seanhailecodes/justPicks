import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface InviteDetails {
  id: string;
  group_id: string;
  group_name: string;
  inviter_name: string;
  status: string;
  expires_at: string;
}

export default function AcceptInviteScreen() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuthAndLoadInvite();
  }, [inviteId]);

  const checkAuthAndLoadInvite = async () => {
    try {
      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        // Store invite ID and redirect to login
        // After login, user should be redirected back here
        router.replace(`/(auth)/login?redirect=/accept-invite/${inviteId}`);
        return;
      }

      setCurrentUserId(user.id);

      // Load invite details
      const { data: inviteData, error: inviteError } = await supabase
        .from('group_invites')
        .select(`
          id,
          group_id,
          status,
          expires_at,
          groups (name),
          profiles!group_invites_invited_by_fkey (display_name, username)
        `)
        .eq('id', inviteId)
        .single();

      if (inviteError || !inviteData) {
        setError('Invite not found or has expired.');
        setLoading(false);
        return;
      }

      // Check if already accepted/declined
      if (inviteData.status !== 'pending') {
        setError(`This invite has already been ${inviteData.status}.`);
        setLoading(false);
        return;
      }

      // Check if expired
      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invite has expired.');
        setLoading(false);
        return;
      }

      setInvite({
        id: inviteData.id,
        group_id: inviteData.group_id,
        group_name: (inviteData.groups as any)?.name || 'Unknown Group',
        inviter_name: (inviteData.profiles as any)?.display_name || (inviteData.profiles as any)?.username || 'Someone',
        status: inviteData.status,
        expires_at: inviteData.expires_at,
      });
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async () => {
    if (!invite || !currentUserId) return;

    setAccepting(true);
    try {
      // Check if already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', currentUserId)
        .single();

      if (existingMember) {
        setError('You are already a member of this group!');
        setAccepting(false);
        return;
      }

      // Add user to group
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: invite.group_id,
          user_id: currentUserId,
          role: 'member',
        });

      if (memberError) throw memberError;

      // Update invite status
      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      // Navigate to the group
      router.replace(`/group/group-picks?groupId=${invite.group_id}&groupName=${encodeURIComponent(invite.group_name)}`);
    } catch (err) {
      console.error('Error accepting invite:', err);
      setError('Failed to accept invite. Please try again.');
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!invite) return;

    try {
      await supabase
        .from('group_invites')
        .update({ status: 'declined' })
        .eq('id', invite.id);

      router.replace('/(tabs)/groups');
    } catch (err) {
      console.error('Error declining invite:', err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Loading invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>❌</Text>
          <Text style={styles.errorText}>{error}</Text>
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.card}>
          <Text style={styles.emoji}>🎉</Text>
          <Text style={styles.title}>You're Invited!</Text>
          
          <Text style={styles.inviteText}>
            <Text style={styles.highlight}>{invite?.inviter_name}</Text> has invited you to join
          </Text>
          
          <Text style={styles.groupName}>{invite?.group_name}</Text>

          <View style={styles.buttons}>
            <TouchableOpacity 
              style={[styles.button, styles.acceptButton, accepting && styles.buttonDisabled]}
              onPress={handleAccept}
              disabled={accepting}
            >
              <Text style={styles.buttonText}>
                {accepting ? 'Joining...' : 'Accept & Join'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.declineButton]}
              onPress={handleDecline}
              disabled={accepting}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FF6B35',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  inviteText: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 8,
  },
  highlight: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  groupName: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttons: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
  },
  declineButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButtonText: {
    color: '#8E8E93',
    fontSize: 16,
  },
  loadingText: {
    color: '#8E8E93',
    marginTop: 16,
    fontSize: 16,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 24,
  },
});