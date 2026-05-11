"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import {
  type OutboundLinkContext,
  type OutboundLinkSurface,
  isTrackableOutboundHttpUrl,
  withShipboostUtm,
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
  const resolvedLinkText =
    linkText ?? (typeof children === "string" ? children : undefined);
  // Bake UTMs into the href so middle-click / right-click / hover preview all
  // expose the tracked URL — not just when our onClick handler fires.
  const trackedHref = withShipboostUtm(href, {
    surface: sourceSurface,
    content: resolvedLinkText,
  });

  return (
    <a
      {...props}
      href={trackedHref}
      data-shipboost-outbound-source={sourceSurface}
      data-shipboost-outbound-context={linkContext}
      data-shipboost-outbound-text={resolvedLinkText}
      data-shipboost-outbound-manual="true"
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || typeof window === "undefined") {
          return;
        }

        if (
          !isTrackableOutboundHttpUrl({
            href: trackedHref,
            siteOrigin: window.location.origin,
          })
        ) {
          return;
        }

        captureBrowserOutboundLinkClicked({
          href: trackedHref,
          sourcePath: `${window.location.pathname}${window.location.search}`,
          sourceSurface,
          linkContext,
          linkText: resolvedLinkText,
          trackingMethod: "browser",
          isToolLink: false,
        });
      }}
    >
      {children}
    </a>
  );
}
