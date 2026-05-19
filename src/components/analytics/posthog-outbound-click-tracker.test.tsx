import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  captureBrowserOutboundLinkClickedMock,
  captureBrowserToolOutboundClickMock,
  usePathnameMock,
} = vi.hoisted(() => ({
    captureBrowserOutboundLinkClickedMock: vi.fn(),
    captureBrowserToolOutboundClickMock: vi.fn(),
    usePathnameMock: vi.fn(),
  }),
);

vi.mock("next/navigation", () => ({
  usePathname: usePathnameMock,
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserOutboundLinkClicked: captureBrowserOutboundLinkClickedMock,
  captureBrowserToolOutboundClick: captureBrowserToolOutboundClickMock,
}));

import { PostHogOutboundClickTracker } from "@/components/analytics/posthog-outbound-click-tracker";

describe("PostHogOutboundClickTracker", () => {
  beforeEach(() => {
    captureBrowserOutboundLinkClickedMock.mockReset();
    captureBrowserToolOutboundClickMock.mockReset();
    vi.stubGlobal("fetch", vi.fn(() => Promise.resolve(new Response(null))));
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
    expect(captureBrowserToolOutboundClickMock).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("captures direct tool website links with tool metadata", () => {
    usePathnameMock.mockReturnValue("/tools/acme");
    window.history.replaceState({}, "", "/tools/acme");

    render(
      <>
        <PostHogOutboundClickTracker apiKey="phc_test" />
        <a
          href="https://acme.com"
          data-shipboost-outbound-source="tool_page"
          data-shipboost-outbound-context="tool_page"
          data-shipboost-outbound-text="Acme"
          data-shipboost-tool-id="tool_123"
          data-shipboost-tool-slug="acme"
          data-shipboost-tool-name="Acme"
          data-shipboost-tool-destination-type="website"
          data-shipboost-tool-current-launch-type="FEATURED"
          data-shipboost-tool-is-featured="true"
        >
          Visit website
        </a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Visit website" }));

    expect(captureBrowserOutboundLinkClickedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://acme.com/",
        sourcePath: "/tools/acme",
        sourceSurface: "tool_page",
        linkContext: "tool_page",
        linkText: "Acme",
        trackingMethod: "browser",
        isToolLink: true,
        toolId: "tool_123",
        toolSlug: "acme",
        toolName: "Acme",
      }),
    );
    expect(captureBrowserToolOutboundClickMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://acme.com/",
        sourcePath: "/tools/acme",
        sourceSurface: "tool_page",
        destinationType: "website",
        toolId: "tool_123",
        toolSlug: "acme",
        toolName: "Acme",
        currentLaunchType: "FEATURED",
        isFeatured: true,
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/streaks/outbound-click",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ toolId: "tool_123" }),
        keepalive: true,
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
    expect(fetch).not.toHaveBeenCalled();
  });

  it("records tool outbound streak activity even when PostHog is disabled", () => {
    usePathnameMock.mockReturnValue("/tools/acme");
    window.history.replaceState({}, "", "/tools/acme");

    render(
      <>
        <PostHogOutboundClickTracker />
        <a
          href="https://acme.com"
          data-shipboost-tool-id="tool_123"
          data-shipboost-tool-slug="acme"
          data-shipboost-tool-name="Acme"
        >
          Visit website
        </a>
      </>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Visit website" }));

    expect(captureBrowserOutboundLinkClickedMock).not.toHaveBeenCalled();
    expect(captureBrowserToolOutboundClickMock).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledWith(
      "/api/streaks/outbound-click",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ toolId: "tool_123" }),
        keepalive: true,
      }),
    );
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
    expect(fetch).not.toHaveBeenCalled();
  });
});
