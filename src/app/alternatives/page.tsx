import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon, Search } from "lucide-react";

import { alternativesSeoRegistry } from "@/server/seo/registry";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  title: "Product Alternatives | Shipboost",
  description: "Find and compare the best alternatives to popular SaaS products and founder tools.",
};

export default function AlternativesIndexPage() {
  const entries = Object.values(alternativesSeoRegistry);

  return (
    <main className="flex-1">
      <ShowcaseLayout>
        <div className="pb-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-widest">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground">
              Alternatives
            </span>
          </nav>
        </div>

        <section className="space-y-10">
          {/* Header */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              Compare Alternatives
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              Discover curated lists of top alternatives to industry-leading products. 
              Find the perfect tool for your specific bootstrapped SaaS workflow.
            </p>
          </div>

          {/* Alternatives Grid */}
          <div className="grid gap-4 sm:grid-cols-2">
            {entries.map((entry) => (
              <Link
                key={entry.slug}
                href={`/alternatives/${entry.slug}`}
                className="group p-6 bg-card border border-border rounded-2xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:border-foreground/20"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-black group-hover:text-foreground transition-colors">
                      {entry.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {entry.metaDescription}
                    </p>
                    <p className="text-[10px] font-bold text-muted-foreground/50 uppercase tracking-widest pt-2">
                      {entry.toolSlugs.length + 1} products compared
                    </p>
                  </div>
                  <ChevronRight size={20} className="text-muted-foreground group-hover:text-foreground transition-all group-hover:translate-x-1 shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>

          {entries.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
              No alternative pages found.
            </div>
          )}
        </section>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
