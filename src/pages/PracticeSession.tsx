import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Mic, MicOff, ArrowLeft, Star, Volume2, MessageCircle } from "lucide-react";
import confetti from "canvas-confetti";
import Mascot from "@/components/Mascot";
import { useBadges } from "@/contexts/BadgeContext";
import { supabase } from "@/integrations/supabase/client";

const prompts = [
  { text: "Say 'sun' slowly — ssss-un! ☀️", target: "sun", sound: "s", difficulty: 1 },
  { text: "Can you say 'red'? Rrrr-ed! 🔴", target: "red", sound: "r", difficulty: 1 },
  { text: "Try 'fish'! Fffff-ish! 🐟", target: "fish", sound: "f", difficulty: 1 },
  { text: "Let's say 'cat'! Kuh-at! 🐱", target: "cat", sound: "c", difficulty: 1 },
  { text: "Say 'ball'! Buh-all! ⚽", target: "ball", sound: "b", difficulty: 1 },
  { text: "Now try 'snake'! Ssss-nake! 🐍", target: "snake", sound: "s", difficulty: 2 },
  { text: "Say 'rabbit'! Rrr-abbit! 🐰", target: "rabbit", sound: "r", difficulty: 2 },
  { text: "Tell me about your favorite toy! 🧸", target: "", sound: "", difficulty: 1 },
  { text: "What animal sound can you make? 🐶", target: "", sound: "", difficulty: 1 },
  { text: "Pretend we're at the park — what do you see? 🌳", target: "", sound: "", difficulty: 1 },
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
  const { earnBadge, addStars, addWord, incrementSession } = useBadges();

  const [isListening, setIsListening] = useState(false);
  const [currentPromptIdx, setCurrentPromptIdx] = useState(0);
  const [mascotMood, setMascotMood] = useState<MascotMood>("happy");
  const [stars, setStars] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [feedback, setFeedback] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<Array<{ role: string; content: string }>>([]);
  const [consecutiveFails, setConsecutiveFails] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [sessionStarted, setSessionStarted] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentPrompt = prompts.filter((p) => p.difficulty <= difficulty)[currentPromptIdx % prompts.filter((p) => p.difficulty <= difficulty).length];

  // Start session tracking
  useEffect(() => {
    if (!sessionStarted) {
      setSessionStarted(true);
      incrementSession();
      earnBadge("brave_talker");
    }
  }, [sessionStarted, incrementSession, earnBadge]);

  // Adaptive difficulty
  useEffect(() => {
    if (consecutiveFails >= 3) {
      setDifficulty(1);
      setFeedback("Let's try something easier! You're doing great! 💪");
      setConsecutiveFails(0);
    }
  }, [consecutiveFails]);

  const playAudio = useCallback((base64Audio: string) => {
    try {
      const audioData = atob(base64Audio);
      const arrayBuffer = new Uint8Array(audioData.length);
      for (let i = 0; i < audioData.length; i++) {
        arrayBuffer[i] = audioData.charCodeAt(i);
      }
      const blob = new Blob([arrayBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(url);
      audioRef.current.play();
    } catch (e) {
      console.error("Audio playback error:", e);
    }
  }, []);

  const getAIResponse = useCallback(
    async (userTranscript: string) => {
      setIsProcessing(true);
      try {
        const { data, error } = await supabase.functions.invoke("speech-therapy", {
          body: {
            transcript: userTranscript,
            targetSound: currentPrompt.sound,
            mode: "practice",
            sessionHistory: sessionHistory.slice(-6),
          },
        });

        if (error) throw error;

        if (data?.text) {
          setAiResponse(data.text);
          setSessionHistory((prev) => [
            ...prev,
            { role: "user", content: userTranscript },
            { role: "assistant", content: data.text },
          ]);
        }

        if (data?.audio) {
          playAudio(data.audio);
        }
      } catch (e) {
        console.error("AI response error:", e);
        // Fallback to local encouragement
        setAiResponse(encouragements[Math.floor(Math.random() * encouragements.length)]);
      } finally {
        setIsProcessing(false);
      }
    },
    [currentPrompt, sessionHistory, playAudio]
  );

  const triggerCelebration = useCallback(() => {
    setMascotMood("celebrating");
    const newStars = stars + 1;
    setStars(newStars);
    addStars(1);
    setFeedback(encouragements[Math.floor(Math.random() * encouragements.length)]);
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.7 },
      colors: ["#FFD93D", "#A7D8DE", "#F4A0A0", "#B8E0C8"],
    });
    setConsecutiveFails(0);

    if (newStars >= 5) {
      earnBadge("five_star");
    }

    setTimeout(() => setMascotMood("happy"), 2000);
  }, [stars, addStars, earnBadge]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: simulate for browsers without support
      setIsListening(true);
      setMascotMood("listening");
      setTranscript("");
      setFeedback("");
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

      // Check if target word was said
      if (currentPrompt.target) {
        addWord(result.toLowerCase());
        if (result.toLowerCase().includes(currentPrompt.target.toLowerCase())) {
          triggerCelebration();
        } else {
          setConsecutiveFails((f) => f + 1);
          setMascotMood("encouraging");
          setTimeout(() => setMascotMood("happy"), 1500);
        }
      } else {
        // Free talk - always celebrate
        triggerCelebration();
        earnBadge("story_star");
      }

      // Get AI response
      getAIResponse(result);
    };

    recognition.onerror = () => {
      setIsListening(false);
      setMascotMood("happy");
      setFeedback("I couldn't hear that. Try again! 🎤");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setMascotMood("listening");
    setTranscript("");
    setFeedback("");
    setAiResponse("");
  }, [currentPrompt, triggerCelebration, getAIResponse, addWord, earnBadge]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    } else {
      // Fallback for browsers without Speech API
      setIsListening(false);
      setMascotMood("happy");
      const mockResponses = ["sun", "red", "fish", "I like my teddy bear", "woof woof!", "I see a tree"];
      const response = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      setTranscript(response);
      addWord(response.toLowerCase());
      triggerCelebration();
      getAIResponse(response);
    }
  }, [triggerCelebration, getAIResponse, addWord]);

  const handleMicToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const nextPrompt = () => {
    const filteredPrompts = prompts.filter((p) => p.difficulty <= difficulty);
    setCurrentPromptIdx((i) => (i + 1) % filteredPrompts.length);
    setTranscript("");
    setFeedback("");
    setAiResponse("");
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
        <div className="flex items-center gap-3">
          {consecutiveFails >= 2 && (
            <span className="text-xs text-coral font-medium bg-coral/10 px-2 py-1 rounded-full">
              Easy mode 💪
            </span>
          )}
          <div className="flex items-center gap-2 bg-sunshine/20 px-4 py-2 rounded-2xl">
            <Star className="w-5 h-5 text-sunshine fill-sunshine" />
            <span className="font-bold text-foreground">{stars}</span>
          </div>
        </div>
      </div>

      {/* Main practice area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 gap-5">
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

        {/* AI Response */}
        {aiResponse && (
          <div className="bg-primary/10 rounded-2xl px-6 py-4 max-w-sm w-full text-center border border-primary/20">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Volume2 className="w-4 h-4 text-primary" />
              <span className="text-xs text-primary font-medium">Foxy says:</span>
            </div>
            <p className="text-lg font-medium text-foreground">{aiResponse}</p>
          </div>
        )}

        {/* Feedback */}
        {feedback && !aiResponse && (
          <p className="text-2xl font-bold text-accent animate-[bounceGentle_0.6s_ease-out]">{feedback}</p>
        )}

        {/* Processing indicator */}
        {isProcessing && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm">Foxy is thinking...</span>
          </div>
        )}

        {/* Mic button */}
        <button
          onClick={handleMicToggle}
          disabled={isProcessing}
          className={`w-24 h-24 rounded-full flex items-center justify-center shadow-xl transition-all duration-200 active:scale-90 ${
            isListening
              ? "bg-coral pulse-glow"
              : isProcessing
              ? "bg-muted cursor-wait"
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
          {isListening ? "Listening... Tap to stop" : isProcessing ? "Processing..." : "Tap to talk!"}
        </p>

        {/* Next button */}
        {(transcript || aiResponse) && !isProcessing && (
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
