"use client";

import { ArrowUpRight, ExternalLink, Megaphone } from "lucide-react";

import { PostHogImpressionTracker } from "@/components/analytics/posthog-impression-tracker";
import { LogoFallback } from "@/components/ui/logo-fallback";
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

function RealProductAd({ placement }: { placement: InlinePlacement }) {
  const href =
    buildToolOutboundHref({
      websiteUrl: placement.tool.websiteUrl,
      affiliateUrl: placement.tool.affiliateUrl,
      source: "sponsor_slot",
      toolSlug: placement.tool.slug,
    }) ?? placement.tool.websiteUrl;

  return (
    <div className="flex w-full items-center gap-3 md:gap-4 px-4 sm:px-5 py-4 min-w-0">
      {/* SPONSORED pill — opens advertise modal */}
      <SponsorAdvertiseModal
        slot="INLINE_PRODUCT"
        triggerClassName="shrink-0 flex w-7 items-center justify-center select-none"
        triggerContent={
          <span className="rotate-[-90deg] origin-center whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.16em] text-primary/70 hover:text-primary transition-colors">
            Sponsored
          </span>
        }
      />

      <a
        href={href}
        target="_blank"
        rel="noreferrer sponsored"
        data-shipboost-outbound-source="sponsor_slot"
        data-shipboost-outbound-context="inline_product"
        data-shipboost-tool-id={placement.tool.id}
        data-shipboost-tool-slug={placement.tool.slug}
        className="group flex flex-1 items-center gap-3 md:gap-4 min-w-0 transition-colors hover:bg-muted/50 -mx-4 sm:-mx-5 px-4 sm:px-5 -my-4 py-4 rounded-none"
      >
        <PostHogImpressionTracker
          eventName="sponsor_impression"
          impressionId={`inline_product:${placement.id}`}
          properties={{
            placement_type: "inline_product",
            placement_id: placement.id,
            tool_id: placement.tool.id,
            tool_slug: placement.tool.slug,
            tool_name: placement.tool.name,
            source_surface: "sponsor_slot",
          }}
        />
        <LogoFallback
          name={placement.tool.name}
          src={placement.tool.logoMedia?.url}
          websiteUrl={placement.tool.websiteUrl}
          sizes="56px"
          className="h-14 w-14 shrink-0 rounded-lg border border-border/60"
          textClassName="text-sm"
        />

        <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 py-0.5">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-lg font-bold tracking-tight text-foreground">
              {placement.tool.name}
            </span>
          </div>
          <p className="line-clamp-1 text-sm font-normal leading-snug text-muted-foreground">
            {placement.tool.tagline}
          </p>
        </div>

        <div className="shrink-0 self-center inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-foreground transition-colors group-hover:border-foreground/30">
          Visit
          <ExternalLink size={11} />
        </div>
      </a>
    </div>
  );
}

export function InlineProductAd({
  placement,
}: {
  placement: InlinePlacement | null;
}) {
  return (
    <article className="group relative border-b border-border/60 bg-background overflow-hidden">
      {placement ? (
        <RealProductAd placement={placement} />
      ) : (
        <SponsorAdvertiseModal
          slot="INLINE_PRODUCT"
          triggerClassName="group flex w-full items-center gap-3 md:gap-4 px-4 sm:px-5 py-4 text-left cursor-pointer transition-colors hover:bg-muted/50 min-w-0"
          triggerContent={
            <>
              <div className="shrink-0 flex w-7 items-center justify-center select-none">
                <span className="rotate-[-90deg] origin-center whitespace-nowrap text-[8px] font-semibold uppercase tracking-[0.16em] text-primary/70">
                  Sponsored
                </span>
              </div>
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-border/70 bg-primary/5 text-primary">
                <Megaphone size={20} />
              </div>
              <div className="min-w-0 flex-1 flex flex-col justify-center gap-1 py-0.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="truncate text-lg font-bold tracking-tight text-foreground">
                    Your product here
                  </span>
                </div>
                <p className="line-clamp-1 text-sm font-normal leading-snug text-muted-foreground">
                  Get featured in the launchboard feed — native placement that
                  founders actually read.
                </p>
                <div className="flex flex-wrap items-center gap-x-1.5 text-[11px] font-medium text-muted-foreground/70">
                  <span>Book this slot</span>
                  <span aria-hidden className="text-muted-foreground/40">
                    ·
                  </span>
                  <span>30 days</span>
                </div>
              </div>
              <div className="shrink-0 self-center inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-[11px] font-semibold tracking-tight text-foreground transition-colors group-hover:border-foreground/30">
                Promote
                <ArrowUpRight size={11} />
              </div>
            </>
          }
        />
      )}
    </article>
  );
}
