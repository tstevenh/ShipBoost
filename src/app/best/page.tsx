import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon } from "lucide-react";

import { BestCategorySidebarNav } from "@/components/public/best-category-sidebar-nav";
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

function sortByTitle<T extends { title: string }>(items: T[]) {
  return [...items].sort((left, right) => left.title.localeCompare(right.title));
}

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Best SaaS Software Buying Guides | ShipBoost",
  description:
    "Browse grouped buying guides for help desk, customer support, CRM, email marketing, forms, surveys, scheduling, social publishing, and other high-intent SaaS software comparisons on ShipBoost.",
  url: "/best",
});

export default function BestIndexPage() {
  const env = getEnv();
  const sections = bestHubSections.map((section) => ({
    ...section,
    pages: sortByTitle(getBestHubPageEntries(section.pageSlugs)),
  }));
  const hubEntries = sections.flatMap((section) => section.pages);
  const sectionLinks = sections.filter((section) => section.pages.length > 0);
  const schema = buildCollectionListingSchema({
    name: "Best SaaS Software Buying Guides",
    description:
      "Grouped buying guides for support, CRM, email marketing, forms, surveys, scheduling, and social publishing software comparisons on ShipBoost.",
    url: `${env.NEXT_PUBLIC_APP_URL}/best`,
    items: hubEntries.map((entry) => ({
      name: entry.title,
      url: `${env.NEXT_PUBLIC_APP_URL}/best/${entry.slug}`,
    })),
  });
  const rightSidebarContent = <BestCategorySidebarNav links={sectionLinks} />;

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <ShowcaseLayout rightSidebarContent={rightSidebarContent}>
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

        <div className="grid gap-10">
          <section className="min-w-0 space-y-10">
            <div className="max-w-4xl">
              <h1 className="mb-6 text-5xl font-black tracking-tight text-foreground">
                Best SaaS Software Buying Guides
              </h1>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
                Browse grouped buying guides built for specific comparison jobs,
                not just broad directories. These pages are where ShipBoost narrows
                categories like support, CRM, email marketing, forms, surveys,
                scheduling, and social publishing into real software decisions.
              </p>
            </div>

            <nav
              aria-label="Best guide sections"
              className="flex gap-2 overflow-x-auto pb-2 lg:hidden"
            >
              {sectionLinks.map((section) => (
                <Link
                  key={section.slug}
                  href={`#${section.slug}`}
                  className="shrink-0 rounded-xl border border-border bg-card px-4 py-2 text-xs font-black text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
                >
                  {section.title}
                </Link>
              ))}
            </nav>

            <div className="grid gap-6">
              {sections.map((section) => (
                <section
                  key={section.slug}
                  id={section.slug}
                  className="scroll-mt-24 rounded-[2rem] border border-border bg-card p-8 shadow-sm"
                >
                  <div className="max-w-3xl">
                    <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground">
                      Category
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                      {section.title}
                    </h2>
                    <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
                      {section.intro}
                    </p>
                  </div>

                  <div className="mt-8 grid gap-4 md:grid-cols-2">
                    {section.pages.map((page) => (
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
              ))}
            </div>
          </section>
        </div>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
