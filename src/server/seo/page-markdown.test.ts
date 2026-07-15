import { describe, expect, it } from "vitest";

import {
  buildAlternativesMarkdown,
  buildBestMarkdown,
  buildBlogMarkdown,
  buildToolMarkdown,
} from "@/server/seo/page-markdown";

const APP_URL = "https://shipboost.io";

describe("buildToolMarkdown", () => {
  const tool = {
    slug: "acme-crm",
    name: "Acme CRM",
    tagline: "The CRM for fast-moving teams",
    richDescription: "## Features\n\nAcme CRM does things.",
    pricingModel: "Freemium",
    websiteUrl: "https://acme.io",
    upvoteCount: 42,
    toolCategories: [{ category: { name: "CRM", slug: "crm" } }],
    toolTags: [
      { tag: { name: "sales", slug: "sales", isActive: true } },
      { tag: { name: "automation", slug: "automation", isActive: true } },
    ],
    launches: [
      { launchType: "FEATURED", launchDate: new Date("2024-03-15") },
      { launchType: "FREE", launchDate: new Date("2024-01-10") },
    ],
  };

  it("includes name as h1", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain("# Acme CRM");
  });

  it("includes tagline as blockquote", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain("> The CRM for fast-moving teams");
  });

  it("includes pricing model", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain("Freemium");
  });

  it("includes category names", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain("CRM");
  });

  it("includes tag names", () => {
    const md = buildToolMarkdown(tool, APP_URL);
    expect(md).toContain("sales");
    expect(md).toContain("automation");
  });

  it("includes upvote count", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain("42");
  });

  it("includes richDescription verbatim", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain("## Features\n\nAcme CRM does things.");
  });

  it("includes launch history entries", () => {
    const md = buildToolMarkdown(tool, APP_URL);
    expect(md).toContain("Featured");
    expect(md).toContain("Free");
  });

  it("includes absolute ShipBoost listing URL", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain(
      "https://shipboost.io/tools/acme-crm",
    );
  });

  it("includes absolute markdown URL", () => {
    expect(buildToolMarkdown(tool, APP_URL)).toContain(
      "https://shipboost.io/tools/acme-crm.md",
    );
  });

  it("returns null for a tool with no launches", () => {
    const toolWithNoLaunches = { ...tool, launches: [] };
    expect(buildToolMarkdown(toolWithNoLaunches, APP_URL)).toBeNull();
  });

  it("formats launch date as D MMM YYYY", () => {
    const md = buildToolMarkdown(tool, APP_URL);
    expect(md).toContain("15 Mar 2024");
  });

  it("includes alternatives link", () => {
    const md = buildToolMarkdown(tool, APP_URL);
    expect(md).toContain(`${APP_URL}/alternatives/acme-crm`);
  });
});

describe("buildBestMarkdown", () => {
  const page = {
    entry: {
      slug: "best-crm-software",
      title: "Best CRM Software",
      metaDescription: "The top CRM tools for 2024.",
      intro: "We evaluated 30 tools.",
      rankedTools: [
        { toolSlug: "acme-crm", rank: 1, verdict: "Top pick", bestFor: "SMBs", notIdealFor: "Enterprise" },
        { toolSlug: "beta-crm", rank: 2, verdict: "Runner up", bestFor: "Freelancers", notIdealFor: "Teams" },
      ],
    },
    tools: [
      { slug: "acme-crm", name: "Acme CRM", tagline: "The CRM for fast-moving teams" },
      { slug: "beta-crm", name: "Beta CRM", tagline: "Simple CRM for freelancers" },
    ],
  };

  it("includes page title as h1", () => {
    expect(buildBestMarkdown(page, APP_URL)).toContain("# Best CRM Software");
  });

  it("includes metaDescription", () => {
    expect(buildBestMarkdown(page, APP_URL)).toContain("The top CRM tools for 2024.");
  });

  it("includes intro", () => {
    expect(buildBestMarkdown(page, APP_URL)).toContain("We evaluated 30 tools.");
  });

  it("lists tools in rank order with absolute URLs", () => {
    const md = buildBestMarkdown(page, APP_URL);
    const acmePos = md.indexOf("Acme CRM");
    const betaPos = md.indexOf("Beta CRM");
    expect(acmePos).toBeLessThan(betaPos);
    expect(md).toContain("https://shipboost.io/tools/acme-crm");
    expect(md).toContain("https://shipboost.io/tools/beta-crm");
  });

  it("includes source and markdown links", () => {
    const md = buildBestMarkdown(page, APP_URL);
    expect(md).toContain("https://shipboost.io/best/best-crm-software");
    expect(md).toContain("https://shipboost.io/best/best-crm-software.md");
  });
});

