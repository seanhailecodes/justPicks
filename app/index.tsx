import { Redirect } from 'expo-router';
import { Linking, Platform, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  // On web, show a landing page that pushes visitors to the App Store
  if (Platform.OS === 'web') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.logo}>justPicks</Text>
          <Text style={styles.headline}>Gamble smarter.{'\n'}Lose less.</Text>
          <Text style={styles.sub}>
            Track your real pick record across NBA, NFL, NCAAB and more.
            Compete with friends. Find out if you actually have an edge.
          </Text>

          <View style={styles.bullets}>
            <Text style={styles.bullet}>🏈  Spread, moneyline & over/under picks</Text>
            <Text style={styles.bullet}>👥  Private groups or anonymous public leagues</Text>
            <Text style={styles.bullet}>📊  Win rate, streaks & full pick history</Text>
            <Text style={styles.bullet}>📲  Invite friends with a single link</Text>
          </View>

          <TouchableOpacity
            style={styles.ctaButton}
            onPress={() => Linking.openURL('https://apps.apple.com/app/id6760871322')}
          >
            <Text style={styles.ctaText}>📲 Download on the App Store</Text>
          </TouchableOpacity>

          <Text style={styles.price}>$0.99 · No subscription · No ads</Text>

          <TouchableOpacity style={styles.signinLink} onPress={() => {}}>
            <Text style={styles.signinText}
              onPress={() => {
                if (typeof window !== 'undefined') window.location.href = '/(auth)/login';
              }}
            >
              Already have an account? Sign in →
            </Text>
          </TouchableOpacity>

          <Text style={styles.tagline}>No money. No gambling. Just bragging rights.</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Native app — go straight to login/auth flow
  return <Redirect href="/(auth)/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    maxWidth: 480,
    alignSelf: 'center',
    width: '100%',
  },
  logo: {
    color: '#FF6B35',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 24,
  },
  headline: {
    color: '#fff',
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 42,
  },
  sub: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 28,
  },
  bullets: {
    alignSelf: 'stretch',
    marginBottom: 32,
    gap: 12,
  },
  bullet: {
    color: '#EBEBF5',
    fontSize: 15,
    lineHeight: 22,
  },
  ctaButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 40,
    marginBottom: 12,
    width: '100%',
    alignItems: 'center',
  },
  ctaText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },
  price: {
    color: '#636366',
    fontSize: 13,
    marginBottom: 24,
  },
  signinLink: {
    marginBottom: 32,
  },
  signinText: {
    color: '#FF6B35',
    fontSize: 14,
  },
  tagline: {
    color: '#3A3A3C',
    fontSize: 12,
    textAlign: 'center',
  },
});
