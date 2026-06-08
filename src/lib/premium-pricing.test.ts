import { describe, expect, it } from "vitest";

import {
  resolveCurrentPremiumLaunchTier,
  resolvePremiumLaunchTier,
} from "./premium-pricing";

describe("resolvePremiumLaunchTier", () => {
  it("starts in the founding ($9) tier at zero sales", () => {
    const t = resolvePremiumLaunchTier(0);
    expect(t.price).toBe(9);
    expect(t.spotsLeftInTier).toBe(20);
    expect(t.nextPrice).toBe(19);
    expect(t.steps.map((s) => s.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
      "upcoming",
    ]);
  });

  it("advances through $19 and $29 bands", () => {
    expect(resolvePremiumLaunchTier(20).price).toBe(19);
    expect(resolvePremiumLaunchTier(20).nextPrice).toBe(29);
    expect(resolvePremiumLaunchTier(40).price).toBe(29);
    expect(resolvePremiumLaunchTier(40).nextPrice).toBe(39);
  });

  it("reaches the final unlimited tier", () => {
    const t = resolvePremiumLaunchTier(60);
    expect(t.price).toBe(39);
    expect(t.spotsLeftInTier).toBeNull();
    expect(t.nextPrice).toBeNull();
    expect(t.steps.map((s) => s.state)).toEqual([
      "sold-out",
      "sold-out",
      "sold-out",
      "current",
    ]);
  });
});

describe("resolveCurrentPremiumLaunchTier", () => {
  it("treats founding as passed and lands on $19 even with low counts", () => {
    const t = resolveCurrentPremiumLaunchTier(0);
    expect(t.price).toBe(19);
    expect(t.spotsLeftInTier).toBe(20);
    expect(t.steps[0].state).toBe("sold-out"); // $9 shown as passed
    expect(t.steps[1].state).toBe("current");
  });

  it("counts early-access sales beyond founding", () => {
    expect(resolveCurrentPremiumLaunchTier(25).price).toBe(19);
    expect(resolveCurrentPremiumLaunchTier(25).spotsLeftInTier).toBe(15);
    expect(resolveCurrentPremiumLaunchTier(45).price).toBe(29);
  });
});
