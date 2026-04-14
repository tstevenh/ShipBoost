"use client";

import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import { ImagePlus, PencilLine, Plus, RefreshCw, Upload } from "lucide-react";

import {
  Field,
  SectionCard,
  StatusChip,
  apiRequest,
  apiUpload,
  textInputClassName,
  toErrorMessage,
  type BlogArticle,
  type BlogAuthor,
  type BlogCategory,
  type BlogMediaUpload,
  type BlogTag,
} from "@/components/admin/admin-console-shared";
import {
  BlogTaxonomyPanel,
  type BlogCategoryDraft,
  type BlogTagDraft,
} from "@/components/admin/blog-taxonomy-panel";

type BlogArticleDraft = {
  title: string;
  slug: string;
  excerpt: string;
  markdownContent: string;
  authorId: string;
  primaryCategoryId: string;
  tagIds: string[];
  coverImageUrl: string;
  coverImagePublicId: string;
  coverImageAlt: string;
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogImageUrl: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
};

function emptyBlogCategoryDraft(): BlogCategoryDraft {
  return {
    name: "",
    slug: "",
    description: "",
    seoIntro: "",
    metaTitle: "",
    metaDescription: "",
    sortOrder: "0",
    isActive: true,
  };
}

function emptyBlogTagDraft(): BlogTagDraft {
  return {
    name: "",
    slug: "",
    description: "",
    metaTitle: "",
    metaDescription: "",
    isActive: true,
  };
}

function emptyBlogArticleDraft(authorId = "", categoryId = ""): BlogArticleDraft {
  return {
    title: "",
    slug: "",
    excerpt: "",
    markdownContent: "",
    authorId,
    primaryCategoryId: categoryId,
    tagIds: [],
    coverImageUrl: "",
    coverImagePublicId: "",
    coverImageAlt: "",
    metaTitle: "",
    metaDescription: "",
    canonicalUrl: "",
    ogImageUrl: "",
    status: "DRAFT",
  };
}

function articleStatusTone(status: BlogArticle["status"]) {
  if (status === "PUBLISHED") {
    return "green" as const;
  }

  if (status === "ARCHIVED") {
    return "slate" as const;
  }

  return "amber" as const;
}

