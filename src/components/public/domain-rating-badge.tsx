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
  return (
    <TrackedExternalLink
      href="https://ahrefs.com/website-authority-checker?input=shipboost.io"
      target="_blank"
      rel="noopener noreferrer"
      sourceSurface="ahrefs_dr_badge"
      linkContext="footer"
      linkText="Domain Rating by Ahrefs"
      className={cn(
        "mx-auto block w-full rounded-xl border border-border bg-card px-4 py-3 text-center transition-colors hover:bg-accent",
        fullWidth ? "max-w-none" : "max-w-[250px]",
        className,
      )}
    >
      <span className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Domain Rating
      </span>
      <span className="mt-0.5 block text-2xl font-black leading-none text-foreground">
        {siteDomainRating.value}
        <span className="text-base font-bold text-muted-foreground"> / 100</span>
      </span>
      <span className="mt-1.5 block text-[11px] font-medium text-muted-foreground">
        Domain Rating by Ahrefs
      </span>
    </TrackedExternalLink>
  );
}
