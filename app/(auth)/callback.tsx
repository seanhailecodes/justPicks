import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Helper to get pending invite from localStorage
const getPendingInvite = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('pendingInvite');
  }
  return null;
};

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log('Auth callback params:', params);

        // Handle email confirmation link (has 'token' and 'type')
        if (params.token && params.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.token as string,
            type: params.type as any,
          });

          if (error) {
            console.error('Error verifying token:', error);
            router.replace('/(auth)/login');
            return;
          }

          // After successful verification, check for pending invite
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            handlePostAuthRedirect();
            return;
          }
        }

        // Handle token_hash format (magic links)
        if (params.token_hash && params.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash as string,
            type: params.type as any,
          });

          if (error) {
            console.error('Error verifying token_hash:', error);
            router.replace('/(auth)/login');
            return;
          }
        }

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          handlePostAuthRedirect();
        } else {
          router.replace('/(auth)/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    const handlePostAuthRedirect = () => {
      const pendingInvite = getPendingInvite();
      if (pendingInvite) {
        router.replace(`/accept-invite/${pendingInvite}`);
      } else {
        router.replace('/(tabs)');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={{ marginTop: 20, color: '#fff' }}>Verifying your email...</Text>
    </View>
  );
}