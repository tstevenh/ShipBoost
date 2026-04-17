import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { LaunchSpotlightBriefCard } from "@/components/founder/launch-spotlight-brief-card";
import { Footer } from "@/components/ui/footer";
import { getServerSession } from "@/server/auth/session";
import { AppError } from "@/server/http/app-error";
import { getFounderSpotlightBrief } from "@/server/services/submission-spotlight-service";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export default async function FounderSpotlightPage({ params }: RouteContext) {
  const session = await getServerSession();

  if (!session) {
    redirect("/sign-in");
  }

  if (session.user.role === "ADMIN") {
    redirect("/admin");
  }

  const { submissionId } = await params;
  const brief = await getFounderSpotlightBrief(submissionId, {
    id: session.user.id,
  }).catch((error) => {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    if (
      error instanceof AppError &&
      (error.statusCode === 400 || error.statusCode === 409)
    ) {
      redirect("/dashboard?tab=submissions");
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
            Premium Launch
          </p>
          <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">
            Editorial launch spotlight
          </h1>
          <p className="max-w-3xl text-sm font-medium leading-relaxed text-muted-foreground">
            This is the focused editing view for your premium spotlight brief.
            The dashboard card stays compact, while the full form lives here.
          </p>
        </div>

        <div className="mt-8">
          <LaunchSpotlightBriefCard
            submissionId={submissionId}
            status={brief.status}
            initialPublishedArticle={brief.publishedArticle}
            initialBrief={brief}
          />
        </div>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
