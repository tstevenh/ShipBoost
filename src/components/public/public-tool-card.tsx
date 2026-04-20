import Link from "next/link";

import { buildTrackedToolOutboundUrl, type ToolOutboundSource } from "@/lib/tool-outbound";
import { LogoFallback } from "@/components/ui/logo-fallback";

type ToolCardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  pricingModel: string;
  affiliateUrl: string | null;
  isFeatured: boolean;
  logoMedia: { url: string } | null;
  toolCategories: Array<{
    category: { name: string; slug: string };
  }>;
  toolTags: Array<{
    tag: { name: string; slug: string };
  }>;
};

function badgeClassName(featured: boolean) {
  return featured
    ? "border-amber-500/20 bg-amber-500/10 text-amber-600 dark:text-amber-400"
    : "border-border bg-muted/50 text-muted-foreground";
}

export function PublicToolCard({
  tool,
  sourceSurface = "category_page",
}: {
  tool: ToolCardTool;
  sourceSurface?: ToolOutboundSource;
}) {
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 transition-all hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <LogoFallback
            name={tool.name}
            src={tool.logoMedia?.url}
            websiteUrl={tool.websiteUrl}
            sizes="56px"
            className="h-14 w-14 shrink-0 rounded-xl border border-border"
          />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tools/${tool.slug}`}
                className="text-lg font-black transition-colors hover:text-foreground/70"
              >
                {tool.name}
              </Link>
              <span
                className={`inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black tracking-widest  ${badgeClassName(
                  tool.isFeatured,
                )}`}
              >
                {tool.isFeatured ? "Premium" : tool.pricingModel}
              </span>
            </div>
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground font-medium leading-relaxed">
              {tool.tagline}
            </p>
          </div>
        </div>

        <Link
          href={`/tools/${tool.slug}`}
          className="rounded-full border border-border bg-background px-4 py-1.5 text-[10px] font-black  tracking-widest transition-all hover:bg-muted"
        >
          View
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {tool.toolCategories.map((item) => (
          <Link
            key={item.category.slug}
            href={`/categories/${item.category.slug}`}
            className="rounded-md border border-border bg-muted/50 px-2 py-0.5 text-[10px] font-black  tracking-widest text-muted-foreground transition-colors hover:text-foreground"
          >
            {item.category.name}
          </Link>
        ))}
        {tool.toolTags.slice(0, 3).map((item) => (
          <Link
            key={item.tag.slug}
            href={`/tags/${item.tag.slug}`}
            className="rounded-md border border-border bg-background px-2 py-0.5 text-[10px] font-bold text-muted-foreground/60"
          >
            {item.tag.name}
          </Link>
        ))}
      </div>

      {tool.affiliateUrl ? (
        <div className="mt-5 pt-4 border-t border-border">
          <a
            href={buildTrackedToolOutboundUrl(
              tool.id,
              "affiliate",
              sourceSurface,
            )}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-black text-foreground hover:underline underline-offset-4 decoration-border"
          >
            Explore special offer →
          </a>
        </div>
      ) : null}
    </article>
  );
}
