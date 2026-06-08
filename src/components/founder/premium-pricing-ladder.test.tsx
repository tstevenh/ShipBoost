import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PremiumPricingLadder } from "./premium-pricing-ladder";
import { resolvePremiumLaunchTier } from "@/lib/premium-pricing";

describe("PremiumPricingLadder", () => {
  it("shows spots left, current price, and the next price", () => {
    render(<PremiumPricingLadder tier={resolvePremiumLaunchTier(0)} />);
    expect(screen.getByText(/Only/)).toBeInTheDocument();
    expect(screen.getByText(/20 spots/)).toBeInTheDocument();
    expect(screen.getByText(/increases to/)).toBeInTheDocument();
    // the upcoming tier markers render ($39 only appears as a ladder step)
    expect(screen.getByText("$39")).toBeInTheDocument();
  });

  it("drops the 'next price' line on the final tier", () => {
    render(<PremiumPricingLadder tier={resolvePremiumLaunchTier(40)} />);
    expect(screen.getByText(/Now/)).toBeInTheDocument();
    expect(screen.queryByText(/increases to/)).not.toBeInTheDocument();
  });
});
