"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

import { captureBrowserOutboundLinkClicked } from "@/lib/posthog-browser";
import {
  type OutboundLinkContext,
  type OutboundLinkSurface,
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

export function PostHogOutboundClickTracker({ apiKey }: { apiKey?: string }) {
  const pathname = usePathname();

  useEffect(() => {
    if (!apiKey || isPrivateRoutePathname(pathname)) {
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

      captureBrowserOutboundLinkClicked({
        href: anchor.href,
        sourcePath: `${window.location.pathname}${window.location.search}`,
        sourceSurface:
          (anchor.dataset
            .shipboostOutboundSource as OutboundLinkSurface | undefined) ??
          metadata.sourceSurface,
        linkContext:
          (anchor.dataset
            .shipboostOutboundContext as OutboundLinkContext | undefined) ??
          metadata.linkContext,
        linkText: getAnchorLinkText(anchor),
        trackingMethod: "browser",
        isToolLink: false,
      });
    }

    document.addEventListener("click", handleClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [apiKey, pathname]);

  return null;
}
