import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

const prisma = new PrismaClient();
const covers = JSON.parse(fs.readFileSync("/tmp/spotlight-covers-w2b.json", "utf8"));

const articles = [
  {
    toolSlug: "humanly",
    coverKey: "humanly",
    slug: "humanly-face-verified-video-app",
    title: "humanly: A Face-Verified Video Receipt for the Moments That Need a Real Person Behind Them",
    excerpt:
      "humanly is an Android app for short, one-take, face-verified videos. Create a face signature, then record in-app videos checked against it before posting — a lightweight human receipt for founder notes, testimonials, and listings.",
    metaTitle: "humanly: Face-Verified One-Take Video",
    metaDescription:
      "humanly is an Android app for short, one-take, face-verified videos — a human receipt for the moments where the person behind the message matters.",
    coverImageAlt: "humanly face-verified video app — Launch Spotlight cover",
    markdownPath: "/tmp/w2-humanly-article.md",
    publish: false,
  },
  {
    toolSlug: "whisperstream",
    coverKey: "whisperstream",
    slug: "whisperstream-local-windows-voice-dictation",
    title: "Whisperstream: Local-Only Voice Dictation for Windows, $29 Once",
    excerpt:
      "Whisperstream is a Windows-native dictation app that runs 100% on your PC — push-to-talk into any window, transcription via NVIDIA Parakeet entirely in RAM, no cloud, no subscription. $29 one-time.",
    metaTitle: "Whisperstream: Local Windows Voice Dictation, $29",
    metaDescription:
      "100% on-device dictation for Windows. Push-to-talk into any app, NVIDIA Parakeet running locally, no cloud, no subscription. $29 one-time.",
    coverImageAlt: "Whisperstream local Windows voice dictation — Launch Spotlight cover",
    markdownPath: "/tmp/w2-whisperstream-article.md",
    publish: false,
  },
  {
    toolSlug: "fake-mayo-startup-stories",
    coverKey: "fake-mayo-startup-stories",
    slug: "fake-mayo-real-startup-stories-newsletter",
    title: "Fake Mayo: Real Startup Stories, Minus the Hype",
    excerpt:
      "Fake Mayo is a founder-first blog and newsletter publishing real, no-hype stories of how startups and indie hackers landed early traction — the exact tactics, told as case studies, not motivational arcs.",
    metaTitle: "Fake Mayo: Real Startup Stories, No Hype",
    metaDescription:
      "A founder-first newsletter breaking down the exact moves indie hackers used to get early traction. Real case studies, weekly, by Jakob Jelling.",
    coverImageAlt: "Fake Mayo real startup stories newsletter — Launch Spotlight cover",
    markdownPath: "/tmp/w2-fakemayo-article.md",
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
