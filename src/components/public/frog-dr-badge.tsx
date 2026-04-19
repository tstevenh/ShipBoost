import { cn } from "@/lib/utils";

type FrogDrBadgeProps = {
  className?: string;
};

export function FrogDrBadge({ className }: FrogDrBadgeProps) {
  return (
    <a
      href="https://frogdr.com?via=Shipboost"
      target="_blank"
      rel="noopener noreferrer"
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
    </a>
  );
}
