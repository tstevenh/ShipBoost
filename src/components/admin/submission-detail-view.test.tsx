import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmissionDetailView } from "@/components/admin/submission-detail-view";

const submission = {
  id: "submission_1",
  submissionType: "FEATURED_LAUNCH",
  reviewStatus: "DRAFT",
  preferredLaunchDate: new Date("2026-05-08T00:00:00.000Z"),
  paymentStatus: "PAID",
  badgeFooterUrl: "https://acme.test",
  badgeVerification: "PENDING",
  founderVisibleNote: null,
  internalReviewNote: null,
  spotlightBrief: {
    status: "IN_PROGRESS",
    audience: "Founders and growth operators",
    problem: "Finding a clean climbing gym directory takes too long.",
    differentiator: "It focuses only on indoor climbing gyms with better filters.",
    emphasis: "Lean into trust and discovery speed.",
    primaryCtaUrl: "https://acme.test/signup",
    founderQuote: "We built the gym directory we wanted ourselves.",
    wordingToAvoid: "Avoid calling it a marketplace.",
    firstTouchedAt: new Date("2026-04-17T02:00:00.000Z"),
    completedAt: null,
    publishedAt: null,
    updatedAt: new Date("2026-04-17T03:00:00.000Z"),
    publishedArticle: null,
  },
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
        launchType: "FEATURED",
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
    expect(screen.getByText("Badge: Not required")).toBeInTheDocument();
    expect(screen.getAllByText(/Launch date/i).length).toBeGreaterThan(0);
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("https://x.com/acme")).toBeInTheDocument();
    expect(screen.getByText("Spotlight brief")).toBeInTheDocument();
    expect(screen.getByText("Founders and growth operators")).toBeInTheDocument();
    expect(screen.getByText("https://acme.test/signup")).toBeInTheDocument();
    expect(screen.getByText("Avoid calling it a marketplace.")).toBeInTheDocument();
  });
});
