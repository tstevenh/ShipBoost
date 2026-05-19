"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { X, ExternalLink, Eye } from "lucide-react";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

type AdSlot = "INLINE_PRODUCT" | "INLINE_BANNER" | "SIDEBAR";

const DUMMY = {
  name: "Your Product",
  tagline: "The tool you're advertising — your tagline goes right here.",
  initials: "YP",
};

// ── Fake feed rows ────────────────────────────────────────────────────────────

function FakeToolRow({
  name,
  tagline,
  rank,
  votes,
}: {
  name: string;
  tagline: string;
  rank: number;
  votes: number;
}) {
  return (
    <div className="flex items-center gap-3 border-b border-border/60 px-4 py-3.5 sm:px-5">
      <span className="w-5 shrink-0 text-center text-xs font-bold text-muted-foreground/40">
        {rank}
      </span>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-[10px] font-black text-muted-foreground/50">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{name}</p>
        <p className="truncate text-xs text-muted-foreground">{tagline}</p>
      </div>
      <div className="shrink-0 flex flex-col items-center gap-0.5 rounded-lg border border-border bg-card px-2.5 py-1">
        <span className="text-[9px] font-black text-muted-foreground/50">▲</span>
        <span className="text-xs font-bold text-foreground">{votes}</span>
      </div>
    </div>
  );
}

const FAKE_TOOLS = [
  { name: "LaunchKit", tagline: "Ship your SaaS in days, not months", votes: 214 },
  { name: "DeskFlow", tagline: "Async team workspace for remote builders", votes: 187 },
  { name: "PixelForge", tagline: "AI-generated product screenshots instantly", votes: 156 },
  { name: "FormPilot", tagline: "Forms that convert — no code needed", votes: 134 },
  { name: "Notionary", tagline: "Docs and wikis that don't suck", votes: 98 },
];

// ── Product Ad preview ────────────────────────────────────────────────────────

function ProductAdPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">
          Launchboard feed
        </p>
      </div>

      {FAKE_TOOLS.slice(0, 2).map((t, i) => (
        <FakeToolRow key={t.name} rank={i + 1} name={t.name} tagline={t.tagline} votes={t.votes} />
      ))}

      {/* ── The ad ── */}
      <div className="flex items-center gap-3 border-b border-border/60 bg-primary/[0.03] px-4 py-3.5 sm:px-5 ring-1 ring-inset ring-primary/10">
        <span className="w-5 shrink-0" />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[10px] font-black text-primary">
          {DUMMY.initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">{DUMMY.name}</p>
          <p className="truncate text-xs text-muted-foreground">{DUMMY.tagline}</p>
        </div>
        <div className="shrink-0 flex flex-col items-center">
          <span className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-foreground">
            Visit <ExternalLink size={10} />
          </span>
          <span className="mt-1 text-[8px] font-semibold uppercase tracking-widest text-primary/60">
            Sponsored
          </span>
        </div>
      </div>

      {FAKE_TOOLS.slice(2).map((t, i) => (
        <FakeToolRow key={t.name} rank={i + 3} name={t.name} tagline={t.tagline} votes={t.votes} />
      ))}
    </div>
  );
}

// ── Banner Ad preview ─────────────────────────────────────────────────────────

function BannerAdPreview() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background">
      <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
        <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">
          Launchboard feed
        </p>
      </div>

      {FAKE_TOOLS.slice(0, 2).map((t, i) => (
        <FakeToolRow key={t.name} rank={i + 1} name={t.name} tagline={t.tagline} votes={t.votes} />
      ))}

      {/* ── The banner ad ── */}
      <div className="relative overflow-hidden border-b border-border bg-background px-5 py-8 ring-1 ring-inset ring-primary/10">
        {/* Animated marquee text */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 overflow-hidden opacity-[0.05] pointer-events-none"
        >
          <div className="flex whitespace-nowrap text-2xl font-bold">
            {Array.from({ length: 6 }).map((_, i) => (
              <span key={i} className="mr-8">SPONSORED •</span>
            ))}
          </div>
        </div>

        <div className="relative flex items-center gap-4">
          <div className="hidden sm:flex w-14 items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-muted-foreground tracking-wider -rotate-90 whitespace-nowrap opacity-50">
              SPONSORED
            </span>
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="text-xl font-bold leading-tight tracking-tight text-foreground">
              {DUMMY.name}
            </h3>
            <p className="text-sm text-muted-foreground">{DUMMY.tagline}</p>
            <div className="flex items-center gap-2 pt-1">
              <div className="h-px w-6 bg-foreground" />
              <span className="text-[9px] uppercase tracking-widest text-muted-foreground">
                Visit site
              </span>
            </div>
          </div>
          <div className="h-16 w-16 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-black text-primary">
            {DUMMY.initials}
          </div>
        </div>
      </div>

      {FAKE_TOOLS.slice(2).map((t, i) => (
        <FakeToolRow key={t.name} rank={i + 3} name={t.name} tagline={t.tagline} votes={t.votes} />
      ))}
    </div>
  );
}

