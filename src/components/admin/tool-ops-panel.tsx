import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useMemo, useState } from "react";
import {
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Plus,
  RefreshCw,
  Search,
  Star,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { NativeSelect } from "@/components/forms/native-select";
import {
  Field,
  SectionCard,
  StatusChip,
  formatDate,
  textInputClassName,
  type Category,
  type Tag,
  type Tool,
  type ToolCreateForm,
} from "@/components/admin/admin-console-shared";

const moderationStatuses = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "HIDDEN",
] as const;

const publicationStatuses = [
  "UNPUBLISHED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

const pricingModels = [
  "FREE",
  "FREEMIUM",
  "PAID",
  "CUSTOM",
  "CONTACT_SALES",
] as const;

function getModerationTone(status: Tool["moderationStatus"]) {
  if (status === "APPROVED") {
    return "green" as const;
  }

  if (status === "PENDING") {
    return "amber" as const;
  }

  if (status === "REJECTED" || status === "HIDDEN") {
    return "rose" as const;
  }

  return "slate" as const;
}

function getPublicationTone(status: Tool["publicationStatus"]) {
  if (status === "PUBLISHED") {
    return "green" as const;
  }

  if (status === "ARCHIVED") {
    return "rose" as const;
  }

  return "slate" as const;
}

function isUserSubmissionTool(tool: Tool) {
  return tool.submissions.length > 0 || tool.owner?.role === "FOUNDER";
}

type InventoryDrawerState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "detail"; toolId: string };

function InventoryDrawer({
  children,
  title,
  description,
  onClose,
}: {
  children: React.ReactNode;
  title: string;
  description: string;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex justify-end pt-24">
      <button
        type="button"
        aria-label="Close drawer"
        className="absolute inset-0 bg-black/35 backdrop-blur-[1px]"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-[calc(100vh-6rem)] w-full max-w-2xl flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-5">
          <div className="space-y-1">
            <h3 className="text-lg font-black tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-sm font-medium text-muted-foreground">
              {description}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X size={16} />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </aside>
    </div>
  );
}

