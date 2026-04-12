import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { FounderToolEditor } from "@/components/founder/founder-tool-editor";
import { getServerSession } from "@/server/auth/session";
import { getCachedCatalogOptions } from "@/server/cache/catalog-options";
import { getFounderToolEditorById } from "@/server/services/tool-service";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export default async function FounderToolEditorPage(context: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const { toolId } = await context.params;
  const [tool, catalogOptions] = await Promise.all([
    getFounderToolEditorById(session.user.id, toolId),
    getCachedCatalogOptions(),
  ]);
  const { categories, tags } = catalogOptions;

  if (!tool) {
    notFound();
  }

  const serializedTool = {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    richDescription: tool.richDescription,
    pricingModel: tool.pricingModel,
    hasAffiliateProgram: tool.hasAffiliateProgram,
    founderXUrl: tool.founderXUrl,
    founderGithubUrl: tool.founderGithubUrl,
    founderLinkedinUrl: tool.founderLinkedinUrl,
    founderFacebookUrl: tool.founderFacebookUrl,
    logoMedia: tool.logoMedia
      ? {
          id: tool.logoMedia.id,
          url: tool.logoMedia.url,
          format: tool.logoMedia.format,
          width: tool.logoMedia.width,
          height: tool.logoMedia.height,
        }
      : null,
    screenshots: tool.media.map((media) => ({
        id: media.id,
        url: media.url,
        format: media.format,
        width: media.width,
        height: media.height,
      })),
    toolCategories: tool.toolCategories.map((item) => ({
      categoryId: item.categoryId,
    })),
    toolTags: tool.toolTags.map((item) => ({
      tagId: item.tagId,
    })),
  };

  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-secondary/30 pt-32">
      <section className="mx-auto mb-32 flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6">
        <FounderToolEditor
          tool={serializedTool}
          categories={categories}
          tags={tags}
        />
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
