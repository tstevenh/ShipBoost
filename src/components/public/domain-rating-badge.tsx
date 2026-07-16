import { TrendingUp } from "lucide-react";

import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { siteDomainRating } from "@/content/site-domain-rating";
import { cn } from "@/lib/utils";

type DomainRatingBadgeProps = {
  className?: string;
  fullWidth?: boolean;
};

// Domain Rating by Ahrefs — attribution is required by the DR license.
// https://ahrefs.com/legal/domain-rating-license
export function DomainRatingBadge({ className, fullWidth }: DomainRatingBadgeProps) {
  const { value } = siteDomainRating;
  const pct = Math.max(0, Math.min(100, value));

  return (
    <TrackedExternalLink
      href="https://ahrefs.com/website-authority-checker?input=shipboost.io"
      target="_blank"
      rel="noopener noreferrer"
      sourceSurface="ahrefs_dr_badge"
      linkContext="footer"
      linkText="Domain Rating by Ahrefs"
      className={cn(
        "group mx-auto block w-full rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/25",
        fullWidth ? "max-w-none" : "max-w-[250px]",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-foreground" strokeWidth={2.5} />
        <span className="font-heading text-sm font-bold text-foreground">
          Domain Rating
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-1.5">
        <span className="font-heading text-[2rem] font-extrabold leading-none tracking-tight text-foreground">
          {value}
        </span>
        <span className="text-sm font-semibold text-muted-foreground">/ 100</span>
      </div>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-foreground"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5 border-t border-border pt-2.5">
        <span className="text-[11px] font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Domain Rating by
        </span>
        <span className="font-heading text-[11px] font-bold text-foreground">
          Ahrefs
        </span>
      </div>
    </TrackedExternalLink>
  );
}
