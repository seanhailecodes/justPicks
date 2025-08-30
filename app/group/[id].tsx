import PickModal from '@/components/PickModal';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function GroupDiscussionScreen() {
  const { id } = useLocalSearchParams();
  const [message, setMessage] = useState('');
  const [showPickModal, setShowPickModal] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Mock data for the discussion
  const groupData = {
    name: 'Work Friends',
    game: 'Cowboys @ Giants',
    time: 'Tonight 8:00 PM',
    lockTime: '2 hours',
    picksSubmitted: 3,
    totalMembers: 5,
  };

  const gameData = {
    homeTeam: 'Giants',
    awayTeam: 'Cowboys',
    spread: { home: 'NYG +3.5', away: 'DAL -3.5' },
    time: 'Tonight 8:00 PM',
  };

  const messages = [
    {
      id: 1,
      user: 'Mike',
      message: "Cowboys defense has been shaky lately, but Giants offense is even worse. Taking Cowboys -3.5",
      isMe: false,
      color: '#FF6B35',
    },
    {
      id: 2,
      user: 'Sarah',
      message: "Did you see the weather report? 15mph winds, might affect the passing game",
      isMe: false,
      color: '#34C759',
    },
    {
      id: 3,
      user: 'You',
      message: "Great point about the weather. That makes me think under 45.5 total points",
      isMe: true,
    },
    {
      id: 4,
      user: 'John',
      message: "Giants are 4-1 ATS at home this season though. I'm leaning Giants +3.5",
      isMe: false,
      color: '#007AFF',
    },
  ];

  const handleSend = () => {
    if (!message.trim()) return;
    // In a real app, this would send to a server
    console.log('Send message:', message);
    // Clear the input after sending
    setMessage('');
    // You could also add the message to the messages array here for instant feedback
  };

  const handlePickPress = () => {
    setShowPickModal(true);
  };

  const handlePickSubmit = (pickData: any) => {
    console.log('Pick submitted:', pickData);
    // In a real app, this would save the pick
    setShowPickModal(false);
    
    // Show feedback to user
    if (pickData.type === 'group') {
      // Could show a toast notification here
      console.log('Pick shared with group!');
    } else {
      console.log('Pick saved privately!');
    }
  };

  const handleBack = () => {
    router.replace('/(tabs)/groups');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.groupName}>{groupData.name}</Text>
          <Text style={styles.gameInfo}>{groupData.game} • {groupData.time}</Text>
        </View>
        <TouchableOpacity>
          <Text style={styles.menuIcon}>⋮</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.lockWarning}>
        <Text style={styles.lockIcon}>⏰</Text>
        <View>
          <Text style={styles.lockTitle}>Picks lock in {groupData.lockTime}</Text>
          <Text style={styles.lockSubtitle}>
            {groupData.picksSubmitted} of {groupData.totalMembers} members have submitted picks
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView 
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd()}
        >
          {messages.map(msg => (
            <View 
              key={msg.id} 
              style={[
                styles.messageBubble,
                msg.isMe && styles.myMessage
              ]}
            >
              {!msg.isMe && (
                <Text style={[styles.userName, { color: msg.color }]}>
                  {msg.user}
                </Text>
              )}
              <Text style={[styles.messageText, msg.isMe && styles.myMessageText]}>
                {msg.message}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.yourPick}>
          <Text style={styles.yourPickTitle}>Your Pick</Text>
          <TouchableOpacity style={styles.pickCard} onPress={handlePickPress}>
            <View>
              <Text style={styles.pickChoice}>Cowboys -3.5</Text>
              <Text style={styles.pickStatus}>You can change until picks lock</Text>
            </View>
            <Text style={styles.pickSelected}>Selected</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Share your thoughts..."
            placeholderTextColor="#8E8E93"
            value={message}
            onChangeText={setMessage}
            multiline
            maxHeight={100}
          />
          <TouchableOpacity 
            style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <PickModal
        visible={showPickModal}
        onClose={() => setShowPickModal(false)}
        onSubmit={handlePickSubmit}
        game={gameData}
        currentPick="away"
        groups={[groupData.name]}
      />
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
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  groupName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gameInfo: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  menuIcon: {
    color: '#FFF',
    fontSize: 24,
    padding: 8,
  },
  lockWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 12,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    gap: 12,
  },
  lockIcon: {
    fontSize: 20,
    color: '#FF9500',
  },
  lockTitle: {
    color: '#FF9500',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lockSubtitle: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 16,
  },
  messageBubble: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    maxWidth: '80%',
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#FF6B35',
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
    fontSize: 14,
  },
  messageText: {
    color: '#FFF',
    fontSize: 14,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFF',
  },
  yourPick: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  yourPickTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  pickCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 8,
  },
  pickChoice: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  pickStatus: {
    color: '#8E8E93',
    fontSize: 12,
  },
  pickSelected: {
    color: '#FF6B35',
    fontSize: 14,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    backgroundColor: '#1C1C1E',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  input: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFF',
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sendButtonDisabled: {
    backgroundColor: '#333',
  },
  sendButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});