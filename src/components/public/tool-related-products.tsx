"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type ToolRelatedProductsProps = {
  relatedTools: Array<{
    id: string;
    slug: string;
    name: string;
    tagline: string;
    logoMedia: {
      url: string;
    } | null;
  }>;
};

export function ToolRelatedProducts({
  relatedTools,
}: ToolRelatedProductsProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted || relatedTools.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
        Similar products
      </h3>
      <div className="grid gap-3">
        {relatedTools.map((relatedTool) => (
          <Link
            key={relatedTool.id}
            href={`/tools/${relatedTool.slug}`}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-3 transition-all hover:border-foreground/20"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
              {relatedTool.logoMedia ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={relatedTool.logoMedia.url}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xs font-black text-muted-foreground/40">
                  {relatedTool.name.slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-foreground transition-opacity group-hover:opacity-70">
                {relatedTool.name}
              </p>
              <p className="line-clamp-1 text-[10px] font-medium text-muted-foreground/60">
                {relatedTool.tagline}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
