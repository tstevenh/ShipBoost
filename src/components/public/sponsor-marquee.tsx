import { cn } from "@/lib/utils";

/**
 * Scrolling "ADVERTISE · SPONSORED · …" strip. Visual-only — pure aesthetic
 * filler that signals the slot is available. Reuses the global
 * `.marquee-track` keyframes already defined in globals.css.
 */
export function SponsorMarquee({ className }: { className?: string }) {
  const tokens = [
    "ADVERTISE",
    "SPONSORED",
    "ADVERTISE",
    "SPONSORED",
    "ADVERTISE",
    "SPONSORED",
    "ADVERTISE",
    "SPONSORED",
  ];
  // Duplicate the list so the marquee loops seamlessly
  const doubled = [...tokens, ...tokens];

  return (
    <div
      className={cn(
        "marquee-group relative overflow-hidden border-b border-border/60",
        "[mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        "[-webkit-mask-image:linear-gradient(to_right,transparent,black_6%,black_94%,transparent)]",
        className,
      )}
      aria-hidden
    >
      <div className="marquee-track flex w-max items-center gap-5 py-1.5">
        {doubled.map((label, index) => (
          <span
            key={index}
            className="flex shrink-0 items-center gap-5 text-[10px] font-medium uppercase tracking-[0.28em] text-muted-foreground/35"
          >
            {label}
            <span aria-hidden className="text-muted-foreground/20">
              •
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
