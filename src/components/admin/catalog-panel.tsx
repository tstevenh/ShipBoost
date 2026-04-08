import type { Dispatch, FormEvent, SetStateAction } from "react";

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
      title="Edit categories and tags"
      description="Keep the taxonomy narrow and intentional so the directory doesn’t turn into a generic dump."
    >
      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-6">
          <form
            onSubmit={handleCreateCategory}
            className="space-y-4 rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5"
          >
            <h3 className="text-lg font-semibold text-black">Create category</h3>
            <div className="grid gap-4 md:grid-cols-2">
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
            <Field label="Description">
              <textarea
                value={categoryDraft.description}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className={textInputClassName()}
              />
            </Field>
            <Field label="SEO intro">
              <textarea
                value={categoryDraft.seoIntro}
                onChange={(event) =>
                  setCategoryDraft((current) => ({
                    ...current,
                    seoIntro: event.target.value,
                  }))
                }
                rows={2}
                className={textInputClassName()}
              />
            </Field>
            <div className="flex items-center gap-4">
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
                  className={textInputClassName()}
                />
              </Field>
              <label className="mt-7 flex items-center gap-3 text-sm text-black/70">
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isActionPending("category:create") ? (
                <>
                  <span className={pendingSpinnerClassName()} />
                  Saving category...
                </>
              ) : (
                "Save category"
              )}
            </button>
          </form>

          <div className="space-y-4">
            {categories.map((category) => {
              const draft = getCategoryDraft(category);

              return (
                <article
                  key={category.id}
                  className="rounded-[1.75rem] border border-black/10 bg-white p-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                    <Field label="Description">
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          setEditingCategories((current) => ({
                            ...current,
                            [category.id]: {
                              ...draft,
                              description: event.target.value,
                            },
                          }))
                        }
                        rows={3}
                        className={textInputClassName()}
                      />
                    </Field>
                    <div className="space-y-4">
                      <Field label="Sort order">
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
                          className={textInputClassName()}
                        />
                      </Field>
                      <label className="flex items-center gap-3 text-sm text-black/70">
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
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSaveCategory(category.id)}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`category:${category.id}:save`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(category.id)}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`category:${category.id}:delete`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <form
            onSubmit={handleCreateTag}
            className="space-y-4 rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5"
          >
            <h3 className="text-lg font-semibold text-black">Create tag</h3>
            <div className="grid gap-4 md:grid-cols-2">
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
            <Field label="Description">
              <textarea
                value={tagDraft.description}
                onChange={(event) =>
                  setTagDraft((current) => ({
                    ...current,
                    description: event.target.value,
                  }))
                }
                rows={3}
                className={textInputClassName()}
              />
            </Field>
            <label className="flex items-center gap-3 text-sm text-black/70">
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
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isActionPending("tag:create") ? (
                <>
                  <span className={pendingSpinnerClassName()} />
                  Saving tag...
                </>
              ) : (
                "Save tag"
              )}
            </button>
          </form>

          {catalogError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {catalogError}
            </div>
          ) : null}

          <div className="space-y-4">
            {tags.map((tag) => {
              const draft = getTagDraft(tag);

              return (
                <article
                  key={tag.id}
                  className="rounded-[1.75rem] border border-black/10 bg-white p-5"
                >
                  <div className="grid gap-4 md:grid-cols-2">
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
                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                    <Field label="Description">
                      <textarea
                        value={draft.description}
                        onChange={(event) =>
                          setEditingTags((current) => ({
                            ...current,
                            [tag.id]: {
                              ...draft,
                              description: event.target.value,
                            },
                          }))
                        }
                        rows={3}
                        className={textInputClassName()}
                      />
                    </Field>
                    <label className="mt-7 flex items-center gap-3 text-sm text-black/70">
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
                  </div>
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => void handleSaveTag(tag.id)}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`tag:${tag.id}:save`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Saving...
                        </>
                      ) : (
                        "Save"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTag(tag.id)}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`tag:${tag.id}:delete`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Deleting...
                        </>
                      ) : (
                        "Delete"
                      )}
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
