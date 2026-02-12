import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "lucide-react";
import Mascot from "@/components/Mascot";
import BadgeDisplay from "@/components/BadgeDisplay";
import { useBadges } from "@/contexts/BadgeContext";

const Badges = () => {
  const navigate = useNavigate();
  const { totalStars, sessionCount, wordsSpoken } = useBadges();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex items-center justify-between p-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors rounded-xl px-3 py-2 hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Home</span>
        </button>
        <div className="flex items-center gap-2 bg-sunshine/20 px-4 py-2 rounded-2xl">
          <Star className="w-5 h-5 text-sunshine fill-sunshine" />
          <span className="font-bold text-foreground">{totalStars}</span>
        </div>
      </div>

      <div className="flex-1 px-4 pb-8 max-w-lg mx-auto w-full">
        <div className="flex flex-col items-center gap-3 mb-6">
          <Mascot mood="happy" size="sm" />
          <h1 className="text-2xl font-bold text-foreground">My Badges 🏆</h1>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-sunshine/10 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{totalStars}</p>
            <p className="text-xs text-muted-foreground">Stars</p>
          </div>
          <div className="bg-sky/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{sessionCount}</p>
            <p className="text-xs text-muted-foreground">Sessions</p>
          </div>
          <div className="bg-mint/20 rounded-2xl p-3 text-center">
            <p className="text-2xl font-bold text-foreground">{wordsSpoken.length}</p>
            <p className="text-xs text-muted-foreground">Words</p>
          </div>
        </div>

        <BadgeDisplay />
      </div>
    </div>
  );
};

export default Badges;
