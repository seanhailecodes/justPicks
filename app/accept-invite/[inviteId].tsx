import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
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

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const emojiScaleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const fingerNudgeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadInviteAndCheckAuth();
  }, [inviteId]);

  useEffect(() => {
    if (!loading && invite) {
      // Entrance animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(emojiScaleAnim, {
          toValue: 1,
          friction: 4,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Finger jabs toward the user then loops with a gentle nudge
        Animated.sequence([
          Animated.timing(fingerNudgeAnim, { toValue: 12, duration: 120, useNativeDriver: true }),
          Animated.timing(fingerNudgeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
          Animated.timing(fingerNudgeAnim, { toValue: 10, duration: 100, useNativeDriver: true }),
          Animated.timing(fingerNudgeAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
        ]).start(() => {
          // Subtle ongoing pulse
          Animated.loop(
            Animated.sequence([
              Animated.timing(fingerNudgeAnim, { toValue: 6, duration: 600, useNativeDriver: true }),
              Animated.timing(fingerNudgeAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
            ])
          ).start();
        });

        // Pulse the accept button
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulseAnim, { toValue: 1.04, duration: 700, useNativeDriver: true }),
            Animated.timing(pulseAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
          ])
        ).start();
      });
    }
  }, [loading, invite]);

  const loadInviteAndCheckAuth = async () => {
    try {
      const { data: inviteData, error: inviteError } = await supabase
        .from('group_invites')
        .select('id, group_id, status, expires_at, invited_by')
        .eq('id', inviteId)
        .single();

      if (inviteError || !inviteData) {
        setError('Invite not found or has expired.');
        setLoading(false);
        return;
      }

      if (inviteData.status !== 'pending') {
        setError(`This invite has already been ${inviteData.status}.`);
        setLoading(false);
        return;
      }

      if (new Date(inviteData.expires_at) < new Date()) {
        setError('This invite has expired.');
        setLoading(false);
        return;
      }

      const { data: groupData } = await supabase
        .from('groups')
        .select('name')
        .eq('id', inviteData.group_id)
        .single();

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
    setPendingInvite(inviteId!);
    router.push('/(auth)/login?mode=signup');
  };

  const handleLogin = () => {
    setPendingInvite(inviteId!);
    router.push('/(auth)/login');
  };

  const handleAccept = async () => {
    if (!invite || !currentUserId) return;
    setAccepting(true);
    try {
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', invite.group_id)
        .eq('user_id', currentUserId)
        .maybeSingle();

      if (existingMember) {
        router.replace(`/group/group-picks?groupId=${invite.group_id}&groupName=${encodeURIComponent(invite.group_name)}`);
        return;
      }

      const { error: memberError } = await supabase
        .from('group_members')
        .insert({ group_id: invite.group_id, user_id: currentUserId, role: 'member' });

      if (memberError) throw memberError;

      const { error: updateError } = await supabase
        .from('group_invites')
        .update({ status: 'accepted' })
        .eq('id', invite.id);

      if (updateError) throw updateError;

      clearPendingInvite();
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
          <Text style={styles.loadingText}>Loading your invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.errorIcon}>😬</Text>
          <Text style={styles.errorTitle}>Hmm.</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.acceptButton}
            onPress={() => router.replace(isLoggedIn ? '/(tabs)/groups' : '/')}
          >
            <Text style={styles.acceptButtonText}>
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

        {/* Top glow accent */}
        <View style={styles.glowBar} />

        <Animated.View
          style={[
            styles.card,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Animated pointing finger */}
          <Animated.Text
            style={[styles.emoji, { transform: [{ scale: emojiScaleAnim }, { translateX: fingerNudgeAnim }] }]}
          >
            👉
          </Animated.Text>

          {/* Headline */}
          <Text style={styles.headline}>YOU ARE IN.</Text>
          <Text style={styles.subheadline}>Right here. Right now.</Text>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Invite details */}
          <Text style={styles.inviterText}>
            <Text style={styles.inviterName}>{invite?.inviter_name}</Text>
            {'\n'}wants you in their crew
          </Text>

          <View style={styles.groupBadge}>
            <Text style={styles.groupBadgeText}>{invite?.group_name}</Text>
          </View>

          {/* Value prop for new users */}
          {!isLoggedIn && (
            <Text style={styles.valueProp}>
              Bet less with friends. Just picks.{'\n'}Confer, compare, pick calm.{'\n'}Show off. Bragging rights.
            </Text>
          )}

          {/* CTAs */}
          {isLoggedIn ? (
            <View style={styles.buttons}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                <TouchableOpacity
                  style={[styles.acceptButton, accepting && styles.buttonDisabled]}
                  onPress={handleAccept}
                  disabled={accepting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptButtonText}>
                    {accepting ? 'Joining...' : "LET'S GO 👊"}
                  </Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
                disabled={accepting}
              >
                <Text style={styles.declineButtonText}>No thanks</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.buttons}>
              <Animated.View style={{ transform: [{ scale: pulseAnim }], width: '100%' }}>
                <TouchableOpacity
                  style={styles.acceptButton}
                  onPress={handleSignUp}
                  activeOpacity={0.85}
                >
                  <Text style={styles.acceptButtonText}>CREATE ACCOUNT & JOIN 🔥</Text>
                </TouchableOpacity>
              </Animated.View>

              <TouchableOpacity
                style={styles.loginButton}
                onPress={handleLogin}
              >
                <Text style={styles.loginButtonText}>Already have an account? Log in</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.declineButton}
                onPress={handleDecline}
              >
                <Text style={styles.declineButtonText}>No thanks</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  glowBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#FF6B35',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 10,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    gap: 12,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#111',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 72,
    marginBottom: 16,
  },
  headline: {
    color: '#FF6B35',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subheadline: {
    color: '#555',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 24,
    letterSpacing: 1,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: '#FF6B35',
    borderRadius: 1,
    marginBottom: 24,
    opacity: 0.5,
  },
  inviterText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  inviterName: {
    color: '#FF6B35',
    fontWeight: '700',
    fontSize: 17,
  },
  groupBadge: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  groupBadgeText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  valueProp: {
    color: '#555',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 8,
  },
  buttons: {
    width: '100%',
    gap: 12,
    marginTop: 8,
  },
  acceptButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  acceptButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1,
  },
  loginButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
  },
  loginButtonText: {
    color: '#EBEBF5',
    fontSize: 14,
    fontWeight: '500',
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#444',
    fontSize: 14,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  loadingText: {
    color: '#555',
    marginTop: 12,
    fontSize: 15,
  },
  errorIcon: {
    fontSize: 48,
  },
  errorTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  errorText: {
    color: '#8E8E93',
    fontSize: 15,
    textAlign: 'center',
  },
});
