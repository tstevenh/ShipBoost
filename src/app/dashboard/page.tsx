import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FounderDashboard } from "@/components/founder/founder-dashboard";
import { getServerSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { listFounderListingClaims } from "@/server/services/listing-claim-service";
import {
  listFounderSubmissions,
  reconcilePremiumLaunchPayment,
} from "@/server/services/submission-service";
import { listFounderTools } from "@/server/services/tool-service";
import { Footer } from "@/components/ui/footer";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type DashboardPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    submission_id?: string;
    payment_id?: string;
    status?: string;
    tab?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getServerSession();
  const isPrelaunch = getEnv().NEXT_PUBLIC_PRELAUNCH_MODE === "true";

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const reconciledCheckoutSubmission =
    resolvedSearchParams?.checkout === "success" &&
    resolvedSearchParams.submission_id &&
    resolvedSearchParams.payment_id
      ? await reconcilePremiumLaunchPayment({
          submissionId: resolvedSearchParams.submission_id,
          paymentId: resolvedSearchParams.payment_id,
        })
      : null;

  const [submissions, tools, claims] = await Promise.all([
    listFounderSubmissions(session.user.id),
    listFounderTools(session.user.id),
    listFounderListingClaims(session.user.id),
  ]);
  const initialSuccessMessage =
    resolvedSearchParams?.checkout === "success"
      ? resolvedSearchParams.status &&
          resolvedSearchParams.status !== "succeeded"
        ? "Checkout did not complete. You can try again from your dashboard."
        : reconciledCheckoutSubmission?.paymentStatus === "PAID"
          ? "Checkout completed. ShipBoost confirmed your premium launch payment."
          : "Checkout completed. ShipBoost is syncing your premium launch payment now."
      : null;
  const serializedSubmissions = submissions.map((submission) => ({
    id: submission.id,
    submissionType: submission.submissionType,
    reviewStatus: submission.reviewStatus,
    preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    paymentStatus: submission.paymentStatus,
    badgeVerification: submission.badgeVerification,
    spotlightBrief: submission.spotlightBrief
      ? {
          status: submission.spotlightBrief.status,
          updatedAt: submission.spotlightBrief.updatedAt.toISOString(),
          publishedAt:
            submission.spotlightBrief.publishedAt?.toISOString() ?? null,
          publishedArticle: submission.spotlightBrief.publishedArticle,
        }
      : null,
    tool: {
      id: submission.tool.id,
      slug: submission.tool.slug,
      name: submission.tool.name,
      websiteUrl: submission.tool.websiteUrl,
      logoMedia: submission.tool.logoMedia
        ? {
            url: submission.tool.logoMedia.url,
          }
        : null,
      launches: submission.tool.launches.map((launch) => ({
        id: launch.id,
        launchType: launch.launchType,
        status: launch.status,
        launchDate: launch.launchDate.toISOString(),
      })),
    },
  }));
  const serializedTools = tools.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    publicationStatus: tool.publicationStatus,
    logoMedia: tool.logoMedia
      ? {
          url: tool.logoMedia.url,
        }
      : null,
  }));
  const serializedClaims = claims.map((claim) => ({
    id: claim.id,
    status: claim.status,
    websiteDomain: claim.websiteDomain,
    tool: {
      id: claim.tool.id,
      slug: claim.tool.slug,
      name: claim.tool.name,
      logoMedia: claim.tool.logoMedia
        ? {
            url: claim.tool.logoMedia.url,
          }
        : null,
    },
  }));

  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-secondary/30 pt-32">
      <section className="mx-auto mb-32 flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6">
        {isPrelaunch ? (
          <div className="mb-8 rounded-[2rem] border border-primary/20 bg-primary/5 px-6 py-5">
            <p className="text-[10px] font-black  tracking-[0.3em] text-primary">
              Prelaunch Mode
            </p>
            <p className="mt-3 text-sm font-bold leading-relaxed text-foreground">
              ShipBoost opens on May 1, 2026 UTC. Your free launches are being
              queued into weekly cohorts, and premium launches can reserve
              their preferred launch week ahead of go-live.
            </p>
          </div>
        ) : null}
        <FounderDashboard
          initialSubmissions={serializedSubmissions}
          initialTools={serializedTools}
          initialClaims={serializedClaims}
          founderEmail={session.user.email}
          founderRole={session.user.role ?? "FOUNDER"}
          initialSuccessMessage={initialSuccessMessage}
          initialActiveNav={
            resolvedSearchParams?.tab === "submissions" ||
            resolvedSearchParams?.tab === "products" ||
            resolvedSearchParams?.tab === "claims"
              ? resolvedSearchParams.tab
              : "overview"
          }
        />
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
