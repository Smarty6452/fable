"use client";

import { useMemo } from 'react';
import { motion } from 'framer-motion';

export default function AudioVisualizer({ isListening }: { isListening: boolean }) {
  const bars = useMemo(() => {
    return Array.from({ length: 48 }, (_, i) => {
      const centerDist = Math.abs(i - 24) / 24;
      const baseHeight = 6 + (1 - centerDist) * 14;
      const maxHeight = 20 + (1 - centerDist) * 40;
      const delay = (i * 0.04) % 1.2;
      return { baseHeight, maxHeight, delay, centerDist };
    });
  }, []);

  return (
    <div className="bg-white/30 backdrop-blur-md p-3 rounded-[1.5rem] border-2 border-white/50 shadow-inner mt-4">
      <div className="flex items-center justify-center gap-[3px] h-[80px] w-[360px]">
        {bars.map((bar, i) => {
          const r = Math.round(255 * (1 - bar.centerDist * 0.3));
          const g = Math.round(140 + 60 * bar.centerDist);
          const b = Math.round(20 + 50 * bar.centerDist);

          return (
            <motion.div
              key={i}
              className="rounded-full"
              style={{
                width: 5,
                backgroundColor: `rgba(${r}, ${g}, ${b}, 0.85)`,
              }}
              animate={isListening ? {
                height: [bar.baseHeight, bar.maxHeight, bar.baseHeight * 1.2, bar.maxHeight * 0.7, bar.baseHeight],
              } : {
                height: bar.baseHeight,
              }}
              transition={isListening ? {
                duration: 0.6 + bar.delay * 0.3,
                repeat: Infinity,
                repeatType: "mirror",
                ease: "easeInOut",
                delay: bar.delay,
              } : {
                duration: 0.4,
                ease: "easeOut",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
