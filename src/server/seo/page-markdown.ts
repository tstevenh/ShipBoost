export type ToolMarkdownInput = {
  slug: string;
  name: string;
  tagline: string;
  richDescription: string;
  pricingModel: string;
  websiteUrl: string;
  affiliateUrl?: string | null;
  upvoteCount: number;
  isFeatured?: boolean;
  badgeVerification?: string | null;
  currentLaunchType?: string | null;
  logoMedia?: { url: string } | null;
  media?: Array<{ url: string }>;
  founderXUrl?: string | null;
  founderGithubUrl?: string | null;
  founderLinkedinUrl?: string | null;
  founderFacebookUrl?: string | null;
  toolCategories: Array<{ category: { name: string; slug: string } }>;
  toolTags: Array<{ tag: { name: string; slug: string; isActive: boolean } }>;
  launches: Array<{ launchType: string; launchDate: Date | string }>;
  hasAlternativesPage?: boolean;
};

export type BestMarkdownInput = {
  entry: {
    slug: string;
    title: string;
    metaDescription: string;
    intro: string;
    rankedTools: Array<{ toolSlug: string; rank: number }>;
  };
  tools: Array<{ slug: string; name: string; tagline: string }>;
};

export type AlternativesMarkdownInput = {
  entry: {
    slug: string;
    title: string;
    intro: string;
    metaDescription: string;
    anchorToolSlug: string;
  };
  anchorTool: { slug: string; name: string; tagline: string; websiteUrl: string };
  tools: Array<{ slug: string; name: string; tagline: string }>;
};

export type BlogMarkdownInput = {
  slug: string;
  title: string;
  excerpt: string;
  markdownContent: string;
  publishedAt: Date | string | null;
  primaryCategory: { name: string };
  author: { name: string };
};

function formatLaunchType(launchType: string): string {
  if (launchType === "FEATURED") return "Featured Launch";
  if (launchType === "FREE") return "Free Launch";
  if (launchType === "RELAUNCH") return "Relaunch";
  return launchType;
}

