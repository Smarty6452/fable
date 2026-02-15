"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Volume2, ArrowLeft, Star, Sparkles, RefreshCw,
  Lightbulb, Gauge, ArrowRight, MicOff, MessageCircleMore, X
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import MicVisualizer from "@/components/MicVisualizer";
import BuddySelector, { BUDDIES } from "@/components/BuddySelector";
import BuddyMascot from "@/components/BuddyMascot";
import InteractiveBackground from "@/components/InteractiveBackground";
import GuidedTour, { PLAY_TOUR_STEPS } from "@/components/GuidedTour";
import { NotificationBell, useNotifications, triggerLevelUpNotification, triggerStreakNotification } from "@/components/NotificationBell";
import { preloadTTS, playCachedTTS, stopAllTTS } from "@/lib/audio";
import { CHAPTERS, getUnlockedChapters } from "@/data/chapters";
import { MISSIONS, type Mission } from "@/data/missions";
import { 
  XP_PER_WORD, 
  PERFECT_ROUND_BONUS, 
  getLevelFromXp, 
  getXpProgressInLevel, 
  calculateStars, 
  getRandomSuccessMessage, 
  getRandomRetryMessage,
  getRandomLevelUpMessage 
} from "@/lib/progression";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";


export default function PlayPage() {

  // Refs
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Hooks
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addNotification } = useNotifications();

  // Core Game State — Init with defaults to prevent Hydration Error
  const [gameState, setGameState] = useState<"onboarding" | "select" | "practice" | "ending">("onboarding");
  const [selectedBuddy, setSelectedBuddy] = useState(BUDDIES[0]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  
  // Audio/Voice State
  const [listeningMode, setListeningMode] = useState<"name" | "buddy" | "practice" | "chat" | null>(null);
  const [isChatMode, setIsChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState<{role: "user" | "ai", text: string}[]>([]);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  // Progress State — Init with defaults
  const [kidName, setKidName] = useState("");
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  
  // UI State
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [availableVoices, setAvailableVoices] = useState<any[]>([]);
  const [mood, setMood] = useState<"happy" | "sad" | "surprised" | "celebrating">("happy");
  const [success, setSuccess] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<{sender: 'buddy' | 'kid', text: string}[]>([]);

  const [selectedChapterId, setSelectedChapterId] = useState(CHAPTERS[0].id);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [stars, setStars] = useState(0);

  const [hasMounted, setHasMounted] = useState(false);
  const xpInfo = useMemo(() => getXpProgressInLevel(xp), [xp]);
  const unlockedChapters = useMemo(() => getUnlockedChapters(xp), [xp]);

  // Hydrate State on Mount (Client-Side Only)
  useEffect(() => {
    setHasMounted(true);
    
    // Safely read localStorage
    const savedName = localStorage.getItem("kidName");
    const savedBuddyId = localStorage.getItem("selectedBuddy");
    const savedXp = localStorage.getItem("xp");
    const savedLevel = localStorage.getItem("level");
    const savedStreak = localStorage.getItem("streak");
    const savedMissions = localStorage.getItem("completedMissions");

    if (savedName) setKidName(savedName);
    if (savedName) setGameState("select");

    if (savedBuddyId) {
      const found = BUDDIES.find(b => b.id === savedBuddyId);
      if (found) setSelectedBuddy(found);
    }
    if (savedXp) setXp(parseInt(savedXp));
    if (savedLevel) setLevel(parseInt(savedLevel));
    if (savedStreak) setStreak(parseInt(savedStreak));
    if (savedMissions) {
      try { setCompletedMissions(JSON.parse(savedMissions)); } catch {}
    }

    if (savedName) {
       const isNewSession = sessionStorage.getItem("justLoggedIn");
       if (isNewSession) {
         sessionStorage.removeItem("justLoggedIn");
         const greetingText = `Hi ${savedName}! I am so happy you are here! Pick your buddy below to start our adventure!`;
         const currentBuddyId = savedBuddyId || "wolf";
         const voice = getVoiceForBuddy(currentBuddyId);
         setTimeout(() => playTTS(greetingText, voice), 500);
       }
       
       const welcomeKey = "fable-welcome-notified";
       if (!localStorage.getItem(welcomeKey)) {
         addNotification({ type: "reward", title: "Welcome!", message: "Ready for an adventure? Let's practice some sounds!" });
         localStorage.setItem(welcomeKey, "true");
       }
    }
  }, [addNotification]);

  // Fetch Available Voices
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setAvailableVoices(voices.map(v => ({ voiceId: v.name, displayName: v.name, gender: 'female' }))); 
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Also fetch Smallest AI voices
    const fetchSmallestVoices = async () => {
      try {
        const res = await fetch(`${API_BASE}/voices?model=lightning-v3.1`);
        if (res.ok) {
          const data = await res.json();
          if (data.voices) {
            setAvailableVoices(prev => [...prev, ...data.voices]);

          }
        }
      } catch (err) {
        // Voice fetch failed silently — fallback voices remain
      }
    };
    fetchSmallestVoices();
  }, []);

  // Offline Detection
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Preload Buddy Voices (Realistic strategy) - Staggered to avoid limits
  useEffect(() => {
    const intros = [
      { id: "wolf", text: "Hi! I'm Wolfie. Ready to howl with some sounds?", voice: "amx" },
      { id: "robot", text: "Hello. I am Bolt. Let us process some practice words together.", voice: "onyx" },
      { id: "cat", text: "Meow! I'm Luna. I love hearing you speak!", voice: "sarah" },
      { id: "puppy", text: "Woof! I'm Max. Let's play and talk!", voice: "amx" },
      { id: "panda", text: "Hi there, I'm Mochi. Let's take it slow and steady.", voice: "nyah" }
    ];
    
    intros.forEach((buddy, index) => {
      setTimeout(() => {
        preloadTTS(buddy.text, buddy.voice);
      }, index * 800);
    });
  }, []);

  // --- CORE FUNCTIONS (Consolidated) ---
  const getVoiceForBuddy = (buddyId: string) => {
    switch (buddyId) {
      case "cat": return "sarah";
      case "panda": return "nyah";
      case "wolf": return "amx";
      case "robot": return "onyx";
      case "puppy": return "amx";
      default: return "lauren";
    }
  };

  const playTTSFallback = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) { resolve(); return; }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.8, Math.min(1.2, voiceSpeed));
      utterance.voice = window.speechSynthesis.getVoices().find(v => v.name.includes("Google")) || null;
      utterance.onend = () => { setIsSpeaking(false); resolve(); };
      utterance.onerror = () => { setIsSpeaking(false); resolve(); };
      setIsSpeaking(true);
      window.speechSynthesis.speak(utterance);
    });
  };

  const playTTS = async (text: string, voiceIdOverride?: string): Promise<void> => {
    stopAllAudio();
    setIsSynthesizing(true);
    try {
      const voiceId = voiceIdOverride || getVoiceForBuddy(selectedBuddy.id);
      const audioUrl = await preloadTTS(text, voiceId, voiceSpeed);
      if (!audioUrl) { await playTTSFallback(text); setIsSynthesizing(false); return; }
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      await new Promise<void>((resolve) => {
        audio.onplay = () => setIsSpeaking(true);
        audio.onended = () => { setIsSpeaking(false); setIsSynthesizing(false); resolve(); };
        audio.onerror = async () => { await playTTSFallback(text); setIsSynthesizing(false); resolve(); };
        audio.play().catch(() => playTTSFallback(text).then(resolve));
      });
    } catch { await playTTSFallback(text); setIsSynthesizing(false); }
  };

  const previewWord = () => {
    if (activeMission) playTTS(activeMission.word);
  };

  const toggleListening = () => {
     if (isListening) {
       if (recognitionRef.current) recognitionRef.current.abort();
       setIsListening(false);
       setListeningMode(null);
     } else {
       startListening("practice");
     }
  };

  const handleChatInput = async (text: string) => {
    if (!text.trim()) return;
    setChatHistory(prev => [...prev, { role: "user", text }]);
    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, buddy: selectedBuddy.id }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatHistory(prev => [...prev, { role: "ai", text: data.reply }]);
        const voice = getVoiceForBuddy(selectedBuddy.id);
        await playCachedTTS(data.reply, voice);
      }
    } catch (e) { playTTS("Oops, I'm having trouble thinking! Try again?"); }
  };

  const toggleChat = () => {
    setIsChatMode(!isChatMode);
    if (!isChatMode) {
      setChatHistory([{ role: "ai", text: `Hi! I'm ${selectedBuddy.name}. Let's chat!` }]);
      playTTS(`Hi! I'm ${selectedBuddy.name}. Let's chat!`);
    } else {
      stopAllAudio();
      setListeningMode(null);
    }
  };

  const checkResult = async (text: string) => {
    const navCommand = text.toLowerCase().trim();
    if (navCommand.includes("go home") || navCommand.includes("stop game")) {
      playTTS("Okay, heading home!");
      stopAllAudio();
      setGameState("select");
      return;
    }
    if ((navCommand.includes("next") || navCommand.includes("skip")) && (success || attempts > 2)) {
      playTTS("Skipping to the next mission!");
      setGameState("select"); 
      return;
    }
    if (!activeMission) return;

    const normalizedText = text.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const target = activeMission.word.toLowerCase();
    const isCorrect = normalizedText.includes(target) || target.includes(normalizedText); 
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (isCorrect) {
       setSuccess(true);
       setMood("happy");
       setStars(s => s + 1);
       setStreak(s => s + 1);
       
       const confetti = (await import("canvas-confetti")).default;
       confetti({ particleCount: 150 });

       const newXp = xp + 10;
       setXp(newXp);
       localStorage.setItem("xp", newXp.toString());
       
       const newLevel = Math.floor(newXp / 100) + 1;
       if (newLevel > level) {
         setLevel(newLevel);
         setShowLevelUp(true);
         setMood("celebrating");
         triggerLevelUpNotification(newLevel, addNotification);
         playTTS(getRandomLevelUpMessage());
       } else {
         playTTS(getRandomSuccessMessage());
       }
    } else {
       setStreak(0);
       setMood(normalizedText.includes(activeMission.sound) ? "surprised" : "sad");
       playTTS(normalizedText.includes(activeMission.sound) 
         ? `So close! I heard the ${activeMission.sound} sound!` 
         : getRandomRetryMessage());
    }
  };

  // Helper to stop all playing audio
  const stopAllAudio = () => {
    window.speechSynthesis.cancel();
    stopAllTTS();
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsSynthesizing(false);
    setIsSpeaking(false);
  };

  const startListening = (mode: "name" | "buddy" | "practice" | "chat" = "practice") => {
    // 0. STOP ANY TALKING BUDDY FIRST
    stopAllAudio();

    // 1. Safety Check: Browser Support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice not supported in this browser. Please use Chrome.");
      return;
    }

    // 2. Cleanup: Stop any existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch(e) {}
      recognitionRef.current = null;
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setTranscript("");
    setSpeechError(null);
    setIsListening(true);
    setListeningMode(mode);

    // Play Pop Sound
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      }
    } catch (e) { /* ignore */ }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.maxAlternatives = 5;

    let hasResult = false;

    recognition.onstart = () => {
       setIsListening(true);
       setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      stopAllAudio(); // Ensure buddy stays quiet if they try to interrupt
      const results = Array.from(event.results);
      const transcriptItem = results[0] as any;
      const text = transcriptItem[0].transcript;
      setTranscript(text);
      if (transcriptItem.isFinal) {
        hasResult = true;
        setIsListening(false);
        setListeningMode(null);
        
        // ROUTE BASED ON MODE
        if (mode === "name") handleNameInput(text);
        else if (mode === "buddy") handleBuddySelection(text);
        else if (mode === "chat") handleChatInput(text);
        else checkResult(text);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') return;
      setIsListening(false);
      setListeningMode(null);
      
      const errorMap: Record<string, string> = {
        'no-speech': "🎤 I didn't hear anything. Speak a bit louder!",
        'audio-capture': "🎤 No microphone found. Is it plugged in?",
        'not-allowed': "🔒 Microphone blocked. Check your browser settings.",
        'network': "📡 Network error. Please check your internet.",
      };
      setSpeechError(errorMap[event.error] || "⚠️ Oops! Let's try that again.");
      if (event.error === 'not-allowed') toast.error("Microphone access is blocked! 🔒");
    };

    recognition.onend = () => {
      if (!hasResult) {
        setIsListening(false);
        setListeningMode(null);
      }
      recognitionRef.current = null;
      if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
      }
    };

    try {
      recognition.start();
      navigator.mediaDevices.getUserMedia({ audio: true }).then(newStream => {
        streamRef.current = newStream;
      }).catch(err => { /* Mic stream unavailable */ });
    } catch (err) {
      setIsListening(false);
      setListeningMode(null);
      setSpeechError("⚠️ Could not start microphone.");
    }
  };

  const handleNameInput = (text: string) => {
    const cleanName = text.replace(/[.,!]/g, "").trim();
    if (cleanName.length > 1) {
      setKidName(cleanName);
      playTTS(`Nice to meet you, ${cleanName}!`);
    } else {
      playTTS("I didn't catch that. What is your name?");
    }
  };

  const handleBuddySelection = (text: string) => {
    const lower = text.toLowerCase();
    const buddy = BUDDIES.find(b => 
      lower.includes(b.name.toLowerCase()) || 
      lower.includes(b.id) ||
      (b.id === 'cat' && (lower.includes('kitten') || lower.includes('kitty'))) ||
      (b.id === 'dog' && (lower.includes('puppy') || lower.includes('dog'))) ||
      (b.id === 'wolf' && lower.includes('wolf'))
    );

    if (buddy) {
      setSelectedBuddy(buddy);
      const voice = getVoiceForBuddy(buddy.id);
      playCachedTTS(`You picked ${buddy.name}! Great choice!`, voice);
    } else {
      playTTS("I didn't hear a buddy's name. Try saying Wolfie, Bolt, Luna, Max, or Mochi!");
    }
  };

  const activeChapter = CHAPTERS.find(c => c.id === selectedChapterId) || CHAPTERS[0];
  const missionsForChapter = MISSIONS.filter(m => activeChapter.missions.includes(m.id));

  // Determine active level progression


  const saveOnboarding = async () => {
    if (kidName.trim()) {
      const name = kidName.trim();
      localStorage.setItem("kidName", name);
      localStorage.setItem("selectedBuddy", selectedBuddy.id);
      
      // Attempt to restore progress from server
      try {
        toast.loading("Checking for saved adventure...");
        const res = await fetch(`${API_BASE}/stats?kid=${encodeURIComponent(name)}`);
        const data = await res.json();
        
        if (data.success && data.data.totalXp > 0) {
          const serverXp = data.data.totalXp;
          const serverLevel = Math.floor(serverXp / 100) + 1;
          
          setXp(serverXp);
          setLevel(serverLevel);
          localStorage.setItem("xp", serverXp.toString());
          localStorage.setItem("level", serverLevel.toString());
          
          toast.success(`Welcome back, ${name}! Level ${serverLevel} restored! 🌟`);
          playTTS(`Welcome back, ${name}! I'm so happy you're here! We are on Level ${serverLevel} now!`);
        } else {
          toast.dismiss();
          toast.success(`Welcome ${name}! Let's start learning!`);
          playTTS(`Hi ${name}! I'm ${selectedBuddy.name} and I'm so excited to be your friend! Can you pick a mission for us to do?`);
        }
      } catch (e) {
        toast.dismiss();
        toast.success(`Welcome ${name}!`);
        playTTS(`Hi there ${name}! I'm ${selectedBuddy.name}! Let's pick a fun mission together!`);
      }

      setGameState("select");
    }
  };


  const logout = () => {
    toast("Switch explorer?", {
      description: "Current progress will be safe for this name!",
      action: {
        label: "Switch",
        onClick: () => {
          stopAllTTS(); // Stop any speech
          localStorage.removeItem("kidName");
          localStorage.removeItem("selectedBuddy");
          window.location.href = "/";
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };


  const startPractice = (mission: Mission) => {
    // Unlock Audio Context for iOS/Chrome autoplay policies
    const unlockAudio = () => {
      const audio = new Audio();
      audio.play().catch(() => {});
    };
    unlockAudio();

    setActiveMission(mission);
    setGameState("practice");
    setTranscript("");
    setSuccess(false);
    setAttempts(0);
    setShowTip(false);
    setMood("happy"); // Reset mood on new mission
    speakFirstTime(mission);
  };

  // Preload greetings for all missions in the current chapter so first TTS is instant
  useEffect(() => {
    if (gameState !== "select" || !kidName) return;
    const voiceId = getVoiceForBuddy(selectedBuddy.id);
    // Stagger preloads to avoid API rate limits
    missionsForChapter.forEach((mission, i) => {
      setTimeout(() => {
        const text = `Let's practice the ${mission.sound} sound. Can you say ${mission.word}?`;
        preloadTTS(text, voiceId, voiceSpeed);
      }, i * 600);
    });
  }, [gameState, selectedChapterId, selectedBuddy.id, voiceSpeed, kidName]);

  const speakFirstTime = async (mission: Mission) => {
    const greetings = [
      `Hi ${kidName}! Ready for an adventure?`,
      `Hey there ${kidName}! This is gonna be fun!`,
      `Woohoo ${kidName}! Let's do this!`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    const text = `${greeting} Let's practice the ${mission.sound} sound. Can you say ${mission.word}?`;
    await playTTS(text);
  };





  return (
    <div 
      className="min-h-screen p-4 md:p-6 flex flex-col items-center relative overflow-hidden" 
      suppressHydrationWarning
    >
      <InteractiveBackground />

      <GuidedTour 
        steps={PLAY_TOUR_STEPS} 
        onComplete={() => {}} 
        storageKey="play-tour-v1" 
      />

      <AnimatePresence mode="wait">
        {/* onboarding state */}
        {gameState === "onboarding" && (
          <motion.div
            key="onboarding"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex flex-col items-center w-full max-w-lg text-center pt-6 relative z-10"
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="w-40 h-40 bg-white/40 backdrop-blur-xl rounded-full shadow-2xl mb-6 border-[6px] border-white overflow-hidden relative flex items-center justify-center"
            >
              <div className="absolute inset-0 flex items-center justify-center">
                 <BuddyMascot 
                   isListening={false} 
                   isSynthesizing={false} 
                   buddyType={selectedBuddy.id} 
                   size={140}
                 />
              </div>
            </motion.div>
            <h2 className="text-4xl font-black mb-3 text-slate-800 tracking-tight">
              Hey! I'm {selectedBuddy.name}!
            </h2>
            <p className="text-xl text-slate-500 mb-6 font-bold">Your AI Speech Buddy! What's your name?</p>

            <div className="relative w-full max-w-sm mb-8">
              <input
                type="text"
                placeholder="Say your name..."
                value={kidName}
                onChange={(e) => setKidName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && kidName.trim() && saveOnboarding()}
                className="w-full p-6 text-3xl font-black rounded-[2.5rem] border-4 border-white focus:border-primary outline-none text-center shadow-xl bg-white/80 backdrop-blur-sm focus:bg-white transition-all placeholder:text-slate-300"
                autoFocus
                disabled={listeningMode === "name"}
                suppressHydrationWarning
              />
              <button
                onClick={() => startListening("name")}
                className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full transition-all ${
                  listeningMode === "name" 
                    ? "bg-red-500 text-white animate-pulse shadow-red-300 shadow-lg" 
                    : "bg-primary/10 text-primary hover:bg-primary hover:text-white"
                }`}
                title="Say your name!"
              >
                {listeningMode === "name" ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </div>

            <p className="text-sm text-slate-400 mb-4 font-black uppercase tracking-widest">
              Pick Your Buddy (or say their name!)
            </p>
            <div className="relative">
              <BuddySelector
                selectedId={selectedBuddy.id}
                onSelect={(id) => setSelectedBuddy(BUDDIES.find(b => b.id === id)!)}
              />
              <button
                onClick={() => startListening("buddy")}
                className={`absolute -right-16 top-1/2 -translate-y-1/2 p-4 rounded-full transition-all shadow-xl border-4 border-white ${
                  listeningMode === "buddy"
                    ? "bg-red-500 text-white animate-pulse shadow-red-300"
                    : "bg-white text-primary hover:bg-slate-50"
                }`}
                title="Say a buddy's name!"
              >
                 {listeningMode === "buddy" ? <MicOff size={24} /> : <Mic size={24} />}
              </button>
            </div>

            <motion.button
              onClick={saveOnboarding}
              disabled={!kidName.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="mt-10 group relative inline-flex items-center justify-center px-12 py-6 font-black text-white bg-gradient-to-r from-primary to-orange-500 rounded-[2.5rem] hover:shadow-2xl disabled:opacity-40 shadow-xl border-4 border-white text-2xl transition-all"
            >
              Let's Go! <Sparkles size={28} className="ml-3" />
            </motion.button>
          </motion.div>
        )}

        {/* select state */}
        {gameState === "select" && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="flex flex-col items-center w-full max-w-5xl relative z-10"
          >
            <div className="w-full flex justify-between items-center mb-10 px-6">
              <Link href="/">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80"
                  suppressHydrationWarning
                >
                  <ArrowLeft size={24} className="text-slate-700" />
                </motion.button>
              </Link>
              <div className="flex items-center gap-4">
                {hasMounted && (
                  <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border-2 border-white/80 text-right min-w-[140px]" suppressHydrationWarning>
                    <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-2">Explorer Level {level}</p>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-orange-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpInfo.percent}%` }}
                      />
                    </div>
                    <p className="text-sm font-black text-slate-400 leading-none">{xpInfo.current}/{xpInfo.required} XP</p>
                  </div>
                )}
                {/* Switch User Button */}
                <button
                  onClick={logout}
                  className="px-4 py-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-red-50 hover:border-red-200 transition-all flex items-center gap-2 group"
                  title="Switch User"
                  suppressHydrationWarning
                >
                  <RefreshCw size={18} className="text-slate-400 group-hover:text-red-500 group-hover:rotate-180 transition-all duration-500" />
                  <span className="text-xs font-black text-slate-500 group-hover:text-red-500">Switch User</span>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mb-10">
                <div className="w-48 h-48 mb-2 flex items-center justify-center relative group">
                  <motion.button
                     whileHover={{ scale: 1.1 }}
                     whileTap={{ scale: 0.9 }}
                     onClick={toggleChat}
                     className="absolute -top-2 -right-2 z-20 bg-white text-primary p-3 rounded-full shadow-lg border-2 border-primary/20 hover:bg-primary hover:text-white transition-colors"
                     title="Talk to me!"
                  >
                    <MessageCircleMore size={24} />
                  </motion.button>
                  <div className="cursor-pointer" onClick={toggleChat}>
                    <BuddyMascot
                      isListening={false}
                      isSynthesizing={isSpeaking}
                      buddyType={selectedBuddy.id}
                      size={180}
                    />
                  </div>
                </div>
              <h2 className="text-5xl font-black text-slate-800 tracking-tight">
                Ready, {kidName}?
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {CHAPTERS.map(chapter => {
                const isLocked = chapter.comingSoon || chapter.missions.length === 0 || (chapter.unlockXp > xp && chapter.id !== "chapter-1");
                const isSelected = selectedChapterId === chapter.id;
                return (
                  <motion.button
                    key={chapter.id}
                    whileHover={!isLocked ? { scale: 1.05 } : {}}
                    whileTap={!isLocked ? { scale: 0.95 } : {}}
                    onClick={() => !isLocked && setSelectedChapterId(chapter.id)}
                    className={`px-6 py-4 rounded-3xl border-4 transition-all flex items-center gap-3 ${
                      isSelected 
                        ? "bg-white border-primary shadow-xl scale-105" 
                        : isLocked 
                          ? "bg-slate-100/50 border-transparent opacity-50 grayscale cursor-not-allowed"
                          : "bg-white/60 border-white/80 opacity-80"
                    }`}
                  >
                    <span className="text-2xl">{chapter.emoji}</span>
                    <div className="text-left">
                      <p className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? "text-primary" : "text-slate-400"}`}>
                        Level {chapter.level}
                      </p>
                      <p className="font-black text-slate-800 text-sm">
                        {chapter.title} {isLocked && "ðŸ”’"}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-xl text-slate-500 mb-8 font-bold text-center">
              Pick a mission from <span className="text-primary font-black uppercase tracking-widest">{activeChapter.title}</span> below!
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full px-6">
              {missionsForChapter.map((mission) => {
                const isCompleted = completedMissions.includes(mission.id);
                return (
                  <motion.button
                    key={mission.id}
                    whileHover={{ scale: 1.05, y: -5 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => startPractice(mission)}
                    onMouseEnter={() => {
                        const voice = getVoiceForBuddy(selectedBuddy.id);
                        // Force lowercase for better TTS matching if needed, though most APIs handle title case
                        playCachedTTS(mission.word, voice, voiceSpeed);
                    }}
                    className="relative bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border-4 border-white shadow-xl hover:shadow-2xl transition-all group"
                    suppressHydrationWarning
                  >
                    {isCompleted && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-full shadow-lg border-4 border-white z-10">
                        <Star size={16} fill="white" />
                      </div>
                    )}
                    <div className="text-7xl mb-1 group-hover:scale-110 transition-transform text-center drop-shadow-md">{mission.emoji}</div>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tight text-center">{mission.word}</h3>
                    <div className="flex items-center justify-center gap-2 bg-slate-50 px-3 py-1 rounded-full">
                      <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Magic Sound</span>
                      <span className="text-primary text-xl font-black leading-none">{mission.sound}</span>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="flex items-center gap-3 my-12 bg-white/70 backdrop-blur-md px-5 py-3 rounded-2xl border-2 border-white/80 shadow-sm">
              <Gauge size={18} className="text-primary" />
              <span className="text-sm font-bold text-slate-500">Voice Speed:</span>
              <input
                type="range"
                min="0.5"
                max="1.2"
                step="0.1"
                value={voiceSpeed}
                onChange={(e) => setVoiceSpeed(parseFloat(e.target.value))}
                className="w-24 accent-primary"
              />
              <span className="text-sm font-black text-primary w-10">
                {voiceSpeed <= 0.6 ? "Slow" : voiceSpeed <= 0.9 ? "Norm" : "Fast"}
              </span>
            </div>

            <div className="bg-primary/5 backdrop-blur-sm p-6 rounded-3xl border-2 border-primary/10 max-w-2xl text-left flex items-start gap-4 mb-4">
              <div className="bg-primary/10 p-3 rounded-2xl shrink-0">
                <Lightbulb size={24} className="text-primary" />
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-lg mb-1 italic">Buddy's Therapy Logic</h4>
                <p className="text-sm text-slate-500 leading-relaxed font-bold">
                  We use <span className="text-primary font-black uppercase">Response Recovery</span> - detecting near-misses (like hearing the sound but not the full word) to provide instant correction and keep your child engaged without frustration!
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* practice state */}
        {gameState === "practice" && activeMission && (
          <motion.div
            key="practice"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center w-full max-w-2xl text-center pt-2 relative z-10"
          >
            {/* Practice Header */}
            <div className="w-full flex justify-between items-center mb-6 px-4 absolute top-0 left-0 right-0 z-50">
               <motion.button
                 onClick={() => { stopAllAudio(); setGameState("select"); }}
                 whileHover={{ scale: 1.05 }}
                 whileTap={{ scale: 0.95 }}
                 className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-slate-100 transition-colors"
               >
                 <ArrowLeft size={20} className="text-slate-700" />
               </motion.button>
               
               <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border-2 border-white/80 flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                 <span className="text-xs font-black uppercase tracking-widest text-slate-500">Live Session</span>
               </div>

               <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-2xl shadow-lg border-2 border-white/80">
                 <span className="text-xs font-black text-primary">{xp} XP</span>
               </div>
            </div>


            {/* Active Practice Area */}
            <div className="relative mb-8 flex flex-col items-center justify-center mt-12 w-full">
               <BuddyMascot 
                isListening={isListening} 
                isSynthesizing={isSpeaking} 
                buddyType={selectedBuddy.id}
                size={300} 
                mood={mood}
              />
              
              <div className="absolute -bottom-4 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white shadow-sm flex items-center gap-1.5 pointer-events-none">
                <div className={`w-1.5 h-1.5 rounded-full ${isListening ? "bg-red-500 animate-pulse" : "bg-slate-300"}`} />
                {isListening ? "Listening..." : "Ready"}
              </div>
            </div>

            {/* Live Transcript Feedback & Prompt */}
            <div className="h-16 mb-2 flex items-center justify-center w-full pointer-events-none">
              <AnimatePresence mode="wait">
                {transcript ? (
                  <motion.span 
                    key="transcript"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-xl md:text-3xl font-black text-slate-800 bg-white/60 backdrop-blur px-6 py-2 rounded-2xl shadow-sm border-2 border-white"
                  >
                    "{transcript}"
                  </motion.span>
                ) : isListening ? (
                  <MicVisualizer stream={streamRef.current} />
                ) : !success ? (
                  <motion.div
                    key="prompt"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center"
                  >
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Time to say:</p>
                    <h3 className="text-3xl md:text-4xl font-black text-primary drop-shadow-sm tracking-tight">
                      "{activeMission.word}"
                    </h3>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            {/* Controls */}
            <div className="flex flex-col items-center gap-6 w-full max-w-sm mx-auto z-20 relative">
               {!success ? (
                 <>
                   {/* Mic Button & Actions */}
                   <div className="flex items-center gap-6 md:gap-8 justify-center w-full">
                     <motion.button
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={previewWord}
                       className="p-4 bg-white/60 backdrop-blur-md rounded-2xl border-2 border-white shadow-sm hover:bg-white hover:shadow-md transition-all group"
                       title="Hear Pronunciation"
                     >
                       <Volume2 size={24} className="text-slate-400 group-hover:text-primary transition-colors" />
                     </motion.button>

                     <div className="relative group flex flex-col items-center gap-3">
                       {isListening && (
                         <>
                           <motion.div 
                             animate={{ scale: [1, 1.5], opacity: [0.4, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
                             className="absolute top-0 left-0 right-0 h-24 bg-red-400 rounded-full z-0 pointer-events-none"
                           />
                           <motion.div 
                             animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity, delay: 0.2, ease: "easeOut" }}
                             className="absolute top-0 left-0 right-0 h-24 bg-red-400 rounded-full z-0 pointer-events-none"
                           />
                         </>
                       )}
                       
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={toggleListening}
                         className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all ${
                           isListening 
                             ? "bg-red-500 border-red-100 shadow-red-500/40 ring-4 ring-red-500/20" 
                             : "bg-white border-white shadow-slate-200 hover:border-primary/20 hover:shadow-primary/20"
                         }`}
                       >
                         {isListening ? (
                           <motion.div 
                             initial={{ scale: 0 }}
                             animate={{ scale: 1 }}
                             className="bg-white p-4 rounded-xl shadow-inner"
                           >
                              <div className="w-6 h-6 bg-red-500 rounded-sm" />
                           </motion.div>
                         ) : (
                           <Mic size={42} className="text-slate-700 ml-0.5" />
                         )}
                       </motion.button>
                       
                       <span className={`text-xs font-bold uppercase tracking-widest transition-colors ${isListening ? "text-red-500 animate-pulse" : "text-slate-400"}`}>
                         {isListening ? "Tap to Stop" : "Tap to Speak"}
                       </span>
                     </div>

                     <motion.button
                       whileHover={{ scale: 1.1 }}
                       whileTap={{ scale: 0.9 }}
                       onClick={() => setShowTip(!showTip)}
                       className={`p-4 backdrop-blur-md rounded-2xl border-2 border-white shadow-sm hover:shadow-md transition-all group ${
                         showTip ? "bg-amber-100 border-amber-200" : "bg-white/60 hover:bg-white"
                       }`}
                       title="Show Hint"
                     >
                       <Lightbulb size={24} className={`${showTip ? "text-amber-500" : "text-slate-400 group-hover:text-amber-400"} transition-colors`} />
                     </motion.button>
                   </div>
                 </>
               ) : (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.8, y: 20 }}
                   animate={{ opacity: 1, scale: 1, y: 0 }}
                   className="flex flex-col items-center gap-6 w-full"
                 >
                   <div className="flex flex-col items-center">
                    <motion.div
                      animate={{ 
                        scale: [1, 1.2, 1],
                        rotate: [0, 10, -10, 0]
                      }}
                      transition={{ duration: 0.5, repeat: 3 }}
                       className="text-8xl mb-4 filter drop-shadow-xl">🌟</motion.div>
                    <h3 className="text-5xl font-black text-slate-800 text-center tracking-tighter leading-none mb-2 uppercase">
                      WAY TO GO!
                    </h3>
                    <div className="flex gap-2 mb-2">
                       {[1, 2, 3].map(i => (
                         <motion.span 
                           key={i}
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ 
                             opacity: i <= stars ? 1 : 0.3, 
                             scale: i <= stars ? 1.2 : 1 
                           }}
                           transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                            className={`text-4xl ${i <= stars ? "filter drop-shadow-md" : "grayscale opacity-50"}`}
                         >
                           {i <= stars ? "⭐" : "☆"}
                         </motion.span>
                       ))}
                     </div>
                    <p className="text-slate-500 font-black text-xl uppercase tracking-widest">You nailed it!</p>
                  </div>
                   
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => {
                        stopAllAudio();
                        setGameState("select");
                        setSuccess(false);
                        setMood("happy");
                     }}
                     className="w-full max-w-xs py-5 bg-gradient-to-r from-primary to-purple-600 rounded-[2rem] font-black text-white shadow-xl shadow-primary/30 border-4 border-white flex items-center justify-center gap-3 hover:shadow-2xl transition-all cursor-pointer text-xl"
                   >
                     Next Mission <ArrowRight size={24} />
                   </motion.button>
                 </motion.div>
                )}
            </div>

            <AnimatePresence>
              {gameState === "practice" && showTip && !success && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mt-8 bg-amber-50/90 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-amber-100 text-center max-w-sm shadow-sm z-30 relative"
                >
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Lightbulb size={16} className="text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest text-amber-500">Pro Tip</span>
                  </div>
                  <p className="font-bold text-slate-600 text-sm">
                    "{activeMission.tip}"
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Try saying: "{activeMission.example}"</p>
                </motion.div>
              )}
            </AnimatePresence>

            {speechError && !isListening && !success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 bg-red-50 text-red-500 px-4 py-2 rounded-xl text-sm font-bold border border-red-100 flex items-center gap-2 z-30 relative"
              >
                {speechError}
              </motion.div>
            )}
            
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOffline && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 bg-black/80 backdrop-blur-xl text-white px-6 py-4 rounded-[2rem] shadow-2xl z-[100] flex items-center gap-4 border-2 border-white/20"
          >
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
            <span className="font-bold text-sm uppercase tracking-widest">WIFI LOST! Voices might sleep soon!</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-primary/20 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.8, rotate: -5 }}
              animate={{ scale: 1, rotate: 0 }}
              className="bg-white rounded-[3rem] p-8 max-w-sm w-full shadow-2xl border-8 border-white text-center relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-primary/10 to-transparent -z-10" />
              <div className="text-7xl mb-4">ðŸ†</div>
              <h2 className="text-4xl font-black text-slate-800 leading-none mb-2 tracking-tighter">LEVEL UP!</h2>
              <p className="text-xl font-bold text-primary mb-6">Welcome to Level {level}!</p>
              
              <div className="bg-slate-50 rounded-2xl p-4 mb-8">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Progress</p>
                <div className="text-2xl font-black text-slate-700">{xp} XP Earned!</div>
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowLevelUp(false)}
                className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-xl shadow-primary/30 border-4 border-white/20"
              >
                HECK YES!
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {speechError?.includes("blocked") && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-slate-900/80 backdrop-blur-xl flex items-center justify-center p-6"
          >
             <motion.div 
               initial={{ scale: 0.9, y: 20 }}
               animate={{ scale: 1, y: 0 }}
               className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl text-center border-8 border-white"
             >
                <div className="text-6xl mb-6">🔒</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Microphone Blocked</h2>
                <p className="text-slate-500 font-bold mb-6">To hear you, I need your permission. Click the <span className="text-primary">Microphone icon</span> in your browser's address bar to let me in! 🎤</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="w-full py-4 bg-primary text-white rounded-2xl font-black shadow-lg shadow-primary/30"
                >
                  GOT IT, RELOAD!
                </button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Modal */}
      <AnimatePresence>
        {isChatMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[400] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-white relative flex flex-col max-h-[80vh]"
            >
               {/* Header */}
               <div className="bg-gradient-to-r from-primary to-purple-600 p-4 flex justify-between items-center text-white shrink-0">
                 <h3 className="font-black text-xl flex items-center gap-2">
                   <MessageCircleMore /> Chat with {selectedBuddy.name}
                 </h3>
                 <button onClick={toggleChat} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                   <X size={24} />
                 </button>
               </div>

               {/* Chat History */}
               <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 min-h-[300px]">
                 {chatHistory.map((msg, i) => (
                   <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                     <div className={`max-w-[80%] p-3 rounded-2xl text-sm font-bold ${
                       msg.role === 'user' 
                         ? 'bg-primary text-white rounded-tr-none' 
                         : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-tl-none'
                     }`}>
                       {msg.text}
                     </div>
                   </div>
                 ))}
                 <div ref={(el) => { el?.scrollIntoView({ behavior: 'smooth' }) }} />
               </div>

               {/* Controls */}
               <div className="p-4 bg-white border-t border-slate-100 flex justify-center gap-4 shrink-0">
                  <button
                    onClick={() => startListening("chat")}
                    className={`p-6 rounded-full shadow-xl transition-all border-4 border-white ${
                      listeningMode === "chat"
                        ? "bg-red-500 text-white animate-pulse shadow-red-300 scale-110"
                        : "bg-gradient-to-br from-primary to-purple-600 text-white hover:scale-105"
                    }`}
                  >
                    {listeningMode === "chat" ? <MicOff size={32} /> : <Mic size={32} />}
                  </button>
               </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
