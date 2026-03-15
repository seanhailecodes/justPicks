import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import storage from './lib/storage';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ONBOARDING_KEY = 'betless_onboarding_v1';

const SLIDES = [
  {
    emoji: '🎯',
    title: 'Welcome to DontBet',
    subtitle: 'Track picks.\nDon't Bet.',
    body: "Prove your sports knowledge without losing money. DontBet is your personal pick tracker — confidence, analysis, and record-keeping all in one place.",
    cta: 'Next',
  },
  {
    emoji: '📋',
    title: 'Make Your Picks',
    subtitle: 'Simple. Fast. No deposit.',
    body: "Browse live and upcoming games, pick a winner, set your confidence level, and save. That's it. No credit card, no withdrawal stress.",
    cta: 'Next',
  },
  {
    emoji: '🔥',
    title: 'Build Your Record',
    subtitle: "Your streak is your edge.",
    body: "Track win rate, build streaks, and compete in pick groups with friends. Know your sports — and have the record to prove it.",
    cta: "Let's go",
  },
];

export default function OnboardingScreen() {
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const goNext = async () => {
    if (activeIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: SCREEN_WIDTH * (activeIndex + 1), animated: true });
    } else {
      await storage.setItem(ONBOARDING_KEY, 'done');
      router.replace('/(tabs)/home');
    }
  };

  const skip = async () => {
    await storage.setItem(ONBOARDING_KEY, 'done');
    router.replace('/(tabs)/home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip */}
      {activeIndex < SLIDES.length - 1 && (
        <TouchableOpacity style={styles.skipBtn} onPress={skip}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={styles.slide}>
            <Text style={styles.slideEmoji}>{slide.emoji}</Text>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
            <Text style={styles.slideBody}>{slide.body}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Dots */}
      <View style={styles.dotsRow}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex && styles.dotActive]}
          />
        ))}
      </View>

      {/* CTA button */}
      <TouchableOpacity style={styles.ctaBtn} onPress={goNext} activeOpacity={0.85}>
        <Text style={styles.ctaBtnText}>{SLIDES[activeIndex].cta}</Text>
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
  skipBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
  },
  skipText: {
    color: '#636366',
    fontSize: 15,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
  slide: {
    width: SCREEN_WIDTH,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
    paddingBottom: 40,
  },
  slideEmoji: {
    fontSize: 72,
    marginBottom: 28,
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
