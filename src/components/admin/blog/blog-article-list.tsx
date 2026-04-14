"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import {
  StatusChip,
  textInputClassName,
  type BlogArticle,
  type BlogCategory,
} from "@/components/admin/admin-console-shared";
import { articleStatusTone } from "@/components/admin/blog/types";
import { cn } from "@/lib/utils";

type BlogArticleListProps = {
  articles: BlogArticle[];
  categories: BlogCategory[];
  selectedArticleId: string | null;
  onSelectArticle: (articleId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: "" | BlogArticle["status"];
  onStatusFilterChange: (value: "" | BlogArticle["status"]) => void;
  categoryFilter: string;
  onCategoryFilterChange: (value: string) => void;
  isRailCollapsed: boolean;
  onToggleRail: () => void;
};

export function BlogArticleList({
  articles,
  categories,
  selectedArticleId,
  onSelectArticle,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  isRailCollapsed,
  onToggleRail,
}: BlogArticleListProps) {
  return (
    <aside
      className={cn(
        "space-y-4 rounded-[1.75rem] border border-border bg-card p-4 shadow-sm transition-all",
        isRailCollapsed ? "xl:w-28" : "xl:w-full",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        {!isRailCollapsed ? (
          <div>
            <h3 className="text-sm font-black tracking-tight text-foreground">
              Articles
            </h3>
            <p className="text-[11px] font-bold text-muted-foreground">
              Switch posts without leaving the editor.
            </p>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onToggleRail}
          className="rounded-xl border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          aria-label={isRailCollapsed ? "Expand article rail" : "Collapse article rail"}
        >
          {isRailCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {!isRailCollapsed ? (
        <div className="space-y-3">
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search title or slug"
            className={textInputClassName()}
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              onStatusFilterChange(event.target.value as "" | BlogArticle["status"])
            }
            className={textInputClassName()}
          >
            <option value="">All statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(event) => onCategoryFilterChange(event.target.value)}
            className={textInputClassName()}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-2">
        {articles.map((article) => (
          <button
            key={article.id}
            type="button"
            onClick={() => void onSelectArticle(article.id)}
            className={cn(
              "w-full rounded-2xl border px-3 py-3 text-left transition",
              selectedArticleId === article.id
                ? "border-primary bg-primary/5"
                : "border-border bg-background hover:bg-muted",
            )}
          >
            <div className={cn("space-y-2", isRailCollapsed && "space-y-1")}>
              <div className="flex items-start justify-between gap-2">
                {!isRailCollapsed ? (
                  <p className="line-clamp-2 text-sm font-black text-foreground">
                    {article.title}
                  </p>
                ) : (
                  <div className="h-2.5 w-2.5 rounded-full bg-primary" />
                )}
                <StatusChip
                  label={article.status}
                  tone={articleStatusTone(article.status)}
                />
              </div>
              {!isRailCollapsed ? (
                <p className="line-clamp-1 text-[11px] font-medium text-muted-foreground">
                  {article.slug}
                </p>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
