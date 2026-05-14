"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StreakFlames } from "./streak-flames";
import { LotteryModal } from "./lottery-modal";
import { RewardsModal } from "./rewards-modal";
import { CheckSquareIcon, PadlockIcon } from "./streak-icons";

interface TodayRoll {
  outcome: string;
  reward: { code: string; percentOff: number; productScope: string } | null;
}

interface Snapshot {
  streakCount: number;
  nextMilestone: number | null;
  activeMultiplier: number;
  lotteryUnlocked: boolean;
  last5Days: Array<{ day: string; active: boolean }>;
  todayRoll: TodayRoll | null;
}

export function StreakSidebar() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [lotteryOpen, setLotteryOpen] = useState(false);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    fetch("/api/streaks/snapshot")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        if (j?.data) setSnapshot(j.data);
      })
      .catch(() => {});
  }, []);

  // Modal opens only when the user actively rolls in the current session —
  // not on every page load. If they already rolled earlier today, the sidebar
  // just shows the "you've played today" message.

  if (!snapshot) return null;

  const handleRoll = async () => {
    if (rolling || snapshot.todayRoll) {
      setLotteryOpen(true);
      return;
    }
    setRolling(true);
    try {
      const res = await fetch("/api/streaks/lottery", { method: "POST" });
      if (!res.ok) return;
      const json = await res.json();
      const roll: TodayRoll = json.data;
      setSnapshot((s) => (s ? { ...s, todayRoll: roll } : s));
      setLotteryOpen(true);
    } finally {
      setRolling(false);
    }
  };

  const progressPct = snapshot.nextMilestone
    ? Math.min(100, (snapshot.streakCount / snapshot.nextMilestone) * 100)
    : 100;

  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center gap-1.5 mb-2">
          <h3 className="text-lg font-semibold text-foreground">
            {snapshot.streakCount} DAY STREAK
          </h3>
          <span className="relative group cursor-help">
            <span
              aria-label="What is a streak?"
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-muted-foreground/40 text-[10px] font-bold text-muted-foreground"
            >
              ?
            </span>
            <span className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 w-60 -translate-x-1/2 rounded-md bg-foreground px-3 py-2 text-xs leading-relaxed text-background shadow-lg opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity">
              You earn a streak each day you upvote a product, click out to a tool, or view a tool page. Hit milestones for vote multipliers and discount codes.
            </span>
          </span>
        </div>
        <StreakFlames days={snapshot.last5Days} />
        {snapshot.nextMilestone && (
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground">Next reward:</p>
            <p>at {snapshot.nextMilestone} days</p>
            <div className="mt-1 h-2 bg-muted rounded">
              <div
                className="h-2 bg-foreground rounded transition-all"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        )}
        <Link
          href="/streaks"
          className="text-sm text-foreground mt-3 inline-block hover:underline"
        >
          Check the leaderboard →
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">Daily Lottery</h3>
        {!snapshot.lotteryUnlocked ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <PadlockIcon size={14} />
            <span>Unlocks at 25-day streak</span>
          </div>
        ) : snapshot.todayRoll ? (
          <div className="text-center py-2">
            <div className="mx-auto mb-3 w-9 h-9 rounded-full border-2 border-foreground/30 flex items-center justify-center">
              <CheckSquareIcon size={18} className="text-foreground" />
            </div>
            <p className="text-sm font-medium">You&apos;ve played today!</p>
            <p className="text-xs text-muted-foreground mt-1">
              Come back tomorrow for another chance
            </p>
          </div>
        ) : (
          <button
            onClick={handleRoll}
            disabled={rolling}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium hover:opacity-90 disabled:opacity-60"
          >
            {rolling ? "Rolling…" : "Try Your Luck"}
          </button>
        )}
        <button
          type="button"
          onClick={() => setRewardsOpen(true)}
          className="text-sm text-foreground mt-3 inline-block hover:underline"
        >
          View My Rewards →
        </button>
      </div>

      {lotteryOpen && snapshot.todayRoll && (
        <LotteryModal
          roll={snapshot.todayRoll}
          onClose={() => setLotteryOpen(false)}
        />
      )}
      {rewardsOpen && <RewardsModal onClose={() => setRewardsOpen(false)} />}
    </aside>
  );
}
