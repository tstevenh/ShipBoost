"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronUp, Loader2, X } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";
import { PremiumLaunchIndicator } from "@/components/public/premium-launch-indicator";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { cn } from "@/lib/utils";

export type RequirementBoardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  upvoteCount: number;
  hasUpvoted: boolean;
  isPremium: boolean;
};

type Props = {
  submissionId: string;
  tools: RequirementBoardTool[];
  eligibleCount: number;
  requiredCount: number;
  onProgress: (eligibleCount: number, requiredCount: number) => void;
  onClose: () => void;
};

export function UpvoteRequirementModal({
  submissionId,
  tools,
  eligibleCount,
  requiredCount,
  onProgress,
  onClose,
}: Props) {
  const [voted, setVoted] = useState<Set<string>>(
    () => new Set(tools.filter((t) => t.hasUpvoted).map((t) => t.id)),
  );
  const [counts, setCounts] = useState<Record<string, number>>(
    () => Object.fromEntries(tools.map((t) => [t.id, t.upvoteCount])),
  );
  const [count, setCount] = useState(eligibleCount);
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const done = count >= requiredCount;

  // Lock background scroll while the modal is open (it only mounts when open).
  useBodyScrollLock();

  async function upvote(toolId: string) {
    setPendingIds((prev) => new Set(prev).add(toolId));
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/requirement-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message ?? "Could not record your upvote.");
      setVoted((prev) => new Set(prev).add(toolId));
      setCounts((prev) => ({ ...prev, [toolId]: (prev[toolId] ?? 0) + 1 }));
      setCount(payload.data.eligibleCount);
      onProgress(payload.data.eligibleCount, payload.data.requiredCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record your upvote.");
    } finally {
      // Keep this tool's loader until ITS own request settles, regardless of other clicks.
      setPendingIds((prev) => {
        const next = new Set(prev);
        next.delete(toolId);
        return next;
      });
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <div>
            <h2 className="font-heading text-lg font-black tracking-tight">Support this week&apos;s launches</h2>
            <p className="mt-0.5 text-sm font-medium text-muted-foreground">
              {done ? "You're all set — close to continue." : `${count} / ${requiredCount} upvotes`}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>

        {/* progress bar */}
        <div className="px-6 pt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${requiredCount === 0 ? 100 : Math.min(100, (count / requiredCount) * 100)}%` }}
            />
          </div>
        </div>

        {error ? <p className="px-6 pt-3 text-sm font-bold text-destructive">{error}</p> : null}

        <div className="overflow-y-auto px-6 py-4">
          <div className="overflow-hidden rounded-xl border border-border/60 bg-card [&>article:last-child]:border-b-0">
            {tools.map((tool) => {
              const isVoted = voted.has(tool.id);
              const isPending = pendingIds.has(tool.id);
              return (
                <article
                  key={tool.id}
                  className="group relative flex min-w-0 cursor-pointer items-center gap-3 overflow-hidden border-b border-border/60 px-4 py-4 transition-colors duration-200 hover:bg-muted sm:px-5 md:gap-4"
                >
                  <Link
                    href={`/tools/${tool.slug}`}
                    aria-label={`View ${tool.name} details`}
                    className="absolute inset-0 z-[1]"
                  />

                  {tool.isPremium ? (
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 z-[2] overflow-hidden"
                    >
                      <div
                        className="premium-shimmer-track absolute left-0 top-0 h-full w-[60%]"
                        style={{
                          background:
                            "linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,215,0,0.10) 35%, rgba(255,196,40,0.28) 50%, rgba(255,215,0,0.10) 65%, rgba(255,255,255,0) 100%)",
                        }}
                      />
                    </div>
                  ) : null}

                  <div className="pointer-events-none relative z-[3] flex min-w-0 flex-1 items-center gap-3 md:gap-4">
                    <div className="shrink-0">
                      <LogoFallback
                        name={tool.name}
                        src={tool.logoUrl ?? undefined}
                        sizes="56px"
                        className="h-14 w-14 rounded-lg border border-border/60"
                        textClassName="text-lg"
                      />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 py-0.5">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="truncate text-lg font-bold tracking-tight text-foreground">
                          {tool.name}
                        </span>
                        <span className="pointer-events-auto">
                          {tool.isPremium ? <PremiumLaunchIndicator /> : null}
                        </span>
                      </div>

                      <p className="line-clamp-1 text-sm font-normal leading-snug text-muted-foreground">
                        {tool.tagline}
                      </p>
                    </div>

                    <div className="pointer-events-auto shrink-0 self-center">
                      <button
                        type="button"
                        aria-label={`Upvote ${tool.name}`}
                        disabled={isVoted || isPending || done}
                        onClick={(event) => {
                          event.stopPropagation();
                          void upvote(tool.id);
                        }}
                        className={cn(
                          "flex h-14 min-w-[56px] flex-col items-center justify-center rounded-lg border transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50",
                          isVoted
                            ? "border-foreground bg-foreground text-background shadow-sm shadow-black/10"
                            : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground",
                        )}
                      >
                        {isPending ? (
                          <Loader2 size={18} className="mb-0.5 animate-spin" />
                        ) : (
                          <ChevronUp
                            className={cn(
                              "mb-0.5 size-5 transition-transform",
                              isVoted && "scale-110",
                            )}
                          />
                        )}
                        <span className="text-sm font-black leading-none">
                          {counts[tool.id] ?? 0}
                        </span>
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
