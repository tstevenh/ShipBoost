import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicToolCard } from "@/components/public/public-tool-card";
import { getEnv } from "@/server/env";
import { getAlternativesSeoPage } from "@/server/services/seo-service";

type RouteContext = {
  params: Promise<{ slug: string }>;
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
  const page = await getAlternativesSeoPage(slug);

  if (!page) {
    notFound();
  }

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
          Alternatives
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          {page.entry.title}
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">
          {page.entry.intro}
        </p>

        <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#9f4f1d] uppercase">
            Anchor product
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-black">
            {page.anchorTool.name}
          </h2>
          <p className="mt-2 text-sm leading-7 text-black/66">
            {page.anchorTool.tagline}
          </p>
          <Link
            href={`/tools/${page.anchorTool.slug}`}
            className="mt-4 inline-flex text-sm font-medium text-[#143f35]"
          >
            View original listing
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {page.tools.map((tool) => (
          <PublicToolCard
            key={tool.id}
            tool={tool}
            sourceSurface="alternatives_page"
          />
        ))}
      </div>
    </section>
  );
}
