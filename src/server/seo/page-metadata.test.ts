import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/env", () => ({
  getEnv: () => ({
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  }),
}));

import {
  resolveCanonicalUrl,
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
});
