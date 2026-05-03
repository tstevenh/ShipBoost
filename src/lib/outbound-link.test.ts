import { describe, expect, it } from "vitest";

import {
  buildOutboundLinkClickedProperties,
  isTrackableOutboundHttpUrl,
  resolveToolWebsiteRel,
} from "@/lib/outbound-link";

describe("outbound-link", () => {
  it("accepts external http and https links", () => {
    expect(
      isTrackableOutboundHttpUrl({
        href: "https://frogdr.com/shipboost.io",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(true);

    expect(
      isTrackableOutboundHttpUrl({
        href: "http://example.com",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(true);
  });

  it("rejects internal, hash, and non-web links", () => {
    expect(
      isTrackableOutboundHttpUrl({
        href: "https://shipboost.io/pricing",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(false);
    expect(
      isTrackableOutboundHttpUrl({
        href: "#top",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(false);
    expect(
      isTrackableOutboundHttpUrl({
        href: "mailto:hello@shipboost.io",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(false);
  });

  it("builds normalized master outbound properties", () => {
    expect(
      buildOutboundLinkClickedProperties({
        href: "https://frogdr.com/shipboost.io?via=ShipBoost",
        sourcePath: "/about?from=footer",
        sourceSurface: "footer",
        linkContext: "footer",
        linkText: "FrogDR",
        trackingMethod: "browser",
        isToolLink: false,
      }),
    ).toEqual(
      expect.objectContaining({
        href: "https://frogdr.com/shipboost.io?via=ShipBoost",
        destination_domain: "frogdr.com",
        source_path: "/about?from=footer",
        source_surface: "footer",
        link_context: "footer",
        link_text: "FrogDR",
        tracking_method: "browser",
        is_tool_link: false,
      }),
    );
  });
});

describe("resolveToolWebsiteRel", () => {
  it("nofollow links for unverified free launches", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "PENDING",
        currentLaunchType: "FREE",
        isFeatured: false,
      }),
    ).toBe("nofollow noopener");
  });

  it("follows links for badge-verified free launches", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "VERIFIED",
        currentLaunchType: "FREE",
        isFeatured: false,
      }),
    ).toBe("noopener");
  });

  it("follows links for premium launches by default", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "NOT_REQUIRED",
        currentLaunchType: "FEATURED",
        isFeatured: true,
      }),
    ).toBe("noopener");
  });

  it("nofollow links for listing-only tools", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "NOT_REQUIRED",
        currentLaunchType: null,
        isFeatured: false,
      }),
    ).toBe("nofollow noopener");
  });
});
