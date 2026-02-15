"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Mic, Volume2, ArrowLeft, Star, Sparkles, RefreshCw,
  Trophy, Heart, Award, Lightbulb, Play, Gauge, MicOff, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import AudioVisualizer from "@/components/AudioVisualizer";
import BuddySelector, { BUDDIES } from "@/components/BuddySelector";
import BuddyMascot from "@/components/BuddyMascot";
import InteractiveBackground from "@/components/InteractiveBackground";
import GuidedTour, { PLAY_TOUR_STEPS } from "@/components/GuidedTour";
import { NotificationBell, useNotifications, triggerLevelUpNotification, triggerStreakNotification } from "@/components/NotificationBell";
import { preloadTTS, playCachedTTS } from "@/lib/audio";
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
  // Chapter 1: Sound Explorer (Easy basics)
  { id: "1", word: "Sun", sound: "S", emoji: "☀️", difficulty: "easy", tip: "Put your tongue behind your top teeth and blow air softly!", example: "Ssssun - like a snake hissing!" },
  { id: "2", word: "Cake", sound: "C", emoji: "🍰", difficulty: "easy", tip: "Touch the back of your tongue to the roof of your mouth!", example: "K-k-cake - like a clock ticking!" },
  { id: "6", word: "Apple", sound: "P", emoji: "🍎", difficulty: "easy", tip: "Press your lips together, then pop them open!", example: "A-ppp-le - pop those lips!" },
  { id: "8", word: "Fish", sound: "F", emoji: "🐟", difficulty: "easy", tip: "Gently bite your bottom lip and blow air!", example: "Fff-ish - lip under teeth, blow!" },
  // Chapter 2: Brave Voyager (Medium sounds)
  { id: "3", word: "Lion", sound: "L", emoji: "🦁", difficulty: "medium", tip: "Press your tongue tip right behind your top front teeth!", example: "Lll-ion - let your tongue tap up!" },
  { id: "4", word: "Robot", sound: "R", emoji: "🤖", difficulty: "medium", tip: "Curl your tongue back slightly without touching anything!", example: "Rrr-obot - like a quiet growl!" },
  { id: "5", word: "Water", sound: "W", emoji: "💧", difficulty: "medium", tip: "Round your lips like you're about to blow a candle!", example: "Www-ater - round lips, then open!" },
  // Chapter 3: Sound Master (Hard sounds)
  { id: "7", word: "Thunder", sound: "TH", emoji: "⚡", difficulty: "hard", tip: "Put your tongue between your teeth just a little bit!", example: "Th-th-thunder - tongue peeks out!" },
  { id: "9", word: "Zebra", sound: "Z", emoji: "🦓", difficulty: "medium", tip: "Make a bee sound! Zzzzz!", example: "Zzz-ebra - feel the buzz in your teeth!" },
  { id: "12", word: "Shark", sound: "SH", emoji: "🦈", difficulty: "medium", tip: "Round your lips and say 'shhh'!", example: "Shhh-ark - like telling someone to be quiet!" },
  // Chapter 4: Combo Champion (Blends & combos)
  { id: "13", word: "Star", sound: "ST", emoji: "⭐", difficulty: "medium", tip: "Start with S then quickly add T - Sss-tar!", example: "St-st-star - snake hiss then tongue tap!" },
  { id: "14", word: "Frog", sound: "FR", emoji: "🐸", difficulty: "medium", tip: "Bite your lip for F then growl the R!", example: "Fff-rrr-og - lip bite then growl!" },
  { id: "15", word: "Snail", sound: "SN", emoji: "🐌", difficulty: "medium", tip: "Hiss the S then hum the N through your nose!", example: "Sss-nnn-ail - hiss then hum!" },
  { id: "16", word: "Clap", sound: "CL", emoji: "👏", difficulty: "hard", tip: "Quick K sound then tongue up for L!", example: "Cl-cl-clap - back tongue then front!" },
  // Chapter 5: Word Wizard (Multi-syllable)
  { id: "17", word: "Butterfly", sound: "B", emoji: "🦋", difficulty: "medium", tip: "Pop your lips for B, then let the word flow!", example: "But-ter-fly - three beats!" },
  { id: "18", word: "Dinosaur", sound: "D", emoji: "🦕", difficulty: "medium", tip: "Tap your tongue behind your top teeth for D!", example: "Di-no-saur - tongue tap then roar!" },
  { id: "19", word: "Elephant", sound: "L", emoji: "🐘", difficulty: "hard", tip: "E-le-phant has three parts - focus on the L in the middle!", example: "El-e-phant - tongue up for that L!" },
  { id: "20", word: "Helicopter", sound: "H", emoji: "🚁", difficulty: "hard", tip: "Breathe out softly for H, then say each part!", example: "Hel-i-cop-ter - four beats, blow air first!" },
  // Chapter 6: Sentence Sage (Short phrases)
  { id: "10", word: "Monkey", sound: "M", emoji: "🐒", difficulty: "easy", tip: "Keep your lips closed and hum!", example: "Mmm-onkey - like you're eating something yummy!" },
  { id: "11", word: "Goat", sound: "G", emoji: "🐐", difficulty: "easy", tip: "Make a sound in the back of your throat!", example: "G-g-goat - like gulping water!" },
  { id: "21", word: "Thank you", sound: "TH", emoji: "🙏", difficulty: "hard", tip: "Tongue between teeth for TH, then 'ank you'!", example: "Th-ank you - tongue peeks out then smile!" },
  { id: "22", word: "Please help", sound: "PL", emoji: "🆘", difficulty: "hard", tip: "Pop your P then quickly lift tongue for L!", example: "Pl-ease help - pop then lift!" },
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
          title: "Welcome to Fable! 🎁",
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
          
          toast.dismiss();
          toast.success(`Welcome back, ${name}! Level ${serverLevel} restored! 🌟`);
          playTTS(`Welcome back, ${name}! I remember you! You are level ${serverLevel}!`);
        } else {
          toast.dismiss();
          toast.success(`Welcome ${name}! Let's start learning!`);
          playTTS(`Hi there ${name}! I'm so excited to play with you! Pick a mission to start!`);
        }
      } catch (e) {
        toast.dismiss();
        toast.success(`Welcome ${name}!`);
        playTTS(`Hi there ${name}! Ready to play?`);
      }

      setGameState("select");
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

  const [mood, setMood] = useState<"happy" | "sad" | "surprised">("happy");

  // ... (previous effects)

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

  const playTTSFallback = (text: string): Promise<void> => {
    return new Promise((resolve) => {
      if (!('speechSynthesis' in window)) {
        console.error("No SpeechSynthesis supported");
        resolve();
        return;
      }
      
      // Cancel any ongoing speech
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = Math.max(0.8, Math.min(1.2, voiceSpeed)); // Clamp speed
      utterance.pitch = 1.1; 
      utterance.volume = 1;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en'))
        || voices.find(v => v.lang.startsWith('en-US'))
        || voices.find(v => v.lang.startsWith('en'));
      
      if (preferred) utterance.voice = preferred;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        resolve();
      };
      utterance.onerror = (e) => {
        console.error("SpeechSynthesis Error:", e);
        setIsSpeaking(false); 
        resolve();
      };
      
      window.speechSynthesis.speak(utterance);
    });
  };

  const getVoiceForBuddy = (buddyId: string) => {
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
    switch (buddyId) {
      case "cat": return "emily";   
      case "panda": return "sarah"; 
      case "wolf": return "nyah";  
      case "robot": return "onyx"; 
      case "puppy": return "amx";
      default: return "emily";
    }
  };

  const [isSpeaking, setIsSpeaking] = useState(false);

  const playTTS = async (text: string) => {
    setIsSynthesizing(true); // System is busy
    try {
      const voiceId = getVoiceForBuddy(selectedBuddy.id);
      const res = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: voiceId, speed: voiceSpeed }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        if (errorData.useFallback) {
          toast.error("AI Voice unavailable, using backup!");
          await playTTSFallback(text);
          setIsSynthesizing(false);
          setIsSpeaking(false);
          return;
        }
        throw new Error(errorData.hint || "TTS connection failed");
      }

      const audioBlob = await res.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      
      // Sync animation with audio
      audio.onplay = () => setIsSpeaking(true);
      audio.onended = () => {
        setIsSpeaking(false);
        setIsSynthesizing(false); // System free
        URL.revokeObjectURL(audioUrl);
      };
      audio.onerror = async () => {
        setIsSpeaking(false);
        await playTTSFallback(text);
        setIsSynthesizing(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
    } catch (error: any) {
      console.warn("TTS failed, using fallback:", error.message);
      await playTTSFallback(text);
      setIsSynthesizing(false);
      setIsSpeaking(false);
    }
  };

  const previewWord = () => {
    if (activeMission) playTTS(`${activeMission.word}`);
  };

  const startListening = () => {
    // Check browser support
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Your browser doesn't support voice! Try Chrome.");
      return;
    }

    if (isListening) {
      // Toggle OFF logic for push-to-talk
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    setTranscript("");
    setSpeechError(null);
    setIsListening(true); // Optimistic update
    
    // Play subtle "listening" sound (Synthesized Pop)
    const playPop = () => {
      try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
        osc.start();
        osc.stop(ctx.currentTime + 0.1);
      } catch (e) { /* ignore audio errors */ }
    };
    playPop();

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.maxAlternatives = 3;

    recognition.onstart = () => {
       setIsListening(true);
       setSpeechError(null);
    };

    recognition.onresult = (event: any) => {
      const results = Array.from(event.results);
      const transcriptItem = results[0] as any;
      const text = transcriptItem[0].transcript;
      
      setTranscript(text);
      
      // Check if final
      if (transcriptItem.isFinal) {
        setIsListening(false);
        checkResult(text);
      }
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'aborted') {
        setIsListening(false);
        return;
      }
      console.error("Speech Recognition Error:", event.error);
      setIsListening(false);
      
      if (event.error === 'no-speech') {
        setSpeechError("🎤 I didn't hear anything. Try moving closer?");
        toast("Microphone seems quiet. Try speaking louder! 📢");
      } else if (event.error === 'not-allowed') {
        setSpeechError("🔒 Please allow microphone access.");
        toast.error("Please allow microphone access in your browser settings. 🔒");
      } else if (event.error === 'network') {
        setSpeechError("⚠️ Network error. Check your connection.");
      } else {
        setSpeechError("⚠️ Oops, something went wrong. Tap to try again.");
      }
    };

    recognition.onend = () => {
      // If we stopped listening but didn't get a result and no error, maybe it just timed out?
      setIsListening(false);
      recognitionRef.current = null;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.stop();
      }
    };

    try {
      recognition.start();
      navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
          const audioUrl = URL.createObjectURL(audioBlob);
          setRecordedAudioUrl(audioUrl);
          stream.getTracks().forEach(track => track.stop());
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
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") mediaRecorderRef.current.stop();
      setIsListening(false);
    } else {
      startListening();
    }
  };

  const checkResult = async (text: string) => {
    if (!activeMission) return;

    const normalizedText = text.toLowerCase().replace(/[.,!?;:]/g, "").trim();
    const targetWord = activeMission.word.toLowerCase().trim();
    const targetSound = activeMission.sound.toLowerCase().trim();
    
    console.log(`🎙️ Hearing: "${normalizedText}" | Target: "${targetWord}"`);

    // Flexible matching using regex for whole word or significant partials
    const targetRegex = new RegExp(`\\b${targetWord}\\b`, 'i');
    
    const isCorrect = targetRegex.test(normalizedText) || 
                     normalizedText === targetWord ||
                     (targetWord === "sun" && normalizedText.includes("son")) || // Common homophones
                     (targetWord === "hair" && normalizedText.includes("hare"));

    // Check for target sound if word missed
    const containsSound = normalizedText.includes(targetSound);
    
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
      setMood("happy"); // Happy buddy!
      feedback = `Woohoo! You nailed it! The word was ${activeMission.word}! You are a rockstar!`;
      
      const confetti = (await import("canvas-confetti")).default;
      confetti({ particleCount: 200, spread: 100, origin: { y: 0.6 } });

      const newStreak = streak + 1;
      setStreak(newStreak);
      localStorage.setItem("streak", newStreak.toString());
      
      const newXp = xp + bonusXp;
      setXp(newXp);
      localStorage.setItem("xp", newXp.toString());
      
      if (newXp >= level * 100) {
        setLevel(l => l + 1);
        triggerLevelUpNotification(level + 1, addNotification);
      } else if (newStreak % 3 === 0) {
        triggerStreakNotification(newStreak, addNotification);
      }
      
      const newCompleted = [...new Set([...completedMissions, activeMission.id])];
      setCompletedMissions(newCompleted);
      localStorage.setItem("completedMissions", JSON.stringify(newCompleted));

    } else if (isNearMiss) {
       setMood("surprised"); // Encouraging/Curious look
       feedback = `So close! I heard the "${activeMission.sound}" sound, but let's try to say the whole word "${activeMission.word}" clearly.`;
       if (newAttempts >= 2) setShowTip(true);
    } else {
       // Wrong Answer Handling
       setMood("sad"); // Sad buddy :(
       
       // Deduct XP (Penalty)
       if (xp > 5) {
         setXp(prev => Math.max(0, prev - 5)); // Lose 5 XP
         toast.error("Oops! -5 XP. Try again!", { duration: 2000 });
       }

       // Reset Streak
       if (streak > 0) {
         setStreak(0);
         localStorage.setItem("streak", "0");
         toast("Streak lost! 😢", { icon: "💔" });
       }

       // Adaptive speed for failure
       if (newAttempts >= 2 && voiceSpeed > 0.7) setVoiceSpeed(0.7);
       
       const sadNoises = ["Oh no!", "Oopsie!", "Uh oh!"];
       const sadPrefix = sadNoises[Math.floor(Math.random() * sadNoises.length)];

       if (newAttempts === 1) {
         feedback = `${sadPrefix} Not quite. Remember, for ${activeMission.word}, ${activeMission.tip}`;
       } else if (newAttempts === 2) {
         feedback = `${sadPrefix} Let's slow down. Listen to me: ${activeMission.sound}... ${activeMission.word}. Now you try!`;
       } else {
         feedback = `Don't give up! Look at my mouth. ${activeMission.example}. Try one more time!`;
       }
       if (newAttempts >= 2) setShowTip(true);
    }

    // Add to conversation history
    setConversationHistory(prev => [
      ...prev, 
      { sender: 'kid', text: text },
      { sender: 'buddy', text: feedback }
    ]);

    await playTTS(feedback);
    
    // Reset mood after speech if it was sad
    if (!isCorrect && !isNearMiss) {
      setTimeout(() => setMood("happy"), 4000); 
    }
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
              placeholder="Type your name to start or continue..."
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
                
                {/* Reset Progress Button */}
                <button
                  onClick={() => {
                    if (window.confirm("Are you sure you want to delete all progress for this name? This cannot be undone!")) {
                       localStorage.clear();
                       // Also potentially wipe server data via API? For now, focused on client reset + clean slate visual.
                       // Just refreshing allows restart.
                       // Ideally, we'd delete server sessions, but simple 'logout' is safer for hackathon unless requested.
                       // Wait, user asked for 'create user with same name' handling.
                       // So maybe just logging out is enough, but to truly 'reset', we should clear local state.
                       setXp(0);
                       setLevel(1);
                       setStreak(0);
                       setCompletedMissions([]);
                       localStorage.removeItem("xp");
                       localStorage.removeItem("level");
                       localStorage.removeItem("streak");
                       localStorage.removeItem("completedMissions");
                       toast.success("Progress reset! Starting fresh.");
                    }
                  }}
                  className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-red-50 hover:border-red-200 transition-colors group"
                  title="Reset Progress"
                >
                  <RefreshCw size={20} className="text-slate-400 group-hover:text-red-500 transition-colors" />
                </button>
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
                    onMouseEnter={() => playCachedTTS(mission.word, getVoiceForBuddy(selectedBuddy.id))}
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
            {/* Practice Header */}
            <div className="w-full flex justify-between items-center mb-6 px-4 absolute top-0 left-0 right-0 z-50">
               <motion.button 
                 onClick={() => setGameState("select")}
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
                  <motion.span
                    key="listening"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2"
                  >
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    Listening...
                  </motion.span>
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

                     <div className="relative group">
                       {isListening && (
                         <>
                           <motion.div 
                             animate={{ scale: [1, 1.4], opacity: [0.5, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity }}
                             className="absolute inset-0 bg-red-400 rounded-full z-0"
                           />
                           <motion.div 
                             animate={{ scale: [1, 1.2], opacity: [0.6, 0] }}
                             transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                             className="absolute inset-0 bg-red-400 rounded-full z-0"
                           />
                         </>
                       )}
                       
                       <motion.button
                         whileHover={{ scale: 1.05 }}
                         whileTap={{ scale: 0.95 }}
                         onClick={startListening}
                         className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center shadow-xl border-4 transition-all ${
                           isListening 
                             ? "bg-red-500 border-red-100 shadow-red-500/30" 
                             : "bg-white border-white shadow-slate-200 hover:border-primary/20"
                         }`}
                       >
                         {isListening ? (
                           <div className="bg-white p-4 rounded-xl shadow-inner">
                              <div className="w-6 h-6 bg-red-500 rounded-sm" />
                           </div>
                         ) : (
                           <Mic size={40} className="text-slate-700 ml-0.5" />
                         )}
                       </motion.button>
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
                   <div className="flex flex-col items-center animate-bounce">
                     <span className="text-6xl mb-2">🌟</span>
                     <h3 className="text-4xl font-black text-slate-800 text-center tracking-tight leading-none">
                       Way to go!
                     </h3>
                     <p className="text-slate-500 font-bold mt-1 text-lg">You nailed it!</p>
                   </div>
                   
                   <motion.button
                     whileHover={{ scale: 1.05 }}
                     whileTap={{ scale: 0.95 }}
                     onClick={() => {
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
    </div>
  );
}
