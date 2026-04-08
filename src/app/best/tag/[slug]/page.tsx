import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicToolCard } from "@/components/public/public-tool-card";
import { getEnv } from "@/server/env";
import { getBestTagSeoPage } from "@/server/services/seo-service";

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const page = await getBestTagSeoPage(slug);

  if (!page) {
    return {
      title: "Page not found | Shipboost",
    };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/best/tag/${slug}`;

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

export default async function BestTagPage(context: RouteContext) {
  const { slug } = await context.params;
  const page = await getBestTagSeoPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
          Best by tag
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          {page.entry.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">
          {page.entry.intro}
        </p>
      </div>

      <div className="mt-8 grid gap-4">
        {page.tools.map((tool) => (
          <PublicToolCard
            key={tool.id}
            tool={tool}
            sourceSurface="best_tag_page"
          />
        ))}
      </div>
    </section>
  );
}
