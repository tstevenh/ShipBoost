import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UpvoteRequirementModal } from "./upvote-requirement-modal";

const baseTools = [
  { id: "a", slug: "a", name: "Acme", tagline: "ta", logoUrl: null, upvoteCount: 3, hasUpvoted: false, isPremium: false },
  { id: "b", slug: "b", name: "Beta", tagline: "tb", logoUrl: null, upvoteCount: 1, hasUpvoted: false, isPremium: false },
];

afterEach(() => vi.restoreAllMocks());

describe("UpvoteRequirementModal", () => {
  it("shows progress and casts a vote, updating progress from the response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { eligibleCount: 1, requiredCount: 2 } }),
    }));
    const onProgress = vi.fn();

    render(
      <UpvoteRequirementModal
        submissionId="s1"
        tools={baseTools}
        eligibleCount={0}
        requiredCount={2}
        onProgress={onProgress}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/0\s*\/\s*2/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /upvote/i })[0]);

    await waitFor(() => expect(onProgress).toHaveBeenCalledWith(1, 2));
  });

  it("shows the verified premium indicator for premium board tools", () => {
    render(
      <UpvoteRequirementModal
        submissionId="s1"
        tools={[{ ...baseTools[0], isPremium: true }]}
        eligibleCount={0}
        requiredCount={1}
        onProgress={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByRole("button", { name: /verified premium launch/i })).toBeInTheDocument();
  });
});
