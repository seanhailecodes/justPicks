/**
 * Notification system for justPicks
 * - Pick confirmations
 * - Weekly performance summaries
 * - Anti-gambling messaging woven throughout
 */

// ============================================
// MESSAGE BANKS
// ============================================

// Great week messages (58%+ win rate)
export const GREAT_WEEK_MESSAGES = [
  {
    title: "🔥 On Fire!",
    message: "You crushed it this week! Your sports knowledge is paying off. Remember, the real win is bragging rights with your friends!"
  },
  {
    title: "🎯 Sharp Shooter!",
    message: "Impressive picks! You've got a great read on the games. Keep enjoying the competition with your crew!"
  },
  {
    title: "⭐ All-Star Week!",
    message: "Your instincts were spot-on! This is what makes sports fun - proving you know your stuff to your friends."
  },
  {
    title: "🏆 Champion Vibes!",
    message: "What a week! Your picks were elite. Soak it in - this is about the love of the game, not the chase."
  },
  {
    title: "📈 Trending Up!",
    message: "You're seeing the games clearly! Enjoy this hot streak with your group - that's what it's all about."
  },
  {
    title: "🧠 Big Brain Energy!",
    message: "Your sports IQ is showing! Great analysis this week. Keep it fun and friendly with your picks!"
  },
  {
    title: "💪 Dominant Performance!",
    message: "You owned this week! Remember why we play - for the fun, the friends, and the friendly competition."
  },
  {
    title: "🎉 Celebration Time!",
    message: "Pop the confetti! Your picks were on point. Share this win with your group - no money needed to feel this good!"
  },
  {
    title: "🌟 Rising Star!",
    message: "You're lighting up the leaderboard! This is the thrill of sports - predicting games with friends, no stakes required."
  },
  {
    title: "🎪 Main Event!",
    message: "You showed up and showed out! Your group should be impressed. The best rewards are bragging rights!"
  },
  {
    title: "🚀 Liftoff!",
    message: "Your picks are soaring! Keep riding this wave with your friends - the journey is the reward."
  },
  {
    title: "👑 Royalty!",
    message: "Bow down to this week's pick master! Crown yourself with pride - this is pure sports knowledge, no gambling needed."
  },
  {
    title: "🎯 Bullseye!",
    message: "Right on target! You read those matchups perfectly. Enjoy competing with friends - that's the real prize."
  },
  {
    title: "⚡ Electric!",
    message: "You brought the energy this week! Keep that competitive spirit alive with your crew."
  },
  {
    title: "🏅 Podium Finish!",
    message: "Medal-worthy performance! Your picks proved your sports expertise. Share the glory with your group!"
  },
  {
    title: "🎰 Wait, Not That!",
    message: "Great picks! And the best part? You didn't need to risk a dime to feel this rush. Pure sports knowledge!"
  },
  {
    title: "📊 Analytics King!",
    message: "The numbers back you up! You've got the eye for games. Keep enjoying the free thrill of competition!"
  },
  {
    title: "🌈 Golden Week!",
    message: "Everything clicked! Soak in the satisfaction - proving yourself to friends beats any bet slip."
  },
  {
    title: "🎸 Rock Star!",
    message: "You're headlining the leaderboard! The crowd (your friends) goes wild - no cover charge required!"
  },
  {
    title: "🧊 Ice Cold!",
    message: "Cool, calm, and correct! Your picks were clinical. This is the healthy way to enjoy sports predictions!"
  }
];

// Struggling week messages (37% or less win rate)
export const STRUGGLING_WEEK_MESSAGES = [
  {
    title: "📉 Tough Week",
    message: "The sports gods weren't on your side. Shake it off! Remember, this is just for fun with friends - no money, no stress."
  },
  {
    title: "🎢 Bumpy Ride",
    message: "Sports are unpredictable - that's what makes them exciting! Good thing we're playing for bragging rights, not bills."
  },
  {
    title: "🔄 Reset Button",
    message: "Not your week, and that's okay! The beauty of justPicks is there's nothing to lose but pride. Fresh start ahead!"
  },
  {
    title: "🌧️ Rainy Days",
    message: "Even the pros have off weeks. The great thing? You're competing for fun, not finances. Keep your head up!"
  },
  {
    title: "🎲 Unpredictable",
    message: "Sports humbled everyone this week! This is exactly why betting real money is risky - but here, it's just friendly competition."
  },
  {
    title: "📚 Learning Curve",
    message: "Every miss teaches something new. Good thing we're here to learn and have fun - no wallet damage!"
  },
  {
    title: "🌪️ Wild Week",
    message: "Upsets happen! Imagine if real money was on the line - yikes. Thankfully, justPicks keeps it stress-free."
  },
  {
    title: "🤷 It Happens",
    message: "Can't win 'em all! The fun is in the game, not the outcome. Your friends are here for the ride with you."
  },
  {
    title: "⏳ Patience",
    message: "Results will turn around. What matters is you're enjoying sports without the risks of real betting."
  },
  {
    title: "🎭 Plot Twist",
    message: "Sports wrote a wild script this week! Be glad you're watching for fun, not stressing over stakes."
  },
  {
    title: "🧘 Stay Zen",
    message: "Deep breath - it's just picks among friends. No financial stress, no chasing losses. Just sports and community."
  },
  {
    title: "🌱 Growth Mindset",
    message: "Tough results build character! And since it's all for fun, you can focus on learning, not losing."
  },
  {
    title: "🎪 The Show Goes On",
    message: "Not every act is a hit. The great news? Tomorrow's a new show, and your ticket (to justPicks) is always free!"
  },
  {
    title: "🔮 Crystal Ball Cloudy",
    message: "Even the best can't predict everything. This is why we keep it fun - sports are meant to be enjoyed, not stressed over."
  },
  {
    title: "🎢 Part of the Ride",
    message: "Ups and downs make the journey exciting! With justPicks, the lows never cost you - just reset and go again."
  },
  {
    title: "☀️ Sunny Days Ahead",
    message: "This week's behind you. The best part of playing for fun? No damage done. Come back stronger!"
  },
  {
    title: "🤝 We've All Been There",
    message: "Your friends have had rough weeks too. That's what makes this community great - shared experiences, zero financial pressure."
  },
  {
    title: "🎯 Recalibrating",
    message: "Time to reassess those picks! Lucky for you, learning here is free - unlike real sportsbooks where losses hurt."
  },
  {
    title: "🌊 Ride the Wave",
    message: "Every wave has its dips. Stay afloat knowing that justPicks is about the journey, not gambling on outcomes."
  },
  {
    title: "💡 Silver Lining",
    message: "Bad weeks remind us why betting real money is risky. Here, you get all the fun of predictions with none of the regret!"
  }
];

