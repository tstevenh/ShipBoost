"use client";

import { useDeferredValue, useEffect, useEffectEvent, useState } from "react";
import Link from "next/link";
import {
  Eye,
  FilePenLine,
  FolderTree,
  PencilLine,
  Plus,
  RefreshCw,
  Save,
} from "lucide-react";

import {
  SectionCard,
  StatusChip,
  apiRequest,
  apiUpload,
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
import { BlogArticleEditor } from "@/components/admin/blog/blog-article-editor";
import { BlogArticleList } from "@/components/admin/blog/blog-article-list";
import {
  articleMatches,
  articleStatusTone,
  emptyBlogArticleDraft,
  formatDate,
  type BlogArticleDraft,
} from "@/components/admin/blog/types";
import { cn } from "@/lib/utils";

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

            <div className="grid gap-6 xl:grid-cols-[minmax(96px,240px)_minmax(0,1fr)]">
              <BlogArticleList
                articles={filteredArticles}
                categories={categories}
                selectedArticleId={selectedArticleId}
                onSelectArticle={selectArticle}
                search={search}
                onSearchChange={setSearch}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                categoryFilter={categoryFilter}
                onCategoryFilterChange={setCategoryFilter}
                isRailCollapsed={isRailCollapsed}
                onToggleRail={() => setIsRailCollapsed(!isRailCollapsed)}
              />

              <BlogArticleEditor
                draft={draft}
                setDraft={setDraft}
                authors={authors}
                categories={categories}
                tags={tags}
                inlineMarkdownSnippet={inlineMarkdownSnippet}
                onInlineUpload={handleInlineUpload}
                onCoverUpload={handleCoverUpload}
                onInsertSnippet={() => {
                  setDraft((current) => ({
                    ...current,
                    markdownContent: `${current.markdownContent}\n\n${inlineMarkdownSnippet}\n`,
                  }));
                  setInlineMarkdownSnippet("");
                }}
                setSlugManuallyEdited={setSlugManuallyEdited}
                setMetaTitleManuallyEdited={setMetaTitleManuallyEdited}
                setMetaDescriptionManuallyEdited={setMetaDescriptionManuallyEdited}
                slugManuallyEdited={slugManuallyEdited}
                metaTitleManuallyEdited={metaTitleManuallyEdited}
                metaDescriptionManuallyEdited={metaDescriptionManuallyEdited}
              />
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
