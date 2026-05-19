"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

type BestCategorySidebarNavLink = {
  slug: string;
  title: string;
};

export function BestCategorySidebarNav({
  links,
}: {
  links: BestCategorySidebarNavLink[];
}) {
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const filteredLinks = useMemo(() => {
    if (!normalizedQuery) {
      return links;
    }

    return links.filter((link) =>
      link.title.toLowerCase().includes(normalizedQuery),
    );
  }, [links, normalizedQuery]);

  return (
    <nav
      aria-label="Best guide categories"
      className="rounded-2xl border border-border bg-card p-5 shadow-sm"
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        Categories
      </p>

      <label className="mt-4 flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-3 text-muted-foreground transition-colors focus-within:border-foreground/30 focus-within:text-foreground">
        <Search size={15} className="shrink-0" />
        <span className="sr-only">Search categories</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search categories"
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-muted-foreground/60"
        />
      </label>

      <div className="mt-4 max-h-72 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin]">
        {filteredLinks.length > 0 ? (
          <div className="grid gap-1">
            {filteredLinks.map((link) => (
              <Link
                key={link.slug}
                href={`#${link.slug}`}
                className="rounded-xl px-3 py-2 text-sm font-bold leading-snug text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
              >
                {link.title}
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-background px-3 py-5 text-center text-xs font-bold leading-relaxed text-muted-foreground">
            No categories found.
          </div>
        )}
      </div>
    </nav>
  );
}
