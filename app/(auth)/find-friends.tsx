import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function FindFriendsScreen() {
  const [username, setUsername] = useState('');

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const handleAddUsername = () => {
    // TODO: Implement add friend by username
    console.log('Add friend:', username);
    setUsername('');
  };

  const handleConnectFacebook = () => {
    // TODO: Implement Facebook connection
    console.log('Connect Facebook');
  };

  const handleImportContacts = () => {
    // TODO: Implement contact import
    console.log('Import contacts');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Find Friends</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>How justPicks Works</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🎯</Text>
            <Text style={styles.infoText}>Make picks on any game - track them privately or share with friends</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>👥</Text>
            <Text style={styles.infoText}>Join groups to discuss picks before games start</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoIcon}>🏆</Text>
            <Text style={styles.infoText}>Build your accuracy score and climb the leaderboard</Text>
          </View>
        </View>

        <Text style={styles.description}>
          You can start making picks right away, or connect with friends first
        </Text>

        <TouchableOpacity style={styles.socialButton} onPress={handleConnectFacebook}>
          <Text style={styles.socialIcon}>📘</Text>
          <Text style={styles.socialButtonText}>Connect Facebook Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton} onPress={handleImportContacts}>
          <Text style={styles.socialIcon}>📞</Text>
          <Text style={styles.socialButtonText}>Import Phone Contacts</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add by Username</Text>
          <View style={styles.usernameInput}>
            <TextInput
              style={styles.input}
              placeholder="@username or friend code"
              placeholderTextColor="#8E8E93"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={[styles.addButton, !username && styles.addButtonDisabled]} 
              onPress={handleAddUsername}
              disabled={!username}
            >
              <Text style={styles.addButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Share</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <Text style={styles.qrText}>QR</Text>
            </View>
            <Text style={styles.qrDescription}>Share your QR code in person</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.continueButton} onPress={handleSkip}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
  },
  skipButton: {
    color: '#FF6B35',
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  description: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
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
  section: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  usernameInput: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    padding: 16,
    color: '#FFF',
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#333',
  },
  addButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  qrContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  qrPlaceholder: {
    width: 120,
    height: 120,
    backgroundColor: '#FFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  qrText: {
    color: '#000',
    fontSize: 24,
    fontWeight: 'bold',
  },
  qrDescription: {
    color: '#8E8E93',
    fontSize: 14,
  },
  continueButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 32,
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  infoTitle: {
    color: '#FF6B35',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-start',
  },
  infoIcon: {
    fontSize: 20,
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});