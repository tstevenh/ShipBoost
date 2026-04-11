"use client";

import { useEffect, useState } from "react";

type ToolScreenshotRailProps = {
  screenshots: Array<{
    id: string;
    url: string;
  }>;
  toolName: string;
};

export function ToolScreenshotRail({
  screenshots,
  toolName,
}: ToolScreenshotRailProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || screenshots.length === 0) {
    return null;
  }

  return (
    <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">
      {screenshots.map((screenshot) => (
        <div
          key={screenshot.id}
          className="h-24 w-40 shrink-0 overflow-hidden rounded-xl border border-border bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={screenshot.url}
            alt={`${toolName} screenshot`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}
