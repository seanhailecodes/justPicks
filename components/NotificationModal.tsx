import React, { useState } from 'react';
import {
  Linking,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  Dimensions,
} from 'react-native';
import { useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';

interface NotificationModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'great' | 'struggling' | 'info';
  buttonText?: string;
  facebookShareUrl?: string; // When set, shows social share options
}

const { width } = Dimensions.get('window');

export default function NotificationModal({
  visible,
  onClose,
  title,
  message,
  type = 'info',
  buttonText = 'Got It!',
  facebookShareUrl,
}: NotificationModalProps) {
  const [showFallback, setShowFallback] = useState(false);

  const handleShare = async () => {
    const shareUrl = facebookShareUrl!;
    const shareText = `Check out my pick on justPicks 🏈`;

    // Native: opens iOS/Android share sheet (covers IG, TikTok, FB, WhatsApp, etc.)
    if (Platform.OS !== 'web') {
      try {
        await Share.share({ message: `${shareText}\n${shareUrl}`, url: shareUrl, title: shareText });
      } catch {}
      onClose();
      return;
    }

    // Web: try navigator.share (shows all installed apps on mobile browsers)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: shareText, url: shareUrl, text: shareText });
        onClose(); // shared successfully
      } catch (err: any) {
        if (err?.name === 'AbortError') {
          onClose(); // user cancelled the sheet — treat as "not now"
        } else {
          setShowFallback(true); // unexpected error — show manual buttons
        }
      }
      return; // never fall through to fallback when navigator.share exists
    }

    // Fallback: navigator.share unavailable (desktop Chrome/Firefox etc.)
    setShowFallback(true);
  };

  const openUrl = (url: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(url, '_blank', 'width=600,height=500');
    } else {
      Linking.openURL(url);
    }
    onClose();
  };
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const handScaleAnim = useRef(new Animated.Value(0)).current;
  const handRotateAnim = useRef(new Animated.Value(0)).current;
  const handBounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Haptic feedback on appear
      if (type === 'success') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      if (type === 'success') {
        // Hand punches in, wobbles, then settles
        handScaleAnim.setValue(0);
        handRotateAnim.setValue(0);
        handBounceAnim.setValue(0);

        Animated.sequence([
          // Punch in big
          Animated.spring(handScaleAnim, {
            toValue: 1.4,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
          // Settle to normal with wobble
          Animated.parallel([
            Animated.spring(handScaleAnim, {
              toValue: 1,
              friction: 6,
              tension: 50,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(handRotateAnim, { toValue: -0.15, duration: 80, useNativeDriver: true }),
              Animated.timing(handRotateAnim, { toValue: 0.15, duration: 80, useNativeDriver: true }),
              Animated.timing(handRotateAnim, { toValue: -0.1, duration: 60, useNativeDriver: true }),
              Animated.timing(handRotateAnim, { toValue: 0, duration: 60, useNativeDriver: true }),
            ]),
          ]),
          // Small bounce loop
          Animated.loop(
            Animated.sequence([
              Animated.timing(handBounceAnim, { toValue: -8, duration: 300, useNativeDriver: true }),
              Animated.timing(handBounceAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
            ]),
            { iterations: 3 }
          ),
        ]).start(() => {
          // Second haptic pulse after animation
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        });
      }
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
      handScaleAnim.setValue(0);
      handRotateAnim.setValue(0);
      handBounceAnim.setValue(0);
      setShowFallback(false);
    }
  }, [visible]);

  const getAccentColor = () => {
    switch (type) {
      case 'great':
        return '#34C759'; // Green for great performance
      case 'struggling':
        return '#FF9500'; // Orange for struggling (not red - more encouraging)
      case 'success':
        return '#FF6B35'; // Brand orange for pick confirmations
      default:
        return '#FF6B35';
    }
  };

  const getBackgroundGradient = () => {
    switch (type) {
      case 'great':
        return ['rgba(52, 199, 89, 0.15)', 'rgba(52, 199, 89, 0.05)'];
      case 'struggling':
        return ['rgba(255, 149, 0, 0.15)', 'rgba(255, 149, 0, 0.05)'];
      default:
        return ['rgba(255, 107, 53, 0.15)', 'rgba(255, 107, 53, 0.05)'];
    }
  };

  const accentColor = getAccentColor();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          {/* Accent bar at top */}
          <View style={[styles.accentBar, { backgroundColor: accentColor }]} />

          {/* Content */}
          <View style={styles.content}>
            {/* Animated hand for pick confirmations */}
            {type === 'success' && (
              <Animated.Text
                style={[
                  styles.handEmoji,
                  {
                    transform: [
                      { scale: handScaleAnim },
                      {
                        rotate: handRotateAnim.interpolate({
                          inputRange: [-1, 1],
                          outputRange: ['-30deg', '30deg'],
                        }),
                      },
                      { translateY: handBounceAnim },
                    ],
                  },
                ]}
              >
                👊
              </Animated.Text>
            )}

            {/* Title */}
            <Text style={styles.title}>{title}</Text>

            {/* Message */}
            <Text style={styles.message}>{message}</Text>

            {/* "Got It!" button — only show when there's no share option */}
            {!facebookShareUrl && (
              <TouchableOpacity
                style={[styles.button, { backgroundColor: accentColor }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{buttonText}</Text>
              </TouchableOpacity>
            )}

            {/* Social share — native sheet covers IG, TikTok, FB, WhatsApp etc. */}
            {facebookShareUrl && !showFallback && (
              <>
                <TouchableOpacity
                  style={styles.shareButton}
                  onPress={handleShare}
                  activeOpacity={0.85}
                >
                  <Text style={styles.shareButtonText}>📤  Share Pick</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                  <Text style={styles.skipText}>Not now</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Desktop fallback: specific platform buttons */}
            {facebookShareUrl && showFallback && (
              <>
                <Text style={styles.fallbackLabel}>Share to:</Text>
                <View style={styles.platformRow}>
                  <TouchableOpacity
                    style={[styles.platformBtn, { backgroundColor: '#1877F2' }]}
                    onPress={() => openUrl(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(facebookShareUrl)}`)}
                  >
                    <Text style={styles.platformBtnText}>Facebook</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.platformBtn, { backgroundColor: '#000' }]}
                    onPress={() => openUrl(`https://twitter.com/intent/tweet?url=${encodeURIComponent(facebookShareUrl)}&text=${encodeURIComponent('Check out my pick on justPicks 🏈')}`)}
                  >
                    <Text style={styles.platformBtnText}>X</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.platformBtn, { backgroundColor: '#25D366' }]}
                    onPress={() => openUrl(`https://wa.me/?text=${encodeURIComponent('Check out my pick on justPicks 🏈 ' + facebookShareUrl)}`)}
                  >
                    <Text style={styles.platformBtnText}>WhatsApp</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                  <Text style={styles.skipText}>Not now</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ============================================
// HOOK FOR MANAGING NOTIFICATIONS
// ============================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback } from 'react';
import {
  getPickConfirmationMessage,
  getWeeklyPerformanceMessage,
  shouldShowWeeklyNotification,
  getCurrentWeekNumber,
  NOTIFICATION_STORAGE_KEYS,
} from '../services/notifications';

interface NotificationState {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'great' | 'struggling' | 'info';
}

export function useNotifications() {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

  const showNotification = useCallback((
    title: string,
    message: string,
    type: 'success' | 'great' | 'struggling' | 'info' = 'info'
  ) => {
    setNotification({
      visible: true,
      title,
      message,
      type,
    });
  }, []);

  const hideNotification = useCallback(() => {
    setNotification(prev => ({ ...prev, visible: false }));
  }, []);

  /**
   * Show pick confirmation notification
   */
  const showPickConfirmation = useCallback((pickCount: number = 1) => {
    const msg = getPickConfirmationMessage(pickCount);
    showNotification(msg.title, msg.message, 'success');
  }, [showNotification]);

  /**
   * Check and show weekly performance notification if applicable
   */
  const checkWeeklyPerformance = useCallback(async (
    wins: number,
    losses: number
  ) => {
    try {
      // Check if we've already shown this week
      const lastCheckStr = await AsyncStorage.getItem(
        NOTIFICATION_STORAGE_KEYS.LAST_WEEKLY_CHECK
      );
      const lastWeekStr = await AsyncStorage.getItem(
        NOTIFICATION_STORAGE_KEYS.WEEKLY_CHECK_WEEK
      );

      const lastCheck = lastCheckStr ? parseInt(lastCheckStr, 10) : null;
      const lastWeek = lastWeekStr ? parseInt(lastWeekStr, 10) : null;
      const currentWeek = getCurrentWeekNumber();

      // Only show if it's a new week or 7+ days since last check
      if (lastWeek === currentWeek) {
        return; // Already shown this week
      }

      if (!shouldShowWeeklyNotification(lastCheck)) {
        return; // Not enough time has passed
      }

      const totalPicks = wins + losses;
      if (totalPicks < 3) {
        return; // Not enough picks to evaluate
      }

      const winRate = Math.round((wins / totalPicks) * 100);
      const msg = getWeeklyPerformanceMessage(winRate, wins, losses);

      if (msg) {
        showNotification(msg.title, msg.message, msg.type);

        // Update storage
        await AsyncStorage.setItem(
          NOTIFICATION_STORAGE_KEYS.LAST_WEEKLY_CHECK,
          Date.now().toString()
        );
        await AsyncStorage.setItem(
          NOTIFICATION_STORAGE_KEYS.WEEKLY_CHECK_WEEK,
          currentWeek.toString()
        );
      }
    } catch (error) {
      console.error('Error checking weekly performance:', error);
    }
  }, [showNotification]);

  return {
    notification,
    showNotification,
    hideNotification,
    showPickConfirmation,
    checkWeeklyPerformance,
  };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 340,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  accentBar: {
    height: 4,
    width: '100%',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  handEmoji: {
    fontSize: 64,
    marginBottom: 12,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#EBEBF5',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 140,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  shareButton: {
    marginTop: 12,
    backgroundColor: '#FF6B35',
    paddingVertical: 13,
    paddingHorizontal: 32,
    borderRadius: 12,
    minWidth: 180,
    alignItems: 'center',
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  fallbackLabel: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 14,
    marginBottom: 8,
  },
  platformRow: {
    flexDirection: 'row',
    gap: 8,
  },
  platformBtn: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  platformBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
  },
  skipButton: {
    marginTop: 10,
    padding: 6,
  },
  skipText: {
    color: '#555',
    fontSize: 13,
  },
});