describe("buildAlternativesMarkdown", () => {
  const page = {
    entry: {
      slug: "acme-crm",
      title: "Acme CRM Alternatives",
      intro: "Acme CRM is great, but here are alternatives.",
      metaDescription: "Top alternatives to Acme CRM.",
      anchorToolSlug: "acme-crm",
      toolSlugs: ["beta-crm", "gamma-crm"],
    },
    anchorTool: {
      slug: "acme-crm",
      name: "Acme CRM",
      tagline: "The CRM for fast-moving teams",
      websiteUrl: "https://acme.io",
    },
    tools: [
      { slug: "beta-crm", name: "Beta CRM", tagline: "Simple CRM" },
      { slug: "gamma-crm", name: "Gamma CRM", tagline: "Enterprise CRM" },
    ],
  };

  it("includes title as h1", () => {
    expect(buildAlternativesMarkdown(page, APP_URL)).toContain("# Acme CRM Alternatives");
  });

  it("includes anchor tool section", () => {
    const md = buildAlternativesMarkdown(page, APP_URL);
    expect(md).toContain("Acme CRM");
    expect(md).toContain("https://acme.io");
    expect(md).toContain("https://shipboost.io/tools/acme-crm");
  });

  it("lists alternatives with absolute URLs", () => {
    const md = buildAlternativesMarkdown(page, APP_URL);
    expect(md).toContain("Beta CRM");
    expect(md).toContain("https://shipboost.io/tools/beta-crm");
    expect(md).toContain("Gamma CRM");
    expect(md).toContain("https://shipboost.io/tools/gamma-crm");
  });

  it("includes source and markdown links", () => {
    const md = buildAlternativesMarkdown(page, APP_URL);
    expect(md).toContain("https://shipboost.io/alternatives/acme-crm");
    expect(md).toContain("https://shipboost.io/alternatives/acme-crm.md");
  });
});

describe("buildBlogMarkdown", () => {
  const article = {
    slug: "how-to-launch-your-saas",
    title: "How to Launch Your SaaS",
    excerpt: "A practical launch guide for bootstrapped founders.",
    markdownContent: "## Introduction\n\nLaunching is hard.",
    publishedAt: new Date("2024-06-01"),
    primaryCategory: { name: "Launches" },
    author: { name: "Jane Smith" },
  };

  it("includes title as h1", () => {
    expect(buildBlogMarkdown(article, APP_URL)).toContain("# How to Launch Your SaaS");
  });

  it("includes author name", () => {
    expect(buildBlogMarkdown(article, APP_URL)).toContain("Jane Smith");
  });

  it("includes category", () => {
    expect(buildBlogMarkdown(article, APP_URL)).toContain("Launches");
  });

  it("includes excerpt as blockquote", () => {
    expect(buildBlogMarkdown(article, APP_URL)).toContain(
      "> A practical launch guide for bootstrapped founders.",
    );
  });

  it("includes markdownContent verbatim", () => {
    expect(buildBlogMarkdown(article, APP_URL)).toContain(
      "## Introduction\n\nLaunching is hard.",
    );
  });

  it("includes source and markdown links", () => {
    const md = buildBlogMarkdown(article, APP_URL);
    expect(md).toContain("https://shipboost.io/blog/how-to-launch-your-saas");
    expect(md).toContain("https://shipboost.io/blog/how-to-launch-your-saas.md");
  });

  it("formats publish date as D MMM YYYY", () => {
    const md = buildBlogMarkdown(article, APP_URL);
    expect(md).toContain("1 Jun 2024");
  });
});
