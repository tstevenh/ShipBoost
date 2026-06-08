import { cn } from "@/lib/utils";
import type { ResolvedPremiumLaunchTier } from "@/lib/premium-pricing";

/**
 * Refined, monochrome tier stepper for the premium launch card.
 * Sold-out tiers are solid foreground dots, the live tier is the single amber
 * node, upcoming tiers are hollow. One quiet scarcity line — no alert box.
 */
export function PremiumPricingLadder({ tier }: { tier: ResolvedPremiumLaunchTier }) {
  const { spotsLeftInTier, nextPrice, steps, tierIndex } = tier;
  const fillPct = steps.length > 1 ? (tierIndex / (steps.length - 1)) * 100 : 0;

  return (
    <div className="mt-5 border-t border-border/70 pt-4">
      <p className="text-xs font-medium leading-relaxed text-muted-foreground">
        {spotsLeftInTier !== null ? (
          <>
            <span className="font-black tabular-nums text-foreground">{spotsLeftInTier}</span>{" "}
            {spotsLeftInTier === 1 ? "spot" : "spots"} left at this price
            {nextPrice !== null ? (
              <>
                {" "}
                · then <span className="font-bold text-foreground">${nextPrice}</span>
              </>
            ) : null}
          </>
        ) : (
          <>Final tier — locked at the current rate</>
        )}
      </p>

      <div className="relative mt-4 flex items-start justify-between px-1">
        {/* track */}
        <span aria-hidden className="absolute inset-x-2 top-[5px] h-px bg-border" />
        <span
          aria-hidden
          className="absolute left-2 top-[5px] h-px bg-foreground transition-all duration-500"
          style={{ width: `calc(${fillPct}% - 8px)` }}
        />

        {steps.map((step, i) => (
          <div key={i} className="relative z-[1] flex flex-col items-center gap-2">
            <span
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-colors",
                step.state === "current"
                  ? "bg-amber-500 ring-4 ring-amber-500/15"
                  : step.state === "sold-out"
                    ? "bg-foreground"
                    : "border border-border bg-card",
              )}
            />
            <span
              className={cn(
                "text-[11px] font-black tabular-nums",
                step.state === "current"
                  ? "text-foreground"
                  : step.state === "sold-out"
                    ? "text-muted-foreground/40 line-through"
                    : "text-muted-foreground/50",
              )}
            >
              ${step.price}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
