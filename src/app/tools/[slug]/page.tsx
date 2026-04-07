import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/content/markdown-content";
import { getEnv } from "@/server/env";
import { getPublishedToolBySlug } from "@/server/services/tool-service";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function collapseWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function stripMarkdown(value: string) {
  return collapseWhitespace(
    value
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]*)`/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^>\s?/gm, "")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/[*_~]/g, "")
      .replace(/^\s*[-*+]\s+/gm, "")
      .replace(/^\s*\d+\.\s+/gm, "")
      .replace(/\|/g, " "),
  );
}

function ensureSentence(value: string) {
  const trimmed = collapseWhitespace(value).replace(/[.!?\s]+$/, "");

  if (!trimmed) {
    return "";
  }

  return `${trimmed}.`;
}

function extractBenefitSentence(richDescription: string, tagline: string) {
  const plain = stripMarkdown(richDescription);
  const firstSentence =
    plain.match(/.+?[.!?](?:\s|$)/)?.[0] ??
    plain.slice(0, 160);
  const normalizedSentence = collapseWhitespace(firstSentence);
  const normalizedTagline = collapseWhitespace(tagline).toLowerCase();

  if (!normalizedSentence) {
    return "";
  }

  if (normalizedSentence.toLowerCase() === normalizedTagline) {
    return "";
  }

  return ensureSentence(normalizedSentence);
}

function buildToolDescription(tool: NonNullable<Awaited<ReturnType<typeof getPublishedToolBySlug>>>) {
  if (tool.metaDescription?.trim()) {
    return tool.metaDescription.trim();
  }

  const taglineSentence = ensureSentence(tool.tagline);
  const benefitSentence = extractBenefitSentence(
    tool.richDescription,
    tool.tagline,
  );

  if (taglineSentence && benefitSentence) {
    return `${taglineSentence} ${benefitSentence}`;
  }

  if (taglineSentence) {
    return `Discover ${tool.name} on Shipboost - ${tool.tagline.trim()}`;
  }

  return `Discover ${tool.name} on Shipboost.`;
}

function buildToolTitle(tool: NonNullable<Awaited<ReturnType<typeof getPublishedToolBySlug>>>) {
  if (tool.metaTitle?.trim()) {
    return tool.metaTitle.trim();
  }

  return `${tool.name} | Shipboost`;
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const tool = await getPublishedToolBySlug(slug);

  if (!tool) {
    return {
      title: "Tool not found | Shipboost",
    };
  }

  const env = getEnv();
  const title = buildToolTitle(tool);
  const description = buildToolDescription(tool);
  const canonical = tool.canonicalUrl?.trim()
    ? tool.canonicalUrl
    : `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`;

  return {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "Shipboost",
      type: "website",
      images: tool.logoMedia
        ? [
            {
              url: tool.logoMedia.url,
              alt: `${tool.name} logo`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: tool.logoMedia ? "summary_large_image" : "summary",
      title,
      description,
      images: tool.logoMedia ? [tool.logoMedia.url] : undefined,
    },
  };
}

export default async function ToolPage(context: RouteContext) {
  const { slug } = await context.params;
  const tool = await getPublishedToolBySlug(slug);

  if (!tool) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
          <div className="flex items-start gap-5">
            <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.75rem] bg-[#f3f0ea]">
              {tool.logoMedia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tool.logoMedia.url}
                  alt={`${tool.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-semibold text-black/45">
                  {tool.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
                Published tool
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight text-black">
                {tool.name}
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-black/66">
                {tool.tagline}
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-2">
            {tool.toolCategories.map((item) => (
              <Link
                key={item.category.slug}
                href={`/categories/${item.category.slug}`}
                className="rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1.5 text-xs font-medium text-black/72"
              >
                {item.category.name}
              </Link>
            ))}
            {tool.toolTags.map((item) => (
              <span
                key={item.tag.slug}
                className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/56"
              >
                {item.tag.name}
              </span>
            ))}
          </div>

          <div className="mt-8 max-w-none">
            <MarkdownContent content={tool.richDescription} />
          </div>

          {tool.media.filter((media) => media.type === "SCREENSHOT").length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {tool.media
                .filter((media) => media.type === "SCREENSHOT")
                .map((media) => (
                  <div
                    key={media.id}
                    className="overflow-hidden rounded-[1.5rem] border border-black/10 bg-[#f3f0ea]"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={media.url}
                      alt={`${tool.name} screenshot`}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ))}
            </div>
          ) : null}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.24)] sm:p-10">
            <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
              Quick facts
            </p>
            <div className="mt-6 space-y-4 text-sm leading-7 text-[#f8efe3]/82">
              <p>Pricing model: {tool.pricingModel}</p>
              <p>
                Affiliate program: {tool.hasAffiliateProgram ? "Yes" : "No"}
              </p>
              <p>Featured: {tool.isFeatured ? "Yes" : "No"}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={tool.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#143f35] transition hover:bg-[#f5eadc]"
              >
                Visit website
              </a>
              {tool.affiliateUrl ? (
                <a
                  href={tool.affiliateUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Explore affiliate offer
                </a>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Founder links
            </p>
            <div className="mt-5 space-y-3 text-sm text-black/68">
              {tool.founderXUrl ? (
                <a href={tool.founderXUrl} target="_blank" rel="noreferrer" className="block hover:text-[#9f4f1d]">
                  X profile
                </a>
              ) : null}
              {tool.founderGithubUrl ? (
                <a href={tool.founderGithubUrl} target="_blank" rel="noreferrer" className="block hover:text-[#9f4f1d]">
                  GitHub
                </a>
              ) : null}
              {tool.founderLinkedinUrl ? (
                <a href={tool.founderLinkedinUrl} target="_blank" rel="noreferrer" className="block hover:text-[#9f4f1d]">
                  LinkedIn
                </a>
              ) : null}
              {tool.founderFacebookUrl ? (
                <a href={tool.founderFacebookUrl} target="_blank" rel="noreferrer" className="block hover:text-[#9f4f1d]">
                  Facebook
                </a>
              ) : null}
              {!tool.founderXUrl &&
              !tool.founderGithubUrl &&
              !tool.founderLinkedinUrl &&
              !tool.founderFacebookUrl ? (
                <p>No public founder links provided yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
