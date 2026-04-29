import { describe, expect, it } from "vitest";

import { alternativesSeoRegistry } from "@/server/seo/registry";

describe("alternatives SEO registry", () => {
  it("defines the Phase 1 cluster 11-20 alternatives pages", () => {
    for (const slug of [
      "bamboohr",
      "rippling",
      "gusto",
      "workable",
      "justworks",
      "lever",
      "remote-com",
      "paychex",
      "semrush",
      "ahrefs",
      "moz",
      "surfer-seo",
      "marketmuse",
      "clearscope",
      "yoast",
      "stripe",
      "chargebee",
      "paddle",
      "recurly",
      "adyen",
      "paypal",
      "lemon-squeezy",
      "braintree",
    ]) {
      expect(alternativesSeoRegistry[slug]).toBeDefined();
      expect(alternativesSeoRegistry[slug]?.toolSlugs.length).toBeGreaterThanOrEqual(
        6,
      );
    }
  });

  it("defines the Phase 2 cluster 11-20 alternatives pages", () => {
    for (const slug of [
      "monday-com",
      "wrike",
      "teamwork",
      "basecamp",
      "trello",
      "clickup",
      "asana",
      "smartsheet",
      "jira",
      "linear",
      "google-analytics",
      "ga4",
      "hotjar",
      "amplitude",
      "mixpanel",
      "fullstory",
      "heap",
      "posthog",
      "plausible",
      "matomo",
      "quickbooks",
      "quickbooks-online",
      "bill-com",
      "expensify",
      "xero",
      "zoho-books",
      "freshbooks",
      "wave-accounting",
    ]) {
      expect(alternativesSeoRegistry[slug]).toBeDefined();
      expect(alternativesSeoRegistry[slug]?.toolSlugs.length).toBeGreaterThanOrEqual(
        6,
      );
    }
  });

  it("defines the Phase 3 cluster 11-20 alternatives pages", () => {
    for (const slug of [
      "shopify",
      "woocommerce",
      "bigcommerce",
      "magento",
      "ecwid",
      "sellfy",
      "wix-ecommerce",
      "squarespace-ecommerce",
      "vimeo",
      "vidyard",
      "wistia",
      "zoom",
      "loom",
      "descript",
      "riverside",
      "webinarjam",
      "workato",
      "ifttt",
      "make",
      "n8n",
      "zapier",
      "tray-io",
      "pabbly-connect",
      "parabola",
      "canva",
      "figma",
      "visio",
      "miro",
      "mural",
      "lucidchart",
      "adobe-express",
      "pitch",
    ]) {
      expect(alternativesSeoRegistry[slug]).toBeDefined();
      expect(alternativesSeoRegistry[slug]?.toolSlugs.length).toBeGreaterThanOrEqual(
        6,
      );
    }
  });
});
