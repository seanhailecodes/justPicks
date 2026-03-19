import { router } from 'expo-router';
import { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import storage from './lib/storage';
import { supabase } from './lib/supabase';
import { APP_SPORTS, isSportInSeason } from '../services/activeSport';

export const ONBOARDING_KEY = 'betless_onboarding_v2';

interface Step {
  number: string;
  title: string;
  desc: string;
}

interface Slide {
  emoji: string;
  title: string;
  subtitle: string;
  body?: string;
  steps?: Step[];
  cta: string;
}

const SLIDES: Slide[] = [
  {
    emoji: '🎯',
    title: 'Welcome to justPicks',
    subtitle: "Track picks.\nDon't Bet.",
    body: "Prove your sports knowledge without losing money. justPicks is your personal pick tracker — confidence, analysis, and record-keeping all in one place.",
    cta: 'Next',
  },
  {
    emoji: '📋',
    title: 'Make Your Picks',
    subtitle: 'Simple. Fast. No cash.',
    body: "Browse upcoming games, make your picks, track your wins and losses. And hopefully, justPicks.",
    cta: 'Next',
  },
  {
    emoji: '👥',
    title: 'Join a Public Group',
    subtitle: 'Compete right away.',
    steps: [
      {
        number: '1',
        title: 'Browse public groups',
        desc: 'Open the Squad tab and tap "Browse Groups". You\'ll see public groups for sports currently in season.',
      },
      {
        number: '2',
        title: 'Join with one tap',
        desc: 'Tap "Join" on any group. No invite code needed — public groups are open to everyone.',
      },
      {
        number: '3',
        title: 'Make picks & compete',
        desc: 'Make your picks for the same games as everyone else. Check the group leaderboard to see where you rank.',
      },
    ],
    cta: 'Browse Groups →',
  },
  {
    emoji: '🔥',
    title: 'Build Your Record',
    subtitle: "Your streak is your edge.",
    body: "Track win rate, build streaks, and compete in pick groups with friends. Know your sports — and have the record to prove it.",
    cta: "Let's go",
  },
];

// Find the first enabled sport currently in season for the browse-groups slide
const getInSeasonSport = () => {
  const inSeason = APP_SPORTS.filter(s => s.enabled && isSportInSeason(s.season));
  return inSeason[0] ?? APP_SPORTS.find(s => s.enabled) ?? null;
};

export default function OnboardingScreen() {
  const [activeIndex, setActiveIndex] = useState(0);

  const inSeasonSport = getInSeasonSport();
  const slides = SLIDES.map((s, i) => {
    if (i !== 2 || !inSeasonSport) return s;
    return {
      ...s,
      subtitle: `${inSeasonSport.emoji} ${inSeasonSport.label} season is live.`,
    };
  });

  const slide = slides[activeIndex];

  const markOnboardingDone = async () => {
    try { await storage.setItem(ONBOARDING_KEY, 'done'); } catch (_) {}
    try { await supabase.auth.updateUser({ data: { onboarding_done: true } }); } catch (_) {}
  };

  const BROWSE_GROUPS_SLIDE = 2; // 0-indexed — the "Join a Public Group" slide

  const goNext = async () => {
    // The Browse Groups slide has a special CTA that sends the user there directly
    if (activeIndex === BROWSE_GROUPS_SLIDE) {
      await markOnboardingDone();
      router.replace('/group/browse-groups');
      return;
    }
    if (activeIndex < slides.length - 1) {
      setActiveIndex(activeIndex + 1);
    } else {
      await markOnboardingDone();
      router.replace('/(tabs)/home');
    }
  };

  const goBack = () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  };

  const skip = async () => {
    await markOnboardingDone();
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top nav row: back (left) + skip (right) */}
      <View style={styles.topNav}>
        {activeIndex > 0 ? (
          <TouchableOpacity style={styles.backBtn} onPress={goBack}>
            <Text style={styles.backText}>‹ Back</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
        {activeIndex < slides.length - 1 ? (
          <TouchableOpacity style={styles.skipBtn} onPress={skip}>
            <Text style={styles.skipText}>Skip</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* Slide content */}
      <ScrollView
        contentContainerStyle={styles.slideContent}
        showsVerticalScrollIndicator={false}
        style={styles.slideScroll}
      >
        <Text style={styles.slideEmoji}>{slide.emoji}</Text>
        <Text style={styles.slideTitle}>{slide.title}</Text>
        <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>

        {slide.steps ? (
          <View style={styles.stepsContainer}>
            {slide.steps.map((step, si) => (
              <View key={si} style={styles.stepRow}>
                <View style={styles.stepBadge}>
                  <Text style={styles.stepNumber}>{step.number}</Text>
                </View>
                <View style={styles.stepText}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDesc}>{step.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.slideBody}>{slide.body}</Text>
        )}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA button */}
      <TouchableOpacity style={styles.ctaBtn} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>{slide.cta}</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  backBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  backText: {
    color: '#636366',
    fontSize: 15,
    fontWeight: '500',
  },
  skipBtn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
  skipText: {
    color: '#636366',
    fontSize: 15,
    fontWeight: '500',
  },
  slideScroll: {
    flex: 1,
    width: '100%',
  },
  slideContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  slideEmoji: {
    fontSize: 64,
    marginBottom: 20,
  },
  slideTitle: {
    color: '#FF6B35',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  slideSubtitle: {
    color: '#FFF',
    fontSize: 19,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 26,
  },
  slideBody: {
    color: '#8E8E93',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  stepsContainer: {
    width: '100%',
    marginTop: 8,
    gap: 14,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    padding: 14,
    gap: 14,
  },
  stepBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumber: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  stepText: {
    flex: 1,
  },
  stepTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  stepDesc: {
    color: '#8E8E93',
    fontSize: 13,
    lineHeight: 19,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  dotActive: {
    backgroundColor: '#FF6B35',
    width: 22,
  },
  ctaBtn: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 30,
    marginBottom: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#FFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
});
