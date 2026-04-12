import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home as HomeIcon, ListFilter, ExternalLink } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { getEnv } from "@/server/env";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import {
  getAlternativesStaticParams,
  getCachedAlternativesPage,
} from "@/server/cache/public-content";
import { buildCollectionWithBreadcrumbSchema } from "@/server/seo/page-schema";

export const revalidate = 1800;
export const dynamicParams = false;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getAlternativesStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedAlternativesPage(slug);

  if (!page) {
    return {
      title: "Page not found | ShipBoost",
    };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/alternatives/${slug}`;

  return {
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    alternates: {
      canonical,
    },
    openGraph: {
      title: page.entry.metaTitle,
      description: page.entry.metaDescription,
      url: canonical,
      siteName: "ShipBoost",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: page.entry.metaTitle,
      description: page.entry.metaDescription,
    },
  };
}

export default async function AlternativesPage(context: RouteContext) {
  const { slug } = await context.params;
  const page = await getCachedAlternativesPage(slug);

  if (!page || !page.tools) {
    notFound();
  }

  const allToolIds = (page.tools || []).map(t => t.id);
  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/alternatives/${slug}`;
  const schema = buildCollectionWithBreadcrumbSchema({
    name: page.entry.title,
    description: page.entry.metaDescription,
    url: canonical,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Alternatives", url: `${env.NEXT_PUBLIC_APP_URL}/alternatives` },
      { name: page.anchorTool.name, url: canonical },
    ],
    items: page.tools.map((tool) => ({
      name: tool.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`,
    })),
  });

  return (
    <main className="flex-1">
      <ViewerVoteStateProvider toolIds={allToolIds}>
        <JsonLdScript data={schema} />
        <ShowcaseLayout>
          <div className="space-y-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60  tracking-[0.2em]">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <HomeIcon size={10} /> Home
            </Link>
            <ChevronRight size={10} />
            <Link
              href="/alternatives"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              Alternatives
            </Link>
            <ChevronRight size={10} />
            <span className="text-primary font-black">
              {page.anchorTool.name}
            </span>
          </nav>

          {/* Header Section */}
          <div className="max-w-4xl">
            <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
              {page.entry.title}
            </h1>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 mb-8 whitespace-pre-wrap">
              {page.entry.intro}
            </p>

            <div className="flex items-center gap-4 p-6 bg-primary/5 rounded-2xl border border-primary/10 group hover:border-primary/20 transition-all">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {page.anchorTool.logoMedia ? (
                  <div className="relative h-full w-full overflow-hidden rounded-xl">
                    <Image
                      src={page.anchorTool.logoMedia.url}
                      alt={`${page.anchorTool.name} logo`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="font-black text-xs">{page.anchorTool.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black  tracking-widest text-primary/60 mb-1">Anchor Product</p>
                <h2 className="text-lg font-black text-foreground truncate">{page.anchorTool.name}</h2>
              </div>
              <Link 
                href={`/tools/${page.anchorTool.slug}`}
                className="flex items-center gap-2 text-xs font-black text-primary hover:underline"
              >
                View Listing <ExternalLink size={14} />
              </Link>
            </div>
          </div>

          {/* Tools Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-border/50 pb-4">
              <h3 className="text-[10px] font-black  tracking-[0.2em] text-muted-foreground/60">Top Alternatives</h3>
              <div className="flex items-center gap-3 px-3 py-1.5 bg-card border border-border rounded-lg w-fit shadow-sm">
                <ListFilter size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold  tracking-widest">Newest</span>
              </div>
            </div>

            <div className="grid gap-5">
              {page.tools.map((tool) => (
                <PublicDirectoryToolCard
                  key={tool.id}
                  toolId={tool.id}
                  name={tool.name}
                  tagline={tool.tagline}
                  logoUrl={tool.logoMedia?.url}
                  slug={tool.slug}
                  votes={tool._count?.toolVotes ?? 0}
                  tags={(tool.toolTags || []).map(tt => tt.tag?.name).filter((name): name is string => Boolean(name))}
                />
              ))}
            </div>
          </div>
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}
