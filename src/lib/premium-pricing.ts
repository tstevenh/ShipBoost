// Premium Launch price ladder. Display auto-derives from the live paid count;
// the actual charge is set manually in Dodo when a band sells out (Option A).
// Adjust prices/capacities here — capacity is how many launches sell at that price.
export type PremiumLaunchTierConfig = {
  price: number;
  /** Number of launches sold at this price. The last tier uses Infinity. */
  capacity: number;
  label: string;
};

export const PREMIUM_LAUNCH_TIERS: PremiumLaunchTierConfig[] = [
  { price: 9, capacity: 20, label: "Founding" },
  { price: 19, capacity: 20, label: "Early access" },
  { price: 29, capacity: 20, label: "Growth" },
  { price: 39, capacity: Infinity, label: "Standard" },
];

export type PremiumLaunchTierStep = {
  price: number;
  label: string;
  state: "sold-out" | "current" | "upcoming";
};

export type ResolvedPremiumLaunchTier = {
  price: number;
  label: string;
  tierIndex: number;
  /** Remaining launches at the current price; null when the tier is unlimited. */
  spotsLeftInTier: number | null;
  /** The next tier's price, or null if this is the last tier. */
  nextPrice: number | null;
  /** Every tier with its state, for rendering the ladder. */
  steps: PremiumLaunchTierStep[];
};

export function resolvePremiumLaunchTier(
  paidCount: number,
  tiers: PremiumLaunchTierConfig[] = PREMIUM_LAUNCH_TIERS,
): ResolvedPremiumLaunchTier {
  const count = Math.max(0, Math.floor(Number.isFinite(paidCount) ? paidCount : 0));

  let cursor = 0;
  let currentIndex = tiers.length - 1; // default to the last tier
  for (let i = 0; i < tiers.length; i += 1) {
    const isLast = i === tiers.length - 1;
    const end = isLast ? Infinity : cursor + tiers[i].capacity;
    if (count < end) {
      currentIndex = i;
      break;
    }
    cursor = end;
  }

  const current = tiers[currentIndex];
  const bandStart = tiers
    .slice(0, currentIndex)
    .reduce((sum, t) => sum + t.capacity, 0);
  const spotsLeftInTier =
    current.capacity === Infinity ? null : Math.max(0, bandStart + current.capacity - count);
  const next = tiers[currentIndex + 1] ?? null;

  const steps: PremiumLaunchTierStep[] = tiers.map((tier, i) => ({
    price: tier.price,
    label: tier.label,
    state: i < currentIndex ? "sold-out" : i === currentIndex ? "current" : "upcoming",
  }));

  return {
    price: current.price,
    label: current.label,
    tierIndex: currentIndex,
    spotsLeftInTier,
    nextPrice: next ? next.price : null,
    steps,
  };
}

/**
 * Resolve the current tier treating the founding ($9) phase as already complete.
 * `foundingConsumed` is the number of founding launches sold (defaults to the
 * first tier's capacity) — we floor the count past it so the ladder never shows
 * the retired founding price as current.
 */
export function resolveCurrentPremiumLaunchTier(
  paidCount: number,
  foundingConsumed: number = PREMIUM_LAUNCH_TIERS[0].capacity,
): ResolvedPremiumLaunchTier {
  const safePaid = Math.max(0, Math.floor(Number.isFinite(paidCount) ? paidCount : 0));
  return resolvePremiumLaunchTier(Math.max(safePaid, foundingConsumed));
}
