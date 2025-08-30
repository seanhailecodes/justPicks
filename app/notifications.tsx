import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function NotificationsScreen() {
  const notifications = [
    {
      id: 1,
      type: 'pick_reminder',
      title: 'Picks Closing Soon!',
      message: 'Cowboys @ Giants picks lock in 30 minutes',
      time: '5m ago',
      unread: true,
      icon: '⏰',
      action: { type: 'group', groupId: 1 },
    },
    {
      id: 2,
      type: 'group_invite',
      title: 'Group Invitation',
      message: 'Tom invited you to join "March Madness 2025"',
      time: '1h ago',
      unread: true,
      icon: '👥',
      action: { type: 'invite', groupCode: 'MM2025' },
    },
    {
      id: 3,
      type: 'pick_result',
      title: 'Pick Results',
      message: 'Your Lakers ML pick was correct! +1 to your streak',
      time: '3h ago',
      unread: false,
      icon: '✅',
      action: { type: 'results', gameId: 2 },
    },
    {
      id: 4,
      type: 'friend_activity',
      title: 'Mike is on fire!',
      message: 'Your friend hit 5 picks in a row',
      time: '5h ago',
      unread: false,
      icon: '🔥',
      action: { type: 'profile', userId: 'mike123' },
    },
    {
      id: 5,
      type: 'achievement',
      title: 'New Achievement!',
      message: 'You earned "Weekend Warrior" - 10 correct weekend picks',
      time: '1d ago',
      unread: false,
      icon: '🏆',
      action: { type: 'achievement' },
    },
  ];

  const handleNotificationPress = (notification: any) => {
    switch (notification.action.type) {
      case 'group':
        router.push(`/group/${notification.action.groupId}`);
        break;
      case 'invite':
        // TODO: Handle group invite
        console.log('Join group:', notification.action.groupCode);
        break;
      case 'results':
        // TODO: Navigate to game results
        console.log('View results:', notification.action.gameId);
        break;
      case 'profile':
        // TODO: Navigate to user profile
        console.log('View profile:', notification.action.userId);
        break;
      default:
        console.log('Notification pressed:', notification);
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'pick_reminder': return '#FF9500';
      case 'group_invite': return '#007AFF';
      case 'pick_result': return '#34C759';
      case 'friend_activity': return '#FF6B35';
      case 'achievement': return '#FFD700';
      default: return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity>
          <Text style={styles.markAllRead}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No new notifications</Text>
            <Text style={styles.emptyText}>We'll notify you when something important happens</Text>
          </View>
        ) : (
          notifications.map(notification => (
            <TouchableOpacity 
              key={notification.id} 
              style={[styles.notificationCard, notification.unread && styles.unreadCard]}
              onPress={() => handleNotificationPress(notification)}
            >
              <View style={[styles.iconContainer, { backgroundColor: `${getIconColor(notification.type)}20` }]}>
                <Text style={styles.icon}>{notification.icon}</Text>
              </View>
              
              <View style={styles.contentContainer}>
                <View style={styles.notificationHeader}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.time}>{notification.time}</Text>
                </View>
                <Text style={styles.message}>{notification.message}</Text>
                {notification.unread && <View style={styles.unreadDot} />}
              </View>
            </TouchableOpacity>
          ))
        )}
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
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  markAllRead: {
    color: '#FF6B35',
    fontSize: 14,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    position: 'relative',
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    color: '#8E8E93',
    fontSize: 12,
  },
  message: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 18,
  },
  unreadDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF6B35',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyText: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});