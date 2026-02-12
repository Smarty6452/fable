import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Mic, MicOff, Trophy, Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import Mascot from "@/components/Mascot";
import { useBadges } from "@/contexts/BadgeContext";
import { supabase } from "@/integrations/supabase/client";

const SOUNDS = [
  { sound: "s", emoji: "🐍", label: "S Sound", hints: ["Something in the sky...", "It's a bright yellow circle...", "You play with it in summer..."] },
  { sound: "r", emoji: "🦁", label: "R Sound", hints: ["It falls from clouds...", "It's a color...", "You run in this..."] },
  { sound: "f", emoji: "🐟", label: "F Sound", hints: ["It swims in water...", "You hold it to eat...", "They grow on trees..."] },
  { sound: "b", emoji: "⚽", label: "B Sound", hints: ["You throw and catch it...", "You read this...", "A flying insect..."] },
];

const WORD_BANK: Record<string, string[]> = {
  s: ["sun", "star", "snake", "snow", "sand", "soup", "soap", "sock", "sea", "seed"],
  r: ["rain", "red", "run", "road", "rock", "rose", "ring", "rug", "rat", "rope"],
  f: ["fish", "fork", "fun", "frog", "fire", "fan", "fox", "food", "five", "feet"],
  b: ["ball", "book", "bee", "bird", "bed", "bag", "bus", "bat", "box", "bear"],
};

type SpeechRecognitionType = typeof window extends { SpeechRecognition: infer T } ? T : any;

