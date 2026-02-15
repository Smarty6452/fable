
// Simple in-memory audio cache for TTS to speed up repeated playback
const audioCache = new Map<string, string>();

/**
 * Preload TTS audio for a given string.
 * This should be called on hover or slightly before needed.
 * @param text The text to synthesize
 * @param voiceId The voice ID to use
 */
export const preloadTTS = async (text: string, voiceId: string = "lauren"): Promise<string | null> => {
  const key = `${voiceId}-${text}`;
  
  if (audioCache.has(key)) {
    return audioCache.get(key) || null;
  }

  const fetchAudio = async (attempt = 0): Promise<string | null> => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
      const res = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: voiceId, speed: 0.9 }),
      });

      if (!res.ok) {
        if (attempt < 2) return fetchAudio(attempt + 1);
        return null;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioCache.set(key, url);
      return url;
    } catch (err) {
      if (attempt < 2) return fetchAudio(attempt + 1);
      console.warn("Preload failed after retries", err);
      return null;
    }
  };

  return fetchAudio();
};

let currentAudio: HTMLAudioElement | null = null;

/**
 * Play a cached or new TTS audio clip.
 */
export const playCachedTTS = async (text: string, voiceId: string = "lauren"): Promise<void> => {
  const url = await preloadTTS(text, voiceId);
  if (url) {
    // Stop any currently playing TTS audio
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(url);
    currentAudio = audio;
    
    // Use a slightly faster rate for better realism in some cases, 
    // but Smallest AI handles speed in the API call.
    await audio.play().catch((err) => {
      console.warn("Audio play failed (maybe user hasn't clicked yet)", err);
    });
  }
};
