import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { MarkdownContent } from "@/components/content/markdown-content";
import { ClaimListingCard } from "@/components/public/claim-listing-card";
import { PublicToolCard } from "@/components/public/public-tool-card";
import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { buildTrackedToolOutboundUrl } from "@/lib/tool-outbound";
import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { hasAlternativesSeoPage } from "@/server/services/seo-service";
import { getListingClaimState } from "@/server/services/listing-claim-service";
import { getDailyVotesRemaining } from "@/server/services/upvote-service";
import {
  getPublishedToolBySlug,
  listRelatedPublishedTools,
} from "@/server/services/tool-service";

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
    plain.match(/.+?[.!?](?:\s|$)/)?.[0] ?? plain.slice(0, 160);
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

function buildToolDescription(
  tool: NonNullable<Awaited<ReturnType<typeof getPublishedToolBySlug>>>,
) {
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

function buildToolTitle(
  tool: NonNullable<Awaited<ReturnType<typeof getPublishedToolBySlug>>>,
) {
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
  const session = await getServerSession();
  const [tool, dailyVotesRemaining] = await Promise.all([
    getPublishedToolBySlug(slug, {
      viewerUserId: session?.user.id ?? null,
    }),
    session?.user.id
      ? getDailyVotesRemaining(session.user.id)
      : Promise.resolve(null),
  ]);

  if (!tool) {
    notFound();
  }

  const primaryCategory = tool.toolCategories[0]?.category ?? null;
  const relatedTools = await listRelatedPublishedTools(tool.id, {
    categoryIds: tool.toolCategories.map((item) => item.category.id),
    tagIds: tool.toolTags.map((item) => item.tag.id),
    take: 4,
  });
  const launchHistory = tool.launches.slice(0, 5);
  const bestFor = [
    ...new Set([
      ...tool.toolCategories.map((item) => item.category.name),
      ...tool.toolTags.map((item) => item.tag.name),
    ]),
  ].slice(0, 5);
  const screenshots = tool.media.filter((media) => media.type === "SCREENSHOT");
  const claimState = await getListingClaimState(tool.id, {
    userId: session?.user.id ?? null,
    email: session?.user.email ?? null,
  });
  const serializedClaimState =
    "reviewedAt" in claimState
      ? {
          ...claimState,
          reviewedAt: claimState.reviewedAt?.toISOString() ?? null,
        }
      : claimState;
  const claimRedirect = `/tools/${tool.slug}?claim=1`;
  const showClaimCard =
    claimState.status !== "OWNED" && claimState.status !== "OWNED_BY_YOU";

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

          <div className="mt-8">
            <ToolUpvoteButton
              toolId={tool.id}
              initialCount={tool.upvoteCount}
              initialHasUpvoted={tool.hasUpvoted}
              initialDailyVotesRemaining={dailyVotesRemaining}
            />
          </div>

          <div className="mt-8 max-w-none">
            <MarkdownContent content={tool.richDescription} />
          </div>

          <div className="mt-10 rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-6">
            <p className="text-sm font-semibold tracking-[0.22em] text-[#9f4f1d] uppercase">
              Best for
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {bestFor.map((label) => (
                <span
                  key={label}
                  className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs font-medium text-black/68"
                >
                  {label}
                </span>
              ))}
              {bestFor.length === 0 ? (
                <span className="text-sm text-black/55">
                  Category and use-case tags will appear here later.
                </span>
              ) : null}
            </div>
          </div>

          {screenshots.length > 0 ? (
            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {screenshots.map((media) => (
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
              <p>Affiliate program: {tool.hasAffiliateProgram ? "Yes" : "No"}</p>
              <p>Featured: {tool.isFeatured ? "Yes" : "No"}</p>
              <p>Launch history entries: {launchHistory.length}</p>
            </div>

            <div className="mt-8 flex flex-col gap-3">
              <a
                href={buildTrackedToolOutboundUrl(tool.id, "website", "tool_page")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-[#143f35] transition hover:bg-[#f5eadc]"
              >
                Visit website
              </a>
              {tool.affiliateUrl ? (
                <a
                  href={buildTrackedToolOutboundUrl(
                    tool.id,
                    "affiliate",
                    "tool_page",
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Explore affiliate offer
                </a>
              ) : null}
              {hasAlternativesSeoPage(tool.slug) ? (
                <Link
                  href={`/alternatives/${tool.slug}`}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/5"
                >
                  Compare alternatives
                </Link>
              ) : null}
            </div>
          </div>

          <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Founder links
            </p>
            <div className="mt-5 space-y-3 text-sm text-black/68">
              {tool.founderXUrl ? (
                <a
                  href={tool.founderXUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#9f4f1d]"
                >
                  X profile
                </a>
              ) : null}
              {tool.founderGithubUrl ? (
                <a
                  href={tool.founderGithubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#9f4f1d]"
                >
                  GitHub
                </a>
              ) : null}
              {tool.founderLinkedinUrl ? (
                <a
                  href={tool.founderLinkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#9f4f1d]"
                >
                  LinkedIn
                </a>
              ) : null}
              {tool.founderFacebookUrl ? (
                <a
                  href={tool.founderFacebookUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="block hover:text-[#9f4f1d]"
                >
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

          <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Launch history
            </p>
            <div className="mt-5 space-y-3 text-sm text-black/66">
              {launchHistory.map((launch) => (
                <div
                  key={launch.id}
                  className="rounded-[1.25rem] border border-black/10 bg-[#fffdf8] px-4 py-3"
                >
                  <p className="font-semibold text-black">
                    {launch.launchType} • {launch.status}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.16em] text-black/42">
                    {new Intl.DateTimeFormat("en", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    }).format(new Date(launch.launchDate))}
                  </p>
                </div>
              ))}
              {launchHistory.length === 0 ? (
                <p>No public launch history yet.</p>
              ) : null}
            </div>
          </div>
        </aside>
      </div>

      {showClaimCard ? (
        <div className="mt-8">
          <ClaimListingCard
            toolId={tool.id}
            toolSlug={tool.slug}
            toolName={tool.name}
            claimState={serializedClaimState}
            viewerEmail={session?.user.email ?? null}
            signInHref={`/sign-in?redirect=${encodeURIComponent(claimRedirect)}`}
            signUpHref={`/sign-up?redirect=${encodeURIComponent(claimRedirect)}`}
          />
        </div>
      ) : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
        <section className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.24)]">
          <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
            Category context
          </p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-[#f8efe3]/82">
            <p>
              {tool.name} is published on Shipboost as a live{" "}
              {primaryCategory?.name.toLowerCase() ?? "SaaS"} listing for
              bootstrapped founders.
            </p>
            <p>
              Use the category links above to compare adjacent tools, or jump to
              the launch boards for recent visibility proof.
            </p>
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            {primaryCategory ? (
              <Link
                href={`/categories/${primaryCategory.slug}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#143f35] transition hover:bg-[#f5eadc]"
              >
                Explore {primaryCategory.name}
              </Link>
            ) : null}
            <Link
              href="/launches/daily"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Daily launches
            </Link>
            <Link
              href="/launches/weekly"
              className="rounded-full border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/5"
            >
              Weekly launches
            </Link>
          </div>
        </section>

        <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
                Related tools
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
                Similar listings founders also compare
              </h2>
            </div>
            {primaryCategory ? (
              <Link
                href={`/categories/${primaryCategory.slug}`}
                className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
              >
                More in {primaryCategory.name}
              </Link>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4">
            {relatedTools.map((relatedTool) => (
              <PublicToolCard
                key={relatedTool.slug}
                tool={relatedTool}
                sourceSurface="tool_page_related"
              />
            ))}
            {relatedTools.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
                Related tools will appear once more overlapping listings go live.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </section>
  );
}
