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
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="accept-invite/[inviteId]" options={{ headerShown: false }} />
        <Stack.Screen name="join/[code]" options={{ headerShown: false }} />
        <Stack.Screen name="callback" options={{ headerShown: false }} />
        <Stack.Screen name="group/group-picks" options={{ headerShown: false }} />
        <Stack.Screen name="group/browse-groups" options={{ headerShown: false }} />
      </Stack>
    </NotificationProvider>
  );
}