"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Volume2, ArrowLeft, Star, Sparkles, RefreshCw,
  Trophy, Heart, Award, Lightbulb, Play, Gauge, MicOff
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AudioVisualizer from "@/components/AudioVisualizer";
import BuddySelector, { BUDDIES } from "@/components/BuddySelector";
import BuddyMascot from "@/components/BuddyMascot";
import InteractiveBackground from "@/components/InteractiveBackground";
import GuidedTour, { PLAY_TOUR_STEPS } from "@/components/GuidedTour";
import { NotificationBell, useNotifications, triggerLevelUpNotification, triggerStreakNotification } from "@/components/NotificationBell";
import { CHAPTERS, getUnlockedChapters, getCurrentChapter } from "@/data/chapters";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Mission {
  id: string;
  word: string;
  sound: string;
  emoji: string;
  difficulty: "easy" | "medium" | "hard";
  tip: string;
  example: string;
}

const MISSIONS: Mission[] = [
  { id: "1", word: "Sun", sound: "S", emoji: "☀️", difficulty: "easy", tip: "Put your tongue behind your top teeth and blow air softly!", example: "Ssssun - like a snake hissing!" },
  { id: "2", word: "Cake", sound: "C", emoji: "🍰", difficulty: "easy", tip: "Touch the back of your tongue to the roof of your mouth!", example: "K-k-cake - like a clock ticking!" },
  { id: "3", word: "Lion", sound: "L", emoji: "🦁", difficulty: "medium", tip: "Press your tongue tip right behind your top front teeth!", example: "Lll-ion - let your tongue tap up!" },
  { id: "4", word: "Robot", sound: "R", emoji: "🤖", difficulty: "medium", tip: "Curl your tongue back slightly without touching anything!", example: "Rrr-obot - like a quiet growl!" },
  { id: "5", word: "Water", sound: "W", emoji: "💧", difficulty: "medium", tip: "Round your lips like you're about to blow a candle!", example: "Www-ater - round lips, then open!" },
  { id: "6", word: "Apple", sound: "P", emoji: "🍎", difficulty: "easy", tip: "Press your lips together, then pop them open!", example: "A-ppp-le - pop those lips!" },
  { id: "7", word: "Thunder", sound: "TH", emoji: "⚡", difficulty: "hard", tip: "Put your tongue between your teeth just a little bit!", example: "Th-th-thunder - tongue peeks out!" },
  { id: "8", word: "Fish", sound: "F", emoji: "🐟", difficulty: "easy", tip: "Gently bite your bottom lip and blow air!", example: "Fff-ish - lip under teeth, blow!" },
  { id: "9", word: "Zebra", sound: "Z", emoji: "🦓", difficulty: "medium", tip: "Make a bee sound! Zzzzz!", example: "Zzz-ebra - feel the buzz in your teeth!" },
  { id: "10", word: "Monkey", sound: "M", emoji: "🐒", difficulty: "easy", tip: "Keep your lips closed and hum!", example: "Mmm-onkey - like you're eating something yummy!" },
  { id: "11", word: "Goat", sound: "G", emoji: "🐐", difficulty: "easy", tip: "Make a sound in the back of your throat!", example: "G-g-goat - like gulping water!" },
  { id: "12", word: "Shark", sound: "SH", emoji: "🦈", difficulty: "medium", tip: "Round your lips and say 'shhh'!", example: "Shhh-ark - like telling someone to be quiet!" },
];

const DIFFICULTY_XP = { easy: 20, medium: 25, hard: 35 };

