// Chapter-based progression system for TalkyBuddy
export interface Chapter {
  id: string;
  title: string;
  description: string;
  level: number;
  emoji: string;
  unlockXp: number;
  missions: string[]; // Mission IDs from MISSIONS array
  isLocked: boolean;
  comingSoon?: boolean;
}

export const CHAPTERS: Chapter[] = [
  {
    id: "chapter-1",
    title: "Sound Explorer",
    description: "Master the basics! Learn simple sounds like S, C, and P.",
    level: 1,
    emoji: "🌟",
    unlockXp: 0,
    missions: ["1", "2", "6", "8"], // Sun, Cake, Apple, Fish
    isLocked: false,
  },
  {
    id: "chapter-2",
    title: "Brave Voyager",
    description: "Level up with medium sounds like L, R, and W!",
    level: 2,
    emoji: "🚀",
    unlockXp: 100,
    missions: ["3", "4", "5"], // Lion, Robot, Water
    isLocked: false,
  },
  {
    id: "chapter-3",
    title: "Sound Master",
    description: "Conquer tough sounds! Practice the tricky TH sound.",
    level: 3,
    emoji: "⚡",
    unlockXp: 250,
    missions: ["7"], // Thunder
    isLocked: false,
  },
  {
    id: "chapter-4",
    title: "Combo Champion",
    description: "Mix it up! Practice blended sounds and tricky combos.",
    level: 4,
    emoji: "🎯",
    unlockXp: 400,
    missions: [], // Will be added later
    isLocked: true,
    comingSoon: true,
  },
  {
    id: "chapter-5",
    title: "Word Wizard",
    description: "Multi-syllable words! Say longer, more complex words.",
    level: 5,
    emoji: "🧙",
    unlockXp: 600,
    missions: [],
    isLocked: true,
    comingSoon: true,
  },
  {
    id: "chapter-6",
    title: "Sentence Sage",
    description: "Full sentences! Practice clear, flowing speech.",
    level: 6,
    emoji: "📚",
    unlockXp: 850,
    missions: [],
    isLocked: true,
    comingSoon: true,
  },
  {
    id: "chapter-7",
    title: "Conversation King",
    description: "Real conversations! Talk back and forth with Wolfie.",
    level: 7,
    emoji: "👑",
    unlockXp: 1150,
    missions: [],
    isLocked: true,
    comingSoon: true,
  },
  {
    id: "chapter-8",
    title: "Story Teller",
    description: "Tell stories! Share full narratives with expression.",
    level: 8,
    emoji: "📖",
    unlockXp: 1500,
    missions: [],
    isLocked: true,
    comingSoon: true,
  },
  {
    id: "chapter-9",
    title: "Grand Orator",
    description: "The ultimate challenge! Master all sounds and fluency.",
    level: 9,
    emoji: "🏆",
    unlockXp: 2000,
    missions: [],
    isLocked: true,
    comingSoon: true,
  },
];

export function getUnlockedChapters(totalXp: number): Chapter[] {
  return CHAPTERS.map(chapter => ({
    ...chapter,
    isLocked: chapter.comingSoon || totalXp < chapter.unlockXp,
  }));
}

export function getCurrentChapter(totalXp: number): Chapter {
  const unlocked = CHAPTERS.filter(c => !c.comingSoon && totalXp >= c.unlockXp);
  return unlocked[unlocked.length - 1] || CHAPTERS[0];
}

export function getNextChapter(totalXp: number): Chapter | null {
  const current = getCurrentChapter(totalXp);
  const currentIndex = CHAPTERS.findIndex(c => c.id === current.id);
  return CHAPTERS[currentIndex + 1] || null;
}
