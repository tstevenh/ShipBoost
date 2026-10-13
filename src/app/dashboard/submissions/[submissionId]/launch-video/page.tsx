import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LaunchVideoAddOnCard } from "@/components/founder/launch-video-add-on-card";
import { LaunchVideoBriefCard } from "@/components/founder/launch-video-brief-card";
import { Footer } from "@/components/ui/footer";
import { getServerSession } from "@/server/auth/session";
import { AppError } from "@/server/http/app-error";
import { getFounderLaunchVideoBrief } from "@/server/services/launch-video-brief-service";
import { getFounderLaunchVideoAddOn } from "@/server/services/launch-video-checkout-service";
import { getStandaloneDeliveryWindow } from "@/server/services/launch-video-service";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export default async function FounderLaunchVideoBriefPage({
  params,
}: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const { submissionId } = await params;
  const brief = await getFounderLaunchVideoBrief(submissionId, {
    id: session.user.id,
  }).catch((error) => {
    // No paid video yet: this page sells it instead.
    if (error instanceof AppError && error.statusCode === 404) {
      return null;
    }

    throw error;
  });

  if (!brief) {
    return (
      <LaunchVideoAddOnPage
        submissionId={submissionId}
        founderId={session.user.id}
      />
    );
  }

  return (
    <PageShell>
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
          Launch video
        </p>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          Video brief for {brief.toolName}
        </h1>
        <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
          Four optional answers that make the video sharper. Leave any of them
          empty and we build that part from your site and listing.
        </p>
      </div>

      <div className="mt-8">
        <LaunchVideoBriefCard initialBrief={brief} />
      </div>
    </PageShell>
  );
}

function formatDay(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

async function LaunchVideoAddOnPage({
  submissionId,
  founderId,
}: {
  submissionId: string;
  founderId: string;
}) {
  const found = await getFounderLaunchVideoAddOn(submissionId, founderId);

  if (!found) {
    notFound();
  }

  const { addOn, offer, toolName } = found;
  let deliveryLine: string | null = null;

  if (addOn.ok) {
    const launchWeekStart = new Date(addOn.launchWeekStart);
    const { deliverBy } = getStandaloneDeliveryWindow(new Date());
    deliveryLine =
      addOn.delivery === "launch_week"
        ? `Delivered during your launch week of ${formatDay(launchWeekStart)}.`
        : deliverBy.getTime() <= launchWeekStart.getTime()
          ? `Delivered by ${formatDay(deliverBy)}, before your launch week of ${formatDay(launchWeekStart)}.`
          : `Delivered by ${formatDay(deliverBy)}, 7 days after your order.`;
  }

  return (
    <PageShell>
      <div className="space-y-3">
        <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
          Launch video
        </p>
        <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
          A launch video for {toolName}
        </h1>
        <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
          Most launch posts are a screenshot and a link, and people scroll past
          both. A 20-second video shows {toolName} doing its job before they do.
        </p>
      </div>

      <div className="mt-8">
        {addOn.ok && deliveryLine ? (
          <LaunchVideoAddOnCard
            submissionId={submissionId}
            mode={addOn.mode}
            delivery={addOn.delivery}
            priceUsd={addOn.priceUsd}
            deliveryLine={deliveryLine}
            offer={{
              launchPriceSpotsLeft: offer.launchPriceSpotsLeft,
              demo: offer.demo,
            }}
          />
        ) : (
          <div className="rounded-[1.75rem] border border-border bg-muted/30 p-6 text-sm font-medium text-muted-foreground">
            {addOn.ok
              ? null
              : addOn.reason === "no_launch"
                ? "A launch video can be added once your launch is scheduled."
                : "Launch videos are not available right now."}
          </div>
        )}
      </div>
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col overflow-x-hidden bg-secondary/30 pt-32">
      <section className="mx-auto mb-32 flex w-full max-w-5xl flex-1 flex-col px-4 sm:px-6">
        <div className="mb-6">
          <Link
            href="/dashboard?tab=submissions"
            className="inline-flex items-center gap-2 text-xs font-black tracking-widest text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Back to submissions
          </Link>
        </div>
        {children}
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
