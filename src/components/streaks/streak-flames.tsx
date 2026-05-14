import { StreakDot, StreakDotEmpty } from "./streak-icons";

export function StreakFlames({ days }: { days: Array<{ active: boolean }> }) {
  // Snapshot provides positions 1..5 of the current 5-day cycle (resets every 5 days).
  // Render left-to-right: position 1 leftmost, position 5 rightmost.
  return (
    <div className="flex gap-1.5" aria-label="Current 5-day cycle">
      {days.map((d, i) =>
        d.active ? (
          <StreakDot key={i} size={18} className="text-foreground" />
        ) : (
          <StreakDotEmpty
            key={i}
            size={18}
            className="text-muted-foreground/40"
          />
        ),
      )}
    </div>
  );
}
