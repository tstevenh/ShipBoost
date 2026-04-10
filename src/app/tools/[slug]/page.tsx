import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Globe, Info, Zap, User as UserIcon, Calendar, Trophy, ArrowRight, Star, ChevronUp, MessageSquare, Tag, Layout } from "lucide-react";

import { MarkdownContent } from "@/components/content/markdown-content";
import { ClaimListingCard } from "@/components/public/claim-listing-card";
import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { buildTrackedToolOutboundUrl } from "@/lib/tool-outbound";
import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { hasAlternativesSeoPage } from "@/server/services/seo-service";
import { getListingClaimState } from "@/server/services/listing-claim-service";
import { getDailyVotesRemaining, listUserUpvotedToolIds } from "@/server/services/upvote-service";
import {
  getPublishedToolBySlug,
  listRelatedPublishedTools,
} from "@/server/services/tool-service";
import { Footer } from "@/components/ui/footer";
import { cn } from "@/lib/utils";

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
    <main className="flex-1 bg-background pt-28">
      {/* Tool Header Section */}
      <section className="bg-card border-b border-border py-8">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted flex items-center justify-center">
              {tool.logoMedia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={tool.logoMedia.url}
                  alt={`${tool.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-muted-foreground/40">
                  {tool.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-5xl font-black tracking-tight text-foreground mb-3">
                {tool.name}
              </h1>
              <p className="text-xl font-medium text-muted-foreground leading-relaxed">
                {tool.tagline}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-12">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px] w-full">
          {/* Main Content */}
          <div className="min-w-0 space-y-12">
            {/* Screenshot Gallery */}
            {screenshots.length > 0 && (
              <div className="space-y-4">
                <div className="aspect-video w-full rounded-2xl overflow-hidden border border-border bg-muted shadow-2xl shadow-black/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={screenshots[0].url}
                    alt={`${tool.name} primary screenshot`}
                    className="h-full w-full object-cover"
                  />
                </div>
                {screenshots.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    {screenshots.slice(1).map((media) => (
                      <div
                        key={media.id}
                        className="h-24 w-40 shrink-0 rounded-xl overflow-hidden border border-border bg-muted cursor-pointer transition-opacity hover:opacity-80"
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
                )}
              </div>
            )}

            <div className="prose dark:prose-invert max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground/90">
              <MarkdownContent content={tool.richDescription} />
            </div>

            {showClaimCard && (
              <ClaimListingCard
                toolId={tool.id}
                toolSlug={tool.slug}
                toolName={tool.name}
                claimState={serializedClaimState}
                viewerEmail={session?.user.email ?? null}
                signInHref={`/sign-in?redirect=${encodeURIComponent(claimRedirect)}`}
                signUpHref={`/submit?redirect=${encodeURIComponent(claimRedirect)}`}
              />
            )}
          </div>

          {/* Sidebar */}
          <aside className="space-y-8">
            <div className="space-y-4">
              <ToolUpvoteButton
                toolId={tool.id}
                initialCount={tool._count.toolVotes}
                initialHasUpvoted={tool.hasUpvoted}
                initialDailyVotesRemaining={dailyVotesRemaining}
                variant="large"
              />
              
              <a
                href={buildTrackedToolOutboundUrl(tool.id, "website", "tool_page")}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-4 text-sm font-black text-foreground transition-all hover:bg-muted active:scale-95 shadow-sm group"
              >
                <Globe size={18} />
                Visit website
              </a>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-6">Details</h3>
              <div className="space-y-5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Launch Date</span>
                  <span className="font-black tabular-nums">
                    {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(tool.createdAt))}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Category</span>
                  <Link href={`/categories/${primaryCategory?.slug}`} className="font-black text-foreground hover:underline">
                    {primaryCategory?.name}
                  </Link>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">Pricing</span>
                  <span className="px-2 py-0.5 rounded-full bg-muted border border-border text-foreground font-black text-[10px] uppercase">
                    {tool.pricingModel}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-muted-foreground">For Sale</span>
                  <span className="font-black">No</span>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tool.toolTags.map((item) => (
                  <Link
                    key={item.tag.slug}
                    href={`/best/tag/${item.tag.slug}`}
                    className="px-3 py-1.5 rounded-lg border border-border bg-card text-xs font-bold text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                  >
                    #{item.tag.name}
                  </Link>
                ))}
              </div>
            </div>

            {relatedTools.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 px-1">Similar products</h3>
                <div className="grid gap-3">
                  {relatedTools.map((relatedTool) => (
                    <Link
                      key={relatedTool.id}
                      href={`/tools/${relatedTool.slug}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-foreground/20 transition-all group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
                        {relatedTool.logoMedia ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={relatedTool.logoMedia.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs font-black text-muted-foreground/40">{relatedTool.name.slice(0, 2).toUpperCase()}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-black text-foreground truncate group-hover:opacity-70 transition-opacity">{relatedTool.name}</p>
                        <p className="text-[10px] font-medium text-muted-foreground/60 line-clamp-1">{relatedTool.tagline}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </section>
      <Footer />
    </main>
  );
}
