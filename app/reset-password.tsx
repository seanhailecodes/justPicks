import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from './lib/supabase';

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth event:', event);

      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
        setInitializing(false);
      } else if (event === 'SIGNED_IN' && session) {
        setReady(true);
        setInitializing(false);
      }
    });

    const checkExistingSession = async () => {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const { data: { session } } = await supabase.auth.getSession();

      if (session) {
        setReady(true);
      } else {
        setError('Invalid or expired reset link. Please request a new one.');
      }
      setInitializing(false);
    };

    if (Platform.OS === 'web') {
      const hash = window.location.hash;
      if (hash && hash.includes('type=recovery')) {
        setTimeout(() => {
          if (initializing) {
            checkExistingSession();
          }
        }, 3000);
      } else {
        checkExistingSession();
      }
    } else {
      checkExistingSession();
    }

    return () => subscription.unsubscribe();
  }, []);

  const handleResetPassword = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        if (Platform.OS === 'web') {
          alert('Password updated successfully!');
          router.replace('/(tabs)/home');
        } else {
          Alert.alert(
            'Password Updated!',
            'Your password has been successfully reset.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
          );
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Verifying reset link...</Text>
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
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.buttonText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!ready) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Preparing password reset...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <Text style={styles.title}>Reset Password</Text>
        <Text style={styles.subtitle}>Enter your new password below</Text>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="New password (min 6 characters)"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowPassword(v => !v)}>
            <Text style={styles.eyeIcon}>{showPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            placeholder="Confirm new password"
            placeholderTextColor="#666"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity style={styles.eyeButton} onPress={() => setShowConfirmPassword(v => !v)}>
            <Text style={styles.eyeIcon}>{showConfirmPassword ? '🙈' : '👁️'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleResetPassword}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Updating...' : 'Update Password'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.linkText}>Back to Login</Text>
        </TouchableOpacity>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
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
  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    padding: 16,
    paddingRight: 52,
    color: '#FFF',
    fontSize: 16,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  eyeIcon: {
    fontSize: 20,
    color: '#FF6B35',
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    padding: 10,
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 14,
    textAlign: 'center',
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
    paddingHorizontal: 20,
  },
});
