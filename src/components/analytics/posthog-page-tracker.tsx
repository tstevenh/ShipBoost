"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import posthog from "posthog-js";
import { isPrivateRoutePathname } from "@/lib/route-groups";

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
  const pathname = usePathname();
  const isPrivateRoute = isPrivateRoutePathname(pathname);

  useEffect(() => {
    if (!apiKey || hasInitializedPostHog || isPrivateRoute) {
      return;
    }

    posthog.init(apiKey, {
      api_host: apiHost ?? "https://us.i.posthog.com",
      defaults: "2026-01-30",
      autocapture: false,
      capture_pageview: "history_change",
      capture_pageleave: false,
      capture_performance: false,
      capture_dead_clicks: false,
      capture_heatmaps: false,
      disable_session_recording: true,
      advanced_disable_flags: true,
      advanced_disable_feature_flags: true,
      advanced_disable_feature_flags_on_first_load: true,
      advanced_disable_toolbar_metrics: true,
    });

    hasInitializedPostHog = true;
  }, [apiHost, apiKey, isPrivateRoute]);

  return null;
}
