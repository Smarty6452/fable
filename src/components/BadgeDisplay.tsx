import { useBadges } from "@/contexts/BadgeContext";

interface BadgeDisplayProps {
  compact?: boolean;
}

const BadgeDisplay = ({ compact = false }: BadgeDisplayProps) => {
  const { badges } = useBadges();
  const earned = badges.filter((b) => b.earned);
  const locked = badges.filter((b) => !b.earned);

  if (compact) {
    return (
      <div className="flex gap-2 flex-wrap">
        {earned.map((b) => (
          <div
            key={b.id}
            className="w-10 h-10 rounded-xl bg-sunshine/20 flex items-center justify-center text-xl sparkle"
            title={b.name}
          >
            {b.emoji}
          </div>
        ))}
        {earned.length === 0 && (
          <span className="text-sm text-muted-foreground">No badges yet — keep practicing!</span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {earned.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">🏆 Earned</h3>
          <div className="grid grid-cols-2 gap-3">
            {earned.map((b) => (
              <div
                key={b.id}
                className="flex items-center gap-3 bg-sunshine/10 rounded-2xl p-3 border border-sunshine/30"
              >
                <span className="text-2xl sparkle">{b.emoji}</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{b.name}</p>
                  <p className="text-xs text-muted-foreground">{b.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground mb-2">🔒 Locked</h3>
        <div className="grid grid-cols-2 gap-3">
          {locked.map((b) => (
            <div
              key={b.id}
              className="flex items-center gap-3 bg-muted/50 rounded-2xl p-3 border border-border opacity-60"
            >
              <span className="text-2xl grayscale">{b.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-foreground">{b.name}</p>
                <p className="text-xs text-muted-foreground">{b.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BadgeDisplay;
