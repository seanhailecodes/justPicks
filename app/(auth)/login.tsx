import { router } from 'expo-router';
import { useEffect, useState } from 'react'; //add useEffect
import { Alert, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { DEV_MODE } from '../lib/auth-dev';
import { supabase } from '../lib/supabase';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(false);
  const [resendTimer, setResendTimer] = useState(0); //add resend

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOTP = async () => {
    // TEMPORARY: Skip SMS in dev mode
    if (DEV_MODE) {
    Alert.alert('Dev Mode', 'Skipping SMS - going to home');
    router.replace('/(tabs)/home');
    return;
  }
    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
    });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setConfirmationResult(true);
      setResendTimer(60); // 60 second cooldown
      Alert.alert('Success', 'Check your phone for the verification code');``
    }
    setLoading(false);
  };

  const handleResendCode = () => {
    setOtp('');
    handleSendOTP();
  };

  const handleVerifyOTP = async () => {
    setLoading(true);
    const { error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: otp,
      type: 'sms'
    });
    
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(tabs)/home');
    }
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to justPicks</Text>
        
        <TextInput
          style={styles.input}
          placeholder="+1 (555) 123-4567"
          placeholderTextColor="#666"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          editable={!confirmationResult}
        />

        {confirmationResult && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter 6-digit code"
            placeholderTextColor="#666"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          
          {resendTimer > 0 ? (
            <Text style={styles.resendText}>
              Resend code in {resendTimer}s
            </Text>
          ) : (
            <TouchableOpacity onPress={handleResendCode}>
              <Text style={styles.resendLink}>
                Didn't receive a code? Tap to resend
              </Text>
            </TouchableOpacity>
          )}
        </>
      )}

        <TouchableOpacity
          style={styles.button}
          onPress={confirmationResult ? handleVerifyOTP : handleSendOTP}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? 'Loading...' : confirmationResult ? 'Verify Code' : 'Send Code'}
          </Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          By continuing, you agree to receive SMS verification codes
        </Text>
      </View>
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
    marginBottom: 40,
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
  disclaimer: {
    color: '#8E8E93',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
  },
  resendLink: {
    color: '#FF6B35',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    textDecorationLine: 'underline',
}
});