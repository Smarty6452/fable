import { useState } from "react";
import mascotImg from "@/assets/mascot-fox.png";

interface MascotProps {
  mood?: "happy" | "listening" | "encouraging" | "celebrating";
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Mascot = ({ mood = "happy", size = "md", className = "" }: MascotProps) => {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-56 h-56",
  };

  const moodAnimations = {
    happy: "bounce-gentle",
    listening: "float",
    encouraging: "wiggle",
    celebrating: "bounce-gentle sparkle",
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      <img
        src={mascotImg}
        alt="Foxy the Speech Buddy"
        className={`${sizeClasses[size]} ${moodAnimations[mood]} object-contain drop-shadow-lg`}
      />
      {mood === "celebrating" && (
        <div className="absolute -top-2 -right-2">
          <span className="text-3xl sparkle">⭐</span>
        </div>
      )}
      {mood === "listening" && (
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2">
          <div className="flex items-end gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="w-1.5 bg-primary rounded-full wave-bar"
                style={{
                  height: "16px",
                  animationDelay: `${i * 0.15}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Mascot;