// Pick confirmation messages (short, varied)
export const PICK_CONFIRMATION_MESSAGES = [
  { title: "✅ Pick Locked In!", message: "Your pick has been saved. Good luck!" },
  { title: "🎯 Pick Submitted!", message: "May the sports gods be with you!" },
  { title: "📝 Got It!", message: "Your pick is in the books!" },
  { title: "🔒 Locked!", message: "Pick saved - no turning back now!" },
  { title: "👍 All Set!", message: "Your pick has been recorded!" },
  { title: "🎟️ Ticket Punched!", message: "You're in - let's see how it plays out!" },
  { title: "⚡ Quick Draw!", message: "Pick submitted successfully!" },
  { title: "🏈 Game On!", message: "Your prediction is locked in!" },
  { title: "📌 Pinned!", message: "Pick saved to your record!" },
  { title: "🎪 In The Mix!", message: "Your pick joins the action!" }
];

// Multiple picks saved at once
export const MULTI_PICK_CONFIRMATION_MESSAGES = [
  { title: "✅ Picks Locked In!", message: "{count} picks saved. Let's see how they play out!" },
  { title: "🎯 All Submitted!", message: "{count} picks in the books. Good luck!" },
  { title: "📝 Batch Complete!", message: "{count} predictions locked and loaded!" },
  { title: "🔒 All Locked!", message: "{count} picks saved - you're ready for game day!" },
  { title: "🎟️ Tickets Punched!", message: "{count} picks submitted. May the odds be in your favor!" }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get a random message from an array
 */
export function getRandomMessage<T>(messages: T[]): T {
  const index = Math.floor(Math.random() * messages.length);
  return messages[index];
}

/**
 * Get appropriate weekly message based on win rate
 */
export function getWeeklyPerformanceMessage(
  winRate: number,
  wins: number,
  losses: number
): { title: string; message: string; type: 'great' | 'struggling' | 'neutral' } | null {
  const totalPicks = wins + losses;
  
  // Need at least 3 resolved picks to show a message
  if (totalPicks < 3) {
    return null;
  }

  if (winRate >= 58) {
    const msg = getRandomMessage(GREAT_WEEK_MESSAGES);
    return {
      ...msg,
      message: `${msg.message}\n\nYour record: ${wins}-${losses} (${winRate}%)`,
      type: 'great'
    };
  } else if (winRate <= 37) {
    const msg = getRandomMessage(STRUGGLING_WEEK_MESSAGES);
    return {
      ...msg,
      message: `${msg.message}\n\nYour record: ${wins}-${losses} (${winRate}%)`,
      type: 'struggling'
    };
  }

  // Neutral - no popup for middle performance
  return null;
}

/**
 * Get pick confirmation message
 */
export function getPickConfirmationMessage(pickCount: number = 1): { title: string; message: string } {
  if (pickCount === 1) {
    return getRandomMessage(PICK_CONFIRMATION_MESSAGES);
  } else {
    const msg = getRandomMessage(MULTI_PICK_CONFIRMATION_MESSAGES);
    return {
      title: msg.title,
      message: msg.message.replace('{count}', pickCount.toString())
    };
  }
}

// ============================================
// STORAGE KEYS
// ============================================

export const NOTIFICATION_STORAGE_KEYS = {
  LAST_WEEKLY_CHECK: 'justpicks_last_weekly_notification',
  WEEKLY_CHECK_WEEK: 'justpicks_weekly_check_week_number'
};

/**
 * Check if we should show weekly performance notification
 * Returns true if it's been at least 7 days since last check
 */
export function shouldShowWeeklyNotification(lastCheckTimestamp: number | null): boolean {
  if (!lastCheckTimestamp) return true;
  
  const now = Date.now();
  const sevenDays = 7 * 24 * 60 * 60 * 1000;
  
  return (now - lastCheckTimestamp) >= sevenDays;
}

/**
 * Get the current week number of the year
 */
export function getCurrentWeekNumber(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 604800000; // milliseconds in a week
  return Math.ceil(diff / oneWeek);
}