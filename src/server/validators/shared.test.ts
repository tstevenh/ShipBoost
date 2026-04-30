import { describe, expect, it } from "vitest";

import {
  getSameOriginScriptUrls,
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
  it("finds the badge marker in same-origin JavaScript bundles", async () => {
    const html =
      '<html><head><script type="module" src="/assets/index.js"></script></head></html>';

    await expect(
      hasFreeLaunchBadgeInHtmlOrScripts(
        html,
        "https://interview-prep.io/",
        async (url) => {
          expect(url).toBe("https://interview-prep.io/assets/index.js");
          return '<a href="https://shipboost.io" data-shipboost-badge="free-launch"></a>';
        },
      ),
    ).resolves.toBe(true);
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
