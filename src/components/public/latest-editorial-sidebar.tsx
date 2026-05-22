import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";

import { cn } from "@/lib/utils";
import type { LatestSpotlightArticleSidebar } from "@/server/services/blog-service";

type LatestEditorialSidebarProps = {
  articles: LatestSpotlightArticleSidebar[];
  className?: string;
};

export function LatestEditorialSidebar({
  articles,
  className,
}: LatestEditorialSidebarProps) {
  return (
    <section className={cn("w-full", className)}>
      <div className="overflow-hidden rounded-xl border border-primary/25 bg-card p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-primary">
            Latest editorial articles
          </span>
          <Newspaper size={13} className="text-primary" />
        </div>

        {articles.length > 0 ? (
          <ul className="mt-3 space-y-4">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/blog/${article.slug}`}
                  className="group block transition hover:opacity-90"
                >
                  {article.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={article.coverImageUrl}
                      alt={article.coverImageAlt ?? article.title}
                      className="aspect-[21/9] w-full rounded-lg border border-border object-cover"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex aspect-[21/9] w-full items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                      <Newspaper size={28} />
                    </div>
                  )}
                  <p className="mt-2.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                    {article.category.name}
                  </p>
                  <h4 className="mt-1 line-clamp-2 text-[15px] font-bold leading-snug tracking-tight text-foreground group-hover:text-primary">
                    {article.title}
                  </h4>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-3">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
                <Newspaper size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold tracking-tight text-foreground">
                  Coming soon
                </h4>
                <p className="mt-0.5 line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground">
                  Hand-written editorial articles for Premium launches appear here.
                </p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary"
            >
              See Premium Launch
              <ArrowRight size={11} />
            </Link>
          </div>
        )}

        {articles.length > 0 ? (
          <Link
            href="/blog/category/launch-spotlights"
            className="mt-4 inline-flex items-center gap-1 border-t border-border pt-3 text-[11px] font-bold text-primary"
          >
            See all articles
            <ArrowRight size={11} />
          </Link>
        ) : null}
      </div>
    </section>
  );
}
