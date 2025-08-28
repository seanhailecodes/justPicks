import { router } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function GroupsScreen() {
  const [groupCode, setGroupCode] = useState('');

  const groups = [
    {
      id: 1,
      name: 'Work Friends',
      memberCount: 5,
      creator: 'Mike',
      members: ['M', 'J', 'S'],
      extraMembers: 2,
      status: 'Discussion: Cowboys vs Giants',
      statusColor: '#FF9500',
    },
    {
      id: 2,
      name: 'Family Picks',
      memberCount: 8,
      creator: 'Dad',
      members: ['D', 'M', 'K'],
      extraMembers: 5,
      status: 'All picks submitted',
      statusColor: '#34C759',
    },
    {
      id: 3,
      name: 'College Buddies',
      memberCount: 10,
      creator: 'Tom',
      members: ['T', 'R'],
      extraMembers: 8,
      status: 'No active picks',
      statusColor: '#8E8E93',
    },
  ];

  const handleCreateGroup = () => {
    router.push('/group/create');
  };

  const handleJoinGroup = () => {
    if (!groupCode) return;
    // TODO: Implement join group
    console.log('Join group:', groupCode);
    setGroupCode('');
  };

  const handleGroupPress = (groupId: number) => {
    router.push(`/group/${groupId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Groups</Text>
        <TouchableOpacity onPress={handleCreateGroup}>
          <Text style={styles.createButton}>+ Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Group List */}
        {groups.map(group => (
          <TouchableOpacity 
            key={group.id} 
            style={styles.groupCard}
            onPress={() => handleGroupPress(group.id)}
          >
            <View style={styles.groupHeader}>
              <Text style={styles.groupName}>{group.name}</Text>
              <View style={styles.membersContainer}>
                {group.members.map((initial, index) => (
                  <View key={index} style={[styles.avatar, index > 0 && styles.avatarOverlap]}>
                    <Text style={styles.avatarText}>{initial}</Text>
                  </View>
                ))}
                {group.extraMembers > 0 && (
                  <Text style={styles.extraMembers}>+{group.extraMembers}</Text>
                )}
              </View>
            </View>
            
            <Text style={styles.groupInfo}>
              {group.memberCount} members • Created by {group.creator}
            </Text>
            
            <View style={[styles.statusBadge, { backgroundColor: group.statusColor }]}>
              <Text style={styles.statusText}>{group.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* Join Group Section */}
        <View style={styles.joinSection}>
          <Text style={styles.sectionTitle}>Join a Group</Text>
          <View style={styles.joinContainer}>
            <TextInput
              style={styles.input}
              placeholder="Group code"
              placeholderTextColor="#8E8E93"
              value={groupCode}
              onChangeText={setGroupCode}
              autoCapitalize="none"
            />
            <TouchableOpacity 
              style={[styles.joinButton, !groupCode && styles.joinButtonDisabled]}
              onPress={handleJoinGroup}
              disabled={!groupCode}
            >
              <Text style={styles.joinButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingBottom: 16,
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  createButton: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingTop: 8,
    paddingBottom: 100,
  },
  groupCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  groupName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  membersContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 28,
    height: 28,
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1C1C1E',
  },
  avatarOverlap: {
    marginLeft: -8,
  },
  avatarText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  extraMembers: {
    color: '#8E8E93',
    fontSize: 12,
    marginLeft: 8,
  },
  groupInfo: {
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 12,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  joinSection: {
    marginTop: 32,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  joinContainer: {
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
  joinButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: '#333',
  },
  joinButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});