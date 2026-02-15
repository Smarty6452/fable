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

      {/* Parallax blobs */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] bg-[#FFB347]/20"
        style={{ top: "-8%", left: "-8%", x: blob1X, y: blob1Y }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] bg-[#B19CD9]/18"
        style={{ bottom: "-12%", right: "-8%", x: blob2X, y: blob2Y }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[380px] h-[380px] rounded-full blur-[100px] bg-[#77DD77]/15"
        style={{ top: "25%", right: "12%", x: blob3X, y: blob3Y }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute w-[420px] h-[420px] rounded-full blur-[100px] bg-[#FFB8C6]/15"
        style={{ bottom: "15%", left: "8%", x: blob4X, y: blob4Y }}
        animate={{ scale: [1, 1.12, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Floating playful shapes */}
      {floatingShapes.map((shape, i) => (
        <motion.div
          key={i}
          className="absolute pointer-events-none"
          style={{ left: shape.x, top: shape.y }}
          animate={{
            y: [0, -20, 0],
            rotate: [0, shape.type === "star" ? 72 : 360, shape.type === "star" ? 0 : 720],
            scale: [1, 1.15, 1],
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
                opacity: 0.25,
              }}
            />
          ) : (
            <svg
              width={shape.size}
              height={shape.size}
              viewBox="0 0 24 24"
              fill="none"
              style={{ opacity: 0.2 }}
            >
              <path
                d="M12 2L14.5 9L22 9.5L16.5 14L18.5 22L12 17.5L5.5 22L7.5 14L2 9.5L9.5 9L12 2Z"
                fill={shape.color}
              />
            </svg>
          )}
        </motion.div>
      ))}

      {/* Wavy bottom decoration */}
      <svg
        className="absolute bottom-0 left-0 right-0 w-full opacity-[0.04]"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ height: 80 }}
      >
        <path
          d="M0 60 Q 360 0, 720 60 T 1440 60 V 120 H 0 Z"
          fill="#8B7FDE"
        />
      </svg>

      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              left: p.x,
              width: p.size,
              height: p.size,
              backgroundColor: i % 4 === 0 ? "rgba(255,179,71,0.35)" : i % 4 === 1 ? "rgba(177,156,217,0.3)" : i % 4 === 2 ? "rgba(119,221,119,0.3)" : "rgba(255,184,198,0.3)",
            }}
            animate={{
              y: [p.y, "-5%"],
              opacity: [0, 0.7, 0],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: "linear",
            }}
          />
        ))}
      </div>
    </div>
  );
}
