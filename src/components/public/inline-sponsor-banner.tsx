"use client";

import Image from "next/image";

import { PostHogImpressionTracker } from "@/components/analytics/posthog-impression-tracker";
import { SponsorAdvertiseModal } from "@/components/public/sponsor-advertise-modal";
import { buildToolOutboundHref } from "@/lib/tool-outbound";

type InlinePlacement = {
  id: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    affiliateUrl: string | null;
    logoMedia: { url: string } | null;
  };
};

const HouseAdContent = () => (
  <div className="relative flex items-center gap-3 md:grid md:grid-cols-[auto_1.5fr_auto] md:gap-4">
    <div className="hidden md:flex items-center justify-center w-16">
      <span className="text-xs font-bold text-muted-foreground tracking-wider transform -rotate-90 whitespace-nowrap opacity-60">
        SPONSORED
      </span>
    </div>
    <div className="min-w-0 flex-1 space-y-1 md:space-y-1.5 lg:space-y-2">
      <div className="relative">
        <h3 className="font-heading text-base md:text-xl lg:text-2xl xl:text-[26px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
          Promote your product &amp;
          <br />
          Reach thousands of users
        </h3>
      </div>
      <div className="flex items-center gap-1.5 md:gap-2.5 pt-1 md:pt-1.5 lg:pt-2">
        <div className="h-px w-6 md:w-7 bg-foreground" />
        <span className="text-[9px] md:text-[10px] text-muted-foreground tracking-wider uppercase whitespace-nowrap">
          Book this spot for 30 days
        </span>
      </div>
    </div>
    <div className="relative shrink-0">
      <div className="relative h-12 w-12 xs:h-14 xs:w-14 md:h-20 md:w-20 lg:h-24 lg:w-24">
        <div className="relative w-full h-full rounded-xl overflow-hidden bg-muted/30">
          <Image
            src="/logos/logo-black.png"
            alt=""
            fill
            sizes="96px"
            className="object-contain dark:hidden"
            priority={false}
          />
          <Image
            src="/logos/logo-white.png"
            alt=""
            fill
            sizes="96px"
            className="object-contain hidden dark:block"
            priority={false}
          />
        </div>
      </div>
    </div>
  </div>
);

function RealBannerContent({ placement }: { placement: InlinePlacement }) {
  const href =
    buildToolOutboundHref({
      websiteUrl: placement.tool.websiteUrl,
      affiliateUrl: placement.tool.affiliateUrl,
      source: "sponsor_slot",
      toolSlug: placement.tool.slug,
    }) ?? placement.tool.websiteUrl;

  return (
    <div className="relative flex w-full items-center gap-3 md:gap-4">
      <div className="hidden md:flex items-center justify-center w-16 shrink-0">
        <SponsorAdvertiseModal
          slot="INLINE_BANNER"
          triggerClassName="flex items-center justify-center"
          triggerContent={
            <span className="text-xs font-bold text-muted-foreground tracking-wider transform -rotate-90 whitespace-nowrap opacity-60 hover:opacity-100 transition-opacity">
              SPONSORED
            </span>
          }
        />
      </div>
      <a
        href={href}
        target="_blank"
        rel="noreferrer sponsored"
        data-shipboost-outbound-source="sponsor_slot"
        data-shipboost-outbound-context="inline_banner"
        data-shipboost-sponsor-slot="INLINE_BANNER"
        data-shipboost-tool-id={placement.tool.id}
        data-shipboost-tool-slug={placement.tool.slug}
        className="flex flex-1 items-center gap-3 md:gap-4 min-w-0"
      >
        <PostHogImpressionTracker
          eventName="sponsor_impression"
          impressionId={`inline_banner:${placement.id}`}
          properties={{
            placement_type: "inline_banner",
            placement_id: placement.id,
            tool_id: placement.tool.id,
            tool_slug: placement.tool.slug,
            tool_name: placement.tool.name,
            source_surface: "sponsor_slot",
          }}
        />
        <div className="min-w-0 flex-1 space-y-1 md:space-y-1.5 lg:space-y-2">
          <h3 className="font-heading text-base md:text-xl lg:text-2xl xl:text-[26px] font-bold leading-[1.15] tracking-tight text-foreground break-words">
            {placement.tool.name}
          </h3>
          <p className="text-sm font-normal text-muted-foreground line-clamp-2">
            {placement.tool.tagline}
          </p>
          <div className="flex items-center gap-1.5 md:gap-2.5 pt-1">
            <div className="h-px w-6 md:w-7 bg-foreground" />
            <span className="text-[9px] md:text-[10px] text-muted-foreground tracking-wider uppercase whitespace-nowrap">
              Visit site
            </span>
          </div>
        </div>
        <div className="relative shrink-0">
          <div className="relative h-12 w-12 xs:h-14 xs:w-14 md:h-20 md:w-20 lg:h-24 lg:w-24">
            {placement.tool.logoMedia ? (
              <Image
                src={placement.tool.logoMedia.url}
                alt={placement.tool.name}
                fill
                sizes="96px"
                className="rounded-xl object-contain"
                priority={false}
              />
            ) : (
              <div className="w-full h-full rounded-xl bg-muted/30" />
            )}
          </div>
        </div>
      </a>
    </div>
  );
}

export function InlineSponsorBanner({
  placement,
}: {
  placement: InlinePlacement | null;
}) {
  return (
    <article className="relative cursor-pointer overflow-hidden border-b border-border bg-background group hover:bg-muted/50 transition-colors px-3 sm:px-4 md:px-6 py-7 sm:py-9 md:py-11">
      {/* Decorative layer 1: animated ADVERTISE marquee */}
      <div
        aria-hidden
        className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-0 right-0 overflow-hidden opacity-[0.04] dark:opacity-[0.14] pointer-events-none"
      >
        <div className="banner-marquee-track flex items-center whitespace-nowrap text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
          {Array.from({ length: 2 }).map((_, dup) => (
            <div key={dup} className="flex items-center">
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className="flex items-center">
                  <span>{placement ? "SPONSORED" : "ADVERTISE"}</span>
                  <span className="mx-6">•</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Decorative layer 2: vertical SPONSORED column */}
      <div
        aria-hidden
        className="hidden md:block absolute -left-12 top-0 bottom-0 w-16 overflow-hidden opacity-[0.08] dark:opacity-[0.18] pointer-events-none"
      >
        <div className="flex flex-col items-center text-lg sm:text-xl md:text-2xl font-bold tracking-tight">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="contents">
              <span className="transform -rotate-90 whitespace-nowrap text-muted-foreground">
                SPONSORED
              </span>
              <div className="h-8" />
            </div>
          ))}
        </div>
      </div>

      {placement ? (
        <RealBannerContent placement={placement} />
      ) : (
        <SponsorAdvertiseModal
          slot="INLINE_BANNER"
          triggerClassName="relative block w-full text-left"
          triggerContent={<HouseAdContent />}
        />
      )}
    </article>
  );
}
