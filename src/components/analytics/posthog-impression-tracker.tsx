"use client";

import { useEffect, useMemo, useRef } from "react";
import { usePathname } from "next/navigation";

import { captureBrowserPostHogEvent } from "@/lib/posthog-browser";
import type { OutboundLinkSurface } from "@/lib/outbound-link";
import { isPrivateRoutePathname } from "@/lib/route-groups";

const VIEWABLE_THRESHOLD = 0.5;
const VIEWABLE_DURATION_MS = 1000;

const trackedImpressions = new Set<string>();
const observedImpressions = new Map<Element, ObservedImpression>();
let sharedObserver: IntersectionObserver | null = null;

type ImpressionEventName = "product_card_impression" | "sponsor_impression";

type ImpressionProperties = {
  placement_type:
    | "product_card"
    | "sidebar_sponsor"
    | "inline_banner"
    | "inline_product";
  placement_id?: string;
  tool_id: string;
  tool_slug: string;
  tool_name: string;
  source_surface?: OutboundLinkSurface;
  position?: number;
  is_featured?: boolean;
  current_launch_type?: string;
};

type ObservedImpression = {
  eventName: ImpressionEventName;
  impressionKey: string;
  pathname: string;
  properties: ImpressionProperties;
  sourceSurface: OutboundLinkSurface;
  timer: ReturnType<typeof setTimeout> | null;
  latestRatio: number;
};

function clearViewTimer(impression: ObservedImpression) {
  if (impression.timer) {
    clearTimeout(impression.timer);
    impression.timer = null;
  }
}

function unobserveTarget(target: Element) {
  const impression = observedImpressions.get(target);

  if (impression) {
    clearViewTimer(impression);
  }

  observedImpressions.delete(target);
  sharedObserver?.unobserve(target);

  if (observedImpressions.size === 0) {
    sharedObserver?.disconnect();
    sharedObserver = null;
  }
}

function getSharedObserver() {
  if (sharedObserver) {
    return sharedObserver;
  }

  sharedObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const impression = observedImpressions.get(entry.target);

        if (!impression || trackedImpressions.has(impression.impressionKey)) {
          unobserveTarget(entry.target);
          return;
        }

        impression.latestRatio = entry.intersectionRatio;

        if (entry.isIntersecting && entry.intersectionRatio >= VIEWABLE_THRESHOLD) {
          if (impression.timer) {
            return;
          }

          impression.timer = setTimeout(() => {
            trackedImpressions.add(impression.impressionKey);
            captureBrowserPostHogEvent(impression.eventName, {
              ...impression.properties,
              source_surface: impression.sourceSurface,
              route: impression.pathname,
              visible_ratio: Math.round(impression.latestRatio * 100) / 100,
              viewable_threshold: VIEWABLE_THRESHOLD,
              viewable_duration_ms: VIEWABLE_DURATION_MS,
            });
            unobserveTarget(entry.target);
          }, VIEWABLE_DURATION_MS);
          return;
        }

        clearViewTimer(impression);
      });
    },
    { threshold: [0, VIEWABLE_THRESHOLD, 1] },
  );

  return sharedObserver;
}

function inferSourceSurface(pathname: string): OutboundLinkSurface {
  if (pathname.startsWith("/launches/")) {
    return "launch_board";
  }

  if (pathname.startsWith("/categories/") || pathname === "/categories") {
    return "category_page";
  }

  if (pathname.startsWith("/best/") || pathname === "/best") {
    return "best_tag_page";
  }

  if (pathname.startsWith("/alternatives/") || pathname === "/alternatives") {
    return "alternatives_page";
  }

  if (pathname.startsWith("/tools/")) {
    return "tool_page";
  }

  return "public_page";
}

export function PostHogImpressionTracker({
  eventName,
  impressionId,
  properties,
}: {
  eventName: ImpressionEventName;
  impressionId: string;
  properties: ImpressionProperties;
}) {
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const pathname = usePathname();
  const sourceSurface = properties.source_surface ?? inferSourceSurface(pathname);

  const impressionKey = useMemo(
    () => `${eventName}:${pathname}:${sourceSurface}:${impressionId}`,
    [eventName, impressionId, pathname, sourceSurface],
  );

  useEffect(() => {
    if (isPrivateRoutePathname(pathname) || trackedImpressions.has(impressionKey)) {
      return;
    }

    const target = markerRef.current?.parentElement;

    if (!target || typeof IntersectionObserver === "undefined") {
      return;
    }

    observedImpressions.set(target, {
      eventName,
      impressionKey,
      pathname,
      properties,
      sourceSurface,
      timer: null,
      latestRatio: 0,
    });

    getSharedObserver().observe(target);

    return () => {
      unobserveTarget(target);
    };
  }, [eventName, impressionKey, pathname, properties, sourceSurface]);

  return <span ref={markerRef} aria-hidden="true" className="hidden" />;
}
