import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LaunchVideoBriefCard } from "@/components/founder/launch-video-brief-card";
import { Footer } from "@/components/ui/footer";
import { getServerSession } from "@/server/auth/session";
import { AppError } from "@/server/http/app-error";
import { getFounderLaunchVideoBrief } from "@/server/services/launch-video-brief-service";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export default async function FounderLaunchVideoBriefPage({ params }: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  const { submissionId } = await params;
  const brief = await getFounderLaunchVideoBrief(submissionId, {
    id: session.user.id,
  }).catch((error) => {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  });

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

        <div className="space-y-3">
          <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40">
            Launch video
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Video brief for {brief.toolName}
          </h1>
          <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
            Four optional answers that make the video sharper. Leave any of them empty and we
            build that part from your site and listing.
          </p>
        </div>

        <div className="mt-8">
          <LaunchVideoBriefCard initialBrief={brief} />
        </div>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
