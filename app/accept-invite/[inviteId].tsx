import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

interface InviteDetails {
  id: string;
  group_id: string;
  group_name: string;
  inviter_name: string;
  status: string;
  expires_at: string;
}

// Helper to store/retrieve pending invite
const setPendingInvite = (inviteId: string) => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem('pendingInvite', inviteId);
  }
};

export const getPendingInvite = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('pendingInvite');
  }
  return null;
};

export const clearPendingInvite = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem('pendingInvite');
  }
};

export default function AcceptInviteScreen() {
  const { inviteId } = useLocalSearchParams<{ inviteId: string }>();
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    loadInviteAndCheckAuth();
  }, [inviteId]);

  const loadInviteAndCheckAuth = async () => {
    try {
      // First load invite details (no auth required)
      const { data: inviteData, error: inviteError } = await supabase
        .from('group_invites')
        .select('id, group_id, status, expires_at, invited_by')
        .eq('id', inviteId)
        .single();

      console.log('Invite query result:', inviteData, inviteError);

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

      // Get group name separately
      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', inviteData.group_id)
        .single();

      // Get inviter name separately
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', inviteData.invited_by)
        .single();

      setInvite({
        id: inviteData.id,
        group_id: inviteData.group_id,
        group_name: groupData?.name || 'Unknown Group',
        inviter_name: profileData?.display_name || profileData?.username || 'Someone',
        status: inviteData.status,
        expires_at: inviteData.expires_at,
      });

      // Then check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        setIsLoggedIn(true);
      }
    } catch (err) {
      console.error('Error loading invite:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = () => {
    // Store invite ID for after signup
    setPendingInvite(inviteId!);
    router.push('/(auth)/login?mode=signup');
  };

  const handleLogin = () => {
    // Store invite ID for after login
    setPendingInvite(inviteId!);
    router.push('/(auth)/login');
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
        .maybeSingle();

      if (existingMember) {
        // Already a member, just go to the group
        router.replace(`/group/group-picks?groupId=${invite.group_id}&groupName=${encodeURIComponent(invite.group_name)}`);
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

      // Clear pending invite
      clearPendingInvite();

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
      if (isLoggedIn) {
        await supabase
          .from('group_invites')
          .update({ status: 'declined' })
          .eq('id', invite.id);
      }
      
      clearPendingInvite();
      router.replace(isLoggedIn ? '/(tabs)/groups' : '/');
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
            onPress={() => router.replace(isLoggedIn ? '/(tabs)/groups' : '/')}
          >
            <Text style={styles.buttonText}>
              {isLoggedIn ? 'Go to Groups' : 'Go Home'}
            </Text>
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

          {isLoggedIn ? (
            // Logged in - show accept/decline
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
          ) : (
            // Not logged in - show signup/login
            <View style={styles.buttons}>
              <TouchableOpacity 
                style={[styles.button, styles.acceptButton]}
                onPress={handleSignUp}
              >
                <Text style={styles.buttonText}>Sign Up to Join</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.secondaryButton]}
                onPress={handleLogin}
              >
                <Text style={styles.secondaryButtonText}>Already have an account? Log In</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.button, styles.declineButton]}
                onPress={handleDecline}
              >
                <Text style={styles.declineButtonText}>No thanks</Text>
              </TouchableOpacity>
            </View>
          )}
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
  secondaryButton: {
    backgroundColor: '#2C2C2E',
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
  secondaryButtonText: {
    color: '#FFF',
    fontSize: 14,
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