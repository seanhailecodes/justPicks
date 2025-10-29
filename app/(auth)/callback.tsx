import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const router = useRouter();
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // For development, we need to handle the URL manually
        // The magic link will open in browser, so we need a different approach
        // Check if we have token in params (for email confirmation or magic link)
        if (params.token_hash && params.type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: params.token_hash as string,
            type: params.type as any, // 'signup', 'magiclink', 'recovery', etc.
          });

          if (error) {
            console.error('Error verifying token:', error);
            router.replace('/(auth)/login');
            return;
          }
        }

        // Check current session
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Successfully authenticated
          router.replace('/(tabs)');
        } else {
          // Try refreshing the session
          const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
          
          if (refreshedSession) {
            router.replace('/(tabs)');
          } else {
            router.replace('/(auth)/login');
          }
        }
      } catch (error) {
        console.error('Callback error:', error);
        router.replace('/(auth)/login');
      }
    };

    handleCallback();
  }, [params]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <ActivityIndicator size="large" color="#FF6B35" />
      <Text style={{ marginTop: 20, color: '#fff' }}>Authenticating...</Text>
    </View>
  );
}