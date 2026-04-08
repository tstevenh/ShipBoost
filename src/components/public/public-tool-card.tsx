import Link from "next/link";

import { buildTrackedToolOutboundUrl, type ToolOutboundSource } from "@/lib/tool-outbound";

type ToolCardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
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
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-black/10 bg-black/[0.03] text-black/65";
}

export function PublicToolCard({
  tool,
  sourceSurface = "category_page",
}: {
  tool: ToolCardTool;
  sourceSurface?: ToolOutboundSource;
}) {
  return (
    <article className="rounded-[1.75rem] border border-black/10 bg-white p-5 shadow-[0_18px_50px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-[#f3f0ea]">
            {tool.logoMedia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tool.logoMedia.url}
                alt={`${tool.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-sm font-semibold text-black/45">
                {tool.name.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/tools/${tool.slug}`}
                className="text-lg font-semibold text-black transition hover:text-[#9f4f1d]"
              >
                {tool.name}
              </Link>
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-semibold tracking-[0.16em] uppercase ${badgeClassName(
                  tool.isFeatured,
                )}`}
              >
                {tool.isFeatured ? "Featured" : tool.pricingModel}
              </span>
            </div>
            <p className="mt-2 max-w-xl text-sm leading-6 text-black/62">
              {tool.tagline}
            </p>
          </div>
        </div>

        <Link
          href={`/tools/${tool.slug}`}
          className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
        >
          View
        </Link>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {tool.toolCategories.map((item) => (
          <Link
            key={item.category.slug}
            href={`/categories/${item.category.slug}`}
            className="rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1.5 text-xs font-medium text-black/72 transition hover:border-black/20"
          >
            {item.category.name}
          </Link>
        ))}
        {tool.toolTags.slice(0, 3).map((item) => (
          <span
            key={item.tag.slug}
            className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/55"
          >
            {item.tag.name}
          </span>
        ))}
      </div>

      {tool.affiliateUrl ? (
        <div className="mt-5">
          <a
            href={buildTrackedToolOutboundUrl(
              tool.id,
              "affiliate",
              sourceSurface,
            )}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-[#9f4f1d] underline decoration-[#9f4f1d]/30 underline-offset-4"
          >
            Explore offer
          </a>
        </div>
      ) : null}
    </article>
  );
}
