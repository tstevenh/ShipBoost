"use client";

import { useState } from "react";
import { ImagePlus, Upload } from "lucide-react";

import {
  Field,
  textInputClassName,
  type BlogAuthor,
  type BlogCategory,
  type BlogTag,
} from "@/components/admin/admin-console-shared";
import {
  coerceSeoDescription,
  slugifyDraft,
  type BlogArticleDraft,
} from "@/components/admin/blog/types";
import { cn } from "@/lib/utils";

type BlogArticleEditorProps = {
  draft: BlogArticleDraft;
  setDraft: React.Dispatch<React.SetStateAction<BlogArticleDraft>>;
  authors: BlogAuthor[];
  categories: BlogCategory[];
  tags: BlogTag[];
  inlineMarkdownSnippet: string;
  onInlineUpload: (file: File) => Promise<void>;
  onCoverUpload: (file: File) => Promise<void>;
  onInsertSnippet: () => void;
  setSlugManuallyEdited: (value: boolean) => void;
  setMetaTitleManuallyEdited: (value: boolean) => void;
  setMetaDescriptionManuallyEdited: (value: boolean) => void;
  slugManuallyEdited: boolean;
  metaTitleManuallyEdited: boolean;
  metaDescriptionManuallyEdited: boolean;
};

export function BlogArticleEditor({
  draft,
  setDraft,
  authors,
  categories,
  tags,
  inlineMarkdownSnippet,
  onInlineUpload,
  onCoverUpload,
  onInsertSnippet,
  setSlugManuallyEdited,
  setMetaTitleManuallyEdited,
  setMetaDescriptionManuallyEdited,
  slugManuallyEdited,
  metaTitleManuallyEdited,
  metaDescriptionManuallyEdited,
}: BlogArticleEditorProps) {
  const [showPreview, setShowPreview] = useState(false);

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

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="space-y-5 rounded-[1.75rem] border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex items-center justify-between">
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
                    void onInlineUpload(file);
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
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className={cn(
                "rounded-xl border px-3 py-2 text-[11px] font-black transition",
                showPreview
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card text-foreground border-border hover:bg-background"
              )}
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>
          </div>
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
                onClick={onInsertSnippet}
                className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-black text-foreground transition hover:bg-background"
              >
                Insert into body
              </button>
            </div>
          </div>
        ) : null}

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

        <div className={cn("grid gap-4", showPreview ? "lg:grid-cols-2" : "grid-cols-1")}>
          <div className="rounded-[1.5rem] border border-border bg-background">
            <div className="border-b border-border px-5 py-3 flex items-center justify-between">
              <p className="text-[11px] font-black tracking-[0.18em] text-foreground/45">
                Markdown body
              </p>
              <span className="text-[10px] font-bold text-muted-foreground/50">
                {draft.markdownContent.length} chars
              </span>
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

          {showPreview && (
            <div className="rounded-[1.5rem] border border-border bg-muted/5 overflow-hidden flex flex-col">
              <div className="border-b border-border px-5 py-3 bg-background">
                <p className="text-[11px] font-black tracking-[0.18em] text-foreground/45">
                  Live Preview (Draft)
                </p>
              </div>
              <div className="flex-1 p-6 prose prose-invert prose-sm max-w-none overflow-y-auto bg-background/50">
                {/* Simplified preview placeholder - in a real app we'd use ReactMarkdown here */}
                <h1 className="text-2xl font-black mb-4">{draft.title || "Untitled"}</h1>
                <p className="text-muted-foreground italic mb-6">{draft.excerpt}</p>
                <div className="whitespace-pre-wrap font-sans">
                  {draft.markdownContent || "Start writing to see preview..."}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      <aside className="space-y-5">
        <section className="rounded-[1.75rem] border border-border bg-card p-5 shadow-sm">
          <p className="text-[10px] font-black tracking-[0.24em] text-foreground/40">
            Publish Settings
          </p>
          <div className="mt-4 space-y-4">
            <Field label="Status">
              <select
                value={draft.status}
                onChange={(event) =>
                  setDraft((current) => ({
                    ...current,
                    status: event.target.value as BlogArticleDraft["status"],
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
                    void onCoverUpload(file);
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
  );
}
