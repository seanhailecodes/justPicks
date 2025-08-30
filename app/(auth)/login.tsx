import { Ionicons } from '@expo/vector-icons';
import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function LoginScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');

  const formatPhoneNumber = (text: string) => {
    // Remove all non-numeric characters
    const cleaned = text.replace(/\D/g, '');
    
    // Format as (XXX) XXX-XXXX for US numbers
    if (countryCode === '+1') {
      const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
      if (match) {
        const parts = [
          match[1] ? `(${match[1]}` : '',
          match[2] ? `) ${match[2]}` : match[1] ? ')' : '',
          match[3] ? `-${match[3]}` : ''
        ];
        return parts.join('').trim();
      }
    }
    
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleLogin = () => {
    // TODO: Implement phone authentication
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    if (cleanNumber.length >= 10) {
      // Will connect to auth service later
      router.replace('/(tabs)/home');
    }
  };

  const handleFaceID = () => {
    // TODO: Implement Face ID authentication
    console.log('Face ID login');
  };

  const isValidPhone = phoneNumber.replace(/\D/g, '').length >= 10;

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
            <Text style={styles.subtitle}>Sports Picks with Friends</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.phoneContainer}>
              <TouchableOpacity style={styles.countryCode}>
                <Text style={styles.countryCodeText}>{countryCode}</Text>
                <Text style={styles.countryFlag}>🇺🇸</Text>
              </TouchableOpacity>
              
              <TextInput
                style={styles.phoneInput}
                placeholder="(555) 123-4567"
                placeholderTextColor="#8E8E93"
                value={phoneNumber}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
                maxLength={14} // (XXX) XXX-XXXX
              />
            </View>

            <TouchableOpacity 
              style={[styles.primaryButton, !isValidPhone && styles.primaryButtonDisabled]} 
              onPress={handleLogin}
              disabled={!isValidPhone}
            >
              <Text style={styles.primaryButtonText}>Continue</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.faceIDButton} onPress={handleFaceID}>
              <Ionicons name="person-circle-outline" size={20} color="#FFF" />
              <Text style={styles.faceIDButtonText}>Sign in with Face ID</Text>
            </TouchableOpacity>

            <Text style={styles.helpText}>
              We'll send you a verification code
            </Text>
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
  phoneContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 12,
  },
  countryCode: {
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  countryCodeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
  countryFlag: {
    fontSize: 20,
  },
  phoneInput: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 16,
    color: '#FFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonDisabled: {
    backgroundColor: '#333',
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
  helpText: {
    textAlign: 'center',
    color: '#8E8E93',
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
});