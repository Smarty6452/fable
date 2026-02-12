import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface Badge {
  id: string;
  name: string;
  emoji: string;
  description: string;
  earned: boolean;
  earnedAt?: Date;
}

const DEFAULT_BADGES: Badge[] = [
  { id: "super_s", name: "Super S Speaker", emoji: "🐍", description: "Practice the S sound 5 times", earned: false },
  { id: "brave_talker", name: "Brave Talker", emoji: "🦁", description: "Complete your first session", earned: false },
  { id: "story_star", name: "Story Star", emoji: "📖", description: "Tell a story to Foxy", earned: false },
  { id: "sound_hunter", name: "Sound Hunter", emoji: "🔍", description: "Win a Sound Quest game", earned: false },
  { id: "five_star", name: "Five Star Friend", emoji: "⭐", description: "Earn 5 stars in one session", earned: false },
  { id: "practice_pro", name: "Practice Pro", emoji: "🏆", description: "Complete 3 sessions", earned: false },
  { id: "word_wizard", name: "Word Wizard", emoji: "🧙", description: "Say 10 different words", earned: false },
  { id: "happy_helper", name: "Happy Helper", emoji: "🤗", description: "Try every sound category", earned: false },
];

interface BadgeContextType {
  badges: Badge[];
  totalStars: number;
  sessionCount: number;
  earnBadge: (id: string) => void;
  addStars: (count: number) => void;
  incrementSession: () => void;
  wordsSpoken: string[];
  addWord: (word: string) => void;
}

const BadgeContext = createContext<BadgeContextType | null>(null);

export const useBadges = () => {
  const ctx = useContext(BadgeContext);
  if (!ctx) throw new Error("useBadges must be used within BadgeProvider");
  return ctx;
};

export const BadgeProvider = ({ children }: { children: ReactNode }) => {
  const [badges, setBadges] = useState<Badge[]>(DEFAULT_BADGES);
  const [totalStars, setTotalStars] = useState(0);
  const [sessionCount, setSessionCount] = useState(0);
  const [wordsSpoken, setWordsSpoken] = useState<string[]>([]);

  const earnBadge = useCallback((id: string) => {
    setBadges((prev) =>
      prev.map((b) =>
        b.id === id && !b.earned ? { ...b, earned: true, earnedAt: new Date() } : b
      )
    );
  }, []);

  const addStars = useCallback((count: number) => {
    setTotalStars((prev) => prev + count);
  }, []);

  const incrementSession = useCallback(() => {
    setSessionCount((prev) => prev + 1);
  }, []);

  const addWord = useCallback((word: string) => {
    setWordsSpoken((prev) => {
      if (prev.includes(word.toLowerCase())) return prev;
      return [...prev, word.toLowerCase()];
    });
  }, []);

  return (
    <BadgeContext.Provider
      value={{ badges, totalStars, sessionCount, earnBadge, addStars, incrementSession, wordsSpoken, addWord }}
    >
      {children}
    </BadgeContext.Provider>
  );
};
