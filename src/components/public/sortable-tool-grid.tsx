"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { ToolCard } from "@/components/ToolCard";

export type SortableToolGridItem = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl?: string;
  votes: number;
  tags: string[];
  linkedTags?: Array<{
    name: string;
    slug: string;
  }>;
  primaryCategory?: {
    name: string;
    slug: string;
  } | null;
  isFeatured: boolean;
  createdAt: string;
};

type SortableToolGridProps = {
  tools: SortableToolGridItem[];
  emptyMessage: string;
};

function compareByNewest(
  left: SortableToolGridItem,
  right: SortableToolGridItem,
) {
  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
    Number(right.isFeatured) - Number(left.isFeatured) ||
    right.votes - left.votes ||
    left.name.localeCompare(right.name)
  );
}

function compareByTop(left: SortableToolGridItem, right: SortableToolGridItem) {
  return (
    right.votes - left.votes ||
    Number(right.isFeatured) - Number(left.isFeatured) ||
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime() ||
    left.name.localeCompare(right.name)
  );
}

export function SortableToolGrid({
  tools,
  emptyMessage,
}: SortableToolGridProps) {
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") === "top" ? "top" : "newest";

  const sortedTools = useMemo(() => {
    const nextTools = [...tools];
    nextTools.sort(currentSort === "top" ? compareByTop : compareByNewest);
    return nextTools;
  }, [currentSort, tools]);

  if (sortedTools.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="grid gap-5">
      {sortedTools.map((tool) => (
        <ToolCard
          key={tool.id}
          toolId={tool.id}
          name={tool.name}
          tagline={tool.tagline}
          logoUrl={tool.logoUrl}
          slug={tool.slug}
          votes={tool.votes}
          tags={tool.tags}
          linkedTags={tool.linkedTags}
          primaryCategory={tool.primaryCategory}
        />
      ))}
    </div>
  );
}
