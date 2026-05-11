import { getBestSeoPage, getAlternativesSeoPage } from "@/server/services/seo-service";
import { bestHubSections, bestPagesRegistry } from "@/server/seo/best-pages";
import { alternativesSeoRegistry } from "@/server/seo/registry";

const bestSlugs = [
  "ai-chatbots",
  "online-video-editors",
  "note-taking-apps",
  "code-hosting-platforms",
  "no-code-app-builders",
  "website-builders-and-cms",
  "sales-engagement-software",
  "api-testing-tools",
  "online-course-platforms",
  "ci-cd-tools",
] as const;

const hubSectionSlugs = [
  "ai-chatbots-assistants",
  "video-editing-creative-production",
  "notes-knowledge-management",
  "code-hosting-repository-management",
  "no-code-databases-app-builders",
  "website-builders-cms",
  "sales-engagement-cold-outreach",
  "api-development-testing",
  "online-course-community-platforms",
  "ci-cd-devops-automation",
] as const;

const alternativeSlugs = [
  "chatgpt",
  "perplexity",
  "capcut",
  "veed",
  "kapwing",
  "clipchamp",
  "invideo",
  "obsidian",
  "evernote",
  "onenote",
  "github",
  "gitlab",
  "softr",
  "firebase",
  "wix",
  "webflow",
  "apollo",
  "salesloft",
  "outreach",
  "reply-io",
  "instantly",
  "postman",
  "swagger",
  "podia",
  "teachable",
  "thinkific",
  "jenkins",
  "github-actions",
] as const;

function countWords(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).length;
}

function wordCountBestPage(slug: string) {
  const page = bestPagesRegistry[slug];

  if (!page) {
    return 0;
  }

  return countWords(
    [
      page.title,
      page.metaTitle,
      page.metaDescription,
      page.intro,
      page.whoItsFor,
      ...page.howWeEvaluated,
      ...page.comparisonTable.flatMap((row) => [
        row.label,
        ...Object.values(row.valuesByToolSlug),
      ]),
      ...page.rankedTools.flatMap((tool) => [
        tool.verdict,
        tool.bestFor,
        tool.notIdealFor,
        ...(tool.criteriaHighlights ?? []),
      ]),
      ...page.faq.flatMap((item) => [item.question, item.answer]),
      ...(page.customSections ?? []).flatMap((section) => [
        section.heading,
        section.body,
      ]),
    ].join(" "),
  );
}

function wordCountAlternativePage(slug: string) {
  const entry = alternativesSeoRegistry[slug];

  if (!entry) {
    return 0;
  }

  return countWords(
    [
      entry.title,
      entry.metaTitle,
      entry.metaDescription,
      entry.intro,
      ...(entry.faq ?? []).flatMap((item) => [item.question, item.answer]),
    ].join(" "),
  );
}

function includesTargetPhrase(text: string, target: string) {
  return text.toLowerCase().includes(target.toLowerCase());
}

function checkMetaLength(value: string) {
  return value.length >= 120 && value.length <= 165;
}

async function main() {
  const issues: string[] = [];
  const bestRows = [];
  const alternativeRows = [];

  for (const slug of bestSlugs) {
    const page = bestPagesRegistry[slug];

    if (!page) {
      issues.push(`Missing best page: ${slug}`);
      continue;
    }

    const materialized = await getBestSeoPage(slug);
    const words = wordCountBestPage(slug);
    const topToolSlugs = page.rankedTools.map((tool) => tool.toolSlug);
    const uniqueToolCount = new Set(topToolSlugs).size;

    if (!materialized) {
      issues.push(`Best page is not renderable from DB: ${slug}`);
    }
    if (words < 900) {
      issues.push(`Best page content is thin: ${slug} has ${words} words`);
    }
    if (page.rankedTools.length < 10 || uniqueToolCount !== page.rankedTools.length) {
      issues.push(`Best page tool list needs review: ${slug}`);
    }
    if (page.faq.length < 5) {
      issues.push(`Best page needs at least 5 FAQ items: ${slug}`);
    }
    if ((page.customSections?.length ?? 0) < 4) {
      issues.push(`Best page needs at least 4 custom sections: ${slug}`);
    }
    if (page.internalLinks.length < 3) {
      issues.push(`Best page needs at least 3 internal links: ${slug}`);
    }
    if (!includesTargetPhrase(page.metaTitle, page.targetKeyword.split(" ").slice(0, 2).join(" "))) {
      issues.push(`Best page meta title may miss keyword intent: ${slug}`);
    }
    if (!checkMetaLength(page.metaDescription)) {
      issues.push(
        `Best page meta description length outside 120-165 chars: ${slug} (${page.metaDescription.length})`,
      );
    }

    bestRows.push({
      slug,
      words,
      tools: page.rankedTools.length,
      faq: page.faq.length,
      sections: page.customSections?.length ?? 0,
      internalLinks: page.internalLinks.length,
      metaDescriptionLength: page.metaDescription.length,
      renderable: Boolean(materialized),
    });
  }

  for (const slug of hubSectionSlugs) {
    const section = bestHubSections.find((candidate) => candidate.slug === slug);

    if (!section) {
      issues.push(`Missing best hub section: ${slug}`);
      continue;
    }
    if (section.pageSlugs.length === 0) {
      issues.push(`Hub section has no pages: ${slug}`);
    }
    for (const pageSlug of section.pageSlugs) {
      if (!bestPagesRegistry[pageSlug]) {
        issues.push(`Hub section links missing best page: ${slug} -> ${pageSlug}`);
      }
    }
    if (section.supportingLinks.length < 2) {
      issues.push(`Hub section needs supporting links: ${slug}`);
    }
  }

  for (const slug of alternativeSlugs) {
    const entry = alternativesSeoRegistry[slug];

    if (!entry) {
      issues.push(`Missing alternatives page: ${slug}`);
      continue;
    }

    const materialized = await getAlternativesSeoPage(slug);
    const words = wordCountAlternativePage(slug);
    const uniqueToolCount = new Set(entry.toolSlugs).size;

    if (!materialized) {
      issues.push(`Alternatives page is not renderable from DB: ${slug}`);
    }
    if (words < 280) {
      issues.push(`Alternatives page static copy is thin: ${slug} has ${words} words`);
    }
    if (entry.toolSlugs.length < 6 || uniqueToolCount !== entry.toolSlugs.length) {
      issues.push(`Alternatives page tool list needs review: ${slug}`);
    }
    if (entry.toolSlugs.includes(entry.anchorToolSlug)) {
      issues.push(`Alternatives page includes anchor as an alternative: ${slug}`);
    }
    if ((entry.faq?.length ?? 0) < 5) {
      issues.push(`Alternatives page needs at least 5 FAQ items: ${slug}`);
    }
    if (!checkMetaLength(entry.metaDescription)) {
      issues.push(
        `Alternatives meta description length outside 120-165 chars: ${slug} (${entry.metaDescription.length})`,
      );
    }

    alternativeRows.push({
      slug,
      words,
      alternatives: entry.toolSlugs.length,
      faq: entry.faq?.length ?? 0,
      metaDescriptionLength: entry.metaDescription.length,
      renderable: Boolean(materialized),
    });
  }

  console.log(JSON.stringify({ bestRows, alternativeRows, issues }, null, 2));

  if (issues.length > 0) {
    process.exitCode = 1;
  }
}

void main();
