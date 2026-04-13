import Link from "next/link";

import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";
import { LogoFallback } from "@/components/ui/logo-fallback";

type PublicDirectoryToolCardProps = {
  toolId: string;
  name: string;
  tagline: string;
  logoUrl?: string | null;
  slug: string;
  rank?: number;
  votes: number;
  tags?: string[];
  linkedTags?: Array<{
    name: string;
    slug: string;
  }>;
  primaryCategory?: {
    name: string;
    slug: string;
  } | null;
  imagePriority?: boolean;
};

export function PublicDirectoryToolCard({
  toolId,
  name,
  tagline,
  logoUrl,
  slug,
  rank,
  votes,
  tags = [],
  linkedTags = [],
  primaryCategory = null,
  imagePriority = false,
}: PublicDirectoryToolCardProps) {
  const visibleLinkedTags = linkedTags.slice(0, 3);
  const fallbackTags =
    visibleLinkedTags.length === 0 ? tags.slice(0, 3) : [];

  return (
    <article className="group relative flex items-center gap-5 rounded-xl border border-border bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 dark:hover:shadow-black/20">
      <div className="shrink-0">
        <LogoFallback
          name={name}
          src={logoUrl}
          sizes="48px"
          priority={imagePriority}
          className="h-12 w-12 rounded-lg border border-border"
          textClassName="text-lg"
        />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-2">
          <Link
            href={`/tools/${slug}`}
            className="truncate text-lg font-bold text-foreground transition-all hover:opacity-70"
          >
            {name}
            {rank ? (
              <span className="ml-2 font-medium text-muted-foreground/60">
                #{rank}
              </span>
            ) : null}
          </Link>
        </div>

        <p className="mb-3 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
          {tagline}
        </p>

        {primaryCategory || visibleLinkedTags.length > 0 || fallbackTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {primaryCategory ? (
              <Link
                href={`/categories/${primaryCategory.slug}`}
                className="text-[10px] font-black tracking-wider text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                {primaryCategory.name}
              </Link>
            ) : null}
            {visibleLinkedTags.map((tag) => (
              <Link
                key={tag.slug}
                href={`/best/tag/${tag.slug}`}
                className="text-[10px] font-black tracking-wider text-muted-foreground/60 transition-colors hover:text-foreground"
              >
                #{tag.name}
              </Link>
            ))}
            {fallbackTags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] font-black tracking-wider text-muted-foreground/60"
              >
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      <div className="shrink-0 self-center">
        <ToolUpvoteButton toolId={toolId} initialCount={votes} variant="card" />
      </div>
    </article>
  );
}
