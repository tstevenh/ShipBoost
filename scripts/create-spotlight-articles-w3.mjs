import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const covers = JSON.parse(fs.readFileSync("/tmp/spotlight-covers-w3.json", "utf8"));

const articles = [
  {
    toolSlug: "visibai",
    coverKey: "visibai",
    slug: "visibai-ai-search-visibility-geo",
    title: "VisibAI: Find Out Whether AI Recommends You — or Your Competitor",
    excerpt:
      "VisibAI audits how your brand appears across six AI platforms — ChatGPT, Perplexity, Claude, Gemini, Mistral, You.com — returning a visibility score, competitor benchmarks, and a prioritized fix list. One-off audits from €29.",
    metaTitle: "VisibAI: AI Search Visibility Tool (GEO)",
    metaDescription:
      "See whether ChatGPT, Perplexity, Claude & Gemini recommend you or your competitor. Visibility score, competitor benchmarks, fix list. Audits from €29.",
    coverImageAlt: "VisibAI AI search visibility tool — Launch Spotlight cover",
    markdownPath: "/tmp/w3-visibai-article.md",
  },
  {
    toolSlug: "discme",
    coverKey: "discme",
    slug: "discme-ai-personality-test",
    title: "discme: A Personality Test That Lives Beyond the Result",
    excerpt:
      "discme is a free 8-minute DISC test mapping you to one of 16 blended profiles, plus Ask discme — an AI that already knows your full profile — and a relationship overlay showing how your type interacts with someone else's.",
    metaTitle: "discme: An AI Personality Test That Lives On",
    metaDescription:
      "A free 8-minute DISC test with 16 blended profiles, an AI that already knows how you're wired, and a relationship compatibility overlay.",
    coverImageAlt: "discme AI personality test — Launch Spotlight cover",
    markdownPath: "/tmp/w3-discme-article.md",
  },
  {
    toolSlug: "mysoft-ai",
    coverKey: "mysoft-ai",
    slug: "mysoft-ai-curated-ai-marketplace",
    title: "mysoft.ai: A Curated AI Marketplace Built on Low Fees and Visible Trust",
    excerpt:
      "mysoft.ai is a curated AI marketplace where every listing is hand-reviewed and carries a visible Trust Score. 5% commission — the lowest in the market — with sellers setting their own prices and keeping 95%.",
    metaTitle: "mysoft.ai: Curated AI Marketplace, 5% Commission",
    metaDescription:
      "A hand-reviewed AI marketplace with a Trust Score on every listing. 5% commission, seller-set pricing. Founding sellers lock 5% for life.",
    coverImageAlt: "mysoft.ai curated AI marketplace — Launch Spotlight cover",
    markdownPath: "/tmp/w3-mysoft-article.md",
  },
];

async function main() {
  const author = await prisma.blogAuthor.findFirst({ where: { slug: "tim" } });
  const category = await prisma.blogCategory.findFirst({ where: { slug: "launch-spotlights" } });
  const tags = await prisma.blogTag.findMany({ where: { slug: { in: ["founder-marketing", "saas-launch"] } } });

  if (!author || !category || tags.length !== 2) {
    throw new Error(`Missing refs: author=${!!author}, cat=${!!category}, tags=${tags.length}`);
  }

  for (const a of articles) {
    const cover = covers[a.coverKey];
    const markdown = fs.readFileSync(a.markdownPath, "utf8");

    const tool = await prisma.tool.findUnique({
      where: { slug: a.toolSlug },
      include: { submissions: { include: { spotlightBrief: true }, orderBy: { createdAt: "asc" } } },
    });
    const brief = tool?.submissions.find((s) => s.spotlightBrief)?.spotlightBrief ?? null;

    const existing = await prisma.blogArticle.findUnique({ where: { slug: a.slug } });
    if (existing) {
      console.log(`SKIP (exists): ${a.slug}`);
      continue;
    }

    const article = await prisma.blogArticle.create({
      data: {
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        markdownContent: markdown,
        status: "DRAFT",
        authorId: author.id,
        primaryCategoryId: category.id,
        coverImageUrl: cover.url,
        coverImagePublicId: cover.publicId,
        coverImageAlt: a.coverImageAlt,
        metaTitle: a.metaTitle,
        metaDescription: a.metaDescription,
        canonicalUrl: `https://shipboost.io/blog/${a.slug}`,
        ogImageUrl: cover.url,
        publishedAt: null,
        lastUpdatedAt: null,
        articleTags: { create: tags.map((t, i) => ({ tagId: t.id, sortOrder: i })) },
      },
    });

    if (brief) {
      await prisma.submissionSpotlightBrief.update({
        where: { id: brief.id },
        data: { publishedArticleId: article.id },
      });
    }

    console.log(`DRAFT ${a.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
