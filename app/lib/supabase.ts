import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

const supabaseUrl = 'https://oyedfzsqqqdfrmhbcbwb.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95ZWRmenNxcXFkZnJtaGJjYndiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY1ODMwMDksImV4cCI6MjA3MjE1OTAwOX0.zlQAXksbwfK6y-pIQVgju9e1DG-Kj8Gmbpvvs9TPU5g'

// Simple storage that works everywhere
const storage = {
  getItem: async (key: string) => {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem(key);
    } else if (Platform.OS !== 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage.getItem(key);
    }
    return null;
  },
  setItem: async (key: string, value: string) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.setItem(key, value);
    } else if (Platform.OS !== 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage.setItem(key, value);
    }
  },
  removeItem: async (key: string) => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.removeItem(key);
    } else if (Platform.OS !== 'web') {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return AsyncStorage.removeItem(key);
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: storage as any,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});