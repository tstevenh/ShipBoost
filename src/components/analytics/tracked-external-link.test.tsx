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
        href="https://frogdr.com/shipboost.io"
        sourceSurface="footer"
        linkContext="footer"
      >
        FrogDR
      </TrackedExternalLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "FrogDR" }));

    expect(captureBrowserOutboundLinkClickedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://frogdr.com/shipboost.io",
        sourcePath: "/about?from=footer",
        sourceSurface: "footer",
        linkContext: "footer",
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
