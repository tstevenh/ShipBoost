import { beforeEach, describe, expect, it, vi } from "vitest";

const { captureMock } = vi.hoisted(() => ({
  captureMock: vi.fn(),
}));

vi.mock("posthog-js", () => ({
  default: {
    capture: captureMock,
  },
}));

import {
  captureBrowserOutboundLinkClicked,
  captureBrowserPostHogEvent,
  captureBrowserToolOutboundClick,
} from "@/lib/posthog-browser";

describe("posthog-browser", () => {
  beforeEach(() => {
    captureMock.mockReset();
  });

  it("passes custom browser events to PostHog", () => {
    captureBrowserPostHogEvent("product_card_impression", {
      tool_id: "tool_1",
    });

    expect(captureMock).toHaveBeenCalledWith("product_card_impression", {
      tool_id: "tool_1",
    });
  });

  it("captures the master outbound click event", () => {
    captureBrowserOutboundLinkClicked({
      href: "https://example.com/path?utm_source=shipboost",
      sourcePath: "/tools/acme",
      sourceSurface: "tool_page",
      linkContext: "tool_listing",
      linkText: "Acme",
      trackingMethod: "browser",
      isToolLink: true,
    });

    expect(captureMock).toHaveBeenCalledWith(
      "outbound_link_clicked",
      expect.objectContaining({
        href: "https://example.com/path?utm_source=shipboost",
        source_path: "/tools/acme",
        source_surface: "tool_page",
        link_context: "tool_listing",
        link_text: "Acme",
        tracking_method: "browser",
        is_tool_link: true,
      }),
    );
  });

  it("captures tool outbound clicks with destination metadata", () => {
    captureBrowserToolOutboundClick({
      href: "https://vendor.example/deal",
      sourcePath: "/launches/weekly",
      sourceSurface: "launch_board",
      destinationType: "affiliate",
      toolId: "tool_1",
      toolSlug: "acme",
      toolName: "Acme",
      currentLaunchType: "FEATURED",
      isFeatured: true,
    });

    expect(captureMock).toHaveBeenCalledWith("tool_outbound_click", {
      tool_id: "tool_1",
      tool_slug: "acme",
      tool_name: "Acme",
      destination_type: "affiliate",
      destination_url: "https://vendor.example/deal",
      destination_url_original: "https://vendor.example/deal",
      destination_url_final: "https://vendor.example/deal",
      destination_domain: "vendor.example",
      source_surface: "launch_board",
      source_path: "/launches/weekly",
      used_affiliate_url: true,
      is_featured: true,
      current_launch_type: "FEATURED",
    });
  });
});
