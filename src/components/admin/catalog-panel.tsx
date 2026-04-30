import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { Plus, RefreshCw, Save, Search, Trash2, X } from "lucide-react";

import { NativeSelect } from "@/components/forms/native-select";
import { cn } from "@/lib/utils";
import {
  Field,
  SectionCard,
  textInputClassName,
  type Category,
  type CategoryDraft,
  type Tag,
  type TagDraft,
  type Tool,
} from "@/components/admin/admin-console-shared";

type TaxonomyEntry =
  | {
      type: "category";
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      usageCount: number;
      sortOrder: number;
      source: Category;
    }
  | {
      type: "tag";
      id: string;
      name: string;
      slug: string;
      isActive: boolean;
      usageCount: number;
      sortOrder: null;
      source: Tag;
    };

type TaxonomyDrawerState =
  | { mode: "closed" }
  | { mode: "create-category" }
  | { mode: "create-tag" }
  | { mode: "edit-category"; categoryId: string }
  | { mode: "edit-tag"; tagId: string };

function TaxonomyDrawer({
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
      <aside className="relative z-10 flex h-[calc(100vh-6rem)] w-full max-w-xl flex-col border-l border-border bg-background shadow-2xl">
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

export function CatalogPanel({
  categories,
  tags,
  tools,
  categoryDraft,
  setCategoryDraft,
  tagDraft,
  setTagDraft,
  setEditingCategories,
  setEditingTags,
  catalogError,
  handleCreateCategory,
  handleCreateTag,
  handleSaveCategory,
  handleDeleteCategory,
  handleSaveTag,
  handleDeleteTag,
  getCategoryDraft,
  getTagDraft,
  hasPendingAction,
  isActionPending,
}: {
  categories: Category[];
  tags: Tag[];
  tools: Tool[];
  categoryDraft: CategoryDraft;
  setCategoryDraft: Dispatch<SetStateAction<CategoryDraft>>;
  tagDraft: TagDraft;
  setTagDraft: Dispatch<SetStateAction<TagDraft>>;
  setEditingCategories: Dispatch<SetStateAction<Record<string, CategoryDraft>>>;
  setEditingTags: Dispatch<SetStateAction<Record<string, TagDraft>>>;
  catalogError: string | null;
  handleCreateCategory: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleCreateTag: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleSaveCategory: (categoryId: string) => void | Promise<void>;
  handleDeleteCategory: (categoryId: string) => void | Promise<void>;
  handleSaveTag: (tagId: string) => void | Promise<void>;
  handleDeleteTag: (tagId: string) => void | Promise<void>;
  getCategoryDraft: (category: Category) => CategoryDraft;
  getTagDraft: (tag: Tag) => TagDraft;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  const [drawerState, setDrawerState] = useState<TaxonomyDrawerState>({
    mode: "closed",
  });
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"ALL" | "CATEGORY" | "TAG">(
    "ALL",
  );
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">(
    "ALL",
  );

  const categoryUsageCount = useMemo(() => {
    const counts = new Map<string, number>();

    for (const tool of tools) {
      for (const item of tool.toolCategories) {
        counts.set(item.categoryId, (counts.get(item.categoryId) ?? 0) + 1);
      }
    }

    return counts;
  }, [tools]);

  const tagUsageCount = useMemo(() => {
    const counts = new Map<string, number>();

    for (const tool of tools) {
      for (const item of tool.toolTags) {
        counts.set(item.tagId, (counts.get(item.tagId) ?? 0) + 1);
      }
    }

    return counts;
  }, [tools]);

  const entries = useMemo<TaxonomyEntry[]>(() => {
    const categoryEntries: TaxonomyEntry[] = categories.map((category) => ({
      type: "category",
      id: category.id,
      name: category.name,
      slug: category.slug,
      isActive: category.isActive,
      usageCount: categoryUsageCount.get(category.id) ?? 0,
      sortOrder: category.sortOrder,
      source: category,
    }));

    const tagEntries: TaxonomyEntry[] = tags.map((tag) => ({
      type: "tag",
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      isActive: tag.isActive,
      usageCount: tagUsageCount.get(tag.id) ?? 0,
      sortOrder: null,
      source: tag,
    }));

    return [...categoryEntries, ...tagEntries];
  }, [categories, categoryUsageCount, tagUsageCount, tags]);

  const filteredEntries = useMemo(() => {
    const query = search.trim().toLowerCase();

    return entries
      .filter((entry) => {
        if (typeFilter === "CATEGORY" && entry.type !== "category") {
          return false;
        }

        if (typeFilter === "TAG" && entry.type !== "tag") {
          return false;
        }

        if (activeFilter === "ACTIVE" && !entry.isActive) {
          return false;
        }

        if (activeFilter === "INACTIVE" && entry.isActive) {
          return false;
        }

        if (!query) {
          return true;
        }

        return `${entry.name} ${entry.slug}`.toLowerCase().includes(query);
      })
      .sort((left, right) => {
        if (left.type !== right.type) {
          return left.type === "category" ? -1 : 1;
        }

        if (left.type === "category" && right.type === "category") {
          return left.sortOrder - right.sortOrder || left.name.localeCompare(right.name);
        }

        return right.usageCount - left.usageCount || left.name.localeCompare(right.name);
      });
  }, [activeFilter, entries, search, typeFilter]);

  const selectedCategory =
    drawerState.mode === "edit-category"
      ? categories.find((category) => category.id === drawerState.categoryId) ?? null
      : null;
  const selectedTag =
    drawerState.mode === "edit-tag"
      ? tags.find((tag) => tag.id === drawerState.tagId) ?? null
      : null;

  return (
    <SectionCard
      eyebrow="Catalog"
      title="Taxonomy Management"
      description="Use one compact table for categories and tags, then open a side panel when you need to create or edit."
    >
      <div className="space-y-5">
        {catalogError && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold tracking-widest text-destructive">
            {catalogError}
          </div>
        )}

        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,0.55fr))]">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                size={14}
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search categories and tags..."
                className={cn(textInputClassName(), "pl-10 py-2 text-xs")}
              />
            </div>

            <NativeSelect
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as "ALL" | "CATEGORY" | "TAG")
              }
              className={cn(textInputClassName(), "py-2 text-xs")}
            >
              <option value="ALL">All types</option>
              <option value="CATEGORY">Categories</option>
              <option value="TAG">Tags</option>
            </NativeSelect>

            <NativeSelect
              value={activeFilter}
              onChange={(event) =>
                setActiveFilter(
                  event.target.value as "ALL" | "ACTIVE" | "INACTIVE",
                )
              }
              className={cn(textInputClassName(), "py-2 text-xs")}
            >
              <option value="ALL">All states</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </NativeSelect>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setDrawerState({ mode: "create-category" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-black text-foreground transition hover:bg-muted"
            >
              <Plus size={14} />
              Create category
            </button>
            <button
              type="button"
              onClick={() => setDrawerState({ mode: "create-tag" })}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90"
            >
              <Plus size={14} />
              Create tag
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border text-left">
              <thead className="bg-muted/30">
                <tr className="text-[11px] font-black uppercase tracking-[0.22em] text-muted-foreground">
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Slug</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Usage</th>
                  <th className="px-4 py-3">Sort</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredEntries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-16 text-center text-sm font-medium text-muted-foreground"
                    >
                      No taxonomy items match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry) => (
                    <tr key={`${entry.type}:${entry.id}`} className="transition hover:bg-muted/20">
                      <td className="px-4 py-4 align-top text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                        {entry.type}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <button
                          type="button"
                          onClick={() =>
                            setDrawerState(
                              entry.type === "category"
                                ? { mode: "edit-category", categoryId: entry.id }
                                : { mode: "edit-tag", tagId: entry.id },
                            )
                          }
                          className="space-y-1 text-left"
                        >
                          <p className="text-sm font-black text-foreground">
                            {entry.name}
                          </p>
                          <p className="text-[11px] font-semibold text-muted-foreground/70">
                            {entry.type === "category"
                              ? "Category navigation"
                              : "Tag discovery surface"}
                          </p>
                        </button>
                      </td>
                      <td className="px-4 py-4 align-top text-xs font-semibold text-foreground/80">
                        {entry.slug}
                      </td>
                      <td className="px-4 py-4 align-top text-xs font-semibold text-foreground/80">
                        {entry.isActive ? "Yes" : "No"}
                      </td>
                      <td className="px-4 py-4 align-top text-xs font-semibold text-foreground/80">
                        {entry.usageCount}
                      </td>
                      <td className="px-4 py-4 align-top text-xs font-semibold text-foreground/80">
                        {entry.sortOrder ?? "—"}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setDrawerState(
                                entry.type === "category"
                                  ? { mode: "edit-category", categoryId: entry.id }
                                  : { mode: "edit-tag", tagId: entry.id },
                              )
                            }
                            className="rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-black tracking-widest text-foreground transition hover:bg-muted"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {drawerState.mode === "create-category" ? (
        <TaxonomyDrawer
          title="Create category"
          description="Add a new top-level category without leaving the taxonomy table."
          onClose={() => setDrawerState({ mode: "closed" })}
        >
          <form onSubmit={handleCreateCategory} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={categoryDraft.name}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  required
                  placeholder="e.g. Analytics"
                />
              </Field>
              <Field label="Slug">
                <input
                  value={categoryDraft.slug}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  placeholder="analytics"
                />
              </Field>
            </div>

            <Field label="Sort order">
              <input
                type="number"
                value={categoryDraft.sortOrder}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    sortOrder: event.target.value,
                  }))
                }
                className={cn(textInputClassName(), "max-w-40")}
              />
            </Field>

            <label className="flex items-center gap-2 text-xs font-black tracking-widest text-foreground">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary/20"
                checked={categoryDraft.isActive}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>

            <button
              type="submit"
              disabled={hasPendingAction}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("category:create") ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Plus size={14} />
              )}
              Create category
            </button>
          </form>
        </TaxonomyDrawer>
      ) : null}

      {drawerState.mode === "create-tag" ? (
        <TaxonomyDrawer
          title="Create tag"
          description="Create a new reusable tag for discovery and buyer-intent grouping."
          onClose={() => setDrawerState({ mode: "closed" })}
        >
          <form onSubmit={handleCreateTag} className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={tagDraft.name}
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  required
                  placeholder="e.g. AI-Powered"
                />
              </Field>
              <Field label="Slug">
                <input
                  value={tagDraft.slug}
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      slug: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  placeholder="ai-powered"
                />
              </Field>
            </div>

            <label className="flex items-center gap-2 text-xs font-black tracking-widest text-foreground">
              <input
                type="checkbox"
                className="rounded border-border text-primary focus:ring-primary/20"
                checked={tagDraft.isActive}
                onChange={(event) =>
                  setTagDraft((current) => ({
                    ...current,
                    isActive: event.target.checked,
                  }))
                }
              />
              Active
            </label>

            <button
              type="submit"
              disabled={hasPendingAction}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("tag:create") ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Plus size={14} />
              )}
              Create tag
            </button>
          </form>
        </TaxonomyDrawer>
      ) : null}

      {selectedCategory ? (
        <TaxonomyDrawer
          title={selectedCategory.name}
          description="Update category naming, ordering, and active state from one focused panel."
          onClose={() => setDrawerState({ mode: "closed" })}
        >
          {(() => {
            const draft = getCategoryDraft(selectedCategory);

            return (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name">
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setEditingCategories((current) => ({
                          ...current,
                          [selectedCategory.id]: {
                            ...draft,
                            name: event.target.value,
                          },
                        }))
                      }
                      className={textInputClassName()}
                    />
                  </Field>
                  <Field label="Slug">
                    <input
                      value={draft.slug}
                      onChange={(event) =>
                        setEditingCategories((current) => ({
                          ...current,
                          [selectedCategory.id]: {
                            ...draft,
                            slug: event.target.value,
                          },
                        }))
                      }
                      className={textInputClassName()}
                    />
                  </Field>
                </div>

                <Field label="Sort order">
                  <input
                    type="number"
                    value={draft.sortOrder}
                    onChange={(event) =>
                      setEditingCategories((current) => ({
                        ...current,
                        [selectedCategory.id]: {
                          ...draft,
                          sortOrder: event.target.value,
                        },
                      }))
                    }
                    className={cn(textInputClassName(), "max-w-40")}
                  />
                </Field>

                <label className="flex items-center gap-2 text-xs font-black tracking-widest text-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary/20"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setEditingCategories((current) => ({
                        ...current,
                        [selectedCategory.id]: {
                          ...draft,
                          isActive: event.target.checked,
                        },
                      }))
                    }
                  />
                  Active
                </label>

                <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-muted-foreground">Live usage</span>
                    <span className="font-black text-foreground">
                      {categoryUsageCount.get(selectedCategory.id) ?? 0} tools
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveCategory(selectedCategory.id)}
                    disabled={hasPendingAction}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isActionPending(`category:${selectedCategory.id}:save`) ? (
                      <RefreshCw className="animate-spin" size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                    Save category
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteCategory(selectedCategory.id)}
                    disabled={hasPendingAction}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-black text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {isActionPending(`category:${selectedCategory.id}:delete`) ? (
                      <RefreshCw className="animate-spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            );
          })()}
        </TaxonomyDrawer>
      ) : null}

      {selectedTag ? (
        <TaxonomyDrawer
          title={selectedTag.name}
          description="Update tag naming and state from one focused panel."
          onClose={() => setDrawerState({ mode: "closed" })}
        >
          {(() => {
            const draft = getTagDraft(selectedTag);

            return (
              <div className="space-y-5">
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Name">
                    <input
                      value={draft.name}
                      onChange={(event) =>
                        setEditingTags((current) => ({
                          ...current,
                          [selectedTag.id]: {
                            ...draft,
                            name: event.target.value,
                          },
                        }))
                      }
                      className={textInputClassName()}
                    />
                  </Field>
                  <Field label="Slug">
                    <input
                      value={draft.slug}
                      onChange={(event) =>
                        setEditingTags((current) => ({
                          ...current,
                          [selectedTag.id]: {
                            ...draft,
                            slug: event.target.value,
                          },
                        }))
                      }
                      className={textInputClassName()}
                    />
                  </Field>
                </div>

                <label className="flex items-center gap-2 text-xs font-black tracking-widest text-foreground">
                  <input
                    type="checkbox"
                    className="rounded border-border text-primary focus:ring-primary/20"
                    checked={draft.isActive}
                    onChange={(event) =>
                      setEditingTags((current) => ({
                        ...current,
                        [selectedTag.id]: {
                          ...draft,
                          isActive: event.target.checked,
                        },
                      }))
                    }
                  />
                  Active
                </label>

                <div className="grid gap-3 rounded-2xl border border-border bg-card p-4 text-sm">
                  <div className="flex items-center justify-between gap-4">
                    <span className="font-semibold text-muted-foreground">Live usage</span>
                    <span className="font-black text-foreground">
                      {tagUsageCount.get(selectedTag.id) ?? 0} tools
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void handleSaveTag(selectedTag.id)}
                    disabled={hasPendingAction}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isActionPending(`tag:${selectedTag.id}:save`) ? (
                      <RefreshCw className="animate-spin" size={14} />
                    ) : (
                      <Save size={14} />
                    )}
                    Save tag
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDeleteTag(selectedTag.id)}
                    disabled={hasPendingAction}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-xs font-black text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    {isActionPending(`tag:${selectedTag.id}:delete`) ? (
                      <RefreshCw className="animate-spin" size={14} />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Delete
                  </button>
                </div>
              </div>
            );
          })()}
        </TaxonomyDrawer>
      ) : null}
    </SectionCard>
  );
}
