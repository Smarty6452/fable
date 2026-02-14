import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are a cheerful, patient speech therapy companion for children aged 3–8 named Foxy.

Rules:
- Always encourage before correcting.
- Never say "wrong" or "no."
- If pronunciation is unclear, gently model the word slowly with exaggerated phonetics.
- Break difficult sounds into stretched phonetics (e.g., "ssssss-un" for "sun").
- Celebrate effort, not perfection.
- Keep sentences short and simple (under 20 words).
- If interrupted, pause and respond naturally.
- Maintain warm, playful tone.
- Use simple words a 3-8 year old would understand.
- Include encouraging phrases like "Great try!", "You're doing amazing!", "Let's try together!"

Session flow:
1. Greet the child warmly
2. Introduce today's target sound
3. Ask for examples
4. Gently correct and model
5. Celebrate success
6. Offer to continue or try a new sound

Respond in 1-2 short sentences maximum. Be enthusiastic but calm.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { transcript, targetSound, mode, sessionHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SMALLEST_API_KEY = Deno.env.get("SMALLEST_AI_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Build messages for AI
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (targetSound) {
      messages.push({
        role: "system",
        content: `Current target sound: "${targetSound}". Focus practice on words containing this sound.`,
      });
    }

    if (mode === "sound_quest") {
      messages.push({
        role: "system",
        content: `We're playing Sound Quest! The child needs to find words starting with the "${targetSound}" sound. Celebrate each correct word enthusiastically. If they get stuck, give hints like "What about something in the sky?" Keep it fun and game-like!`,
      });
    }

    // Add session history for context
    if (sessionHistory && sessionHistory.length > 0) {
      for (const entry of sessionHistory.slice(-6)) {
        messages.push({ role: entry.role, content: entry.content });
      }
    }

    messages.push({ role: "user", content: transcript || "Hi!" });

    // Get AI response
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limited, please try again shortly." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Credits needed. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await aiResponse.text();
      console.error("AI error:", aiResponse.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiData = await aiResponse.json();
    const responseText =
      aiData.choices?.[0]?.message?.content || "Great job! Let's keep going!";

    // Generate TTS with smallest.ai Lightning v3.1 if key is available
    let audioBase64: string | null = null;
    if (SMALLEST_API_KEY) {
      try {
        const ttsResponse = await fetch(
          "https://waves-api.smallest.ai/api/v1/lightning-v3.1/stream",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${SMALLEST_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              text: responseText.replace(/[*#_~`]/g, ''),
              voice_id: "sophia",
              sample_rate: 24000,
              speed: 0.9,
              language: "en",
              output_format: "wav",
            }),
          }
        );

        if (ttsResponse.ok) {
          const responseBody = await ttsResponse.text();
          const audioChunks: string[] = [];
          for (const line of responseBody.split("\n")) {
            const trimmed = line.trim();
            if (trimmed.startsWith("data:")) {
              const jsonStr = trimmed.slice(5).trim();
              if (jsonStr && jsonStr !== "[DONE]") {
                try {
                  const parsed = JSON.parse(jsonStr);
                  if (parsed.audio) {
                    audioChunks.push(parsed.audio);
                  }
                } catch {
                  // raw base64 chunk
                  audioChunks.push(jsonStr);
                }
              }
            }
          }
          if (audioChunks.length > 0) {
            // Decode all base64 chunks, concatenate raw bytes, re-encode
            const allBytes: number[] = [];
            for (const chunk of audioChunks) {
              const binary = atob(chunk);
              for (let i = 0; i < binary.length; i++) {
                allBytes.push(binary.charCodeAt(i));
              }
            }
            // Create WAV header for raw PCM data
            const sampleRate = 24000;
            const numChannels = 1;
            const bitsPerSample = 16;
            const dataSize = allBytes.length;
            const header = new ArrayBuffer(44);
            const view = new DataView(header);
            const writeString = (offset: number, str: string) => {
              for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
            };
            writeString(0, 'RIFF');
            view.setUint32(4, 36 + dataSize, true);
            writeString(8, 'WAVE');
            writeString(12, 'fmt ');
            view.setUint32(16, 16, true);
            view.setUint16(20, 1, true);
            view.setUint16(22, numChannels, true);
            view.setUint32(24, sampleRate, true);
            view.setUint32(28, sampleRate * numChannels * bitsPerSample / 8, true);
            view.setUint16(32, numChannels * bitsPerSample / 8, true);
            view.setUint16(34, bitsPerSample, true);
            writeString(36, 'data');
            view.setUint32(40, dataSize, true);
            const headerBytes = new Uint8Array(header);
            let binaryStr = "";
            for (let i = 0; i < headerBytes.length; i++) binaryStr += String.fromCharCode(headerBytes[i]);
            for (let i = 0; i < allBytes.length; i++) binaryStr += String.fromCharCode(allBytes[i]);
            audioBase64 = btoa(binaryStr);
          }
        } else {
          console.error("TTS error:", ttsResponse.status, await ttsResponse.text());
        }
      } catch (ttsErr) {
        console.error("TTS fetch error:", ttsErr);
      }
    }

    return new Response(
      JSON.stringify({
        text: responseText,
        audio: audioBase64,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("speech-therapy error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
