import { render, screen, waitFor } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { StreakSidebar } from "./streak-sidebar";

describe("StreakSidebar", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      if (url === "/api/streaks/snapshot") {
        return {
          ok: true,
          json: async () => ({
            data: {
              streakCount: 3,
              nextMilestone: 5,
              activeMultiplier: 1,
              lotteryUnlocked: false,
              last5Days: Array(5).fill({ day: "", active: false }),
              todayRoll: null,
            },
          }),
        };
      }
      return { ok: false };
    }) as unknown as typeof fetch;
  });

  it("renders streak count and locked lottery", async () => {
    render(<StreakSidebar />);
    await waitFor(() => {
      expect(screen.getByText(/3 DAY STREAK/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Unlocks at 25-day streak/)).toBeInTheDocument();
  });
});
