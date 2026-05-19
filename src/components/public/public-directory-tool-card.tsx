"use client";

import Link from "next/link";

import { PostHogImpressionTracker } from "@/components/analytics/posthog-impression-tracker";
import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { PremiumLaunchIndicator } from "@/components/public/premium-launch-indicator";
import { LogoFallback } from "@/components/ui/logo-fallback";
import { buildToolOutboundHref } from "@/lib/tool-outbound";
import { cn } from "@/lib/utils";

type PublicDirectoryToolCardProps = {
  toolId: string;
  name: string;
  tagline: string;
  logoUrl?: string | null;
  websiteUrl?: string | null;
  affiliateUrl?: string | null;
  slug: string;
  rank?: number;
  votes: number;
  tags?: string[];
  linkedTags?: Array<{
    name: string;
    slug: string;
  }>;
  primaryCategory?: {
    name: string;
    slug: string;
  } | null;
  imagePriority?: boolean;
  isPremiumLaunch?: boolean;
  sourceSurface?: "launch_board" | "category_page" | "best_tag_page" | "alternatives_page";
};

export function PublicDirectoryToolCard({
  toolId,
  name,
  tagline,
  logoUrl,
  websiteUrl,
  affiliateUrl,
  slug,
  rank,
  votes,
  tags = [],
  linkedTags = [],
  primaryCategory = null,
  imagePriority = false,
  isPremiumLaunch = false,
  sourceSurface,
}: PublicDirectoryToolCardProps) {
  const visibleLinkedTags = linkedTags.slice(0, 3);
  const fallbackTags =
    visibleLinkedTags.length === 0 ? tags.slice(0, 3) : [];

  const rankBadge = rank
    ? rank === 1
      ? { label: "🥇", isMedal: true }
      : rank === 2
        ? { label: "🥈", isMedal: true }
        : rank === 3
          ? { label: "🥉", isMedal: true }
          : { label: `#${rank}`, isMedal: false }
    : null;

  const externalHref = buildToolOutboundHref({
    websiteUrl,
    affiliateUrl,
    source: "launch_board",
    toolSlug: slug,
  });

  return (
    <article
      className={cn(
        "group relative flex items-center gap-3 md:gap-4 px-4 sm:px-5 py-4 border-b border-border/60 transition-colors duration-200 hover:bg-muted cursor-pointer min-w-0 overflow-hidden",
      )}
    >
      <PostHogImpressionTracker
        eventName="product_card_impression"
        impressionId={`product_card:${toolId}:${rank ?? "unranked"}`}
        properties={{
          placement_type: "product_card",
          tool_id: toolId,
          tool_slug: slug,
          tool_name: name,
          source_surface: sourceSurface,
          position: rank,
          is_featured: isPremiumLaunch,
          current_launch_type: isPremiumLaunch ? "FEATURED" : undefined,
        }}
      />
      {/* Full-card overlay link → tool detail page (clicked when no inner interactive element catches the click) */}
      <Link
        href={`/tools/${slug}`}
        aria-label={`View ${name} details`}
        className="absolute inset-0 z-[1]"
      />

      {/* Premium decoration: shimmer-only (no static tint) */}
      {isPremiumLaunch ? (
        <div
          aria-hidden
          className="absolute inset-0 z-[2] overflow-hidden pointer-events-none"
        >
          <div
            className="premium-shimmer-track absolute top-0 left-0 h-full w-[60%]"
            style={{
              background:
                "linear-gradient(115deg, rgba(255,255,255,0) 0%, rgba(255,215,0,0.10) 35%, rgba(255,196,40,0.28) 50%, rgba(255,215,0,0.10) 65%, rgba(255,255,255,0) 100%)",
            }}
          />
        </div>
      ) : null}

      {/*
        Content layer:
          - position: relative + z-[3] sits above the overlay link
          - pointer-events-none on the wrapper lets clicks fall through to the underlying overlay link
          - explicit interactive children re-enable pointer-events-auto so they capture their own clicks
      */}
      <div className="pointer-events-none relative z-[3] flex flex-1 items-center gap-3 md:gap-4 min-w-0">
        {rankBadge ? (
          <div
            className={cn(
              "shrink-0 flex items-center justify-center select-none",
              rankBadge.isMedal
                ? "w-7 text-2xl leading-none"
                : "w-7 text-sm font-semibold text-muted-foreground/70",
            )}
            aria-hidden
          >
            {rankBadge.label}
          </div>
        ) : null}

        <div className="shrink-0">
          <LogoFallback
            name={name}
            src={logoUrl}
            websiteUrl={websiteUrl}
            sizes="56px"
            priority={imagePriority}
            className="h-14 w-14 rounded-lg border border-border/60"
            textClassName="text-lg"
          />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {externalHref ? (
              <a
                href={externalHref}
                target="_blank"
                rel="noreferrer sponsored"
                onClick={(event) => event.stopPropagation()}
                data-shipboost-outbound-source="launch_board"
                data-shipboost-outbound-context="tool_listing"
                data-shipboost-outbound-text={name}
                data-shipboost-tool-id={toolId}
                data-shipboost-tool-slug={slug}
                data-shipboost-tool-name={name}
                data-shipboost-tool-destination-type={
                  affiliateUrl ? "affiliate" : "website"
                }
                className="pointer-events-auto truncate text-lg font-bold tracking-tight text-foreground transition-colors hover:text-foreground/70 hover:underline underline-offset-4"
              >
                {name}
              </a>
            ) : (
              <span className="truncate text-lg font-bold tracking-tight text-foreground">
                {name}
              </span>
            )}
            <span className="pointer-events-auto">
              {isPremiumLaunch ? <PremiumLaunchIndicator /> : null}
            </span>
          </div>

          <p className="line-clamp-1 text-sm font-normal leading-snug text-muted-foreground">
            {tagline}
          </p>

          {primaryCategory || visibleLinkedTags.length > 0 || fallbackTags.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-muted-foreground/70">
              {primaryCategory ? (
                <Link
                  href={`/categories/${primaryCategory.slug}`}
                  onClick={(event) => event.stopPropagation()}
                  className="pointer-events-auto transition-colors hover:text-foreground"
                >
                  {primaryCategory.name}
                </Link>
              ) : null}
              {visibleLinkedTags.map((tag, idx) => (
                <span key={tag.slug} className="flex items-center gap-x-1.5">
                  {(primaryCategory || idx > 0) ? <span aria-hidden className="text-muted-foreground/40">·</span> : null}
                  <Link
                    href={`/tags/${tag.slug}`}
                    onClick={(event) => event.stopPropagation()}
                    className="pointer-events-auto transition-colors hover:text-foreground"
                  >
                    #{tag.name}
                  </Link>
                </span>
              ))}
              {fallbackTags.map((tag, idx) => (
                <span key={tag} className="flex items-center gap-x-1.5">
                  {(primaryCategory || idx > 0) ? <span aria-hidden className="text-muted-foreground/40">·</span> : null}
                  <span>#{tag}</span>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pointer-events-auto shrink-0 self-center">
          <ToolUpvoteButton toolId={toolId} initialCount={votes} variant="card" />
        </div>
      </div>
    </article>
  );
}
