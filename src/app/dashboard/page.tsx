import { redirect } from "next/navigation";

import { FounderDashboard } from "@/components/founder/founder-dashboard";
import { getServerSession } from "@/server/auth/session";
import { listFounderSubmissions } from "@/server/services/submission-service";
import { listFounderTools } from "@/server/services/tool-service";

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

  const [submissions, tools] = await Promise.all([
    listFounderSubmissions(session.user.id),
    listFounderTools(session.user.id),
  ]);
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const initialSuccessMessage =
    resolvedSearchParams?.checkout === "success"
      ? "Checkout completed. Shipboost is syncing your featured launch payment now."
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
    logoMedia: tool.logoMedia
      ? {
          url: tool.logoMedia.url,
        }
      : null,
  }));

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <FounderDashboard
        initialSubmissions={serializedSubmissions}
        initialTools={serializedTools}
        founderEmail={session.user.email}
        founderRole={session.user.role ?? "FOUNDER"}
        initialSuccessMessage={initialSuccessMessage}
      />
    </section>
  );
}
