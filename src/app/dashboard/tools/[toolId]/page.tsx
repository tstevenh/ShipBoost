import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

import { FounderToolEditor } from "@/components/founder/founder-tool-editor";
import { SubmitProductForm } from "@/components/founder/submit-product-form";
import { getServerSession } from "@/server/auth/session";
import { getCachedCatalogOptions } from "@/server/cache/catalog-options";
import { getEnv } from "@/server/env";
import {
  listSelectableLaunchWeeks,
  scheduleNextFreeLaunchDate,
} from "@/server/services/launch-scheduling";
import { getFounderToolById } from "@/server/services/tool-service";
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
  const env = getEnv();
  const isPrelaunch = env.NEXT_PUBLIC_PRELAUNCH_MODE === "true";
  const premiumLaunchWeeks = listSelectableLaunchWeeks({
    goLiveAt: new Date(env.LAUNCHPAD_GO_LIVE_AT),
  }).map((weekStart) => ({
    value: weekStart.toISOString().slice(0, 10),
    label: `Week of ${new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: "UTC",
    }).format(weekStart)}`,
  }));
  const [tool, catalogOptions, estimatedFreeLaunchDate] = await Promise.all([
    getFounderToolById(session.user.id, toolId),
    getCachedCatalogOptions(),
    scheduleNextFreeLaunchDate(),
  ]);
  const { categories, tags } = catalogOptions;

  if (!tool) {
    notFound();
  }

  const latestSubmission = tool.submissions[0] ?? null;
  const initialDraft = latestSubmission
    ? {
        id: latestSubmission.id,
        submissionType: latestSubmission.submissionType,
        reviewStatus: latestSubmission.reviewStatus,
        paymentStatus: latestSubmission.paymentStatus,
        badgeVerification: latestSubmission.badgeVerification,
        preferredLaunchDate: latestSubmission.preferredLaunchDate?.toISOString() ?? null,
        tool: {
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
          logoMedia: tool.logoMedia
            ? {
                url: tool.logoMedia.url,
                publicId: tool.logoMedia.publicId ?? undefined,
                format: tool.logoMedia.format ?? undefined,
                width: tool.logoMedia.width ?? undefined,
                height: tool.logoMedia.height ?? undefined,
              }
            : null,
          screenshots: tool.media
            .filter((media) => media.type === "SCREENSHOT")
            .map((media) => ({
              url: media.url,
              publicId: media.publicId ?? undefined,
              format: media.format ?? undefined,
              width: media.width ?? undefined,
              height: media.height ?? undefined,
            })),
          categoryIds: tool.toolCategories.map((item) => item.categoryId),
          tagIds: tool.toolTags.map((item) => item.tagId),
          launches: tool.launches.map((launch) => ({
            id: launch.id,
            launchType: launch.launchType,
            status: launch.status,
            launchDate: launch.launchDate.toISOString(),
          })),
        },
      }
    : null;

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
    <main className="flex flex-1 flex-col overflow-x-hidden bg-muted/20 pt-32">
      <section className="mx-auto mb-32 flex w-full max-w-[1500px] flex-1 flex-col px-4 sm:px-6">
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-border bg-card px-5 py-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-flex rounded-lg border border-border bg-muted p-2 text-muted-foreground">
              <ArrowRight size={16} />
            </span>
            <div>
              <h2 className="text-sm font-black text-foreground">
                Submit your product to ShipBoost
              </h2>
              <p className="mt-1 text-sm font-medium text-muted-foreground">
                Save your listing, schedule a free launch, or skip the waiting line with Premium Launch.
              </p>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
          >
            Compare launch options
            <ArrowRight size={15} />
          </Link>
        </div>
        {initialDraft ? (
          <SubmitProductForm
            categories={categories}
            tags={tags}
            appUrl={env.NEXT_PUBLIC_APP_URL}
            supportEmail={env.RESEND_REPLY_TO_TRANSACTIONAL ?? session.user.email}
            premiumLaunchWeeks={premiumLaunchWeeks}
            estimatedFreeLaunchDate={estimatedFreeLaunchDate.toISOString()}
            initialDraft={initialDraft}
            isPrelaunch={isPrelaunch}
          />
        ) : (
          <FounderToolEditor
            tool={serializedTool}
            categories={categories}
            tags={tags}
          />
        )}
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
