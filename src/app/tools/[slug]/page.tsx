import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe } from "lucide-react";

import { MarkdownContent } from "@/components/content/markdown-content";
import { JsonLdScript } from "@/components/seo/json-ld";
import { ToolRelatedProducts } from "@/components/public/tool-related-products";
import { ToolScreenshotRail } from "@/components/public/tool-screenshot-rail";
import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { ViewerClaimState } from "@/components/public/viewer-claim-state";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { buildTrackedToolOutboundUrl } from "@/lib/tool-outbound";
import { getEnv } from "@/server/env";
import { Footer } from "@/components/ui/footer";
import { buildToolPageSchema } from "@/server/seo/page-schema";
import {
  getCachedPublishedTool,
  getCachedRelatedPublishedTools,
  getCachedToolStaticParams,
} from "@/server/cache/public-content";

export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getCachedToolStaticParams();
}

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

function trimAtWordBoundary(value: string, maxLength: number) {
  const normalized = collapseWhitespace(value);

  if (normalized.length <= maxLength) {
    return normalized;
  }

  const sliced = normalized.slice(0, maxLength + 1);
  const boundaryIndex = sliced.lastIndexOf(" ");
  const safeSlice =
    boundaryIndex > Math.floor(maxLength * 0.6)
      ? sliced.slice(0, boundaryIndex)
      : normalized.slice(0, maxLength);

  return `${safeSlice.trim()}...`;
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
  tool: NonNullable<Awaited<ReturnType<typeof getCachedPublishedTool>>>,
) {
  if (tool.metaDescription?.trim()) {
    return trimAtWordBoundary(tool.metaDescription.trim(), 160);
  }

  const taglineSentence = ensureSentence(trimAtWordBoundary(tool.tagline, 60));
  const benefitSentence = extractBenefitSentence(
    tool.richDescription,
    tool.tagline,
  );

  if (taglineSentence && benefitSentence) {
    return `${taglineSentence} ${benefitSentence}`;
  }

  if (taglineSentence) {
    return `Discover ${tool.name} on ShipBoost - ${trimAtWordBoundary(tool.tagline, 60)}`;
  }

  return `Discover ${tool.name} on ShipBoost.`;
}

function buildToolTitle(
  tool: NonNullable<Awaited<ReturnType<typeof getCachedPublishedTool>>>,
) {
  if (tool.metaTitle?.trim()) {
    return trimAtWordBoundary(tool.metaTitle.trim(), 70);
  }

  return `${tool.name} | ShipBoost`;
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const tool = await getCachedPublishedTool(slug);

  if (!tool) {
    return {
      title: "Tool not found | ShipBoost",
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
      siteName: "ShipBoost",
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
  const tool = await getCachedPublishedTool(slug);

  if (!tool) {
    notFound();
  }

  const primaryCategory = tool.toolCategories[0]?.category ?? null;
  const env = getEnv();
  const canonical = tool.canonicalUrl?.trim()
    ? tool.canonicalUrl
    : `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`;
  const toolSchema = buildToolPageSchema({
    name: tool.name,
    description: buildToolDescription(tool),
    url: canonical,
    image: tool.logoMedia?.url,
    categoryName: primaryCategory?.name ?? null,
  });
  const relatedTools = await getCachedRelatedPublishedTools(
    tool.id,
    tool.toolCategories.map((item) => item.category.id),
    tool.toolTags.map((item) => item.tag.id),
  );

  const [heroScreenshot, ...deferredScreenshots] = tool.media;

  return (
    <ViewerVoteStateProvider toolIds={[tool.id]}>
      <main className="flex-1 bg-background pt-28">
        <JsonLdScript data={toolSchema} />
        {/* Tool Header Section */}
        <section className="bg-card border-b border-border py-8">
          <div className="mx-auto max-w-7xl px-6">
            <div className="flex flex-col gap-8 md:flex-row md:items-center">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-border bg-muted">
                {tool.logoMedia ? (
                  <div className="relative h-full w-full">
                    <Image
                      src={tool.logoMedia.url}
                      alt={`${tool.name} logo`}
                      fill
                      sizes="96px"
                      className="object-cover"
                      priority
                    />
                  </div>
                ) : (
                  <span className="text-3xl font-black text-muted-foreground/40">
                    {tool.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="mb-3 text-5xl font-black tracking-tight text-foreground">
                  {tool.name}
                </h1>
                <p className="text-xl font-medium leading-relaxed text-muted-foreground">
                  {tool.tagline}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto flex w-full max-w-7xl flex-1 px-6 py-12">
          <div className="grid w-full gap-12 lg:grid-cols-[1fr_320px]">
            {/* Main Content */}
            <div className="min-w-0 space-y-12">
              {/* Screenshot Gallery */}
              {heroScreenshot ? (
                <div className="space-y-4">
                  <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl shadow-black/5">
                    <Image
                      src={heroScreenshot.url}
                      alt={`${tool.name} primary screenshot`}
                      fill
                      sizes="(min-width: 1280px) 896px, (min-width: 1024px) calc(100vw - 432px), 100vw"
                      className="object-cover"
                      priority
                    />
                  </div>
                  <ToolScreenshotRail
                    screenshots={deferredScreenshots}
                    toolName={tool.name}
                  />
                </div>
              ) : null}

              <div className="prose max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground/90 dark:prose-invert">
                <MarkdownContent content={tool.richDescription} />
              </div>

              <ViewerClaimState
                toolId={tool.id}
                toolSlug={tool.slug}
                toolName={tool.name}
              />
            </div>

            {/* Sidebar */}
            <aside className="space-y-8">
              <div className="space-y-4">
                <ToolUpvoteButton
                  toolId={tool.id}
                  initialCount={tool.upvoteCount}
                  variant="large"
                />

                <a
                  href={buildTrackedToolOutboundUrl(tool.id, "website", "tool_page")}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-4 text-sm font-black text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
                >
                  <Globe size={18} />
                  Visit website
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-6 text-[10px] font-black  tracking-[0.2em] text-muted-foreground/60">
                  Details
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">Launch Date</span>
                    <span className="font-black tabular-nums">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(tool.createdAt))}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">Category</span>
                    <Link
                      href={`/categories/${primaryCategory?.slug}`}
                      className="font-black text-foreground hover:underline"
                    >
                      {primaryCategory?.name}
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">Pricing</span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-black  text-foreground">
                      {tool.pricingModel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">For Sale</span>
                    <span className="font-black">No</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="px-1 text-[10px] font-black  tracking-[0.2em] text-muted-foreground/60">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {tool.toolTags.map((item) => (
                    <Link
                      key={item.tag.slug}
                      href={`/best/tag/${item.tag.slug}`}
                      className="rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-foreground hover:text-foreground"
                    >
                      #{item.tag.name}
                    </Link>
                  ))}
                </div>
              </div>

              <ToolRelatedProducts relatedTools={relatedTools} />
            </aside>
          </div>
        </section>
        <Footer />
      </main>
    </ViewerVoteStateProvider>
  );
}
