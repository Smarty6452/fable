import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Mail,
  Calendar,
  Clock,
  TrendingUp,
  Star,
  Settings,
  Volume2,
} from "lucide-react";

const mockSessions = [
  {
    id: 1,
    date: "Feb 12, 2026",
    duration: "8 min",
    soundsPracticed: ["s", "r"],
    wordsAttempted: 12,
    successRate: 75,
    stars: 4,
  },
  {
    id: 2,
    date: "Feb 11, 2026",
    duration: "12 min",
    soundsPracticed: ["f", "b"],
    wordsAttempted: 18,
    successRate: 83,
    stars: 6,
  },
  {
    id: 3,
    date: "Feb 10, 2026",
    duration: "6 min",
    soundsPracticed: ["c", "s"],
    wordsAttempted: 9,
    successRate: 67,
    stars: 3,
  },
];

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [emailSent, setEmailSent] = useState(false);

  const totalStars = mockSessions.reduce((sum, s) => sum + s.stars, 0);
  const avgSuccess = Math.round(
    mockSessions.reduce((sum, s) => sum + s.successRate, 0) / mockSessions.length
  );

  const handleSendEmail = () => {
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-2 hover:bg-muted"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          <h1 className="text-xl font-bold text-foreground">Parent Dashboard</h1>
          <button className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Stats overview */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Stars", value: totalStars, icon: Star, color: "bg-sunshine/20 text-accent-foreground" },
            { label: "Avg Success", value: `${avgSuccess}%`, icon: TrendingUp, color: "bg-mint/20 text-secondary-foreground" },
            { label: "Sessions", value: mockSessions.length, icon: Calendar, color: "bg-sky/20 text-foreground" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={`rounded-2xl p-4 text-center ${color}`}>
              <Icon className="w-6 h-6 mx-auto mb-2 opacity-70" />
              <p className="text-2xl font-bold">{value}</p>
              <p className="text-xs font-medium opacity-70">{label}</p>
            </div>
          ))}
        </div>

        {/* Email summary */}
        <button
          onClick={handleSendEmail}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-semibold hover:scale-[1.02] transition-all shadow-md"
        >
          <Mail className="w-5 h-5" />
          {emailSent ? "Summary Sent! ✉️" : "Email Progress Summary"}
        </button>

        {/* Session history */}
        <div>
          <h2 className="text-lg font-bold text-foreground mb-3">Recent Sessions</h2>
          <div className="space-y-3">
            {mockSessions.map((session) => (
              <div
                key={session.id}
                className="bg-card rounded-2xl border border-border p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    {session.date}
                  </div>
                  <div className="flex items-center gap-1 text-sm">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">{session.duration}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Volume2 className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-foreground">
                        Sounds: {session.soundsPracticed.map((s) => `"${s}"`).join(", ")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {session.wordsAttempted} words attempted
                    </p>
                  </div>

                  <div className="text-right">
                    <div className="flex items-center gap-1 justify-end mb-1">
                      <Star className="w-4 h-4 text-sunshine fill-sunshine" />
                      <span className="font-bold text-foreground">{session.stars}</span>
                    </div>
                    {/* Success bar */}
                    <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-secondary rounded-full transition-all"
                        style={{ width: `${session.successRate}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">{session.successRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Settings section */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h2 className="text-lg font-bold text-foreground mb-3">Settings</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Language</span>
              <select className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground border-none outline-none">
                <option>English</option>
                <option>French</option>
                <option>Mandarin</option>
                <option>Arabic</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">Difficulty</span>
              <select className="rounded-xl bg-muted px-3 py-2 text-sm text-foreground border-none outline-none">
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
