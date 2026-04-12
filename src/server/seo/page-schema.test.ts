import { describe, expect, it } from "vitest";

import {
  buildCollectionListingSchema,
  buildCollectionWithBreadcrumbSchema,
  buildHomePageSchema,
  buildToolPageSchema,
} from "@/server/seo/page-schema";

describe("page-schema", () => {
  it("returns organization, website, collection page, and item list for the homepage", () => {
    const schemas = buildHomePageSchema({
      title: "ShipBoost",
      description: "Launch smarter",
      url: "https://shipboost.io",
      items: [
        { name: "Tool One", url: "https://shipboost.io/tools/tool-one" },
      ],
    });

    expect(schemas).toHaveLength(4);
    expect(schemas.map((item) => item["@type"])).toEqual([
      "Organization",
      "WebSite",
      "ItemList",
      "CollectionPage",
    ]);
  });

  it("returns software application plus breadcrumb for tool pages", () => {
    const schemas = buildToolPageSchema({
      name: "ShipFast",
      description: "Launch apps faster",
      url: "https://shipboost.io/tools/shipfast",
      image: "https://shipboost.io/logo.png",
      categoryName: "Developer Tools",
    });

    expect(schemas.map((item) => item["@type"])).toEqual([
      "BreadcrumbList",
      "SoftwareApplication",
    ]);
  });

  it("returns item list plus collection page for index pages", () => {
    const schemas = buildCollectionListingSchema({
      name: "Browse Categories",
      description: "Explore categories",
      url: "https://shipboost.io/categories",
      items: [{ name: "AI", url: "https://shipboost.io/categories/ai" }],
    });

    expect(schemas.map((item) => item["@type"])).toEqual([
      "ItemList",
      "CollectionPage",
    ]);
  });

  it("returns breadcrumb, item list, and collection page for detail browse pages", () => {
    const schemas = buildCollectionWithBreadcrumbSchema({
      name: "AI Tools",
      description: "Browse AI tools",
      url: "https://shipboost.io/categories/ai",
      breadcrumbs: [
        { name: "Home", url: "https://shipboost.io" },
        { name: "Categories", url: "https://shipboost.io/categories" },
        { name: "AI", url: "https://shipboost.io/categories/ai" },
      ],
      items: [{ name: "Tool One", url: "https://shipboost.io/tools/tool-one" }],
    });

    expect(schemas.map((item) => item["@type"])).toEqual([
      "BreadcrumbList",
      "ItemList",
      "CollectionPage",
    ]);
  });
});
