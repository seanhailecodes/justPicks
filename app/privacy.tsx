import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LAST_UPDATED = 'March 7, 2026';

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Privacy Policy</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Text style={styles.intro}>
          BetLess ("we," "our," or "us") is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights around it.
        </Text>

        <Text style={styles.sectionTitle}>1. What We Collect</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Account information:</Text> When you register, we collect your email address and a username you choose.{'\n\n'}
          <Text style={styles.bold}>Pick data:</Text> The sports picks you make, including game selections, spread or over/under choices, and outcomes.{'\n\n'}
          <Text style={styles.bold}>Wager data (optional):</Text> If you use the "Did you bet it?" feature, we store the wager amount and currency you enter. This data is private and never shared with other users.{'\n\n'}
          <Text style={styles.bold}>Group activity:</Text> Groups you create or join, and your standing on group leaderboards.{'\n\n'}
          <Text style={styles.bold}>Device information:</Text> Basic device locale (used only to determine your default currency). We do not collect your precise location.
        </Text>

        <Text style={styles.sectionTitle}>2. What We Do Not Collect</Text>
        <Text style={styles.body}>
          We do not collect, process, or store payment information of any kind. BetLess does not handle real money. We do not collect biometric data, contacts, or precise location. We do not sell your data to third parties.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.body}>
          We use your information to:{'\n\n'}
          • Provide and improve the BetLess app{'\n'}
          • Calculate and display your pick record, win rate, and P&L{'\n'}
          • Enable group features and leaderboards{'\n'}
          • Send optional notifications about your picks and groups{'\n'}
          • Respond to support requests
        </Text>

        <Text style={styles.sectionTitle}>4. Data Storage & Security</Text>
        <Text style={styles.body}>
          Your data is stored securely using Supabase, hosted on AWS infrastructure. We use industry-standard encryption in transit and at rest. Access to your data is restricted to you and our core team.
        </Text>

        <Text style={styles.sectionTitle}>5. Third-Party Services</Text>
        <Text style={styles.body}>
          We use the following third-party services to operate BetLess:{'\n\n'}
          • <Text style={styles.bold}>Supabase</Text> — authentication and database{'\n'}
          • <Text style={styles.bold}>The Odds API</Text> — sports odds data{'\n'}
          • <Text style={styles.bold}>Crisp</Text> — in-app support chat{'\n'}
          • <Text style={styles.bold}>Expo / EAS</Text> — app delivery{'\n\n'}
          Each of these services has their own privacy policies governing their handling of data.
        </Text>

        <Text style={styles.sectionTitle}>6. Your Rights</Text>
        <Text style={styles.body}>
          You may request to access, correct, or delete your personal data at any time by contacting us through the Support screen in the app. We will respond within 30 days. If you delete your account, all personal data is permanently removed from our systems.
        </Text>

        <Text style={styles.sectionTitle}>7. Children's Privacy</Text>
        <Text style={styles.body}>
          BetLess is not intended for users under the age of 17. We do not knowingly collect information from children. If you believe a child has created an account, please contact us and we will remove it promptly.
        </Text>

        <Text style={styles.sectionTitle}>8. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this policy from time to time. We will notify you of significant changes via the app or email. Continued use of BetLess after changes constitutes acceptance of the updated policy.
        </Text>

        <Text style={styles.sectionTitle}>9. Contact</Text>
        <Text style={styles.body}>
          Questions or requests? Reach us through the Support screen in the app or at:{'\n\n'}
          seanhaile.codes@gmail.com{'\n'}
          dontbet.online
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: { width: 60 },
  backText: { color: '#FF6B35', fontSize: 17 },
  title: { color: '#FFF', fontSize: 17, fontWeight: '600' },
  scroll: { flex: 1 },
  scrollContent: { padding: 24, paddingBottom: 60 },
  updated: { color: '#8E8E93', fontSize: 13, marginBottom: 20 },
  intro: { color: '#CCC', fontSize: 15, lineHeight: 24, marginBottom: 28 },
  sectionTitle: {
    color: '#FF6B35',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  body: { color: '#CCC', fontSize: 14, lineHeight: 23, marginBottom: 28 },
  bold: { color: '#FFF', fontWeight: '600' },
});
