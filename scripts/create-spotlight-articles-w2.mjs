import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const covers = JSON.parse(fs.readFileSync("/tmp/spotlight-covers-w2.json", "utf8"));

const articles = [
  {
    toolSlug: "tbr-local",
    coverKey: "tbr-local",
    slug: "tbr-local-hands-on-local-seo-service",
    title: "TBR Local: Hands-On Local SEO for Businesses That Need to Show Up on the Map",
    excerpt:
      "TBR Local is a done-for-you local SEO service — Google Business Profile, citations, on-page SEO, and reputation management handled by a team, so location-based businesses show up in the map pack.",
    metaTitle: "TBR Local: Hands-On Local SEO Services",
    metaDescription:
      "Done-for-you local SEO from The Best Reputation — Google Business Profile, citations, reviews, and on-page SEO to win the map pack.",
    coverImageAlt: "TBR Local local SEO service — Launch Spotlight cover",
    markdownPath: "/tmp/w2-tbrlocal-article.md",
    publish: true,
  },
  {
    toolSlug: "zensor-analytics",
    coverKey: "zensor-analytics",
    slug: "zensor-analytics-unified-agency-seo-reporting",
    title: "Zensor Analytics: One Reporting Layer Instead of Five Tabs and a Spreadsheet",
    excerpt:
      "Zensor Analytics unifies GA4, Search Console, site crawling, Core Web Vitals, and AI search monitoring into one AI-powered reporting layer built for agencies — client-ready narratives without the manual stitching.",
    metaTitle: "Zensor Analytics: Unified SEO Reporting for Agencies",
    metaDescription:
      "Zensor unifies GA4, Search Console, crawling, Core Web Vitals & AI search into one AI reporting layer. White-labeled, client-ready, freemium.",
    coverImageAlt: "Zensor Analytics unified agency reporting — Launch Spotlight cover",
    markdownPath: "/tmp/w2-zensor-article.md",
    publish: false,
  },
  {
    toolSlug: "fretpulse",
    coverKey: "fretpulse",
    slug: "fretpulse-guitar-practice-system",
    title: "FretPulse: A Practice System That Makes Every Guitar Session Count",
    excerpt:
      "FretPulse builds your daily guitar routine, plays along in real time, trains your speed systematically, and tracks what's improving — so practice time compounds instead of turning into noodling.",
    metaTitle: "FretPulse: A Guitar Practice System That Compounds",
    metaDescription:
      "FretPulse auto-builds your routine, plays along in real time, trains speed, and tracks progress automatically. Built by a 10+ year guitarist.",
    coverImageAlt: "FretPulse guitar practice system — Launch Spotlight cover",
    markdownPath: "/tmp/w2-fretpulse-article.md",
    publish: false,
  },
  {
    toolSlug: "andreas-christodoulou",
    coverKey: "andreas-christodoulou",
    slug: "andreas-christodoulou-founder-profile",
    title: "Andreas Christodoulou: A Self-Taught Operator's 20-Year Path From Rural Cyprus to Belgium",
    excerpt:
      "A profile of Andreas Christodoulou ('andreascy') — a self-taught entrepreneur with 20+ years across tech, digital marketing, and content, who works with businesses on problems that sit between those layers.",
    metaTitle: "Andreas Christodoulou: Self-Taught Tech & Marketing Operator",
    metaDescription:
      "A profile of andreascy — 20+ years founding tech and digital media businesses, from rural Cyprus to Belgium. Working with businesses on tech, marketing, and operations.",
    coverImageAlt: "Andreas Christodoulou — Launch Spotlight cover",
    markdownPath: "/tmp/w2-andreas-article.md",
    publish: false,
  },
  {
    toolSlug: "onix-pdf",
    coverKey: "onix-pdf",
    slug: "onix-pdf-all-in-one-browser-pdf-toolkit",
    title: "Onix PDF: Every PDF Task in One Browser Tab",
    excerpt:
      "Onix PDF is a browser-based, all-in-one PDF toolkit — merge, split, compress, convert, OCR, sign, and PDF/A — with no install, on any device, security-first.",
    metaTitle: "Onix PDF: All-in-One Browser PDF Toolkit",
    metaDescription:
      "Merge, split, compress, convert, OCR, and sign PDFs in one browser tab. No install, any device, professional tools included.",
    coverImageAlt: "Onix PDF all-in-one browser PDF toolkit — Launch Spotlight cover",
    markdownPath: "/tmp/w2-onixpdf-article.md",
    publish: false,
  },
];

async function main() {
  const author = await prisma.blogAuthor.findFirst({ where: { slug: "tim" } });
  const category = await prisma.blogCategory.findFirst({ where: { slug: "launch-spotlights" } });
  const tags = await prisma.blogTag.findMany({ where: { slug: { in: ["founder-marketing", "saas-launch"] } } });

  if (!author || !category || tags.length !== 2) {
    throw new Error(`Missing refs: author=${!!author}, cat=${!!category}, tags=${tags.length}`);
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
        articleTags: { create: tags.map((t, i) => ({ tagId: t.id, sortOrder: i })) },
      },
    });

    if (brief) {
      await prisma.submissionSpotlightBrief.update({
        where: { id: brief.id },
        data: { publishedArticleId: article.id, publishedAt: a.publish ? now : null },
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
