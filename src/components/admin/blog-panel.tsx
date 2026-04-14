"use client";

import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  FilePenLine,
  FolderTree,
  ImagePlus,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
  Upload,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

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

type BlogSubview = "editor" | "taxonomy";

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

function slugifyDraft(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function coerceSeoDescription(value: string) {
  return value.trim().slice(0, 160);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function articleMatches(
  article: BlogArticle,
  search: string,
  status: "" | BlogArticle["status"],
  categoryId: string,
) {
  const normalizedSearch = search.trim().toLowerCase();

  if (status && article.status !== status) {
    return false;
  }

  if (categoryId && article.primaryCategory.id !== categoryId) {
    return false;
  }

  if (!normalizedSearch) {
    return true;
  }

  return [article.title, article.slug, article.excerpt].some((value) =>
    value.toLowerCase().includes(normalizedSearch),
  );
}

export function BlogPanel() {
  const [subview, setSubview] = useState<BlogSubview>("editor");
  const [isRailCollapsed, setIsRailCollapsed] = useState(false);
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
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [metaTitleManuallyEdited, setMetaTitleManuallyEdited] = useState(false);
  const [metaDescriptionManuallyEdited, setMetaDescriptionManuallyEdited] =
    useState(false);
  const deferredSearch = useDeferredValue(search);
  const [categoryDraft, setCategoryDraft] = useState<BlogCategoryDraft>(
    emptyBlogCategoryDraft,
  );
  const [tagDraft, setTagDraft] = useState<BlogTagDraft>(emptyBlogTagDraft);
  const [editingCategories, setEditingCategories] = useState<
    Record<string, BlogCategoryDraft>
  >({});
  const [editingTags, setEditingTags] = useState<Record<string, BlogTagDraft>>(
    {},
  );

  const hasPendingAction = pendingAction !== null;
  const selectedArticle =
    articles.find((article) => article.id === selectedArticleId) ?? null;

  function isActionPending(actionKey: string) {
    return pendingAction === actionKey;
  }

  function resetDraft(nextAuthorId: string, nextCategoryId: string) {
    setSelectedArticleId(null);
    setDraft(emptyBlogArticleDraft(nextAuthorId, nextCategoryId));
    setInlineMarkdownSnippet("");
    setSlugManuallyEdited(false);
    setMetaTitleManuallyEdited(false);
    setMetaDescriptionManuallyEdited(false);
  }

  function applyDefaults(nextAuthors: BlogAuthor[], nextCategories: BlogCategory[]) {
    setDraft((current) => ({
      ...current,
      authorId: current.authorId || nextAuthors[0]?.id || "",
      primaryCategoryId: current.primaryCategoryId || nextCategories[0]?.id || "",
    }));
  }

  function applyArticleToDraft(article: BlogArticle) {
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
    setSlugManuallyEdited(true);
    setMetaTitleManuallyEdited(Boolean(article.metaTitle));
    setMetaDescriptionManuallyEdited(Boolean(article.metaDescription));
    setSubview("editor");
  }

  function updateTitle(value: string) {
    setDraft((current) => ({
      ...current,
      title: value,
      slug: slugManuallyEdited ? current.slug : slugifyDraft(value),
      metaTitle: metaTitleManuallyEdited ? current.metaTitle : value,
    }));
  }

  function updateExcerpt(value: string) {
    setDraft((current) => ({
      ...current,
      excerpt: value,
      metaDescription: metaDescriptionManuallyEdited
        ? current.metaDescription
        : coerceSeoDescription(value),
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
      const article = await apiRequest<BlogArticle>(
        `/api/admin/blog/articles/${articleId}`,
      );
      applyArticleToDraft(article);
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
        const [nextAuthors, nextCategories, nextTags, nextArticles] =
          await Promise.all([
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

  async function persistArticle(nextStatus?: BlogArticle["status"]) {
    if (hasPendingAction) {
      return;
    }

    setBlogError(null);
    setPendingAction(
      selectedArticleId
        ? `article:${selectedArticleId}:save`
        : "article:create",
    );

    try {
      const payload = {
        ...draft,
        status: nextStatus ?? draft.status,
        coverImageUrl: draft.coverImageUrl || undefined,
        coverImagePublicId: draft.coverImagePublicId || undefined,
        coverImageAlt: draft.coverImageAlt || undefined,
        metaTitle: draft.metaTitle || undefined,
        metaDescription: draft.metaDescription || undefined,
        canonicalUrl: draft.canonicalUrl || undefined,
        ogImageUrl: draft.ogImageUrl || undefined,
      };

      const article = selectedArticleId
        ? await apiRequest<BlogArticle>(`/api/admin/blog/articles/${selectedArticleId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          })
        : await apiRequest<BlogArticle>("/api/admin/blog/articles", {
            method: "POST",
            body: JSON.stringify(payload),
          });

      applyArticleToDraft(article);
      await refreshArticles();
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
        coverImageAlt:
          current.coverImageAlt || file.name.replace(/\.[^.]+$/, ""),
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

  const filteredArticles = articles.filter((article) =>
    articleMatches(article, deferredSearch, statusFilter, categoryFilter),
  );

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
        eyebrow="Blog workspace"
        title="Editorial Publishing Desk"
        description="Write in the center, manage publishing from the sidebar, and keep taxonomy maintenance separate from the editor."
      >
        <div className="mb-8 flex flex-wrap items-center gap-3 border-b border-border pb-6">
          {[
            { id: "editor", label: "Editor", icon: FilePenLine },
            { id: "taxonomy", label: "Blog Taxonomy", icon: FolderTree },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSubview(item.id as BlogSubview)}
              className={cn(
                "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-black tracking-[0.16em] transition-all",
                subview === item.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-black/10"
                  : "border border-border text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={14} />
              {item.label}
            </button>
          ))}
        </div>

        {subview === "editor" ? (
          <>
            {blogError ? (
              <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold tracking-widest text-destructive">
                {blogError}
              </div>
            ) : null}

            <div className="sticky top-4 z-20 mb-6 rounded-[1.75rem] border border-border bg-card/95 p-4 shadow-xl shadow-black/5 backdrop-blur">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <StatusChip
                      label={draft.status}
                      tone={articleStatusTone(draft.status)}
                    />
                    <span className="text-[11px] font-black tracking-[0.18em] text-foreground/45">
                      {selectedArticle ? `Last updated ${formatDate(selectedArticle.updatedAt)}` : "New article"}
                    </span>
                  </div>
                  <p className="text-lg font-black tracking-tight text-foreground">
                    {draft.title || "Untitled article"}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={() =>
                      resetDraft(authors[0]?.id ?? "", categories[0]?.id ?? "")
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-black text-foreground transition hover:bg-muted"
                  >
                    <Plus size={14} />
                    New draft
                  </button>
                  <button
                    type="button"
                    onClick={() => void persistArticle("DRAFT")}
                    disabled={hasPendingAction}
                    className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-black text-foreground transition hover:bg-muted disabled:opacity-50"
                  >
                    {pendingAction ? <RefreshCw className="animate-spin" size={14} /> : <Save size={14} />}
                    Save draft
                  </button>
                  {selectedArticleId ? (
                    <Link
                      href={`/admin/blog/${selectedArticleId}/preview`}
                      target="_blank"
                      className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-xs font-black text-foreground transition hover:bg-muted"
                    >
                      <Eye size={14} />
                      Preview
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void persistArticle("PUBLISHED")}
                    disabled={hasPendingAction}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
                  >
                    {pendingAction ? <RefreshCw className="animate-spin" size={14} /> : <PencilLine size={14} />}
                    {selectedArticleId ? "Publish update" : "Publish article"}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(96px,240px)_minmax(0,1fr)_320px]">
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
                    onClick={() => setIsRailCollapsed((current) => !current)}
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
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="Search title or slug"
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
                  </div>
                ) : null}

                <div className="space-y-2">
                  {filteredArticles.map((article) => (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => void selectArticle(article.id)}
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

              <section className="space-y-5 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
                <div className="space-y-4">
                  <textarea
                    value={draft.title}
                    onChange={(event) => updateTitle(event.target.value)}
                    placeholder="Add title"
                    className="min-h-[84px] w-full resize-none border-0 bg-transparent text-4xl font-black tracking-tight text-foreground outline-none placeholder:text-foreground/30 sm:text-5xl"
                    rows={2}
                  />
                  <textarea
                    value={draft.excerpt}
                    onChange={(event) => updateExcerpt(event.target.value)}
                    placeholder="Write a short summary for the blog index, social cards, and SERP copy."
                    className="min-h-[96px] w-full rounded-[1.25rem] border border-border bg-muted/20 px-4 py-4 text-base leading-relaxed text-foreground outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5 placeholder:text-muted-foreground/60"
                    rows={3}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3 rounded-[1.25rem] border border-border bg-muted/20 px-4 py-3">
                  <span className="text-[11px] font-black tracking-[0.18em] text-foreground/45">
                    Editor tools
                  </span>
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-black text-foreground transition hover:bg-background">
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
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        markdownContent: `${current.markdownContent}\n\n## New section\n\n`,
                      }))
                    }
                    className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-black text-foreground transition hover:bg-background"
                  >
                    Insert H2
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setDraft((current) => ({
                        ...current,
                        markdownContent: `${current.markdownContent}\n\n- Point one\n- Point two\n- Point three\n`,
                      }))
                    }
                    className="rounded-xl border border-border bg-card px-3 py-2 text-[11px] font-black text-foreground transition hover:bg-background"
                  >
                    Insert list
                  </button>
                </div>

                {inlineMarkdownSnippet ? (
                  <div className="rounded-[1.25rem] border border-border bg-muted/20 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-[10px] font-black tracking-[0.22em] text-foreground/45">
                          Uploaded image snippet
                        </p>
                        <code className="mt-2 block break-all text-xs font-bold text-foreground">
                          {inlineMarkdownSnippet}
                        </code>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            markdownContent: `${current.markdownContent}\n\n${inlineMarkdownSnippet}\n`,
                          }))
                        }
                        className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-black text-foreground transition hover:bg-background"
                      >
                        Insert into body
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-[1.5rem] border border-border bg-background">
                  <div className="border-b border-border px-5 py-3">
                    <p className="text-[11px] font-black tracking-[0.18em] text-foreground/45">
                      Markdown body
                    </p>
                  </div>
                  <textarea
                    value={draft.markdownContent}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        markdownContent: event.target.value,
                      }))
                    }
                    className="min-h-[720px] w-full resize-y border-0 bg-transparent px-5 py-5 font-mono text-sm leading-7 text-foreground outline-none placeholder:text-muted-foreground/60"
                    placeholder="Paste your AI-generated Markdown here."
                    required
                  />
                </div>
              </section>

              <aside className="space-y-5">
                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-[10px] font-black tracking-[0.24em] text-foreground/40">
                    Publish
                  </p>
                  <div className="mt-4 space-y-4">
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
                    <Field label="Slug">
                      <input
                        value={draft.slug}
                        onChange={(event) => {
                          setSlugManuallyEdited(true);
                          setDraft((current) => ({
                            ...current,
                            slug: event.target.value,
                          }));
                        }}
                        className={textInputClassName()}
                      />
                    </Field>
                    <div className="grid gap-3 rounded-[1.25rem] border border-border bg-muted/20 p-4 text-xs font-bold text-muted-foreground">
                      <div className="flex items-center justify-between gap-4">
                        <span>Created</span>
                        <span>{selectedArticle ? formatDate(selectedArticle.updatedAt) : "Not saved"}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <span>Published</span>
                        <span>{selectedArticle ? formatDate(selectedArticle.publishedAt) : "Not published"}</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-[10px] font-black tracking-[0.24em] text-foreground/40">
                    Taxonomy
                  </p>
                  <div className="mt-4 space-y-4">
                    <Field label="Author">
                      <select
                        value={draft.authorId}
                        onChange={(event) =>
                          setDraft((current) => ({
                            ...current,
                            authorId: event.target.value,
                          }))
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
                    <Field label="Tags">
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
                              className={cn(
                                "rounded-full border px-3 py-2 text-[11px] font-black tracking-wide transition",
                                isSelected
                                  ? "border-primary bg-primary text-primary-foreground"
                                  : "border-border text-muted-foreground hover:text-foreground",
                              )}
                            >
                              {tag.name}
                            </button>
                          );
                        })}
                      </div>
                    </Field>
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-[10px] font-black tracking-[0.24em] text-foreground/40">
                    Featured image
                  </p>
                  <div className="mt-4 space-y-4">
                    <label className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-border px-4 py-3 text-xs font-black text-foreground transition hover:bg-muted">
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
                        className="h-44 w-full rounded-[1.25rem] border border-border object-cover"
                      />
                    ) : (
                      <div className="rounded-[1.25rem] border border-dashed border-border bg-muted/20 px-4 py-8 text-center text-xs font-bold text-muted-foreground">
                        No cover image uploaded yet.
                      </div>
                    )}
                    <Field label="Alt text">
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
                  </div>
                </section>

                <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
                  <p className="text-[10px] font-black tracking-[0.24em] text-foreground/40">
                    SEO
                  </p>
                  <div className="mt-4 space-y-4">
                    <Field label="SEO title">
                      <input
                        value={draft.metaTitle}
                        onChange={(event) => {
                          setMetaTitleManuallyEdited(true);
                          setDraft((current) => ({
                            ...current,
                            metaTitle: event.target.value,
                          }));
                        }}
                        className={textInputClassName()}
                      />
                    </Field>
                    <Field label="SEO description">
                      <textarea
                        value={draft.metaDescription}
                        onChange={(event) => {
                          setMetaDescriptionManuallyEdited(true);
                          setDraft((current) => ({
                            ...current,
                            metaDescription: event.target.value,
                          }));
                        }}
                        className={textInputClassName()}
                        rows={4}
                      />
                    </Field>
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
                          setDraft((current) => ({
                            ...current,
                            ogImageUrl: event.target.value,
                          }))
                        }
                        className={textInputClassName()}
                      />
                    </Field>
                  </div>
                </section>
              </aside>
            </div>
          </>
        ) : (
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
        )}
      </SectionCard>
    </div>
  );
}
