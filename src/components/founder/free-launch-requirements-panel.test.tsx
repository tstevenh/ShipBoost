import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FreeLaunchRequirementsPanel } from "./free-launch-requirements-panel";

const tools = [
  { id: "a", slug: "a", name: "Acme", tagline: "ta", logoUrl: null, upvoteCount: 3, hasUpvoted: false },
  { id: "b", slug: "b", name: "Beta", tagline: "tb", logoUrl: null, upvoteCount: 1, hasUpvoted: false },
];

describe("FreeLaunchRequirementsPanel", () => {
  it("reports not-met when badge unverified, and shows the upvote progress", () => {
    const onMet = vi.fn();
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badgeSnippet={'<a></a>'}
        badgePreviewSrc="/badge.svg"
        initialBadgeVerification="PENDING"
        tools={tools}
        initialEligibleCount={0}
        requiredCount={2}
        onRequirementsMet={onMet}
      />,
    );
    expect(onMet).toHaveBeenLastCalledWith(false);
    expect(screen.getByText(/0\s*\/\s*2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upvote now/i })).toBeInTheDocument();
  });

  it("waives the upvote step when requiredCount is 0", () => {
    const onMet = vi.fn();
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badgeSnippet={'<a></a>'}
        badgePreviewSrc="/badge.svg"
        initialBadgeVerification="VERIFIED"
        tools={[]}
        initialEligibleCount={0}
        requiredCount={0}
        onRequirementsMet={onMet}
      />,
    );
    expect(onMet).toHaveBeenLastCalledWith(true);
    expect(screen.getByText(/no other launches to upvote/i)).toBeInTheDocument();
  });
});
