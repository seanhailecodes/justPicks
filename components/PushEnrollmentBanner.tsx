import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import storage from '../app/lib/storage';
import { usePushNotifications } from '../hooks/usePushNotifications';

const DISMISSED_KEY = 'betless_push_dismissed_v1';

export default function PushEnrollmentBanner() {
  const { permission, subscribed, loading, isSupported, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Only render on web
  if (Platform.OS !== 'web') return null;
  if (!isSupported) return null;
  if (subscribed || permission === 'granted') return null;
  if (permission === 'denied') return null;
  if (dismissed) return null;

  const handleEnable = async () => {
    const ok = await subscribe();
    if (!ok) {
      // If denied, dismiss the banner permanently
      handleDismiss();
    }
  };

  const handleDismiss = async () => {
    setDismissed(true);
    await storage.setItem(DISMISSED_KEY, 'true');
  };

  return (
    <View style={styles.banner}>
      <View style={styles.left}>
        <Text style={styles.bell}>🔔</Text>
        <View>
          <Text style={styles.title}>Stay in the loop</Text>
          <Text style={styles.body}>Get notified when your picks are resolved.</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.enableBtn}
          onPress={handleEnable}
          disabled={loading}
        >
          <Text style={styles.enableBtnText}>{loading ? '…' : 'Enable'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.dismiss}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1C1C1E',
    borderWidth: 1,
    borderColor: '#FF6B3540',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bell: {
    fontSize: 22,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  enableBtn: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
  },
  enableBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  dismiss: {
    color: '#48484A',
    fontSize: 16,
    fontWeight: '600',
  },
});
