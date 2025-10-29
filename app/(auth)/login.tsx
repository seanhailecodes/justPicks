import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        router.replace('/(tabs)/home');
      }
    };
    checkSession();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)/home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

    const handleAuth = async () => {
      if (!email.trim() || !password.trim()) {
        Alert.alert('Error', 'Please enter both email and password');
        return;
      }

      setLoading(true);

      if (isSignUp) {
        // Sign up - requires email verification
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            emailRedirectTo: 'justpicks://auth/callback',  // ← THE KEY LINE
          }
        });

        if (error) {
          Alert.alert('Error', error.message);
        } else {
          // Don't try to auto-login, just tell them to check email
          Alert.alert(
            'Check your email!', 
            'We sent you a verification link. Click it to activate your account.',
            [{ text: 'OK', onPress: () => setIsSignUp(false) }]
          );
        }
      } else {
        // Sign in existing user
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password,
        });

        if (error) {
          Alert.alert('Error', error.message);
        }
      }

      setLoading(false);
    };

    const handlePasswordReset = async () => {
  if (!email.trim()) {
    Alert.alert('Error', 'Please enter your email address');
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
    redirectTo: 'justpicks://reset-password',
  });

  if (error) {
    Alert.alert('Error', error.message);
  } else {
    Alert.alert('Check your email', 'Password reset link sent!');
  }
};

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Welcome to justPicks</Text>
        
        <Text style={styles.subtitle}>
          {isSignUp ? 'Create your account' : 'Sign in to continue'}
        </Text>

        <TextInput
          style={styles.input}
          placeholder="your.email@example.com"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TextInput
          style={styles.input}
          placeholder="Password (min 6 characters)"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />

        <TouchableOpacity
          style={styles.button}
          onPress={handleAuth}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : isSignUp ? 'Sign Up' : 'Log In'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.switchButton}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <Text style={styles.switchText}>
            {isSignUp 
              ? 'Already have an account? Log In' 
              : "Don't have an account? Sign Up"}
          </Text>
        </TouchableOpacity>

        {/* Temporary debug button */}
        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#666', marginTop: 20 }]}
          onPress={async () => {
            const { error } = await supabase.auth.signOut();
            if (error) {
              Alert.alert('Error signing out', error.message);
            } else {
              Alert.alert('Signed out', 'Session cleared');
            }
          }}
        >
          <Text style={styles.buttonText}>Debug: Sign Out</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: '#444', marginTop: 10 }]}
          onPress={handlePasswordReset}
        >
          <Text style={styles.buttonText}>Reset Password</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          {isSignUp 
            ? 'Your account will be created instantly'
            : 'Welcome back! Enter your credentials to continue'
          }
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  switchButton: {
    marginTop: 20,
    padding: 10,
  },
  switchText: {
    color: '#FF6B35',
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});