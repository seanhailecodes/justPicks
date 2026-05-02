/**
 * SportTabs.tsx
 *
 * Shared horizontal sport-picker pills used by Home, Games, Leaderboard,
 * Profile, and Pick History.
 *
 * Single source of truth: edit styles here once and they update everywhere.
 *
 * Behavior:
 *  - Items center when they fit in the viewport, scroll horizontally otherwise
 *    (flexGrow + justifyContent: 'center').
 *  - Sports come from APP_SPORTS via the user-preference sort hook.
 *  - Caller passes the selected Sport key + an onSelect handler.
 */

import { ScrollView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { APP_SPORTS, AppSport, Sport } from '../services/activeSport';
import { useSortedSports } from '../services/useSortedSports';

interface SportTabsProps {
  /** The Sport key currently active. */
  selectedKey: Sport;
  /** Called when the user taps a tab — receives the Sport key. */
  onSelect: (key: Sport) => void;
  /** Optional user id used to sort sports by past usage. */
  userId?: string | null;
  /**
   * Optional override for whether a tab is rendered as disabled (grayed +
   * non-tappable). Default is `!sport.enabled`. Profile passes a custom
   * function to also gray out sports that are out of season.
   */
  isDisabled?: (sport: AppSport) => boolean;
}

export default function SportTabs({
  selectedKey,
  onSelect,
  userId = null,
  isDisabled,
}: SportTabsProps) {
  const sortedSports = useSortedSports(userId);
  // Use sortedSports if it produced anything; fall back to APP_SPORTS so
  // callers without a userId still get a stable list.
  const sports = sortedSports.length > 0 ? sortedSports : APP_SPORTS;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {sports.map((sport) => {
        const isSelected = selectedKey === sport.key;
        const disabled = isDisabled ? isDisabled(sport) : !sport.enabled;

        return (
          <TouchableOpacity
            key={sport.key}
            style={[
              styles.tab,
              isSelected && styles.tabActive,
              disabled && styles.tabDisabled,
            ]}
            onPress={() => !disabled && onSelect(sport.key)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            {/* The basketball glyph (🏀) is rendered with its mass biased
                slightly right of its glyph-box center, which makes the
                NBA / NCAAB chips read as if the emoji is too far right.
                Nudge it left a hair so it visually aligns with ⚾, 🥊, etc. */}
            <Text
              style={[
                styles.emoji,
                sport.emoji === '🏀' && styles.emojiBasketball,
              ]}
            >
              {sport.emoji}
            </Text>
            <Text
              style={[
                styles.text,
                isSelected && styles.textActive,
                disabled && styles.textDisabled,
              ]}
            >
              {sport.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    maxHeight: 32,
  },
  content: {
    // flexGrow lets the row stretch to fill available width when content is
    // narrow, so justifyContent can center the chips. When content is wider
    // than the viewport, this is a no-op and the row scrolls.
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    gap: 6,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    paddingHorizontal: 8,
    paddingVertical: 1,
    // Rounded rectangle, not a pill — softer corners but still squared.
    borderRadius: 6,
    gap: 3,
  },
  tabActive: {
    backgroundColor: '#FF6B35',
  },
  tabDisabled: {
    opacity: 0.4,
  },
  emoji: {
    fontSize: 12,
  },
  // Pulls the basketball emoji ~1px left so its visual center aligns
  // with the rest of the row (the glyph itself is biased right).
  emojiBasketball: {
    transform: [{ translateX: -1 }],
    marginRight: -1,
  },
  text: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  textActive: {
    color: '#FFF',
  },
  textDisabled: {
    color: '#666',
  },
});
