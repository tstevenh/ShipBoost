"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ChevronUp } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { authClient } from "@/lib/auth-client";

interface ToolCardProps {
  toolId: string;
  name: string;
  tagline: string;
  logoUrl?: string;
  slug: string;
  rank?: number;
  votes: number;
  hasUpvoted?: boolean;
  tags?: string[];
  initialDailyVotesRemaining?: number | null;
}

export function ToolCard({
  toolId,
  name,
  tagline,
  logoUrl,
  slug,
  rank,
  votes: initialVotes,
  hasUpvoted: initialHasUpvoted = false,
  tags = [],
  initialDailyVotesRemaining = null,
}: ToolCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = authClient.useSession();
  
  const [votes, setVotes] = useState(initialVotes);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [dailyVotesRemaining, setDailyVotesRemaining] = useState<number | null>(initialDailyVotesRemaining);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setVotes(initialVotes);
    setHasUpvoted(initialHasUpvoted);
  }, [initialVotes, initialHasUpvoted]);

  useEffect(() => {
    setDailyVotesRemaining(initialDailyVotesRemaining);
  }, [initialDailyVotesRemaining]);

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!session?.user.id) {
      router.push(`/sign-in?returnTo=${encodeURIComponent(pathname || "/")}`);
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/tools/${toolId}/vote`, {
            method: "POST",
          });
          const payload = await response.json();

          if (response.ok && payload.data) {
            setHasUpvoted(payload.data.hasUpvoted);
            setVotes(payload.data.upvoteCount);
            setDailyVotesRemaining(payload.data.dailyVotesRemaining);
          }
        } catch (error) {
          console.error("Upvote failed", error);
        }
      })();
    });
  };

  const isDisabled = isPending || (session?.user.id ? !hasUpvoted && dailyVotesRemaining === 0 : false);

  return (
    <article className="group relative flex items-center gap-5 p-5 bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      {/* Card Left: Logo */}
      <div className="shrink-0">
        <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-border bg-muted">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${name} logo`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex items-center justify-center w-full h-full text-lg font-bold text-muted-foreground/50">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      {/* Card Center: Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/tools/${slug}`}
            className="text-lg font-bold text-foreground hover:opacity-70 transition-all truncate"
          >
            {name}
            {rank && <span className="ml-2 text-muted-foreground/60 font-medium">#{rank}</span>}
          </Link>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-3">
          {tagline}
        </p>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-black tracking-wider uppercase text-muted-foreground/60 hover:text-foreground transition-colors cursor-pointer"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Card Right: Actions */}
      <div className="shrink-0 self-center">
        <button
          onClick={handleUpvote}
          disabled={isDisabled}
          className={cn(
            "flex flex-col items-center justify-center min-w-[56px] h-14 rounded-lg border transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed",
            hasUpvoted
              ? "bg-foreground text-background border-foreground shadow-sm shadow-black/10"
              : "bg-background border-border text-muted-foreground hover:border-foreground hover:text-foreground"
          )}
        >
          <ChevronUp className={cn("w-5 h-5 mb-0.5 transition-transform", hasUpvoted && "scale-110")} />
          <span className="text-sm font-black leading-none">{votes}</span>
        </button>
      </div>
    </article>
  );
}
