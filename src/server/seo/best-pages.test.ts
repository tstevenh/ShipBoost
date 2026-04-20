import { describe, expect, it } from "vitest";

import { bestHubSections, bestPagesRegistry } from "@/server/seo/best-pages";

describe("best-pages registry", () => {
  it("defines the first support cluster pages", () => {
    expect(bestPagesRegistry["help-desk-software"]).toBeDefined();
    expect(bestPagesRegistry["customer-support-software"]).toBeDefined();
    expect(
      bestPagesRegistry["customer-support-software-for-small-business"],
    ).toBeDefined();
  });

  it("defines the first CRM cluster pages", () => {
    expect(bestPagesRegistry["crm-software"]).toBeDefined();
    expect(bestPagesRegistry["crm-for-startups"]).toBeDefined();
    expect(bestPagesRegistry["crm-software-for-small-business"]).toBeDefined();
  });

  it("stores ranked tools in explicit order", () => {
    const page = bestPagesRegistry["help-desk-software"];

    expect(page.rankedTools.length).toBeGreaterThanOrEqual(6);
    expect(page.rankedTools[0]?.rank).toBe(1);
    expect(page.rankedTools[1]?.rank).toBe(2);
  });

  it("maps every hub section slug to real best pages", () => {
    for (const section of bestHubSections) {
      expect(section.pageSlugs.length).toBeGreaterThan(0);

      for (const slug of section.pageSlugs) {
        expect(bestPagesRegistry[slug]).toBeDefined();
      }
    }
  });
});
