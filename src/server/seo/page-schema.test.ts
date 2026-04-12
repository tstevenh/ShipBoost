import { describe, expect, it } from "vitest";

import {
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
});
