import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function CreateGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [inviteCode, setInviteCode] = useState('');

  // Generate a random group code
  const generateGroupCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  const handleCreate = () => {
    if (!groupName.trim()) {
      // TODO: Show error
      return;
    }

    // Generate code if not set
    if (!inviteCode) {
      generateGroupCode();
    }

    // TODO: Actually create the group
    console.log('Create group:', {
      name: groupName,
      description,
      isPrivate,
      requireApproval,
      code: inviteCode,
    });

    // Navigate back to groups
    router.replace('/(tabs)/groups');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Create Group</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor="#8E8E93"
            value={groupName}
            onChangeText={setGroupName}
            maxLength={30}
          />
          <Text style={styles.helperText}>{groupName.length}/30</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="What's this group about?"
            placeholderTextColor="#8E8E93"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            maxLength={100}
          />
          <Text style={styles.helperText}>{description.length}/100</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Group Code</Text>
          <View style={styles.codeContainer}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="AUTO"
              placeholderTextColor="#8E8E93"
              value={inviteCode}
              onChangeText={setInviteCode}
              autoCapitalize="characters"
              maxLength={6}
            />
            <TouchableOpacity style={styles.generateButton} onPress={generateGroupCode}>
              <Text style={styles.generateButtonText}>Generate</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.helperText}>Friends will use this code to join</Text>
        </View>

        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Privacy Settings</Text>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Private Group</Text>
              <Text style={styles.settingDescription}>Only invited members can join</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor={isPrivate ? '#FFF' : '#8E8E93'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Require Approval</Text>
              <Text style={styles.settingDescription}>You approve new members</Text>
            </View>
            <Switch
              value={requireApproval}
              onValueChange={setRequireApproval}
              trackColor={{ false: '#333', true: '#FF6B35' }}
              thumbColor={requireApproval ? '#FFF' : '#8E8E93'}
            />
          </View>
        </View>

        <View style={styles.inviteSection}>
          <Text style={styles.sectionTitle}>Invite Friends</Text>
          <TouchableOpacity style={styles.inviteButton}>
            <Text style={styles.inviteIcon}>📱</Text>
            <Text style={styles.inviteText}>Share Invite Link</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.inviteButton}>
            <Text style={styles.inviteIcon}>👥</Text>
            <Text style={styles.inviteText}>Add from Friend List</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, !groupName.trim() && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={!groupName.trim()}
        >
          <Text style={styles.createButtonText}>Create Group</Text>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backButton: {
    padding: 8,
  },
  backIcon: {
    color: '#FFF',
    fontSize: 32,
  },
  title: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
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
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  codeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  codeInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  generateButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    justifyContent: 'center',
    borderRadius: 8,
  },
  generateButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingLabel: {
    color: '#FFF',
    fontSize: 16,
    marginBottom: 4,
  },
  settingDescription: {
    color: '#8E8E93',
    fontSize: 13,
  },
  inviteSection: {
    marginBottom: 32,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  inviteIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  inviteText: {
    color: '#FFF',
    fontSize: 16,
  },
  createButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#333',
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});