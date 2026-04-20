import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon } from "lucide-react";

import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import {
  bestHubSections,
  getBestHubPageEntries,
} from "@/server/seo/best-pages";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Best SaaS Software Buying Guides | ShipBoost",
  description:
    "Browse grouped buying guides for help desk, customer support, CRM, and other high-intent SaaS software comparisons on ShipBoost.",
  url: "/best",
});

export default function BestIndexPage() {
  const env = getEnv();
  const hubEntries = bestHubSections.flatMap((section) =>
    getBestHubPageEntries(section.pageSlugs),
  );
  const schema = buildCollectionListingSchema({
    name: "Best SaaS Software Buying Guides",
    description:
      "Grouped buying guides for support and CRM software comparisons on ShipBoost.",
    url: `${env.NEXT_PUBLIC_APP_URL}/best`,
    items: hubEntries.map((entry) => ({
      name: entry.title,
      url: `${env.NEXT_PUBLIC_APP_URL}/best/${entry.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <ShowcaseLayout>
        <div className="pb-10">
          <nav className="flex items-center gap-2 text-[10px] font-black tracking-widest text-muted-foreground/60">
            <Link
              href="/"
              className="flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground">Best</span>
          </nav>
        </div>

        <section className="space-y-10">
          <div className="max-w-4xl">
            <h1 className="mb-6 text-5xl font-black tracking-tight text-foreground">
              Best SaaS Software Buying Guides
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              Browse grouped buying guides built for specific comparison jobs,
              not just broad directories. These pages are where ShipBoost narrows
              categories into real software decisions.
            </p>
          </div>

          <div className="grid gap-6">
            {bestHubSections.map((section) => {
              const pages = getBestHubPageEntries(section.pageSlugs);

              return (
                <section
                  key={section.slug}
                  className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
                >
                  <div className="max-w-3xl">
                    <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
                      Cluster
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
                      {section.intro}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {pages.map((page) => (
                      <Link
                        key={page.slug}
                        href={`/best/${page.slug}`}
                        className="group rounded-2xl border border-border bg-background p-5 transition-all hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5"
                      >
                        <h3 className="text-lg font-black text-foreground transition-colors group-hover:text-primary">
                          {page.title}
                        </h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                          {page.metaDescription}
                        </p>
                      </Link>
                    ))}
                  </div>

                  <div className="mt-8 flex flex-wrap gap-3">
                    {section.supportingLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-bold text-foreground transition-colors hover:border-foreground/20 hover:text-primary"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        </section>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
