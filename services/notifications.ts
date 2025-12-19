import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationModal from './NotificationModal';
import {
  getPickConfirmationMessage,
  getWeeklyPerformanceMessage,
  shouldShowWeeklyNotification,
  getCurrentWeekNumber,
  NOTIFICATION_STORAGE_KEYS,
} from '../services/notifications';

// ============================================
// TYPES
// ============================================

interface NotificationState {
  visible: boolean;
  title: string;
  message: string;
  type: 'success' | 'great' | 'struggling' | 'info';
  buttonText?: string;
}

interface NotificationContextType {
  showNotification: (
    title: string,
    message: string,
    type?: 'success' | 'great' | 'struggling' | 'info',
    buttonText?: string
  ) => void;
  showPickConfirmation: (pickCount?: number) => void;
  checkWeeklyPerformance: (wins: number, losses: number) => Promise<void>;
}

// ============================================
// CONTEXT
// ============================================

const NotificationContext = createContext<NotificationContextType | null>(null);

// ============================================
// PROVIDER
// ============================================

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notification, setNotification] = useState<NotificationState>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
    buttonText: 'Got It!',
  });

  const showNotification = useCallback((
    title: string,
    message: string,
    type: 'success' | 'great' | 'struggling' | 'info' = 'info',
    buttonText: string = 'Got It!'
  ) => {
    setNotification({
      visible: true,
      title,
      message,
      type,
      buttonText,
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
   * Call this on app open / home screen mount
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

      // Only show if it's a new week
      if (lastWeek === currentWeek) {
        console.log('Weekly notification already shown this week');
        return;
      }

      // Also check 7-day minimum gap
      if (!shouldShowWeeklyNotification(lastCheck)) {
        console.log('Not enough time since last weekly notification');
        return;
      }

      const totalPicks = wins + losses;
      if (totalPicks < 3) {
        console.log('Not enough picks for weekly summary:', totalPicks);
        return;
      }

      const winRate = Math.round((wins / totalPicks) * 100);
      const msg = getWeeklyPerformanceMessage(winRate, wins, losses);

      if (msg) {
        // Determine button text based on performance
        const buttonText = msg.type === 'great' 
          ? "Let's Go!" 
          : "Fresh Start!";
        
        showNotification(msg.title, msg.message, msg.type, buttonText);

        // Update storage to prevent showing again this week
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

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showPickConfirmation,
        checkWeeklyPerformance,
      }}
    >
      {children}
      <NotificationModal
        visible={notification.visible}
        onClose={hideNotification}
        title={notification.title}
        message={notification.message}
        type={notification.type}
        buttonText={notification.buttonText}
      />
    </NotificationContext.Provider>
  );
}

// ============================================
// HOOK
// ============================================

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
}