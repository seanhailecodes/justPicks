import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
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

// Web-compatible alert
const showAlert = (title: string, message: string, setMessage: (msg: { type: 'success' | 'error'; text: string } | null) => void, onOk?: () => void) => {
  if (Platform.OS === 'web') {
    const type = title.toLowerCase().includes('error') ? 'error' : 'success';
    setMessage({ type, text: message });
    if (onOk) setTimeout(onOk, 2000);
  } else {
    Alert.alert(title, message, onOk ? [{ text: 'OK', onPress: onOk }] : undefined);
  }
};

export default function LoginScreen() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(mode === 'signup');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Show context if user came from an invite
  const pendingGroupCode = getPendingGroupCode();
  const pendingInvite = getPendingInvite();
  const hasInviteContext = pendingGroupCode || pendingInvite;

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handlePostAuthRedirect();
      }
    };
    checkSession();
  }, []);

  // Handle auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handlePostAuthRedirect();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handlePostAuthRedirect = () => {
    const pendingInvite = getPendingInvite();
    const pendingGroupCode = getPendingGroupCode();
    
    if (pendingInvite) {
      // Old invite system (by invite ID)
      router.replace(`/accept-invite/${pendingInvite}`);
    } else if (pendingGroupCode) {
      // New system - join by group code (will auto-join)
      router.replace(`/join/${pendingGroupCode}`);
    } else {
      router.replace('/(tabs)/home');
    }
  };

  const handleAuth = async () => {
    setMessage(null);
    
    if (!email.trim() || !password.trim()) {
      showAlert('Error', 'Please enter both email and password', setMessage);
      return;
    }

    setLoading(true);

    if (isSignUp) {
      // Sign up - requires email verification
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          emailRedirectTo: Platform.OS === 'web' 
            ? `${window.location.origin}/callback`
            : 'justpicks://auth/callback',
        }
      });

      if (error) {
        showAlert('Error', error.message, setMessage);
      } else {
        // Don't try to auto-login, just tell them to check email
        showAlert(
          'Check your email!', 
          'We sent you a verification link. Click it to activate your account.',
          setMessage,
          () => setIsSignUp(false)
        );
      }
    } else {
      // Sign in existing user
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password,
      });

      if (error) {
        showAlert('Error', error.message, setMessage);
      }
      // onAuthStateChange will handle redirect
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    setMessage(null);
    
    if (!email.trim()) {
      showAlert('Enter Email', 'Please enter your email address above, then tap Forgot Password.', setMessage);
      return;
    }

    setLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: Platform.OS === 'web'
        ? `${window.location.origin}/reset-password`
        : 'justpicks://reset-password',
    });

    setLoading(false);

    if (error) {
      showAlert('Error', error.message, setMessage);
    } else {
      showAlert('Check Your Email', `We've sent a password reset link to ${email.trim()}. Please check your inbox and spam folder.`, setMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Welcome to JustPicks</Text>
        
        {/* Show invite context banner */}
        {hasInviteContext && (
          <View style={styles.inviteBanner}>
            <Text style={styles.inviteBannerIcon}>🎉</Text>
            <Text style={styles.inviteBannerText}>
              {isSignUp 
                ? "Sign up to join the group you were invited to!"
                : "Log in to join the group you were invited to!"}
            </Text>
          </View>
        )}
        
        {message && (
          <View style={[styles.messageBox, message.type === 'error' ? styles.errorBox : styles.successBox]}>
            <Text style={[styles.messageText, message.type === 'error' ? styles.errorText : styles.successText]}>
              {message.text}
            </Text>
            <TouchableOpacity onPress={() => setMessage(null)} style={styles.dismissButton}>
              <Text style={styles.dismissText}>✕</Text>
            </TouchableOpacity>
          </View>
        )}
        
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

        {/* Forgot Password - always visible */}
        {!isSignUp && (
          <TouchableOpacity
            style={styles.forgotButton}
            onPress={handlePasswordReset}
          >
            <Text style={styles.forgotText}>Forgot Password?</Text>
          </TouchableOpacity>
        )}

        {/* Debug buttons - only visible in development */}
        {__DEV__ && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugLabel}>🛠 Dev Tools</Text>
            <Text style={styles.debugInfo}>
              Pending invite: {pendingInvite || 'none'}{'\n'}
              Pending group code: {pendingGroupCode || 'none'}
            </Text>
            <TouchableOpacity
              style={styles.debugButton}
              onPress={async () => {
                await supabase.auth.signOut();
                Alert.alert('Session cleared', 'Reload the app now');
              }}
            >
              <Text style={styles.debugButtonText}>Clear Session</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.disclaimer}>
          {isSignUp 
            ? 'By signing up, you agree to our Terms of Service'
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
  inviteBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderRadius: 8,
    padding: 12,
    marginVertical: 16,
  },
  inviteBannerIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  inviteBannerText: {
    color: '#FF6B35',
    fontSize: 14,
    flex: 1,
  },
  messageBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginVertical: 16,
  },
  errorBox: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  successBox: {
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    borderWidth: 1,
    borderColor: '#34C759',
  },
  messageText: {
    flex: 1,
    fontSize: 14,
  },
  errorText: {
    color: '#FF6B6B',
  },
  successText: {
    color: '#34C759',
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  dismissText: {
    color: '#8E8E93',
    fontSize: 16,
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
  forgotButton: {
    marginTop: 8,
    padding: 10,
  },
  forgotText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 40,
    padding: 16,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  debugLabel: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  debugInfo: {
    color: '#666',
    fontSize: 11,
    marginBottom: 12,
  },
  debugButton: {
    backgroundColor: '#333',
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
  },
  debugButtonText: {
    color: '#FFF',
    fontSize: 14,
  },
  disclaimer: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 24,
  },
});