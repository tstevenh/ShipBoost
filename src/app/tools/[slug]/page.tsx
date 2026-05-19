import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ToolPrelaunchPageContent } from "@/components/public/tool-prelaunch-page-content";
import { ToolPageContent } from "@/components/public/tool-page-content";
import { getEnv } from "@/server/env";
import {
  getCachedToolPage,
  getCachedRelatedPublishedTools,
  getCachedToolStaticParams,
} from "@/server/cache/public-content";
import { getBestGuideEntriesForTool } from "@/server/seo/best-pages";
import { resolveSameOriginCanonicalUrl } from "@/server/seo/page-metadata";
import { hasAlternativesSeoPage } from "@/server/services/seo-service";
import {
  buildToolPageDescription,
  buildToolPageTitle,
} from "@/server/services/tool-page";
export const revalidate = 3600;

type RouteContext = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return getCachedToolStaticParams();
}

export async function generateMetadata(
  context: RouteContext,
): Promise<Metadata> {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);

  if (!toolPage) {
    return {
      title: "Tool not found | ShipBoost",
    };
  }

  const env = getEnv();

  if (toolPage.kind === "prelaunch") {
    const { tool } = toolPage;
    const canonical = `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`;

    return {
      title: `${tool.name} is launching soon | ShipBoost`,
      description: `${tool.name}: ${tool.tagline}`,
      alternates: {
        canonical,
      },
      robots: {
        index: false,
        follow: false,
      },
      openGraph: {
        title: `${tool.name} is launching soon | ShipBoost`,
        description: `${tool.name}: ${tool.tagline}`,
        url: canonical,
        siteName: "ShipBoost",
        type: "website",
        images: tool.logoMedia
          ? [
              {
                url: tool.logoMedia.url,
                alt: `${tool.name} logo`,
              },
            ]
          : undefined,
      },
      twitter: {
        card: tool.logoMedia ? "summary_large_image" : "summary",
        title: `${tool.name} is launching soon | ShipBoost`,
        description: `${tool.name}: ${tool.tagline}`,
        images: tool.logoMedia ? [tool.logoMedia.url] : undefined,
      },
    };
  }

  const { tool } = toolPage;
  const title = buildToolPageTitle(tool);
  const description = buildToolPageDescription(tool);
  const canonical = resolveSameOriginCanonicalUrl(
    tool.canonicalUrl,
    `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`,
  );

  const metadata: Metadata = {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "ShipBoost",
      type: "website",
      images: tool.logoMedia
        ? [
            {
              url: tool.logoMedia.url,
              alt: `${tool.name} logo`,
            },
          ]
        : undefined,
    },
    twitter: {
      card: tool.logoMedia ? "summary_large_image" : "summary",
      title,
      description,
      images: tool.logoMedia ? [tool.logoMedia.url] : undefined,
    },
  };

  return metadata;
}

export default async function ToolPage(context: RouteContext) {
  const { slug } = await context.params;
  const toolPage = await getCachedToolPage(slug);

  if (!toolPage) {
    notFound();
  }

  if (toolPage.kind === "prelaunch") {
    return (
      <ToolPrelaunchPageContent
        tool={toolPage.tool}
        launchDate={toolPage.launchDate}
      />
    );
  }

  const { tool } = toolPage;
  const primaryCategory = tool.toolCategories[0]?.category ?? null;
  const env = getEnv();
  const canonical = resolveSameOriginCanonicalUrl(
    tool.canonicalUrl,
    `${env.NEXT_PUBLIC_APP_URL}/tools/${tool.slug}`,
  );
  const relatedTools = await getCachedRelatedPublishedTools(
    tool.id,
    tool.toolCategories.map((item) => item.category.id),
    tool.toolTags.map((item) => item.tag.id),
  );
  const bestGuideLinks = getBestGuideEntriesForTool({
    primaryCategorySlug: primaryCategory?.slug,
    toolTagSlugs: tool.toolTags.map((item) => item.tag.slug),
  }).map((entry) => ({
    href: `/best/${entry.slug}`,
    label: entry.title,
    description: entry.metaDescription,
  }));
  const relatedListingLinks = [
    ...(primaryCategory
      ? [
          {
            href: `/categories/${primaryCategory.slug}`,
            label: `Browse ${primaryCategory.name} tools`,
            description: `Explore more tools in ${primaryCategory.name} on ShipBoost.`,
          },
        ]
      : []),
    ...tool.toolTags.slice(0, 3).map((item) => ({
      href: `/tags/${item.tag.slug}`,
      label: `More ${item.tag.name} tools`,
      description: `See other products tagged ${item.tag.name}.`,
    })),
    ...(hasAlternativesSeoPage(tool.slug)
      ? [
          {
            href: `/alternatives/${tool.slug}`,
            label: `Compare ${tool.name} alternatives`,
            description: `Evaluate other tools that solve a similar problem.`,
          },
        ]
      : []),
  ];

  return (
    <ToolPageContent
      tool={tool}
      relatedTools={relatedTools}
      relatedListingLinks={relatedListingLinks}
      bestGuideLinks={bestGuideLinks}
      canonicalUrl={canonical}
    />
  );
}
