import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureBrowserOutboundLinkClickedMock } = vi.hoisted(() => ({
  captureBrowserOutboundLinkClickedMock: vi.fn(),
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserOutboundLinkClicked: captureBrowserOutboundLinkClickedMock,
}));

import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";

describe("TrackedExternalLink", () => {
  beforeEach(() => {
    captureBrowserOutboundLinkClickedMock.mockReset();
    window.history.replaceState({}, "", "/about?from=footer");
  });

  it("captures the master outbound event for external webpage links", () => {
    render(
      <TrackedExternalLink
        href="https://example.com/partner"
        sourceSurface="footer"
        linkContext="footer"
      >
        Partner
      </TrackedExternalLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Partner" }));

    expect(captureBrowserOutboundLinkClickedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/partner?utm_source=shipboost&utm_medium=referral&utm_campaign=footer&utm_content=Partner",
        sourcePath: "/about?from=footer",
        sourceSurface: "footer",
        linkContext: "footer",
        linkText: "Partner",
        trackingMethod: "browser",
        isToolLink: false,
      }),
    );
  });

  it("does not capture for internal links", () => {
    render(
      <TrackedExternalLink
        href="/pricing"
        sourceSurface="footer"
        linkContext="footer"
      >
        Pricing
      </TrackedExternalLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Pricing" }));

    expect(captureBrowserOutboundLinkClickedMock).not.toHaveBeenCalled();
  });
});
