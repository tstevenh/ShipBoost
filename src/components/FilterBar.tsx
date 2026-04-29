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
    <div className="w-full border-b border-border bg-background py-3 md:py-2">
      <div className="container mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 md:flex-row md:gap-6">
        {/* Left: Period Tabs */}
        <div className="grid w-full max-w-sm grid-cols-3 items-center rounded-xl border border-border bg-muted/50 p-1 md:flex md:w-auto md:max-w-none">
          {periods.map((period) => (
            <Link
              key={period.value}
              href={`/launches/${period.value}`}
              className={cn(
                "rounded-lg px-3 py-2 text-center text-sm font-bold transition-all sm:px-5",
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
        <div className="flex w-full items-center justify-center gap-6 md:w-auto md:justify-end">
          <div className="flex min-w-0 items-center gap-2 text-sm font-medium text-muted-foreground">
            <Timer className="w-4 h-4 text-primary" />
            <span className="shrink-0">Next cohort reset in</span>
            <span
              className="font-bold tabular-nums text-foreground"
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
