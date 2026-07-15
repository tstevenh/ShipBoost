export type ToolMarkdownInput = {
  slug: string;
  name: string;
  tagline: string;
  richDescription: string;
  pricingModel: string;
  websiteUrl: string;
  upvoteCount: number;
  toolCategories: Array<{ category: { name: string; slug: string } }>;
  toolTags: Array<{ tag: { name: string; slug: string; isActive: boolean } }>;
  launches: Array<{ launchType: string; launchDate: Date | string }>;
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

export function buildToolMarkdown(tool: ToolMarkdownInput, appUrl: string): string | null {
  if (tool.launches.length === 0) {
    return null;
  }

  const categories = tool.toolCategories
    .map((tc) => tc.category.name)
    .join(", ");
  const tags = tool.toolTags
    .filter((tt) => tt.tag.isActive)
    .map((tt) => tt.tag.name)
    .join(", ");
  const listingUrl = `${appUrl}/tools/${tool.slug}`;
  const markdownUrl = `${appUrl}/tools/${tool.slug}.md`;

  const launchLines = tool.launches
    .map((l) => `- ${formatLaunchType(l.launchType)} — ${formatDate(l.launchDate)}`)
    .join("\n");

  return [
    `# ${tool.name}`,
    "",
    `> ${tool.tagline}`,
    "",
    `**Website:** ${tool.websiteUrl}`,
    `**Pricing:** ${tool.pricingModel}`,
    categories ? `**Categories:** ${categories}` : null,
    tags ? `**Tags:** ${tags}` : null,
    `**Upvotes:** ${tool.upvoteCount}`,
    "",
    "## Description",
    "",
    tool.richDescription,
    "",
    ...(tool.launches.length > 0
      ? ["## Launch History", "", launchLines, ""]
      : []),
    "## Links",
    "",
    `- ShipBoost listing: ${listingUrl}`,
    `- Markdown: ${markdownUrl}`,
  ]
    .filter((line) => line !== null)
    .join("\n");
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
