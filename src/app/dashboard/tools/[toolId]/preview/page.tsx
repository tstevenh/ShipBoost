import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ToolPageContent } from "@/components/public/tool-page-content";
import { getServerSession } from "@/server/auth/session";
import { getCachedRelatedPublishedTools } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { getBestGuideEntriesForTool } from "@/server/seo/best-pages";
import { resolveSameOriginCanonicalUrl } from "@/server/seo/page-metadata";
import { hasAlternativesSeoPage } from "@/server/services/seo-service";
import {
  getFounderToolPreviewById,
} from "@/server/services/tool-service";
import {
  buildToolPageDescription,
  buildToolPageTitle,
} from "@/server/services/tool-page";
import { isToolPubliclyVisible } from "@/server/services/public-tool-visibility";

const previewPageMetadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function generateMetadata(context: RouteContext): Promise<Metadata> {
  const session = await getServerSession();

  if (!session) {
    return previewPageMetadata;
  }

  const { toolId } = await context.params;
  const tool = await getFounderToolPreviewById(session.user.id, toolId);

  if (!tool) {
    return previewPageMetadata;
  }

  return {
    title: `${buildToolPageTitle(tool)} Preview`,
    description: buildToolPageDescription(tool),
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function FounderToolPreviewPage(context: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const { toolId } = await context.params;
  const tool = await getFounderToolPreviewById(session.user.id, toolId);

  if (!tool) {
    notFound();
  }

  if (isToolPubliclyVisible(tool)) {
    redirect(`/tools/${tool.slug}`);
  }

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
  const primaryCategory = tool.toolCategories[0]?.category ?? null;
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
      isPreview
    />
  );
}
