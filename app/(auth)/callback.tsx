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

// Helper to get pending group code from localStorage
const getPendingGroupCode = () => {
  if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
    return localStorage.getItem('pendingGroupCode');
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

        // ON WEB: handle all URL formats Supabase may use
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          // PKCE flow: ?code=xxx (newer Supabase)
          const searchParams = new URLSearchParams(window.location.search);
          const code = searchParams.get('code');
          if (code) {
            console.log('Found PKCE code, exchanging for session...');
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error('Error exchanging code:', error);
              router.replace('/(auth)/login');
              return;
            }
            // Password recovery — must go to reset screen, not the app
            if (searchParams.get('type') === 'recovery') {
              router.replace('/reset-password');
              return;
            }
            handlePostAuthRedirect();
            return;
          }

          // Legacy implicit flow: #access_token=xxx
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            console.log('Found tokens in URL hash, setting session...');
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('Error setting session:', error);
              router.replace('/(auth)/login');
              return;
            }
            // Password recovery — must go to reset screen, not the app
            if (hashParams.get('type') === 'recovery') {
              router.replace('/reset-password');
              return;
            }
            handlePostAuthRedirect();
            return;
          }
        }

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

    const handlePostAuthRedirect = async () => {
      // Save terms acceptance to profiles table if present in user metadata
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.user_metadata?.accepted_terms_at) {
          await supabase.from('profiles').upsert({
            id: user.id,
            accepted_terms_at: user.user_metadata.accepted_terms_at,
            accepted_terms_version: user.user_metadata.accepted_terms_version ?? null,
          }, { onConflict: 'id' });
        }
      } catch (e) {
        console.warn('Could not save terms acceptance:', e);
      }

      // URL param takes priority — survives cross-browser email confirmation redirects
      const urlInvite = Platform.OS === 'web' && typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('invite')
        : null;

      const pendingInvite = urlInvite || getPendingInvite();
      const pendingGroupCode = getPendingGroupCode();

      if (pendingInvite) {
        router.replace(`/accept-invite/${pendingInvite}`);
      } else if (pendingGroupCode) {
        router.replace(`/join/${pendingGroupCode}`);
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