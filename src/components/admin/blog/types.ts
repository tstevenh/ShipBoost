import type { BlogArticle, BlogAuthor, BlogCategory, BlogTag } from "@/components/admin/admin-console-shared";

export type BlogArticleDraft = {
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

export function emptyBlogArticleDraft(authorId = "", categoryId = ""): BlogArticleDraft {
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

export function articleStatusTone(status: BlogArticle["status"]) {
  if (status === "PUBLISHED") {
    return "green" as const;
  }

  if (status === "ARCHIVED") {
    return "slate" as const;
  }

  return "amber" as const;
}

export function slugifyDraft(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export function coerceSeoDescription(value: string) {
  return value.trim().slice(0, 160);
}

export function formatDate(value: string | null | undefined) {
  if (!value) {
    return "Not published";
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function articleMatches(
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
