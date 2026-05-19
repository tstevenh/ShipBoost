import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  getReactionSummary,
  ReactionTimeTestTool,
} from "@/components/free-tools/reaction-time-test-tool";

describe("ReactionTimeTestTool", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("calculates best and average reaction scores", () => {
    expect(getReactionSummary([220, 180, 260])).toEqual({
      best: 180,
      average: 220,
    });
  });

  it("records rounds, calculates average and best, and resets", () => {
    vi.useFakeTimers();
    vi.setSystemTime(1_000);
    vi.spyOn(Math, "random").mockReturnValue(0);

    render(<ReactionTimeTestTool />);

    fireEvent.click(screen.getByRole("button", { name: /start test/i }));

    act(() => {
      vi.advanceTimersByTime(1_200);
      vi.advanceTimersByTime(210);
    });

    fireEvent.click(screen.getByRole("button", { name: /click now/i }));

    expect(screen.getAllByText("210 ms").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Last round: 210 ms/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^reset$/i }));

    expect(screen.getAllByText("--")).toHaveLength(7);
  });
});
