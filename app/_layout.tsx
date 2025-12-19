// app/_layout.tsx
import { Stack } from 'expo-router';
import { NotificationProvider } from '../components/NotificationContext';

export default function RootLayout() {
  return (
    <NotificationProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="game/[gameId]" options={{ headerShown: false }} />
        <Stack.Screen name="history/picks" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
  );
}