
// Simple in-memory audio cache for TTS to speed up repeated playback
const audioCache = new Map<string, string>();

/**
 * Preload TTS audio for a given string.
 * This should be called on hover or slightly before needed.
 * @param text The text to synthesize
 * @param voiceId The voice ID to use
 */
export const preloadTTS = async (text: string, voiceId: string = "emily"): Promise<string | null> => {
  const key = `${voiceId}-${text}`;
  
  if (audioCache.has(key)) {
    return audioCache.get(key) || null;
  }

  try {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    const res = await fetch(`${API_BASE}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voice_id: voiceId, speed: 1.0 }),
    });

    if (!res.ok) return null;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    audioCache.set(key, url);
    return url;
  } catch (err) {
    console.warn("Preload failed", err);
    return null;
  }
};

/**
 * Play a cached or new TTS audio clip.
 */
export const playCachedTTS = async (text: string, voiceId: string = "emily"): Promise<void> => {
  const url = await preloadTTS(text, voiceId);
  if (url) {
    const audio = new Audio(url);
    await audio.play().catch(() => {});
  }
};
