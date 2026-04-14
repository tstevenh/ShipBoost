import Link from "next/link";
import { cn } from "@/lib/utils";

export type SharedArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  publishedAt: Date | string | null;
  updatedAt: Date | string;
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

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return null;
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

export function CategoryNav({ 
  categories = [], 
  activeSlug 
}: { 
  categories?: Array<{ id: string; slug: string; name: string }>;
  activeSlug?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 py-6 border-b border-border mb-8">
      <Link
        href="/blog"
        className={cn(
          "px-4 py-2 rounded-full text-xs font-black tracking-widest transition-all",
          !activeSlug 
            ? "bg-foreground text-background" 
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        All Articles
      </Link>
      {categories?.map((category) => (
        <Link
          key={category.id}
          href={`/blog/category/${category.slug}`}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-black tracking-widest transition-all",
            activeSlug === category.slug
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          {category.name}
        </Link>
      ))}
    </div>
  );
}

export function ArticleCard({ article, featured = false }: { article: SharedArticle, featured?: boolean }) {
  const imageUrl = article.coverImageUrl;
  
  if (featured) {
    return (
      <article className="group relative grid gap-8 lg:grid-cols-2 items-center py-12 border-b border-border">
        <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-muted">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={article.coverImageAlt ?? article.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
             <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
          )}
        </div>
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
             <Link 
               href={`/blog/category/${article.primaryCategory.slug}`}
               className="text-[10px] font-black tracking-widest uppercase bg-primary/10 text-primary px-3 py-1 rounded-full"
             >
               {article.primaryCategory.name}
             </Link>
             <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
               {formatDate(article.publishedAt ?? article.updatedAt)}
             </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground leading-tight">
            <Link href={`/blog/${article.slug}`} className="hover:text-primary transition-colors">
              {article.title}
            </Link>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed line-clamp-3">
            {article.excerpt}
          </p>
          <div className="flex flex-wrap gap-2 mt-2">
            {article.articleTags.slice(0, 3).map((item) => (
              <span key={item.tag.id} className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">
                #{item.tag.name}
              </span>
            ))}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="group flex flex-col gap-4 py-8 border-b border-border lg:border-none">
      <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-muted">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={article.coverImageAlt ?? article.title}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-secondary/10" />
        )}
      </div>
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
           <Link 
             href={`/blog/category/${article.primaryCategory.slug}`}
             className="text-[9px] font-black tracking-widest uppercase bg-muted text-muted-foreground px-2 py-0.5 rounded"
           >
             {article.primaryCategory.name}
           </Link>
           <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
             {formatDate(article.publishedAt ?? article.updatedAt)}
           </span>
        </div>
        <h3 className="text-xl font-black tracking-tight text-foreground leading-snug">
          <Link href={`/blog/${article.slug}`} className="hover:text-primary transition-colors">
            {article.title}
          </Link>
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {article.excerpt}
        </p>
      </div>
    </article>
  );
}
