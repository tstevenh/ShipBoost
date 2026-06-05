"use client";

import { useState } from "react";
import { ArrowUp, Check, X } from "lucide-react";

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
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-semibold">Support this week&apos;s launches</h2>
            <p className="text-sm text-muted-foreground">
              {done ? "You're all set — close to continue." : `${count} / ${requiredCount} upvotes`}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        <div className="px-6 pt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${requiredCount === 0 ? 100 : Math.min(100, (count / requiredCount) * 100)}%` }}
            />
          </div>
        </div>

        {error ? <p className="px-6 pt-3 text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-2 overflow-y-auto px-6 py-4">
          {tools.map((tool) => {
            const isVoted = voted.has(tool.id);
            return (
              <div key={tool.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tool.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{tool.tagline}</p>
                </div>
                <button
                  type="button"
                  disabled={isVoted || pendingId === tool.id || done}
                  onClick={() => void upvote(tool.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  {isVoted ? <Check className="size-3.5" /> : <ArrowUp className="size-3.5" />}
                  {isVoted ? "Upvoted" : "Upvote"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
