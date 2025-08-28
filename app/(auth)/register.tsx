import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const handleRegister = () => {
    if (!agreeToTerms) {
      // TODO: Show error
      return;
    }
    // TODO: Implement actual registration
    // Navigate to find friends screen
    router.push('/(auth)/find-friends');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.logo}>
                <Text style={styles.logoIcon}>⚡</Text>
              </View>
              <Text style={styles.title}>justPicks</Text>
              <Text style={styles.subtitle}>Smart Sports Predictions with Friends</Text>
            </View>

            <View style={styles.socialContainer}>
              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>📘</Text>
                <Text style={styles.socialButtonText}>Sign up with Facebook</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.socialButton}>
                <Text style={styles.socialIcon}>🔍</Text>
                <Text style={styles.socialButtonText}>Sign up with Google</Text>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#8E8E93"
                  value={fullName}
                  onChangeText={setFullName}
                  autoCapitalize="words"
                />
              </View>

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
                  placeholder="Phone Number"
                  placeholderTextColor="#8E8E93"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Create Password"
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

              <View style={styles.termsContainer}>
                <Switch
                  value={agreeToTerms}
                  onValueChange={setAgreeToTerms}
                  trackColor={{ false: '#333', true: '#FF6B35' }}
                  thumbColor={agreeToTerms ? '#FFF' : '#8E8E93'}
                />
                <Text style={styles.termsText}>
                  I'm 13 or older and agree to the{' '}
                  <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
                  <Text style={styles.termsLink}>Privacy Policy</Text>
                </Text>
              </View>

              <TouchableOpacity 
                style={[styles.primaryButton, !agreeToTerms && styles.primaryButtonDisabled]} 
                onPress={handleRegister}
                disabled={!agreeToTerms}
              >
                <Text style={styles.primaryButtonText}>Create Account</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>
                Already have an account? {' '}
                <Link href="/(auth)/login" asChild>
                  <TouchableOpacity>
                    <Text style={styles.linkText}>Sign In</Text>
                  </TouchableOpacity>
                </Link>
              </Text>
            </View>
          </View>
        </ScrollView>
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
  scrollContent: {
    flexGrow: 1,
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
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
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  termsText: {
    flex: 1,
    marginLeft: 12,
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 18,
  },
  termsLink: {
    color: '#FF6B35',
    textDecorationLine: 'underline',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#333',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
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
  socialContainer: {
    marginBottom: 20,
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
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
});