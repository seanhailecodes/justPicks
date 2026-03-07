import { router } from 'expo-router';
import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const LAST_UPDATED = 'March 7, 2026';

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Terms of Service</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>Last updated: {LAST_UPDATED}</Text>

        <Text style={styles.intro}>
          By using BetLess, you agree to these Terms of Service. Please read them carefully. If you do not agree, do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>1. What BetLess Is</Text>
        <Text style={styles.body}>
          BetLess is a sports pick tracking application. It allows users to log predictions on sporting events, track their accuracy over time, and compete with friends in groups. BetLess does not facilitate, process, or enable real-money gambling of any kind. The optional wager tracking feature is a personal logging tool only — BetLess never holds, transfers, or processes funds.
        </Text>

        <Text style={styles.sectionTitle}>2. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 17 years old to use BetLess. By creating an account, you confirm that you meet this requirement. If you are under 17, please do not use the app.
        </Text>

        <Text style={styles.sectionTitle}>3. Your Account</Text>
        <Text style={styles.body}>
          You are responsible for maintaining the security of your account and password. You agree not to share your credentials with others. You are responsible for all activity that occurs under your account. Notify us immediately if you suspect unauthorized access.
        </Text>

        <Text style={styles.sectionTitle}>4. Acceptable Use</Text>
        <Text style={styles.body}>
          You agree not to:{'\n\n'}
          • Use BetLess for any unlawful purpose{'\n'}
          • Attempt to manipulate leaderboards or pick outcomes{'\n'}
          • Harass, abuse, or harm other users{'\n'}
          • Reverse engineer, scrape, or otherwise misuse the app or its data{'\n'}
          • Create multiple accounts to gain an unfair advantage{'\n\n'}
          We reserve the right to suspend or terminate accounts that violate these terms.
        </Text>

        <Text style={styles.sectionTitle}>5. No Gambling</Text>
        <Text style={styles.body}>
          BetLess is not a gambling platform. No real money is wagered, won, or lost through BetLess. The wager tracking feature is a private, optional logging tool and does not constitute gambling. Users are solely responsible for any real-money gambling activity they engage in outside of BetLess. BetLess expressly disclaims any responsibility for such activity.
        </Text>

        <Text style={styles.sectionTitle}>6. Picks & Accuracy</Text>
        <Text style={styles.body}>
          Pick results are graded based on official game outcomes and odds data from third-party providers. While we strive for accuracy, we cannot guarantee that all results are graded correctly or in real time. If you believe a pick was graded in error, contact us through the Support screen.
        </Text>

        <Text style={styles.sectionTitle}>7. Groups</Text>
        <Text style={styles.body}>
          Group admins are responsible for managing their groups in accordance with these terms. We reserve the right to remove groups or members that violate our policies. Group leaderboards are for entertainment purposes only.
        </Text>

        <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
        <Text style={styles.body}>
          All content, design, and code within BetLess is owned by or licensed to us. You may not reproduce, distribute, or create derivative works without our written permission. You retain ownership of any content you submit (such as usernames and group names), but grant us a license to display it within the app.
        </Text>

        <Text style={styles.sectionTitle}>9. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          BetLess is provided "as is" without warranties of any kind. We do not guarantee uninterrupted service, error-free operation, or the accuracy of sports data. Use of the app is at your own risk.
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.body}>
          To the fullest extent permitted by law, BetLess and its operators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the app, including any real-money gambling losses incurred outside the app.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to These Terms</Text>
        <Text style={styles.body}>
          We may update these terms at any time. We will notify you of significant changes via the app or email. Continued use of BetLess after changes constitutes acceptance of the updated terms.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact</Text>
        <Text style={styles.body}>
          Questions about these terms? Reach us through the Support screen in the app or at:{'\n\n'}
          seanhaile.codes@gmail.com{'\n'}
          betless.io
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
