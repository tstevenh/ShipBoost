import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { cn } from "@/lib/utils";

type FrogDrBadgeProps = {
  className?: string;
};

export function FrogDrBadge({ className }: FrogDrBadgeProps) {
  return (
    <TrackedExternalLink
      href="https://frogdr.com/shipboost.io?via=Shipboost&utm_source=shipboost.io"
      target="_blank"
      rel="noopener noreferrer"
      sourceSurface="frogdr_badge"
      linkContext="footer"
      linkText="Monitor your Domain Rating with FrogDR"
      className={cn("mx-auto block w-fit", className)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://frogdr.com/shipboost.io/badge-white.svg"
        alt="Monitor your Domain Rating with FrogDR"
        width="250"
        height="54"
        className="block h-auto w-full max-w-[250px] dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://frogdr.com/shipboost.io/badge-dark.svg"
        alt="Monitor your Domain Rating with FrogDR"
        width="250"
        height="54"
        className="hidden h-auto w-full max-w-[250px] dark:block"
      />
    </TrackedExternalLink>
  );
}
