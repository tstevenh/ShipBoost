"use client";

import Image from "next/image";
import Link from "next/link";

import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";

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
  votes,
  hasUpvoted = false,
  tags = [],
  initialDailyVotesRemaining = null,
}: ToolCardProps) {
  return (
    <article className="group relative flex items-center gap-5 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div className="shrink-0">
        <div className="relative h-12 w-12 overflow-hidden rounded-lg border border-border bg-muted">
          {logoUrl ? (
            <Image
              src={logoUrl}
              alt={`${name} logo`}
              fill
              sizes="48px"
              className="object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-muted-foreground/50">
              {name.slice(0, 2).toUpperCase()}
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Link
            href={`/tools/${slug}`}
            className="truncate text-lg font-bold text-foreground transition-all hover:opacity-70"
          >
            {name}
            {rank ? (
              <span className="ml-2 font-medium text-muted-foreground/60">
                #{rank}
              </span>
            ) : null}
          </Link>
        </div>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tagline}
        </p>

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="cursor-pointer text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="shrink-0 self-center">
        <ToolUpvoteButton
          toolId={toolId}
          initialCount={votes}
          initialHasUpvoted={hasUpvoted}
          initialDailyVotesRemaining={initialDailyVotesRemaining}
          variant="card"
        />
      </div>
    </article>
  );
}
