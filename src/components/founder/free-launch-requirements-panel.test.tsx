import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FreeLaunchRequirementsPanel } from "./free-launch-requirements-panel";

const tools = [
  { id: "a", slug: "a", name: "Acme", tagline: "ta", logoUrl: null, upvoteCount: 3, hasUpvoted: false },
  { id: "b", slug: "b", name: "Beta", tagline: "tb", logoUrl: null, upvoteCount: 1, hasUpvoted: false },
];

const badges = [
  { theme: "light" as const, label: "Light", previewSrc: "/badge/featured-light.svg", snippet: '<a data-theme="light"></a>' },
  { theme: "dark" as const, label: "Dark", previewSrc: "/badge/featured-dark.svg", snippet: '<a data-theme="dark"></a>' },
];

describe("FreeLaunchRequirementsPanel", () => {
  it("reports not-met when badge unverified, shows both badges, and the upvote progress", () => {
    const onMet = vi.fn();
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badges={badges}
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
    expect(screen.getByAltText(/ShipBoost Light badge/i)).toBeInTheDocument();
    expect(screen.getByAltText(/ShipBoost Dark badge/i)).toBeInTheDocument();
  });

  it("caps the displayed upvote count at the requirement (no '6 / 3')", () => {
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badges={badges}
        initialBadgeVerification="VERIFIED"
        tools={tools}
        initialEligibleCount={6}
        requiredCount={3}
        onRequirementsMet={vi.fn()}
      />,
    );
    expect(screen.getByText(/3\s*\/\s*3/)).toBeInTheDocument();
    expect(screen.queryByText(/6\s*\/\s*3/)).not.toBeInTheDocument();
  });

  it("waives the upvote step when requiredCount is 0", () => {
    const onMet = vi.fn();
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badges={badges}
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
