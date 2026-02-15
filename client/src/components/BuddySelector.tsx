"use client";

import { motion } from "framer-motion";

export const BUDDIES = [
  { id: "wolf", name: "Wolfie", emoji: "🐺", color: "bg-slate-100", textColor: "text-slate-600" },
  { id: "robot", name: "Bolt", emoji: "🤖", color: "bg-blue-100", textColor: "text-blue-600" },
  { id: "cat", name: "Luna", emoji: "🐱", color: "bg-orange-100", textColor: "text-orange-600" },
  { id: "puppy", name: "Max", emoji: "🐶", color: "bg-yellow-100", textColor: "text-yellow-600" },
  { id: "panda", name: "Mochi", emoji: "🐼", color: "bg-emerald-100", textColor: "text-emerald-600" },
];


export default function BuddySelector({ onSelect, selectedId }: { onSelect: (id: string) => void, selectedId: string }) {
  return (
    <div className="flex gap-4 justify-center py-4">
      {BUDDIES.map((buddy) => (
        <motion.button
          key={buddy.id}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => onSelect(buddy.id)}
          className={`p-4 rounded-3xl flex flex-col items-center gap-2 border-4 transition-all focus:outline-none ${
            selectedId === buddy.id 
              ? `border-primary shadow-lg ${buddy.color.replace('bg-', 'bg-')}` 
              : "border-transparent bg-white/50 opacity-60 hover:opacity-100"
          }`}
          suppressHydrationWarning
        >
          <span className="text-4xl">{buddy.emoji}</span>
          <span className="text-sm font-bold">{buddy.name}</span>
        </motion.button>
      ))}
    </div>
  );
}
