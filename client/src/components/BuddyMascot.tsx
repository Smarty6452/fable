"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useState } from "react";

interface BuddyMascotProps {
  buddyType: string;
  isListening: boolean;
  isSynthesizing: boolean;
  size?: number;
}

export default function BuddyMascot({ 
  buddyType, 
  isListening, 
  isSynthesizing, 
  size = 280 
}: BuddyMascotProps) {
  const [blink, setBlink] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springConfig = { damping: 25, stiffness: 150 };
  const pupilX = useSpring(mouseX, springConfig);
  const pupilY = useSpring(mouseY, springConfig);

  // Auto-blink and mouse tracking
  useEffect(() => {
    const blinkTimer = setInterval(() => {
      setBlink(true);
      setTimeout(() => setBlink(false), 150);
    }, 4000 + Math.random() * 2000);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth / 2) / 60);
      mouseY.set((e.clientY - window.innerHeight / 2) / 60);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      clearInterval(blinkTimer);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [mouseX, mouseY]);

  // Buddy definitions (SVG paths & colors)
  const getBuddyConfig = (type: string) => {
    switch (type) {
      case "cat": // Luna
        return {
          color: "#FF9F43",
          secondary: "#FFD3B6",
          ears: (
            <>
              <motion.path d="M50 80 L30 20 L90 60 Z" fill="#FF9F43" stroke="#E67E22" strokeWidth="3" />
              <motion.path d="M230 80 L250 20 L190 60 Z" fill="#FF9F43" stroke="#E67E22" strokeWidth="3" />
              <path d="M55 75 L42 35 L80 60 Z" fill="#FFD3B6" />
              <path d="M225 75 L238 35 L200 60 Z" fill="#FFD3B6" />
            </>
          ),
          faceShape: <ellipse cx="140" cy="150" rx="100" ry="90" fill="#FF9F43" stroke="#E67E22" strokeWidth="3" />,
          details: (
            <>
              <line x1="60" y1="160" x2="20" y2="150" stroke="#E67E22" strokeWidth="3" />
              <line x1="60" y1="170" x2="20" y2="180" stroke="#E67E22" strokeWidth="3" />
              <line x1="220" y1="160" x2="260" y2="150" stroke="#E67E22" strokeWidth="3" />
              <line x1="220" y1="170" x2="260" y2="180" stroke="#E67E22" strokeWidth="3" />
            </>
          )
        };
      case "robot": // Bolt
        return {
          color: "#54A0FF",
          secondary: "#A3CBFF",
          ears: (
            <>
              <rect x="20" y="80" width="20" height="60" rx="5" fill="#2E86DE" />
              <line x1="30" y1="80" x2="30" y2="30" stroke="#2E86DE" strokeWidth="4" />
              <circle cx="30" cy="30" r="10" fill="#FF6B6B" className="animate-pulse" />
              <rect x="240" y="80" width="20" height="60" rx="5" fill="#2E86DE" />
              <line x1="250" y1="80" x2="250" y2="30" stroke="#2E86DE" strokeWidth="4" />
              <circle cx="250" cy="30" r="10" fill="#FF6B6B" className="animate-pulse" />
            </>
          ),
          faceShape: (
            <g>
              <rect x="50" y="60" width="180" height="160" rx="30" fill="#54A0FF" stroke="#2E86DE" strokeWidth="4" />
              <rect x="65" y="75" width="150" height="130" rx="20" fill="#A3CBFF" opacity="0.5" />
            </g>
          ),
          details: <rect x="90" y="240" width="100" height="20" rx="10" fill="#2E86DE" />
        };
      case "puppy": // Max
        return {
          color: "#E1B12C",
          secondary: "#F8EFBA",
          ears: (
            <>
              <motion.path 
                d="M40 80 C20 80, 0 120, 20 160 C30 180, 60 160, 60 110 Z" 
                fill="#C69214" 
                animate={isListening ? { rotate: [0, -10, 0] } : {}}
                style={{ originX: "60px", originY: "80px" }}
              />
              <motion.path 
                d="M240 80 C260 80, 280 120, 260 160 C250 180, 220 160, 220 110 Z" 
                fill="#C69214"
                animate={isListening ? { rotate: [0, 10, 0] } : {}}
                style={{ originX: "220px", originY: "80px" }}
              />
            </>
          ),
          faceShape: (
            <g>
              <ellipse cx="140" cy="140" rx="90" ry="85" fill="#E1B12C" stroke="#C69214" strokeWidth="3" />
              <ellipse cx="140" cy="170" rx="40" ry="30" fill="#F8EFBA" />
            </g>
          ),
          details: null
        };
      case "panda": // Mochi
        return {
          color: "#FFFFFF",
          secondary: "#2D3436",
          ears: (
            <>
              <circle cx="50" cy="70" r="35" fill="#2D3436" />
              <circle cx="230" cy="70" r="35" fill="#2D3436" />
            </>
          ),
          faceShape: <ellipse cx="140" cy="150" rx="100" ry="90" fill="white" stroke="#2D3436" strokeWidth="4" />,
          details: (
            <>
              <ellipse cx="100" cy="140" rx="25" ry="30" fill="#2D3436" transform="rotate(-20 100 140)" />
              <ellipse cx="180" cy="140" rx="25" ry="30" fill="#2D3436" transform="rotate(20 180 140)" />
            </>
          )
        };
      default: // Wolfie
        return {
          color: "#8B7FDE",
          secondary: "#C4BBFF",
          ears: (
            <>
              <path d="M60 90 L40 20 L100 70 Z" fill="#8B7FDE" stroke="#5F27CD" strokeWidth="3" />
              <path d="M220 90 L240 20 L180 70 Z" fill="#8B7FDE" stroke="#5F27CD" strokeWidth="3" />
              <path d="M65 85 L50 35 L90 70 Z" fill="#C4BBFF" />
              <path d="M215 85 L230 35 L190 70 Z" fill="#C4BBFF" />
            </>
          ),
          faceShape: (
            <g>
              <ellipse cx="140" cy="150" rx="85" ry="80" fill="#8B7FDE" stroke="#5F27CD" strokeWidth="3" />
              <ellipse cx="140" cy="140" rx="90" ry="50" fill="#8B7FDE" />
              <ellipse cx="140" cy="175" rx="35" ry="30" fill="#C4BBFF" />
            </g>
          ),
          details: (
            <>
              <path d="M50 150 L20 140" stroke="#5F27CD" strokeWidth="3" />
              <path d="M50 160 L20 170" stroke="#5F27CD" strokeWidth="3" />
              <path d="M230 150 L260 140" stroke="#5F27CD" strokeWidth="3" />
              <path d="M230 160 L260 170" stroke="#5F27CD" strokeWidth="3" />
            </>
          )
        };
    }
  };

  const config = getBuddyConfig(buddyType);

  return (
    <motion.div 
      className="relative select-none"
      style={{ width: size, height: size }}
      animate={isSynthesizing ? { scale: [1, 1.05, 1], y: [0, -5, 0] } : { y: [0, -10, 0] }}
      transition={isSynthesizing 
        ? { duration: 0.4, repeat: Infinity } 
        : { duration: 3, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <svg viewBox="0 0 280 280" className="w-full h-full drop-shadow-2xl overflow-visible">
        {/* Glow Aura */}
        <motion.ellipse 
          cx="140" cy="150" rx="120" ry="110" 
          fill={config.color} 
          opacity="0.15" 
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        <motion.ellipse 
          cx="140" cy="150" rx="90" ry="80" 
          fill={config.color} 
          opacity="0.2" 
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />

        {/* Shadow */}
        <ellipse cx="140" cy="260" rx="80" ry="15" fill="rgba(0,0,0,0.15)" />

        {/* Ears (Behind head) */}
        {config.ears}

        {/* Head Base */}
        {config.faceShape}

        {/* Eyes Group */}
        <g>
          {/* Left Eye */}
          <g transform="translate(100, 130)">
            {blink ? (
              <path d="M-15 0 Q0 10, 15 0" stroke="#2D3436" strokeWidth="4" fill="none" strokeLinecap="round" />
            ) : (
              <>
                <ellipse role="img" cx="0" cy="0" rx="14" ry="16" fill="white" />
                <motion.circle 
                  cx="0" cy="0" r="7" fill="#2D3436" 
                  style={{ x: pupilX, y: pupilY }}
                  animate={isListening ? { scale: 1.2 } : { scale: 1 }}
                />
                <motion.circle cx="4" cy="-4" r="3" fill="white" style={{ x: pupilX, y: pupilY }} />
              </>
            )}
          </g>

          {/* Right Eye */}
          <g transform="translate(180, 130)">
            {blink ? (
              <path d="M-15 0 Q0 10, 15 0" stroke="#2D3436" strokeWidth="4" fill="none" strokeLinecap="round" />
            ) : (
              <>
                <ellipse role="img" cx="0" cy="0" rx="14" ry="16" fill="white" />
                <motion.circle 
                  cx="0" cy="0" r="7" fill="#2D3436" 
                  style={{ x: pupilX, y: pupilY }}
                  animate={isListening ? { scale: 1.2 } : { scale: 1 }}
                />
                <motion.circle cx="4" cy="-4" r="3" fill="white" style={{ x: pupilX, y: pupilY }} />
              </>
            )}
          </g>
        </g>

        {/* Nose */}
        <ellipse cx="140" cy="165" rx="12" ry="8" fill="#2D3436" />

        {/* Mouth */}
        <motion.path
          fill={isSynthesizing ? "#D63031" : "none"}
          stroke="#2D3436"
          strokeWidth="3"
          strokeLinecap="round"
          initial="idle"
          animate={isSynthesizing ? "talking" : "idle"}
          variants={{
            idle: { 
              d: "M125 185 Q140 195, 155 185",
              transition: { duration: 0.2 }
            },
            talking: {
              d: [
                "M125 185 Q140 195, 155 185", 
                "M120 185 Q140 210, 160 185", 
                "M125 185 Q140 190, 155 185"
              ],
              transition: { 
                duration: 0.3, 
                repeat: Infinity, 
                repeatType: "mirror" 
              }
            }
          }}
        />

        {/* Extra Details (Whiskers, cheeks etc) */}
        {config.details}

        {/* Blush */}
        <ellipse cx="80" cy="160" rx="12" ry="8" fill="#FF7675" opacity="0.4" />
        <ellipse cx="200" cy="160" rx="12" ry="8" fill="#FF7675" opacity="0.4" />
      </svg>
    </motion.div>
  );
}
