import Link from "next/link";
import { Trophy, ExternalLink } from "lucide-react";

import { LogoFallback } from "@/components/ui/logo-fallback";
import { cn } from "@/lib/utils";

export type TopWinnerSidebarSpotWinner = {
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    upvoteCount: number;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

type TopWinnerSidebarSpotProps = {
  winner: TopWinnerSidebarSpotWinner | null;
  className?: string;
};

export function TopWinnerSidebarSpot({
  winner,
  className,
}: TopWinnerSidebarSpotProps) {
  if (!winner) {
    return (
      <section className={cn("w-full max-w-[250px] space-y-2", className)}>
        <div className="flex items-center justify-between">
          <h3 className="text-[9px] font-black tracking-[0.18em] text-muted-foreground">
            TOP 1 WINNER
          </h3>
          <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest text-amber-600">
            <Trophy size={11} />
            Weekly prize
          </span>
        </div>

        <div className="overflow-hidden rounded-xl border border-amber-500/20 bg-card p-3.5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/20 bg-amber-500/10 text-amber-700">
              <Trophy size={16} />
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-700">
              #1
            </span>
          </div>

          <h4 className="mt-2.5 text-xs font-black tracking-tight text-foreground">
            First winner coming soon
          </h4>
          <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-muted-foreground">
            The top product from the completed weekly board will be featured here
            during the next launch cycle.
          </p>
        </div>
      </section>
    );
  }

  const primaryCategory = winner.tool.toolCategories[0]?.category ?? null;

  return (
    <section className={cn("w-full max-w-[250px] space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-[9px] font-black tracking-[0.18em] text-muted-foreground">
          TOP 1 WINNER
        </h3>
        <span className="inline-flex items-center gap-1 text-[9px] font-black tracking-widest text-amber-600">
          <Trophy size={11} />
          Last week
        </span>
      </div>

      <Link
        href={`/tools/${winner.tool.slug}`}
        className="group block overflow-hidden rounded-xl border border-amber-500/20 bg-card p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/10"
      >
        <div className="flex items-start justify-between gap-3">
          <LogoFallback
            name={winner.tool.name}
            src={winner.tool.logoMedia?.url}
            websiteUrl={winner.tool.websiteUrl}
            sizes="40px"
            className="h-10 w-10 rounded-lg border border-border"
            textClassName="text-xs"
          />
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[9px] font-black tracking-widest text-amber-700">
            #1
          </span>
        </div>

        <h4 className="mt-2.5 line-clamp-1 text-xs font-black tracking-tight text-foreground">
          {winner.tool.name}
        </h4>
        <p className="mt-1.5 line-clamp-2 text-[11px] font-medium leading-relaxed text-muted-foreground">
          {winner.tool.tagline}
        </p>

        <div className="mt-2.5 flex items-center justify-between gap-3 border-t border-border pt-2.5">
          <div className="min-w-0">
            <p className="text-[9px] font-black tracking-widest text-muted-foreground/60">
              {winner.tool.upvoteCount} vote{winner.tool.upvoteCount === 1 ? "" : "s"}
            </p>
            {primaryCategory ? (
              <p className="mt-1 truncate text-[9px] font-black tracking-widest text-muted-foreground/50">
                {primaryCategory.name}
              </p>
            ) : null}
          </div>
          <span className="inline-flex shrink-0 items-center gap-1 text-[9px] font-black tracking-widest text-foreground transition-opacity group-hover:opacity-70">
            View launch
            <ExternalLink size={11} />
          </span>
        </div>
      </Link>
    </section>
  );
}
