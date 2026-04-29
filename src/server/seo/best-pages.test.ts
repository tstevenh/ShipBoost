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

  it("defines the Phase 1 cluster 11-20 best pages", () => {
    for (const slug of [
      "hr-software-for-small-business",
      "payroll-software-for-small-business",
      "hr-software-for-startups",
      "employee-onboarding-software",
      "applicant-tracking-system-for-small-business",
      "keyword-research-tools",
      "rank-tracking-software",
      "ai-seo-tools",
      "local-seo-tools",
      "seo-tools-for-small-business",
      "recurring-billing-software",
      "subscription-billing-software",
      "billing-software-for-small-business",
      "payment-processor-for-small-business",
    ]) {
      expect(bestPagesRegistry[slug]).toBeDefined();
      expect(bestPagesRegistry[slug]?.rankedTools.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("includes the Phase 1 cluster 11-20 sections in the best hub", () => {
    expect(bestHubSections.some((section) => section.slug === "hr-payroll")).toBe(
      true,
    );
    expect(
      bestHubSections.some((section) => section.slug === "seo-content-optimization"),
    ).toBe(true);
    expect(
      bestHubSections.some((section) => section.slug === "payments-billing"),
    ).toBe(true);
  });

  it("defines the Phase 2 cluster 11-20 best pages", () => {
    for (const slug of [
      "project-management-software-for-small-business",
      "project-management-software-for-startups",
      "work-management-software",
      "project-planning-software",
      "task-management-software-for-small-business",
      "website-analytics-tools",
      "web-analytics-tools",
      "product-analytics-tools",
      "heatmap-software",
      "session-replay-software",
      "invoicing-software-for-small-business",
      "invoice-software-for-freelancers",
      "expense-management-software-for-small-business",
      "accounts-payable-software-for-small-business",
    ]) {
      expect(bestPagesRegistry[slug]).toBeDefined();
      expect(bestPagesRegistry[slug]?.rankedTools.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("includes the Phase 2 cluster 11-20 sections in the best hub", () => {
    expect(
      bestHubSections.some((section) => section.slug === "project-work-management"),
    ).toBe(true);
    expect(
      bestHubSections.some(
        (section) => section.slug === "analytics-product-intelligence",
      ),
    ).toBe(true);
    expect(
      bestHubSections.some(
        (section) => section.slug === "accounting-invoicing-expenses",
      ),
    ).toBe(true);
  });

  it("defines the Phase 3 cluster 11-20 best pages", () => {
    for (const slug of [
      "ecommerce-website-builder",
      "ecommerce-platform-for-small-business",
      "ecommerce-platform-for-startups",
      "ecommerce-software-for-small-business",
      "webinar-platform",
      "webinar-software-for-small-business",
      "screen-recording-software",
      "demo-software",
      "product-demo-software",
      "workflow-automation-software",
      "business-process-automation-software",
      "no-code-automation-tools",
      "integration-platform-as-a-service",
      "wireframing-tools",
      "diagram-software",
      "online-whiteboard",
      "whiteboard-software",
      "design-collaboration-tools",
    ]) {
      expect(bestPagesRegistry[slug]).toBeDefined();
      expect(bestPagesRegistry[slug]?.rankedTools.length).toBeGreaterThanOrEqual(6);
    }
  });

  it("includes the Phase 3 cluster 11-20 sections in the best hub", () => {
    expect(
      bestHubSections.some((section) => section.slug === "ecommerce-store-builders"),
    ).toBe(true);
    expect(
      bestHubSections.some((section) => section.slug === "video-demo-webinar"),
    ).toBe(true);
    expect(
      bestHubSections.some((section) => section.slug === "automation-integration"),
    ).toBe(true);
    expect(
      bestHubSections.some((section) => section.slug === "design-whiteboarding"),
    ).toBe(true);
  });
});
