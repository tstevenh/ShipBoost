import type { Dispatch, FormEvent, SetStateAction } from "react";
import { RefreshCw, Save } from "lucide-react";

import {
  Field,
  SectionCard,
  textInputClassName,
  type BlogCategory,
  type BlogTag,
} from "@/components/admin/admin-console-shared";
import { cn } from "@/lib/utils";

export type BlogCategoryDraft = {
  name: string;
  slug: string;
  description: string;
  seoIntro: string;
  metaTitle: string;
  metaDescription: string;
  sortOrder: string;
  isActive: boolean;
};

export type BlogTagDraft = {
  name: string;
  slug: string;
  description: string;
  metaTitle: string;
  metaDescription: string;
  isActive: boolean;
};

export function BlogTaxonomyPanel({
  categories,
  tags,
  categoryDraft,
  setCategoryDraft,
  tagDraft,
  setTagDraft,
  editingCategories,
  setEditingCategories,
  editingTags,
  setEditingTags,
  error,
  onCreateCategory,
  onCreateTag,
  onSaveCategory,
  onSaveTag,
  hasPendingAction,
  isActionPending,
}: {
  categories: BlogCategory[];
  tags: BlogTag[];
  categoryDraft: BlogCategoryDraft;
  setCategoryDraft: Dispatch<SetStateAction<BlogCategoryDraft>>;
  tagDraft: BlogTagDraft;
  setTagDraft: Dispatch<SetStateAction<BlogTagDraft>>;
  editingCategories: Record<string, BlogCategoryDraft>;
  setEditingCategories: Dispatch<SetStateAction<Record<string, BlogCategoryDraft>>>;
  editingTags: Record<string, BlogTagDraft>;
  setEditingTags: Dispatch<SetStateAction<Record<string, BlogTagDraft>>>;
  error: string | null;
  onCreateCategory: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onCreateTag: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onSaveCategory: (categoryId: string) => void | Promise<void>;
  onSaveTag: (tagId: string) => void | Promise<void>;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  return (
    <SectionCard
      eyebrow="Blog taxonomy"
      title="Category and Tag Controls"
      description="Keep blog categories and tags narrow enough to stay useful as public archive pages."
    >
      {error ? (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold tracking-widest text-destructive">
          {error}
        </div>
      ) : null}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <form
            onSubmit={onCreateCategory}
            className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5"
          >
            <h3 className="text-xs font-black tracking-widest text-foreground">
              Create blog category
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={categoryDraft.name}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className={textInputClassName()}
                  required
                />
              </Field>
              <Field label="Slug">
                <input
                  value={categoryDraft.slug}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>
            <Field label="Intro">
              <textarea
                value={categoryDraft.seoIntro}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    seoIntro: event.target.value,
                  }))
                }
                className={textInputClassName()}
                rows={3}
              />
            </Field>
            <div className="flex flex-wrap items-center gap-4">
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
                  className={cn(textInputClassName(), "w-24")}
                />
              </Field>
              <label className="mt-6 flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground">
                <input
                  type="checkbox"
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
            </div>
            <button
              type="submit"
              disabled={hasPendingAction}
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("blog-category:create") ? "Saving..." : "Create category"}
            </button>
          </form>

          <div className="space-y-3">
            {categories.map((category) => {
              const draft =
                editingCategories[category.id] ?? {
                  name: category.name,
                  slug: category.slug,
                  description: category.description ?? "",
                  seoIntro: category.seoIntro ?? "",
                  metaTitle: category.metaTitle ?? "",
                  metaDescription: category.metaDescription ?? "",
                  sortOrder: String(category.sortOrder),
                  isActive: category.isActive,
                };

              return (
                <article key={category.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setEditingCategories((current) => ({
                            ...current,
                            [category.id]: { ...draft, name: event.target.value },
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
                            [category.id]: { ...draft, slug: event.target.value },
                          }))
                        }
                        className={textInputClassName()}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(event) =>
                          setEditingCategories((current) => ({
                            ...current,
                            [category.id]: {
                              ...draft,
                              isActive: event.target.checked,
                            },
                          }))
                        }
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => void onSaveCategory(category.id)}
                      disabled={hasPendingAction}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-black text-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                      {isActionPending(`blog-category:${category.id}:save`) ? (
                        <RefreshCw className="animate-spin" size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      Save
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={onCreateTag}
            className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5"
          >
            <h3 className="text-xs font-black tracking-widest text-foreground">
              Create blog tag
            </h3>
            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={tagDraft.name}
                  onChange={(event) =>
                    setTagDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className={textInputClassName()}
                  required
                />
              </Field>
              <Field label="Slug">
                <input
                  value={tagDraft.slug}
                  onChange={(event) =>
                    setTagDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground">
              <input
                type="checkbox"
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
              className="w-full rounded-xl bg-primary px-4 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("blog-tag:create") ? "Saving..." : "Create tag"}
            </button>
          </form>

          <div className="space-y-3">
            {tags.map((tag) => {
              const draft =
                editingTags[tag.id] ?? {
                  name: tag.name,
                  slug: tag.slug,
                  description: tag.description ?? "",
                  metaTitle: tag.metaTitle ?? "",
                  metaDescription: tag.metaDescription ?? "",
                  isActive: tag.isActive,
                };

              return (
                <article key={tag.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field label="Name">
                      <input
                        value={draft.name}
                        onChange={(event) =>
                          setEditingTags((current) => ({
                            ...current,
                            [tag.id]: { ...draft, name: event.target.value },
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
                            [tag.id]: { ...draft, slug: event.target.value },
                          }))
                        }
                        className={textInputClassName()}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-[10px] font-black tracking-widest text-foreground">
                      <input
                        type="checkbox"
                        checked={draft.isActive}
                        onChange={(event) =>
                          setEditingTags((current) => ({
                            ...current,
                            [tag.id]: {
                              ...draft,
                              isActive: event.target.checked,
                            },
                          }))
                        }
                      />
                      Active
                    </label>
                    <button
                      type="button"
                      onClick={() => void onSaveTag(tag.id)}
                      disabled={hasPendingAction}
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-black text-foreground transition hover:bg-muted disabled:opacity-50"
                    >
                      {isActionPending(`blog-tag:${tag.id}:save`) ? (
                        <RefreshCw className="animate-spin" size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      Save
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
