
// In-memory audio cache for TTS to speed up repeated playback
const audioCache = new Map<string, string>();
// Track in-flight requests to avoid duplicate fetches
const pendingRequests = new Map<string, Promise<string | null>>();

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

/**
 * Preload TTS audio for a given string.
 * Deduplicates concurrent requests for the same text+voice.
 */
export const preloadTTS = async (text: string, voiceId: string = "lauren", speed: number = 0.9): Promise<string | null> => {
  const key = `${voiceId}-${text}`;

  // Return from cache instantly
  if (audioCache.has(key)) {
    return audioCache.get(key) || null;
  }

  // Deduplicate: if this exact request is already in flight, wait for it
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key)!;
  }

  const fetchAudio = async (attempt = 0): Promise<string | null> => {
    try {
      const res = await fetch(`${API_BASE}/tts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice_id: voiceId, speed }),
      });

      if (!res.ok) {
        if (attempt < 1) return fetchAudio(attempt + 1);
        return null;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      audioCache.set(key, url);
      return url;
    } catch (err) {
      if (attempt < 1) return fetchAudio(attempt + 1);
      // TTS preload failed silently
      return null;
    }
  };

  const promise = fetchAudio();
  pendingRequests.set(key, promise);

  promise.finally(() => {
    pendingRequests.delete(key);
  });

  return promise;
};

let currentAudio: HTMLAudioElement | null = null;

/**
 * Play a cached or new TTS audio clip.
 * Returns a promise that resolves when audio finishes playing.
 */
export const playCachedTTS = async (text: string, voiceId: string = "lauren", speed: number = 0.9): Promise<void> => {
  const url = await preloadTTS(text, voiceId, speed);
  if (!url) return;

  // Stop any currently playing TTS audio
  stopAllTTS();

  const audio = new Audio(url);
  currentAudio = audio;

  return new Promise((resolve) => {
    audio.onended = () => {
      currentAudio = null;
      resolve();
    };
    audio.onerror = () => {
      currentAudio = null;
      resolve();
    };

    audio.play().catch(() => {
      currentAudio = null;
      resolve();
    });
  });
};

/**
 * Stop any current TTS playback immediately
 */
export const stopAllTTS = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null;
  }
};

/**
 * Preload multiple phrases in the background (staggered to avoid API limits)
 */
export const preloadBatch = (items: { text: string; voiceId: string }[], delayMs = 500) => {
  items.forEach((item, i) => {
    setTimeout(() => {
      preloadTTS(item.text, item.voiceId);
    }, i * delayMs);
  });
};
