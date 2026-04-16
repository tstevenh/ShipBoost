"use client";

import { useEffect, useRef } from "react";
import posthog from "posthog-js";

import { authClient } from "@/lib/auth-client";
import { getEmailDomain } from "@/lib/posthog-shared";
import { clearPendingAuthIntent, getPendingAuthIntent } from "@/lib/posthog-browser";

let hasInitializedPostHog = false;

export function resetPostHogPageTrackerForTest() {
  hasInitializedPostHog = false;
}

export function PostHogPageTracker({
  apiKey,
  apiHost,
}: {
  apiKey?: string;
  apiHost?: string;
}) {
  const { data: session } = authClient.useSession();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!apiKey || hasInitializedPostHog) {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost ?? "https://us.i.posthog.com",
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: false,
    });

    hasInitializedPostHog = true;
  }, [apiHost, apiKey]);

  useEffect(() => {
    if (!apiKey || !hasInitializedPostHog) {
      return;
    }

    const currentUser = session?.user ?? null;
    const previousUserId = previousUserIdRef.current;
    const currentUserId = currentUser?.id ?? null;

    if (!currentUserId || !currentUser) {
      if (previousUserId) {
        posthog.reset();
      }

      previousUserIdRef.current = null;
      return;
    }

    if (currentUserId === previousUserId) {
      return;
    }

    posthog.identify(currentUserId, {
      email: currentUser.email,
      name: currentUser.name ?? undefined,
      role: currentUser.role ?? "FOUNDER",
    });

    const pendingAuthIntent = getPendingAuthIntent();

    if (pendingAuthIntent?.intent === "sign-in") {
      posthog.capture("sign_in_completed", {
        auth_method: pendingAuthIntent.method,
        auth_source: pendingAuthIntent.source ?? "auth_form",
        email_domain:
          getEmailDomain(pendingAuthIntent.email) ??
          getEmailDomain(currentUser.email),
        redirect_to: pendingAuthIntent.redirectTo ?? null,
      });
      clearPendingAuthIntent();
    } else if (
      pendingAuthIntent?.intent === "sign-up" &&
      pendingAuthIntent.method !== "email"
    ) {
      posthog.capture("sign_up_completed", {
        auth_method: pendingAuthIntent.method,
        auth_source: pendingAuthIntent.source ?? "auth_form",
        email_domain:
          getEmailDomain(pendingAuthIntent.email) ??
          getEmailDomain(currentUser.email),
        redirect_to: pendingAuthIntent.redirectTo ?? null,
        role: currentUser.role ?? "FOUNDER",
      });
      clearPendingAuthIntent();
    } else if (pendingAuthIntent?.intent === "sign-up") {
      clearPendingAuthIntent();
    }

    previousUserIdRef.current = currentUserId;
  }, [
    apiKey,
    session?.user?.email,
    session?.user?.id,
    session?.user?.name,
    session?.user?.role,
  ]);

  return null;
}
