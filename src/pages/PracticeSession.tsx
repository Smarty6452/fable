import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, ArrowLeft, Star, Volume2, MessageCircle } from "lucide-react";
import confetti from "canvas-confetti";
import Mascot from "@/components/Mascot";

const prompts = [
  { text: "Say 'sun' slowly — ssss-un! ☀️", target: "sun", sound: "s" },
  { text: "Can you say 'red'? Rrrr-ed! 🔴", target: "red", sound: "r" },
  { text: "Try 'fish'! Fffff-ish! 🐟", target: "fish", sound: "f" },
  { text: "Let's say 'cat'! Kuh-at! 🐱", target: "cat", sound: "c" },
  { text: "Say 'ball'! Buh-all! ⚽", target: "ball", sound: "b" },
  { text: "Tell me about your favorite toy! 🧸", target: "", sound: "" },
  { text: "What animal sound can you make? 🐶", target: "", sound: "" },
  { text: "Pretend we're at the park — what do you see? 🌳", target: "", sound: "" },
];

const encouragements = [
  "Amazing job! ⭐",
  "You're a superstar! 🌟",
  "Wow, great try! 🎉",
  "Foxy is so proud! 🦊",
  "Keep going, you're doing great! 💪",
];

type MascotMood = "happy" | "listening" | "encouraging" | "celebrating";

const PracticeSession = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const ageGroup = (location.state as any)?.ageGroup || "3–5";

  const [isListening, setIsListening] = useState(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [mascotMood, setMascotMood] = useState<MascotMood>("happy");
  const [stars, setStars] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [sessionLog, setSessionLog] = useState<string[]>([]);

  const currentPrompt = prompts[currentPromptIdx];

  const triggerCelebration = useCallback(() => {
    setMascotMood("celebrating");
    setStars((s) => s + 1);
    setFeedback(encouragements[Math.floor(Math.random() * encouragements.length)]);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#FFD93D", "#A7D8DE", "#F4A0A0", "#B8E0C8"],
    });
    setTimeout(() => setMascotMood("happy"), 2000);
  }, []);

  const handleMicToggle = () => {
    if (isListening) {
      setIsListening(false);
      setMascotMood("happy");
      // Simulate receiving speech
      const mockResponses = ["sun", "red", "fish", "I like my teddy bear", "woof woof!", "I see a tree"];
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setTranscript(response);
      setSessionLog((prev) => [...prev, `Prompt: ${currentPrompt.text} → Response: "${response}"`]);
      triggerCelebration();
    } else {
      setIsListening(true);
      setMascotMood("listening");
      setTranscript("");
      setFeedback("");
    }
  };

  const nextPrompt = () => {
    setCurrentPromptIdx((i) => (i + 1) % prompts.length);
    setTranscript("");
    setFeedback("");
    setMascotMood("happy");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-2 hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Home</span>
        </button>
        <div className="flex items-center gap-2 bg-sunshine/20 px-4 py-2 rounded-2xl">
          <Star className="w-5 h-5 text-sunshine fill-sunshine" />
          <span className="font-bold text-foreground">{stars}</span>
        </div>
      </div>

      {/* Main practice area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-6">
        {/* Mascot */}
        <Mascot mood={mascotMood} size="md" />

        {/* Speech bubble prompt */}
        <div className="relative bg-card rounded-3xl shadow-lg px-8 py-6 max-w-md w-full text-center border border-border">
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-card border-l border-t border-border rotate-45" />
          <p className="text-xl font-semibold text-foreground relative z-10">{currentPrompt.text}</p>
          {currentPrompt.sound && (
            <span className="mt-2 inline-block text-sm text-primary font-medium bg-primary/10 px-3 py-1 rounded-full">
              Focus sound: "{currentPrompt.sound}"
            </span>
          )}
        </div>

        {/* Transcript area */}
        {transcript && (
          <div className="bg-muted rounded-2xl px-6 py-4 max-w-sm w-full text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <MessageCircle className="w-4 h-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">You said:</span>
            </div>
            <p className="text-lg font-medium text-foreground">"{transcript}"</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && (
          <p className="text-2xl font-bold text-accent animate-[bounceGentle_0.6s_ease-out]">{feedback}</p>
        )}

        {/* Mic button */}
        <button
          onClick={handleMicToggle}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 ${
            isListening
              ? "bg-coral pulse-glow"
              : "bg-primary hover:scale-105"
          }`}
        >
          {isListening ? (
            <MicOff className="w-10 h-10 text-card" />
          ) : (
            <Mic className="w-10 h-10 text-card" />
          )}
        </button>
        <p className="text-sm text-muted-foreground">
          {isListening ? "Listening... Tap to stop" : "Tap to talk!"}
        </p>

        {/* Next button */}
        {transcript && (
          <button
            onClick={nextPrompt}
            className="px-6 py-3 rounded-2xl bg-secondary text-secondary-foreground font-semibold hover:scale-105 transition-all"
          >
            Next Prompt →
          </button>
        )}
      </div>

      {/* Audio wave at bottom when listening */}
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

export default PracticeSession;
