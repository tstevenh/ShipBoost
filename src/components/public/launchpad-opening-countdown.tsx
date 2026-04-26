"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Rocket, Timer } from "lucide-react";

type CountdownParts = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function getCountdownParts(targetTime: number): CountdownParts {
  const totalSeconds = Math.max(0, Math.floor((targetTime - Date.now()) / 1000));

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}

function CountdownBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-background px-4 py-3 text-center shadow-sm">
      <div className="text-2xl font-black tabular-nums tracking-tight text-foreground">
        {value.toString().padStart(2, "0")}
      </div>
      <div className="mt-1 text-[9px] font-black tracking-[0.18em] text-muted-foreground/60">
        {label}
      </div>
    </div>
  );
}

export function LaunchpadOpeningCountdown({
  launchpadGoLiveAt,
}: {
  launchpadGoLiveAt: string;
}) {
  const targetTime = useMemo(
    () => new Date(launchpadGoLiveAt).getTime(),
    [launchpadGoLiveAt],
  );
  const [parts, setParts] = useState<CountdownParts | null>(null);

  useEffect(() => {
    const update = () => setParts(getCountdownParts(targetTime));

    update();
    const timer = window.setInterval(update, 1000);

    return () => window.clearInterval(timer);
  }, [targetTime]);

  return (
    <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center sm:px-8 sm:py-20">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
        <Timer size={20} className="text-foreground" />
      </div>
      <p className="mt-5 text-[10px] font-black tracking-[0.24em] text-muted-foreground/60">
        Launchpad opens May 4
      </p>
      <h3 className="mx-auto mt-3 max-w-2xl text-3xl font-black tracking-tight text-foreground sm:text-4xl">
        First launch week starts soon.
      </h3>
      <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-relaxed text-muted-foreground">
        Submissions are open now. Approved products will appear here when the
        first weekly launch board begins.
      </p>

      <div
        className="mx-auto mt-8 grid max-w-xl grid-cols-2 gap-3 sm:grid-cols-4"
        suppressHydrationWarning
      >
        <CountdownBlock label="Days" value={parts?.days ?? 0} />
        <CountdownBlock label="Hours" value={parts?.hours ?? 0} />
        <CountdownBlock label="Mins" value={parts?.minutes ?? 0} />
        <CountdownBlock label="Secs" value={parts?.seconds ?? 0} />
      </div>

      <Link
        href="/submit"
        className="mt-8 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition-all hover:opacity-90 active:scale-95"
      >
        <Rocket size={15} />
        Submit before opening week
      </Link>
    </div>
  );
}
