import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  }),
}));

import {
  buildPublicPageMetadata,
  getDefaultPublicPageImage,
  resolveCanonicalUrl,
  resolvePublicImageUrl,
  resolveSameOriginCanonicalUrl,
} from "@/server/seo/page-metadata";

describe("page-metadata", () => {
  it("resolves relative public paths against the app URL", () => {
    expect(resolveCanonicalUrl("/pricing")).toBe("http://localhost:3000/pricing");
  });

  it("normalizes trailing slashes on non-root canonical URLs", () => {
    expect(resolveCanonicalUrl("http://localhost:3000/tools/apollo/")).toBe(
      "http://localhost:3000/tools/apollo",
    );
  });

  it("falls back to the ShipBoost URL when a tool canonical is off-domain", () => {
    expect(
      resolveSameOriginCanonicalUrl(
        "https://apollo.io/",
        "http://localhost:3000/tools/apollo",
      ),
    ).toBe("http://localhost:3000/tools/apollo");
  });

  it("accepts same-origin tool canonicals", () => {
    expect(
      resolveSameOriginCanonicalUrl(
        "http://localhost:3000/tools/apollo/",
        "http://localhost:3000/tools/apollo",
      ),
    ).toBe("http://localhost:3000/tools/apollo");
  });

  it("uses the shared default OG image when no page image is provided", () => {
    const metadata = buildPublicPageMetadata({
      title: "Pricing | ShipBoost",
      description: "Compare launch options on ShipBoost.",
      url: "/pricing",
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "http://localhost:3000/ShipBoost-OGImage.png",
        alt: "Pricing | ShipBoost",
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      "http://localhost:3000/ShipBoost-OGImage.png",
    ]);
  });

  it("preserves an explicit page image instead of the shared default", () => {
    const metadata = buildPublicPageMetadata({
      title: "Example Article | ShipBoost",
      description: "Article metadata",
      url: "/blog/example-article",
      imageUrl: "/uploads/example-cover.png",
    });

    expect(metadata.openGraph?.images).toEqual([
      {
        url: "http://localhost:3000/uploads/example-cover.png",
        alt: "Example Article | ShipBoost",
      },
    ]);
    expect(metadata.twitter?.images).toEqual([
      "http://localhost:3000/uploads/example-cover.png",
    ]);
  });

  it("builds absolute URLs for public image helpers", () => {
    expect(getDefaultPublicPageImage()).toBe(
      "http://localhost:3000/ShipBoost-OGImage.png",
    );
    expect(resolvePublicImageUrl("/custom.png")).toBe(
      "http://localhost:3000/custom.png",
    );
  });
});
