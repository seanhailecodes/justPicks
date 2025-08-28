import { Redirect } from 'expo-router';

export default function Index() {
  // For now, redirect to login. Later you can add logic to check if user is authenticated
  return <Redirect href="/(auth)/login" />;
}