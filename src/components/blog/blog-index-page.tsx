import { Footer } from "@/components/ui/footer";
import type { getCachedBlogIndexPage } from "@/server/cache/public-content";
import { CategoryNav, ArticleCard, type SharedArticle } from "./blog-shared";

type BlogIndexPageData = Awaited<ReturnType<typeof getCachedBlogIndexPage>>;

export function BlogIndexPage({ page }: { page: BlogIndexPageData }) {
  const featured = page.featuredArticle as SharedArticle | null;
  const latest = page.latestArticles as SharedArticle[];

  return (
    <main className="flex flex-1 flex-col bg-background pt-32">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6">
        <div className="max-w-3xl">
          <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4">
            The ShipBoost Journal
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-6xl mb-6">
            Blog
          </h1>
          <p className="text-xl leading-relaxed text-muted-foreground">
            Practical guides on distribution, trust signals, and building a directory-ready SaaS.
          </p>
        </div>

        <CategoryNav categories={page.categories} />

        {featured && (
          <div className="mb-12">
            <ArticleCard article={featured} featured={true} />
          </div>
        )}

        <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3 mb-24">
          {latest.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
