# TalkyBuddy Boost - AI Speech Therapy for Kids

> Making professional-grade speech practice **free, accessible, and fun** for children aged 3-8.

[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)](https://mongodb.com/)
[![Smallest AI](https://img.shields.io/badge/Smallest%20AI-Waves-orange)](https://smallest.ai/)

---

## What is TalkyBuddy?

TalkyBuddy Boost transforms speech therapy into an AI-powered adventure game with **Wolfie**, a reactive 3D companion that provides instant voice feedback using Smallest AI's Waves TTS (<100ms latency).

### The Problem
- Speech therapy costs **$100-200/session**
- 1 in 12 children have speech disorders
- Most families can't afford consistent therapy

### Our Solution
- **$0 cost** - accessible from any browser
- **AI-powered feedback** - instant pronunciation coaching with near-miss detection
- **Gamification** - keeps kids engaged 3x longer
- **Parent analytics** - real-time progress tracking

---

## Key Features

### 3D Interactive Buddy
- **React Three Fiber** powered 3D character with distort mesh
- Reacts to listening/speaking states with scale and glow animations
- 5 buddies: Wolfie, Bolt, Luna, Max, Mochi - each with unique colors

### AI Voice (Smallest AI Waves v3.1)
- **Lauren voice** - tested across 10 voices, selected as most natural for kids
- Streaming SSE with base64-encoded audio chunks
- Browser `speechSynthesis` fallback (100% uptime)
- Adjustable voice speed (0.5x - 1.2x)

### Response Recovery System
- Detects "near-misses" (correct sound, wrong word)
- Provides targeted, encouraging feedback instead of pass/fail
- Reduces frustration and maintains engagement

### Pronunciation Tips
- Articulatory guidance for each sound (e.g., "Put your tongue behind your top teeth and blow air softly!")
- Shows exactly how to form sounds physically
- Auto-displays after 2 failed attempts

### Chapter-Based Progression
- **9 progressive chapters** from basic sounds to full conversations
- **XP-gated unlocking** (0, 100, 250, 400, 600, 850, 1150, 1500, 2000 XP)
- Difficulty-based XP rewards: Easy +20, Medium +25, Hard +35

### Interactive Onboarding
- **Guided Tour** with spotlight highlighting
- Step-by-step navigation through features
- Skip functionality and persistent completion state

### Notification Center
- Real-time achievement alerts and level-up celebrations
- Streak milestones (every 5 consecutive successes)
- Unread badge with dropdown panel

### Parent Analytics Dashboard
- **Tabbed interface**: Activity, Sound Mastery, History
- Weekly activity chart with today-highlighting
- Sound mastery grid with emoji indicators
- Needs Practice / Strongest Sounds insight cards
- Session history with transcripts and XP earned

### Premium Interactive UI
- **Mouse-following parallax** - background blobs track cursor with spring physics
- **Magnetic buttons** - CTAs subtly attract toward cursor
- **Staggered blur-to-focus** entrance animations
- **Cursor glow** - soft gradient light follows mouse
- **Confetti celebrations** on successful pronunciation

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router) + **React 19**
- **TypeScript** - Full type safety
- **Framer Motion 12** - Spring physics, staggered animations, motion values
- **React Three Fiber / Drei** - 3D buddy character
- **Tailwind CSS v4** - Custom theme with glassmorphic design
- **Web Speech API** - On-device speech recognition with interim results

### Backend
- **Express.js 5** + **Node.js** - REST API server
- **MongoDB Atlas** - Session & analytics storage
- **Smallest AI Waves v3.1** - Streaming TTS with SSE

### Key Libraries
- `three` / `@react-three/fiber` / `@react-three/drei` - 3D rendering
- `framer-motion` - Animation engine
- `lucide-react` - Icon system
- `sonner` - Toast notifications
- `canvas-confetti` - Celebration effects

---

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- Smallest AI API key ([smallest.ai](https://smallest.ai))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/smarty-6452/talkybuddy-boost.git
   cd talkybuddy-boost
   ```

2. **Install dependencies**
   ```bash
   # Frontend
   cd client
   npm install

   # Backend
   cd ../server
   npm install
   ```

3. **Configure environment variables**

   Create `client/.env`:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   SMALLEST_AI_API_KEY=your_smallest_ai_key
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Start the servers**

   Terminal 1 (Backend):
   ```bash
   cd server
   npm run dev
   ```

   Terminal 2 (Frontend):
   ```bash
   cd client
   npm run dev
   ```

5. **Open the app** at `http://localhost:3000`

---

## Project Structure

```
hackathon/
├── client/                       # Next.js frontend
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx                # Homepage with parallax + magnetic buttons
│   │   │   ├── play/page.tsx           # Main practice interface
│   │   │   ├── parent/page.tsx         # Analytics dashboard (tabbed)
│   │   │   ├── about/page.tsx          # About page
│   │   │   ├── layout.tsx              # Root layout with Outfit font
│   │   │   └── globals.css             # Tailwind v4 theme
│   │   ├── components/
│   │   │   ├── InteractiveBackground.tsx  # Mouse-following parallax blobs
│   │   │   ├── Buddy3D.tsx              # Three.js 3D character
│   │   │   ├── GuidedTour.tsx           # Interactive onboarding system
│   │   │   ├── NotificationBell.tsx     # Notification center + hooks
│   │   │   ├── AudioVisualizer.tsx      # Animated bar visualizer
│   │   │   └── BuddySelector.tsx        # AI companion picker
│   │   └── data/
│   │       └── chapters.ts              # 9-chapter progression data
│   └── .env
├── server/                       # Express backend
│   └── index.ts                        # TTS proxy, sessions API, stats API
├── HACKATHON_PITCH.md                  # Competition pitch document
└── README.md                           # This file
```

---

## API Endpoints

### TTS (Text-to-Speech)
```http
POST /api/tts
Content-Type: application/json

{
  "text": "Hello! Let's practice the S sound.",
  "voice_id": "lauren",
  "speed": 0.9
}
```
Returns SSE stream with base64-encoded WAV audio chunks.

### Save Session
```http
POST /api/sessions
Content-Type: application/json

{
  "kidName": "Alex",
  "buddy": "wolf",
  "sound": "S",
  "word": "Sun",
  "attempts": 1,
  "success": true,
  "transcript": "sun",
  "isNearMiss": false,
  "xpEarned": 20
}
```

### Get Stats
```http
GET /api/stats?kid=Alex
```
Returns total sessions, accuracy rate, near misses, sound breakdown, daily activity, and recent sessions.

### Health Check
```http
GET /api/health
```

---

## Design System

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| Primary | `#FFB347` | CTAs, accents, XP |
| Secondary | `#B19CD9` | Background blobs |
| Accent | `#77DD77` | Success states |
| Background | `#FFF9F2` | Page background |

### Typography
- **Font**: Outfit (Google Fonts)
- **Headings**: font-black (900), tight tracking
- **Labels**: font-black, uppercase, widest tracking

### Glassmorphism Pattern
```
bg-white/80 backdrop-blur-xl
border-4 border-white
rounded-[2rem]
shadow-lg
```

---

## Troubleshooting

### TTS not working
1. Verify `SMALLEST_AI_API_KEY` in `.env`
2. Ensure server is running on port 5000
3. The app automatically falls back to browser TTS if the API fails

### Microphone not recording
- Use Chrome/Edge for best Web Speech API support
- Allow microphone permissions when prompted
- The audio visualizer is CSS-based and doesn't require mic access

### MongoDB connection failed
- Verify `MONGODB_URI` in `.env`
- Falls back to `mongodb://localhost:27017/kidbuddy` if not set

---

## Metrics

| Metric | Value |
|--------|-------|
| TTS Latency | <100ms (Smallest AI) |
| TTS Voice | Lauren (most natural for kids) |
| Fallback | Browser SpeechSynthesis |
| Sound Missions | 8 (Easy/Medium/Hard) |
| Chapters | 9 progressive levels |
| Buddy Options | 5 3D companions |
| Age Range | 3-8 years |
| Cost | **$0** |

---

## Author

**Rohit Bharti**
Full-Stack Developer | AI Enthusiast

[![LinkedIn](https://img.shields.io/badge/LinkedIn-rohit--bharti-blue)](https://linkedin.com/in/rohit-bharti-)
[![GitHub](https://img.shields.io/badge/GitHub-smarty--6452-black)](https://github.com/smarty-6452)
[![Portfolio](https://img.shields.io/badge/Portfolio-rohitmansinghbharti.com-orange)](https://rohitmansinghbharti.com)

---

## License

This project is built for educational purposes as part of a hackathon.
**Smallest AI Waves** is used under their API terms of service.

---

## Acknowledgments

- **Smallest AI** - For the Waves TTS API
- **Next.js Team** - For the React framework
- **MongoDB** - For flexible data storage
- **Three.js** - For 3D rendering

---

**Built with care for children who deserve better access to speech therapy.**
