"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Calendar, CheckCircle2, XCircle, TrendingUp,
  UserRound, Target, Zap, BarChart3, Star, Volume2,
  Clock, Award, Flame, BookOpen, Phone, PhoneCall, Loader2,
} from "lucide-react";
import Link from "next/link";
import InteractiveBackground from "@/components/InteractiveBackground";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

interface Stats {
  total: number;
  successes: number;
  nearMisses: number;
  successRate: number;
  soundBreakdown: Record<string, { total: number; success: number }>;
  dailyActivity: Record<string, number>;
  recentSessions: any[];
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function ParentDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "sounds" | "history">("overview");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callStatus, setCallStatus] = useState<"idle" | "calling" | "success" | "error">("idle");
  const [callMessage, setCallMessage] = useState("");

  const triggerParentCall = async () => {
    if (!phoneNumber.trim()) return;
    setCallStatus("calling");
    setCallMessage("");
    try {
      const kidName = localStorage.getItem("kidName") || "Little Explorer";
      const res = await fetch(`${API_BASE}/atoms/call-parent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: phoneNumber.trim(), kidName }),
      });
      const data = await res.json();
      if (data.success) {
        setCallStatus("success");
        setCallMessage(data.message || "AI is calling you now!");
      } else {
        setCallStatus("error");
        setCallMessage(data.error || "Could not place call");
      }
    } catch {
      setCallStatus("error");
      setCallMessage("Network error - check server connection");
    }
  };

  useEffect(() => {
    fetch(`${API_BASE}/stats`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setStats(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const difficultSounds = stats?.soundBreakdown
    ? Object.entries(stats.soundBreakdown)
        .filter(([, v]) => v.total > 0)
        .sort((a, b) => (a[1].success / a[1].total) - (b[1].success / b[1].total))
        .slice(0, 3)
        .map(([sound]) => sound)
    : [];

  const strongSounds = stats?.soundBreakdown
    ? Object.entries(stats.soundBreakdown)
        .filter(([, v]) => v.total > 0)
        .sort((a, b) => (b[1].success / b[1].total) - (a[1].success / a[1].total))
        .slice(0, 3)
        .map(([sound]) => sound)
    : [];

  const maxDaily = stats?.dailyActivity
    ? Math.max(...Object.values(stats.dailyActivity), 1)
    : 1;

  const totalXp = stats?.recentSessions
    ? stats.recentSessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0)
    : 0;

  const avgAttemptsPerSuccess = stats
    ? stats.successes > 0
      ? (stats.total / stats.successes).toFixed(1)
      : "N/A"
    : "N/A";

  return (
    <div className="min-h-screen relative">
      <InteractiveBackground />
      <div className="relative z-10 max-w-6xl mx-auto p-4 md:p-6">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center mb-8"
        >
          <Link href="/">
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-md border-2 border-white hover:bg-white transition-all cursor-pointer"
            >
              <ArrowLeft size={22} className="text-primary" />
            </motion.div>
          </Link>
          <div className="text-right">
            <h1 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Progress Report</h1>
            <p className="text-sm text-slate-400 font-bold flex items-center gap-1.5 justify-end">
              <Volume2 size={14} className="text-primary" />
              Waggle Analytics
            </p>
          </div>
        </motion.header>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"
            />
            <p className="text-slate-400 font-bold text-sm">Loading analytics...</p>
          </div>
        ) : !stats || stats.total === 0 ? (
          <EmptyState />
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08 } } }}
            className="space-y-6"
          >
            {/* Hero Stats Grid */}
            <motion.div variants={fadeUp} className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatCard
                title="Total Sessions"
                value={stats.total.toString()}
                icon={<Calendar className="text-blue-500" size={22} />}
                gradient="from-blue-50 to-blue-100/50"
                detail={`${stats.successes} successful`}
              />
              <StatCard
                title="Accuracy"
                value={`${stats.successRate}%`}
                icon={<TrendingUp className="text-emerald-500" size={22} />}
                gradient="from-emerald-50 to-green-100/50"
                detail={stats.successRate >= 70 ? "Great progress!" : "Keep practicing!"}
                highlight={stats.successRate >= 70}
              />
              <StatCard
                title="Near Misses"
                value={stats.nearMisses.toString()}
                icon={<Target className="text-amber-500" size={22} />}
                gradient="from-amber-50 to-yellow-100/50"
                detail="Almost correct"
              />
              <StatCard
                title="XP Earned"
                value={totalXp.toString()}
                icon={<Zap className="text-primary" size={22} />}
                gradient="from-orange-50 to-primary/10"
                detail={`~${avgAttemptsPerSuccess} tries/success`}
              />
            </motion.div>

            {/* Insights Cards */}
            <motion.div variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-4 border-white shadow-lg p-6">
                <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                  <Flame size={18} className="text-red-500" />
                  <span className="uppercase tracking-wider">Needs Practice</span>
                </h3>
                {difficultSounds.length > 0 ? (
                  <div className="flex gap-2">
                    {difficultSounds.map(sound => {
                      const data = stats.soundBreakdown[sound];
                      const rate = data.total > 0 ? Math.round((data.success / data.total) * 100) : 0;
                      return (
                        <div key={sound} className="flex-1 bg-red-50/80 rounded-2xl p-4 text-center border-2 border-red-100/50">
                          <div className="text-2xl font-black text-red-500 mb-1">"{sound}"</div>
                          <div className="text-xs font-bold text-red-400">{rate}% accuracy</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm font-medium">All sounds are progressing well!</p>
                )}
              </div>

              <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-4 border-white shadow-lg p-6">
                <h3 className="text-sm font-black text-slate-700 mb-3 flex items-center gap-2">
                  <Award size={18} className="text-emerald-500" />
                  <span className="uppercase tracking-wider">Strongest Sounds</span>
                </h3>
                {strongSounds.length > 0 ? (
                  <div className="flex gap-2">
                    {strongSounds.map(sound => {
                      const data = stats.soundBreakdown[sound];
                      const rate = data.total > 0 ? Math.round((data.success / data.total) * 100) : 0;
                      return (
                        <div key={sound} className="flex-1 bg-emerald-50/80 rounded-2xl p-4 text-center border-2 border-emerald-100/50">
                          <div className="text-2xl font-black text-emerald-600 mb-1">"{sound}"</div>
                          <div className="text-xs font-bold text-emerald-500">{rate}% accuracy</div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm font-medium">Start practicing to see your strongest sounds!</p>
                )}
              </div>
            </motion.div>

            {/* Tab Navigation */}
            <motion.div variants={fadeUp} className="flex gap-2 bg-white/50 backdrop-blur-md p-1.5 rounded-2xl border-2 border-white/80 w-fit mx-auto">
              {([
                { id: "overview", label: "Activity", icon: <BarChart3 size={16} /> },
                { id: "sounds", label: "Sound Mastery", icon: <BookOpen size={16} /> },
                { id: "history", label: "History", icon: <Clock size={16} /> },
              ] as const).map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2.5 rounded-xl text-sm font-black flex items-center gap-2 transition-all ${
                    activeTab === tab.id
                      ? "bg-white shadow-md text-primary"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {activeTab === "overview" && (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {stats.dailyActivity && Object.keys(stats.dailyActivity).length > 0 && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-4 border-white shadow-lg p-6">
                      <h2 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
                        <BarChart3 size={20} className="text-primary" />
                        Weekly Activity
                      </h2>
                      <div className="flex items-end gap-3 h-40">
                        {Object.entries(stats.dailyActivity).map(([date, count], i) => {
                          const height = Math.max(8, (count / maxDaily) * 100);
                          const dayLabel = new Date(date + "T12:00:00").toLocaleDateString("en", { weekday: "short" });
                          const isToday = date === new Date().toISOString().split("T")[0];
                          return (
                            <div key={date} className="flex-1 flex flex-col items-center gap-1.5">
                              <span className="text-xs font-black text-primary">{count || ""}</span>
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: `${height}%` }}
                                transition={{ delay: 0.1 + i * 0.05, duration: 0.6, ease: "easeOut" }}
                                className={`w-full max-w-[48px] rounded-xl ${
                                  isToday
                                    ? "bg-gradient-to-t from-primary to-yellow-400 shadow-md shadow-primary/20"
                                    : "bg-gradient-to-t from-primary/60 to-orange-300/60"
                                }`}
                              />
                              <span className={`text-[10px] font-bold ${isToday ? "text-primary" : "text-slate-400"}`}>
                                {dayLabel}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "sounds" && (
                <motion.div
                  key="sounds"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {stats.soundBreakdown && Object.keys(stats.soundBreakdown).length > 0 ? (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-4 border-white shadow-lg p-6">
                      <h2 className="text-lg font-black text-slate-700 mb-6 flex items-center gap-2">
                        <Star size={20} className="text-yellow-500" />
                        Sound Mastery
                      </h2>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {Object.entries(stats.soundBreakdown).map(([sound, data]) => {
                          const rate = data.total > 0 ? Math.round((data.success / data.total) * 100) : 0;
                          const emoji = rate >= 80 ? "🌟" : rate >= 50 ? "💪" : "🎯";
                          return (
                            <motion.div
                              key={sound}
                              whileHover={{ y: -3, scale: 1.02 }}
                              className="bg-slate-50/80 rounded-2xl p-5 text-center border-2 border-white hover:shadow-lg transition-all"
                            >
                              <div className="text-xl mb-1">{emoji}</div>
                              <div className="text-2xl font-black text-primary mb-2">"{sound}"</div>
                              <div className="h-2.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${rate}%` }}
                                  transition={{ delay: 0.3, duration: 0.8 }}
                                  className={`h-full rounded-full ${
                                    rate >= 70 ? "bg-gradient-to-r from-emerald-500 to-green-400" :
                                    rate >= 40 ? "bg-gradient-to-r from-amber-500 to-yellow-400" :
                                    "bg-gradient-to-r from-red-500 to-red-400"
                                  }`}
                                />
                              </div>
                              <div className="text-xs font-bold text-slate-500">
                                {rate}% <span className="text-slate-400">({data.success}/{data.total})</span>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <EmptyState message="No sound data yet. Practice some missions to see mastery levels!" />
                  )}
                </motion.div>
              )}

              {activeTab === "history" && (
                <motion.div
                  key="history"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] border-4 border-white shadow-lg overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100/80 flex justify-between items-center">
                      <h2 className="text-lg font-black flex items-center gap-2 text-slate-700">
                        <UserRound size={18} className="text-primary" />
                        Recent Activity
                      </h2>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        Last {stats.recentSessions.length} sessions
                      </span>
                    </div>
                    <div className="divide-y divide-slate-100/80">
                      {stats.recentSessions.length === 0 ? (
                        <EmptyState message="No sessions recorded yet." />
                      ) : (
                        stats.recentSessions.map((session, i) => (
                          <motion.div
                            key={i}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.03 }}
                            className="px-6 py-4 flex items-center justify-between hover:bg-white/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl ${
                                session.success ? "bg-green-50 text-green-500" :
                                session.isNearMiss ? "bg-amber-50 text-amber-500" :
                                "bg-red-50 text-red-400"
                              }`}>
                                {session.success ? <CheckCircle2 size={20} /> :
                                 session.isNearMiss ? <Target size={20} /> :
                                 <XCircle size={20} />}
                              </div>
                              <div>
                                <div className="font-bold text-slate-700">
                                  <span className="text-slate-400">{session.kidName || "Explorer"}</span>{" "}
                                  practiced <span className="text-primary font-black">"{session.word}"</span>
                                </div>
                                <div className="text-xs text-slate-400 flex gap-3 font-bold mt-0.5">
                                  <span>Sound: {session.sound}</span>
                                  <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                                  {session.isNearMiss && <span className="text-amber-500">Near miss</span>}
                                  {session.xpEarned > 0 && <span className="text-primary">+{session.xpEarned} XP</span>}
                                </div>
                              </div>
                            </div>
                            <div className="text-right shrink-0 ml-4">
                              <div className="text-[10px] font-black text-slate-300 uppercase mb-0.5">Heard</div>
                              <div className="text-xs font-bold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                                "{session.transcript}"
                              </div>
                            </div>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Phone Call Section - Atoms Integration */}
            <motion.div variants={fadeUp} className="bg-gradient-to-br from-purple-50 to-indigo-50/50 backdrop-blur-xl rounded-[2rem] border-4 border-white shadow-lg p-6">
              <div className="flex items-start gap-4">
                <div className="bg-gradient-to-br from-primary to-purple-600 p-4 rounded-2xl text-white shrink-0">
                  <PhoneCall size={28} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-slate-800 mb-1">AI Progress Report Call</h3>
                  <p className="text-sm text-slate-500 font-bold mb-4">
                    Our AI buddy will <span className="text-primary font-black">call you</span> with a personalized
                    progress report about your child's speech therapy practice. Powered by Smallest AI Atoms.
                  </p>

                  <div className="flex gap-3 items-center">
                    <div className="relative flex-1 max-w-xs">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="+1 555 123 4567"
                        value={phoneNumber}
                        onChange={(e) => {
                          setPhoneNumber(e.target.value);
                          if (callStatus !== "idle" && callStatus !== "calling") {
                            setCallStatus("idle");
                            setCallMessage("");
                          }
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-2xl border-2 border-white focus:border-primary outline-none font-bold text-slate-700 shadow-sm"
                      />
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={triggerParentCall}
                      disabled={!phoneNumber.trim() || callStatus === "calling"}
                      className="px-6 py-3 bg-gradient-to-r from-primary to-purple-600 rounded-2xl text-white font-black text-sm shadow-lg border-2 border-white disabled:opacity-40 flex items-center gap-2"
                    >
                      {callStatus === "calling" ? (
                        <><Loader2 size={16} className="animate-spin" /> Calling...</>
                      ) : callStatus === "success" ? (
                        <><PhoneCall size={16} /> Call Again</>
                      ) : (
                        <><PhoneCall size={16} /> Call Me</>
                      )}
                    </motion.button>
                  </div>

                  <p className="text-xs text-slate-400 font-bold mt-2">
                    Use international format with country code (e.g. +1 for US, +91 for India)
                  </p>

                  <AnimatePresence>
                    {callMessage && (
                      <motion.div
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-3 text-sm font-bold px-4 py-2 rounded-xl ${
                          callStatus === "success" ? "bg-green-50 text-green-600 border border-green-200" :
                          callStatus === "error" ? "bg-red-50 text-red-500 border border-red-200" : ""
                        }`}
                      >
                        {callStatus === "success" && "📞 "}{callMessage}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, gradient, detail, highlight }: {
  title: string;
  value: string;
  icon: React.ReactNode;
  gradient: string;
  detail?: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -3, scale: 1.02 }}
      className={`bg-gradient-to-br ${gradient} p-5 rounded-[1.5rem] border-4 border-white shadow-md hover:shadow-lg transition-all`}
    >
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{title}</span>
      </div>
      <div className="text-3xl font-black text-slate-800 mb-0.5">{value}</div>
      {detail && (
        <div className={`text-xs font-bold ${highlight ? "text-emerald-500" : "text-slate-400"}`}>
          {detail}
        </div>
      )}
    </motion.div>
  );
}

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="p-16 text-center flex flex-col items-center gap-4">
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="p-5 bg-slate-50 rounded-full text-slate-300"
      >
        <TrendingUp size={40} />
      </motion.div>
      <p className="text-slate-400 font-medium text-sm max-w-xs">
        {message || "No practice sessions yet. Start playing to see progress here!"}
      </p>
      <Link href="/play">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="px-6 py-3 bg-gradient-to-r from-primary to-orange-500 rounded-2xl text-white font-black text-sm shadow-lg border-2 border-white"
        >
          Start Practicing
        </motion.button>
      </Link>
    </div>
  );
}
