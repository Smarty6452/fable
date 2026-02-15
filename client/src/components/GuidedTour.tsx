"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, ArrowLeft } from "lucide-react";

export interface TourStep {
  target: string; // CSS selector
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right";
}

interface GuidedTourProps {
  steps: TourStep[];
  onComplete: () => void;
  storageKey: string;
}

export default function GuidedTour({ steps, onComplete, storageKey }: GuidedTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(storageKey);
    if (!hasSeenTour) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [storageKey]);

  useEffect(() => {
    if (isOpen && steps[currentStep]) {
      const target = document.querySelector(steps[currentStep].target);
      if (target) {
        const rect = target.getBoundingClientRect();
        setTargetRect(rect);
        target.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [isOpen, currentStep, steps]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
    onComplete();
  };

  const handleSkip = () => {
    localStorage.setItem(storageKey, "true");
    setIsOpen(false);
  };

  if (!isOpen || !steps[currentStep] || !targetRect) return null;

  const step = steps[currentStep];
  const position = step.position || "bottom";

  // Calculate tooltip position
  let tooltipStyle: React.CSSProperties = {};
  const offset = 20;

  if (position === "bottom") {
    tooltipStyle = {
      top: targetRect.bottom + offset,
      left: targetRect.left + targetRect.width / 2,
      transform: "translateX(-50%)",
    };
  } else if (position === "top") {
    tooltipStyle = {
      top: targetRect.top - offset,
      left: targetRect.left + targetRect.width / 2,
      transform: "translate(-50%, -100%)",
    };
  } else if (position === "left") {
    tooltipStyle = {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.left - offset,
      transform: "translate(-100%, -50%)",
    };
  } else if (position === "right") {
    tooltipStyle = {
      top: targetRect.top + targetRect.height / 2,
      left: targetRect.right + offset,
      transform: "translateY(-50%)",
    };
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Click Handler Overlay (Transparent) */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 cursor-pointer"
            onClick={handleSkip}
          />

          {/* Highlight & Dimmer */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              scale: 1,
              boxShadow: "0 0 0 9999px rgba(0,0,0,0.85)" 
            }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="fixed z-50 pointer-events-none"
            style={{
              top: targetRect.top - 8,
              left: targetRect.left - 8,
              width: targetRect.width + 16,
              height: targetRect.height + 16,
              borderRadius: "1.5rem",
            }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            {/* Pulsing Border Glow */}
            <motion.div
              className="absolute inset-0 rounded-[1.5rem] border-[4px] border-white"
              animate={{ 
                boxShadow: [
                  "0 0 20px rgba(255,255,255,0.3)",
                  "0 0 40px rgba(255,255,255,0.6)",
                  "0 0 20px rgba(255,255,255,0.3)"
                ] 
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
          </motion.div>

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 max-w-sm"
            style={tooltipStyle}
          >
            <div className="bg-white rounded-3xl p-6 shadow-2xl border-4 border-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className="text-xs font-black uppercase tracking-widest text-primary">
                    Step {currentStep + 1} of {steps.length}
                  </span>
                  <h3 className="text-2xl font-black text-slate-800 mt-1">{step.title}</h3>
                </div>
                <button
                  onClick={handleSkip}
                  className="text-slate-400 hover:text-slate-600 transition-colors p-1"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed mb-6">{step.content}</p>
              <div className="flex items-center justify-between">
                <button
                  onClick={handleSkip}
                  className="text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Skip Tour
                </button>
                <div className="flex gap-2">
                  {currentStep > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handlePrev}
                      className="px-4 py-2 bg-slate-100 rounded-2xl text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors flex items-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      Back
                    </motion.button>
                  )}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNext}
                    className="px-4 py-2 bg-gradient-to-r from-primary to-orange-500 rounded-2xl text-white font-bold text-sm shadow-lg flex items-center gap-2"
                  >
                    {currentStep === steps.length - 1 ? "Finish" : "Next"}
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Pre-defined tour steps for the app
export const HOME_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='start-button']",
    title: "Welcome to Fable! 🎉",
    content: "Click here to begin your speech adventure with Wolfie! We'll practice sounds together.",
    position: "bottom",
  },
  {
    target: "[data-tour='parent-portal']",
    title: "Parent Dashboard",
    content: "Parents can track progress, see success rates, and identify difficult sounds here.",
    position: "bottom",
  },
];

export const PLAY_TOUR_STEPS: TourStep[] = [
  {
    target: "[data-tour='xp-bar']",
    title: "Your Progress",
    content: "Earn XP by completing missions! Level up and unlock new chapters.",
    position: "bottom",
  },
  {
    target: "[data-tour='buddy-avatar']",
    title: "Meet Your Buddy!",
    content: "Your AI friend will talk to you and help you practice. Listen carefully!",
    position: "bottom",
  },
  {
    target: "[data-tour='mic-button']",
    title: "Speak Here! 🎤",
    content: "Tap the microphone and say the word. Wolfie will listen and give you feedback!",
    position: "top",
  },
  {
    target: "[data-tour='tip-card']",
    title: "Pronunciation Tips",
    content: "Need help? These tips show you exactly how to form each sound with your mouth!",
    position: "top",
  },
];
