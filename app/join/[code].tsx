import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Store pending group code
export const setPendingGroupCode = (code: string) => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.setItem('pendingGroupCode', code);
  }
};

export const getPendingGroupCode = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('pendingGroupCode');
  }
  return null;
};

export const clearPendingGroupCode = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    localStorage.removeItem('pendingGroupCode');
  }
};

interface GroupInfo {
  id: string;
  name: string;
  memberCount: number;
  ownerName: string;
}

export default function JoinByCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [group, setGroup] = useState<GroupInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [alreadyMember, setAlreadyMember] = useState(false);

  useEffect(() => {
    loadGroupAndCheckAuth();
  }, [code]);

  const loadGroupAndCheckAuth = async () => {
    try {
      // Find group by invite code
      const { data: groupData, error: groupError } = await supabase
        .from('groups')
        .select('id, name, created_by')
        .eq('invite_code', code?.toUpperCase())
        .single();

      if (groupError || !groupData) {
        setError('Invalid invite code. Please check and try again.');
        setLoading(false);
        return;
      }

      // Get member count
      const { count } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', groupData.id);

      // Get owner name
      const { data: ownerData } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', groupData.created_by)
        .single();

      const groupInfo: GroupInfo = {
        id: groupData.id,
        name: groupData.name,
        memberCount: count || 0,
        ownerName: ownerData?.display_name || ownerData?.username || 'Someone',
      };
      
      setGroup(groupInfo);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setCurrentUserId(user.id);
        
        // Check if already a member
        const { data: membership } = await supabase
          .from('group_members')
          .select('id')
          .eq('group_id', groupData.id)
          .eq('user_id', user.id)
          .single();

        if (membership) {
          setAlreadyMember(true);
          setLoading(false);
          return;
        }

        // Check if user just came from signup (has pending code that matches)
        const pendingCode = getPendingGroupCode();
        if (pendingCode && pendingCode.toUpperCase() === code?.toUpperCase()) {
          // Auto-join!
          setLoading(false);
          autoJoinGroup(groupInfo, user.id);
          return;
        }
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading group:', err);
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const autoJoinGroup = async (groupInfo: GroupInfo, userId: string) => {
    setJoining(true);
    try {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: groupInfo.id,
          user_id: userId,
          role: 'member',
        });

      if (joinError && joinError.code !== '23505') {
        throw joinError;
      }

      clearPendingGroupCode();
      
      // Navigate directly to the group
      router.replace(`/group/group-picks?groupId=${groupInfo.id}&groupName=${encodeURIComponent(groupInfo.name)}`);
    } catch (err) {
      console.error('Error auto-joining group:', err);
      setJoining(false);
      // Don't show error - user can still manually join
    }
  };

  const handleJoin = async () => {
    if (!group || !currentUserId) return;

    setJoining(true);
    try {
      const { error: joinError } = await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: currentUserId,
          role: 'member',
        });

      if (joinError) {
        if (joinError.code === '23505') {
          // Already a member (unique constraint)
          setAlreadyMember(true);
        } else {
          throw joinError;
        }
      }

      clearPendingGroupCode();
      
      // Navigate to the group
      router.replace(`/group/group-picks?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`);
    } catch (err) {
      console.error('Error joining group:', err);
      setError('Failed to join group. Please try again.');
      setJoining(false);
    }
  };

  const handleSignUp = () => {
    setPendingGroupCode(code!);
    router.push('/(auth)/login?mode=signup');
  };

  const handleLogin = () => {
    setPendingGroupCode(code!);
    router.push('/(auth)/login');
  };

  const handleGoToGroup = () => {
    if (group) {
      router.replace(`/group/group-picks?groupId=${group.id}&groupName=${encodeURIComponent(group.name)}`);
    }
  };

  if (loading || joining) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>
            {joining ? 'Joining group...' : 'Finding group...'}
          </Text>
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

  if (alreadyMember) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.card}>
            <Text style={styles.emoji}>✅</Text>
            <Text style={styles.title}>You're Already In!</Text>
            <Text style={styles.groupName}>{group?.name}</Text>
            <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleGoToGroup}>
              <Text style={styles.buttonText}>Go to Group</Text>
            </TouchableOpacity>
          </View>
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
          
          <Text style={styles.subtitle}>
            Join <Text style={styles.highlight}>{group?.ownerName}</Text>'s group
          </Text>
          
          <Text style={styles.groupName}>{group?.name}</Text>
          
          <Text style={styles.memberInfo}>
            {group?.memberCount} {group?.memberCount === 1 ? 'member' : 'members'}
          </Text>

          {currentUserId ? (
            // Logged in - show Join button
            <TouchableOpacity 
              style={[styles.button, styles.primaryButton, joining && styles.buttonDisabled]}
              onPress={handleJoin}
              disabled={joining}
            >
              <Text style={styles.buttonText}>
                {joining ? 'Joining...' : '🚀 Join Group'}
              </Text>
            </TouchableOpacity>
          ) : (
            // Not logged in - show signup/login options
            <View style={styles.authButtons}>
              <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={handleSignUp}>
                <Text style={styles.buttonText}>Sign Up to Join</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={handleLogin}>
                <Text style={styles.secondaryButtonText}>Already have an account? Log In</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.codeHint}>Invite code: {code?.toUpperCase()}</Text>
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
    marginBottom: 16,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
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
    marginBottom: 8,
  },
  memberInfo: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 24,
  },
  authButtons: {
    width: '100%',
    gap: 12,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
  },
  secondaryButton: {
    backgroundColor: '#2C2C2E',
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
  codeHint: {
    color: '#666',
    fontSize: 12,
    marginTop: 20,
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