"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Timer } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const periods = [
  { label: "Today", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Yearly", value: "yearly" }
];

export function FilterBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activePeriod = searchParams.get("period") || "daily";
  const [timeLeft, setTimeLeft] = React.useState("");

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Calculate next UTC midnight
      const nextMidnight = new Date(now);
      nextMidnight.setUTCHours(24, 0, 0, 0);
      
      const difference = nextMidnight.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference / (1000 * 60)) % 60);
        const seconds = Math.floor((difference / 1000) % 60);
        
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }
      return "00:00:00";
    };

    // Initialize
    setTimeLeft(calculateTimeLeft());

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handlePeriodChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    router.push(`/?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="w-full bg-background border-b border-border py-2">
      <div className="container mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Left: Period Tabs */}
        <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border">
          {periods.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              className={cn(
                "px-5 py-2 text-sm font-bold rounded-lg transition-all",
                activePeriod === period.value
                  ? "bg-card text-foreground shadow-sm shadow-black/5"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {period.label}
            </button>
          ))}
        </div>

        {/* Right: Status Info */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Timer className="w-4 h-4 text-primary" />
            Next launch in <span className="text-foreground font-bold tabular-nums" suppressHydrationWarning>{timeLeft || "00:00:00"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