function formatDate(value: Date | string | null | undefined): string {
  if (!value) return "Unknown";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function buildToolMarkdown(tool: ToolMarkdownInput, appUrl: string): string {
  // Prelaunch tools are 404'd upstream by the route (kind !== "public"). A
  // published listing with no launch is still a valid public page, so it gets
  // markdown here — just without a Launch History section.
  const activeTags = tool.toolTags.filter((tt) => tt.tag.isActive);
  const categories = tool.toolCategories.map((tc) => tc.category.name).join(", ");
  const tags = activeTags.map((tt) => tt.tag.name).join(", ");
  const listingUrl = `${appUrl}/tools/${tool.slug}`;
  const markdownUrl = `${appUrl}/tools/${tool.slug}.md`;
  const latestLaunch = tool.launches[0];

  // YAML metadata block — machine-readable header for AI crawlers.
  const meta: string[] = [
    "```yaml",
    `url: "${listingUrl}"`,
    `website: "${tool.websiteUrl}"`,
    `pricing: ${tool.pricingModel}`,
    `upvotes: ${tool.upvoteCount}`,
  ];
  if (tool.isFeatured) meta.push("featured: true");
  if (tool.badgeVerification === "VERIFIED") meta.push("verified: true");
  if (tool.currentLaunchType) {
    meta.push(`launch_type: ${formatLaunchType(tool.currentLaunchType)}`);
  }
  if (latestLaunch) meta.push(`launched: "${formatDate(latestLaunch.launchDate)}"`);
  if (categories) meta.push(`categories: "${categories}"`);
  if (tags) meta.push(`tags: "${tags}"`);
  meta.push("```");

  const launchSection =
    tool.launches.length > 0
      ? [
          "## Launch History",
          "",
          ...tool.launches.map(
            (l) => `- ${formatLaunchType(l.launchType)} — ${formatDate(l.launchDate)}`,
          ),
          "",
        ]
      : [];

  const screenshots = tool.media ?? [];
  const screenshotSection =
    screenshots.length > 0
      ? [
          "## Screenshots",
          "",
          ...screenshots.map((m, i) => `- Screenshot ${i + 1}: ${m.url}`),
          "",
        ]
      : [];

  const makerLinks: string[] = [];
  if (tool.founderXUrl) makerLinks.push(`- X / Twitter: ${tool.founderXUrl}`);
  if (tool.founderGithubUrl) makerLinks.push(`- GitHub: ${tool.founderGithubUrl}`);
  if (tool.founderLinkedinUrl) makerLinks.push(`- LinkedIn: ${tool.founderLinkedinUrl}`);
  if (tool.founderFacebookUrl) makerLinks.push(`- Facebook: ${tool.founderFacebookUrl}`);
  const makerSection =
    makerLinks.length > 0 ? ["## Maker", "", ...makerLinks, ""] : [];

  const links: string[] = [
    `- ShipBoost listing: ${listingUrl}`,
    `- Website: ${tool.websiteUrl}`,
  ];
  if (tool.affiliateUrl) links.push(`- Affiliate link: ${tool.affiliateUrl}`);
  links.push(`- Markdown: ${markdownUrl}`);
  if (tool.hasAlternativesPage) {
    links.push(`- Alternatives: ${appUrl}/alternatives/${tool.slug}`);
  }

  const exploreLinks = [
    ...tool.toolCategories.map(
      (tc) => `- More ${tc.category.name} tools: ${appUrl}/categories/${tc.category.slug}`,
    ),
    ...activeTags
      .slice(0, 3)
      .map((tt) => `- Tagged ${tt.tag.name}: ${appUrl}/tags/${tt.tag.slug}`),
  ];
  const exploreSection =
    exploreLinks.length > 0 ? ["## Explore", "", ...exploreLinks, ""] : [];

  return [
    `# ${tool.name}`,
    "",
    `> ${tool.tagline}`,
    "",
    ...meta,
    "",
    "## Description",
    "",
    tool.richDescription,
    "",
    ...screenshotSection,
    ...launchSection,
    ...makerSection,
    "## Links",
    "",
    ...links,
    "",
    ...exploreSection,
  ]
    .filter((line) => line !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trimEnd();
}

export function buildBestMarkdown(page: BestMarkdownInput, appUrl: string): string {
  const { entry, tools } = page;
  const toolsBySlug = new Map(tools.map((t) => [t.slug, t]));
  const sourceUrl = `${appUrl}/best/${entry.slug}`;
  const markdownUrl = `${appUrl}/best/${entry.slug}.md`;

  const toolLines = entry.rankedTools
    .map((ranked) => {
      const tool = toolsBySlug.get(ranked.toolSlug);
      if (!tool) return null;
      return `${ranked.rank}. **${tool.name}** — ${tool.tagline} — ${appUrl}/tools/${tool.slug}`;
    })
    .filter(Boolean)
    .join("\n");

  return [
    `# ${entry.title}`,
    "",
    entry.metaDescription,
    "",
    entry.intro,
    "",
    "## Ranked Tools",
    "",
    toolLines,
    "",
    "---",
    "",
    `Source: ${sourceUrl}`,
    `Markdown: ${markdownUrl}`,
  ].join("\n");
}

export function buildAlternativesMarkdown(
  page: AlternativesMarkdownInput,
  appUrl: string,
): string {
  const { entry, anchorTool, tools } = page;
  const sourceUrl = `${appUrl}/alternatives/${entry.slug}`;
  const markdownUrl = `${appUrl}/alternatives/${entry.slug}.md`;

  const altLines = tools
    .map((t) => `- **${t.name}** — ${t.tagline} — ${appUrl}/tools/${t.slug}`)
    .join("\n");

  return [
    `# ${entry.title}`,
    "",
    entry.metaDescription,
    "",
    entry.intro,
    "",
    `## ${anchorTool.name}`,
    "",
    anchorTool.tagline,
    `Website: ${anchorTool.websiteUrl}`,
    `ShipBoost: ${appUrl}/tools/${anchorTool.slug}`,
    "",
    "## Alternatives",
    "",
    altLines,
    "",
    "---",
    "",
    `Source: ${sourceUrl}`,
    `Markdown: ${markdownUrl}`,
  ].join("\n");
}

export function buildBlogMarkdown(article: BlogMarkdownInput, appUrl: string): string {
  const sourceUrl = `${appUrl}/blog/${article.slug}`;
  const markdownUrl = `${appUrl}/blog/${article.slug}.md`;
  const dateStr = formatDate(article.publishedAt);

  return [
    `# ${article.title}`,
    "",
    `By ${article.author.name} · ${dateStr} · ${article.primaryCategory.name}`,
    "",
    `> ${article.excerpt}`,
    "",
    "---",
    "",
    article.markdownContent,
    "",
    "---",
    "",
    `Source: ${sourceUrl}`,
    `Markdown: ${markdownUrl}`,
  ].join("\n");
}
