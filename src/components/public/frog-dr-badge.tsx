import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { cn } from "@/lib/utils";

type FrogDrBadgeProps = {
  className?: string;
  fullWidth?: boolean;
};

export function FrogDrBadge({ className, fullWidth }: FrogDrBadgeProps) {
  return (
    <TrackedExternalLink
      href="https://frogdr.com/shipboost.io?via=Shipboost&utm_source=shipboost.io"
      target="_blank"
      rel="noopener noreferrer"
      sourceSurface="frogdr_badge"
      linkContext="footer"
      linkText="Monitor your Domain Rating with FrogDR"
      className={cn(
        "mx-auto block w-full",
        fullWidth ? "max-w-none" : "max-w-[250px]",
        className,
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://frogdr.com/shipboost.io/badge-white.svg"
        alt="Monitor your Domain Rating with FrogDR"
        width="250"
        height="54"
        className={cn(
          "block h-auto w-full dark:hidden",
          fullWidth ? "max-w-none" : "max-w-[250px]",
        )}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://frogdr.com/shipboost.io/badge-dark.svg"
        alt="Monitor your Domain Rating with FrogDR"
        width="250"
        height="54"
        className={cn(
          "hidden h-auto w-full dark:block",
          fullWidth ? "max-w-none" : "max-w-[250px]",
        )}
      />
    </TrackedExternalLink>
  );
}
