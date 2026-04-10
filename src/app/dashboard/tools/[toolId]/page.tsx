import { notFound, redirect } from "next/navigation";

import { FounderToolEditor } from "@/components/founder/founder-tool-editor";
import { getServerSession } from "@/server/auth/session";
import { listCategories, listTags } from "@/server/services/catalog-service";
import { getFounderToolById } from "@/server/services/tool-service";
import { Footer } from "@/components/ui/footer";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export default async function FounderToolEditorPage(context: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const { toolId } = await context.params;
  const [tool, categories, tags] = await Promise.all([
    getFounderToolById(session.user.id, toolId),
    listCategories(),
    listTags(),
  ]);

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
    affiliateUrl: tool.affiliateUrl,
    affiliateSource: tool.affiliateSource,
    hasAffiliateProgram: tool.hasAffiliateProgram,
    founderXUrl: tool.founderXUrl,
    founderGithubUrl: tool.founderGithubUrl,
    founderLinkedinUrl: tool.founderLinkedinUrl,
    founderFacebookUrl: tool.founderFacebookUrl,
    metaTitle: tool.metaTitle,
    metaDescription: tool.metaDescription,
    canonicalUrl: tool.canonicalUrl,
    logoMedia: tool.logoMedia
      ? {
          id: tool.logoMedia.id,
          url: tool.logoMedia.url,
          format: tool.logoMedia.format,
          width: tool.logoMedia.width,
          height: tool.logoMedia.height,
        }
      : null,
    screenshots: tool.media
      .filter((media) => media.type === "SCREENSHOT")
      .map((media) => ({
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
    <main className="flex-1 flex flex-col bg-secondary/30 pt-32">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 mb-32">
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
