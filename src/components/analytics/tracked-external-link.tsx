"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import {
  type OutboundLinkContext,
  type OutboundLinkSurface,
  isTrackableOutboundHttpUrl,
} from "@/lib/outbound-link";
import { captureBrowserOutboundLinkClicked } from "@/lib/posthog-browser";

type TrackedExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  sourceSurface: OutboundLinkSurface;
  linkContext: OutboundLinkContext;
  linkText?: string;
};

export function TrackedExternalLink({
  children,
  href,
  sourceSurface,
  linkContext,
  linkText,
  onClick,
  ...props
}: TrackedExternalLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || typeof window === "undefined") {
          return;
        }

        if (
          !isTrackableOutboundHttpUrl({
            href,
            siteOrigin: window.location.origin,
          })
        ) {
          return;
        }

        captureBrowserOutboundLinkClicked({
          href,
          sourcePath: `${window.location.pathname}${window.location.search}`,
          sourceSurface,
          linkContext,
          linkText:
            linkText ?? (typeof children === "string" ? children : undefined),
          trackingMethod: "browser",
          isToolLink: false,
        });
      }}
    >
      {children}
    </a>
  );
}
