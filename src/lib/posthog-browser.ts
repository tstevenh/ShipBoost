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
