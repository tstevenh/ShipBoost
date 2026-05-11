"use client";

import dynamic from "next/dynamic";

function SidebarLeadMagnetFallback({ className }: { className?: string }) {
  return (
    <div
      className={[
        "relative w-full max-w-full overflow-hidden rounded-xl border border-border/60 bg-card p-4",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="h-3 w-28 rounded-full bg-muted" />
      <div className="mt-3 h-4 w-44 rounded-full bg-muted" />
      <div className="mt-2 h-3 w-full rounded-full bg-muted" />
      <div className="mt-3 h-9 w-full rounded-lg border border-border/70 bg-background" />
      <div className="mt-2 h-9 w-full rounded-lg bg-primary/80" />
    </div>
  );
}

export const DeferredSidebarLeadMagnetForm = dynamic(
  () =>
    import("./sidebar-lead-magnet-form").then(
      (module) => module.SidebarLeadMagnetForm,
    ),
  {
    ssr: false,
    loading: () => <SidebarLeadMagnetFallback />,
  },
);
