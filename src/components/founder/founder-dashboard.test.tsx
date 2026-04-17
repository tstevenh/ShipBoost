import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { FounderDashboard } from "@/components/founder/founder-dashboard";

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

describe("founder-dashboard", () => {
  it("shows Scheduled for approved free launches with a future launch slot", () => {
    render(
      <FounderDashboard
        initialSubmissions={[
          {
            id: "submission_1",
            submissionType: "FREE_LAUNCH",
            reviewStatus: "APPROVED",
            preferredLaunchDate: null,
            paymentStatus: "NOT_REQUIRED",
            badgeVerification: "VERIFIED",
            spotlightBrief: null,
            tool: {
              id: "tool_1",
              slug: "acme",
              name: "Acme",
              websiteUrl: "https://acme.test",
              logoMedia: null,
              launches: [
                {
                  id: "launch_1",
                  launchType: "FREE",
                  status: "APPROVED",
                  launchDate: "2099-05-08T00:00:00.000Z",
                },
              ],
            },
          },
        ]}
        initialTools={[]}
        initialClaims={[]}
        founderEmail="founder@example.com"
        founderRole="FOUNDER"
        initialActiveNav="submissions"
      />,
    );

    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText(/Launch date:/i)).toBeInTheDocument();
  });

  it("shows a compact spotlight summary with Continue spotlight brief for paid premium launches", () => {
    render(
      <FounderDashboard
        initialSubmissions={[
          {
            id: "submission_2",
            submissionType: "FEATURED_LAUNCH",
            reviewStatus: "APPROVED",
            preferredLaunchDate: "2099-05-12T00:00:00.000Z",
            paymentStatus: "PAID",
            badgeVerification: "NOT_REQUIRED",
            spotlightBrief: {
              status: "IN_PROGRESS",
              updatedAt: "2099-05-01T02:00:00.000Z",
              publishedAt: null,
              publishedArticle: null,
            },
            tool: {
              id: "tool_2",
              slug: "acme-premium",
              name: "Acme Premium",
              websiteUrl: "https://acme-premium.test",
              logoMedia: null,
              launches: [
                {
                  id: "launch_2",
                  launchType: "FEATURED",
                  status: "APPROVED",
                  launchDate: "2099-05-12T00:00:00.000Z",
                },
              ],
            },
          },
        ]}
        initialTools={[]}
        initialClaims={[]}
        founderEmail="founder@example.com"
        founderRole="FOUNDER"
        initialActiveNav="submissions"
      />,
    );

    expect(screen.getByText(/Editorial launch spotlight/i)).toBeInTheDocument();
    expect(screen.getByText(/Spotlight: In progress/i)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Continue spotlight brief/i }),
    ).toHaveAttribute("href", "/dashboard/submissions/submission_2/spotlight");
  });
});
