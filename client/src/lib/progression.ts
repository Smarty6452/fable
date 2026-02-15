/**
 * Talky Buddy Progression System
 * Handles XP scaling, level calculations, and reward logic.
 */

export const XP_PER_WORD = 10;
export const PERFECT_ROUND_BONUS = 20;

/**
 * XP scaling logic:
 * Level 1: 0-40 XP (Requires 4 words at 10 XP each to reach Level 2)
 * Level 2: 40-150 XP (+110 XP, approx 2-3 full missions)
 * Level 3: 150-350 XP (+200 XP, approx 4-5 full missions)
 * Level 4: 350-650 XP (+300 XP)
 * Level 5: 650-1050 XP (+400 XP)
 * 
 * Formula for Level n+1 requirement (cumulative):
 * XP_cum(n+1) = XP_cum(n) + (n * 100) - (n === 1 ? 60 : 0)
 * Or more simply, we use a lookup for the first few and then scale.
 */
const CUMULATIVE_XP_REQS = [
  0,    // Level 1
  40,   // Level 2 (4 words)
  150,  // Level 3 (+110)
  350,  // Level 4 (+200)
  650,  // Level 5 (+300)
  1050, // Level 6 (+400)
];

/**
 * Calculates the current level based on total XP.
 */
export function getLevelFromXp(xp: number): number {
  for (let i = CUMULATIVE_XP_REQS.length - 1; i >= 0; i--) {
    if (xp >= CUMULATIVE_XP_REQS[i]) {
      return i + 1;
    }
  }
  return 1;
}

/**
 * Gets the total XP required to reach the next level.
 */
export function getNextLevelXp(currentLevel: number): number {
  if (currentLevel < CUMULATIVE_XP_REQS.length) {
    return CUMULATIVE_XP_REQS[currentLevel];
  }
  // Exponential scaling for high levels: last req + (level * 100)
  const lastReq = CUMULATIVE_XP_REQS[CUMULATIVE_XP_REQS.length - 1];
  const levelDiff = currentLevel - (CUMULATIVE_XP_REQS.length - 1);
  return lastReq + (levelDiff * 500); // 1550, 2050, etc.
}

/**
 * Gets XP progress within the current level (for progress bars).
 */
export function getXpProgressInLevel(xp: number): { 
  current: number; 
  required: number; 
  percent: number 
} {
  const level = getLevelFromXp(xp);
  const currentLevelStart = CUMULATIVE_XP_REQS[level - 1] || 0;
  const nextLevelTotal = getNextLevelXp(level);
  
  const currentInLevel = xp - currentLevelStart;
  const requiredInLevel = nextLevelTotal - currentLevelStart;
  const percent = Math.min(100, Math.max(0, (currentInLevel / requiredInLevel) * 100));

  return {
    current: currentInLevel,
    required: requiredInLevel,
    percent
  };
}

/**
 * Calculates stars based on attempts.
 * 1 attempt = 3 stars
 * 2 attempts = 2 stars
 * 3+ attempts = 1 star
 */
export function calculateStars(attempts: number): number {
  if (attempts <= 1) return 3;
  if (attempts === 2) return 2;
  return 1;
}

export const successMessages = [
  "You nailed it!",
  "Amazing work!",
  "You're a superstar!",
  "Boom! Perfect!",
  "That was awesome!",
  "Keep shining!",
  "High five! You got it!",
  "You're crushing these sounds!",
  "Pure genius!",
  "You're a sound wizard!",
  "I'm so proud of you!",
  "That was music to my ears!",
  "You're a natural!",
  "Spot on! Well done!",
  "You've got this down pat!",
  "Spectacular speech!"
];

export const retryMessages = [
  "So close! Let's give it another go!",
  "I almost heard it! One more time?",
  "You're nearly there! Keep trying!",
  "Don't give up, you're doing great!",
  "Almost perfect! Let's try once more!",
  "I love how you're trying! Let's do it again!"
];

export const characterSpecficSuccess = {
  wolf: ["Howl-tastic job!", "You're a pack leader!", "Awoooo! Perfect!"],
  robot: ["Processing... result: PERFECT!", "You're speaking my language!", "Binary success! Beep-boop!"],
  cat: ["Purr-fect pronunciation!", "Meow-velous job!", "You're the cat's pajamas!"],
  puppy: ["Woof! You did it!", "Pause-itively amazing!", "Tail-waggingly good!"],
  panda: ["Panda-tastic!", "You're un-bear-ably good!", "So sweet and clear!"]
};

export const levelUpMessages = [
  "Level Up! You're on fire!",
  "WOW! Super Star unlocked!",
  "New Level! Keep going!",
  "You're leveling up like a champ!",
  "Incredible! You reached a new level!",
  "You're getting so much stronger at talking!",
  "Is it a bird? Is it a plane? No, it's a Level Up!",
  "You're rising to the top!",
  "Master status achieved! New level unlocked!",
  "Look at you go! Level up!"
];

export function getRandomSuccessMessage(buddyId?: string): string {
  // 30% chance for buddy-specific success line if buddyId provided
  if (buddyId && Math.random() < 0.3) {
    const specific = (characterSpecficSuccess as any)[buddyId];
    if (specific) return specific[Math.floor(Math.random() * specific.length)];
  }
  return successMessages[Math.floor(Math.random() * successMessages.length)];
}

export function getRandomRetryMessage(): string {
  return retryMessages[Math.floor(Math.random() * retryMessages.length)];
}

export function getRandomLevelUpMessage(): string {
  return levelUpMessages[Math.floor(Math.random() * levelUpMessages.length)];
}
