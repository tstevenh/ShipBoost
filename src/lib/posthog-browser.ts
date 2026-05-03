"use client";

import posthog from "posthog-js";

import {
  buildOutboundLinkClickedProperties,
  type OutboundLinkClickedPropertiesInput,
} from "@/lib/outbound-link";

export function captureBrowserPostHogEvent(
  event: string,
  properties?: Record<string, unknown>,
) {
  posthog.capture(event, properties);
}

export function captureBrowserOutboundLinkClicked(
  input: OutboundLinkClickedPropertiesInput,
) {
  posthog.capture(
    "outbound_link_clicked",
    buildOutboundLinkClickedProperties(input),
  );
}

export function captureBrowserToolOutboundClick(input: {
  href: string;
  sourcePath: string;
  sourceSurface: string;
  destinationType: string;
  toolId: string;
  toolSlug?: string;
  toolName?: string;
  currentLaunchType?: string;
  isFeatured?: boolean;
}) {
  let destinationDomain: string | null = null;

  try {
    destinationDomain = new URL(input.href).hostname;
  } catch {
    destinationDomain = null;
  }

  posthog.capture("tool_outbound_click", {
    tool_id: input.toolId,
    tool_slug: input.toolSlug ?? null,
    tool_name: input.toolName ?? null,
    destination_type: input.destinationType,
    destination_url: input.href,
    destination_url_original: input.href,
    destination_url_final: input.href,
    destination_domain: destinationDomain,
    source_surface: input.sourceSurface,
    source_path: input.sourcePath,
    used_affiliate_url: input.destinationType === "affiliate",
    is_featured: Boolean(input.isFeatured),
    current_launch_type: input.currentLaunchType ?? null,
  });
}
