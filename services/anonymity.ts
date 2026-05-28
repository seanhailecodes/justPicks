// Deterministic adjective+animal alias for users in PUBLIC groups.
//
// A user's alias is stable across the app: same `user_id` always yields
// the same alias (e.g. "CleverFox"). Per-user, not per-(user, group), so
// the alias is recognisable to repeat observers within a single public
// group — but you still can't tie it back to a real username/email.
//
// Used in the public-group surfaces only:
//   • Group Ratings / Leaderboard (services/pickrating.ts → getGroupLeaderboard)
//   • Group Picks feed (app/group/group-picks.tsx)
// The current user is never anonymised to themselves — callers should
// label their own row "You" (and may show their real handle alongside).

const ADJECTIVES = [
  'Clever', 'Sharp', 'Lucky', 'Bold', 'Cool', 'Quick', 'Wild', 'Calm',
  'Brave', 'Sly', 'Quiet', 'Loud', 'Mighty', 'Swift', 'Sneaky', 'Witty',
  'Steady', 'Fierce', 'Jolly', 'Nimble', 'Crafty', 'Daring', 'Eager',
  'Gentle', 'Happy', 'Honest', 'Humble', 'Iron', 'Jazzy', 'Keen',
  'Lively', 'Loyal', 'Merry', 'Noble', 'Plucky', 'Proud', 'Rapid',
  'Rugged', 'Savvy', 'Scrappy', 'Silver', 'Sleek', 'Snappy', 'Solid',
  'Sturdy', 'Sunny', 'Tough', 'Vivid', 'Zen', 'Zesty',
];

const ANIMALS = [
  'Fox', 'Hawk', 'Bear', 'Wolf', 'Otter', 'Owl', 'Lynx', 'Tiger',
  'Eagle', 'Falcon', 'Panther', 'Raven', 'Stag', 'Heron', 'Badger',
  'Mole', 'Shark', 'Marlin', 'Orca', 'Puma', 'Cobra', 'Viper', 'Mantis',
  'Gecko', 'Toad', 'Newt', 'Crow', 'Magpie', 'Sparrow', 'Wren', 'Finch',
  'Robin', 'Jay', 'Goose', 'Heron', 'Crane', 'Stork', 'Pelican', 'Seal',
  'Walrus', 'Beaver', 'Marmot', 'Lemur', 'Sloth', 'Tapir', 'Bison',
  'Moose', 'Elk', 'Ibex', 'Yak',
];

// FNV-1a string hash → 32-bit unsigned. Stable across JS engines.
function hash32(input: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/**
 * Returns the public-group alias for a user.
 * Stable per user_id — same input always returns the same string.
 */
export function getPublicAlias(userId: string): string {
  if (!userId) return 'Anon';
  const h1 = hash32(userId);
  // Use a different bit window for the second word so adjective and
  // animal aren't perfectly correlated.
  const h2 = hash32(userId + ':animal');
  const adj = ADJECTIVES[h1 % ADJECTIVES.length];
  const animal = ANIMALS[h2 % ANIMALS.length];
  return `${adj}${animal}`;
}

/**
 * Decide what username to display in a public-group context.
 *  - Current user: real `username` (caller typically prefixes with "You · ")
 *  - Everyone else: deterministic alias from getPublicAlias()
 *
 * In private groups, callers should bypass this and use the real username
 * directly — anonymity is a public-group-only behaviour.
 */
export function displayNameForPublicGroup(
  userId: string,
  username: string | null | undefined,
  currentUserId: string | null | undefined,
): { displayName: string; isAnonymized: boolean } {
  if (currentUserId && userId === currentUserId) {
    return { displayName: username || 'You', isAnonymized: false };
  }
  return { displayName: getPublicAlias(userId), isAnonymized: true };
}
