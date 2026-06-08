import { describe, expect, it } from "vitest";

import { resolvePremiumLaunchTier } from "./premium-pricing";

describe("resolvePremiumLaunchTier", () => {
  it("is in the first tier with full spots at zero sales", () => {
    const t = resolvePremiumLaunchTier(0);
    expect(t.price).toBe(19);
    expect(t.spotsLeftInTier).toBe(20);
    expect(t.nextPrice).toBe(29);
    expect(t.tierIndex).toBe(0);
    expect(t.steps.map((s) => s.state)).toEqual(["current", "upcoming", "upcoming"]);
  });

  it("counts down spots within the first tier", () => {
    expect(resolvePremiumLaunchTier(19).spotsLeftInTier).toBe(1);
    expect(resolvePremiumLaunchTier(19).price).toBe(19);
  });

  it("advances to the second tier once the first sells out", () => {
    const t = resolvePremiumLaunchTier(20);
    expect(t.price).toBe(29);
    expect(t.spotsLeftInTier).toBe(20);
    expect(t.nextPrice).toBe(39);
    expect(t.steps.map((s) => s.state)).toEqual(["sold-out", "current", "upcoming"]);
  });

  it("reaches the final unlimited tier", () => {
    const t = resolvePremiumLaunchTier(40);
    expect(t.price).toBe(39);
    expect(t.spotsLeftInTier).toBeNull();
    expect(t.nextPrice).toBeNull();
    expect(t.steps.map((s) => s.state)).toEqual(["sold-out", "sold-out", "current"]);
  });

  it("clamps negative/garbage counts to the first tier", () => {
    expect(resolvePremiumLaunchTier(-5).price).toBe(19);
    expect(resolvePremiumLaunchTier(Number.NaN).price).toBe(19);
  });
});
