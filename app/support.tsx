import { router } from 'expo-router';
import { useState } from 'react';
import { Linking, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const CRISP_WEBSITE_ID = process.env.EXPO_PUBLIC_CRISP_WEBSITE_ID;
const CRISP_CHAT_URL = `https://go.crisp.chat/chat/embed/?website_id=${CRISP_WEBSITE_ID}`;

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSection {
  title: string;
  items: FAQItem[];
}

const FAQ_DATA: FAQSection[] = [
  {
    title: '🎯 The Basics',
    items: [
      {
        question: 'What is BetLess?',
        answer: "BetLess lets you track sports picks, compete with friends, and see how sharp your instincts really are — no money required. It's about the prediction, not the bet.",
      },
      {
        question: 'Do I need to bet real money to use this?',
        answer: 'Never. BetLess is 100% pick tracking. The optional wager feature is just for logging what you already did elsewhere — we never take or handle money.',
      },
      {
        question: 'What sports are supported?',
        answer: 'NBA, NHL, MLB, NFL, NCAAB, Soccer, UFC, and PGA. In-season sports show active games; off-season sports are still visible in your history.',
      },
    ],
  },
  {
    title: '📋 Making Picks',
    items: [
      {
        question: 'How do I make a pick?',
        answer: 'Go to Games, find a matchup, and tap it. You can pick the spread, over/under, or both. Confirm and your pick is locked in.',
      },
      {
        question: 'Can I change a pick after I save it?',
        answer: "No — picks are locked once saved, just like a real bet. That's what keeps the stats honest.",
      },
      {
        question: 'When do my picks get graded?',
        answer: "Picks are automatically graded once the game result is in. You'll see your record update on your Profile.",
      },
      {
        question: "What does 'Pending' mean?",
        answer: "A pending pick is one where the game hasn't finished yet. It won't count toward your win rate until it's graded.",
      },
    ],
  },
  {
    title: '💰 Wager Tracking',
    items: [
      {
        question: "What is the 'Did you bet it?' toggle?",
        answer: "It's an optional field to log how much you wagered on a pick — purely for your own P&L tracking. Nobody else can see it.",
      },
      {
        question: 'How is my P&L calculated?',
        answer: 'We use standard -110 juice: a $10 wager wins $9.09 profit. Losses deduct the full wager. Your Season P&L on your Profile adds it all up.',
      },
      {
        question: 'Is my wager data private?',
        answer: 'Yes, completely. Wager amounts are only visible to you and are never shared with other users or groups.',
      },
    ],
  },
  {
    title: '👥 Groups',
    items: [
      {
        question: 'How do I create a group?',
        answer: "Tap the Groups tab at the bottom of the screen, then tap \"Create Group.\" Give your group a name, choose whether it's public or private, and you're done. You'll be the group admin.",
      },
      {
        question: 'How do I invite people to my group?',
        answer: 'From your group page, tap \"Invite\" to generate a unique invite link. Share it anywhere — text, iMessage, WhatsApp, whatever. Anyone who taps it gets taken straight into your group.',
      },
      {
        question: 'How do I join a group?',
        answer: "Tap an invite link from a friend and you'll be added automatically. You can also browse public groups from the Groups tab and tap \"Join.\"",
      },
      {
        question: 'How do group picks work?',
        answer: "Every member makes their own picks independently — nobody can see each other's picks until the game starts. After games are graded, everyone's results are visible on the group leaderboard.",
      },
      {
        question: 'How does the group leaderboard work?',
        answer: 'The leaderboard ranks members by win rate on picks made within the group. The more picks a member makes, the more accurate their ranking. Ties are broken by total number of picks.',
      },
      {
        question: "What's the difference between public and private groups?",
        answer: 'Public groups are discoverable in the Browse Groups section and anyone can join. Private groups are invite-only — only people with your link can find and join them.',
      },
      {
        question: 'Can I be in multiple groups?',
        answer: 'Yes — join as many as you like. Your picks count toward every group you belong to.',
      },
      {
        question: 'Can I remove someone from my group?',
        answer: 'Yes, if you are the group admin. Go to your group, tap the member, and select Remove. They will no longer appear on the leaderboard.',
      },
      {
        question: 'How do I leave a group?',
        answer: "Open the group, tap the settings icon in the top right, and select \"Leave Group.\" Your past picks will be removed from that group's leaderboard.",
      },
    ],
  },
  {
    title: '🔑 Account',
    items: [
      {
        question: 'I forgot my password.',
        answer: "Tap 'Forgot Password' on the login screen and we'll send a reset link to your email.",
      },
      {
        question: 'How do I change my username?',
        answer: 'Account settings are coming soon. In the meantime, tap the chat button below and we can sort it out.',
      },
      {
        question: 'How do I delete my account?',
        answer: "Tap the chat button below and we'll take care of it right away.",
      },
    ],
  },
];

export default function SupportScreen() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggle = (key: string) => {
    setExpanded(prev => (prev === key ? null : key));
  };

  const openChat = () => {
    Linking.openURL(CRISP_CHAT_URL);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Support</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>Frequently Asked Questions</Text>

        {FAQ_DATA.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.items.map((item, idx) => {
              const key = `${section.title}-${idx}`;
              const isOpen = expanded === key;
              return (
                <TouchableOpacity
                  key={key}
                  style={[styles.faqItem, isOpen && styles.faqItemOpen]}
                  onPress={() => toggle(key)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqRow}>
                    <Text style={styles.faqQuestion}>{item.question}</Text>
                    <Text style={styles.faqChevron}>{isOpen ? '▲' : '▼'}</Text>
                  </View>
                  {isOpen && (
                    <Text style={styles.faqAnswer}>{item.answer}</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        {/* Still need help */}
        <View style={styles.chatCard}>
          <Text style={styles.chatTitle}>Still need help?</Text>
          <Text style={styles.chatSubtitle}>
            Chat with us — we usually reply within a few hours.
          </Text>
          <TouchableOpacity style={styles.chatButton} onPress={openChat}>
            <Text style={styles.chatButtonText}>💬 Start a Chat</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    width: 60,
  },
  backText: {
    color: '#FF6B35',
    fontSize: 17,
  },
  title: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '600',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 60,
  },
  subtitle: {
    color: '#8E8E93',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  faqItem: {
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    padding: 16,
    marginBottom: 8,
  },
  faqItemOpen: {
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  faqRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    paddingRight: 12,
  },
  faqChevron: {
    color: '#8E8E93',
    fontSize: 11,
  },
  faqAnswer: {
    color: '#8E8E93',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
  },
  chatCard: {
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  chatTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  chatSubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  chatButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  chatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
