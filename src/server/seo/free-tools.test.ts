import { describe, expect, it } from "vitest";

import { freeTools, freeToolsRegistry } from "@/server/seo/free-tools";

describe("free tools registry", () => {
  it("defines the expected free tools", () => {
    expect(freeToolsRegistry["reaction-time-test"]).toBeDefined();
    expect(freeToolsRegistry["fake-notification-generator"]).toBeDefined();
  });

  it("keeps slugs unique", () => {
    const slugs = freeTools.map((tool) => tool.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("includes SEO fields, FAQs, and valid related links", () => {
    for (const tool of freeTools) {
      expect(tool.title).toBeTruthy();
      expect(tool.metaTitle).toBeTruthy();
      expect(tool.metaDescription).toBeTruthy();
      expect(tool.faq.length).toBeGreaterThanOrEqual(3);

      for (const link of tool.relatedLinks) {
        expect(link.label).toBeTruthy();
        expect(link.href).toMatch(/^\/[a-z0-9-/?#]+$/);
      }
    }
  });
});
