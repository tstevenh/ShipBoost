"use client";

import { useState } from "react";
import { Check, ChevronUp, Loader2, X } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";
import { cn } from "@/lib/utils";

export type RequirementBoardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  upvoteCount: number;
  hasUpvoted: boolean;
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
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = count >= requiredCount;

  async function upvote(toolId: string) {
    setPendingId(toolId);
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
      setPendingId(null);
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

        <div className="flex flex-col gap-3 overflow-y-auto px-6 py-4">
          {tools.map((tool) => {
            const isVoted = voted.has(tool.id);
            const isPending = pendingId === tool.id;
            return (
              <article
                key={tool.id}
                className="group flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 transition-all hover:border-foreground/20"
              >
                <div className="flex min-w-0 items-center gap-4">
                  <LogoFallback
                    name={tool.name}
                    src={tool.logoUrl ?? undefined}
                    sizes="48px"
                    className="h-12 w-12 shrink-0 rounded-xl border border-border"
                    textClassName="text-base"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-black">{tool.name}</p>
                    <p className="mt-0.5 line-clamp-1 text-sm font-medium text-muted-foreground">{tool.tagline}</p>
                  </div>
                </div>

                <button
                  type="button"
                  aria-label={`Upvote ${tool.name}`}
                  disabled={isVoted || isPending || done}
                  onClick={() => void upvote(tool.id)}
                  className={cn(
                    "flex h-14 min-w-[56px] shrink-0 flex-col items-center justify-center rounded-xl border transition-all duration-200 active:scale-95 disabled:cursor-not-allowed",
                    isVoted
                      ? "border-foreground bg-foreground text-background"
                      : "border-border bg-background text-muted-foreground hover:border-foreground hover:text-foreground disabled:opacity-50",
                  )}
                >
                  {isPending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : isVoted ? (
                    <Check size={18} />
                  ) : (
                    <ChevronUp size={18} />
                  )}
                  <span className="text-sm font-black leading-none">{counts[tool.id] ?? 0}</span>
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
