import { describe, expect, it } from "vitest";

import {
  getSameOriginScriptUrls,
  hasExpectedShipBoostBadgeLink,
  hasFreeLaunchBadgeInHtmlOrScripts,
} from "@/server/services/submission-service-shared";
import { normalizeHttpUrl, websiteUrlSchema } from "@/server/validators/shared";

describe("websiteUrlSchema", () => {
  it("normalizes a duplicated protocol at the start of a website URL", () => {
    expect(websiteUrlSchema.parse("https://https://interview-prep.io/")).toBe(
      "https://interview-prep.io/",
    );
  });

  it("adds https to a bare website domain", () => {
    expect(websiteUrlSchema.parse("interview-prep.io")).toBe(
      "https://interview-prep.io",
    );
  });

  it("rejects non-http protocols", () => {
    expect(() => websiteUrlSchema.parse("javascript:alert(1)")).toThrow();
  });
});

describe("normalizeHttpUrl", () => {
  it("preserves a valid https URL", () => {
    expect(normalizeHttpUrl("https://acme.test")).toBe("https://acme.test");
  });
});

describe("hasFreeLaunchBadgeInHtmlOrScripts", () => {
  const expectedListingUrl = "https://shipboost.io/tools/acme";

  it("finds the badge marker directly in HTML", async () => {
    const html =
      '<a href="https://shipboost.io/tools/acme" data-shipboost-badge="free-launch">Featured on ShipBoost</a>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async () => "",
      ),
    ).resolves.toBe(true);
  });

  it("finds the badge marker when Next RSC escapes JSX props", async () => {
    const html =
      '<script>self.__next_f.push([1,"\\"data-shipboost-badge\\":\\"free-launch\\""])</script>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async () => "",
      ),
    ).resolves.toBe(true);
  });

  it("does NOT pass on a bare shipboost.io backlink without the badge marker", async () => {
    const html = '<a href="https://shipboost.io">Featured on ShipBoost</a>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async () => "",
      ),
    ).resolves.toBe(false);
  });

  it("passes on the expected listing link when anchor text contains ShipBoost", async () => {
    const html = '<a href="https://shipboost.io/tools/acme">ShipBoost</a>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async () => "",
        expectedListingUrl,
      ),
    ).resolves.toBe(true);
  });

  it("passes on the expected listing link when nearby HTML says Featured on ShipBoost", () => {
    const html =
      '<div>Featured on ShipBoost</div><a href="https://shipboost.io/tools/acme">View listing</a>';

    expect(
      hasExpectedShipBoostBadgeLink(
        html,
        "https://interview-prep.io/",
        expectedListingUrl,
      ),
    ).toBe(true);
  });

  it("passes on the expected listing link when a nested image alt contains ShipBoost", () => {
    const html =
      '<a href="https://shipboost.io/tools/acme"><img src="/badges/free.svg" alt="Featured on ShipBoost" /></a>';

    expect(
      hasExpectedShipBoostBadgeLink(
        html,
        "https://interview-prep.io/",
        expectedListingUrl,
      ),
    ).toBe(true);
  });

  it("passes on the expected listing link when a nested image src points to a badge path", () => {
    const html =
      '<a href="https://shipboost.io/tools/acme"><img src="https://shipboost.io/badge/tool_1?theme=light" alt="Featured badge" /></a>';

    expect(
      hasExpectedShipBoostBadgeLink(
        html,
        "https://interview-prep.io/",
        expectedListingUrl,
      ),
    ).toBe(true);
  });

  it("does NOT pass on the expected listing link without badge context", () => {
    const html = '<a href="https://shipboost.io/tools/acme">Launch profile</a>';

    expect(
      hasExpectedShipBoostBadgeLink(
        html,
        "https://interview-prep.io/",
        expectedListingUrl,
      ),
    ).toBe(false);
  });

  it("does NOT pass on a different ShipBoost tool link with badge context", () => {
    const html =
      '<a href="https://shipboost.io/tools/other-tool"><img src="https://shipboost.io/badge/tool_1?theme=light" alt="Featured on ShipBoost" /></a>';

    expect(
      hasExpectedShipBoostBadgeLink(
        html,
        "https://interview-prep.io/",
        expectedListingUrl,
      ),
    ).toBe(false);
  });

  it("finds a shipboost.io backlink inside a JSX-compiled JS bundle", async () => {
    const html =
      '<html><head><script type="module" src="/assets/index.js"></script></head></html>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async (url) => {
          expect(url).toBe("https://interview-prep.io/assets/index.js");
          return 'l.jsx("a",{href:"https://shipboost.io","data-shipboost-badge":"free-launch"})';
        },
      ),
    ).resolves.toBe(true);
  });

  it("returns false when there is no shipboost.io backlink anywhere", async () => {
    const html =
      '<html><head><script type="module" src="/assets/index.js"></script></head><body><a href="https://example.com">x</a></body></html>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async () => "no backlink here",
      ),
    ).resolves.toBe(false);
  });

  it("ignores third-party scripts during badge verification", () => {
    expect(
      getSameOriginScriptUrls(
        '<script src="https://cdn.example.com/index.js"></script><script src="/app.js"></script>',
        "https://interview-prep.io/",
      ),
    ).toEqual(["https://interview-prep.io/app.js"]);
  });
});
