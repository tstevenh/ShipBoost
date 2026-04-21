"use client";

import { useEffect, useRef } from "react";

import { captureBrowserPostHogEvent } from "@/lib/posthog-browser";

type ToolPageViewTrackerProps = {
  enabled?: boolean;
  toolId: string;
  toolSlug: string;
  toolName: string;
  categorySlugs: string[];
  tagSlugs: string[];
};

export function ToolPageViewTracker({
  enabled = true,
  toolId,
  toolSlug,
  toolName,
  categorySlugs,
  tagSlugs,
}: ToolPageViewTrackerProps) {
  const lastTrackedToolSlugRef = useRef<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (lastTrackedToolSlugRef.current === toolSlug) {
      return;
    }

    captureBrowserPostHogEvent("tool_page_viewed", {
      tool_id: toolId,
      tool_slug: toolSlug,
      tool_name: toolName,
      category_slugs: categorySlugs,
      tag_slugs: tagSlugs,
      page_type: "tool_page",
      source_surface: "tool_page",
    });

    lastTrackedToolSlugRef.current = toolSlug;
  }, [categorySlugs, enabled, tagSlugs, toolId, toolName, toolSlug]);

  return null;
}
