import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Plus, Save, Trash2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Field,
  SectionCard,
  pendingSpinnerClassName,
  textInputClassName,
  type Category,
  type CategoryDraft,
  type Tag,
  type TagDraft,
} from "@/components/admin/admin-console-shared";

export function CatalogPanel({
  categories,
  tags,
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
  categoryDraft: CategoryDraft;
  setCategoryDraft: Dispatch<SetStateAction<CategoryDraft>>;
  tagDraft: TagDraft;
  setTagDraft: Dispatch<SetStateAction<TagDraft>>;
  setEditingCategories: Dispatch<SetStateAction<Record<string, CategoryDraft>>>;
  setEditingTags: Dispatch<SetStateAction<Record<string, TagDraft>>>;
  catalogError: string | null;
  handleCreateCategory: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleCreateTag: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleSaveCategory: (categoryId: string) => void | Promise<void>;
  handleDeleteCategory: (categoryId: string) => void | Promise<void>;
  handleSaveTag: (tagId: string) => void | Promise<void>;
  handleDeleteTag: (tagId: string) => void | Promise<void>;
  getCategoryDraft: (category: Category) => CategoryDraft;
  getTagDraft: (tag: Tag) => TagDraft;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  return (
    <SectionCard
      eyebrow="Catalog"
      title="Taxonomy Management"
      description="Keep the taxonomy narrow and intentional."
    >
      {catalogError && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold text-destructive uppercase tracking-widest">
          {catalogError}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Categories Section */}
        <div className="space-y-6">
          <form
            onSubmit={handleCreateCategory}
            className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5"
          >
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Create Category</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={categoryDraft.name}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({ ...current, name: event.target.value }))
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
                    setCategoryDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={textInputClassName()}
                  placeholder="analytics"
                />
              </Field>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Field label="Sort">
                <input
                  type="number"
                  value={categoryDraft.sortOrder}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      sortOrder: event.target.value,
                    }))
                  }
                  className={cn(textInputClassName(), "w-20")}
                />
              </Field>
              <label className="mt-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground cursor-pointer">
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
            </div>
            <button
              type="submit"
              disabled={hasPendingAction}
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("category:create") ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Plus size={14} />
              )}
              Create Category
            </button>
          </form>

          <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {categories.map((category) => {
              const draft = getCategoryDraft(category);

              return (
                <article
                  key={category.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
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
                        className={cn(textInputClassName(), "text-xs py-2")}
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
                        className={cn(textInputClassName(), "text-xs py-2")}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <Field label="Order">
                        <input
                          type="number"
                          value={draft.sortOrder}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: {
                                ...draft,
                                sortOrder: event.target.value,
                              },
                            }))
                          }
                          className={cn(textInputClassName(), "w-16 text-xs py-1")}
                        />
                      </Field>
                      <label className="mt-5 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground cursor-pointer">
                        <input
                          type="checkbox"
                          className="rounded border-border text-primary focus:ring-primary/20"
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
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveCategory(category.id)}
                        disabled={hasPendingAction}
                        className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-all disabled:opacity-50"
                        title="Save"
                      >
                        {isActionPending(`category:${category.id}:save`) ? (
                          <RefreshCw className="animate-spin" size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(category.id)}
                        disabled={hasPendingAction}
                        className="p-2 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {isActionPending(`category:${category.id}:delete`) ? (
                          <RefreshCw className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        {/* Tags Section */}
        <div className="space-y-6">
          <form
            onSubmit={handleCreateTag}
            className="space-y-4 rounded-2xl border border-border bg-muted/20 p-5"
          >
            <div className="space-y-1">
              <h3 className="text-xs font-black uppercase tracking-widest text-foreground">Create Tag</h3>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Name">
                <input
                  value={tagDraft.name}
                  onChange={(event) =>
                    setTagDraft((current) => ({ ...current, name: event.target.value }))
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
                    setTagDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={textInputClassName()}
                  placeholder="ai-powered"
                />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground cursor-pointer">
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
              className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
            >
              {isActionPending("tag:create") ? (
                <RefreshCw className="animate-spin" size={14} />
              ) : (
                <Plus size={14} />
              )}
              Create Tag
            </button>
          </form>

          <div className="grid gap-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {tags.map((tag) => {
              const draft = getTagDraft(tag);

              return (
                <article
                  key={tag.id}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
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
                        className={cn(textInputClassName(), "text-xs py-2")}
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
                        className={cn(textInputClassName(), "text-xs py-2")}
                      />
                    </Field>
                  </div>
                  <div className="mt-3 flex items-center justify-between gap-4">
                    <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary/20"
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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void handleSaveTag(tag.id)}
                        disabled={hasPendingAction}
                        className="p-2 rounded-lg border border-border bg-card text-foreground hover:bg-muted transition-all disabled:opacity-50"
                        title="Save"
                      >
                        {isActionPending(`tag:${tag.id}:save`) ? (
                          <RefreshCw className="animate-spin" size={14} />
                        ) : (
                          <Save size={14} />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTag(tag.id)}
                        disabled={hasPendingAction}
                        className="p-2 rounded-lg border border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-all disabled:opacity-50"
                        title="Delete"
                      >
                        {isActionPending(`tag:${tag.id}:delete`) ? (
                          <RefreshCw className="animate-spin" size={14} />
                        ) : (
                          <Trash2 size={14} />
                        )}
                      </button>
                    </div>
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
