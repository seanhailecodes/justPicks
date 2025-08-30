import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function RegisterScreen() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [username, setUsername] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
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

  const formatBirthDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    
    const match = cleaned.match(/^(\d{0,2})(\d{0,2})(\d{0,4})$/);
    if (match) {
      const parts = [
        match[1],
        match[2] ? `/${match[2]}` : '',
        match[3] ? `/${match[3]}` : ''
      ];
      return parts.join('');
    }
    
    return cleaned;
  };

  const handlePhoneChange = (text: string) => {
    setPhoneNumber(formatPhoneNumber(text));
  };

  const handleBirthDateChange = (text: string) => {
    setBirthDate(formatBirthDate(text));
  };

  const calculateAge = () => {
    const match = birthDate.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (!match) return null;
    
    const month = parseInt(match[1]);
    const day = parseInt(match[2]);
    const year = parseInt(match[3]);
    
    const birth = new Date(year, month - 1, day);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  };

  const handleCreateAccount = () => {
  const age = calculateAge();
  if (age && age >= 13) {
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    router.push({
      pathname: '/(auth)/verify',
      params: { 
        phone: `${countryCode}${cleanNumber}`,
        username: username,
        birthDate: birthDate,
        isNewUser: 'true'
      }
    });
  }
};

  const isValidPhone = phoneNumber.replace(/\D/g, '').length >= 10;
  const isValidUsername = username.length >= 3 && /^[a-zA-Z0-9_]+$/.test(username);
  const isValidAge = calculateAge() !== null && calculateAge()! >= 13;
  const isFormValid = isValidPhone && isValidUsername && isValidAge && agreedToTerms;

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
          <View style={styles.header}>
            <View style={styles.logo}>
              <Text style={styles.logoIcon}>⚡</Text>
            </View>
            <Text style={styles.title}>justPicks</Text>
            <Text style={styles.subtitle}>Sports Picks with Friends</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneContainer}>
                <TouchableOpacity style={styles.countryCode}>
                  <Text style={styles.countryCodeText}>{countryCode}</Text>
                  <Text style={styles.countryFlag}>🇺🇸</Text>
                </TouchableOpacity>
                
                <TextInput
                  style={styles.phoneInput}
                  placeholder="(555) 123-4567"
                  placeholderTextColor="#666"
                  value={phoneNumber}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  maxLength={14}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Choose a Username</Text>
              <TextInput
                style={styles.input}
                placeholder="pickmaster123"
                placeholderTextColor="#666"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={styles.helperText}>
                This is how friends will find you
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Date of Birth</Text>
              <TextInput
                style={styles.input}
                placeholder="MM/DD/YYYY"
                placeholderTextColor="#666"
                value={birthDate}
                onChangeText={handleBirthDateChange}
                keyboardType="number-pad"
                maxLength={10}
              />
              <Text style={styles.helperText}>
                You must be 13 or older to use justPicks
              </Text>
              {birthDate.length === 10 && !isValidAge && (
                <Text style={styles.errorText}>
                  You must be at least 13 years old
                </Text>
              )}
            </View>

            <TouchableOpacity 
              style={styles.termsContainer}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
            >
              <View style={styles.checkbox}>
                {agreedToTerms && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={styles.termsText}>
                I'm 13 or older and agree to the{' '}
                <Text style={styles.link}>Terms of Service</Text> and{' '}
                <Text style={styles.link}>Privacy Policy</Text>
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
              onPress={handleCreateAccount}
              disabled={!isFormValid}
            >
              <Text style={styles.primaryButtonText}>Create Account</Text>
            </TouchableOpacity>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyIcon}>🔒</Text>
              <Text style={styles.privacyText}>
                Your real name is never shown. Friends see only your username.
              </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Already have an account?{' '}
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>Sign In</Text>
                </TouchableOpacity>
              </Link>
            </Text>
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
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
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
    marginBottom: 20,
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
    fontSize: 16,
    color: '#8E8E93',
  },
  form: {
    marginBottom: 32,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  phoneContainer: {
    flexDirection: 'row',
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
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 6,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 13,
    marginTop: 4,
  },
  termsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: 'bold',
  },
  termsText: {
    color: '#8E8E93',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  link: {
    color: '#FF6B35',
    textDecorationLine: 'underline',
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
  privacyNote: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  privacyIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  privacyText: {
    color: '#FF6B35',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    color: '#8E8E93',
    fontSize: 14,
  },
  linkText: {
    color: '#FF6B35',
  },
});