// ── Sidebar Ad preview ────────────────────────────────────────────────────────

function FakeSidebarCard({
  name,
  tagline,
}: {
  name: string;
  tagline: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-3.5">
      <p className="text-[9px] font-semibold uppercase tracking-widest text-muted-foreground/50">
        Sponsored
      </p>
      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted/60 text-[9px] font-black text-muted-foreground/50">
          {name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-foreground">{name}</p>
          <p className="truncate text-[10px] text-muted-foreground">{tagline}</p>
        </div>
      </div>
    </div>
  );
}

function SidebarAdPreview() {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
      {/* Feed column */}
      <div className="overflow-hidden rounded-2xl border border-border bg-background">
        <div className="border-b border-border/60 bg-muted/30 px-4 py-2.5">
          <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">
            Discovery feed
          </p>
        </div>
        {FAKE_TOOLS.map((t, i) => (
          <FakeToolRow key={t.name} rank={i + 1} name={t.name} tagline={t.tagline} votes={t.votes} />
        ))}
      </div>

      {/* Sidebar column */}
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[9px] font-black tracking-widest text-muted-foreground/50">
              Our partners
            </p>
            <span className="rounded-full border border-border/60 bg-card px-2 py-0.5 text-[9px] font-semibold text-muted-foreground">
              Advertise here →
            </span>
          </div>

          {/* The highlighted sponsor card */}
          <div className="rounded-xl border-2 border-primary bg-card p-3.5 ring-2 ring-primary/10">
            <p className="text-[9px] font-semibold uppercase tracking-widest text-primary/60">
              Sponsored
            </p>
            <div className="mt-2.5 flex items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-[9px] font-black text-primary">
                {DUMMY.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="truncate text-sm font-bold text-foreground">{DUMMY.name}</p>
                  <ExternalLink size={10} className="shrink-0 text-muted-foreground" />
                </div>
                <p className="line-clamp-2 text-[10px] leading-snug text-muted-foreground">
                  {DUMMY.tagline}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Other sidebar widgets (blurred filler) */}
        <div className="space-y-2 opacity-40">
          <div className="h-24 rounded-2xl border border-border bg-card" />
          <div className="h-16 rounded-2xl border border-border bg-card" />
        </div>
      </div>
    </div>
  );
}

// ── Modal shell ───────────────────────────────────────────────────────────────

const SLOT_CONFIG: Record<
  AdSlot,
  { label: string; description: string; Preview: () => React.ReactElement }
> = {
  INLINE_PRODUCT: {
    label: "Product Ad",
    description: "How your product appears as a native row in the launchboard feed.",
    Preview: ProductAdPreview,
  },
  INLINE_BANNER: {
    label: "Banner Ad",
    description: "How your full-width banner looks injected between feed rows.",
    Preview: BannerAdPreview,
  },
  SIDEBAR: {
    label: "Sidebar Ad",
    description: "How your product card appears in the persistent sidebar across all discovery pages.",
    Preview: SidebarAdPreview,
  },
};

function PreviewModal({
  slot,
  onClose,
}: {
  slot: AdSlot;
  onClose: () => void;
}) {
  const config = SLOT_CONFIG[slot];
  const Preview = config.Preview;

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-background/80 backdrop-blur-sm p-0 sm:p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[92dvh] sm:max-h-[85dvh] overflow-y-auto rounded-t-3xl sm:rounded-3xl border border-border bg-card shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 px-5 py-4 backdrop-blur-sm">
          <div>
            <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/50">
              Ad preview
            </p>
            <h2 className="text-base font-black tracking-tight text-foreground">
              {config.label}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close preview"
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="mb-4 text-sm font-medium text-muted-foreground">{config.description}</p>
          <Preview />
          <p className="mt-4 text-center text-[10px] font-medium text-muted-foreground/40">
            Illustration — actual appearance may vary by theme and screen size.
          </p>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ── Public trigger component ──────────────────────────────────────────────────

export function AdPreviewButton({
  slot,
  className,
}: {
  slot: AdSlot;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  useBodyScrollLock(open);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <Eye size={12} className="shrink-0" />
        See preview
      </button>

      {open && <PreviewModal slot={slot} onClose={() => setOpen(false)} />}
    </>
  );
}