export function BlogPanel() {
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [authors, setAuthors] = useState<BlogAuthor[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [tags, setTags] = useState<BlogTag[]>([]);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BlogArticleDraft>(emptyBlogArticleDraft());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | BlogArticle["status"]>("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [inlineMarkdownSnippet, setInlineMarkdownSnippet] = useState("");
  const [blogError, setBlogError] = useState<string | null>(null);
  const [taxonomyError, setTaxonomyError] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const deferredSearch = useDeferredValue(search);
  const [categoryDraft, setCategoryDraft] = useState<BlogCategoryDraft>(emptyBlogCategoryDraft);
  const [tagDraft, setTagDraft] = useState<BlogTagDraft>(emptyBlogTagDraft);
  const [editingCategories, setEditingCategories] = useState<Record<string, BlogCategoryDraft>>({});
  const [editingTags, setEditingTags] = useState<Record<string, BlogTagDraft>>({});

  const hasPendingAction = pendingAction !== null;

  function isActionPending(actionKey: string) {
    return pendingAction === actionKey;
  }

  function applyDefaults(nextAuthors: BlogAuthor[], nextCategories: BlogCategory[]) {
    setDraft((current) => ({
      ...current,
      authorId: current.authorId || nextAuthors[0]?.id || "",
      primaryCategoryId: current.primaryCategoryId || nextCategories[0]?.id || "",
    }));
  }

  async function refreshTaxonomy() {
    const [nextAuthors, nextCategories, nextTags] = await Promise.all([
      apiRequest<BlogAuthor[]>("/api/admin/blog/authors"),
      apiRequest<BlogCategory[]>("/api/admin/blog/categories"),
      apiRequest<BlogTag[]>("/api/admin/blog/tags"),
    ]);

    setAuthors(nextAuthors);
    setCategories(nextCategories);
    setTags(nextTags);
    applyDefaults(nextAuthors, nextCategories);
  }

  async function refreshArticles(
    nextSearch = deferredSearch,
    nextStatus = statusFilter,
    nextCategoryId = categoryFilter,
  ) {
    const params = new URLSearchParams();

    if (nextSearch.trim()) {
      params.set("search", nextSearch.trim());
    }

    if (nextStatus) {
      params.set("status", nextStatus);
    }

    if (nextCategoryId) {
      params.set("categoryId", nextCategoryId);
    }

    const nextArticles = await apiRequest<BlogArticle[]>(
      `/api/admin/blog/articles${params.toString() ? `?${params.toString()}` : ""}`,
    );

    setArticles(nextArticles);
  }

  async function selectArticle(articleId: string) {
    setPendingAction(`article:${articleId}:load`);
    setBlogError(null);

    try {
      const article = await apiRequest<BlogArticle>(`/api/admin/blog/articles/${articleId}`);
      setSelectedArticleId(article.id);
      setDraft({
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        markdownContent: article.markdownContent,
        authorId: article.author.id,
        primaryCategoryId: article.primaryCategory.id,
        tagIds: article.articleTags.map((item) => item.tag.id),
        coverImageUrl: article.coverImageUrl ?? "",
        coverImagePublicId: article.coverImagePublicId ?? "",
        coverImageAlt: article.coverImageAlt ?? "",
        metaTitle: article.metaTitle ?? "",
        metaDescription: article.metaDescription ?? "",
        canonicalUrl: article.canonicalUrl ?? "",
        ogImageUrl: article.ogImageUrl ?? "",
        status: article.status,
      });
    } catch (error) {
      setBlogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  const syncArticleSearch = useEffectEvent(
    async (
      nextSearch: string,
      nextStatus: "" | BlogArticle["status"],
      nextCategoryId: string,
    ) => {
      await refreshArticles(nextSearch, nextStatus, nextCategoryId);
    },
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [nextAuthors, nextCategories, nextTags, nextArticles] = await Promise.all([
          apiRequest<BlogAuthor[]>("/api/admin/blog/authors"),
          apiRequest<BlogCategory[]>("/api/admin/blog/categories"),
          apiRequest<BlogTag[]>("/api/admin/blog/tags"),
          apiRequest<BlogArticle[]>("/api/admin/blog/articles"),
        ]);

        if (cancelled) {
          return;
        }

        setAuthors(nextAuthors);
        setCategories(nextCategories);
        setTags(nextTags);
        setArticles(nextArticles);
        applyDefaults(nextAuthors, nextCategories);
      } catch (error) {
        if (!cancelled) {
          setBootError(toErrorMessage(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void syncArticleSearch(deferredSearch, statusFilter, categoryFilter);
  }, [categoryFilter, deferredSearch, statusFilter]);

  async function handleSaveArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (hasPendingAction) {
      return;
    }

    setBlogError(null);
    setPendingAction(selectedArticleId ? `article:${selectedArticleId}:save` : "article:create");

    try {
      if (selectedArticleId) {
        await apiRequest<BlogArticle>(`/api/admin/blog/articles/${selectedArticleId}`, {
          method: "PATCH",
          body: JSON.stringify({
            ...draft,
            coverImageUrl: draft.coverImageUrl || undefined,
            coverImagePublicId: draft.coverImagePublicId || undefined,
            coverImageAlt: draft.coverImageAlt || undefined,
            metaTitle: draft.metaTitle || undefined,
            metaDescription: draft.metaDescription || undefined,
            canonicalUrl: draft.canonicalUrl || undefined,
            ogImageUrl: draft.ogImageUrl || undefined,
          }),
        });
      } else {
        const article = await apiRequest<BlogArticle>("/api/admin/blog/articles", {
          method: "POST",
          body: JSON.stringify({
            ...draft,
            coverImageUrl: draft.coverImageUrl || undefined,
            coverImagePublicId: draft.coverImagePublicId || undefined,
            coverImageAlt: draft.coverImageAlt || undefined,
            metaTitle: draft.metaTitle || undefined,
            metaDescription: draft.metaDescription || undefined,
            canonicalUrl: draft.canonicalUrl || undefined,
            ogImageUrl: draft.ogImageUrl || undefined,
          }),
        });

        setSelectedArticleId(article.id);
      }

      await refreshArticles();
      if (selectedArticleId) {
        await selectArticle(selectedArticleId);
      }
    } catch (error) {
      setBlogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleUploadImage(file: File, kind: "blog-cover" | "blog-inline") {
    const formData = new FormData();
    formData.set("file", file);
    formData.set("kind", kind);

    return apiUpload<BlogMediaUpload>("/api/admin/blog/media", formData);
  }

  async function handleCoverUpload(file: File) {
    setPendingAction("article:cover-upload");
    setBlogError(null);

    try {
      const uploaded = await handleUploadImage(file, "blog-cover");
      setDraft((current) => ({
        ...current,
        coverImageUrl: uploaded.url,
        coverImagePublicId: uploaded.publicId,
        coverImageAlt: current.coverImageAlt || file.name.replace(/\.[^.]+$/, ""),
        ogImageUrl: current.ogImageUrl || uploaded.url,
      }));
    } catch (error) {
      setBlogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleInlineUpload(file: File) {
    setPendingAction("article:inline-upload");
    setBlogError(null);

    try {
      const uploaded = await handleUploadImage(file, "blog-inline");
      setInlineMarkdownSnippet(uploaded.markdown);
    } catch (error) {
      setBlogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaxonomyError(null);
    setPendingAction("blog-category:create");

    try {
      await apiRequest<BlogCategory>("/api/admin/blog/categories", {
        method: "POST",
        body: JSON.stringify({
          ...categoryDraft,
          sortOrder: Number(categoryDraft.sortOrder || "0"),
          description: categoryDraft.description || undefined,
          seoIntro: categoryDraft.seoIntro || undefined,
          metaTitle: categoryDraft.metaTitle || undefined,
          metaDescription: categoryDraft.metaDescription || undefined,
        }),
      });
      setCategoryDraft(emptyBlogCategoryDraft());
      await refreshTaxonomy();
    } catch (error) {
      setTaxonomyError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTaxonomyError(null);
    setPendingAction("blog-tag:create");

    try {
      await apiRequest<BlogTag>("/api/admin/blog/tags", {
        method: "POST",
        body: JSON.stringify({
          ...tagDraft,
          description: tagDraft.description || undefined,
          metaTitle: tagDraft.metaTitle || undefined,
          metaDescription: tagDraft.metaDescription || undefined,
        }),
      });
      setTagDraft(emptyBlogTagDraft());
      await refreshTaxonomy();
    } catch (error) {
      setTaxonomyError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveCategory(categoryId: string) {
    const value = editingCategories[categoryId];

    if (!value) {
      return;
    }

    setTaxonomyError(null);
    setPendingAction(`blog-category:${categoryId}:save`);

    try {
      await apiRequest<BlogCategory>(`/api/admin/blog/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...value,
          sortOrder: Number(value.sortOrder || "0"),
          description: value.description || undefined,
          seoIntro: value.seoIntro || undefined,
          metaTitle: value.metaTitle || undefined,
          metaDescription: value.metaDescription || undefined,
        }),
      });
      setEditingCategories((current) => {
        const next = { ...current };
        delete next[categoryId];
        return next;
      });
      await refreshTaxonomy();
    } catch (error) {
      setTaxonomyError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveTag(tagId: string) {
    const value = editingTags[tagId];

    if (!value) {
      return;
    }

    setTaxonomyError(null);
    setPendingAction(`blog-tag:${tagId}:save`);

    try {
      await apiRequest<BlogTag>(`/api/admin/blog/tags/${tagId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...value,
          description: value.description || undefined,
          metaTitle: value.metaTitle || undefined,
          metaDescription: value.metaDescription || undefined,
        }),
      });
      setEditingTags((current) => {
        const next = { ...current };
        delete next[tagId];
        return next;
      });
      await refreshTaxonomy();
    } catch (error) {
      setTaxonomyError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  if (bootError) {
    return (
      <div className="rounded-[2rem] border border-destructive/20 bg-destructive/10 p-8 text-xs font-bold tracking-widest text-destructive">
        {bootError}
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <SectionCard
        eyebrow="Blog CMS"
        title="Markdown Publishing Console"
        description="Paste AI-generated Markdown, upload images to Cloudinary, preview the article, then publish without redeploying."
      >
        {blogError ? (
          <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold tracking-widest text-destructive">
            {blogError}
          </div>
        ) : null}

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search article title or slug"
            className={textInputClassName()}
          />
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as "" | BlogArticle["status"])
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
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={textInputClassName()}
          >
            <option value="">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => {
              setSelectedArticleId(null);
              setDraft(emptyBlogArticleDraft(authors[0]?.id ?? "", categories[0]?.id ?? ""));
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black text-foreground transition hover:bg-muted"
          >
            <Plus size={14} />
            New article
          </button>
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
          <form onSubmit={handleSaveArticle} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title">
                <input
                  value={draft.title}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, title: event.target.value }))
                  }
                  className={textInputClassName()}
                  required
                />
              </Field>
              <Field label="Slug">
                <input
                  value={draft.slug}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>

            <Field label="Excerpt">
              <textarea
                value={draft.excerpt}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, excerpt: event.target.value }))
                }
                className={textInputClassName()}
                rows={3}
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Author">
                <select
                  value={draft.authorId}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, authorId: event.target.value }))
                  }
                  className={textInputClassName()}
                >
                  {authors.map((author) => (
                    <option key={author.id} value={author.id}>
                      {author.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Primary category">
                <select
                  value={draft.primaryCategoryId}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      primaryCategoryId: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Status">
                <select
                  value={draft.status}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      status: event.target.value as BlogArticle["status"],
                    }))
                  }
                  className={textInputClassName()}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </Field>
            </div>

            <Field label="Tags" hint="Choose the supporting themes for the archive pages">
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = draft.tagIds.includes(tag.id);

                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setDraft((current) => ({
                          ...current,
                          tagIds: isSelected
                            ? current.tagIds.filter((id) => id !== tag.id)
                            : [...current.tagIds, tag.id],
                        }))
                      }
                      className={`rounded-full border px-3 py-2 text-xs font-black tracking-wide transition ${
                        isSelected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Markdown body">
              <textarea
                value={draft.markdownContent}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    markdownContent: event.target.value,
                  }))
                }
                className={textInputClassName()}
                rows={20}
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Cover image">
                <div className="space-y-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black text-foreground transition hover:bg-muted">
                    <ImagePlus size={14} />
                    Upload cover image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleCoverUpload(file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {draft.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={draft.coverImageUrl}
                      alt={draft.coverImageAlt || draft.title || "Blog cover"}
                      className="h-40 w-full rounded-2xl border border-border object-cover"
                    />
                  ) : null}
                </div>
              </Field>
              <Field label="Inline image upload">
                <div className="space-y-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black text-foreground transition hover:bg-muted">
                    <Upload size={14} />
                    Upload inline image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) {
                          void handleInlineUpload(file);
                        }
                        event.currentTarget.value = "";
                      }}
                    />
                  </label>
                  {inlineMarkdownSnippet ? (
                    <div className="rounded-2xl border border-border bg-muted/30 p-4">
                      <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                        Markdown snippet
                      </p>
                      <code className="mt-2 block break-all text-xs font-bold text-foreground">
                        {inlineMarkdownSnippet}
                      </code>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            markdownContent: `${current.markdownContent}\n\n${inlineMarkdownSnippet}\n`,
                          }))
                        }
                        className="mt-3 rounded-lg border border-border px-3 py-2 text-[11px] font-black text-foreground transition hover:bg-background"
                      >
                        Insert into body
                      </button>
                    </div>
                  ) : null}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Cover image alt">
                <input
                  value={draft.coverImageAlt}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      coverImageAlt: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
              <Field label="SEO title">
                <input
                  value={draft.metaTitle}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, metaTitle: event.target.value }))
                  }
                  className={textInputClassName()}
                />
              </Field>
              <Field label="SEO description">
                <input
                  value={draft.metaDescription}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      metaDescription: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Canonical URL override">
                <input
                  value={draft.canonicalUrl}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      canonicalUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
              <Field label="OG image URL override">
                <input
                  value={draft.ogImageUrl}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, ogImageUrl: event.target.value }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={hasPendingAction}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
              >
                {pendingAction ? <RefreshCw className="animate-spin" size={14} /> : <PencilLine size={14} />}
                {selectedArticleId ? "Save article" : "Create article"}
              </button>
              {selectedArticleId ? (
                <Link
                  href={`/admin/blog/${selectedArticleId}/preview`}
                  target="_blank"
                  className="rounded-xl border border-border px-5 py-3 text-xs font-black text-foreground transition hover:bg-muted"
                >
                  Preview article
                </Link>
              ) : null}
            </div>
          </form>

          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-sm font-black tracking-tight text-foreground">
                Articles
              </h3>
              <div className="mt-4 space-y-3">
                {articles.map((article) => (
                  <button
                    key={article.id}
                    type="button"
                    onClick={() => void selectArticle(article.id)}
                    className="w-full rounded-2xl border border-border bg-background px-4 py-4 text-left transition hover:bg-muted"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-2">
                        <p className="text-sm font-black text-foreground">{article.title}</p>
                        <p className="text-xs font-medium text-muted-foreground">{article.slug}</p>
                      </div>
                      <StatusChip label={article.status} tone={articleStatusTone(article.status)} />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </SectionCard>

      <BlogTaxonomyPanel
        categories={categories}
        tags={tags}
        categoryDraft={categoryDraft}
        setCategoryDraft={setCategoryDraft}
        tagDraft={tagDraft}
        setTagDraft={setTagDraft}
        editingCategories={editingCategories}
        setEditingCategories={setEditingCategories}
        editingTags={editingTags}
        setEditingTags={setEditingTags}
        error={taxonomyError}
        onCreateCategory={handleCreateCategory}
        onCreateTag={handleCreateTag}
        onSaveCategory={handleSaveCategory}
        onSaveTag={handleSaveTag}
        hasPendingAction={hasPendingAction}
        isActionPending={isActionPending}
      />
    </div>
  );
}
