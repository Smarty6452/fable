import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';

// Robust env loading - try multiple paths for monorepo compatibility
const envPaths = [
  path.resolve(process.cwd(), '..', 'client', '.env'),
  path.resolve(process.cwd(), 'client', '.env'),
  path.resolve(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  const result = dotenv.config({ path: envPath });
  if (!result.error) {
    console.log(`📁 Loaded env from: ${envPath}`);
    break;
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.warn('⚠️ MONGODB_URI not found, using local fallback');
}
mongoose.connect(MONGODB_URI || 'mongodb://localhost:27017/kidbuddy')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Models
const SessionSchema = new mongoose.Schema({
  kidName: { type: String, default: 'Little Explorer' },
  buddy: { type: String, default: 'wolf' },
  sound: String,
  word: String,
  attempts: Number,
  success: Boolean,
  transcript: String,
  isNearMiss: Boolean,
  xpEarned: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});
const Session = mongoose.model('Session', SessionSchema);

// Fetch available voices from Smallest AI
app.get('/api/voices', async (req, res) => {
  const apiKey = process.env.SMALLEST_AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const model = (req.query.model as string) || 'lightning-v3.1';
    const response = await axios({
      method: 'get',
      url: `https://waves-api.smallest.ai/api/v1/voices?model=${model}`,
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    res.json(response.data);
  } catch (error: any) {
    console.error('❌ Voices fetch error:', error.response?.status, error.message);
    // Return known working voices as fallback
    res.json({
      voices: [
        { voiceId: 'lauren', displayName: 'Lauren (Best for Kids)' },
        { voiceId: 'emily', displayName: 'Emily (Friendly)' },
        { voiceId: 'amx', displayName: 'AMX (Fun & Clear)' },
        { voiceId: 'sarah', displayName: 'Sarah (Natural)' },
        { voiceId: 'nyah', displayName: 'Nyah (Energetic)' },
        { voiceId: 'onyx', displayName: 'Onyx (Robot/Strong)' },
      ],
      fallback: true,
    });
  }
});

// TTS Route - Smallest AI Waves (lightning-large model)
app.post('/api/tts', async (req, res) => {
  const apiKey = process.env.SMALLEST_AI_API_KEY;

  if (!apiKey) {
    console.error('❌ SMALLEST_AI_API_KEY not found in environment');
    return res.status(500).json({
      error: 'API key not configured',
      hint: 'SMALLEST_AI_API_KEY is missing from .env',
      useFallback: true,
    });
  }

  const { text, voice_id = 'emily', speed = 0.9 } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required', useFallback: true });
  }

  const requestSpeech = async (targetVoice: string) => {
    console.log(`🎙️ TTS: model=lightning-v3.1 | voice=${targetVoice} | text="${text.substring(0, 30)}..."`);
    // Using lightning-v3.1 for better quality and compatibility with voices like lauren
    return await axios({
      method: 'post',
      url: 'https://waves-api.smallest.ai/api/v1/lightning-v3.1/get_speech',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      data: {
        text,
        voice_id: targetVoice,
        sample_rate: 24000,
        speed: speed,
        language: 'en',
        output_format: 'wav',
      },
      responseType: 'arraybuffer',
      timeout: 30000,
    });
  };

  try {
    let response;
    try {
      response = await requestSpeech(voice_id);
    } catch (error: any) {
      if (error.response?.status === 400 && voice_id !== 'lauren') {
        console.warn(`⚠️ Voice "${voice_id}" invalid for model, falling back to "lauren"`);
        try {
          response = await requestSpeech('lauren');
        } catch (innerError: any) {
          console.warn(`⚠️ "lauren" also failed, falling back to "amx"`);
          response = await requestSpeech('amx');
        }
      } else {
        throw error;
      }
    }

    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Length', response.data.byteLength);
    res.send(Buffer.from(response.data));

  } catch (error: any) {
    const status = error.response?.status;
    console.error(`❌ TTS Error [${status || 'network'}]: ${error.message}`);

    if (error.response?.data) {
      try {
        const errorBody = Buffer.from(error.response.data).toString('utf-8');
        console.error('API Response Body:', errorBody);
      } catch (_) {}
    }

    res.status(status || 500).json({
      error: error.message,
      status,
      hint: status === 400 ? 'Invalid request - voice_id may not be valid for this model' : 'TTS service unavailable',
      useFallback: true,
    });
  }
});

// Sessions API
app.post('/api/sessions', async (req, res) => {
  try {
    const session = await Session.create(req.body);
    res.json({ success: true, data: session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/sessions', async (req, res) => {
  try {
    const { kid, limit = 50 } = req.query;
    const filter = kid ? { kidName: kid } : {};
    const sessions = await Session.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit));
    res.json({ success: true, data: sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Stats API for parent dashboard
app.get('/api/stats', async (req, res) => {
  try {
    const { kid } = req.query;
    const filter = kid ? { kidName: kid } : {};
    const sessions = await Session.find(filter).sort({ createdAt: -1 });

    const total = sessions.length;
    const successes = sessions.filter(s => s.success).length;
    const nearMisses = sessions.filter(s => s.isNearMiss).length;

    // Sound breakdown
    const soundMap: Record<string, { total: number; success: number }> = {};
    for (const s of sessions) {
      if (!s.sound) continue;
      if (!soundMap[s.sound]) soundMap[s.sound] = { total: 0, success: 0 };
      soundMap[s.sound].total++;
      if (s.success) soundMap[s.sound].success++;
    }

    // Daily activity (last 7 days)
    const dailyActivity: Record<string, number> = {};
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      dailyActivity[d.toISOString().split('T')[0]] = 0;
    }
    for (const s of sessions) {
      const day = new Date(s.createdAt!).toISOString().split('T')[0];
      if (dailyActivity[day] !== undefined) dailyActivity[day]++;
    }

    res.json({
      success: true,
      data: {
        total,
        successes,
        nearMisses,
        successRate: total > 0 ? Math.round((successes / total) * 100) : 0,
        soundBreakdown: soundMap,
        dailyActivity,
        recentSessions: sessions.slice(0, 20),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'TalkyBuddy Server Running',
    ttsConfigured: !!process.env.SMALLEST_AI_API_KEY,
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.SMALLEST_AI_API_KEY ? 'Configured ✓' : 'MISSING ✗'}`);
  console.log(`🗄️ MongoDB: ${MONGODB_URI ? 'Configured ✓' : 'Using local fallback'}`);
});
