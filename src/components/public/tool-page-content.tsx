import Image from "next/image";
import Link from "next/link";
import { ChevronRight, Globe, Home as HomeIcon, Lock } from "lucide-react";

import { MarkdownContent } from "@/components/content/markdown-content";
import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinkSection } from "@/components/seo/internal-link-section";
import { ToolRelatedProducts } from "@/components/public/tool-related-products";
import { ToolScreenshotRail } from "@/components/public/tool-screenshot-rail";
import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { ViewerClaimState } from "@/components/public/viewer-claim-state";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import { buildTrackedToolOutboundUrl } from "@/lib/tool-outbound";
import { buildToolPageSchema } from "@/server/seo/page-schema";
import {
  buildToolPageDescription,
  getToolTimelineDisplay,
} from "@/server/services/tool-page";

type ToolPageData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  richDescription: string;
  pricingModel: string;
  websiteUrl: string;
  metaTitle: string | null;
  metaDescription: string | null;
  createdAt: Date | string;
  launches: Array<{
    status: string;
    launchType: string;
    launchDate: Date | string;
  }>;
  logoMedia: { url: string } | null;
  media: { id: string; url: string }[];
  toolCategories: {
    category: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
  toolTags: {
    tag: {
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
    };
  }[];
  upvoteCount: number;
};

type RelatedTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoMedia: { url: string } | null;
};

export function ToolPageContent({
  tool,
  relatedTools,
  relatedListingLinks,
  canonicalUrl,
  isPreview = false,
}: {
  tool: ToolPageData;
  relatedTools: RelatedTool[];
  relatedListingLinks: {
    href: string;
    label: string;
    description: string;
  }[];
  canonicalUrl: string;
  isPreview?: boolean;
}) {
  const primaryCategory = tool.toolCategories[0]?.category ?? null;
  const toolSchema = buildToolPageSchema({
    name: tool.name,
    description: buildToolPageDescription(tool),
    url: canonicalUrl,
    image: tool.logoMedia?.url,
    categoryName: primaryCategory?.name ?? null,
  });
  const websiteHref = isPreview
    ? tool.websiteUrl
    : buildTrackedToolOutboundUrl(tool.id, "website", "tool_page");
  const timeline = getToolTimelineDisplay({
    createdAt: tool.createdAt,
    launches: tool.launches,
  });
  const morePathsSection = relatedListingLinks.length > 0 ? (
    <InternalLinkSection
      eyebrow="Explore"
      title={`More paths around ${tool.name}`}
      description={
        primaryCategory
          ? `Use ${primaryCategory.name}, tag, and alternatives pages when you want a broader comparison set around ${tool.name}.`
          : `Use related tags and alternatives when you want a broader comparison set around ${tool.name}.`
      }
      links={relatedListingLinks.slice(0, 4)}
    />
  ) : null;

  return (
    <ViewerVoteStateProvider toolIds={[tool.id]}>
      <main className="flex-1 bg-background pt-28">
        <JsonLdScript data={toolSchema} />
        <section className="bg-card border-b border-border py-8">
          <div className="mx-auto max-w-7xl px-6">
            <nav className="mb-8 flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
              <Link href="/" className="flex items-center gap-1 transition-colors hover:text-primary">
                <HomeIcon size={10} /> Home
              </Link>
              <ChevronRight size={10} />
              {primaryCategory ? (
                <>
                  <Link
                    href={`/categories/${primaryCategory.slug}`}
                    className="transition-colors hover:text-primary"
                  >
                    {primaryCategory.name}
                  </Link>
                  <ChevronRight size={10} />
                </>
              ) : null}
              <span className="text-primary">{tool.name}</span>
            </nav>
            {isPreview ? (
              <div className="mb-8 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-medium text-foreground">
                <Lock size={16} className="mt-0.5 shrink-0 text-primary" />
                <p>
                  Founder preview. This listing is not public yet, so only you can view it from the dashboard.
                </p>
              </div>
            ) : null}
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
            <div className="min-w-0 space-y-12">
              <ToolScreenshotRail
                screenshots={tool.media}
                toolName={tool.name}
              />

              <div className="prose max-w-none prose-p:leading-relaxed prose-p:text-muted-foreground/90 dark:prose-invert">
                <MarkdownContent content={tool.richDescription} />
              </div>

              {!isPreview ? (
                <ViewerClaimState
                  toolId={tool.id}
                  toolSlug={tool.slug}
                  toolName={tool.name}
                />
              ) : null}

              <div className="hidden lg:block">{morePathsSection}</div>
            </div>

            <aside className="space-y-8">
              <div className="space-y-4">
                {!isPreview ? (
                  <ToolUpvoteButton
                    toolId={tool.id}
                    initialCount={tool.upvoteCount}
                    variant="large"
                  />
                ) : null}

                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-card px-6 py-4 text-sm font-black text-foreground shadow-sm transition-all hover:bg-muted active:scale-95"
                >
                  <Globe size={18} />
                  Visit website
                </a>
              </div>

              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
                <h3 className="mb-6 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                  Details
                </h3>
                <div className="space-y-5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">{timeline.label}</span>
                    <span className="font-black tabular-nums">
                      {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(timeline.date)}
                    </span>
                  </div>
                  {primaryCategory ? (
                    <div className="flex items-center justify-between text-xs gap-4">
                      <span className="font-bold text-muted-foreground">Category</span>
                      <Link
                        href={`/categories/${primaryCategory.slug}`}
                        className="font-black text-right text-foreground hover:underline"
                      >
                        {primaryCategory.name}
                      </Link>
                    </div>
                  ) : null}
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">Pricing</span>
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] font-black text-foreground">
                      {tool.pricingModel}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-muted-foreground">For Sale</span>
                    <span className="font-black">No</span>
                  </div>
                </div>
              </div>

              {tool.toolTags.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="px-1 text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
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
              ) : null}

              <ToolRelatedProducts relatedTools={relatedTools} />

              <div className="lg:hidden">{morePathsSection}</div>
            </aside>
          </div>
        </section>
        <Footer />
      </main>
    </ViewerVoteStateProvider>
  );
}
