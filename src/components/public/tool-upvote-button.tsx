"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";

type ToolUpvoteButtonProps = {
  toolId: string;
  initialCount: number;
  initialHasUpvoted?: boolean;
  initialDailyVotesRemaining?: number | null;
  compact?: boolean;
};

export function ToolUpvoteButton({
  toolId,
  initialCount,
  initialHasUpvoted = false,
  initialDailyVotesRemaining = null,
  compact = false,
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

  const buttonClassName = compact
    ? `inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
        isDisabled
          ? "cursor-not-allowed border-black/8 bg-[#f2eee7] text-black/35"
          : hasUpvoted
            ? "border-[#9f4f1d]/25 bg-[#fff1dd] text-[#9f4f1d]"
            : "border-black/10 bg-white text-black/68 hover:bg-black/[0.03]"
      }`
    : `inline-flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
        isDisabled
          ? "cursor-not-allowed border-black/8 bg-[#f2eee7] text-black/35"
          : hasUpvoted
            ? "border-[#9f4f1d]/25 bg-[#fff1dd] text-[#9f4f1d]"
            : "border-black/10 bg-white text-black/72 hover:bg-black/[0.03]"
      }`;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <button
        type="button"
        onClick={handleVote}
        disabled={isDisabled}
        className={buttonClassName}
      >
        <span aria-hidden="true">{hasUpvoted ? "▲" : "△"}</span>
        <span>{hasUpvoted ? "Upvoted" : "Upvote"}</span>
        <span className="text-current/70">{count}</span>
      </button>

      {errorMessage ? (
        <p className="text-xs text-rose-700">{errorMessage}</p>
      ) : null}
    </div>
  );
}
