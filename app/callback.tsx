import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { supabase } from './lib/supabase';

/**
 * OAuth / email-verification callback handler.
 *
 * Supabase redirects here after:
 *   - Email confirmation on signup  (emailRedirectTo = .../callback?invite=<id>)
 *   - Password reset               (emailRedirectTo = .../callback)
 *   - OAuth sign-in                (redirectTo   = .../callback)
 *
 * On web, supabase-js with detectSessionInUrl:true automatically exchanges
 * the tokens in the URL fragment before this component even mounts, so by
 * the time onAuthStateChange fires we already have a valid session.
 *
 * On native, the deep-link dontbet://callback is handled the same way via
 * the react-native-url-polyfill and Supabase's session persistence.
 */
export default function CallbackScreen() {
  const { invite, type } = useLocalSearchParams<{ invite?: string; type?: string }>();
  const handled = useRef(false);

  useEffect(() => {
    // Listen for the session to be established (works for both web and native)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (handled.current) return;

      if (event === 'SIGNED_IN' && session) {
        handled.current = true;
        subscription.unsubscribe();

        if (type === 'recovery') {
          // Password reset — send to the reset-password screen
          router.replace('/reset-password');
          return;
        }

        // If there's a pending invite (from URL param or localStorage fallback),
        // send the user straight to the invite acceptance screen.
        const pendingInviteId = invite || getPendingInvite();
        if (pendingInviteId) {
          router.replace(`/accept-invite/${pendingInviteId}`);
          return;
        }

        router.replace('/(tabs)/home');
      }

      // If Supabase could not establish a session (e.g. expired link), go home.
      if (event === 'INITIAL_SESSION' && !session) {
        handled.current = true;
        subscription.unsubscribe();
        router.replace('/(auth)/login');
      }
    });

    // Safety net: if nothing fires within 5 s, redirect to home anyway
    const timeout = setTimeout(() => {
      if (!handled.current) {
        handled.current = true;
        subscription.unsubscribe();
        router.replace('/(tabs)/home');
      }
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.text}>Signing you in…</Text>
      </View>
    </SafeAreaView>
  );
}

// Inline helper so this file has no circular import with accept-invite
const getPendingInvite = (): string | null => {
  try {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('pendingInvite');
    }
  } catch (_) {}
  return null;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  text: {
    color: '#8E8E93',
    fontSize: 15,
  },
});