const SoundQuest = () => {
  const navigate = useNavigate();
  const { earnBadge, addStars, addWord } = useBadges();
  const [selectedSound, setSelectedSound] = useState<string | null>(null);
  const [foundWords, setFoundWords] = useState<string[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [hintIndex, setHintIndex] = useState(0);
  const [gameWon, setGameWon] = useState(false);
  const [mascotMood, setMascotMood] = useState<"happy" | "listening" | "encouraging" | "celebrating">("happy");
  const recognitionRef = useRef<any>(null);

  const GOAL = 3;

  const triggerCelebration = useCallback(() => {
    setMascotMood("celebrating");
    confetti({
      particleCount: 100,
      spread: 80,
      origin: { y: 0.6 },
      colors: ["#FFD93D", "#A7D8DE", "#F4A0A0", "#B8E0C8"],
    });
    setTimeout(() => setMascotMood("happy"), 2500);
  }, []);

  const checkWord = useCallback(
    (word: string) => {
      if (!selectedSound) return;
      const clean = word.toLowerCase().trim();
      const validWords = WORD_BANK[selectedSound] || [];

      if (clean.startsWith(selectedSound) || validWords.includes(clean)) {
        if (!foundWords.includes(clean)) {
          const newFound = [...foundWords, clean];
          setFoundWords(newFound);
          addWord(clean);
          addStars(1);
          triggerCelebration();

          if (newFound.length >= GOAL) {
            setGameWon(true);
            setFeedback("🎉 You found them all! You're a Sound Hunter!");
            earnBadge("sound_hunter");
            addStars(3);
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.5 },
              colors: ["#FFD93D", "#A7D8DE", "#F4A0A0", "#B8E0C8", "#D4A7FF"],
            });
          } else {
            setFeedback(`Amazing! "${clean}" starts with ${selectedSound}! ${GOAL - newFound.length} more to go!`);
          }
        } else {
          setFeedback(`You already found "${clean}"! Try a different word!`);
          setMascotMood("encouraging");
          setTimeout(() => setMascotMood("happy"), 1500);
        }
      } else {
        setFeedback(`"${clean}" doesn't start with the "${selectedSound}" sound. Try again!`);
        setMascotMood("encouraging");
        setTimeout(() => setMascotMood("happy"), 1500);
      }
    },
    [selectedSound, foundWords, addStars, addWord, earnBadge, triggerCelebration]
  );

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setFeedback("Speech recognition not supported in this browser. Try Chrome!");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const result = event.results[0][0].transcript;
      setTranscript(result);
      setIsListening(false);
      setMascotMood("happy");
      checkWord(result);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setMascotMood("happy");
      setFeedback("I couldn't hear that. Try again!");
    };

    recognition.onend = () => {
      setIsListening(false);
      setMascotMood("happy");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setMascotMood("listening");
    setTranscript("");
    setFeedback("");
  }, [checkWord]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
    setMascotMood("happy");
  }, []);

  const getHint = () => {
    if (!selectedSound) return;
    const soundData = SOUNDS.find((s) => s.sound === selectedSound);
    if (soundData && soundData.hints[hintIndex]) {
      setFeedback(`💡 Hint: ${soundData.hints[hintIndex]}`);
      setHintIndex((i) => (i + 1) % soundData.hints.length);
    }
  };

  const resetGame = () => {
    setSelectedSound(null);
    setFoundWords([]);
    setTranscript("");
    setFeedback("");
    setGameWon(false);
    setHintIndex(0);
    setMascotMood("happy");
  };

  if (!selectedSound) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-2 hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
          <Mascot mood="happy" size="md" />
          <h1 className="text-3xl font-bold text-foreground text-center">
            🔍 Sound Quest!
          </h1>
          <p className="text-muted-foreground text-center max-w-sm">
            Pick a sound, then find 3 words that start with it!
          </p>

          <div className="grid grid-cols-2 gap-4 w-full max-w-sm">
            {SOUNDS.map((s) => (
              <button
                key={s.sound}
                onClick={() => setSelectedSound(s.sound)}
                className="flex flex-col items-center gap-2 p-6 rounded-3xl bg-card border-2 border-border hover:border-accent hover:scale-105 transition-all shadow-md"
              >
                <span className="text-4xl">{s.emoji}</span>
                <span className="font-bold text-foreground text-lg">{s.label}</span>
                <span className="text-sm text-muted-foreground">"{s.sound}" sound</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={resetGame}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-2 hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back</span>
        </button>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-sunshine/20 px-3 py-1.5 rounded-2xl">
            {Array.from({ length: GOAL }).map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < foundWords.length
                    ? "text-sunshine fill-sunshine"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-5">
        <Mascot mood={mascotMood} size="md" />

        <div className="bg-card rounded-3xl shadow-lg px-8 py-6 max-w-md w-full text-center border border-border">
          <p className="text-xl font-semibold text-foreground">
            {gameWon
              ? "🎉 You did it! Amazing job!"
              : `Find ${GOAL - foundWords.length} words starting with "${selectedSound}"!`}
          </p>
        </div>

        {/* Found words */}
        {foundWords.length > 0 && (
          <div className="flex gap-3 flex-wrap justify-center">
            {foundWords.map((w) => (
              <div
                key={w}
                className="bg-secondary/30 text-secondary-foreground px-4 py-2 rounded-2xl font-semibold text-lg border border-secondary/50"
              >
                ✅ {w}
              </div>
            ))}
          </div>
        )}

        {transcript && (
          <div className="bg-muted rounded-2xl px-6 py-3 text-center">
            <p className="text-sm text-muted-foreground">You said:</p>
            <p className="text-lg font-medium text-foreground">"{transcript}"</p>
          </div>
        )}

        {feedback && (
          <p className="text-lg font-bold text-accent text-center max-w-sm animate-[bounceGentle_0.6s_ease-out]">
            {feedback}
          </p>
        )}

        {!gameWon && (
          <>
            <button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 ${
                isListening ? "bg-coral pulse-glow" : "bg-primary hover:scale-105"
              }`}
            >
              {isListening ? (
                <MicOff className="w-8 h-8 text-card" />
              ) : (
                <Mic className="w-8 h-8 text-card" />
              )}
            </button>
            <p className="text-sm text-muted-foreground">
              {isListening ? "Listening..." : "Tap to say a word!"}
            </p>
            <button
              onClick={getHint}
              className="text-sm text-primary underline hover:text-primary/80"
            >
              Need a hint? 💡
            </button>
          </>
        )}

        {gameWon && (
          <div className="flex gap-3">
            <button
              onClick={resetGame}
              className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold hover:scale-105 transition-all"
            >
              Play Again!
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-3 rounded-2xl bg-secondary text-secondary-foreground font-semibold hover:scale-105 transition-all"
            >
              Home
            </button>
          </div>
        )}
      </div>

      {isListening && (
        <div className="fixed bottom-0 left-0 right-0 flex items-end justify-center gap-1 pb-6 pointer-events-none">
          {Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="w-1.5 bg-primary/40 rounded-full wave-bar"
              style={{
                height: `${Math.random() * 30 + 10}px`,
                animationDelay: `${i * 0.08}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SoundQuest;
