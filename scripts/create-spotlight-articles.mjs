import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();

const covers = JSON.parse(fs.readFileSync("/tmp/spotlight-covers.json", "utf8"));

const articles = [
  {
    toolSlug: "partspal",
    coverKey: "partspal",
    slug: "partspal-free-car-management-app",
    title: "PartsPal: A Free App That Puts Your Whole Car in One Place",
    excerpt:
      "PartsPal is a free, all-in-one app for everyday car owners — save your vehicle, track maintenance, save parts you want to buy or have installed, and find nearby mechanics in one place.",
    metaTitle: "PartsPal: Free Car Management App for Everyday Owners",
    metaDescription:
      "PartsPal is a free app that brings your car's maintenance, saved parts, part search, and nearby mechanics into one place. Built for everyday car owners.",
    coverImageAlt: "PartsPal car management app — Launch Spotlight cover",
    markdownPath: "/tmp/partspal-article.md",
    publish: true, // today
  },
  {
    toolSlug: "zerobasis",
    coverKey: "zerobasis",
    slug: "zerobasis-private-0-percent-balance-transfer-tracker",
    title: "ZeroBasis: A Private 0% Balance Transfer Tracker That Never Touches Your Bank",
    excerpt:
      "ZeroBasis is a private, manual tracker for 0% credit card balance transfers — no Open Banking, no bank logins. Tracks expiry dates, calculates your safe spending surplus, and warns you before the 29% APR cliff.",
    metaTitle: "ZeroBasis: Private 0% Balance Transfer Tracker (No Open Banking)",
    metaDescription:
      "ZeroBasis is a private, manual 0% balance transfer and debt tracker. No bank logins, no Open Banking. Tracks expiry dates and your safe interest-free spending buffer.",
    coverImageAlt: "ZeroBasis private 0% balance transfer tracker — Launch Spotlight cover",
    markdownPath: "/tmp/zerobasis-article.md",
    publish: false, // Tue May 26
  },
  {
    toolSlug: "stock-monitor",
    coverKey: "stock-monitor",
    slug: "stock-monitor-ai-filtered-stock-crypto-telegram-alerts",
    title: "Stock Monitor: AI-Filtered Stock and Crypto Alerts, Delivered on Telegram",
    excerpt:
      "Stock Monitor watches your stock and crypto watchlist 24/7 and only sends Telegram alerts when news could realistically move the price — filtering roughly 80% of the noise before it ever reaches you.",
    metaTitle: "Stock Monitor: AI-Filtered Stock & Crypto Telegram Alerts",
    metaDescription:
      "Stock Monitor sends AI-filtered stock and crypto news alerts via Telegram — only when news could move the price. Multi-market coverage, 30-day free trial.",
    coverImageAlt: "Stock Monitor AI-filtered stock and crypto alerts — Launch Spotlight cover",
    markdownPath: "/tmp/stockmonitor-article.md",
    publish: false, // Wed May 27
  },
  {
    toolSlug: "mvp-builder",
    coverKey: "mvp-builder",
    slug: "mvp-builder-30-day-sprint-developers-ship-side-projects",
    title: "MVP Builder: A 30-Day Sprint for Devs Who Keep Almost Finishing Their MVP",
    excerpt:
      "MVP Builder is a 30-day structured sprint for full-time developers with an unfinished side project. Daily prompts tailored to your project, hard milestone deadlines, and a founder who reads every check-in personally.",
    metaTitle: "MVP Builder: 30-Day Ship Sprint for Side-Project Devs",
    metaDescription:
      "A structured 30-day sprint for full-time developers who keep stopping at 70%. Daily calibrated prompts, hard milestones, human-in-the-loop accountability from the founder.",
    coverImageAlt: "MVP Builder 30-day sprint program — Launch Spotlight cover",
    markdownPath: "/tmp/mvpbuilder-article.md",
    publish: false, // Thu May 28
  },
  {
    toolSlug: "websitepublisher",
    coverKey: "websitepublisher",
    slug: "websitepublisher-ai-mcp-website-building",
    title: "WebsitePublisher.ai: Let Your AI Build, Host, and Publish the Whole Site",
    excerpt:
      "WebsitePublisher.ai lets AI assistants (Claude, ChatGPT, Cursor, and others) build, host, and publish full websites via the Model Context Protocol — 60+ MCP tools for pages, assets, forms, integrations, and deployment.",
    metaTitle: "WebsitePublisher.ai: AI-Driven Website Building Over MCP",
    metaDescription:
      "WebsitePublisher.ai lets Claude, ChatGPT, Cursor, and other AI assistants build, host, and publish full websites via the Model Context Protocol. 60+ MCP tools, full deployment.",
    coverImageAlt: "WebsitePublisher.ai AI-driven website building — Launch Spotlight cover",
    markdownPath: "/tmp/websitepublisher-article.md",
    publish: false, // Fri May 29
  },
];

async function main() {
  const author = await prisma.blogAuthor.findFirst({ where: { slug: "tim" } });
  const category = await prisma.blogCategory.findFirst({ where: { slug: "launch-spotlights" } });
  const tags = await prisma.blogTag.findMany({ where: { slug: { in: ["founder-marketing", "saas-launch"] } } });

  if (!author || !category || tags.length !== 2) {
    throw new Error(`Missing required refs: author=${!!author}, cat=${!!category}, tags=${tags.length}`);
  }

  const now = new Date();

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
        status: a.publish ? "PUBLISHED" : "DRAFT",
        authorId: author.id,
        primaryCategoryId: category.id,
        coverImageUrl: cover.url,
        coverImagePublicId: cover.publicId,
        coverImageAlt: a.coverImageAlt,
        metaTitle: a.metaTitle,
        metaDescription: a.metaDescription,
        canonicalUrl: `https://shipboost.io/blog/${a.slug}`,
        ogImageUrl: cover.url,
        publishedAt: a.publish ? now : null,
        lastUpdatedAt: a.publish ? now : null,
        articleTags: {
          create: tags.map((t, i) => ({ tagId: t.id, sortOrder: i })),
        },
      },
    });

    if (brief) {
      await prisma.submissionSpotlightBrief.update({
        where: { id: brief.id },
        data: {
          publishedArticleId: article.id,
          publishedAt: a.publish ? now : null,
        },
      });
    }

    console.log(`${a.publish ? "PUBLISHED" : "DRAFT    "} ${a.slug}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
