"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useState, useEffect } from "react";

export default function WolfieMascot({ size = 280 }: { size?: number }) {
  const [isBlinking, setIsBlinking] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const pupilX = useSpring(mouseX, springConfig);
  const pupilY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set((e.clientX - window.innerWidth / 2) / 50);
      mouseY.set((e.clientY - window.innerHeight / 2) / 50);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  useEffect(() => {
    const blink = () => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 150);
    };
    const interval = setInterval(blink, 3000 + Math.random() * 2000);
    return () => clearInterval(interval);
  }, []);

  const s = size / 280; // scale factor

  return (
    <motion.div
      className="relative select-none"
      style={{ width: size, height: size }}
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full drop-shadow-2xl"
      >
        {/* Glow Aura */}
        <motion.ellipse 
          cx="140" cy="140" rx="110" ry="100" 
          fill="#8B7FDE" 
          opacity="0.12" 
          animate={{ scale: [1, 1.08, 1], opacity: [0.08, 0.15, 0.08] }}
          transition={{ duration: 4, repeat: Infinity }}
        />
        
        {/* Shadow under wolf */}
        <ellipse cx="140" cy="265" rx="60" ry="10" fill="rgba(0,0,0,0.08)" />

        {/* Tail */}
        <motion.g
          animate={{ rotate: [-8, 8, -8] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "55%", originY: "80%" }}
        >
          <path
            d="M200 195 C230 175, 255 160, 245 135 C240 120, 225 125, 220 140 C215 155, 205 170, 195 185"
            fill="#7C6FD4"
            stroke="#6558C4"
            strokeWidth="2"
          />
        </motion.g>

        {/* Body */}
        <motion.g
          animate={{ scaleY: [1, 1.02, 1] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "50%", originY: "100%" }}
        >
          <ellipse cx="140" cy="210" rx="55" ry="48" fill="#8B7FDE" />
          {/* Belly */}
          <ellipse cx="140" cy="220" rx="35" ry="32" fill="#C4BBFF" />

          {/* Left Paw */}
          <ellipse cx="105" cy="250" rx="18" ry="12" fill="#8B7FDE" stroke="#7C6FD4" strokeWidth="2" />
          <circle cx="98" cy="248" r="4" fill="#C4BBFF" />
          <circle cx="105" cy="245" r="4" fill="#C4BBFF" />
          <circle cx="112" cy="248" r="4" fill="#C4BBFF" />

          {/* Right Paw */}
          <ellipse cx="175" cy="250" rx="18" ry="12" fill="#8B7FDE" stroke="#7C6FD4" strokeWidth="2" />
          <circle cx="168" cy="248" r="4" fill="#C4BBFF" />
          <circle cx="175" cy="245" r="4" fill="#C4BBFF" />
          <circle cx="182" cy="248" r="4" fill="#C4BBFF" />
        </motion.g>

        {/* Head */}
        <motion.g
          animate={{ rotate: [-1, 1, -1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ originX: "50%", originY: "70%" }}
        >
          {/* Left Ear */}
          <motion.g
            animate={{ rotate: [-3, 5, -3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            style={{ originX: "35%", originY: "60%" }}
          >
            <path
              d="M80 110 L62 45 L115 90 Z"
              fill="#8B7FDE"
              stroke="#7C6FD4"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M85 105 L72 58 L110 92 Z"
              fill="#FFB347"
              opacity="0.7"
            />
          </motion.g>

          {/* Right Ear */}
          <motion.g
            animate={{ rotate: [3, -5, 3] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
            style={{ originX: "65%", originY: "60%" }}
          >
            <path
              d="M200 110 L218 45 L165 90 Z"
              fill="#8B7FDE"
              stroke="#7C6FD4"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path
              d="M195 105 L208 58 L170 92 Z"
              fill="#FFB347"
              opacity="0.7"
            />
          </motion.g>

          {/* Head shape */}
          <ellipse cx="140" cy="130" rx="68" ry="62" fill="#8B7FDE" />

          {/* Face fur patch */}
          <ellipse cx="140" cy="138" rx="50" ry="46" fill="#9B90E8" />

          {/* Snout / Muzzle */}
          <ellipse cx="140" cy="155" rx="30" ry="22" fill="#C4BBFF" />

          {/* Cheek blush - left */}
          <ellipse cx="98" cy="145" rx="14" ry="10" fill="#FFB8C6" opacity="0.5" />
          {/* Cheek blush - right */}
          <ellipse cx="182" cy="145" rx="14" ry="10" fill="#FFB8C6" opacity="0.5" />

          {/* Eyes */}
          {/* Left eye */}
          <g>
            {isBlinking ? (
              <path d="M110 125 Q120 130, 130 125" stroke="#4A3D8F" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="118" cy="122" rx="14" ry="15" fill="white" />
                <motion.circle cx="120" cy="123" r="9" fill="#2D2066" style={{ x: pupilX, y: pupilY }} />
                <motion.circle cx="123" cy="119" r="4" fill="white" opacity="0.9" style={{ x: pupilX, y: pupilY }} />
                <motion.circle cx="116" cy="126" r="2" fill="white" opacity="0.5" style={{ x: pupilX, y: pupilY }} />
              </>
            )}
          </g>

          {/* Right eye */}
          <g>
            {isBlinking ? (
              <path d="M150 125 Q160 130, 170 125" stroke="#4A3D8F" strokeWidth="3" strokeLinecap="round" fill="none" />
            ) : (
              <>
                <ellipse cx="162" cy="122" rx="14" ry="15" fill="white" />
                <motion.circle cx="160" cy="123" r="9" fill="#2D2066" style={{ x: pupilX, y: pupilY }} />
                <motion.circle cx="163" cy="119" r="4" fill="white" opacity="0.9" style={{ x: pupilX, y: pupilY }} />
                <motion.circle cx="156" cy="126" r="2" fill="white" opacity="0.5" style={{ x: pupilX, y: pupilY }} />
              </>
            )}
          </g>

          {/* Eyebrows */}
          <path d="M104 108 Q118 100, 132 108" stroke="#6558C4" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M148 108 Q162 100, 176 108" stroke="#6558C4" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Nose */}
          <ellipse cx="140" cy="148" rx="8" ry="6" fill="#4A3D8F" />
          <ellipse cx="139" cy="146" rx="3" ry="2" fill="#6558C4" opacity="0.6" />

          {/* Mouth */}
          <path d="M132 157 Q140 166, 148 157" stroke="#4A3D8F" strokeWidth="2.5" strokeLinecap="round" fill="none" />

          {/* Whisker dots */}
          <circle cx="115" cy="153" r="1.5" fill="#7C6FD4" />
          <circle cx="108" cy="149" r="1.5" fill="#7C6FD4" />
          <circle cx="165" cy="153" r="1.5" fill="#7C6FD4" />
          <circle cx="172" cy="149" r="1.5" fill="#7C6FD4" />
        </motion.g>
      </svg>

      {/* Sparkle effects around wolf */}
      {[
        { x: "10%", y: "15%", delay: 0, size: 16 },
        { x: "85%", y: "10%", delay: 0.8, size: 14 },
        { x: "5%", y: "70%", delay: 1.5, size: 12 },
        { x: "90%", y: "65%", delay: 2.2, size: 15 },
      ].map((sparkle, i) => (
        <motion.div
          key={i}
          className="absolute text-yellow-400 pointer-events-none"
          style={{ left: sparkle.x, top: sparkle.y, fontSize: sparkle.size }}
          animate={{
            scale: [0, 1.2, 0],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            delay: sparkle.delay,
            repeatDelay: 1.5,
          }}
        >
          ✦
        </motion.div>
      ))}
    </motion.div>
  );
}
