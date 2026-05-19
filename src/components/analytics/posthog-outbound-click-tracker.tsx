"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import {
  captureBrowserOutboundLinkClicked,
  captureBrowserToolOutboundClick,
} from "@/lib/posthog-browser";
import {
  type OutboundLinkContext,
  type OutboundLinkSurface,
  type SponsorAdSlot,
  isTrackableOutboundHttpUrl,
} from "@/lib/outbound-link";
import { isPrivateRoutePathname } from "@/lib/route-groups";

function inferOutboundMetadata(pathname: string): {
  sourceSurface: OutboundLinkSurface;
  linkContext: OutboundLinkContext;
} {
  if (pathname === "/pricing" || pathname.startsWith("/pricing/")) {
    return { sourceSurface: "pricing_page", linkContext: "pricing" };
  }

  if (
    pathname === "/resources/startup-directories" ||
    pathname.startsWith("/resources/startup-directories/")
  ) {
    return {
      sourceSurface: "startup_directories",
      linkContext: "startup_directories",
    };
  }

  if (pathname === "/about" || pathname.startsWith("/about/")) {
    return { sourceSurface: "about_page", linkContext: "about" };
  }

  if (pathname === "/blog" || pathname.startsWith("/blog/")) {
    return { sourceSurface: "blog_content", linkContext: "blog" };
  }

  if (pathname.startsWith("/tools/")) {
    return { sourceSurface: "tool_page", linkContext: "tool_page" };
  }

  if (pathname.startsWith("/launches/")) {
    return { sourceSurface: "launch_board", linkContext: "tool_listing" };
  }

  if (pathname.startsWith("/categories/") || pathname === "/categories") {
    return { sourceSurface: "category_page", linkContext: "tool_listing" };
  }

  if (pathname.startsWith("/best/") || pathname === "/best") {
    return { sourceSurface: "best_tag_page", linkContext: "tool_listing" };
  }

  if (pathname.startsWith("/alternatives/") || pathname === "/alternatives") {
    return { sourceSurface: "alternatives_page", linkContext: "tool_listing" };
  }

  return { sourceSurface: "public_page", linkContext: "public_page" };
}

function getAnchorLinkText(anchor: HTMLAnchorElement) {
  return (
    anchor.dataset.shipboostOutboundText?.trim() ||
    anchor.getAttribute("aria-label")?.trim() ||
    anchor.textContent?.trim() ||
    undefined
  );
}

function getToolOutboundMetadata(anchor: HTMLAnchorElement) {
  const toolId = anchor.dataset.shipboostToolId?.trim();

  if (!toolId) {
    return null;
  }

  return {
    toolId,
    toolSlug: anchor.dataset.shipboostToolSlug?.trim() || undefined,
    toolName: anchor.dataset.shipboostToolName?.trim() || undefined,
    destinationType:
      anchor.dataset.shipboostToolDestinationType?.trim() || "website",
    currentLaunchType:
      anchor.dataset.shipboostToolCurrentLaunchType?.trim() || undefined,
    isFeatured: anchor.dataset.shipboostToolIsFeatured === "true",
  };
}

function recordToolOutboundStreakActivity(toolId: string) {
  fetch("/api/streaks/outbound-click", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ toolId }),
    keepalive: true,
  }).catch(() => {
    // Best-effort activity recording; analytics clicks should never block navigation.
  });
}

export function PostHogOutboundClickTracker({ apiKey }: { apiKey?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (isPrivateRoutePathname(pathname)) {
      return;
    }

    function handleClick(event: MouseEvent) {
      if (event.defaultPrevented || typeof window === "undefined") {
        return;
      }

      const target = event.target;

      if (!(target instanceof Element)) {
        return;
      }

      const anchor = target.closest("a[href]");

      if (!(anchor instanceof HTMLAnchorElement)) {
        return;
      }

      if (anchor.dataset.shipboostOutboundManual === "true") {
        return;
      }

      if (
        !isTrackableOutboundHttpUrl({
          href: anchor.href,
          siteOrigin: window.location.origin,
        })
      ) {
        return;
      }

      const metadata = inferOutboundMetadata(window.location.pathname);
      const toolMetadata = getToolOutboundMetadata(anchor);
      const sourceSurface =
        (anchor.dataset
          .shipboostOutboundSource as OutboundLinkSurface | undefined) ??
        metadata.sourceSurface;
      const linkContext =
        (anchor.dataset
          .shipboostOutboundContext as OutboundLinkContext | undefined) ??
        metadata.linkContext;
      const sponsorSlot =
        (anchor.dataset.shipboostSponsorSlot as SponsorAdSlot | undefined) ??
        undefined;
      const sourcePath = `${window.location.pathname}${window.location.search}`;
      const linkText = getAnchorLinkText(anchor);

      if (apiKey) {
        captureBrowserOutboundLinkClicked({
          href: anchor.href,
          sourcePath,
          sourceSurface,
          linkContext,
          linkText,
          trackingMethod: "browser",
          isToolLink: Boolean(toolMetadata),
          toolId: toolMetadata?.toolId,
          toolSlug: toolMetadata?.toolSlug,
          toolName: toolMetadata?.toolName,
          sponsorSlot,
        });
      }

      if (toolMetadata && apiKey) {
        captureBrowserToolOutboundClick({
          href: anchor.href,
          sourcePath,
          sourceSurface,
          sponsorSlot,
          ...toolMetadata,
        });
      }

      if (toolMetadata) {
        recordToolOutboundStreakActivity(toolMetadata.toolId);
      }
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [apiKey, pathname]);

  return null;
}
