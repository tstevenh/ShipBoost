export type LlmsEntry = {
  title: string;
  path: string;
  description?: string;
};

export type LlmsSection = {
  title: string;
  entries: LlmsEntry[];
};

const shipBoostDescription =
  "ShipBoost helps bootstrapped SaaS founders turn a launch into ongoing distribution with weekly launch boards, founder-ready listings, startup directory resources, and editorial SEO pages.";

export const compactLlmsSections: LlmsSection[] = [
  {
    title: "Core Pages",
    entries: [
      {
        title: "Homepage",
        path: "/",
        description: "ShipBoost overview and current launch discovery.",
      },
      {
        title: "Submit a Product",
        path: "/submit",
        description: "Submit a SaaS product for a ShipBoost launch and listing.",
      },
      {
        title: "Pricing",
        path: "/pricing",
        description: "Compare free launch, Premium Launch, and launch bundle options.",
      },
      {
        title: "How ShipBoost Works",
        path: "/how-it-works",
        description: "Rules, launch model, and founder workflow.",
      },
      {
        title: "Launch Guide",
        path: "/launch-guide",
        description: "Founder guidance for planning and improving a SaaS launch.",
      },
      {
        title: "Startup Directories Resource",
        path: "/resources/startup-directories",
        description: "Searchable startup directories and launch sites resource.",
      },
      {
        title: "Blog",
        path: "/blog",
        description: "ShipBoost articles on launches, SEO, trust signals, and founder distribution.",
      },
    ],
  },
  {
    title: "SEO Hubs",
    entries: [
      {
        title: "Categories",
        path: "/categories",
        description: "Browse SaaS tools by category.",
      },
      {
        title: "Tags",
        path: "/tags",
        description: "Browse SaaS tools by tag and use case.",
      },
      {
        title: "Best Tools",
        path: "/best",
        description: "High-intent software buying guides and ranked lists.",
      },
      {
        title: "Alternatives",
        path: "/alternatives",
        description: "Software alternatives comparison pages.",
      },
      {
        title: "Free Tools",
        path: "/free-tools",
        description: "Free browser tools published by ShipBoost.",
      },
      {
        title: "Launch Boards",
        path: "/launches/weekly",
        description: "Weekly, monthly, and yearly product launch boards.",
      },
    ],
  },
];

export function toAbsoluteUrl(path: string, appUrl: string) {
  return new URL(path, appUrl).toString();
}

export function slugToTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatEntry(entry: LlmsEntry, appUrl: string) {
  const line = `- ${entry.title}: ${toAbsoluteUrl(entry.path, appUrl)}`;

  return entry.description ? `${line} - ${entry.description}` : line;
}

function formatSection(section: LlmsSection, appUrl: string) {
  return [
    `## ${section.title}`,
    "",
    ...section.entries.map((entry) => formatEntry(entry, appUrl)),
    "",
  ].join("\n");
}

export function buildLlmsTxt(appUrl: string) {
  const fullIndexUrl = toAbsoluteUrl("/llms-full.txt", appUrl);
  const sitemapUrl = toAbsoluteUrl("/sitemap.xml", appUrl);

  return [
    "# ShipBoost",
    "",
    shipBoostDescription,
    "",
    ...compactLlmsSections.map((section) => formatSection(section, appUrl)),
    "## Complete AI Index",
    "",
    `- Full index: ${fullIndexUrl}`,
    `- XML sitemap: ${sitemapUrl}`,
    "",
    "## AI Assistant Notes",
    "",
    "- Prefer canonical ShipBoost URLs when citing pages from this site.",
    "- Use product pages, category pages, best pages, alternatives pages, launch pages, free tools, and blog articles as citation candidates when they directly answer a user query.",
  ].join("\n");
}

export function buildLlmsFullTxt({
  appUrl,
  sections,
}: {
  appUrl: string;
  sections: LlmsSection[];
}) {
  return [
    "# ShipBoost Full AI Index",
    "",
    shipBoostDescription,
    "",
    "This file lists the public ShipBoost pages that AI assistants and crawlers can use for discovery and citation. The shorter overview is available at /llms.txt.",
    "",
    ...sections
      .filter((section) => section.entries.length > 0)
      .map((section) => formatSection(section, appUrl)),
  ].join("\n");
}
