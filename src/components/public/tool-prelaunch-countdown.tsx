"use client";

import { useEffect, useState } from "react";

type CountdownPart = {
  label: string;
  value: number;
};

function getCountdownParts(launchDate: string, now: number): CountdownPart[] {
  const remainingMs = Math.max(0, new Date(launchDate).getTime() - now);
  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;

  return [
    { label: "days", value: days },
    { label: "hours", value: hours },
    { label: "minutes", value: minutes },
    { label: "seconds", value: seconds },
  ];
}

export function ToolPrelaunchCountdown({ launchDate }: { launchDate: string }) {
  const [now, setNow] = useState(() => Date.now());
  const parts = getCountdownParts(launchDate, now);
  const hasLaunched = parts.every((part) => part.value === 0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1_000);

    return () => window.clearInterval(timer);
  }, []);

  if (hasLaunched) {
    return (
      <p className="text-sm font-black text-primary">
        Launching now
      </p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2" aria-label="Launch countdown">
      {parts.map((part) => (
        <span
          key={part.label}
          className="rounded-lg border border-primary/40 bg-primary/5 px-3 py-1.5 text-sm font-black tabular-nums text-primary"
        >
          {part.value} {part.label}
        </span>
      ))}
    </div>
  );
}
