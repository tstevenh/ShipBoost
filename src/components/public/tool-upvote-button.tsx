"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronUp, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

type ToolUpvoteButtonProps = {
  toolId: string;
  initialCount: number;
  initialHasUpvoted?: boolean;
  initialDailyVotesRemaining?: number | null;
  variant?: "default" | "compact" | "large";
};

export function ToolUpvoteButton({
  toolId,
  initialCount,
  initialHasUpvoted = false,
  initialDailyVotesRemaining = null,
  variant = "default",
}: ToolUpvoteButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [dailyVotesRemaining, setDailyVotesRemaining] = useState<number | null>(
    initialDailyVotesRemaining,
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCount(initialCount);
  }, [initialCount]);

  useEffect(() => {
    setHasUpvoted(initialHasUpvoted);
  }, [initialHasUpvoted]);

  useEffect(() => {
    setDailyVotesRemaining(initialDailyVotesRemaining);
  }, [initialDailyVotesRemaining]);

  function handleVote() {
    if (!session?.user.id) {
      router.push(`/sign-in?returnTo=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    startTransition(() => {
      void (async () => {
        setErrorMessage(null);

        try {
          const response = await fetch(`/api/tools/${toolId}/vote`, {
            method: "POST",
          });
          const payload = (await response.json().catch(() => null)) as
            | {
                data?: {
                  hasUpvoted: boolean;
                  upvoteCount: number;
                  dailyVotesRemaining: number;
                };
                error?: string;
              }
            | null;

          if (!response.ok || !payload?.data) {
            throw new Error(payload?.error ?? "Unable to update upvote.");
          }

          setHasUpvoted(payload.data.hasUpvoted);
          setCount(payload.data.upvoteCount);
          setDailyVotesRemaining(payload.data.dailyVotesRemaining);
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Unable to update upvote.";

          if (message === "Daily upvote limit reached.") {
            setDailyVotesRemaining(0);
            setErrorMessage(null);
            return;
          }

          setErrorMessage(message);
        }
      })();
    });
  }

  const isDisabled =
    isPending || (session?.user.id ? !hasUpvoted && dailyVotesRemaining === 0 : false);

  if (variant === "large") {
    return (
      <div className="w-full">
        <button
          type="button"
          onClick={handleVote}
          disabled={isDisabled}
          className={cn(
            "flex w-full items-center justify-center gap-3 rounded-xl border-2 py-4 text-lg font-black transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed",
            hasUpvoted 
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 shadow-sm shadow-emerald-500/5"
              : "bg-primary text-primary-foreground border-primary hover:opacity-90 shadow-xl shadow-black/10"
          )}
        >
          {isPending ? (
            <Loader2 size={24} className="animate-spin" />
          ) : (
            <>
              <ChevronUp className={cn("size-6 transition-transform", hasUpvoted && "scale-110")} />
              <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
              <span className="ml-auto px-3 border-l border-current/20">{count}</span>
            </>
          )}
        </button>
        {errorMessage && <p className="mt-3 text-xs font-bold text-destructive text-center">{errorMessage}</p>}
      </div>
    );
  }

  return (
    <div className={variant === "compact" ? "inline-flex" : "block"}>
      <button
        type="button"
        onClick={handleVote}
        disabled={isDisabled}
        className={cn(
          "inline-flex items-center gap-2 font-bold transition-all active:scale-95 disabled:cursor-not-allowed",
          isDisabled ? "border-border bg-muted/50 text-muted-foreground/40" :
          hasUpvoted
            ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 shadow-sm shadow-emerald-500/5"
            : "border-border bg-background text-foreground hover:border-foreground hover:text-foreground",
          variant === "compact" ? "rounded-full border px-3 py-1 text-[10px]" : "rounded-xl border px-5 py-2.5 text-sm"
        )}
      >
        {isPending ? (
          <Loader2 size={14} className="animate-spin" />
        ) : (
          <>
            <ChevronUp size={14} className={cn(hasUpvoted && "scale-110")} />
            <span className="tracking-tight">{hasUpvoted ? "Upvoted" : "Upvote"}</span>
            <span className="ml-1 font-extrabold">{count}</span>
          </>
        )}
      </button>

      {errorMessage ? (
        <p className="mt-2 text-xs font-medium text-destructive">{errorMessage}</p>
      ) : null}
    </div>
  );
}
