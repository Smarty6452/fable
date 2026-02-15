import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import axios from 'axios';
import path from 'path';
import { AtomsClient, Configuration as SmallestConfig } from 'smallestai';
import { rateLimit } from 'express-rate-limit';

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

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// Apply to tts and sessions specifically to prevent abuse
app.use('/api/tts', limiter);
app.use('/api/sessions', limiter);
app.use('/api/atoms', limiter);

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

// Voice Cache to reduce latency
let voiceCache: any = null;
let lastCacheUpdate = 0;
const CACHE_TTL = 3600000; // 1 hour

// Fetch available voices from Smallest AI
app.get('/api/voices', async (req, res) => {
  const apiKey = process.env.SMALLEST_AI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  // Check cache first
  const now = Date.now();
  if (voiceCache && (now - lastCacheUpdate < CACHE_TTL)) {
    // console.log('🚀 Serving voices from server cache');
    return res.json(voiceCache);
  }

  try {
    const model = (req.query.model as string) || 'lightning-v3.1';
    const response = await axios({
      method: 'get',
      url: `https://waves-api.smallest.ai/api/v1/voices?model=${model}`,
      headers: { 'Authorization': `Bearer ${apiKey}` },
      timeout: 10000,
    });
    
    // Update cache
    voiceCache = response.data;
    lastCacheUpdate = now;
    
    res.json(response.data);
  } catch (error: any) {
    console.error('❌ Voices fetch error:', error.response?.status, error.message);
    
    // If we have a cache (even if expired), return it as fallback during API failure
    if (voiceCache) {
      console.warn('⚠️ API failed, serving stale cache');
      return res.json(voiceCache);
    }

    // Hardcoded fallback if no cache exists
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
  console.log(`🎙️ Server: TTS Request Received for text: "${text?.substring(0, 20)}..." voice: ${voice_id}`);

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'Text is required', useFallback: true });
  }

  const requestSpeech = async (targetVoice: string) => {
    // console.log(`🎙️ TTS: model=lightning-v3.1 | voice=${targetVoice} | text="${text.substring(0, 30)}..."`);
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
    const list = (agents as any).data || (agents as any).agents || [];
    const existing = list.find((a: any) =>
      a.name === 'TalkyBuddy Progress Reporter'
    );
    if (existing) {
      cachedAgentId = existing.id || existing._id;
      console.log(`✅ Found existing Atoms agent: ${cachedAgentId}`);
      return cachedAgentId!;
    }
  } catch (_) { /* proceed to create */ }

  const response = await client.createAgent({
    name: 'TalkyBuddy Progress Reporter',
    agentDescription: 'AI speech therapy assistant providing progress updates to parents.', // Brief static description
    voiceId: 'emily',
    slmId: 'be04620a-5c24-4ba2-9856-c0d648e65a0b', // Specific SLM ID if needed, or default
    maxDuration: 120, // 2 minutes max
    initialMessage: "Hi! This is Fable, your child's speech buddy. Is this a good time for a quick progress update?",
  });

  cachedAgentId = (response as any).id || (response as any).data?.id;
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

    // Generate a highly specific prompt for the call
    const prompt = `
Role: You are Fable, a cheerful and professional AI speech therapy assistant.
Goal: Call the parent of ${kidName} to give a structured 1-minute update.
Context:
- Child: ${kidName}
- Recent Activity: ${total} sessions checked.
- Accuracy: ${successRate}% (Goal: 80%+)
- Sounds Practiced: ${sounds.join(', ') || 'General basics'}
- Areas to Improve: ${nearMisses} near-misses detected (encourage precision).

Script Flow:
1. Greet warmly and confirm you're calling about ${kidName}.
2. Give the "Headline": "${kidName} practiced ${sounds.length} sounds today with ${successRate}% accuracy!"
3. Give one specific win: "They did great with the '${sounds[0] || 'S'}' sound."
4. Give one tip: "We're working on clearer endings for words."
5. Close: "Thanks for letting them play Fable! Have a wonderful day!"

Tone: Warm, concise, encouraging. Do NOT be robotic. Be human-like and quick.
    `;

    // Update agent description/prompt with specific child data
    try {
      await client.updateAgent(agentId, {
        agentDescription: prompt, 
        voiceId: 'emily',
      });
    } catch (e) { console.warn("Agent update warn:", e); }

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
    message: 'TalkyBuddy Server Running',
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
