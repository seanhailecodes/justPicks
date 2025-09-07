import { Platform } from 'react-native';

const createStorage = () => {
  if (Platform.OS === 'web') {
    // For web, use a mock storage during build and localStorage at runtime
    if (typeof window === 'undefined') {
      // During SSR/build time
      return {
        getItem: async () => null,
        setItem: async () => {},
        removeItem: async () => {},
      };
    }
    // At runtime in browser
    return {
      getItem: async (key: string) => localStorage.getItem(key),
      setItem: async (key: string, value: string) => localStorage.setItem(key, value),
      removeItem: async (key: string) => localStorage.removeItem(key),
    };
  } else {
    // For mobile
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    return AsyncStorage;
  }
};

export default createStorage();