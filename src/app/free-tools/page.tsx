import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, ChevronRight, Home as HomeIcon, Sparkles } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { freeTools, getFreeToolPath } from "@/server/seo/free-tools";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildFreeToolsIndexSchema } from "@/server/seo/page-schema";

export const revalidate = 3600;

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Free Online Tools for Founders and Creators | ShipBoost",
  description:
    "Use ShipBoost free tools for quick browser utilities, creative mockups, benchmarks, and launch-ready assets.",
  url: "/free-tools",
});

export default function FreeToolsIndexPage() {
  const env = getEnv();
  const schema = buildFreeToolsIndexSchema({
    title: "Free Online Tools",
    description:
      "Free browser tools for benchmarks, creative mockups, and founder-friendly assets from ShipBoost.",
    url: `${env.NEXT_PUBLIC_APP_URL}/free-tools`,
    items: freeTools.map((tool) => ({
      name: tool.title,
      url: `${env.NEXT_PUBLIC_APP_URL}${getFreeToolPath(tool.slug)}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <section className="mx-auto flex w-full max-w-6xl flex-col px-6 pb-16 pt-24 sm:pb-20 sm:pt-28">
        <nav className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
          <Link
            href="/"
            className="flex items-center gap-1 transition-colors hover:text-foreground"
          >
            <HomeIcon size={12} aria-hidden="true" /> Home
          </Link>
          <ChevronRight size={12} aria-hidden="true" />
          <span className="text-foreground">Free tools</span>
        </nav>

        <div className="mt-12 max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
            <Sparkles size={14} aria-hidden="true" />
            Browser tools
          </div>
          <h1 className="mt-6 text-4xl font-black tracking-tight text-foreground sm:text-6xl">
            Free online tools for quick benchmarks and creative assets.
          </h1>
          <p className="mt-5 max-w-3xl text-lg font-medium leading-8 text-muted-foreground">
            Use these lightweight ShipBoost tools when you need a clean browser
            utility without signing in. Each tool is public, fast, and designed
            around a specific job.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          {freeTools.map((tool) => (
            <Link
              key={tool.slug}
              href={getFreeToolPath(tool.slug)}
              className="group rounded-[2rem] border border-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-muted-foreground">
                    {tool.indexCard.eyebrow}
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-foreground">
                    {tool.title}
                  </h2>
                </div>
                <ArrowRight
                  size={20}
                  className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground"
                  aria-hidden="true"
                />
              </div>
              <p className="mt-4 text-sm font-medium leading-7 text-muted-foreground">
                {tool.indexCard.description}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                {[tool.primaryKeyword, ...tool.supportingKeywords.slice(0, 2)].map(
                  (keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-muted px-3 py-1 text-[11px] font-bold text-muted-foreground"
                    >
                      {keyword}
                    </span>
                  ),
                )}
              </div>
            </Link>
          ))}
        </div>
      </section>
      <Footer />
    </main>
  );
}
