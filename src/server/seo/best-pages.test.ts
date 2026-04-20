import { describe, expect, it } from "vitest";

import {
  bestHubSections,
  bestPagesRegistry,
  getBestGuideEntriesForTool,
} from "@/server/seo/best-pages";

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

  it("defines the first Email Marketing cluster pages", () => {
    expect(bestPagesRegistry["email-marketing-for-small-business"]).toBeDefined();
    expect(
      bestPagesRegistry["email-marketing-platform-for-small-business"],
    ).toBeDefined();
  });

  it("defines the first Forms and Surveys cluster page", () => {
    expect(bestPagesRegistry["online-form-builder"]).toBeDefined();
  });

  it("defines the first Scheduling cluster pages", () => {
    expect(bestPagesRegistry["scheduling-app-for-small-business"]).toBeDefined();
    expect(
      bestPagesRegistry["scheduling-software-for-small-business"],
    ).toBeDefined();
  });

  it("defines the deferred survey and social scheduling pages", () => {
    expect(bestPagesRegistry["survey-tool"]).toBeDefined();
    expect(bestPagesRegistry["social-media-scheduling-tools"]).toBeDefined();
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

  it("includes the Email Marketing section in the best hub", () => {
    expect(bestHubSections.some((section) => section.slug === "email-marketing")).toBe(
      true,
    );
  });

  it("includes the Forms and Surveys section in the best hub", () => {
    expect(bestHubSections.some((section) => section.slug === "forms-surveys")).toBe(
      true,
    );
  });

  it("includes the Scheduling section in the best hub", () => {
    expect(bestHubSections.some((section) => section.slug === "scheduling")).toBe(
      true,
    );
  });

  it("includes the deferred surveys and social scheduling sections in the best hub", () => {
    expect(bestHubSections.some((section) => section.slug === "surveys")).toBe(
      true,
    );
    expect(
      bestHubSections.some((section) => section.slug === "social-scheduling"),
    ).toBe(true);
  });

  it("matches buyer guides to tools by supporting tags", () => {
    const emailGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["email-marketing", "newsletter"],
    });
    const unrelatedMarketingGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["survey-tool"],
    });

    expect(emailGuides.map((page) => page.slug)).toContain(
      "email-marketing-for-small-business",
    );
    expect(unrelatedMarketingGuides.map((page) => page.slug)).not.toContain(
      "email-marketing-for-small-business",
    );
  });

  it("matches forms guides to tools by supporting tags", () => {
    const formGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["form-builder", "online-forms"],
    });
    const unrelatedMarketingGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["creator-email"],
    });

    expect(formGuides.map((page) => page.slug)).toContain(
      "online-form-builder",
    );
    expect(unrelatedMarketingGuides.map((page) => page.slug)).not.toContain(
      "online-form-builder",
    );
  });

  it("matches scheduling guides to tools by supporting tags", () => {
    const schedulingGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "sales",
      toolTagSlugs: ["scheduling", "meeting-scheduling"],
    });
    const crmOnlyGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "sales",
      toolTagSlugs: ["crm"],
    });

    expect(schedulingGuides.map((page) => page.slug)).toContain(
      "scheduling-app-for-small-business",
    );
    expect(crmOnlyGuides.map((page) => page.slug)).not.toContain(
      "scheduling-app-for-small-business",
    );
  });

  it("matches survey and social guides to tools by supporting tags", () => {
    const surveyGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["survey-tool"],
    });
    const socialGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["social-scheduling"],
    });
    const unrelatedMarketingGuides = getBestGuideEntriesForTool({
      primaryCategorySlug: "marketing",
      toolTagSlugs: ["email-marketing"],
    });

    expect(surveyGuides.map((page) => page.slug)).toContain("survey-tool");
    expect(socialGuides.map((page) => page.slug)).toContain(
      "social-media-scheduling-tools",
    );
    expect(unrelatedMarketingGuides.map((page) => page.slug)).not.toContain(
      "survey-tool",
    );
    expect(unrelatedMarketingGuides.map((page) => page.slug)).not.toContain(
      "social-media-scheduling-tools",
    );
  });
});
