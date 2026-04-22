"use client";

import posthog from "posthog-js";

import {
  buildOutboundLinkClickedProperties,
  type OutboundLinkClickedPropertiesInput,
} from "@/lib/outbound-link";

type PendingAuthIntentKind = "sign-in" | "sign-up";
type PendingAuthMethod = "email" | "google" | "magic_link";

type PendingAuthIntent = {
  intent: PendingAuthIntentKind;
  method: PendingAuthMethod;
  createdAt: number;
  email?: string;
  redirectTo?: string;
  source?: string;
};

const PENDING_AUTH_INTENT_STORAGE_KEY = "shipboost.pending-auth-intent";
const PENDING_AUTH_INTENT_MAX_AGE_MS = 30 * 60 * 1000;

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

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

export function setPendingAuthIntent(
  input: Omit<PendingAuthIntent, "createdAt">,
) {
  if (!canUseSessionStorage()) {
    return;
  }

  const normalizedEmail = input.email?.trim().toLowerCase();

  window.sessionStorage.setItem(
    PENDING_AUTH_INTENT_STORAGE_KEY,
    JSON.stringify({
      ...input,
      email: normalizedEmail,
      createdAt: Date.now(),
    }),
  );
}

export function clearPendingAuthIntent() {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(PENDING_AUTH_INTENT_STORAGE_KEY);
}

export function getPendingAuthIntent(): PendingAuthIntent | null {
  if (!canUseSessionStorage()) {
    return null;
  }

  const rawValue = window.sessionStorage.getItem(PENDING_AUTH_INTENT_STORAGE_KEY);

  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue) as PendingAuthIntent;

    if (
      !parsed ||
      (parsed.intent !== "sign-in" && parsed.intent !== "sign-up") ||
      (parsed.method !== "email" &&
        parsed.method !== "google" &&
        parsed.method !== "magic_link") ||
      typeof parsed.createdAt !== "number"
    ) {
      clearPendingAuthIntent();
      return null;
    }

    if (Date.now() - parsed.createdAt > PENDING_AUTH_INTENT_MAX_AGE_MS) {
      clearPendingAuthIntent();
      return null;
    }

    return parsed;
  } catch {
    clearPendingAuthIntent();
    return null;
  }
}
