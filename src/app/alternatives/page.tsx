import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon } from "lucide-react";

import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";
import { alternativesSeoRegistry } from "@/server/seo/registry";

function getAlternativeSortName(title: string) {
  return title.replace(/^Best /, "").replace(/ Alternatives$/, "");
}

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Best SaaS Alternatives and Comparisons | ShipBoost",
  description:
    "Compare popular SaaS products and discover curated alternatives for tools used by bootstrapped founders.",
  url: "/alternatives",
});

export default function AlternativesIndexPage() {
  const entries = Object.values(alternativesSeoRegistry).sort((left, right) =>
    getAlternativeSortName(left.title).localeCompare(getAlternativeSortName(right.title)),
  );
  const env = getEnv();
  const schema = buildCollectionListingSchema({
    name: "Compare Alternatives",
    description:
      "Discover curated lists of top alternatives to industry-leading products.",
    url: `${env.NEXT_PUBLIC_APP_URL}/alternatives`,
    items: entries.map((entry) => ({
      name: entry.title,
      url: `${env.NEXT_PUBLIC_APP_URL}/alternatives/${entry.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <ShowcaseLayout>
        <div className="pb-10">
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 tracking-widest">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground">Alternatives</span>
          </nav>
        </div>

        <div className="grid gap-10">
          <section className="space-y-10">
            <div className="max-w-4xl">
              <h1 className="mb-6 text-5xl font-black tracking-tight text-foreground">
                Compare Alternatives
              </h1>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
                Discover curated lists of top alternatives to industry-leading products.
                Find the perfect tool for your specific bootstrapped SaaS workflow.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {entries.map((entry) => (
                <Link
                  key={entry.slug}
                  href={`/alternatives/${entry.slug}`}
                  className="group rounded-2xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h2 className="text-xl font-black transition-colors group-hover:text-foreground">
                        {entry.title}
                      </h2>
                      <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {entry.metaDescription}
                      </p>
                      <p className="pt-2 text-[10px] font-bold tracking-widest text-muted-foreground/50">
                        {entry.toolSlugs.length + 1} products compared
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className="mt-1 shrink-0 text-muted-foreground transition-all group-hover:translate-x-1 group-hover:text-foreground"
                    />
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
        </div>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
