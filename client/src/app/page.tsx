"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Sparkles, Volume2, Mic, BarChart3, Shield, ArrowRight, RefreshCw, Heart, Star, Zap, ChevronDown } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import GuidedTour, { HOME_TOUR_STEPS } from "@/components/GuidedTour";
import { NotificationBell, useNotifications } from "@/components/NotificationBell";
import WolfieMascot from "@/components/WolfieMascot";
import InteractiveBackground from "@/components/InteractiveBackground";

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 30, filter: "blur(6px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: "easeOut" as const } },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  show: { opacity: 1, scale: 1, transition: { type: "spring" as const, duration: 0.8, bounce: 0.35 } },
};

function MagneticButton({ children, className, ...props }: React.ComponentProps<typeof motion.button>) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { damping: 15, stiffness: 150 });
  const springY = useSpring(y, { damping: 15, stiffness: 150 });

  return (
    <motion.button
      ref={ref}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        x.set((e.clientX - cx) * 0.12);
        y.set((e.clientY - cy) * 0.12);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      className={className}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function TypeWriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const interval = setInterval(() => {
      setDisplayed(text.slice(0, i + 1));
      i++;
      if (i >= text.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [started, text]);

  return (
    <span>
      {displayed}
      {started && displayed.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[2px] h-[1em] bg-slate-600 ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

export default function HomePage() {
  const [showContent, setShowContent] = useState(false);
  const [existingUser, setExistingUser] = useState<string | null>(null);
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearAll } = useNotifications();

  useEffect(() => {
    setExistingUser(localStorage.getItem("kidName"));
    const t = setTimeout(() => setShowContent(true), 150);
    
    // Connectivity Check for Voice AI
    const checkBackend = async () => {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
        const res = await fetch(`${API_BASE}/health`);
        const data = await res.json();
        console.log("🎙️ Voice AI System:", data.status === 'ok' ? "ONLINE ✓" : "OFFLINE ✗");
      } catch (e) {
        console.warn("🎙️ Voice AI System: OFFLINE (Check if backend npm run dev is running on port 5000)");
      }
    };
    checkBackend();

    return () => clearTimeout(t);
  }, []);

  const [name, setName] = useState("");

  const playWelcome = async (forceMessage?: string) => {
    try {
      const { playCachedTTS } = await import("@/lib/audio");
      const currentName = localStorage.getItem("kidName") || name;
      const message = forceMessage || (currentName 
        ? `Hey! Welcome back, ${currentName}! Wolfie missed you so much! Are you ready for another magical voice adventure? Click the button and let's go!`
        : `Hi there! I'm Wolfie, your magical speech buddy! I can't wait to hear your beautiful voice. Type your name below so we can start our adventure together!`);
      
      // Use 'amx' for Wolfie (Warm Male Voice) for realism
      await playCachedTTS(message, "amx"); 
    } catch (e) {
      console.error("Welcome voice failed", e);
    }
  };

  // Preload welcome message for instant playback on click
  useEffect(() => {
    const currentName = localStorage.getItem("kidName");
    if (currentName) {
      import("@/lib/audio").then(({ preloadTTS }) => {
        const message = `Hey! Welcome back, ${currentName}! Wolfie missed you so much! Are you ready for another magical voice adventure? Click the button and let's go!`;
        preloadTTS(message, "amx");
      });
    }
  }, []);

  const [isShaking, setIsShaking] = useState(false);

  const handleStart = async () => {
    if (!existingUser && !name.trim()) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 500);
      return;
    }

    if (!existingUser && name.trim()) {
      localStorage.setItem("kidName", name.trim());
      // Play a quick confirmation and WAIT for it to finish
      await playWelcome(`Great to meet you, ${name.trim()}! Let's go!`);
      
      // Tiny delay for smoothness after the voice ends
      setTimeout(() => {
        window.location.href = "/play";
      }, 500);
    } else if (existingUser) {
      window.location.href = "/play";
    }
  };

  const resetUser = () => {
    toast("Switch explorer name?", {
      description: "Your current progress will be safe for that name!",
      action: {
        label: "Switch",
        onClick: () => {
          localStorage.removeItem("kidName");
          setExistingUser(null);
          setName("");
          toast.success("Ready for a new explorer!");
        }
      },
      cancel: {
        label: "Cancel",
        onClick: () => {}
      }
    });
  };

  // Trigger welcome on first interaction to bypass browser autoplay policy
  useEffect(() => {
    const handleFirstClick = () => {
      playWelcome();
      window.removeEventListener("click", handleFirstClick);
    };
    window.addEventListener("click", handleFirstClick);
    return () => window.removeEventListener("click", handleFirstClick);
  }, []);

  return (
    <div className="min-h-screen relative overflow-hidden">
      <InteractiveBackground />

      {/* Navbar */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-50 flex justify-between items-center px-6 py-5 w-full max-w-7xl mx-auto"
      >
        <Link href="/" className="flex items-center gap-2.5 group">
          <motion.div
            whileHover={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 0.5 }}
            className="w-11 h-11 bg-gradient-to-br from-[#8B7FDE] to-[#6558C4] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#8B7FDE]/25 border-2 border-white"
          >
            <Volume2 size={22} />
          </motion.div>
          <span className="text-xl font-black text-slate-800 tracking-tight group-hover:text-[#8B7FDE] transition-colors">
            Fable
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <NotificationBell
            notifications={notifications}
            unreadCount={unreadCount}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onClearAll={clearAll}
          />
          <Link href="/parent">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-white hover:shadow-xl transition-all cursor-pointer"
            >
              <BarChart3 size={20} className="text-slate-700" />
            </motion.div>
          </Link>
        </div>
      </motion.nav>

      <GuidedTour
        steps={HOME_TOUR_STEPS}
        onComplete={() => {}}
        storageKey="home-tour-v1"
      />

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center px-6 pb-12 pt-4 md:pt-0 md:min-h-[calc(100vh-80px)]">
        <AnimatePresence>
          {showContent && (
            <motion.div
              variants={stagger}
              initial="hidden"
              animate="show"
              className="flex flex-col items-center text-center max-w-5xl w-full"
            >
              {/* Mascot + Speech Bubble */}
              <motion.div variants={scaleIn} className="relative mb-2 md:mb-6">
                {/* Floating word bubbles around mascot */}
                {[
                  { word: "Sun ☀️", x: -140, y: -20, delay: 1.5 },
                  { word: "Fish 🐟", x: 130, y: -10, delay: 2.0 },
                  { word: "Cake 🍰", x: -120, y: 80, delay: 2.5 },
                  { word: "Lion 🦁", x: 140, y: 70, delay: 3.0 },
                ].map((bubble, i) => (
                  <motion.div
                    key={i}
                    className="absolute hidden md:block"
                    style={{ left: `calc(50% + ${bubble.x}px)`, top: `calc(50% + ${bubble.y}px)` }}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1, y: [0, -6, 0] }}
                    transition={{
                      opacity: { delay: bubble.delay, duration: 0.4 },
                      scale: { delay: bubble.delay, type: "spring", bounce: 0.5 },
                      y: { delay: bubble.delay + 0.5, duration: 3, repeat: Infinity, ease: "easeInOut" },
                    }}
                  >
                    <div className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border-2 border-white shadow-md text-sm font-black text-slate-600 whitespace-nowrap">
                      {bubble.word}
                    </div>
                  </motion.div>
                ))}

                <WolfieMascot size={260} />

                {/* Speech bubble */}
                <motion.div
                  initial={{ opacity: 0, scale: 0, x: -20 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  transition={{ delay: 0.8, type: "spring", bounce: 0.4 }}
                  className="absolute -right-8 top-12 md:right-[-160px] md:top-16 z-20 w-[180px] md:w-[220px]"
                >
                  <div className="relative bg-white/95 backdrop-blur-xl px-4 py-3 rounded-2xl shadow-xl border-2 border-white">
                    <p className="text-xs md:text-sm font-bold text-slate-700 leading-snug">
                      <TypeWriter
                        text={existingUser ? `Hey ${existingUser}! Ready to play?` : "Hi there! I'm Wolfie! Let's practice sounds together!"}
                        delay={1200}
                      />
                    </p>
                    {/* Speech bubble tail pointing left to mascot */}
                    <div className="absolute -left-2 top-4 w-4 h-4 bg-white/95 border-l-2 border-b-2 border-white rotate-45" />
                  </div>
                </motion.div>

                {/* AI badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.2, type: "spring", bounce: 0.5 }}
                  className="absolute -top-2 -left-2 bg-gradient-to-r from-[#8B7FDE] to-[#6558C4] text-white px-3 py-1.5 rounded-full shadow-xl shadow-[#8B7FDE]/30 font-black text-[10px] flex items-center gap-1.5 border-3 border-white z-20 uppercase tracking-wider"
                >
                  <Sparkles size={11} />
                  AI Powered
                </motion.div>
              </motion.div>

              {/* Headline */}
              <motion.div variants={fadeUp}>
                <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-slate-800 tracking-tighter leading-[0.95] mb-3">
                  Meet{" "}
                  <span className="relative inline-block">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#8B7FDE] via-[#6558C4] to-[#B19CD9]">
                      Wolfie
                    </span>
                    <motion.span
                      className="absolute -bottom-1 left-0 right-0 h-[5px] bg-gradient-to-r from-[#8B7FDE] to-[#B19CD9] rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.6, duration: 0.6, ease: "easeOut" }}
                      style={{ originX: 0 }}
                    />
                  </span>
                </h1>
              </motion.div>

              <motion.p variants={fadeUp} className="text-xl sm:text-2xl font-bold text-slate-500 mb-2 tracking-tight">
                {existingUser ? `Welcome back, ${existingUser}!` : "Your AI Speech Therapy Buddy"}
              </motion.p>

              <motion.p variants={fadeUp} className="text-base sm:text-lg text-slate-400 max-w-md mx-auto leading-relaxed mb-8">
                Making speech practice{" "}
                <span className="font-black text-primary">fun, free, and accessible</span>{" "}
                for every child.
              </motion.p>

              {/* CTA & Actions Area */}
              <motion.div variants={fadeUp} className="flex flex-col items-center gap-6 mb-14 w-full max-w-lg mx-auto">
                
                {/* 1. Name Input Area (Top) */}
                {!existingUser ? (
                  <motion.div 
                    animate={isShaking ? { x: [-5, 5, -5, 5, 0] } : {}}
                    transition={{ duration: 0.4 }}
                    className="w-full flex flex-col items-center gap-3"
                  >
                    <div className="relative group w-full max-w-sm">
                      <div className="absolute -top-3 left-6 px-2 bg-[#FFF9F2] text-[10px] font-black text-[#8B7FDE] uppercase tracking-widest z-10 transition-colors group-focus-within:text-primary">
                        Who is exploring?
                      </div>
                      <input
                        type="text"
                        placeholder="Type your name here..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStart()}
                        className={`w-full px-8 py-5 bg-white/60 backdrop-blur-xl rounded-[2rem] border-4 outline-none text-xl font-black text-slate-800 shadow-xl transition-all placeholder:text-slate-300 text-center ${
                          isShaking ? "border-red-400" : "border-white focus:border-[#8B7FDE]"
                        }`}
                      />
                      <motion.div 
                        animate={name.trim() ? { scale: [1, 1.1, 1] } : {}}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="absolute -right-2 -top-2 bg-primary text-white p-2 rounded-full shadow-lg border-2 border-white scale-0 group-focus-within:scale-100 transition-transform"
                      >
                        <Heart size={16} fill="white" />
                      </motion.div>
                    </div>
                  </motion.div>
                ) : null}

                {/* 2. Action Buttons Row (Below Name) */}
                <div className="flex flex-row items-center justify-center gap-3 w-full">
                  <MagneticButton
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleStart}
                    className="group relative flex-[1.5] max-w-[280px] px-6 py-5 bg-gradient-to-r from-[#8B7FDE] via-[#7C6FD4] to-[#6558C4] rounded-[2rem] text-white font-black text-lg shadow-xl shadow-[#8B7FDE]/30 hover:shadow-2xl hover:shadow-[#8B7FDE]/40 transition-shadow overflow-hidden border-4 border-white cursor-pointer"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
                    />
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles size={18} />
                      {existingUser ? "Let's Play!" : "Start Adventure"}
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </span>
                  </MagneticButton>

                  <Link href="/parent" data-tour="parent-portal" className="flex-1 max-w-[180px]">
                    <MagneticButton
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full px-6 py-5 bg-white/80 backdrop-blur-xl rounded-[2rem] text-slate-600 font-bold text-lg shadow-lg hover:shadow-xl border-4 border-white transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <BarChart3 size={18} />
                      Portal
                    </MagneticButton>
                  </Link>

                  {existingUser && (
                    <motion.button
                      whileHover={{ scale: 1.1, rotate: 180 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={resetUser}
                      className="p-4 bg-white/40 backdrop-blur-md rounded-full border-2 border-white/60 text-slate-400 hover:text-red-500 hover:bg-white hover:border-red-100 transition-all cursor-pointer shadow-md"
                      title="Switch Explorer"
                    >
                      <RefreshCw size={22} />
                    </motion.button>
                  )}
                </div>
              </motion.div>

              {/* How It Works */}
              <motion.div variants={fadeUp} className="w-full max-w-3xl mb-14">
                <div className="flex items-center gap-3 justify-center mb-6">
                  <div className="h-px w-12 bg-gradient-to-r from-transparent to-slate-300/50" />
                  <span className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">How It Works</span>
                  <div className="h-px w-12 bg-gradient-to-l from-transparent to-slate-300/50" />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { step: "1", text: "Pick a sound mission", emoji: "🎯", color: "from-orange-50 to-amber-50" },
                    { step: "2", text: "Listen to Wolfie say it", emoji: "🔊", color: "from-violet-50 to-purple-50" },
                    { step: "3", text: "Say it into your mic", emoji: "🎤", color: "from-rose-50 to-pink-50" },
                    { step: "4", text: "Get instant AI feedback", emoji: "✨", color: "from-emerald-50 to-green-50" },
                  ].map((item, i) => (
                    <motion.div
                      key={item.step}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 + i * 0.1 }}
                      whileHover={{ y: -5, scale: 1.03 }}
                      className={`relative bg-gradient-to-br ${item.color} backdrop-blur-md p-5 rounded-[1.5rem] border-2 border-white shadow-sm hover:shadow-lg transition-all text-center group cursor-default`}
                    >
                      <motion.span
                        className="text-4xl block mb-2"
                        animate={{ scale: [1, 1.15, 1] }}
                        transition={{ duration: 2, repeat: Infinity, repeatDelay: 2 + i, ease: "easeInOut" }}
                      >
                        {item.emoji}
                      </motion.span>
                      <div className="inline-block bg-white/80 px-2 py-0.5 rounded-lg mb-1.5">
                        <span className="text-[9px] font-black text-[#8B7FDE] uppercase tracking-[0.2em]">
                          Step {item.step}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-600 leading-tight">{item.text}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Feature Cards */}
              <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mb-12">
                {[
                  {
                    icon: <Volume2 className="text-blue-500" size={26} />,
                    emoji: "🔉",
                    title: "Real-Time AI Voice",
                    description: "Ultra-fast speech with Smallest AI Waves. Wolfie responds instantly!",
                    gradient: "from-blue-500/8 to-indigo-500/5",
                    border: "hover:border-blue-200",
                  },
                  {
                    icon: <Mic className="text-emerald-500" size={26} />,
                    emoji: "🎤",
                    title: "Smart Feedback",
                    description: "Near-miss detection coaches kids when they almost get the sound right.",
                    gradient: "from-emerald-500/8 to-green-500/5",
                    border: "hover:border-emerald-200",
                  },
                  {
                    icon: <Shield className="text-violet-500" size={26} />,
                    emoji: "📊",
                    title: "Parent Dashboard",
                    description: "Track progress, accuracy, and difficult sounds with real-time analytics.",
                    gradient: "from-violet-500/8 to-purple-500/5",
                    border: "hover:border-violet-200",
                  },
                ].map((feature, i) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 + i * 0.1 }}
                    whileHover={{ y: -6, scale: 1.02 }}
                    className={`bg-gradient-to-br ${feature.gradient} backdrop-blur-xl p-6 rounded-[2rem] border-4 border-white ${feature.border} shadow-lg hover:shadow-xl transition-all group`}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <motion.span
                        className="text-2xl"
                        whileHover={{ rotate: [0, -10, 10, 0] }}
                      >
                        {feature.emoji}
                      </motion.span>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{feature.description}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Impact Stats */}
              <motion.div variants={fadeUp} className="flex flex-wrap justify-center gap-6 md:gap-10 mb-10">
                {[
                  { value: "$0", label: "Free forever", icon: <Heart size={14} className="text-rose-400" /> },
                  { value: "<100ms", label: "Voice latency", icon: <Zap size={14} className="text-amber-400" /> },
                  { value: "8+", label: "Sound missions", icon: <Star size={14} className="text-yellow-400" /> },
                  { value: "3-8", label: "Age range", icon: <Sparkles size={14} className="text-violet-400" /> },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 + i * 0.08 }}
                    whileHover={{ scale: 1.1, y: -3 }}
                    className="text-center cursor-default bg-white/50 backdrop-blur-sm px-5 py-3 rounded-2xl border-2 border-white/80"
                  >
                    <div className="flex items-center justify-center gap-1.5 mb-1">
                      {stat.icon}
                      <span className="text-2xl font-black text-slate-800 tracking-tight">{stat.value}</span>
                    </div>
                    <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>

              {/* Footer */}
              <motion.div variants={fadeUp} className="flex flex-col items-center gap-3 pb-8">
                <motion.div
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                  className="mb-8"
                >
                  <ChevronDown size={32} className="text-primary/50" />
                </motion.div>

                <div className="flex flex-col items-center gap-2 group cursor-default">
                  <div className="inline-flex items-center gap-3 bg-[#8B7FDE]/5 backdrop-blur-md px-6 py-3 rounded-[1.5rem] border-2 border-white shadow-sm group-hover:shadow-md group-hover:border-[#8B7FDE]/20 transition-all">
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Powered by</span>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <span className="text-sm font-black text-[#8B7FDE]">Smallest AI</span>
                    <div className="h-4 w-[1px] bg-slate-200" />
                    <span className="text-xs font-bold text-slate-500">Lightning v3.1</span>
                  </div>
                  <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    Ultra-Realistic Response Recovery Technology
                  </p>
                </div>
                <Link
                  href="/about"
                  className="text-sm font-bold text-slate-400 hover:text-[#8B7FDE] transition-colors underline underline-offset-4"
                >
                  About Fable
                </Link>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
