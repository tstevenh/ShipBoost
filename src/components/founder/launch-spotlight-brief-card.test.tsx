import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LaunchSpotlightBriefCard } from "@/components/founder/launch-spotlight-brief-card";

function buildResponse(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    submissionId: "submission_1",
    toolName: "Acme",
    launchDate: "2026-05-08T00:00:00.000Z",
    status: "NOT_STARTED",
    audience: null,
    problem: null,
    differentiator: null,
    emphasis: null,
    primaryCtaUrl: null,
    founderQuote: null,
    wordingToAvoid: null,
    updatedAt: "2026-04-16T03:00:00.000Z",
    publishedAt: null,
    publishedArticle: null,
    ...overrides,
  };
}

describe("launch-spotlight-brief-card", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads the initial brief state", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: buildResponse() }), { status: 200 }),
    );

    render(
      <LaunchSpotlightBriefCard
        submissionId="submission_1"
        status="NOT_STARTED"
        initialPublishedArticle={null}
      />,
    );

    expect(
      await screen.findByLabelText(/who is this for\?/i),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", { name: /editorial launch spotlight/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/not started/i)).toBeInTheDocument();
  });

  it("renders the published-state article link", async () => {
    vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: buildResponse({
            status: "PUBLISHED",
            publishedAt: "2026-05-08T00:00:00.000Z",
            publishedArticle: {
              slug: "launch-week-feature-acme",
              title: "Acme launch spotlight",
            },
          }),
        }),
        { status: 200 },
      ),
    );

    render(
      <LaunchSpotlightBriefCard
        submissionId="submission_1"
        status="PUBLISHED"
        initialPublishedArticle={{
          slug: "launch-week-feature-acme",
          title: "Acme launch spotlight",
        }}
      />,
    );

    const link = await screen.findByRole("link", { name: /view spotlight/i });
    expect(link).toHaveAttribute("href", "/blog/launch-week-feature-acme");
  });
});
