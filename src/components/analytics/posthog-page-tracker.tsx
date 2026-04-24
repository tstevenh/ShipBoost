"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

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

  return null;
}
