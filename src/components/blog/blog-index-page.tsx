import Link from "next/link";

import { Footer } from "@/components/ui/footer";
import type { getCachedBlogIndexPage } from "@/server/cache/public-content";

type BlogIndexPageData = Awaited<ReturnType<typeof getCachedBlogIndexPage>>;

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function ArticleCard({
  article,
  compact = false,
}: {
  article: BlogIndexPageData["latestArticles"][number];
  compact?: boolean;
}) {
  const imageUrl = article.ogImageUrl ?? article.coverImageUrl ?? null;

  return (
    <article className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={article.coverImageAlt ?? article.title}
          className={compact ? "h-44 w-full object-cover" : "h-56 w-full object-cover"}
        />
      ) : null}
      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-black tracking-[0.24em] text-foreground/45">
          <Link href={`/blog/category/${article.primaryCategory.slug}`} className="hover:text-foreground">
            {article.primaryCategory.name}
          </Link>
          <span>{formatDate(article.publishedAt ?? article.updatedAt)}</span>
        </div>
        <div className="space-y-3">
          <h2 className={compact ? "text-xl font-black tracking-tight text-foreground" : "text-2xl font-black tracking-tight text-foreground"}>
            <Link href={`/blog/${article.slug}`} className="hover:underline underline-offset-4">
              {article.title}
            </Link>
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{article.excerpt}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {article.articleTags.slice(0, compact ? 2 : 3).map((item) => (
            <Link
              key={item.tag.id}
              href={`/blog/tag/${item.tag.slug}`}
              className="rounded-full border border-border px-3 py-1 text-[11px] font-black tracking-wide text-muted-foreground hover:text-foreground"
            >
              {item.tag.name}
            </Link>
          ))}
        </div>
      </div>
    </article>
  );
}

export function BlogIndexPage({ page }: { page: BlogIndexPageData }) {
  return (
    <main className="flex flex-1 flex-col bg-muted/20 pt-32">
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6">
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
            ShipBoost Blog
          </p>
          <h1 className="mt-5 max-w-4xl text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            Tactical writing on SEO, SaaS launches, trust, and durable distribution
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground/80">
            Practical articles for founders who want stronger EEAT signals, better discovery,
            and launch assets that keep compounding after the first spike.
          </p>
        </div>

        {page.featuredArticle ? (
          <section className="py-10">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Featured article
              </h2>
              <Link href={`/blog/${page.featuredArticle.slug}`} className="text-sm font-black text-foreground hover:underline">
                Read article
              </Link>
            </div>
            <ArticleCard article={page.featuredArticle} />
          </section>
        ) : null}

        <section className="grid gap-8 pb-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div>
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                Latest articles
              </h2>
              <p className="text-sm font-medium text-muted-foreground">
                Built for practical operators, not content theater.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {page.latestArticles.map((article) => (
                <ArticleCard key={article.id} article={article} compact />
              ))}
            </div>
          </div>

          <aside className="space-y-6">
            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-black tracking-tight text-foreground">
                Browse by category
              </h2>
              <div className="mt-5 space-y-3">
                {page.categories.map((category) => (
                  <Link
                    key={category.id}
                    href={`/blog/category/${category.slug}`}
                    className="flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-sm font-bold text-foreground transition hover:bg-muted"
                  >
                    <span>{category.name}</span>
                    <span className="text-muted-foreground">{category.articleCount}</span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
              <h2 className="text-xl font-black tracking-tight text-foreground">
                Popular tags
              </h2>
              <div className="mt-5 flex flex-wrap gap-2">
                {page.tags.map((tag) => (
                  <Link
                    key={tag.id}
                    href={`/blog/tag/${tag.slug}`}
                    className="rounded-full border border-border px-3 py-2 text-xs font-black tracking-wide text-muted-foreground hover:text-foreground"
                  >
                    {tag.name}
                  </Link>
                ))}
              </div>
            </section>
          </aside>
        </section>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
