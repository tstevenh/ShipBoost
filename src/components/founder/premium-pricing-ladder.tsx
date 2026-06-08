import { cn } from "@/lib/utils";
import type { ResolvedPremiumLaunchTier } from "@/lib/premium-pricing";

export function PremiumPricingLadder({ tier }: { tier: ResolvedPremiumLaunchTier }) {
  const { price, spotsLeftInTier, nextPrice, steps, tierIndex } = tier;
  const fillPct = ((tierIndex + 0.5) / steps.length) * 100;

  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-3.5">
      <p className="flex items-center gap-1.5 text-sm font-black text-foreground">
        <span aria-hidden>🔥</span>
        {spotsLeftInTier !== null ? (
          <span>
            Only{" "}
            <span className="text-amber-600 dark:text-amber-500">
              {spotsLeftInTier} {spotsLeftInTier === 1 ? "spot" : "spots"}
            </span>{" "}
            left at <span className="text-amber-600 dark:text-amber-500">${price}</span>
          </span>
        ) : (
          <span>
            Now <span className="text-amber-600 dark:text-amber-500">${price}</span> / launch
          </span>
        )}
      </p>

      {nextPrice !== null ? (
        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
          Catch yours — price increases to{" "}
          <span className="font-bold text-foreground">${nextPrice}</span> next.
        </p>
      ) : null}

      <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-amber-500/15">
        <div
          className="absolute left-0 top-0 h-full rounded-full bg-amber-500 transition-all"
          style={{ width: `${fillPct}%` }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between">
        {steps.map((step, i) => (
          <span
            key={i}
            className={cn(
              "text-[11px] font-black",
              step.state === "current"
                ? "text-amber-600 dark:text-amber-500"
                : step.state === "sold-out"
                  ? "text-muted-foreground/40 line-through"
                  : "text-muted-foreground/50",
            )}
          >
            ${step.price}
          </span>
        ))}
      </div>
    </div>
  );
}
