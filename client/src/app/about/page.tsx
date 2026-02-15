"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Github, Linkedin, Mail, Globe, Heart, Code, Sparkles } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

export default function AboutPage() {
  const bubbles = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      width: 40 + ((i * 37 + 13) % 50),
      height: 40 + ((i * 29 + 7) % 45),
      left: ((i * 23 + 11) % 100),
      top: ((i * 31 + 17) % 100),
      duration: 3 + (i % 3),
      delay: (i * 0.4) % 2,
    })), []);

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-[#FFF9F2] via-[#FFE8CC] to-[#FFD9A8] relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {bubbles.map((b, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white/15"
            style={{ width: b.width, height: b.height, left: `${b.left}%`, top: `${b.top}%` }}
            animate={{ y: [0, -20, 0], opacity: [0.15, 0.3, 0.15] }}
            transition={{ duration: b.duration, repeat: Infinity, delay: b.delay }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link href="/" className="p-3 bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border-2 border-white/80 hover:bg-white transition-all hover:scale-105 active:scale-95">
            <ArrowLeft size={24} className="text-primary" />
          </Link>
          <h1 className="text-4xl font-black text-slate-800">About TalkyBuddy</h1>
          <div className="w-12" />
        </div>

        {/* Mission Statement */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 border-4 border-white shadow-xl mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Heart className="text-red-500 fill-red-500" size={32} />
            <h2 className="text-3xl font-black text-slate-800">Our Mission</h2>
          </div>
          <p className="text-lg text-slate-600 leading-relaxed mb-4">
            Speech therapy costs <span className="font-black text-primary">$100-200 per session</span> and requires travel. 
            1 in 12 children have a speech disorder, yet most families can't afford consistent therapy.
          </p>
          <p className="text-lg text-slate-600 leading-relaxed">
            <span className="font-black text-primary">TalkyBuddy Boost</span> makes professional-grade speech practice 
            free, accessible from any browser, and fun through gamification. Every child deserves 
            the chance to communicate clearly.
          </p>
        </motion.div>

        {/* Technology */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 border-4 border-white shadow-xl mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Code className="text-blue-500" size={32} />
            <h2 className="text-3xl font-black text-slate-800">Technology</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TechCard title="Smallest AI Waves" description="Ultra-low latency streaming TTS (<100ms)" />
            <TechCard title="Next.js 15" description="App Router with Server Components" />
            <TechCard title="MongoDB Atlas" description="Real-time analytics & session tracking" />
            <TechCard title="Web Speech API" description="On-device speech recognition" />
            <TechCard title="Framer Motion" description="60fps animations for engagement" />
            <TechCard title="Canvas API" description="Real-time audio visualizer" />
          </div>
        </motion.div>

        {/* Founder */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-10 border-4 border-white shadow-xl mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="text-yellow-500" size={32} />
            <h2 className="text-3xl font-black text-slate-800">Meet the Founder</h2>
          </div>

          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 bg-gradient-to-br from-primary to-orange-500 rounded-full flex items-center justify-center text-6xl shadow-xl border-4 border-white">
              👨‍💻
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-2xl font-black text-slate-800 mb-2">Rohit Bharti</h3>
              <p className="text-lg font-bold text-primary mb-3">Full-Stack Developer | AI Enthusiast</p>
              <p className="text-slate-600 leading-relaxed mb-4">
                <span className="font-black">3+ years</span> building scalable web applications with React, Next.js, Node.js, and ASP.NET. 
                Currently a <span className="font-black">Student Mentor at GDSC Conestoga</span>, leading technical workshops and 
                building AI-integrated platforms. Passionate about making education accessible through technology.
              </p>
              <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                <SocialLink href="https://linkedin.com/in/rohit-bharti-" icon={<Linkedin size={18} />} label="LinkedIn" />
                <SocialLink href="https://github.com/smarty-6452" icon={<Github size={18} />} label="GitHub" />
                <SocialLink href="https://rohitmansinghbharti.com" icon={<Globe size={18} />} label="Portfolio" />
                <SocialLink href="mailto:rohit@example.com" icon={<Mail size={18} />} label="Email" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Impact Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-gradient-to-r from-primary to-orange-500 rounded-[3rem] p-10 border-4 border-white shadow-xl text-white"
        >
          <h2 className="text-3xl font-black mb-8 text-center">Our Impact</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ImpactStat value="$0" label="Cost to Families" />
            <ImpactStat value="<100ms" label="AI Response Time" />
            <ImpactStat value="9" label="Chapter Levels" />
            <ImpactStat value="100%" label="Accessible" />
          </div>
        </motion.div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-slate-400">
          <p>Built with ❤️ for children who deserve better access to speech therapy</p>
          <p className="mt-2">Powered by Smallest AI • Next.js • MongoDB</p>
        </div>
      </div>
    </div>
  );
}

function TechCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-slate-50/80 p-4 rounded-2xl border-2 border-white/80">
      <h4 className="font-black text-slate-800 mb-1">{title}</h4>
      <p className="text-sm text-slate-500">{description}</p>
    </div>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary hover:bg-primary/20 transition-colors border-2 border-primary/20 text-sm font-bold"
    >
      {icon}
      {label}
    </motion.a>
  );
}

function ImpactStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-4xl font-black mb-2">{value}</div>
      <div className="text-sm font-bold opacity-90">{label}</div>
    </div>
  );
}
