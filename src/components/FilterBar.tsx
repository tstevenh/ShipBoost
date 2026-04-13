"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";
import { usePathname } from "next/navigation";

const UTC_WEEK_IN_MS = 7 * 24 * 60 * 60 * 1000;

const periods = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" },
];

function getNextLaunchWeekBoundary(now: Date, goLiveAt: Date) {
  if (now.getTime() < goLiveAt.getTime()) {
    return goLiveAt;
  }

  const elapsedWeeks = Math.floor(
    (now.getTime() - goLiveAt.getTime()) / UTC_WEEK_IN_MS,
  );

  return new Date(goLiveAt.getTime() + (elapsedWeeks + 1) * UTC_WEEK_IN_MS);
}

function formatWeeklyCountdown(timeLeftInMs: number) {
  const totalSeconds = Math.max(0, Math.floor(timeLeftInMs / 1000));
  const days = Math.floor(totalSeconds / (24 * 60 * 60));
  const hours = Math.floor((totalSeconds % (24 * 60 * 60)) / (60 * 60));
  const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
  const seconds = totalSeconds % 60;

  const hh = hours.toString().padStart(2, "0");
  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  return days > 0 ? `${days}d ${hh}:${mm}:${ss}` : `${hh}:${mm}:${ss}`;
}

export function FilterBar({ launchpadGoLiveAt }: { launchpadGoLiveAt: string }) {
  const pathname = usePathname();
  const activePeriod = React.useMemo(() => {
    if (pathname === "/") {
      return "weekly";
    }

    const board = pathname.match(/^\/launches\/(weekly|monthly|yearly)$/)?.[1];
    return board || "weekly";
  }, [pathname]);
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const goLiveAt = new Date(launchpadGoLiveAt);

    const calculateTimeLeft = () => {
      const now = new Date();

      return formatWeeklyCountdown(
        getNextLaunchWeekBoundary(now, goLiveAt).getTime() - now.getTime(),
      );
    };

    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [launchpadGoLiveAt]);

  return (
    <div className="w-full bg-background border-b border-border py-2">
      <div className="container mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Period Tabs */}
        <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
          {periods.map((period) => (
            <Link
              key={period.value}
              href={`/launches/${period.value}`}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-lg transition-all",
                activePeriod === period.value
                  ? "bg-card text-foreground shadow-sm shadow-black/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period.label}
            </Link>
          ))}
        </div>

        {/* Right: Status Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Timer className="w-4 h-4 text-primary" />
            Next cohort reset in{" "}
            <span
              className="text-foreground font-bold tabular-nums"
              suppressHydrationWarning
            >
              {timeLeft || "00:00:00"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
