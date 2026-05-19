"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, Megaphone } from "lucide-react";

import { PostHogImpressionTracker } from "@/components/analytics/posthog-impression-tracker";
import { LogoFallback } from "@/components/ui/logo-fallback";
import { SponsorAdvertiseModal } from "@/components/public/sponsor-advertise-modal";
import { buildToolOutboundHref } from "@/lib/tool-outbound";
import { cn } from "@/lib/utils";

type SponsorPlacement = {
  id: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    affiliateUrl: string | null;
    logoMedia: { url: string } | null;
    toolCategories: Array<{
      category: { name: string; slug: string };
    }>;
  };
};

const ROTATION_INTERVAL_MS = 6000;
const FADE_DURATION_MS = 400;

function EmptySponsorSlot() {
  return (
    <Suspense fallback={<SponsorAdvertiseFallback variant="empty" />}>
      <SponsorAdvertiseModal
        slot="SIDEBAR"
        triggerClassName="group block w-full text-left rounded-xl border border-dashed border-border/70 bg-card/70 p-4 transition-colors hover:border-primary/40 hover:bg-card"
        triggerContent={
          <>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
              Sponsored
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone size={18} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-foreground">
                  Advertise here
                </p>
                <p className="mt-0.5 text-[11px] font-normal leading-relaxed text-muted-foreground">
                  Reach thousands of founders
                </p>
              </div>
            </div>
            <div className="mt-3 rounded-lg bg-primary py-2 text-center text-[12px] font-semibold tracking-tight text-primary-foreground transition-opacity group-hover:opacity-90">
              Book this spot
            </div>
          </>
        }
      />
    </Suspense>
  );
}

function SponsorAdvertiseFallback({ variant }: { variant: "empty" | "link" }) {
  if (variant === "link") {
    return (
      <div className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[10px] font-semibold tracking-tight text-muted-foreground">
        <Megaphone size={11} className="opacity-70" />
        Advertise here
        <span aria-hidden>→</span>
      </div>
    );
  }

  return (
    <div className="block w-full rounded-xl border border-dashed border-border/70 bg-card/70 p-4 text-left">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
        Sponsored
      </p>
      <div className="mt-3 flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Megaphone size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold tracking-tight text-foreground">
            Advertise here
          </p>
          <p className="mt-0.5 text-[11px] font-normal leading-relaxed text-muted-foreground">
            Reach thousands of founders
          </p>
        </div>
      </div>
      <div className="mt-3 rounded-lg bg-primary py-2 text-center text-[12px] font-semibold tracking-tight text-primary-foreground">
        Book this spot
      </div>
    </div>
  );
}

function SponsorCard({ placement }: { placement: SponsorPlacement }) {
  const outboundHref =
    buildToolOutboundHref({
      websiteUrl: placement.tool.websiteUrl,
      affiliateUrl: placement.tool.affiliateUrl,
      source: "sponsor_slot",
      toolSlug: placement.tool.slug,
    }) ?? placement.tool.websiteUrl;

  return (
    <div className="group block w-full rounded-xl border border-border/60 bg-card transition-colors hover:bg-muted/40">
      {/* SPONSORED label opens the advertise modal */}
      <SponsorAdvertiseModal
        slot="SIDEBAR"
        triggerClassName="block w-full px-4 pt-4 pb-0 text-left"
        triggerContent={
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70 hover:text-muted-foreground transition-colors">
            Sponsored
          </p>
        }
      />

      {/* Tool content links to the tool website */}
      <a
        href={outboundHref}
        target="_blank"
        rel="noreferrer sponsored"
        data-shipboost-outbound-source="sponsor_slot"
        data-shipboost-outbound-context="tool_listing"
        data-shipboost-outbound-text={placement.tool.name}
        data-shipboost-tool-id={placement.tool.id}
        data-shipboost-tool-slug={placement.tool.slug}
        data-shipboost-tool-name={placement.tool.name}
        data-shipboost-tool-destination-type={
          placement.tool.affiliateUrl ? "affiliate" : "website"
        }
        className="block px-4 pb-4"
      >
        <PostHogImpressionTracker
          eventName="sponsor_impression"
          impressionId={`sidebar_sponsor:${placement.id}`}
          properties={{
            placement_type: "sidebar_sponsor",
            placement_id: placement.id,
            tool_id: placement.tool.id,
            tool_slug: placement.tool.slug,
            tool_name: placement.tool.name,
            source_surface: "sponsor_slot",
          }}
        />
        <div className="mt-3 flex items-center gap-3">
          <LogoFallback
            name={placement.tool.name}
            src={placement.tool.logoMedia?.url}
            websiteUrl={placement.tool.websiteUrl}
            sizes="44px"
            className="h-11 w-11 shrink-0 rounded-lg border border-border/60"
            textClassName="text-sm"
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="line-clamp-1 text-sm font-bold tracking-tight text-foreground">
                {placement.tool.name}
              </h3>
              <ExternalLink
                size={13}
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              />
            </div>
            <p className="mt-0.5 line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground">
              {placement.tool.tagline}
            </p>
          </div>
        </div>
      </a>
    </div>
  );
}

export function SidebarSponsorPlacements({
  placements,
}: {
  placements: SponsorPlacement[];
}) {
  const slots = useMemo(
    () => (placements.length > 0 ? placements : [null]),
    [placements],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (slots.length <= 1 || isHovered) {
      return;
    }

    const interval = setInterval(() => {
      setIsFading(true);
      const fadeTimer = setTimeout(() => {
        setActiveIndex((index) => (index + 1) % slots.length);
        setIsFading(false);
      }, FADE_DURATION_MS);

      return () => clearTimeout(fadeTimer);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [slots.length, isHovered]);

  const current = slots[activeIndex];

  return (
    <div
      className="relative w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
          Our partners
        </p>
        <Link
          href="/pricing#advertise"
          className="group inline-flex items-center gap-1 rounded-full border border-border/60 bg-card px-2.5 py-1 text-[10px] font-semibold tracking-tight text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
        >
          <Megaphone size={11} className="opacity-70 group-hover:opacity-100" />
          Advertise here
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>

      <div
        className={cn(
          "transition-opacity",
          isFading ? "opacity-0" : "opacity-100",
        )}
        style={{ transitionDuration: `${FADE_DURATION_MS}ms` }}
      >
        {current ? <SponsorCard placement={current} /> : <EmptySponsorSlot />}
      </div>

      {slots.length > 1 ? (
        <div
          className="mt-2 flex items-center justify-center gap-1"
          aria-label="Sponsor slot indicator"
        >
          {slots.map((_, index) => (
            <span
              key={index}
              aria-hidden
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                index === activeIndex
                  ? "w-4 bg-foreground/70"
                  : "w-1 bg-muted-foreground/30",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
