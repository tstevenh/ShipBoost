import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureBrowserOutboundLinkClickedMock, usePathnameMock } = vi.hoisted(
  () => ({
    captureBrowserOutboundLinkClickedMock: vi.fn(),
    usePathnameMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserOutboundLinkClicked: captureBrowserOutboundLinkClickedMock,
}));

import { PostHogOutboundClickTracker } from "@/components/analytics/posthog-outbound-click-tracker";

describe("PostHogOutboundClickTracker", () => {
  beforeEach(() => {
    captureBrowserOutboundLinkClickedMock.mockReset();
    usePathnameMock.mockReturnValue("/blog/post");
    window.history.replaceState({}, "", "/blog/post?ref=test");
  });

  it("captures plain public outbound links", () => {
    render(
      <>
        <PostHogOutboundClickTracker apiKey="phc_test" />
        <a href="https://example.com/resource">Read more</a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Read more" }));

    expect(captureBrowserOutboundLinkClickedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://example.com/resource",
        sourcePath: "/blog/post?ref=test",
        sourceSurface: "blog_content",
        linkContext: "blog",
        linkText: "Read more",
        trackingMethod: "browser",
        isToolLink: false,
      }),
    );
  });

  it("does not duplicate links handled by TrackedExternalLink", () => {
    render(
      <>
        <PostHogOutboundClickTracker apiKey="phc_test" />
        <a href="https://example.com" data-shipboost-outbound-manual="true">
          Manual
        </a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Manual" }));

    expect(captureBrowserOutboundLinkClickedMock).not.toHaveBeenCalled();
  });

  it("does not track private dashboard routes", () => {
    usePathnameMock.mockReturnValue("/dashboard");
    window.history.replaceState({}, "", "/dashboard");

    render(
      <>
        <PostHogOutboundClickTracker apiKey="phc_test" />
        <a href="https://example.com">External</a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "External" }));

    expect(captureBrowserOutboundLinkClickedMock).not.toHaveBeenCalled();
  });
});
