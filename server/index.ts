import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';
import { AtomsClient, Configuration as SmallestConfig } from 'smallestai';

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
    const filter = kid ? { kidName: { $regex: new RegExp(`^${kid}$`, 'i') } } : {};
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
    // Case-insensitive search
    const filter = kid ? { kidName: { $regex: new RegExp(`^${kid}$`, 'i') } } : {};
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

    const totalXp = sessions.reduce((sum, s) => sum + (s.xpEarned || 0), 0);

    res.json({
      success: true,
      data: {
        total,
        successes,
        nearMisses,
        successRate: total > 0 ? Math.round((successes / total) * 100) : 0,
        totalXp,
        soundBreakdown: soundMap,
        dailyActivity,
        recentSessions: sessions.slice(0, 20),
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============ ATOMS INTEGRATION - AI Phone Calls ============

let cachedAgentId: string | null = null;

async function getAtomsClient() {
  const apiKey = process.env.SMALLEST_AI_API_KEY;
  if (!apiKey) throw new Error('SMALLEST_AI_API_KEY not configured');
  const config = new SmallestConfig({ accessToken: apiKey });
  return new AtomsClient(config);
}

async function getOrCreateTherapyAgent(): Promise<string> {
  if (cachedAgentId) return cachedAgentId;

  const client = await getAtomsClient();

  // Check for existing agent first
  try {
    const agents = await client.getAgents();
    const existing = (agents.data as any)?.find?.((a: any) =>
      a.name === 'Waggle Progress Reporter' || a.name === 'TalkyBuddy Progress Reporter'
    );
    if (existing) {
      cachedAgentId = existing.id || existing._id;
      console.log(`✅ Found existing Atoms agent: ${cachedAgentId}`);
      return cachedAgentId!;
    }
  } catch (_) { /* proceed to create */ }

  const response = await client.createAgent({
    name: 'Waggle Progress Reporter',
    description: 'AI speech therapy assistant that calls parents with progress updates on their child\'s pronunciation practice. Be warm, encouraging, and specific about which sounds the child is improving on.',
    language: {
      enabled: 'en' as any,
      switching: false,
      synthesizer: {
        voiceConfig: { model: 'waves_lightning_large' as any, voiceId: 'emily' },
        speed: 1.0,
        consistency: 0.5,
        similarity: 0,
        enhancement: 1,
      },
    },
    slmModel: 'electron-v1' as any,
  });

  cachedAgentId = (response as any).data;
  console.log(`✅ Created Atoms agent: ${cachedAgentId}`);
  return cachedAgentId!;
}

// Get agent status
app.get('/api/atoms/status', async (_req, res) => {
  try {
    const client = await getAtomsClient();
    const agentId = await getOrCreateTherapyAgent();
    res.json({ success: true, agentId, configured: true });
  } catch (error: any) {
    res.json({ success: false, configured: false, error: error.message });
  }
});

// Trigger AI phone call to parent with progress report
app.post('/api/atoms/call-parent', async (req, res) => {
  try {
    const { phoneNumber, kidName } = req.body;

    if (!phoneNumber || !kidName) {
      return res.status(400).json({ error: 'Phone number and kid name required' });
    }

    // Fetch kid's stats for context
    const sessions = await Session.find({ kidName }).sort({ createdAt: -1 }).limit(50);
    const total = sessions.length;
    const successes = sessions.filter(s => s.success).length;
    const successRate = total > 0 ? Math.round((successes / total) * 100) : 0;
    const sounds = Array.from(new Set(sessions.map(s => s.sound).filter(Boolean)));
    const nearMisses = sessions.filter(s => s.isNearMiss).length;

    // Get or create the AI agent
    const agentId = await getOrCreateTherapyAgent();
    const client = await getAtomsClient();

    // Update agent description with current child data before calling
    try {
      await client.updateAgent(agentId, {
        description: `You are calling the parent of ${kidName} with a speech therapy progress report.
Stats: ${total} sessions, ${successRate}% success rate, ${nearMisses} near-misses.
Sounds practiced: ${sounds.join(', ') || 'None yet'}.
${successRate >= 70 ? `${kidName} is doing great! Highlight their progress.` : `${kidName} needs more practice. Be encouraging and suggest specific exercises.`}
Keep the call brief (under 2 minutes). Be warm and professional.`,
      });
    } catch (_) { /* agent update is best-effort */ }

    // Place the call
    const callResponse = await client.startOutboundCall({
      agentId,
      phoneNumber,
    });

    const conversationId = (callResponse as any).data?.conversationId || (callResponse as any).conversationId;

    console.log(`📞 Atoms call placed to ${phoneNumber} for ${kidName} | conversation: ${conversationId}`);

    res.json({
      success: true,
      conversationId,
      message: `AI is calling ${phoneNumber} with ${kidName}'s progress report!`,
    });

  } catch (error: any) {
    console.error('❌ Atoms call error:', error.response?.data || error.message);
    res.status(500).json({
      error: error.message,
      hint: 'Atoms phone call feature - ensure API key has Atoms access',
    });
  }
});

// Check call status
app.get('/api/atoms/call-status/:conversationId', async (req, res) => {
  try {
    const client = await getAtomsClient();
    const logs = await client.getConversationLogs(req.params.conversationId);
    res.json({ success: true, data: (logs as any).data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Waggle Server Running',
    ttsConfigured: !!process.env.SMALLEST_AI_API_KEY,
    atomsEnabled: true,
    dbConnected: mongoose.connection.readyState === 1,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key: ${process.env.SMALLEST_AI_API_KEY ? 'Configured ✓' : 'MISSING ✗'}`);
  console.log(`🗄️ MongoDB: ${MONGODB_URI ? 'Configured ✓' : 'Using local fallback'}`);
});
