import { describe, expect, it } from "vitest";

import {
  buildLlmsFullTxt,
  buildLlmsTxt,
  slugToTitle,
  toAbsoluteUrl,
} from "@/server/seo/llms";

describe("llms text builders", () => {
  it("builds absolute URLs from relative paths", () => {
    expect(toAbsoluteUrl("/pricing", "https://shipboost.io")).toBe(
      "https://shipboost.io/pricing",
    );
  });

  it("turns slugs into readable fallback titles", () => {
    expect(slugToTitle("help-desk-software")).toBe("Help Desk Software");
  });

  it("includes the complete index and sitemap links in the compact file", () => {
    const text = buildLlmsTxt("https://shipboost.io");

    expect(text).toContain("# ShipBoost");
    expect(text).toContain("https://shipboost.io/llms-full.txt");
    expect(text).toContain("https://shipboost.io/sitemap.xml");
    expect(text).toContain("Submit a Product: https://shipboost.io/submit");
  });

  it("formats full index sections and skips empty sections", () => {
    const text = buildLlmsFullTxt({
      appUrl: "https://shipboost.io",
      sections: [
        {
          title: "Tool Pages",
          entries: [
            {
              title: "Example Tool",
              path: "/tools/example-tool",
              description: "Example listing.",
            },
          ],
        },
        {
          title: "Empty",
          entries: [],
        },
      ],
    });

    expect(text).toContain("## Tool Pages");
    expect(text).toContain(
      "Example Tool: https://shipboost.io/tools/example-tool - Example listing.",
    );
    expect(text).not.toContain("## Empty");
  });
});
