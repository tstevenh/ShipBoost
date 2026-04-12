import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Home as HomeIcon, Hash } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { listPublicTags } from "@/server/services/catalog-service";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { Footer } from "@/components/ui/footer";
import { getEnv } from "@/server/env";
import { buildCollectionListingSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = {
  title: "Browse Tags | ShipBoost",
  description: "Explore SaaS products by specific features and tags.",
};

export default async function TagsPage() {
  const tags = await listPublicTags();
  const env = getEnv();
  const schema = buildCollectionListingSchema({
    name: "Browse by Tag",
    description: "Explore SaaS products by specific features and tags.",
    url: `${env.NEXT_PUBLIC_APP_URL}/tags`,
    items: tags.map((tag) => ({
      name: tag.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/best/tag/${tag.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <JsonLdScript data={schema} />
      <ShowcaseLayout>
        <div className="pb-10">
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60  tracking-widest">
            <Link href="/" className="hover:text-foreground transition-colors flex items-center gap-1">
              <HomeIcon size={12} /> Home
            </Link>
            <ChevronRight size={12} />
            <span className="text-foreground">
              Tags
            </span>
          </nav>
        </div>

        <section className="space-y-10">
          {/* Header */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              Browse by Tag
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              Narrow down your search by specific features, tech stacks, or use cases.
            </p>
          </div>

          {/* Tags Grid */}
          <div className="flex flex-wrap gap-3">
            {tags.map((tag) => (
              <Link
                key={tag.id}
                href={`/best/tag/${tag.slug}`}
                className="group flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-black/5 hover:border-foreground/20"
              >
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-all">
                  <Hash size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-black group-hover:text-foreground transition-colors">
                    {tag.name}
                  </span>
                  <span className="text-[10px] font-bold text-muted-foreground/50  tracking-widest">
                    {tag.count} tools
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {tags.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border bg-card px-5 py-16 text-center text-sm font-medium text-muted-foreground">
              No tags found.
            </div>
          )}
        </section>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
