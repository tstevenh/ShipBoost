import {
  getStreakLeaderboard,
  getUserRank,
} from "@/server/services/streak-leaderboard";
import { getServerSession } from "@/server/auth/session";
import { getStreakSnapshot } from "@/server/services/streak-service";
import {
  CheckSquareIcon,
  PadlockIcon,
  SparkIcon,
} from "@/components/streaks/streak-icons";

interface MilestoneRow {
  day: number;
  reward: string;
  type: "POWER" | "DISCOUNT" | "BADGE";
}

const REWARD_LADDER: MilestoneRow[] = [
  { day: 3, reward: "Profile streak badge", type: "BADGE" },
  { day: 5, reward: "Upvotes count 2×", type: "POWER" },
  { day: 10, reward: "10% off Premium Launch", type: "DISCOUNT" },
  {
    day: 25,
    reward: "25% off Premium Launch + Daily Lottery unlocks",
    type: "DISCOUNT",
  },
  { day: 50, reward: "Upvotes count 3× + avatar border", type: "POWER" },
  {
    day: 100,
    reward: "Upvotes count 5× + 50% off Premium Launch",
    type: "POWER",
  },
  { day: 250, reward: "50% off Sponsor Placement", type: "DISCOUNT" },
  { day: 365, reward: "Free Premium Launch slot", type: "DISCOUNT" },
];

function typeBadge(type: MilestoneRow["type"]) {
  if (type === "POWER") {
    return {
      label: "Power up",
      color: "bg-foreground/10 text-foreground border-foreground/20",
    };
  }
  if (type === "DISCOUNT") {
    return {
      label: "Discount",
      color: "bg-foreground/10 text-foreground border-foreground/20",
    };
  }
  return {
    label: "Badge",
    color: "bg-muted text-muted-foreground border-border",
  };
}

export default async function StreaksPage() {
  // Kick off the leaderboard (cached, doesn't depend on session) before resolving session.
  const leaderboardPromise = getStreakLeaderboard(50);
  const session = await getServerSession();
  const [top, snapshot, myRank] = await Promise.all([
    leaderboardPromise,
    session?.user ? getStreakSnapshot(session.user.id) : null,
    session?.user ? getUserRank(session.user.id) : null,
  ]);

  const inTop = myRank ? top.some((e) => e.userId === myRank.userId) : false;
  const currentStreak = snapshot?.streakCount ?? 0;
  const multiplier = snapshot?.activeMultiplier ?? 1;
  const nextMilestone = snapshot?.nextMilestone ?? null;
  const progressToNext = nextMilestone
    ? Math.min(100, Math.round((currentStreak / nextMilestone) * 100))
    : 100;

  return (
    <main className="w-full pt-28 pb-16 px-6 lg:px-12 xl:px-20">
      <header className="mb-10">
        <h1 className="text-4xl lg:text-5xl font-black tracking-tight">
          Streaks Leaderboard
        </h1>
        <p className="text-muted-foreground mt-2">
          Meet the most consistent members of the ShipBoost community.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-8 lg:gap-12">
        {/* LEFT: Leaderboard */}
        <section>
          {top.length === 0 ? (
            <p className="text-muted-foreground">
              No streaks yet — be the first.
            </p>
          ) : (
            <ol className="space-y-2">
              {top.map((entry) => (
                <li
                  key={entry.userId}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                >
                  <span className="w-10 text-right text-sm text-muted-foreground font-medium">
                    #{entry.rank}
                  </span>
                  <span className="font-medium truncate">
                    {entry.name ?? "Anonymous"}
                  </span>
                  <span className="ml-auto text-sm whitespace-nowrap">
                    <span className="text-foreground font-semibold">
                      {entry.streakCount} day
                    </span>{" "}
                    <span className="text-muted-foreground">streak</span>
                  </span>
                </li>
              ))}
            </ol>
          )}
          {myRank && !inTop && (
            <div className="mt-4 p-3 rounded-lg border-2 border-foreground/30 bg-foreground/5">
              <span className="text-sm">
                Your rank:{" "}
                <span className="font-semibold">#{myRank.rank}</span> —{" "}
                <span className="text-foreground font-semibold">
                  {myRank.streakCount} day streak
                </span>
              </span>
            </div>
          )}
        </section>

        {/* RIGHT: User status + reward journey */}
        <aside className="space-y-4">
          {session?.user && (
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <SparkIcon size={14} className="text-foreground" />
                <span>Your current streak</span>
              </div>
              <p className="text-3xl font-black text-foreground mt-1">
                {currentStreak} days
              </p>
              <p className="text-sm mt-2">
                Vote multiplier:{" "}
                <span className="font-semibold">×{multiplier}</span>
              </p>
            </div>
          )}

          <div className="rounded-xl border bg-card p-5">
            <h2 className="font-bold text-lg mb-3">Rewards</h2>
            {nextMilestone && session?.user && (
              <div className="mb-4">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Progress to next reward</span>
                  <span>{progressToNext}%</span>
                </div>
                <div className="h-2 bg-muted rounded">
                  <div
                    className="h-2 bg-foreground rounded transition-all"
                    style={{ width: `${progressToNext}%` }}
                  />
                </div>
              </div>
            )}
            <ul className="space-y-3">
              {REWARD_LADDER.map((m) => {
                const unlocked = currentStreak >= m.day;
                const badge = typeBadge(m.type);
                return (
                  <li
                    key={m.day}
                    className={`p-3 rounded-lg border transition-colors ${
                      unlocked
                        ? "border-foreground/30 bg-foreground/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {m.day} day streak
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {m.reward}
                        </p>
                        <span
                          className={`inline-block mt-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge.color}`}
                        >
                          {badge.label}
                        </span>
                      </div>
                      <div className="shrink-0 text-muted-foreground">
                        {unlocked ? (
                          <CheckSquareIcon
                            size={20}
                            className="text-foreground"
                          />
                        ) : (
                          <PadlockIcon size={20} />
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>
      </div>
    </main>
  );
}
