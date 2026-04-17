import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { SubmissionReviewPanel } from "@/components/admin/submission-review-panel";
import type { Submission } from "@/components/admin/admin-console-shared";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

function buildSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "submission_1",
    submissionType: "FREE_LAUNCH",
    reviewStatus: "DRAFT",
    preferredLaunchDate: null,
    paymentStatus: "NOT_REQUIRED",
    badgeFooterUrl: null,
    badgeVerification: "PENDING",
    founderVisibleNote: null,
    internalReviewNote: null,
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T01:00:00.000Z",
    spotlightBrief: null,
    user: {
      id: "user_1",
      name: "Founder",
      email: "founder@example.com",
    },
    tool: {
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      tagline: "Ship faster",
      websiteUrl: "https://acme.test",
      logoMedia: null,
      launches: [],
    },
    ...overrides,
  };
}

describe("submission-review-panel", () => {
  it("does not show review actions for drafts and links to the detail page", () => {
    render(
      <SubmissionReviewPanel
        submissionSearch=""
        onSubmissionSearchChange={() => {}}
        submissionFilter=""
        onSubmissionFilterChange={() => {}}
        submissionError={null}
        submissions={[buildSubmission()]}
        submissionNotes={{}}
        setSubmissionNotes={() => {}}
        handleSubmissionReview={() => {}}
        handleSubmissionSpotlightLink={() => {}}
        hasPendingAction={false}
        isActionPending={() => false}
      />,
    );

    expect(
      screen.queryByRole("button", { name: /approve & publish/i }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/admin/submissions/submission_1",
    );
    expect(screen.getByText("Badge: Pending")).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });
});
