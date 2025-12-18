import { router, useLocalSearchParams } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import { supabase } from '../lib/supabase';
import { sanitizeGroupName, isValidGroupName } from '../lib/validation';

// Available sports for group creation
const SPORTS = [
  { key: 'nfl', label: 'NFL', emoji: '🏈' },
  { key: 'nba', label: 'NBA', emoji: '🏀' },
  { key: 'ncaab', label: 'NCAAB', emoji: '🏀' },
  { key: 'soccer', label: 'Soccer', emoji: '⚽' },
];

export default function CreateGroupScreen() {
  const { sport: sportParam } = useLocalSearchParams<{ sport?: string }>();
  const [groupName, setGroupName] = useState('');
  const [selectedSport, setSelectedSport] = useState(sportParam || 'nfl');
  const [isPrivate, setIsPrivate] = useState(false);
  const [requireApproval, setRequireApproval] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  // Update selected sport if param changes
  useEffect(() => {
    if (sportParam && SPORTS.find(s => s.key === sportParam)) {
      setSelectedSport(sportParam);
    }
  }, [sportParam]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  // Generate a random group code
  const generateGroupCode = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setInviteCode(code);
  };

  // Handle group name change with sanitization
  const handleGroupNameChange = (text: string) => {
    const sanitized = sanitizeGroupName(text);
    setGroupName(sanitized);
  };

  const handleCreate = async () => {
    // Validate group name
    const validation = isValidGroupName(groupName);
    if (!validation.valid) {
      Alert.alert('Invalid Name', validation.error);
      return;
    }

    if (!currentUserId) {
      Alert.alert('Error', 'You must be logged in to create a group');
      return;
    }

    setCreating(true);

    try {
      // Get user's tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('tier')
        .eq('id', currentUserId)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      // Define tier limits
      const tierLimits: { [key: string]: number } = {
        'bronze': 1,
        'silver': 3,
        'gold': 5,
        'platinum': 10,
        'pro': 25
      };

      const userTier = profile?.tier || 'bronze';
      const groupLimit = tierLimits[userTier];

      // Count existing groups as primary_owner
      const { count, error: countError } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUserId)
        .eq('role', 'primary_owner');

      if (countError) throw countError;

      if ((count || 0) >= groupLimit) {
        const tierNames: { [key: string]: string } = {
          'bronze': 'Bronze',
          'silver': 'Silver',
          'gold': 'Gold',
          'platinum': 'Platinum',
          'pro': 'Pro'
        };

        Alert.alert(
          'Group Limit Reached',
          `${tierNames[userTier]} membership allows ${groupLimit} group${groupLimit === 1 ? '' : 's'}. Want to create more? Upgrade your account!`,
          [{ text: 'OK' }]
        );
        setCreating(false);
        return;
      }

      // Generate code if not set
      let finalInviteCode = inviteCode.trim().toUpperCase();
      if (!finalInviteCode) {
        finalInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      }

      // Final sanitization before save
      const finalGroupName = sanitizeGroupName(groupName);

      // Create the group with all settings
      const { data: newGroup, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: finalGroupName,
          created_by: currentUserId,
          invite_code: finalInviteCode,
          visibility: isPrivate ? 'private' : 'public',
          require_approval: requireApproval,
          sport: selectedSport
        })
        .select()
        .single();

      if (groupError) throw groupError;

      // Add the creator as primary_owner
      const { error: memberError } = await supabase
        .from('group_members')
        .insert({
          group_id: newGroup.id,
          user_id: currentUserId,
          role: 'primary_owner'
        });

      if (memberError) throw memberError;

      const sportLabel = SPORTS.find(s => s.key === selectedSport)?.label || selectedSport.toUpperCase();
      Alert.alert(
        'Success!', 
        `${sportLabel} group "${finalGroupName}" created!${isPrivate ? ' This is a private group - only invited members can join.' : ''}`
      );
      
      // Navigate back to groups
      router.replace('/(tabs)/groups');
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setCreating(false);
    }
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
        {/* Sport Selector */}
        <View style={styles.section}>
          <Text style={styles.label}>Sport *</Text>
          <View style={styles.sportSelector}>
            {SPORTS.map((sport) => (
              <TouchableOpacity
                key={sport.key}
                style={[
                  styles.sportOption,
                  selectedSport === sport.key && styles.sportOptionSelected
                ]}
                onPress={() => setSelectedSport(sport.key)}
              >
                <Text style={styles.sportEmoji}>{sport.emoji}</Text>
                <Text style={[
                  styles.sportLabel,
                  selectedSport === sport.key && styles.sportLabelSelected
                ]}>
                  {sport.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.helperText}>Group picks will be filtered to this sport</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Group Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter group name"
            placeholderTextColor="#8E8E93"
            value={groupName}
            onChangeText={handleGroupNameChange}
            maxLength={30}
          />
          <Text style={styles.helperText}>{groupName.length}/30</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Group Code</Text>
          <View style={styles.codeContainer}>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="AUTO"
              placeholderTextColor="#8E8E93"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
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
          <Text style={styles.inviteDescription}>
            After creating your group, you'll be able to invite friends via email or share link.
          </Text>
        </View>

        <TouchableOpacity 
          style={[styles.createButton, (groupName.trim().length < 2 || creating) && styles.createButtonDisabled]}
          onPress={handleCreate}
          disabled={groupName.trim().length < 2 || creating}
        >
          <Text style={styles.createButtonText}>
            {creating ? 'Creating...' : 'Create Group'}
          </Text>
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
  helperText: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
  sportSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  sportOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#333',
    gap: 6,
  },
  sportOptionSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#2C1810',
  },
  sportEmoji: {
    fontSize: 18,
  },
  sportLabel: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
  },
  sportLabelSelected: {
    color: '#FF6B35',
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
  inviteDescription: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 20,
  },
  createButton: {
    backgroundColor: '#FF6B35',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});