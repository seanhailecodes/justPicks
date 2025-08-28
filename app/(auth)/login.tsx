import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = () => {
    // TODO: Implement actual authentication
    router.replace('/(tabs)/home');
  };

  const handleFaceID = () => {
    // TODO: Implement Face ID authentication
    console.log('Face ID login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <Text style={styles.title}>Welcome Back!</Text>
            <Text style={styles.subtitle}>Sign in to view your picks</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#8E8E93"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#8E8E93"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-outline" : "eye-off-outline"} 
                  size={20} 
                  color="#8E8E93" 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
              <Text style={styles.primaryButtonText}>Sign In</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.faceIDButton} onPress={handleFaceID}>
              <Ionicons name="person-circle-outline" size={20} color="#FFF" />
              <Text style={styles.faceIDButtonText}>Sign in with Face ID</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.divider} />
            </View>

            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>📘</Text>
              <Text style={styles.socialButtonText}>Continue with Facebook</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.socialButton}>
              <Text style={styles.socialIcon}>🔍</Text>
              <Text style={styles.socialButtonText}>Continue with Google</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Don't have an account? {' '}
              <Link href="/(auth)/register" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign Up</Text>
                </TouchableOpacity>
              </Link>
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoIcon: {
    fontSize: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  faceIDButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 16,
  },
  faceIDButtonText: {
    color: '#FFF',
    fontSize: 16,
    marginLeft: 8,
  },
  forgotPassword: {
    alignItems: 'center',
  },
  forgotPasswordText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  linkText: {
    color: '#FF6B35',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  dividerText: {
    color: '#8E8E93',
    paddingHorizontal: 16,
    fontSize: 12,
  },
  socialButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  socialIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  socialButtonText: {
    color: '#FFF',
    fontSize: 16,
  },
});