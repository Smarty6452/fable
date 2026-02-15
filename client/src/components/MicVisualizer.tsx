import { motion } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";

function MicVisualizer({ stream }: { stream: MediaStream | null }) {
  const [micLevel, setMicLevel] = useState(0);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) {
      setMicLevel(0);
      return;
    }

    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioCtx = new AudioContext();
      audioContextRef.current = audioCtx;
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 32;
      analyserRef.current = analyser;
      
      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        analyser.getByteFrequencyData(dataArray);
        const sum = dataArray.reduce((a, b) => a + b, 0);
        const avg = sum / bufferLength;
        setMicLevel(avg);
        animationFrameRef.current = requestAnimationFrame(updateVolume);
      };
      updateVolume();

    } catch (e) {
      // Audio Context failed — visualizer disabled
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, [stream]);

  if (!stream) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="flex items-center gap-3 bg-white/80 backdrop-blur-md px-5 py-2 rounded-full border border-red-100 shadow-sm text-red-500"
    >
        <div className="flex items-center gap-1 h-6">
        <motion.div 
            animate={{ height: Math.min(20, Math.max(4, micLevel * 0.2)) }} 
            className="w-1.5 bg-red-400 rounded-full" 
        />
        <motion.div 
            animate={{ height: Math.min(24, Math.max(8, micLevel * 0.4)) }} 
            className="w-1.5 bg-red-500 rounded-full" 
        />
        <motion.div 
            animate={{ height: Math.min(20, Math.max(4, micLevel * 0.25)) }} 
            className="w-1.5 bg-red-400 rounded-full" 
        />
        <motion.div 
            animate={{ height: Math.min(16, Math.max(4, micLevel * 0.15)) }} 
            className="w-1.5 bg-red-300 rounded-full" 
        />
        </div>
        <span className="text-sm font-bold uppercase tracking-widest animate-pulse">Listening...</span>
    </motion.div>
  );
}

export default memo(MicVisualizer);
