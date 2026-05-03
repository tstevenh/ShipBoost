import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PremiumLaunchIndicator } from "@/components/public/premium-launch-indicator";

describe("PremiumLaunchIndicator", () => {
  it("opens premium launch details and closes with Escape", async () => {
    render(<PremiumLaunchIndicator />);

    fireEvent.click(screen.getByRole("button", { name: "Premium launch" }));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Get stronger launch visibility")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Get Premium Launch" }),
    ).toHaveAttribute("href", "/submit");

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