export function ToolOpsPanel({
  categories,
  tags,
  tools,
  toolDraft,
  setToolDraft,
  toolSearch,
  onToolSearchChange,
  toolError,
  toolNotes,
  setToolNotes,
  handleCategorySelection,
  handleTagSelection,
  handleCreateTool,
  handleToolStatusUpdate,
  getToolNote,
  hasPendingAction,
  isActionPending,
}: {
  categories: Category[];
  tags: Tag[];
  tools: Tool[];
  toolDraft: ToolCreateForm;
  setToolDraft: Dispatch<SetStateAction<ToolCreateForm>>;
  toolSearch: string;
  onToolSearchChange: (value: string) => void;
  toolError: string | null;
  toolNotes: Record<string, string>;
  setToolNotes: Dispatch<SetStateAction<Record<string, string>>>;
  handleCategorySelection: (categoryId: string) => void;
  handleTagSelection: (tagId: string) => void;
  handleCreateTool: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleToolStatusUpdate: (
    toolId: string,
    actionKey: string,
    payload: Partial<{
      moderationStatus: Tool["moderationStatus"];
      publicationStatus: Tool["publicationStatus"];
      isFeatured: boolean;
      internalNote: string;
    }>,
  ) => void | Promise<void>;
  getToolNote: (tool: Tool) => string;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  const [drawerState, setDrawerState] = useState<InventoryDrawerState>({
    mode: "closed",
  });
  const [moderationFilter, setModerationFilter] = useState<
    Tool["moderationStatus"] | "ALL"
  >("ALL");
  const [publicationFilter, setPublicationFilter] = useState<
    Tool["publicationStatus"] | "ALL"
  >("ALL");
  const [featuredFilter, setFeaturedFilter] = useState<
    "ALL" | "FEATURED" | "STANDARD"
  >("ALL");
  const [isUserSubmissionTableCollapsed, setIsUserSubmissionTableCollapsed] =
    useState(false);
  const [isSeededTableCollapsed, setIsSeededTableCollapsed] = useState(false);
  const [sortKey, setSortKey] = useState<
    "createdAt" | "name" | "category" | "moderation" | "publication"
  >("createdAt");
  const [sortDirection, setSortDirection] = useState<"desc" | "asc">("desc");

  const selectedTool =
    drawerState.mode === "detail"
      ? tools.find((tool) => tool.id === drawerState.toolId) ?? null
      : null;

  const filteredTools = useMemo(() => {
    const query = toolSearch.trim().toLowerCase();

    const filtered = tools.filter((tool) => {
      if (moderationFilter !== "ALL" && tool.moderationStatus !== moderationFilter) {
        return false;
      }

      if (
        publicationFilter !== "ALL" &&
        tool.publicationStatus !== publicationFilter
      ) {
        return false;
      }

      if (featuredFilter === "FEATURED" && !tool.isFeatured) {
        return false;
      }

      if (featuredFilter === "STANDARD" && tool.isFeatured) {
        return false;
      }

      if (!query) {
        return true;
      }

      const haystack = [
        tool.name,
        tool.slug,
        tool.tagline,
        tool.websiteUrl,
        ...tool.toolCategories.map((item) => item.category.name),
        ...tool.toolTags.map((item) => item.tag.name),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(query);
    });

    const sorted = [...filtered].sort((left, right) => {
      const leftCategory = left.toolCategories[0]?.category.name ?? "";
      const rightCategory = right.toolCategories[0]?.category.name ?? "";

      const leftValue =
        sortKey === "createdAt"
          ? new Date(left.createdAt).getTime()
          : sortKey === "name"
            ? left.name.toLowerCase()
            : sortKey === "category"
              ? leftCategory.toLowerCase()
              : sortKey === "moderation"
                ? left.moderationStatus
                : left.publicationStatus;

      const rightValue =
        sortKey === "createdAt"
          ? new Date(right.createdAt).getTime()
          : sortKey === "name"
            ? right.name.toLowerCase()
            : sortKey === "category"
              ? rightCategory.toLowerCase()
              : sortKey === "moderation"
                ? right.moderationStatus
                : right.publicationStatus;

      if (leftValue < rightValue) {
        return sortDirection === "asc" ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortDirection === "asc" ? 1 : -1;
      }

      return 0;
    });

    return sorted;
  }, [
    featuredFilter,
    moderationFilter,
    publicationFilter,
    sortDirection,
    sortKey,
    toolSearch,
    tools,
  ]);

  const userSubmissionTools = useMemo(
    () => filteredTools.filter(isUserSubmissionTool),
    [filteredTools],
  );
  const seededTools = useMemo(
    () => filteredTools.filter((tool) => !isUserSubmissionTool(tool)),
    [filteredTools],
  );

  function handleSort(
    nextSortKey: "createdAt" | "name" | "category" | "moderation" | "publication",
  ) {
    if (nextSortKey === sortKey) {
      setSortDirection((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortKey(nextSortKey);
    setSortDirection(nextSortKey === "createdAt" ? "desc" : "asc");
  }

  function getAriaSort(
    column: "createdAt" | "name" | "category" | "moderation" | "publication",
  ) {
    if (column !== sortKey) {
      return "none";
    }

    return sortDirection === "asc" ? "ascending" : "descending";
  }

  function renderSortIcon(
    column: "createdAt" | "name" | "category" | "moderation" | "publication",
  ) {
    if (column !== sortKey) {
      return (
        <span
          aria-hidden="true"
          className="ml-1 text-[11px] font-black tracking-tight text-muted-foreground/40"
        >
          ↑↓
        </span>
      );
    }

    return (
      <span
        aria-hidden="true"
        className="ml-1 text-[11px] font-black tracking-tight text-foreground"
      >
        {sortDirection === "asc" ? "↑" : "↓"}
      </span>
    );
  }

  function renderInventoryTable({
    title,
    description,
    sectionTools,
    emptyMessage,
    isCollapsed,
    onToggleCollapsed,
  }: {
    title: string;
    description: string;
    sectionTools: Tool[];
    emptyMessage: string;
    isCollapsed: boolean;
    onToggleCollapsed: () => void;
  }) {
    const CollapseIcon = isCollapsed ? ChevronRight : ChevronDown;

    return (
      <section className="min-w-0 space-y-3">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-base font-black tracking-tight text-foreground">
              {title}
            </h3>
            <p className="text-xs font-medium text-muted-foreground">
              {description}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex w-fit items-center rounded-full border border-border bg-muted/20 px-3 py-1 text-[10px] font-black tracking-[0.18em] text-muted-foreground">
              {sectionTools.length} tools
            </div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[10px] font-black tracking-[0.18em] text-foreground transition hover:bg-muted"
              aria-expanded={!isCollapsed}
            >
              <CollapseIcon size={14} />
              {isCollapsed ? "Expand" : "Collapse"}
            </button>
          </div>
        </div>

        <div
          className={cn(
            "min-w-0 overflow-hidden rounded-2xl border border-border bg-card",
            isCollapsed && "hidden",
          )}
        >
          <div className="max-w-full overflow-x-auto">
            <table className="min-w-[1080px] divide-y divide-border text-left">
              <thead className="bg-muted/30">
                <tr className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  <th
                    className="w-[34%] px-4 py-3 whitespace-nowrap font-black text-foreground"
                    aria-sort={getAriaSort("name")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("name")}
                      className="whitespace-nowrap"
                    >
                      Tool
                      {renderSortIcon("name")}
                      <span className="sr-only"> sort by tool name</span>
                    </button>
                  </th>
                  <th
                    className="w-[14%] px-4 py-3 whitespace-nowrap font-black text-foreground"
                    aria-sort={getAriaSort("category")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("category")}
                      className="whitespace-nowrap"
                    >
                      Primary category
                      {renderSortIcon("category")}
                      <span className="sr-only"> sort by primary category</span>
                    </button>
                  </th>
                  <th
                    className="w-[12%] px-4 py-3 whitespace-nowrap font-black text-foreground"
                    aria-sort={getAriaSort("moderation")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("moderation")}
                      className="whitespace-nowrap"
                    >
                      Moderation
                      {renderSortIcon("moderation")}
                      <span className="sr-only"> sort by moderation</span>
                    </button>
                  </th>
                  <th
                    className="w-[14%] px-4 py-3 whitespace-nowrap font-black text-foreground"
                    aria-sort={getAriaSort("publication")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("publication")}
                      className="whitespace-nowrap"
                    >
                      Publication
                      {renderSortIcon("publication")}
                      <span className="sr-only"> sort by publication</span>
                    </button>
                  </th>
                  <th className="w-[8%] px-4 py-3 whitespace-nowrap">Premium</th>
                  <th
                    className="w-[10%] px-4 py-3 whitespace-nowrap font-black text-foreground"
                    aria-sort={getAriaSort("createdAt")}
                  >
                    <button
                      type="button"
                      onClick={() => handleSort("createdAt")}
                      className="whitespace-nowrap"
                    >
                      Created
                      {renderSortIcon("createdAt")}
                      <span className="sr-only"> sort by created date</span>
                    </button>
                  </th>
                  <th className="w-[18%] px-4 py-3 text-right whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sectionTools.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-16 text-center text-sm font-medium text-muted-foreground"
                    >
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  sectionTools.map((tool) => {
                    const categoriesSummary = tool.toolCategories
                      .map((item) => item.category.name)
                      .join(", ");

                    return (
                      <tr
                        key={tool.id}
                        className="transition hover:bg-muted/20"
                      >
                        <td className="px-4 py-4 align-top">
                          <button
                            type="button"
                            onClick={() =>
                              setDrawerState({ mode: "detail", toolId: tool.id })
                            }
                            className="space-y-1 text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-black text-foreground">
                                {tool.name}
                              </span>
                              {tool.isFeatured ? (
                                <StatusChip label="Premium" tone="amber" />
                              ) : null}
                            </div>
                            <p className="max-w-sm text-xs font-medium text-muted-foreground line-clamp-2">
                              {tool.tagline}
                            </p>
                            <p className="text-[11px] font-bold text-muted-foreground/70">
                              /tools/{tool.slug}
                            </p>
                          </button>
                        </td>
                        <td className="px-4 py-4 align-top text-xs font-semibold text-foreground/80">
                          {categoriesSummary || "—"}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusChip
                            label={tool.moderationStatus}
                            tone={getModerationTone(tool.moderationStatus)}
                          />
                        </td>
                        <td className="px-4 py-4 align-top">
                          <StatusChip
                            label={tool.publicationStatus}
                            tone={getPublicationTone(tool.publicationStatus)}
                          />
                        </td>
                        <td className="px-4 py-4 align-top text-xs font-semibold text-foreground/80">
                          {tool.isFeatured ? "Yes" : "No"}
                        </td>
                        <td className="px-4 py-4 align-top text-xs font-semibold leading-5 text-foreground/80 break-words">
                          {formatDate(tool.createdAt)}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                void handleToolStatusUpdate(
                                  tool.id,
                                  `tool:${tool.id}:publication-quick`,
                                  {
                                    publicationStatus:
                                      tool.publicationStatus === "PUBLISHED"
                                        ? "UNPUBLISHED"
                                        : "PUBLISHED",
                                  },
                                )
                              }
                              disabled={hasPendingAction}
                              className="rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-black tracking-widest text-foreground transition hover:bg-muted disabled:opacity-50"
                            >
                              {tool.publicationStatus === "PUBLISHED"
                                ? "Unpublish"
                                : "Publish"}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                void handleToolStatusUpdate(
                                  tool.id,
                                  `tool:${tool.id}:featured-quick`,
                                  {
                                    isFeatured: !tool.isFeatured,
                                  },
                                )
                              }
                              disabled={hasPendingAction}
                              className="rounded-lg border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                              title={
                                tool.isFeatured
                                  ? "Remove premium"
                                  : "Mark as premium"
                              }
                            >
                              <Star
                                size={14}
                                className={tool.isFeatured ? "fill-current text-amber-500" : ""}
                              />
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setDrawerState({ mode: "detail", toolId: tool.id })
                              }
                              className="rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-black tracking-widest text-foreground transition hover:bg-muted"
                            >
                              Edit
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    );
  }

  return (
    <SectionCard
      eyebrow="Inventory"
      title="Directory Tuning"
      description="Scan submitted tools separately from imported listings, then open a focused side panel for creation and updates."
    >
      <div className="min-w-0 space-y-5">
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="min-w-0 flex-1">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,0.6fr))]">
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  size={14}
                />
                <input
                  value={toolSearch}
                  onChange={(event) => onToolSearchChange(event.target.value)}
                  placeholder="Search by tool, tag, category, or URL..."
                  className={cn(textInputClassName(), "pl-10 py-2 text-xs")}
                />
              </div>

              <NativeSelect
                value={moderationFilter}
                onChange={(event) =>
                  setModerationFilter(
                    event.target.value as Tool["moderationStatus"] | "ALL",
                  )
                }
                className={cn(textInputClassName(), "py-2 text-xs")}
              >
                <option value="ALL">All moderation</option>
                {moderationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                value={publicationFilter}
                onChange={(event) =>
                  setPublicationFilter(
                    event.target.value as Tool["publicationStatus"] | "ALL",
                  )
                }
                className={cn(textInputClassName(), "py-2 text-xs")}
              >
                <option value="ALL">All publication</option>
                {publicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </NativeSelect>

              <NativeSelect
                value={featuredFilter}
                onChange={(event) =>
                  setFeaturedFilter(
                    event.target.value as "ALL" | "FEATURED" | "STANDARD",
                  )
                }
                className={cn(textInputClassName(), "py-2 text-xs")}
              >
                <option value="ALL">All premium states</option>
                <option value="FEATURED">Premium only</option>
                <option value="STANDARD">Standard only</option>
              </NativeSelect>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDrawerState({ mode: "create" })}
            className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 xl:self-auto"
          >
            <Plus size={14} />
            Create tool
          </button>
        </div>

        {toolError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold tracking-widest text-destructive">
            {toolError}
          </div>
        )}

        {renderInventoryTable({
          title: "User submission tools",
          description: "Tools connected to a founder account or submission flow.",
          sectionTools: userSubmissionTools,
          emptyMessage: "No user submission tools match the current filters.",
          isCollapsed: isUserSubmissionTableCollapsed,
          onToggleCollapsed: () =>
            setIsUserSubmissionTableCollapsed((current) => !current),
        })}

        {renderInventoryTable({
          title: "Seeded imports",
          description: "Tools imported directly into the directory without a founder submission.",
          sectionTools: seededTools,
          emptyMessage: "No seeded imports match the current filters.",
          isCollapsed: isSeededTableCollapsed,
          onToggleCollapsed: () =>
            setIsSeededTableCollapsed((current) => !current),
        })}
      </div>

      {drawerState.mode === "create" ? (
        <InventoryDrawer
          title="Create tool"
          description="Add a new listing without leaving the inventory view."
          onClose={() => setDrawerState({ mode: "closed" })}
        >
          <form onSubmit={handleCreateTool} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={toolDraft.name}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  required
                  placeholder="Product Name"
                />
              </Field>
              <Field label="Slug (optional)">
                <input
                  value={toolDraft.slug}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  placeholder="shipboost"
                />
              </Field>
            </div>

            <Field label="Tagline">
              <input
                value={toolDraft.tagline}
                onChange={(event) =>
                  setToolDraft((current) => ({
                    ...current,
                    tagline: event.target.value,
                  }))
                }
                className={textInputClassName()}
                maxLength={60}
                required
                placeholder="Short catchy description"
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Website URL">
                <input
                  type="url"
                  value={toolDraft.websiteUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      websiteUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  required
                  placeholder="https://..."
                />
              </Field>
              <Field label="Logo URL">
                <input
                  type="url"
                  value={toolDraft.logoUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      logoUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  required
                  placeholder="https://..."
                />
              </Field>
            </div>

            <Field label="Rich Description">
              <textarea
                value={toolDraft.richDescription}
                onChange={(event) =>
                  setToolDraft((current) => ({
                    ...current,
                    richDescription: event.target.value,
                  }))
                }
                rows={5}
                className={cn(textInputClassName(), "text-xs")}
                required
                placeholder="Detailed product overview..."
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Pricing">
                <NativeSelect
                  value={toolDraft.pricingModel}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      pricingModel: event.target.value as Tool["pricingModel"],
                    }))
                  }
                  className={textInputClassName()}
                >
                  {pricingModels.map((pricingModel) => (
                    <option key={pricingModel} value={pricingModel}>
                      {pricingModel}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
              <Field label="Screenshots" hint="One per line">
                <textarea
                  value={toolDraft.screenshotUrls}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      screenshotUrls: event.target.value,
                    }))
                  }
                  rows={3}
                  className={cn(textInputClassName(), "text-xs")}
                  placeholder="https://..."
                />
              </Field>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  Categories
                </p>
                <div className="grid max-h-48 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                  {categories.map((category) => (
                    <label
                      key={category.id}
                      className="flex items-center gap-2 text-xs font-semibold text-foreground/75"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary/20"
                        checked={toolDraft.categoryIds.includes(category.id)}
                        onChange={() => handleCategorySelection(category.id)}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-card p-4">
                <p className="mb-3 text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  Tags
                </p>
                <div className="grid max-h-48 gap-2 overflow-y-auto pr-2 custom-scrollbar">
                  {tags.map((tag) => (
                    <label
                      key={tag.id}
                      className="flex items-center gap-2 text-xs font-semibold text-foreground/75"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary/20"
                        checked={toolDraft.tagIds.includes(tag.id)}
                        onChange={() => handleTagSelection(tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-5">
              {[
                { id: "hasAffiliateProgram", label: "Affiliate" },
                { id: "publish", label: "Publish" },
                { id: "isFeatured", label: "Premium" },
              ].map((cb) => (
                <label
                  key={cb.id}
                  className="flex items-center gap-2 text-xs font-black tracking-widest text-foreground"
                >
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary/20"
                    checked={
                      toolDraft[cb.id as keyof Pick<
                        ToolCreateForm,
                        "hasAffiliateProgram" | "publish" | "isFeatured"
                      >]
                    }
                    onChange={(event) =>
                      setToolDraft((current) => ({
                        ...current,
                        [cb.id]: event.target.checked,
                      }))
                    }
                  />
                  {cb.label}
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={hasPendingAction}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("tool:create") ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Plus size={14} />
              )}
              Create Listing
            </button>
          </form>
        </InventoryDrawer>
      ) : null}

      {selectedTool ? (
        <InventoryDrawer
          title={selectedTool.name}
          description="Adjust status, premium placement, and internal notes without leaving the table."
          onClose={() => setDrawerState({ mode: "closed" })}
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm font-black text-foreground">
                    {selectedTool.name}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">
                    {selectedTool.tagline}
                  </p>
                  <p className="text-xs font-semibold text-muted-foreground/70">
                    /tools/{selectedTool.slug}
                  </p>
                </div>
                <a
                  href={selectedTool.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-black tracking-widest text-foreground transition hover:bg-muted"
                >
                  Visit site
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Moderation">
                <NativeSelect
                  value={selectedTool.moderationStatus}
                  onChange={(event) =>
                    void handleToolStatusUpdate(
                      selectedTool.id,
                      `tool:${selectedTool.id}:moderation`,
                      {
                        moderationStatus:
                          event.target.value as Tool["moderationStatus"],
                      },
                    )
                  }
                  disabled={hasPendingAction}
                  className={textInputClassName()}
                >
                  {moderationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </NativeSelect>
              </Field>

              <Field label="Publication">
                <NativeSelect
                  value={selectedTool.publicationStatus}
                  onChange={(event) =>
                    void handleToolStatusUpdate(
                      selectedTool.id,
                      `tool:${selectedTool.id}:publication`,
                      {
                        publicationStatus:
                          event.target.value as Tool["publicationStatus"],
                      },
                    )
                  }
                  disabled={hasPendingAction}
                  className={textInputClassName()}
                >
                  {publicationStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </NativeSelect>
              </Field>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                    Categories
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTool.toolCategories.length > 0 ? (
                      selectedTool.toolCategories.map((item) => (
                        <span
                          key={item.categoryId}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-bold text-foreground/80"
                        >
                          {item.category.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        No categories assigned
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                    Tags
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedTool.toolTags.length > 0 ? (
                      selectedTool.toolTags.map((item) => (
                        <span
                          key={item.tagId}
                          className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[11px] font-bold text-foreground/80"
                        >
                          {item.tag.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">
                        No tags assigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                    Owner
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTool.owner?.name || "Unassigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedTool.owner?.email || "No owner email"}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                    Activity
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {selectedTool.submissions.length} submissions •{" "}
                    {selectedTool.launches.length} launches
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Added {formatDate(selectedTool.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-black tracking-widest text-foreground">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary/20"
                checked={selectedTool.isFeatured}
                onChange={(event) =>
                  void handleToolStatusUpdate(
                    selectedTool.id,
                    `tool:${selectedTool.id}:featured`,
                    {
                      isFeatured: event.target.checked,
                    },
                  )
                }
                disabled={hasPendingAction}
              />
              Premium placement
            </label>

            <Field label="Internal note">
              <textarea
                value={toolNotes[selectedTool.id] ?? getToolNote(selectedTool)}
                onChange={(event) =>
                  setToolNotes((current) => ({
                    ...current,
                    [selectedTool.id]: event.target.value,
                  }))
                }
                rows={4}
                className={cn(textInputClassName(), "text-sm")}
                placeholder="Admin note..."
              />
            </Field>

            <button
              type="button"
              onClick={() =>
                void handleToolStatusUpdate(
                  selectedTool.id,
                  `tool:${selectedTool.id}:note`,
                  {
                    internalNote: getToolNote(selectedTool),
                  },
                )
              }
              disabled={hasPendingAction}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs font-black tracking-widest text-foreground transition hover:bg-muted disabled:opacity-50"
            >
              {isActionPending(`tool:${selectedTool.id}:note`) ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Check size={14} />
              )}
              Save note
            </button>
          </div>
        </InventoryDrawer>
      ) : null}
    </SectionCard>
  );
}