export default function PlayPage() {
  const [gameState, setGameState] = useState<"onboarding" | "select" | "practice">("onboarding");
  const [kidName, setKidName] = useState("");
  const [selectedBuddy, setSelectedBuddy] = useState(BUDDIES[0]);
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [success, setSuccess] = useState(false);
  const [streak, setStreak] = useState(0);
  const [showTip, setShowTip] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [voiceSpeed, setVoiceSpeed] = useState(0.9);
  const [completedMissions, setCompletedMissions] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [selectedChapterId, setSelectedChapterId] = useState(CHAPTERS[0].id);
  const [availableVoices, setAvailableVoices] = useState<{voiceId: string, displayName: string}[]>([]);
  const [conversationHistory, setConversationHistory] = useState<{sender: 'buddy'|'kid', text: string}[]>([]);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recognitionRef = useRef<any>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll, addNotification } = useNotifications();
  const unlockedChapters = getUnlockedChapters(xp);
  const activeChapter = CHAPTERS.find(c => c.id === selectedChapterId) || CHAPTERS[0];
  const missionsForChapter = MISSIONS.filter(m => activeChapter.missions.includes(m.id));

  // Determine active level progression
  const xpForNextLevel = level * 100;

  useEffect(() => {
    const savedName = localStorage.getItem("kidName");
    const savedBuddy = localStorage.getItem("selectedBuddy");
    const savedXp = localStorage.getItem("xp");
    const savedLevel = localStorage.getItem("level");
    const savedStreak = localStorage.getItem("streak");
    const savedCompleted = localStorage.getItem("completedMissions");

    if (savedName) {
      setKidName(savedName);
      if (savedBuddy) {
        const buddy = BUDDIES.find(b => b.id === savedBuddy);
        if (buddy) setSelectedBuddy(buddy);
      }
      if (savedXp) setXp(parseInt(savedXp));
      if (savedLevel) setLevel(parseInt(savedLevel));
      if (savedStreak) setStreak(parseInt(savedStreak));
      if (savedCompleted) setCompletedMissions(JSON.parse(savedCompleted));
      setGameState("select");
      
      // Add welcome notification if none exist
      if (localStorage.getItem("talkybuddy-notifications") === null) {
        addNotification({
          type: "reward",
          title: "Welcome to TalkyBuddy! 🎁",
          message: "We're so glad you're here! Start a mission to earn your first XP points!",
        });
      }
    }

    // Fetch available voices
    const fetchVoices = async () => {
      try {
        const res = await fetch(`${API_BASE}/voices?model=lightning-v3.1`);
        if (res.ok) {
          const data = await res.json();
          if (data.voices) {
            setAvailableVoices(data.voices);
            console.log("✅ Available voices:", data.voices);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch voices:", err);
      }
    };
    fetchVoices();
  }, [addNotification]);

  const saveOnboarding = () => {
    if (kidName.trim()) {
      localStorage.setItem("kidName", kidName.trim());
      localStorage.setItem("selectedBuddy", selectedBuddy.id);
      setGameState("select");
      toast.success(`Welcome ${kidName}! Let's start learning!`);
      // Welcome TTS
      playTTS(`Hi there ${kidName}! I'm so excited to play with you! Pick a mission to start!`);
    }
  };

  const logout = () => {
    localStorage.removeItem("kidName");
    localStorage.removeItem("selectedBuddy");
    localStorage.removeItem("xp");
    localStorage.removeItem("level");
    localStorage.removeItem("streak");
    localStorage.removeItem("completedMissions");
    localStorage.removeItem("talkybuddy-notifications");
    window.location.reload();
  };

  const startPractice = (mission: Mission) => {
    setActiveMission(mission);
    setGameState("practice");
    setTranscript("");
    setSuccess(false);
    setAttempts(0);
    setShowTip(false);
    speakFirstTime(mission);
  };

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

  // Browser SpeechSynthesis fallback
  const playTTSFallback = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        resolve();
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = voiceSpeed;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      // Try to find a good English voice
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
      if (preferred) utterance.voice = preferred;
      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    });
  };

  const getVoiceForBuddy = (buddyId: string) => {
    // If we have fetched voices, try to find a match by common names
    if (availableVoices.length > 0) {
      const findVoice = (nameParts: string[]) => {
        return availableVoices.find(v => 
          nameParts.some(part => v.voiceId.toLowerCase().includes(part) || v.displayName.toLowerCase().includes(part))
        )?.voiceId;
      };

      switch (buddyId) {
        case "cat": return findVoice(["emily", "sarah", "female"]) || availableVoices[0].voiceId;
        case "panda": return findVoice(["roma", "nyah", "female"]) || availableVoices[0].voiceId;
        case "wolf": return findVoice(["nyah", "emily", "female"]) || availableVoices[0].voiceId;
        case "robot": return findVoice(["james", "onyx", "male", "robot"]) || availableVoices[0].voiceId;
        case "puppy": return findVoice(["amx", "james", "male", "fun"]) || availableVoices[0].voiceId;
        default: return availableVoices[0].voiceId;
      }
    }

    // Fallback hardcoded mapping - using more common IDs for Smallest AI
    switch (buddyId) {
      case "cat": return "emily";   
      case "panda": return "sarah"; 
      case "wolf": return "nyah";  
      case "robot": return "onyx"; 
      case "puppy": return "amx";
      default: return "emily";
    }
  };

  const playTTS = async (text: string) => {
    setIsSynthesizing(true);
    try {
      const voiceId = getVoiceForBuddy(selectedBuddy.id);

      const res = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: voiceId, speed: voiceSpeed }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.warn("TTS API Error:", errorData);
        if (errorData.useFallback) {
          toast.error("AI Voice unavailable, using backup!");
          await playTTSFallback(text);
          setIsSynthesizing(false);
          return;
        }
        throw new Error(errorData.hint || "TTS connection failed");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setIsSynthesizing(false);
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = async () => {
        await playTTSFallback(text);
        setIsSynthesizing(false);
        URL.revokeObjectURL(audioUrl);
      };
      await audio.play();

    } catch (error: any) {
      console.warn("TTS failed, using fallback:", error.message);
      await playTTSFallback(text);
      setIsSynthesizing(false);
    }
  };

  const previewWord = () => {
    if (activeMission) {
      playTTS(`${activeMission.word}`);
    }
  };

  const startListening = () => {
    // Check browser support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser doesn't support voice! Try Chrome.");
      return;
    }

    setTranscript("");
    setSpeechError(null);
    setIsListening(true); // Optimistic update

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results);
      const text = results
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join("");
      
      setTranscript(text);
      
      // Only check result if it's final
      if ((results[0] as any).isFinal) {
        checkResult(text);
      }
    };

    recognition.onerror = (event: any) => {
      // Ignore 'aborted' completely as it's part of manual stop
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }

      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        const messages = [
          "Oops! I didn't hear anything. Speak louder? 🎤",
          "My ears are wiggling but I didn't catch that! 👂",
          "Can you say that again? I'm listening! ✨",
          "Don't be shy! Give it another try! 🌈"
        ];
        setSpeechError(messages[Math.floor(Math.random() * messages.length)]);
      } else if (event.error === 'not-allowed') {
        setSpeechError("I need your permission to hear you! 🔓");
        toast.error("Please allow microphone access in your browser settings.");
      } else if (event.error === 'network') {
        setSpeechError("My internet feels a bit sleepy. Try again? ☁️");
      } else {
        setSpeechError("Oops! My robot brain got a bit confused.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    try {
      recognition.start();

      // Start recording actual audio
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(audioUrl);
          
          // Here you would upload audioBlob to server if storing
        };

        mediaRecorder.start();
      });

    } catch (err) {
      console.error("Speech start error", err);
      setIsListening(false);
    }
  };

  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.abort();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
      setIsListening(false);
    } else {
      startListening();
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);


  const checkResult = async (text: string) => {
    if (!activeMission) return;

    const lowerText = text.toLowerCase();
    const targetWord = activeMission.word.toLowerCase();
    const targetSound = activeMission.sound.toLowerCase();
    
    // Improved matching logic (fuzzy match for similar sounds)
    const isCorrect = lowerText.includes(targetWord) || 
                     (targetWord === "cake" && (lowerText.includes("kake") || lowerText.includes("take")));
    
    const containsSound = lowerText.includes(targetSound) || 
                         (targetSound === "c" && lowerText.includes("k")) ||
                         (targetSound === "s" && lowerText.includes("ss"));
    
    const isNearMiss = !isCorrect && containsSound;
    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    const bonusXp = DIFFICULTY_XP[activeMission.difficulty];

    try {
      await fetch(`${API_BASE}/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kidName,
          buddy: selectedBuddy.id,
          sound: activeMission.sound,
          word: activeMission.word,
          attempts: newAttempts,
          success: isCorrect,
          transcript: text,
          isNearMiss,
          xpEarned: isCorrect ? bonusXp : 0,
        }),
      });
    } catch {
      // Silent fail
    }

    // Adaptive Coaching Logic
    let feedback = "";
    if (isCorrect) {
      setSuccess(true);
      feedback = `YES! That was perfect! You nailed the "${activeMission.sound}" in ${activeMission.word}!`;
      // ... (streak/xp code remains same, triggered by effect or inline)
      
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });

      // Update XP/Streak/Level... (Previous logic)
      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("streak", newStreak.toString());
      
      const newXp = xp + bonusXp;
      setXp(newXp);
      localStorage.setItem("xp", newXp.toString());
      
      if (newXp >= level * 100) {
        setLevel(l => l + 1);
        triggerLevelUpNotification(level + 1, addNotification);
      }
      
      const newCompleted = [...new Set([...completedMissions, activeMission.id])];
      setCompletedMissions(newCompleted);
      localStorage.setItem("completedMissions", JSON.stringify(newCompleted));

    } else if (isNearMiss) {
       feedback = `So close! I heard the "${activeMission.sound}" sound, but let's try to say the whole word "${activeMission.word}" clearly.`;
       if (newAttempts >= 2) setShowTip(true);
    } else {
       // Adaptive speed for failure
       if (newAttempts >= 2 && voiceSpeed > 0.7) setVoiceSpeed(0.7);
       
       if (newAttempts === 1) {
         feedback = `Nice try! Remember, for ${activeMission.word}, ${activeMission.tip}`;
       } else if (newAttempts === 2) {
         feedback = `Let's slow down. Listen to me: ${activeMission.sound}... ${activeMission.word}. Now you try!`;
       } else {
         feedback = `Don't give up! Look at my mouth. ${activeMission.example}. Try one more time!`;
       }
       if (newAttempts >= 2) setShowTip(true);
       setStreak(0);
    }

    // Add to conversation history
    setConversationHistory(prev => [
      ...prev, 
      { sender: 'kid', text: text },
      { sender: 'buddy', text: feedback }
    ]);

    await playTTS(feedback);
  };

  const currentLevelXp = xp % xpForNextLevel;
  const xpPercent = (currentLevelXp / xpForNextLevel) * 100;

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col items-center relative overflow-hidden">
      <InteractiveBackground />

      <GuidedTour 
        steps={PLAY_TOUR_STEPS} 
        onComplete={() => console.log("Play tour complete")} 
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

            <input
              type="text"
              placeholder="Type your name..."
              value={kidName}
              onChange={(e) => setKidName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && kidName.trim() && saveOnboarding()}
              className="w-full p-6 text-3xl font-black rounded-[2.5rem] border-4 border-white focus:border-primary outline-none mb-8 text-center shadow-xl bg-white/80 backdrop-blur-sm focus:bg-white transition-all placeholder:text-slate-300"
              autoFocus
              suppressHydrationWarning
            />

            <p className="text-sm text-slate-400 mb-4 font-black uppercase tracking-widest">Pick Your Buddy</p>
            <BuddySelector
              selectedId={selectedBuddy.id}
              onSelect={(id) => setSelectedBuddy(BUDDIES.find(b => b.id === id)!)}
            />

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
                >
                  <ArrowLeft size={24} className="text-slate-700" />
                </motion.button>
              </Link>
              <div className="flex items-center gap-4">
                <div className="bg-white/80 backdrop-blur-md px-6 py-3 rounded-2xl shadow-lg border-2 border-white/80 text-right min-w-[140px]">
                  <p className="text-[10px] font-black uppercase text-primary tracking-widest leading-none mb-2">Level {level}</p>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-1">
                    <motion.div 
                      className="h-full bg-gradient-to-r from-primary to-orange-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${xp % 100}%` }}
                    />
                  </div>
                  <p className="text-sm font-black text-slate-400 leading-none">{xp % 100}/100 XP</p>
                </div>
                <button 
                  onClick={logout}
                  className="p-4 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  title="Switch User"
                >
                  <RefreshCw size={24} className="text-slate-700 group-hover:rotate-180 transition-transform duration-500" />
                </button>
                <NotificationBell 
                  notifications={notifications}
                  unreadCount={unreadCount}
                  onMarkAsRead={markAsRead}
                  onMarkAllAsRead={markAllAsRead}
                  onClearAll={clearAll}
                />
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 mb-10">
              <div className="w-48 h-48 mb-2 flex items-center justify-center">
                <BuddyMascot 
                  isListening={false} 
                  isSynthesizing={false} 
                  buddyType={selectedBuddy.id} 
                  size={180}
                />
              </div>
              <h2 className="text-5xl font-black text-slate-800 tracking-tight">
                Ready, {kidName}?
              </h2>
            </div>

            <div className="flex flex-wrap justify-center gap-3 mb-10">
              {CHAPTERS.map(chapter => {
                const isLocked = chapter.unlockXp > xp && chapter.id !== "chapter-1";
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
                        {chapter.title} {isLocked && "🔒"}
                      </p>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <p className="text-xl text-slate-500 mb-8 font-bold text-center">
              Pick a mission from <span className="text-primary font-black uppercase tracking-widest">{activeChapter.title}</span>!
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
                    className="relative bg-white/80 backdrop-blur-xl p-8 rounded-[3rem] border-4 border-white shadow-xl hover:shadow-2xl transition-all group"
                  >
                    {isCompleted && (
                      <div className="absolute -top-3 -right-3 bg-green-500 text-white p-2 rounded-full shadow-lg border-4 border-white z-10">
                        <Star size={16} fill="white" />
                      </div>
                    )}
                    <div className="text-7xl mb-4 group-hover:scale-110 transition-transform text-center">{mission.emoji}</div>
                    <h3 className="text-2xl font-black text-slate-800 mb-1 text-center">{mission.word}</h3>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-[10px] font-black uppercase tracking-widest text-primary">Sound</span>
                      <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-sm font-black">{mission.sound}</span>
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
            <div className="mb-6 relative w-72 h-72 md:w-96 md:h-96 flex items-center justify-center">
              <BuddyMascot 
                isListening={isListening} 
                isSynthesizing={isSynthesizing} 
                buddyType={selectedBuddy.id}
                size={300} 
              />
              
              <div className="absolute -bottom-4 right-0 bg-white/90 backdrop-blur px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white shadow-sm flex items-center gap-1.5 pointer-events-none">
                <Sparkles size={10} className="text-primary" />
                Powered by Smallest AI
              </div>

              {/* Speech Bubble & Feedback */}
              <AnimatePresence>
                {isSynthesizing && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-16 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-2xl shadow-xl border-2 border-primary/20 min-w-[200px] z-50 after:content-[''] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-8 after:border-transparent after:border-t-white"
                  >
                    <div className="flex items-center justify-center gap-3">
                      <div className="flex gap-1">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            className="w-1.5 h-1.5 bg-primary rounded-full"
                            animate={{ scale: [1, 1.5, 1] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                          />
                        ))}
                      </div>
                      <p className="text-sm font-black text-slate-700 uppercase tracking-wider">Buddy is talking...</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="bg-white/70 backdrop-blur-xl px-10 py-6 rounded-[3rem] border-4 border-white shadow-xl mb-4">
              <div className="flex items-center justify-center gap-3 mb-1">
                <h2 className="text-6xl md:text-7xl font-black text-slate-800 tracking-tighter uppercase">{activeMission.word}</h2>
                <motion.button
                  onClick={previewWord}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  disabled={isSynthesizing}
                  className="p-2.5 bg-primary/10 rounded-full hover:bg-primary/20 transition-colors disabled:opacity-40"
                >
                  <Play size={20} className="text-primary fill-primary" />
                </motion.button>
              </div>
              <div className="font-black text-primary text-xl uppercase tracking-widest flex items-center justify-center gap-3">
                <div className="w-8 h-0.5 bg-primary/20 rounded-full" />
                Say "{activeMission.sound}"
                <div className="w-8 h-0.5 bg-primary/20 rounded-full" />
              </div>
            </div>

            <AnimatePresence>
              {(showTip || attempts === 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  data-tour="tip-card"
                  className="mb-4 w-full max-w-md"
                >
                  <div className="bg-amber-50/80 backdrop-blur-md px-6 py-4 rounded-2xl border-2 border-amber-200/60 shadow-sm">
                    <div className="flex items-start gap-3">
                      <Lightbulb size={20} className="text-amber-500 mt-0.5 shrink-0" />
                      <div className="text-left text-amber-700">
                        <p className="text-sm font-bold">{activeMission.tip}</p>
                        <p className="text-xs mt-1 italic opacity-80">{activeMission.example}</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mode Toggle */}
            <div className="flex justify-center gap-4 mb-8 relative z-20">
              <button 
                onClick={() => setGameState("practice")} 
                className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                  gameState === "practice" ? "bg-primary text-white shadow-lg" : "bg-white/50 text-slate-400"
                }`}
              >
                Standard
              </button>
              <button 
                className={`px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
                   "bg-white/50 text-slate-400 cursor-not-allowed opacity-50"
                }`}
                title="Coming Soon!"
              >
                Conversation (Pro)
              </button>
            </div>

            {/* Mic Controls */}
            <div className="flex flex-col items-center gap-4 mt-2 relative z-20">
              <div className="relative">
                <AnimatePresence>
                  {isListening && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1.5, opacity: 0.5 }}
                      exit={{ scale: 0.8, opacity: 0 }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="absolute inset-0 bg-primary rounded-full blur-xl"
                    />
                  )}
                </AnimatePresence>
                
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleListening}
                  disabled={isSynthesizing}
                  className={`w-28 h-28 rounded-full flex items-center justify-center shadow-2xl transition-all border-[6px] relative z-10 ${
                    isListening
                      ? "bg-red-500 border-red-200 text-white"
                      : "bg-gradient-to-br from-primary to-orange-500 border-white text-white hover:shadow-orange-500/50"
                  } ${isSynthesizing ? "opacity-50 cursor-not-allowed grayscale" : ""}`}
                >
                  {isListening ? <MicOff size={40} /> : <Mic size={40} fill="currentColor" />}
                </motion.button>
              </div>

              <div className="h-8">
                <AnimatePresence mode="wait">
                  {speechError ? (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="text-red-500 font-black bg-red-100 px-4 py-2 rounded-full text-sm flex items-center gap-2"
                    >
                      <Lightbulb size={14} />
                      {speechError}
                    </motion.div>
                  ) : isListening ? (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-lg font-black text-slate-400 animate-pulse"
                    >
                      Listening...
                    </motion.p>
                  ) : (
                    <p className="text-slate-400 font-bold">Tap to speak</p>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {isListening && <AudioVisualizer isListening={isListening} />}

            <div className="h-20 flex items-center justify-center w-full mt-2">
              <AnimatePresence mode="wait">
                {transcript && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xl font-black bg-white/90 backdrop-blur-xl px-8 py-5 rounded-[2.5rem] shadow-xl border-4 border-white flex items-center gap-3"
                  >
                    <span className="text-slate-400 text-sm uppercase tracking-widest">I heard:</span>
                    <span className="text-primary italic text-2xl">"{transcript}"</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Conversation History */}
            {conversationHistory.length > 0 && (
              <div className="mt-8 w-full max-w-lg bg-white/50 backdrop-blur-md rounded-3xl p-6 border-2 border-white/50">
                 <h4 className="text-xs font-black uppercase text-slate-400 mb-4 tracking-widest">Conversation</h4>
                 <div className="flex flex-col gap-3 max-h-40 overflow-y-auto pr-2">
                   {conversationHistory.map((msg, i) => (
                     <div key={i} className={`flex gap-3 ${msg.sender === 'buddy' ? 'flex-row' : 'flex-row-reverse'}`}>
                       <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                         msg.sender === 'buddy' ? 'bg-primary text-white' : 'bg-slate-200 text-slate-600'
                       }`}>
                         {msg.sender === 'buddy' ? 'B' : 'K'}
                       </div>
                       <div className={`px-4 py-2 rounded-2xl text-sm font-bold max-w-[80%] ${
                         msg.sender === 'buddy' ? 'bg-white text-slate-700 shadow-sm' : 'bg-primary/10 text-primary'
                       }`}>
                         {msg.text}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
            
            {/* Audio Playback */}
            {recordedAudioUrl && !isListening && (
              <div className="mt-4 flex items-center gap-3 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
                <span className="text-xs font-bold text-slate-400 uppercase">Your Recording</span>
                <audio src={recordedAudioUrl} controls className="h-8 w-48" />
              </div>
            )}

            <AnimatePresence>
              {success && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-md p-6"
                >
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0 }}
                    className="bg-white rounded-[4rem] p-12 flex flex-col items-center gap-6 shadow-2xl border-[8px] border-white max-w-lg w-full"
                  >
                    <Trophy className="text-yellow-500" size={100} />
                    <div className="text-center">
                      <h3 className="text-5xl font-black text-slate-800 mb-1">PERFECT!</h3>
                      <p className="text-xl font-bold text-slate-400">You're amazing, {kidName}!</p>
                    </div>
                    <div className="flex gap-4 w-full">
                      <div className="flex-1 bg-orange-50 p-5 rounded-[2rem] text-center border-2 border-white shadow-sm">
                        <div className="text-primary font-black text-3xl">+{DIFFICULTY_XP[activeMission.difficulty]}</div>
                        <div className="text-xs font-bold uppercase text-primary/60 tracking-wider">XP</div>
                      </div>
                      <div className="flex-1 bg-green-50 p-5 rounded-[2rem] text-center border-2 border-white shadow-sm">
                        <div className="text-green-600 font-black text-3xl">100%</div>
                        <div className="text-xs font-bold uppercase text-green-600/60 tracking-wider">Sound</div>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => { setGameState("select"); setSuccess(false); }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full py-6 bg-gradient-to-r from-primary to-orange-500 rounded-[2.5rem] text-white font-black text-2xl shadow-xl border-4 border-white"
                    >
                      Next Mission!
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
