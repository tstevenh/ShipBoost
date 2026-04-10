import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home as HomeIcon, ListFilter, ArrowRight, ExternalLink } from "lucide-react";

import { ToolCard } from "@/components/ToolCard";
import { getEnv } from "@/server/env";
import { getAlternativesSeoPage } from "@/server/services/seo-service";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { getServerSession } from "@/server/auth/session";
import { getDailyVotesRemaining, listUserUpvotedToolIds } from "@/server/services/upvote-service";
import { Footer } from "@/components/ui/footer";

type RouteContext = {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ q?: string }>;
};

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getAlternativesSeoPage(slug);

  if (!page) {
    return {
      title: "Page not found | Shipboost",
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
      siteName: "Shipboost",
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
  const resolvedSearchParams = context.searchParams ? await context.searchParams : {};
  const page = await getAlternativesSeoPage(slug);

  if (!page || !page.tools) {
    notFound();
  }

  const session = await getServerSession();
  const allToolIds = (page.tools || []).map(t => t.id);

  const [dailyVotesRemaining, upvotedToolIds] = await Promise.all([
    session?.user.id ? getDailyVotesRemaining(session.user.id) : Promise.resolve(null),
    session?.user.id ? listUserUpvotedToolIds(allToolIds, session.user.id) : Promise.resolve(new Set<string>()),
  ]);

  return (
    <main className="flex-1">
      <ShowcaseLayout searchParams={resolvedSearchParams}>
        <div className="space-y-10">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">
            <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1">
              <HomeIcon size={10} /> Home
            </Link>
            <ChevronRight size={10} />
            <span className="text-muted-foreground">Alternatives</span>
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
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={page.anchorTool.logoMedia.url} alt="" className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <span className="font-black text-xs">{page.anchorTool.name.slice(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mb-1">Anchor Product</p>
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
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Top Alternatives</h3>
              <div className="flex items-center gap-3 px-3 py-1.5 bg-card border border-border rounded-lg w-fit shadow-sm">
                <ListFilter size={12} className="text-muted-foreground" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Newest</span>
              </div>
            </div>

            <div className="grid gap-5">
              {page.tools.map((tool) => (
                <ToolCard
                  key={tool.id}
                  toolId={tool.id}
                  name={tool.name}
                  tagline={tool.tagline}
                  logoUrl={tool.logoMedia?.url}
                  slug={tool.slug}
                  votes={tool._count?.toolVotes ?? 0}
                  hasUpvoted={upvotedToolIds.has(tool.id)}
                  tags={(tool.toolTags || []).map(tt => tt.tag?.name).filter((name): name is string => Boolean(name))}
                  initialDailyVotesRemaining={dailyVotesRemaining}
                />
              ))}
            </div>
          </div>
        </div>
      </ShowcaseLayout>
      <Footer />
    </main>
  );
}
