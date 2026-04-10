import { redirect } from "next/navigation";

import { FounderDashboard } from "@/components/founder/founder-dashboard";
import { getServerSession } from "@/server/auth/session";
import { listFounderListingClaims } from "@/server/services/listing-claim-service";
import {
  listFounderSubmissions,
  reconcileFeaturedLaunchCheckout,
} from "@/server/services/submission-service";
import { listFounderTools } from "@/server/services/tool-service";
import { Footer } from "@/components/ui/footer";

type DashboardPageProps = {
  searchParams?: Promise<{
    checkout?: string;
    checkout_id?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const reconciledCheckoutSubmission =
    resolvedSearchParams?.checkout === "success" &&
    resolvedSearchParams.checkout_id
      ? await reconcileFeaturedLaunchCheckout(resolvedSearchParams.checkout_id)
      : null;

  const [submissions, tools, claims] = await Promise.all([
    listFounderSubmissions(session.user.id),
    listFounderTools(session.user.id),
    listFounderListingClaims(session.user.id),
  ]);
  const initialSuccessMessage =
    resolvedSearchParams?.checkout === "success"
      ? reconciledCheckoutSubmission?.paymentStatus === "PAID"
        ? "Checkout completed. Shipboost confirmed your featured launch payment."
        : "Checkout completed. Shipboost is syncing your featured launch payment now."
      : null;
  const serializedSubmissions = submissions.map((submission) => ({
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    paidAt: submission.paidAt?.toISOString() ?? null,
    tool: {
      ...submission.tool,
      launches: submission.tool.launches.map((launch) => ({
        ...launch,
        launchDate: launch.launchDate.toISOString(),
      })),
    },
  }));
  const serializedTools = tools.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    moderationStatus: tool.moderationStatus,
    publicationStatus: tool.publicationStatus,
    isFeatured: tool.isFeatured,
    updatedAt: tool.updatedAt.toISOString(),
    launches: tool.launches.map((launch) => ({
      id: launch.id,
      launchType: launch.launchType,
      status: launch.status,
      launchDate: launch.launchDate.toISOString(),
    })),
    logoMedia: tool.logoMedia
      ? {
          url: tool.logoMedia.url,
        }
      : null,
  }));
  const serializedClaims = claims.map((claim) => ({
    id: claim.id,
    status: claim.status,
    claimEmail: claim.claimEmail,
    claimDomain: claim.claimDomain,
    websiteDomain: claim.websiteDomain,
    founderVisibleNote: claim.founderVisibleNote,
    reviewedAt: claim.reviewedAt?.toISOString() ?? null,
    createdAt: claim.createdAt.toISOString(),
    tool: {
      id: claim.tool.id,
      slug: claim.tool.slug,
      name: claim.tool.name,
      tagline: claim.tool.tagline,
      websiteUrl: claim.tool.websiteUrl,
      logoMedia: claim.tool.logoMedia
        ? {
            url: claim.tool.logoMedia.url,
          }
        : null,
    },
  }));

  return (
    <main className="flex-1 flex flex-col bg-secondary/30 pt-32">
      <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 mb-32">
        <FounderDashboard
          initialSubmissions={serializedSubmissions}
          initialTools={serializedTools}
          initialClaims={serializedClaims}
          founderEmail={session.user.email}
          founderRole={session.user.role ?? "FOUNDER"}
          initialSuccessMessage={initialSuccessMessage}
        />
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
