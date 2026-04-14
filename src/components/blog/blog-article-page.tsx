import Link from "next/link";

import { MarkdownContent } from "@/components/content/markdown-content";
import { BlogAuthorCard } from "@/components/blog/blog-author-card";
import { Footer } from "@/components/ui/footer";

type BlogArticlePageProps = {
  article: {
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    markdownContent: string;
    publishedAt: Date | null;
    updatedAt: Date;
    lastUpdatedAt: Date | null;
    coverImageUrl: string | null;
    coverImageAlt: string | null;
    primaryCategory: {
      slug: string;
      name: string;
    };
    articleTags: Array<{
      tag: {
        id: string;
        slug: string;
        name: string;
      };
    }>;
    author: {
      name: string;
      role: string | null;
      bio: string;
      imageUrl: string | null;
      xUrl: string | null;
      linkedinUrl: string | null;
      websiteUrl: string | null;
    };
  };
  relatedArticles: Array<{
    id: string;
    slug: string;
    title: string;
    excerpt: string;
    publishedAt: Date | null;
    coverImageUrl: string | null;
    coverImageAlt: string | null;
    primaryCategory: {
      slug: string;
      name: string;
    };
  }>;
  previewMode?: boolean;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function BlogArticlePage({
  article,
  relatedArticles,
  previewMode = false,
}: BlogArticlePageProps) {
  const publishedLabel = formatDate(article.publishedAt ?? article.updatedAt);
  const updatedLabel = formatDate(article.lastUpdatedAt ?? article.updatedAt);
  const sidebarRelatedArticle = relatedArticles[0] ?? null;

  return (
    <main className="flex flex-1 flex-col bg-muted/20 pt-32">
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="border-b border-border pb-10">
          {previewMode ? (
            <div className="mb-6 inline-flex rounded-full border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-black tracking-[0.22em] text-amber-700">
              Preview mode
            </div>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-black tracking-[0.24em] text-foreground/45">
            <Link href="/blog" className="hover:text-foreground">
              Blog
            </Link>
            <span>/</span>
            <Link href={`/blog/category/${article.primaryCategory.slug}`} className="hover:text-foreground">
              {article.primaryCategory.name}
            </Link>
            {publishedLabel ? <span>{publishedLabel}</span> : null}
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            {article.title}
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground/85">
            {article.excerpt}
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-border pt-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-border bg-card text-sm font-black text-foreground">
                {article.author.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={article.author.imageUrl}
                    alt={article.author.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  article.author.name.charAt(0)
                )}
              </div>
              <div>
                <p className="text-sm font-black text-foreground">{article.author.name}</p>
                <p className="text-sm text-muted-foreground">
                  {article.author.role ?? "ShipBoost"}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {article.articleTags.map((item) => (
              <Link
                key={item.tag.id}
                href={`/blog/tag/${item.tag.slug}`}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-black tracking-wide text-muted-foreground hover:text-foreground"
              >
                {item.tag.name}
              </Link>
            ))}
          </div>
        </div>

        <div className="py-10">
          <article className="min-w-0">
            {article.coverImageUrl ? (
              <div className="mb-8 overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={article.coverImageUrl}
                  alt={article.coverImageAlt ?? article.title}
                  className="w-full object-cover"
                />
              </div>
            ) : null}
            <div className="rounded-[1.75rem] border border-border bg-card p-6 shadow-sm sm:p-8">
              <MarkdownContent content={article.markdownContent} />
            </div>
            {sidebarRelatedArticle ? (
              <section className="mt-6 rounded-[1.5rem] border border-border bg-card p-5 shadow-sm">
                <h2 className="text-sm font-black tracking-[0.2em] text-foreground/60">
                  Related
                </h2>
                <div className="mt-4 space-y-3">
                  <p className="text-[11px] font-black tracking-[0.22em] text-foreground/45">
                    {sidebarRelatedArticle.primaryCategory.name}
                  </p>
                  <h3 className="text-base font-black tracking-tight text-foreground">
                    <Link
                      href={`/blog/${sidebarRelatedArticle.slug}`}
                      className="hover:underline underline-offset-4"
                    >
                      {sidebarRelatedArticle.title}
                    </Link>
                  </h3>
                  <p className="text-sm leading-6 text-muted-foreground">
                    {sidebarRelatedArticle.excerpt}
                  </p>
                </div>
              </section>
            ) : null}
          </article>
        </div>

        {relatedArticles.length > 0 ? (
          <section className="border-t border-border py-12">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Related articles
              </h2>
              <Link href="/blog" className="text-sm font-black text-foreground hover:underline">
                View all articles
              </Link>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {relatedArticles.map((related) => (
                <article key={related.id} className="overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-sm">
                  {related.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={related.coverImageUrl}
                      alt={related.coverImageAlt ?? related.title}
                      className="h-44 w-full object-cover"
                    />
                  ) : null}
                  <div className="space-y-3 p-5">
                    <p className="text-[11px] font-black tracking-[0.24em] text-foreground/45">
                      {related.primaryCategory.name}
                    </p>
                    <h3 className="text-lg font-black tracking-tight text-foreground">
                      <Link href={`/blog/${related.slug}`} className="hover:underline underline-offset-4">
                        {related.title}
                      </Link>
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {related.excerpt}
                    </p>
                    <p className="text-xs font-bold text-muted-foreground">
                      {formatDate(related.publishedAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
