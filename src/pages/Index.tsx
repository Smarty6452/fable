import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Shield, BarChart3, Star, Search, Trophy } from "lucide-react";
import Mascot from "@/components/Mascot";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useBadges } from "@/contexts/BadgeContext";
import bgPattern from "@/assets/bg-pattern.png";

const ageGroups = [
  { label: "3–5", emoji: "🧸", description: "Preschool" },
  { label: "5–8", emoji: "🎒", description: "Early School" },
];

const Index = () => {
  const [selectedAge, setSelectedAge] = useState<string | null>(null);
  const navigate = useNavigate();
  const { totalStars } = useBadges();

  const handleStart = () => {
    navigate("/practice", { state: { ageGroup: selectedAge || "3–5" } });
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center relative overflow-hidden px-4 py-8"
      style={{
        backgroundImage: `url(${bgPattern})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Floating decorations */}
      <div className="absolute top-10 left-10 text-4xl float" style={{ animationDelay: "0s" }}>☁️</div>
      <div className="absolute top-20 right-16 text-3xl float" style={{ animationDelay: "1s" }}>⭐</div>
      <div className="absolute bottom-20 left-20 text-3xl float" style={{ animationDelay: "0.5s" }}>🌈</div>
      <div className="absolute bottom-32 right-12 text-4xl float" style={{ animationDelay: "1.5s" }}>☁️</div>

      {/* Star counter */}
      {totalStars > 0 && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-sunshine/20 backdrop-blur-sm px-4 py-2 rounded-2xl">
          <Star className="w-5 h-5 text-sunshine fill-sunshine" />
          <span className="font-bold text-foreground">{totalStars}</span>
        </div>
      )}

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center max-w-lg w-full">
        <Mascot mood="happy" size="lg" className="mb-4" />

        <h1 className="text-4xl md:text-5xl font-bold text-foreground text-center mb-2 tracking-tight">
          Speech Buddy
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-6 max-w-sm">
          Fun speech practice with your friend Foxy! 🦊
        </p>

        {/* Age selector */}
        <div className="flex gap-4 mb-6">
          {ageGroups.map((group) => (
            <button
              key={group.label}
              onClick={() => setSelectedAge(group.label)}
              className={`flex flex-col items-center gap-1 px-6 py-4 rounded-2xl border-2 transition-all duration-200 hover:scale-105 ${
                selectedAge === group.label
                  ? "border-accent bg-accent/20 shadow-lg"
                  : "border-border bg-card hover:border-primary"
              }`}
            >
              <span className="text-3xl">{group.emoji}</span>
              <span className="font-semibold text-foreground">{group.label}</span>
              <span className="text-xs text-muted-foreground">{group.description}</span>
            </button>
          ))}
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="group relative flex items-center gap-3 px-10 py-5 rounded-3xl bg-accent text-accent-foreground font-bold text-xl shadow-xl pulse-glow transition-all duration-200 hover:scale-105 active:scale-95 mb-4"
        >
          <Mic className="w-7 h-7 transition-transform group-hover:scale-110" />
          Start Talking!
        </button>

        {/* Sound Quest button */}
        <button
          onClick={() => navigate("/sound-quest")}
          className="group flex items-center gap-3 px-8 py-4 rounded-3xl bg-lavender text-foreground font-bold text-lg shadow-lg transition-all duration-200 hover:scale-105 active:scale-95 mb-6"
        >
          <Search className="w-6 h-6" />
          Sound Quest 🔍
        </button>

        {/* Badges preview */}
        <button
          onClick={() => navigate("/badges")}
          className="w-full max-w-sm bg-card/80 backdrop-blur-sm rounded-2xl p-4 border border-border hover:shadow-md transition-all mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-sunshine" />
              <span className="font-semibold text-foreground text-sm">My Badges</span>
            </div>
            <span className="text-xs text-primary">View all →</span>
          </div>
          <BadgeDisplay compact />
        </button>

        {/* Parent note */}
        <p className="text-sm text-muted-foreground text-center max-w-xs">
          <Shield className="w-4 h-4 inline mr-1 -mt-0.5" />
          Safe, fun speech practice for kids.{" "}
          <button
            onClick={() => navigate("/parent")}
            className="underline text-primary hover:text-primary/80 transition-colors"
          >
            Parent Dashboard →
          </button>
        </p>

        {/* Features */}
        <div className="mt-8 grid grid-cols-4 gap-3 w-full max-w-sm">
          {[
            { icon: Mic, label: "Voice Chat", color: "bg-sky" },
            { icon: Star, label: "Earn Stars", color: "bg-sunshine" },
            { icon: Search, label: "Sound Quest", color: "bg-lavender" },
            { icon: BarChart3, label: "Progress", color: "bg-mint" },
          ].map(({ icon: Icon, label, color }) => (
            <div key={label} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card/80 backdrop-blur-sm">
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center`}>
                <Icon className="w-5 h-5 text-foreground" />
              </div>
              <span className="text-xs font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
