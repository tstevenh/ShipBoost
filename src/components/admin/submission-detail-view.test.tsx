import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmissionDetailView } from "@/components/admin/submission-detail-view";

const submission = {
  id: "submission_1",
  submissionType: "FREE_LAUNCH",
  reviewStatus: "DRAFT",
  preferredLaunchDate: null,
  paymentStatus: "NOT_REQUIRED",
  badgeFooterUrl: "https://acme.test",
  badgeVerification: "PENDING",
  founderVisibleNote: null,
  internalReviewNote: null,
  createdAt: new Date("2026-04-17T00:00:00.000Z"),
  updatedAt: new Date("2026-04-17T01:00:00.000Z"),
  user: { id: "user_1", name: "Founder", email: "founder@example.com" },
  tool: {
    id: "tool_1",
    slug: "acme",
    name: "Acme",
    tagline: "Ship faster",
    websiteUrl: "https://acme.test",
    richDescription:
      "A founder-facing description that is long enough to display in the admin detail view.",
    pricingModel: "FREEMIUM",
    affiliateUrl: null,
    affiliateSource: null,
    hasAffiliateProgram: false,
    founderXUrl: "https://x.com/acme",
    founderGithubUrl: null,
    founderLinkedinUrl: null,
    founderFacebookUrl: null,
    logoMedia: { url: "https://cdn.test/logo.png" },
    media: [
      {
        id: "media_1",
        type: "SCREENSHOT",
        url: "https://cdn.test/shot.png",
        sortOrder: 0,
      },
    ],
    toolCategories: [
      { categoryId: "cat_1", category: { id: "cat_1", name: "Analytics", slug: "analytics" } },
    ],
    toolTags: [{ tagId: "tag_1", tag: { id: "tag_1", name: "AI", slug: "ai" } }],
    launches: [
      {
        id: "launch_1",
        launchType: "FREE",
        status: "APPROVED",
        launchDate: new Date("2026-05-08T00:00:00.000Z"),
      },
    ],
  },
} as const;

describe("submission-detail-view", () => {
  it("renders saved draft fields and assigned launch date", () => {
    render(<SubmissionDetailView submission={submission as never} />);

    expect(screen.getByRole("heading", { name: "Acme" })).toBeInTheDocument();
    expect(screen.getByText("Badge: Pending")).toBeInTheDocument();
    expect(screen.getByText(/Launch date/i)).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("https://x.com/acme")).toBeInTheDocument();
  });
});
