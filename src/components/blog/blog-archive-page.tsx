import { Footer } from "@/components/ui/footer";
import { CategoryNav, ArticleCard, type SharedArticle } from "./blog-shared";

type Breadcrumb = {
  label: string;
  href: string;
};

export function BlogArchivePage({
  eyebrow,
  title,
  description,
  breadcrumbs,
  articles,
  categories,
  activeCategorySlug,
}: {
  eyebrow: string;
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  articles: SharedArticle[];
  categories: Array<{ id: string; slug: string; name: string }>;
  activeCategorySlug?: string;
}) {
  const featured = articles[0] ?? null;
  const remaining = articles.slice(1);

  return (
    <main className="flex flex-1 flex-col bg-background pt-32">
      <section className="mx-auto w-full max-w-7xl px-6 flex-1 flex flex-col">
        <div className="max-w-3xl mb-12">
           <div className="flex flex-wrap gap-2 text-[10px] font-black tracking-widest text-muted-foreground uppercase mb-6">
            {breadcrumbs.map((breadcrumb, index) => (
              <span key={breadcrumb.href} className="inline-flex items-center gap-2">
                {index > 0 ? <span className="opacity-40">/</span> : null}
                <a href={breadcrumb.href} className="hover:text-foreground">
                  {breadcrumb.label}
                </a>
              </span>
            ))}
          </div>
          <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl mb-6">
            {title}
          </h1>
          <p className="text-xl leading-relaxed text-muted-foreground">
            {description}
          </p>
        </div>

        <CategoryNav categories={categories} activeSlug={activeCategorySlug} />

        {featured && (
          <div className="mb-12">
            <ArticleCard article={featured} featured={true} />
          </div>
        )}

        {remaining.length > 0 ? (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 mb-24">
            {remaining.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : !featured ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-xl font-black text-foreground mb-2">No articles found</p>
            <p className="text-muted-foreground">Try browsing another category.</p>
          </div>
        ) : null}
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
