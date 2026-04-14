import Link from "next/link";

import { Footer } from "@/components/ui/footer";

type ArchiveArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | null;
  updatedAt: Date;
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
};

type Breadcrumb = {
  label: string;
  href: string;
};

function formatDate(value: Date | string | null | undefined) {
  if (!value) {
    return null;
  }

  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function BlogArchivePage({
  eyebrow,
  title,
  description,
  breadcrumbs,
  articles,
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  articles: ArchiveArticle[];
}) {
  return (
    <main className="flex flex-1 flex-col bg-muted/20 pt-32">
      <section className="mx-auto w-full max-w-6xl px-6">
        <div className="rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <div className="flex flex-wrap gap-2 text-sm font-bold text-muted-foreground">
            {breadcrumbs.map((breadcrumb, index) => (
              <span key={breadcrumb.href} className="inline-flex items-center gap-2">
                {index > 0 ? <span>/</span> : null}
                <Link href={breadcrumb.href} className="hover:text-foreground">
                  {breadcrumb.label}
                </Link>
              </span>
            ))}
          </div>
          <p className="mt-6 text-[10px] font-black tracking-[0.3em] text-foreground/40">
            {eyebrow}
          </p>
          <h1 className="mt-5 text-5xl font-black tracking-tight text-foreground sm:text-6xl">
            {title}
          </h1>
          <p className="mt-6 max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground/80">
            {description}
          </p>
        </div>

        <div className="grid gap-6 py-10 md:grid-cols-2 xl:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="overflow-hidden rounded-[2rem] border border-border bg-card shadow-sm">
              {article.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={article.coverImageUrl}
                  alt={article.coverImageAlt ?? article.title}
                  className="h-48 w-full object-cover"
                />
              ) : null}
              <div className="space-y-4 p-6">
                <div className="flex flex-wrap items-center gap-3 text-[11px] font-black tracking-[0.24em] text-foreground/45">
                  <Link href={`/blog/category/${article.primaryCategory.slug}`} className="hover:text-foreground">
                    {article.primaryCategory.name}
                  </Link>
                  <span>{formatDate(article.publishedAt ?? article.updatedAt)}</span>
                </div>
                <h2 className="text-2xl font-black tracking-tight text-foreground">
                  <Link href={`/blog/${article.slug}`} className="hover:underline underline-offset-4">
                    {article.title}
                  </Link>
                </h2>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {article.excerpt}
                </p>
                <div className="flex flex-wrap gap-2">
                  {article.articleTags.slice(0, 3).map((item) => (
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
          ))}
        </div>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
