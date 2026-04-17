import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SubmitProductForm } from "@/components/founder/submit-product-form";
import { getServerSession } from "@/server/auth/session";
import { getCachedCatalogOptions } from "@/server/cache/catalog-options";
import { getEnv } from "@/server/env";
import { listSelectableLaunchWeeks } from "@/server/services/launch-scheduling";
import { getFounderSubmissionDraft } from "@/server/services/submission-service";
import { Footer } from "@/components/ui/footer";
import { ArrowRight } from "lucide-react";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";

type SubmitPageProps = {
  searchParams?: Promise<{
    draft?: string;
  }>;
};

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Submit Your SaaS Product | ShipBoost",
  description:
    "Submit your SaaS product to ShipBoost, choose a Free Launch or Premium Launch path, and turn launch into ongoing distribution.",
  url: "/submit",
});

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const session = await getServerSession();
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const resumeHref = resolvedSearchParams?.draft
    ? `/submit?draft=${encodeURIComponent(resolvedSearchParams.draft)}`
    : "/submit";
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

  if (!session) {
    return (
      <main className="flex-1 flex flex-col bg-background pt-32">
        <section className="mx-auto max-w-4xl px-6">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl font-black tracking-tight text-foreground ">
              Submit your product
            </h1>
            <p className="text-xl font-medium text-muted-foreground">
              Turn your launch into a cleaner public listing, weekly board visibility, and discovery that can keep working after launch day.
            </p>
          </div>

          <div className="mb-8 grid gap-4 sm:grid-cols-2">
            {[
              "Weekly launch board placement",
              "Founder-ready public listing",
              "Category and alternatives discovery over time",
              "Dashboard control over your launch and listing",
            ].map((item) => (
              <div
                key={item}
                className="rounded-[2rem] border border-border bg-card px-5 py-5 text-sm font-bold text-foreground shadow-sm"
              >
                {item}
              </div>
            ))}
          </div>

          {isPrelaunch ? (
            <div className="mb-8 rounded-[2rem] border border-primary/20 bg-primary/5 px-6 py-5 text-center">
              <p className="text-[10px] font-black  tracking-[0.3em] text-primary">
                Prelaunch Mode
              </p>
              <p className="mt-3 text-sm font-bold text-foreground">
                ShipBoost opens on May 4, 2026 UTC. Submit now to line up your
                launch before the public opening.
              </p>
            </div>
          ) : null}

          <div className="bg-card border border-border rounded-[2.5rem] p-10 shadow-xl shadow-black/5 text-center space-y-8 mb-32">
            <p className="text-lg font-medium text-muted-foreground leading-relaxed max-w-2xl mx-auto">
              You need an account to submit to ShipBoost. That keeps your draft,
              listing, and launch status tied to one founder workflow from
              submission through launch.
            </p>
            <p className="text-sm font-bold text-muted-foreground/80">
              Save your draft anytime and come back later. You do not need to
              finish everything in one session.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={`/sign-up?redirect=${encodeURIComponent(resumeHref)}`}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 transition-all"
              >
                Create an account
                <ArrowRight size={18} />
              </Link>
              <Link
                href={`/sign-in?redirect=${encodeURIComponent(resumeHref)}`}
                className="flex items-center gap-2 bg-muted text-foreground px-8 py-4 rounded-2xl font-black text-sm hover:opacity-70 transition-all"
              >
                Log in
              </Link>
            </div>
          </div>
        </section>
        <Footer className="mt-auto" />
      </main>
    );
  }

  let initialDraft = null;

  if (resolvedSearchParams?.draft) {
    try {
      const submission = await getFounderSubmissionDraft(
        resolvedSearchParams.draft,
        { id: session.user.id },
      );

      initialDraft = {
        id: submission.id,
        submissionType: submission.submissionType,
        reviewStatus: submission.reviewStatus,
        paymentStatus: submission.paymentStatus,
        badgeVerification: submission.badgeVerification,
        preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
        tool: {
          id: submission.tool.id,
          slug: submission.tool.slug,
          name: submission.tool.name,
          tagline: submission.tool.tagline,
          websiteUrl: submission.tool.websiteUrl,
          richDescription: submission.tool.richDescription,
          pricingModel: submission.tool.pricingModel,
          affiliateUrl: submission.tool.affiliateUrl,
          affiliateSource: submission.tool.affiliateSource,
          hasAffiliateProgram: submission.tool.hasAffiliateProgram,
          founderXUrl: submission.tool.founderXUrl,
          founderGithubUrl: submission.tool.founderGithubUrl,
          founderLinkedinUrl: submission.tool.founderLinkedinUrl,
          founderFacebookUrl: submission.tool.founderFacebookUrl,
          logoMedia: submission.tool.logoMedia
            ? {
                url: submission.tool.logoMedia.url,
                publicId: submission.tool.logoMedia.publicId ?? undefined,
                format: submission.tool.logoMedia.format ?? undefined,
                width: submission.tool.logoMedia.width ?? undefined,
                height: submission.tool.logoMedia.height ?? undefined,
              }
            : null,
          screenshots: submission.tool.media
            .filter((media) => media.type === "SCREENSHOT")
            .map((media) => ({
              url: media.url,
              publicId: media.publicId ?? undefined,
              format: media.format ?? undefined,
              width: media.width ?? undefined,
              height: media.height ?? undefined,
            })),
          categoryIds: submission.tool.toolCategories.map(
            (item) => item.categoryId,
          ),
          tagIds: submission.tool.toolTags.map((item) => item.tagId),
        },
      };
    } catch {
      redirect("/dashboard");
    }
  }

  const { categories, tags } = await getCachedCatalogOptions();

  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <section className="mx-auto max-w-7xl px-6 mb-32">
        <div className="mb-8 rounded-[2rem] border border-border bg-card p-6 shadow-sm">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
            Before you submit
          </p>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-foreground">
                What you get when you submit to ShipBoost
              </h2>
              <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
                Submit once, save your draft at any point, and build toward a
                public listing, weekly launch placement, and discovery paths
                that can keep working after launch day.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Weekly launch board placement",
                "Founder-ready public listing",
                "Category and alternatives discovery",
                "You can update your listing later",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-border bg-muted/20 px-4 py-4 text-sm font-bold text-foreground"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
        <SubmitProductForm
          categories={categories}
          tags={tags}
          supportEmail={env.RESEND_REPLY_TO_TRANSACTIONAL ?? session.user.email}
          premiumLaunchWeeks={premiumLaunchWeeks}
          initialDraft={initialDraft}
          isPrelaunch={isPrelaunch}
        />
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
