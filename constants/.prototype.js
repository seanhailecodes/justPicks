import { Ionicons } from '@expo/vector-icons';
import * as LocalAuthentication from 'expo-local-authentication';
import { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

const { width } = Dimensions.get('window');

const JustPicksApp = () => {
  const [currentScreen, setCurrentScreen] = useState('login');
  const [currentTab, setCurrentTab] = useState('home');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [userPicks, setUserPicks] = useState({});
  const [showPickModal, setShowPickModal] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');

  // Simulated data
  const groups = [
    { id: 1, name: 'Work Friends', members: 5, creator: 'Mike', status: 'waiting', activePicks: 2, avatars: ['M', 'J', 'S'] },
    { id: 2, name: 'Family Picks', members: 8, creator: 'Dad', status: 'complete', activePicks: 0, avatars: ['D', 'M', 'K'] },
    { id: 3, name: 'College Buddies', members: 10, creator: 'Tom', status: 'inactive', activePicks: 0, avatars: ['T', 'R'] }
  ];

  const games = [
    { 
      id: 1, 
      team1: 'Cowboys', 
      team2: 'Giants', 
      time: '8:00 PM', 
      league: 'NFL',
      spread: 3.5,
      locked: false,
      hoursUntilLock: 2,
      userPick: 'Giants +3.5',
      confidence: 'high'
    },
    { 
      id: 2, 
      team1: 'Lakers', 
      team2: 'Warriors', 
      time: '10:30 PM', 
      league: 'NBA',
      spread: 2.5,
      locked: false,
      hoursUntilLock: 5,
      userPick: null,
      confidence: null
    }
  ];

  const groupMessages = [
    { id: 1, user: 'Mike', message: 'Cowboys defense has been shaky lately, but Giants offense is even worse. Taking Cowboys -3.5', color: '#FF6B35' },
    { id: 2, user: 'Sarah', message: 'Did you see the weather report? 15mph winds, might affect the passing game', color: '#34C759' },
    { id: 3, user: 'You', message: 'Great point about the weather. That makes me think under 45.5 total points', isMe: true },
    { id: 4, user: 'John', message: "Giants are 4-1 ATS at home this season though. I'm leaning Giants +3.5", color: '#007AFF' }
  ];

  useEffect(() => {
    if (selectedGroup) {
      setMessages(groupMessages);
    }
  }, [selectedGroup]);

  // Face ID Authentication
  const authenticateWithFaceId = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) {
        Alert.alert('Not Supported', 'Your device does not support Face ID/Touch ID');
        return;
      }

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to sign in to justPicks',
        fallbackLabel: 'Use Passcode',
      });

      if (result.success) {
        setCurrentScreen('home');
      }
    } catch (error) {
      Alert.alert('Authentication Error', 'Failed to authenticate');
    }
  };

  // Screen Components
  const LoginScreen = () => {
    const [isLogin, setIsLogin] = useState(true);
    
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.logoContainer}>
              <View style={styles.logo}>
                <Ionicons name="flash" size={32} color="#FF6B35" />
              </View>
              <Text style={styles.appTitle}>justPicks</Text>
              <Text style={styles.subtitle}>
                {isLogin ? 'Sign in to view your picks' : 'Smart Sports Predictions with Friends'}
              </Text>
            </View>

            {isLogin ? (
              <>
                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#8E8E93"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry
                  />
                  
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setCurrentScreen('home')}
                  >
                    <Text style={styles.primaryButtonText}>Sign In</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={authenticateWithFaceId}
                  >
                    <Ionicons name="phone-portrait-outline" size={20} color="white" />
                    <Text style={styles.secondaryButtonText}>Sign in with Face ID</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.footer}>
                  <TouchableOpacity>
                    <Text style={styles.linkText}>Forgot Password?</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerText}>
                    Don't have an account?{' '}
                    <Text onPress={() => setIsLogin(false)} style={styles.linkText}>
                      Sign Up
                    </Text>
                  </Text>
                </View>
              </>
            ) : (
              <>
                <View style={styles.formContainer}>
                  <TextInput
                    style={styles.input}
                    placeholder="Full Name"
                    placeholderTextColor="#8E8E93"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#8E8E93"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone Number"
                    placeholderTextColor="#8E8E93"
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Create Password"
                    placeholderTextColor="#8E8E93"
                    secureTextEntry
                  />
                  
                  <View style={styles.checkboxContainer}>
                    <Switch
                      trackColor={{ false: "#767577", true: "#FF6B35" }}
                      thumbColor="white"
                      style={styles.checkbox}
                    />
                    <Text style={styles.checkboxText}>
                      I'm 13 or older and agree to the Terms of Service and Privacy Policy
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => setCurrentScreen('findFriends')}
                  >
                    <Text style={styles.primaryButtonText}>Create Account</Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.footerText}>
                  Already have an account?{' '}
                  <Text onPress={() => setIsLogin(true)} style={styles.linkText}>
                    Sign In
                  </Text>
                </Text>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  };

  const FindFriendsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find Friends</Text>
        <TouchableOpacity onPress={() => setCurrentScreen('home')}>
          <Text style={styles.linkText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.screenContent}>
        <Text style={styles.centerText}>Connect with friends to share sports predictions</Text>

        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="logo-facebook" size={20} color="#3B5998" />
          <Text style={styles.socialButtonText}>Connect Facebook Friends</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.socialButton}>
          <Ionicons name="call" size={20} color="#34C759" />
          <Text style={styles.socialButtonText}>Import Phone Contacts</Text>
        </TouchableOpacity>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add by Username</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="@username or friend code"
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.smallButton}>
              <Text style={styles.primaryButtonText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>QR Code Share</Text>
          <View style={styles.qrContainer}>
            <View style={styles.qrCode}>
              <Ionicons name="qr-code" size={48} color="black" />
            </View>
            <Text style={styles.qrText}>Share your QR code in person</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const HomeScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good evening!</Text>
          <Text style={styles.headerTitle}>Hey Alex</Text>
        </View>
        <Ionicons name="notifications-outline" size={24} color="white" />
      </View>

      <ScrollView style={styles.screenContent}>
        <View style={styles.statsCard}>
          <Text style={styles.statsLabel}>Your Prediction Accuracy</Text>
          <Text style={styles.statsValue}>73%</Text>
          <View style={styles.statsRow}>
            <Text style={[styles.statItem, { color: '#34C759' }]}>24 Correct</Text>
            <Text style={[styles.statItem, { color: '#FF3B30' }]}>9 Wrong</Text>
            <Text style={[styles.statItem, { color: '#FF9500' }]}>3 Pending</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Active Groups</Text>
        {groups.slice(0, 2).map(group => (
          <TouchableOpacity key={group.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{group.name}</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Waiting: {group.activePicks}/{group.members}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>Cowboys vs Giants • Picks due: 2 hours</Text>
            <View style={styles.pickInfo}>
              <Text style={styles.pickText}>Your pick: Giants +3.5</Text>
              <View style={[styles.confidenceBadge, { backgroundColor: '#34C759' }]}>
                <Text style={styles.confidenceText}>High Confidence</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Today's Games</Text>
        {games.map(game => (
          <TouchableOpacity key={game.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{game.team1} @ {game.team2}</Text>
              <Text style={styles.timeText}>{game.time}</Text>
            </View>
            <Text style={styles.cardSubtitle}>{game.league} • Week 12</Text>
            {game.userPick ? (
              <View style={styles.pickInfo}>
                <Text style={styles.pickText}>Your pick: {game.userPick}</Text>
                <View style={styles.confidenceInfo}>
                  <View style={[styles.confidenceBadge, { backgroundColor: '#34C759' }]}>
                    <Text style={styles.confidenceText}>{game.confidence}</Text>
                  </View>
                  <Text style={styles.confidencePercent}>85%</Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity 
                onPress={() => {
                  setSelectedGame(game);
                  setShowPickModal(true);
                }}
              >
                <Text style={styles.linkText}>Make Pick →</Text>
              </TouchableOpacity>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );

  const GroupsScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Groups</Text>
        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="add" size={24} color="#FF6B35" />
          <Text style={styles.linkText}>Create</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.screenContent}>
        {groups.map(group => (
          <TouchableOpacity 
            key={group.id} 
            style={styles.card}
            onPress={() => {
              setSelectedGroup(group);
              setCurrentScreen('discussion');
            }}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{group.name}</Text>
              <View style={styles.avatarRow}>
                {group.avatars.map((avatar, i) => (
                  <View key={i} style={styles.avatar}>
                    <Text style={styles.avatarText}>{avatar}</Text>
                  </View>
                ))}
                <Text style={styles.moreText}>+{group.members - group.avatars.length}</Text>
              </View>
            </View>
            <Text style={styles.cardSubtitle}>{group.members} members • Created by {group.creator}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: 
                group.status === 'waiting' ? '#FF9500' :
                group.status === 'complete' ? '#34C759' : '#48484A'
              }
            ]}>
              <Text style={styles.statusText}>
                {group.status === 'waiting' ? 'Discussion: Cowboys vs Giants' :
                 group.status === 'complete' ? 'All picks submitted' :
                 'No active picks'}
              </Text>
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Join a Group</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, styles.flexInput]}
              placeholder="Group code"
              placeholderTextColor="#8E8E93"
            />
            <TouchableOpacity style={styles.smallButton}>
              <Text style={styles.primaryButtonText}>Join</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const DiscussionScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.flex1}>
          <Text style={styles.headerTitle}>{selectedGroup?.name}</Text>
          <Text style={styles.headerSubtitle}>Cowboys @ Giants • Tonight 8:00 PM</Text>
        </View>
        <TouchableOpacity onPress={() => setCurrentScreen('groups')}>
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.warningBanner}>
        <Ionicons name="time-outline" size={16} color="#FF9500" />
        <Text style={styles.warningText}>Picks lock in 2 hours</Text>
      </View>

      <ScrollView style={styles.chatContainer}>
        {messages.map(msg => (
          <View key={msg.id} style={[
            styles.messageBubble,
            msg.isMe && styles.myMessage
          ]}>
            {!msg.isMe && (
              <Text style={[styles.messageUser, { color: msg.color }]}>{msg.user}</Text>
            )}
            <Text style={styles.messageText}>{msg.message}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.inputContainer}>
        <View style={styles.currentPick}>
          <Text style={styles.currentPickText}>Cowboys -3.5</Text>
          <Text style={styles.selectedText}>Selected</Text>
        </View>
        
        <View style={styles.messageInputRow}>
          <TextInput
            style={[styles.input, styles.messageInput]}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Share your thoughts..."
            placeholderTextColor="#8E8E93"
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={() => {
              if (newMessage) {
                setMessages([...messages, { 
                  id: messages.length + 1, 
                  user: 'You', 
                  message: newMessage, 
                  isMe: true 
                }]);
                setNewMessage('');
              }
            }}
          >
            <Ionicons name="send" size={20} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );

  const GamesScreen = () => {
    const [selectedSport, setSelectedSport] = useState('football');
    
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Games</Text>
          <Ionicons name="calendar-outline" size={24} color="white" />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.sportTabs}
        >
          {['Football', 'Basketball', 'College', 'Other'].map(sport => (
            <TouchableOpacity
              key={sport}
              onPress={() => setSelectedSport(sport.toLowerCase())}
              style={[
                styles.sportTab,
                selectedSport === sport.toLowerCase() && styles.sportTabActive
              ]}
            >
              <Text style={[
                styles.sportTabText,
                selectedSport === sport.toLowerCase() && styles.sportTabTextActive
              ]}>
                {sport}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView style={styles.screenContent}>
          {games.map(game => (
            <View key={game.id} style={styles.card}>
              <View style={styles.gameHeader}>
                <View>
                  <Text style={styles.cardTitle}>{game.team1} @ {game.team2}</Text>
                  <Text style={styles.cardSubtitle}>{game.league} • Today {game.time} EST</Text>
                </View>
                <Text style={[
                  styles.lockTime,
                  { color: game.hoursUntilLock < 3 ? '#FF9500' : '#34C759' }
                ]}>
                  {game.hoursUntilLock}h to lock
                </Text>
              </View>

              <View style={styles.pickButtons}>
                <TouchableOpacity 
                  style={[
                    styles.pickButton,
                    game.userPick === `${game.team1} -${game.spread}` && styles.pickButtonActive
                  ]}
                  onPress={() => {
                    setSelectedGame(game);
                    setShowPickModal(true);
                  }}
                >
                  <Text style={[
                    styles.pickButtonText,
                    game.userPick === `${game.team1} -${game.spread}` && styles.pickButtonTextActive
                  ]}>
                    {game.team1} -{game.spread}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[
                    styles.pickButton,
                    game.userPick === `${game.team2} +${game.spread}` && styles.pickButtonActive
                  ]}
                  onPress={() => {
                    setSelectedGame(game);
                    setShowPickModal(true);
                  }}
                >
                  <Text style={[
                    styles.pickButtonText,
                    game.userPick === `${game.team2} +${game.spread}` && styles.pickButtonTextActive
                  ]}>
                    {game.team2} +{game.spread}
                  </Text>
                </TouchableOpacity>
              </View>

              {game.userPick && (
                <View style={styles.reasoningBox}>
                  <Text style={styles.reasoningTitle}>Your Reasoning:</Text>
                  <Text style={styles.reasoningText}>
                    "{game.team2} defense is solid at home, {game.team1} on the road struggle. Weather conditions favor the underdog."
                  </Text>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  };

  const ProfileScreen = () => (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
        <Ionicons name="shield-checkmark-outline" size={24} color="white" />
      </View>

      <ScrollView style={styles.screenContent}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Ionicons name="trophy" size={32} color="white" />
          </View>
          <Text style={styles.profileName}>PickMaster47</Text>
          <Text style={styles.profileSubtitle}>Hidden Identity • Member since Dec 2024</Text>
          <Text style={styles.riskLevel}>Risk Level: Conservative</Text>
        </View>

        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Prediction Profile</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>73%</Text>
              <Text style={styles.statLabel}>Accuracy</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: '#34C759' }]}>Conservative</Text>
              <Text style={styles.statLabel}>Risk Rating</Text>
            </View>
          </View>

          <View style={styles.statsList}>
            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Spread Picks:</Text>
              <Text style={[styles.statsItemValue, { color: '#FF9500' }]}>68% (34/50)</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Moneyline:</Text>
              <Text style={[styles.statsItemValue, { color: '#34C759' }]}>81% (65/80)</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Over/Under:</Text>
              <Text style={[styles.statsItemValue, { color: '#FF6B35' }]}>72% (36/50)</Text>
            </View>
            <View style={styles.statsItem}>
              <Text style={styles.statsItemLabel}>Parlays (2-3 legs):</Text>
              <Text style={[styles.statsItemValue, { color: '#FF3B30' }]}>45% (9/20)</Text>
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Risk Assessment</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '30%' }]} />
          </View>
          <Text style={styles.riskTitle}>Conservative Player</Text>
          <Text style={styles.riskText}>• Prefers safer moneyline picks</Text>
          <Text style={styles.riskText}>• Avoids complex parlays</Text>
          <Text style={styles.riskText}>• Good influence on risky players</Text>
        </View>

        <View style={styles.settingsList}>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsText}>Friends & Groups</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsText}>Account Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Text style={styles.settingsText}>Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#8E8E93" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsItem}>
            <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
            <Text style={[styles.settingsText, { color: '#FF3B30' }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );

  const PickModal = () => {
    const [confidence, setConfidence] = useState('medium');
    const [reasoning, setReasoning] = useState('');
    
    return (
      <Modal
        visible={showPickModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Why This Pick?</Text>
              <TouchableOpacity onPress={() => setShowPickModal(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <View style={styles.pickPreview}>
              <Text style={styles.pickPreviewText}>
                {selectedGame?.team2} +{selectedGame?.spread}
              </Text>
              <Text style={styles.pickPreviewSubtext}>
                {selectedGame?.team1} @ {selectedGame?.team2} • Today {selectedGame?.time}
              </Text>
            </View>

            <Text style={styles.modalLabel}>Share your reasoning (optional):</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={reasoning}
              onChangeText={setReasoning}
              placeholder="Why do you think this pick will hit?"
              placeholderTextColor="#8E8E93"
              multiline
              numberOfLines={3}
            />

            <Text style={styles.modalLabel}>Confidence Level:</Text>
            <View style={styles.confidenceButtons}>
              {['low', 'medium', 'high'].map(level => (
                <TouchableOpacity
                  key={level}
                  onPress={() => setConfidence(level)}
                  style={[
                    styles.confidenceButton,
                    confidence === level && styles.confidenceButtonActive
                  ]}
                >
                  <Text style={[
                    styles.confidenceButtonText,
                    confidence === level && styles.confidenceButtonTextActive
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                  <Text style={styles.confidencePercent}>
                    {level === 'low' ? '40-60%' : level === 'medium' ? '70-80%' : '85-95%'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSecondary]}
                onPress={() => setShowPickModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonPrimary]}
                onPress={() => {
                  setUserPicks({
                    ...userPicks,
                    [selectedGame?.id]: {
                      pick: `${selectedGame?.team2} +${selectedGame?.spread}`,
                      confidence,
                      reasoning
                    }
                  });
                  setShowPickModal(false);
                  Alert.alert('Success', 'Your pick has been submitted!');
                }}
              >
                <Text style={styles.modalButtonText}>Submit Pick</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    );
  };

  const TabBar = () => (
    <View style={styles.tabBar}>
      {[
        { id: 'home', icon: 'home', label: 'Home' },
        { id: 'groups', icon: 'people', label: 'Groups' },
        { id: 'games', icon: 'trophy', label: 'Games' },
        { id: 'profile', icon: 'person-circle', label: 'Profile' }
      ].map(tab => (
        <TouchableOpacity
          key={tab.id}
          style={styles.tabItem}
          onPress={() => {
            setCurrentTab(tab.id);
            setCurrentScreen(tab.id);
          }}
        >
          <Ionicons
            name={tab.icon}
            size={24}
            color={currentTab === tab.id ? '#FF6B35' : '#8E8E93'}
          />
          <Text style={[
            styles.tabLabel,
            currentTab === tab.id && styles.tabLabelActive
          ]}>
            {tab.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderScreen = () => {
    switch (currentScreen) {
      case 'login': return <LoginScreen />;
      case 'findFriends': return <FindFriendsScreen />;
      case 'home': return <HomeScreen />;
      case 'groups': return <GroupsScreen />;
      case 'games': return <GamesScreen />;
      case 'profile': return <ProfileScreen />;
      case 'discussion': return <DiscussionScreen />;
      default: return <HomeScreen />;
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {renderScreen()}
      {!['login', 'findFriends', 'discussion'].includes(currentScreen) && <TabBar />}
      <PickModal />
    </View>
  );
};

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  screenContent: {
    flex: 1,
    padding: 16,
    paddingBottom: 80,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginTop: 2,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  greeting: {
    fontSize: 12,
    color: '#8E8E93',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 64,
    height: 64,
    backgroundColor: '#1C1C1E',
    borderWidth: 2,
    borderColor: '#FF6B35',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#8E8E93',
    textAlign: 'center',
  },
  formContainer: {
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    borderRadius: 8,
    padding: 12,
    color: 'white',
    fontSize: 16,
    marginBottom: 12,
  },
  flexInput: {
    flex: 1,
    marginBottom: 0,
  },
  messageInput: {
    flex: 1,
    marginBottom: 0,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: '#FF6B35',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  secondaryButtonText: {
    color: 'white',
    fontSize: 16,
  },
  socialButton: {
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#2C2C2E',
    padding: 14,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  socialButtonText: {
    color: 'white',
    fontSize: 16,
  },
  smallButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  checkbox: {
    marginRight: 8,
  },
  checkboxText: {
    flex: 1,
    fontSize: 12,
    color: '#8E8E93',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 16,
  },
  linkText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  centerText: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 14,
    marginBottom: 24,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  qrContainer: {
    backgroundColor: '#1C1C1E',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  qrCode: {
    width: 80,
    height: 80,
    backgroundColor: 'white',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrText: {
    fontSize: 12,
    color: '#8E8E93',
  },
  statsCard: {
    backgroundColor: '#1C1C1E',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  statsLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statsValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 16,
  },
  statBox: {
    alignItems: 'center',
  },
  statsList: {
    marginTop: 12,
  },
  statsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statsItemLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  statsItemValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#1C1C1E',
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  badge: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  pickInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  confidenceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  confidenceText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  confidenceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidencePercent: {
    fontSize: 10,
    color: '#8E8E93',
  },
  timeText: {
    fontSize: 12,
    color: '#FF9500',
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 24,
    height: 24,
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -8,
    borderWidth: 1,
    borderColor: '#000',
  },
  avatarText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '600',
  },
  moreText: {
    fontSize: 10,
    color: '#8E8E93',
    marginLeft: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 10,
    color: 'white',
    fontWeight: '500',
  },
  warningBanner: {
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 16,
    marginBottom: 0,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    color: '#FF9500',
    fontSize: 14,
    fontWeight: '600',
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageBubble: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    maxWidth: '80%',
  },
  myMessage: {
    backgroundColor: '#FF6B35',
    alignSelf: 'flex-end',
  },
  messageUser: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: 'white',
  },
  inputContainer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
  },
  currentPick: {
    backgroundColor: '#1C1C1E',
    padding: 12,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  currentPickText: {
    fontSize: 14,
    color: 'white',
  },
  selectedText: {
    fontSize: 14,
    color: '#FF6B35',
  },
  messageInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sendButton: {
    backgroundColor: '#FF6B35',
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportTabs: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 50,
  },
  sportTab: {
    backgroundColor: '#2C2C2E',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  sportTabActive: {
    backgroundColor: '#FF6B35',
  },
  sportTabText: {
    fontSize: 12,
    color: 'white',
  },
  sportTabTextActive: {
    fontWeight: '600',
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  lockTime: {
    fontSize: 12,
    fontWeight: '600',
  },
  pickButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pickButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  pickButtonActive: {
    backgroundColor: '#FF6B35',
  },
  pickButtonText: {
    fontSize: 14,
    color: 'white',
  },
  pickButtonTextActive: {
    fontWeight: '600',
  },
  reasoningBox: {
    backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 8,
  },
  reasoningTitle: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
    marginBottom: 4,
  },
  reasoningText: {
    fontSize: 11,
    color: '#8E8E93',
    fontStyle: 'italic',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    backgroundColor: '#FF6B35',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 4,
  },
  profileSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
  },
  riskLevel: {
    fontSize: 14,
    color: '#FF6B35',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#2C2C2E',
    borderRadius: 3,
    marginBottom: 12,
  },
  progressFill: {
    height: 6,
    backgroundColor: '#34C759',
    borderRadius: 3,
  },
  riskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 8,
  },
  riskText: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 4,
  },
  settingsList: {
    marginTop: 20,
  },
  settingsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  settingsText: {
    fontSize: 16,
    color: 'white',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1C1C1E',
    flexDirection: 'row',
    paddingBottom: 20,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#2C2C2E',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    color: '#8E8E93',
    marginTop: 4,
  },
  tabLabelActive: {
    color: '#FF6B35',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  modalLabel: {
    fontSize: 12,
    color: '#8E8E93',
    marginBottom: 8,
    marginTop: 16,
  },
  pickPreview: {
    backgroundColor: '#2C2C2E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  pickPreviewText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginBottom: 4,
  },
  pickPreviewSubtext: {
    fontSize: 12,
    color: '#8E8E93',
  },
  confidenceButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  confidenceButton: {
    flex: 1,
    backgroundColor: '#2C2C2E',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  confidenceButtonActive: {
    backgroundColor: '#FF6B35',
  },
  confidenceButtonText: {
    fontSize: 12,
    color: 'white',
    fontWeight: '600',
    marginBottom: 2,
  },
  confidenceButtonTextActive: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#FF6B35',
  },
  modalButtonSecondary: {
    backgroundColor: '#2C2C2E',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  flex1: {
    flex: 1,
  },
});

export default JustPicksApp;