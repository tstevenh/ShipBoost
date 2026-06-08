import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PremiumPricingLadder } from "./premium-pricing-ladder";
import { resolvePremiumLaunchTier } from "@/lib/premium-pricing";

describe("PremiumPricingLadder", () => {
  it("shows spots left, and the next price, with all tier markers", () => {
    render(<PremiumPricingLadder tier={resolvePremiumLaunchTier(0)} />);
    expect(screen.getByText(/left at this price/)).toBeInTheDocument();
    expect(screen.getByText("20")).toBeInTheDocument();
    expect(screen.getByText(/then/)).toBeInTheDocument();
    // $39 only appears as the upcoming ladder marker
    expect(screen.getByText("$39")).toBeInTheDocument();
  });

  it("shows the final tier with no next price", () => {
    render(<PremiumPricingLadder tier={resolvePremiumLaunchTier(60)} />);
    expect(screen.getByText(/Final tier/)).toBeInTheDocument();
    expect(screen.queryByText(/then/)).not.toBeInTheDocument();
  });
});
