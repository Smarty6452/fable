"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useEffect, useState, useMemo, useCallback } from "react";

export default function InteractiveBackground() {
  const [isMounted, setIsMounted] = useState(false);
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  const springConfig = { damping: 25, stiffness: 120, mass: 0.5 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  const blob1X = useTransform(smoothX, [0, 1], [-60, 60]);
  const blob1Y = useTransform(smoothY, [0, 1], [-40, 40]);
  const blob2X = useTransform(smoothX, [0, 1], [50, -50]);
  const blob2Y = useTransform(smoothY, [0, 1], [30, -30]);
  const blob3X = useTransform(smoothX, [0, 1], [-30, 30]);
  const blob3Y = useTransform(smoothY, [0, 1], [-50, 50]);
  const blob4X = useTransform(smoothX, [0, 1], [40, -40]);
  const blob4Y = useTransform(smoothY, [0, 1], [20, -20]);

  const glowX = useTransform(smoothX, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(smoothY, [0, 1], ["0%", "100%"]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX / window.innerWidth);
    mouseY.set(e.clientY / window.innerHeight);
  }, [mouseX, mouseY]);

  useEffect(() => {
    setIsMounted(true);
    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [handleMouseMove]);

  const floatingShapes = useMemo(() => [
    { type: "circle", x: "8%", y: "15%", size: 40, color: "#FFB347", delay: 0, duration: 8 },
    { type: "circle", x: "85%", y: "20%", size: 30, color: "#B19CD9", delay: 1.2, duration: 10 },
    { type: "star", x: "15%", y: "70%", size: 28, color: "#77DD77", delay: 0.5, duration: 7 },
    { type: "circle", x: "75%", y: "75%", size: 35, color: "#FFB8C6", delay: 2, duration: 9 },
    { type: "star", x: "92%", y: "45%", size: 24, color: "#FFB347", delay: 1, duration: 11 },
    { type: "circle", x: "45%", y: "5%", size: 22, color: "#AEC6CF", delay: 0.8, duration: 8.5 },
    { type: "star", x: "60%", y: "85%", size: 26, color: "#B19CD9", delay: 1.5, duration: 9.5 },
    { type: "circle", x: "30%", y: "88%", size: 32, color: "#77DD77", delay: 2.5, duration: 7.5 },
  ], []);

  const particles = useMemo(() =>
    Array.from({ length: 15 }, (_, i) => ({
      x: `${((i * 47 + 13) % 100)}%`,
      y: `${((i * 31 + 7) % 100)}%`,
      size: 2 + ((i * 17) % 3),
      duration: 14 + ((i * 23) % 16),
      delay: (i * 0.9) % 8,
    })), []);

  if (!isMounted) {
    return <div className="fixed inset-0 -z-10 bg-[#FFF9F2]" />;
  }

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#FFF9F2]">
      {/* Noise Texture Overlay */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: "url('https://grainy-gradients.vercel.app/noise.svg')" }}
      />

      {/* Mouse-following cursor glow */}
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full pointer-events-none z-0"
        style={{
          left: glowX,
          top: glowY,
          x: "-50%",
          y: "-50%",
          background: "radial-gradient(circle, rgba(255,179,71,0.12) 0%, rgba(255,179,71,0.04) 40%, transparent 75%)",
        }}
      />

      {/* Richer Gradients */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[140px] bg-gradient-to-br from-[#FFD166]/20 to-[#FFD166]/5"
        style={{ top: "-15%", left: "-10%", x: blob1X, y: blob1Y }}
        animate={{ scale: [1, 1.15, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[700px] h-[700px] rounded-full blur-[140px] bg-gradient-to-tl from-[#A0E7E5]/20 to-[#B4F8C8]/10"
        style={{ bottom: "-10%", right: "-10%", x: blob2X, y: blob2Y }}
        animate={{ scale: [1, 1.2, 1], rotate: [0, -60, 0] }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
      />
      
      {/* Animated Clouds */}
      {[1, 2, 3].map((i) => (
        <motion.div
          key={`cloud-${i}`}
          className="absolute text-white opacity-40 pointer-events-none"
          initial={{ x: "-10%" }}
          animate={{ x: "110%" }}
          transition={{ duration: 40 + i * 15, repeat: Infinity, ease: "linear", delay: i * -10 }}
          style={{ top: `${15 + i * 20}%`, fontSize: `${40 + i * 20}px` }}
        >
          ☁️
        </motion.div>
      ))}

      {/* Floating playful shapes */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            y: [0, -30, 0],
            rotate: [0, shape.type === "star" ? 180 : 360, shape.type === "star" ? 0 : 720],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: shape.duration,
            repeat: Infinity,
            delay: shape.delay,
            ease: "easeInOut",
          }}
        >
          {shape.type === "circle" ? (
            <div
              className="rounded-full border-[3px]"
              style={{
                width: shape.size,
                height: shape.size,
                borderColor: shape.color,
                opacity: 0.4,
                boxShadow: `0 0 10px ${shape.color}40` 
              }}
            />
          ) : (
            <svg
              width={shape.size}
              height={shape.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.3 }}
            >
              <path
                d="M12 2L14.5 9L22 9.5L16.5 14L18.5 22L12 17.5L5.5 22L7.5 14L2 9.5L9.5 9L12 2Z"
                fill={shape.color}
              />
            </svg>
          )}
        </motion.div>
      ))}

      {/* Background Music Player */}
      <BackgroundMusic />
    </div>
  );
}

function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  // const audioRef = useState(() => typeof Audio !== "undefined" ? new Audio("/happy-tunes.mp3") : null)[0];
  const [audioRef] = useState<HTMLAudioElement | null>(null); // Disabled until valid MP3 provided

  useEffect(() => {
    if (audioRef) {
      audioRef.loop = true;
      audioRef.volume = volume;
    }
    return () => {
      audioRef?.pause();
    };
  }, [audioRef]);

  useEffect(() => {
    if (audioRef) {
      if (isPlaying) {
        audioRef.play().catch(() => setIsPlaying(false)); // Handle autoplay block
      } else {
        audioRef.pause();
      }
    }
  }, [isPlaying, audioRef]);

  // Handle volume change
  useEffect(() => {
    if (audioRef) audioRef.volume = volume;
  }, [volume, audioRef]);

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md p-2 pl-4 rounded-full border border-white/50 shadow-lg transition-all hover:bg-white">
      <button 
        onClick={() => setIsPlaying(!isPlaying)}
        className="text-slate-500 hover:text-primary transition-colors"
        title={isPlaying ? "Pause Music" : "Play Music"}
      >
        {isPlaying ? (
          <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}>
            🎵
          </motion.div>
        ) : (
           <span className="opacity-50 grayscale">🎵</span>
        )}
      </button>
      
      {isPlaying && (
        <motion.input
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 60, opacity: 1 }}
          type="range"
          min="0"
          max="1"
          step="0.05"
          value={volume}
          onChange={(e) => setVolume(parseFloat(e.target.value))}
          className="h-1 accent-primary cursor-pointer"
        />
      )}
    </div>
  );
}
