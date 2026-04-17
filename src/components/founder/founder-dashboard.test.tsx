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

vi.mock("@/components/founder/launch-spotlight-brief-card", () => ({
  LaunchSpotlightBriefCard: () => <div>spotlight brief</div>,
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
});
