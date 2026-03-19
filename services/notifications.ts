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

// Pick confirmation messages WITH wager - justPicks: hype titles, strong anti-gambling messages
export const PICK_CONFIRMATION_MESSAGES = [
  { title: "YOU'RE IN! 🎯", message: "Be careful champ — you worked hard for that money." },
  { title: "PICK SAVED! ✅", message: "Never chase losses. The next pick doesn't owe you — don't know, don't care." },
  { title: "LET'S GOOO!", message: "In the end, only the book wins. justPicks — and keep more." },
  { title: "LOCKED IN. 🔐", message: "The house has an edge on every single bet. Your picks here? Free." },
  { title: "ON THE BOARD!", message: "Sports are more fun when your wallet isn't on the line." },
  { title: "DIALED IN.", message: "Real talk — sportsbooks are built to take your money. This isn't that." },
  { title: "THAT'S THE CALL.", message: "The best bet you'll ever make is no bet at all." },
  { title: "GAME ON. 🔥", message: "If you feel the urge to make it real money — pause. Talk to someone you trust." },
  { title: "YOUR CALL!", message: "Streaks end. Don't let a hot hand talk you into opening a sportsbook app." },
  { title: "IN THE BOOKS.", message: "Locked in. Now let the games do the talking." },
  { title: "PICKS > BETS.", message: "Noted. Just remember — the house built their building with your money. justPicks." },
  { title: "CONFIDENT? 👊", message: "Even the sharpest bettors lose long-term. Enjoy the pick — protect the bag." },
  { title: "CLEAN PICK.", message: "Gambling is engineered to feel like skill. justPicks too — proves you don't need that wager. Good luck." },
  { title: "CALLED IT!", message: "Win or lose, you won't be checking your bank balance after this. That's the point." },
  { title: "ALL DAY. 💪", message: "The urge to 'make it interesting' with real money is the trap. You're already past it." }
];

// Pick confirmation messages WITHOUT wager - pure hype, no money talk
export const PICK_CONFIRMATION_MESSAGES_NO_WAGER = [
  { title: "YOU'RE IN! 🎯", message: "Pick locked. Let's see how your read plays out." },
  { title: "PICK SAVED! ✅", message: "Called it. Now sit back and watch the game." },
  { title: "LET'S GOOO!", message: "Your pick is on the board. Bragging rights on the line." },
  { title: "LOCKED IN. 🔐", message: "Confidence noted. May the sports gods be with you." },
  { title: "ON THE BOARD!", message: "Pick submitted. This is what sports knowledge is for." },
  { title: "DIALED IN.", message: "You've done the research. Trust the process." },
  { title: "THAT'S THE CALL.", message: "Bold move. Let's see if the tape agrees." },
  { title: "GAME ON. 🔥", message: "Pick saved — now go watch and enjoy the game." },
  { title: "YOUR CALL!", message: "Locked in. Proof that sports are fun without the stakes." },
  { title: "IN THE BOOKS.", message: "You can't out-smart the vig. But you can opt out of it entirely — and you did." },
  { title: "PICKS > BETS.", message: "No deposit, no withdrawal, no regret. That's the justPicks way." },
  { title: "CONFIDENT? 👊", message: "Pick's in. The only thing on the line is your pride." },
  { title: "CLEAN PICK.", message: "Saved. Compete with friends, keep the stress out." },
  { title: "CALLED IT!", message: "We'll see. Either way, you played it smart." },
  { title: "ALL DAY. 💪🏽", message: "Locked and loaded. This is how sports should feel." },
  { title: "NO BETS? NICE! 💪🏽", message: "Keep that paper in your pocket, player. Real ones watch for free." },
  { title: "PAPER PROTECTED. 💪🏽", message: "No bets, no stress. You're out here proving the pick — not chasing a payout." },
  { title: "BROKE NOTHING. 💪🏽", message: "Your wallet's safe, your pick is locked. That's the whole move." },
  { title: "SMART MONEY. 💪🏽", message: "No bets? Now THAT is smart money." },
  { title: "GITTY UP! 🤠", message: "Pick saved, bank untouched. Gitty up partner!" },
  { title: "WELL DONE PLAYA'. 💪🏽", message: "Pick locked, wallet closed. That's how we do it." },
  { title: "STRAIGHT LIKE THAT. 🎯", message: "No bet, no sweat. Just pure game knowledge on display." },
  { title: "DIFFERENT BREED. 💪🏽", message: "While others are on sportsbooks bleeding cash, you're here proving your pick. Different breed." },
  { title: "THAT'S PLAYA MOVES. 🏆", message: "Pick saved, money untouched. You already know what it is." },
  { title: "HOLD YA PAPER. 🤠", message: "Ride or die for the pick — not the payout. That's the justPicks way." }
];

// Multiple picks saved at once - WITH wager
export const MULTI_PICK_CONFIRMATION_MESSAGES = [
  { title: "YOU'RE IN! 🎯", message: "{count} picks saved. Be careful champ — you worked hard for that money." },
  { title: "BIG SLATE! 🔥", message: "{count} calls locked. In the end, only the book wins. Not today." },
  { title: "PICKS SAVED! ✅", message: "{count} predictions down. Never chase losses — these cost you nothing." },
  { title: "ALL DAY.", message: "{count} picks confirmed. The house always has an edge. This? Purely yours." },
  { title: "LET'S GOOO!", message: "{count} picks locked. No deposit. No regret. That's justPicks." }
];

// Multiple picks saved at once - WITHOUT wager
export const MULTI_PICK_CONFIRMATION_MESSAGES_NO_WAGER = [
  { title: "BIG SLATE! 🎯", message: "{count} picks locked in. Let's see how your reads hold up." },
  { title: "LET'S GOOO! 🔥", message: "{count} calls on the board. Pure sports instinct — no stakes required." },
  { title: "PICKS SAVED! ✅", message: "{count} predictions locked. Bragging rights are officially on the line." },
  { title: "ALL DAY. 💪🏽", message: "{count} picks confirmed. You did the work — now let the games decide." },
  { title: "STACKED! 🏆", message: "{count} picks in. This is what competing with friends is all about." },
  { title: "NO BETS? NICE! 💪🏽", message: "{count} picks locked. Paper stays in your pocket — that's the whole point." },
  { title: "HOLD YA PAPER. 🤠", message: "{count} picks, zero dollars risked. Gitty up partner!" },
  { title: "THAT'S PLAYA MOVES. 🏆", message: "{count} calls locked. Well done playa' — wallet closed, picks open." },
  { title: "DIFFERENT BREED. 💪🏽", message: "{count} picks in. While others are on sportsbooks bleeding cash, you're here. Different breed." }
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
 * @param pickCount - number of picks saved
 * @param hasWager - true if any pick has a wager amount entered
 */
export function getPickConfirmationMessage(pickCount: number = 1, hasWager: boolean = false): { title: string; message: string } {
  if (pickCount === 1) {
    return getRandomMessage(hasWager ? PICK_CONFIRMATION_MESSAGES : PICK_CONFIRMATION_MESSAGES_NO_WAGER);
  } else {
    const pool = hasWager ? MULTI_PICK_CONFIRMATION_MESSAGES : MULTI_PICK_CONFIRMATION_MESSAGES_NO_WAGER;
    const msg = getRandomMessage(pool);
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
  LAST_WEEKLY_CHECK: 'betless_last_weekly_notification',
  WEEKLY_CHECK_WEEK: 'betless_weekly_check_week_number'
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