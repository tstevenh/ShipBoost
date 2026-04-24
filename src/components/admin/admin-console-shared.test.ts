import { describe, expect, it } from "vitest";

import {
  getSubmissionBadgeLabel,
  getSubmissionLifecycle,
  type Submission,
} from "@/components/admin/admin-console-shared";

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

describe("admin-console-shared", () => {
  it("returns Draft for draft submissions", () => {
    expect(getSubmissionLifecycle(buildSubmission())).toEqual({
      label: "Draft",
      tone: "slate",
    });
  });

  it("returns a not verified badge label for unverified free launches", () => {
    expect(getSubmissionBadgeLabel(buildSubmission())).toBe("Badge: Not verified");
  });

  it("returns a verified badge label for verified free launches", () => {
    expect(
      getSubmissionBadgeLabel(
        buildSubmission({
          badgeVerification: "VERIFIED",
        }),
      ),
    ).toBe("Badge: Verified");
  });

  it("returns not-required badge label for premium launches", () => {
    expect(
      getSubmissionBadgeLabel(
        buildSubmission({
          submissionType: "FEATURED_LAUNCH",
          paymentStatus: "PAID",
          badgeVerification: "NOT_REQUIRED",
        }),
      ),
    ).toBe("Badge: Not required");
  });
});
