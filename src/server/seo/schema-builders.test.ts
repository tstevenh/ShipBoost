import { describe, expect, it } from "vitest";

import {
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
  buildOrganization,
  buildSoftwareApplication,
  buildWebSite,
} from "@/server/seo/schema-builders";

describe("schema-builders", () => {
  it("builds an organization from the shared site constants", () => {
    const schema = buildOrganization();

    expect(schema["@type"]).toBe("Organization");
    expect(schema.name).toBe("ShipBoost");
    expect(schema.url).toBe("https://shipboost.io");
  });

  it("builds a website with the home url", () => {
    const schema = buildWebSite();

    expect(schema["@type"]).toBe("WebSite");
    expect(schema.url).toBe("https://shipboost.io");
  });

  it("builds ordered list items", () => {
    const schema = buildItemList([
      { name: "Tool One", url: "https://shipboost.io/tools/tool-one" },
      { name: "Tool Two", url: "https://shipboost.io/tools/tool-two" },
    ]);

    expect(schema.itemListElement[0].position).toBe(1);
    expect(schema.itemListElement[1].position).toBe(2);
  });

  it("builds a collection page with a linked item list", () => {
    const list = buildItemList([
      { name: "AI", url: "https://shipboost.io/best/tag/ai" },
    ]);
    const schema = buildCollectionPage({
      name: "Browse Tags",
      description: "Explore tags",
      url: "https://shipboost.io/tags",
      mainEntity: list,
    });

    expect(schema["@type"]).toBe("CollectionPage");
    expect(schema.mainEntity).toBe(list);
  });

  it("builds breadcrumbs in order", () => {
    const schema = buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io/" },
      { name: "Categories", url: "https://shipboost.io/categories" },
      { name: "AI", url: "https://shipboost.io/categories/ai" },
    ]);

    expect(schema.itemListElement).toHaveLength(3);
    expect(schema.itemListElement[2].name).toBe("AI");
  });

  it("omits price and review fields for software apps when absent", () => {
    const schema = buildSoftwareApplication({
      name: "ShipFast",
      description: "Launch apps faster",
      url: "https://shipboost.io/tools/shipfast",
      image: "https://shipboost.io/logo.png",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web",
    });

    expect(schema["@type"]).toBe("SoftwareApplication");
    expect("aggregateRating" in schema).toBe(false);
    expect("review" in schema).toBe(false);
    expect("offers" in schema).toBe(false);
  });
});
