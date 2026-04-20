import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight, Home as HomeIcon, CheckCircle2 } from "lucide-react";

import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinkSection } from "@/components/seo/internal-link-section";
import { PublicDirectoryToolCard } from "@/components/public/public-directory-tool-card";
import { ShowcaseLayout } from "@/components/public/showcase-layout";
import { ViewerVoteStateProvider } from "@/components/public/viewer-vote-state-provider";
import { Footer } from "@/components/ui/footer";
import {
  getBestSeoStaticParams,
  getCachedBestSeoPage,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildBestPageSchema } from "@/server/seo/page-schema";

export const revalidate = 1800;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getBestSeoStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getCachedBestSeoPage(slug);

  if (!page) {
    return {
      title: "Page not found | ShipBoost",
    };
  }

  return buildPublicPageMetadata({
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    url: `${getEnv().NEXT_PUBLIC_APP_URL}/best/${slug}`,
  });
}

export default async function BestPage(context: RouteContext) {
  const { slug } = await context.params;
  const page = await getCachedBestSeoPage(slug);

  if (!page) {
    notFound();
  }

  const env = getEnv();
  const canonical = `${env.NEXT_PUBLIC_APP_URL}/best/${slug}`;
  const allToolIds = page.tools.map((tool) => tool.id);
  const toolsBySlug = new Map(page.tools.map((tool) => [tool.slug, tool]));
  const topComparisonToolSlugs = page.entry.rankedTools
    .slice(0, 4)
    .map((item) => item.toolSlug)
    .filter((toolSlug) => toolsBySlug.has(toolSlug));
  const schema = buildBestPageSchema({
    title: page.entry.title,
    description: page.entry.metaDescription,
    url: canonical,
    breadcrumbs: [
      { name: "Home", url: env.NEXT_PUBLIC_APP_URL },
      { name: "Best", url: `${env.NEXT_PUBLIC_APP_URL}/best` },
      { name: page.entry.title, url: canonical },
    ],
    items: page.tools.map((tool) => ({
      name: tool.name,
      url: `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`,
    })),
    faq: page.entry.faq,
  });

  return (
    <main className="flex-1">
      <ViewerVoteStateProvider toolIds={allToolIds}>
        <JsonLdScript data={schema} />
        <ShowcaseLayout>
          <div className="space-y-10">
            <nav className="flex items-center gap-2 text-xs font-bold text-muted-foreground/60 tracking-widest">
              <Link
                href="/"
                className="hover:text-primary transition-colors flex items-center gap-1"
              >
                <HomeIcon size={12} /> Home
              </Link>
              <ChevronRight size={12} />
              <Link href="/best" className="hover:text-primary transition-colors">
                Best
              </Link>
              <ChevronRight size={12} />
              <span className="text-primary font-black">{page.entry.title}</span>
            </nav>

            <div className="max-w-5xl">
              <h1 className="text-5xl font-black tracking-tight text-foreground mb-6">
                {page.entry.title}
              </h1>
              <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 mb-6 whitespace-pre-wrap">
                {page.entry.intro}
              </p>
              <div className="rounded-[2rem] border border-border bg-card p-6 shadow-sm">
                <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                  Who This Is For
                </p>
                <p className="mt-3 text-base font-medium leading-relaxed text-muted-foreground/80">
                  {page.entry.whoItsFor}
                </p>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
              <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                Evaluation Criteria
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                How we evaluated these tools
              </h2>
              <div className="mt-6 grid gap-3 md:grid-cols-2">
                {page.entry.howWeEvaluated.map((criterion) => (
                  <div
                    key={criterion}
                    className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4"
                  >
                    <CheckCircle2 size={18} className="mt-0.5 text-primary" />
                    <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                      {criterion}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            {page.entry.comparisonTable.length > 0 && topComparisonToolSlugs.length > 0 ? (
              <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm overflow-x-auto">
                <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                  Comparison Snapshot
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  Quick comparison
                </h2>
                <table className="mt-6 min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-border">
                  <thead className="bg-background">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-black tracking-widest text-muted-foreground/60">
                        Criteria
                      </th>
                      {topComparisonToolSlugs.map((toolSlug) => (
                        <th
                          key={toolSlug}
                          className="px-4 py-3 text-left text-xs font-black tracking-widest text-muted-foreground/60"
                        >
                          {toolsBySlug.get(toolSlug)?.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {page.entry.comparisonTable.map((row) => (
                      <tr key={row.label} className="border-t border-border">
                        <td className="px-4 py-3 text-sm font-black text-foreground">
                          {row.label}
                        </td>
                        {topComparisonToolSlugs.map((toolSlug) => (
                          <td
                            key={`${row.label}:${toolSlug}`}
                            className="px-4 py-3 text-sm font-medium text-muted-foreground"
                          >
                            {row.valuesByToolSlug[toolSlug] ?? "—"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            ) : null}

            <section className="space-y-6">
              <div>
                <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                  Ranked Picks
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  Top tools we recommend
                </h2>
              </div>

              <div className="space-y-6">
                {page.entry.rankedTools.map((item) => {
                  const tool = toolsBySlug.get(item.toolSlug);

                  if (!tool) {
                    return null;
                  }

                  const tags = tool.toolTags
                    .map((toolTag) => toolTag.tag?.name)
                    .filter((name): name is string => Boolean(name));
                  const linkedTags = tool.toolTags
                    .map((toolTag) => toolTag.tag)
                    .filter(
                      (
                        tag,
                      ): tag is {
                        id: string;
                        name: string;
                        slug: string;
                        isActive: boolean;
                      } => Boolean(tag?.name && tag.slug),
                    )
                    .map((tag) => ({
                      name: tag.name,
                      slug: tag.slug,
                    }));

                  return (
                    <article
                      key={tool.id}
                      className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
                    >
                      <p className="text-[10px] font-black tracking-[0.2em] text-primary/70">
                        #{item.rank}
                      </p>
                      <div className="mt-4">
                        <PublicDirectoryToolCard
                          toolId={tool.id}
                          name={tool.name}
                          tagline={tool.tagline}
                          logoUrl={tool.logoMedia?.url}
                          websiteUrl={tool.websiteUrl}
                          slug={tool.slug}
                          votes={tool._count?.toolVotes ?? 0}
                          tags={tags}
                          linkedTags={linkedTags}
                          primaryCategory={tool.toolCategories[0]?.category ?? null}
                        />
                      </div>
                      <div className="mt-6 space-y-4 text-sm font-medium leading-relaxed text-muted-foreground">
                        <p>{item.verdict}</p>
                        <p>
                          <span className="font-black text-foreground">Best for:</span>{" "}
                          {item.bestFor}
                        </p>
                        <p>
                          <span className="font-black text-foreground">
                            Not ideal for:
                          </span>{" "}
                          {item.notIdealFor}
                        </p>
                        {item.criteriaHighlights?.length ? (
                          <div className="flex flex-wrap gap-2 pt-1">
                            {item.criteriaHighlights.map((highlight) => (
                              <span
                                key={highlight}
                                className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-black uppercase tracking-wider text-muted-foreground"
                              >
                                {highlight}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            {page.entry.customSections?.map((section) => (
              <section
                key={section.heading}
                className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
              >
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                  {section.heading}
                </h2>
                <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
                  {section.body}
                </p>
              </section>
            ))}

            {page.entry.faq.length > 0 ? (
              <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
                <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
                  FAQ
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-foreground">
                  Frequently asked questions
                </h2>
                <div className="mt-6 space-y-4">
                  {page.entry.faq.map((item) => (
                    <article
                      key={item.question}
                      className="rounded-2xl border border-border bg-background p-5"
                    >
                      <h3 className="text-sm font-black text-foreground">
                        {item.question}
                      </h3>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </article>
                  ))}
                </div>
              </section>
            ) : null}

            <InternalLinkSection
              eyebrow="Related Pages"
              title="Continue comparing nearby options"
              links={page.entry.internalLinks}
            />
          </div>
        </ShowcaseLayout>
      </ViewerVoteStateProvider>
      <Footer />
    </main>
  );
}
