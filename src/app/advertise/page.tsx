import type { Metadata } from "next";
import Link from "next/link";
import {
  CheckCircle2,
  Clock,
  Eye,
  MousePointerClick,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { AdvertiseSponsorForm } from "@/components/public/advertise-sponsor-form";
import { Button } from "@/components/ui/button";
import { getServerSession } from "@/server/auth/session";
import {
  countActiveSponsorPlacements,
  listFounderSponsorEligibleTools,
  reconcileSponsorPlacementPayment,
} from "@/server/services/sponsor-placement-service";

export const metadata: Metadata = {
  title: "Advertise on ShipBoost | Sponsor Placement",
  description:
    "Reserve one of three ShipBoost sponsor placements for an approved live or scheduled tool.",
};

type AdvertisePageProps = {
  searchParams?: Promise<{
    checkout?: string;
    sponsor_placement_id?: string;
    payment_id?: string;
    status?: string;
  }>;
};

export default async function AdvertisePage({
  searchParams,
}: AdvertisePageProps) {
  const [session, params] = await Promise.all([
    getServerSession(),
    searchParams ??
      Promise.resolve(
        {} as {
          checkout?: string;
          sponsor_placement_id?: string;
          payment_id?: string;
          status?: string;
        },
      ),
  ]);

  const reconciledSponsorPlacement =
    session &&
    params.checkout === "success" &&
    params.payment_id
      ? await reconcileSponsorPlacementPayment({
          placementId: params.sponsor_placement_id,
          paymentId: params.payment_id,
          founderUserId: session.user.id,
        })
      : null;

  const [activeCount, tools] = await Promise.all([
    countActiveSponsorPlacements(),
    session ? listFounderSponsorEligibleTools(session.user.id) : [],
  ]);
  const soldOut = activeCount >= 3;
  const successMessage =
    params.checkout === "success"
      ? params.status && params.status !== "succeeded"
        ? "Checkout did not complete. You can try again when you are ready."
        : reconciledSponsorPlacement?.status === "ACTIVE"
          ? "Payment received. Your sponsor placement is active."
          : reconciledSponsorPlacement?.status === "PAID_WAITLISTED"
            ? "Payment received. Your sponsor placement is reserved and will start when a slot opens."
            : "Payment received. Your sponsor placement is being set up and will appear shortly."
      : null;
  const serializableTools = tools.map((tool) => ({
    ...tool,
    sponsorPlacements: tool.sponsorPlacements.map((placement) => ({
      ...placement,
      endsAt: placement.endsAt?.toISOString() ?? null,
    })),
  }));

  return (
    <main className="min-h-screen bg-muted/20 px-6 pb-24 pt-32 sm:pt-36">
      <div className="mx-auto max-w-5xl space-y-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
          <div className="space-y-5 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black tracking-[0.24em] text-primary">
              SPONSOR PLACEMENT
            </p>
            <h1 className="max-w-3xl text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              Sponsor your tool where founders browse
            </h1>
            <p className="max-w-2xl text-base font-semibold leading-relaxed text-muted-foreground">
              Get one of three sidebar sponsor placements across ShipBoost
              discovery pages. Your card links directly to your website and
              stays live for 30 days.
            </p>
            <div className="flex flex-wrap gap-3 text-xs font-black text-muted-foreground">
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                $59 one-time
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                30-day placement
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                Only 3 active slots
              </span>
              <span className="rounded-full border border-border bg-card px-3 py-1.5">
                Approved tools only
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <p className="text-[10px] font-black tracking-[0.22em] text-primary">
              OFFER
            </p>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-4xl font-black tracking-tight text-foreground">
                  $59
                </p>
                <p className="mt-1 text-xs font-black tracking-widest text-muted-foreground">
                  ONE-TIME FOR 30 DAYS
                </p>
              </div>
              {[
                {
                  icon: Eye,
                  title: "Sidebar placement",
                  text: "Your tool appears in the sponsor stack across discovery pages.",
                },
                {
                  icon: MousePointerClick,
                  title: "Direct website clicks",
                  text: "Sponsor cards send visitors straight to your product website.",
                },
                {
                  icon: Clock,
                  title: "Starts immediately",
                  text: "Live and scheduled approved tools can advertise right away.",
                },
                {
                  icon: ShieldCheck,
                  title: "No subscription",
                  text: "No auto-renewal. Renew manually if you want another run.",
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <item.icon size={16} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-foreground">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs font-semibold leading-relaxed text-muted-foreground">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {successMessage ? (
          <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-700">
            <CheckCircle2 size={18} className="mt-0.5 shrink-0" />
            {successMessage}
          </div>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            "Direct website clicks",
            "Manual renewal",
            `${Math.max(3 - activeCount, 0)} of 3 slots open`,
          ].map((item) => (
            <div
              key={item}
              className="rounded-xl border border-border bg-card p-4 text-sm font-black shadow-sm"
            >
              {item}
            </div>
          ))}
        </div>

        {session ? (
          <AdvertiseSponsorForm tools={serializableTools} soldOut={soldOut} />
        ) : (
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Sparkles size={17} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight">
                  Sign in to sponsor your tool
                </h2>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
                  Sponsor placements are available for tools you own on
                  ShipBoost. If you do not have a listing yet, submit first.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/sign-in?redirect=/advertise">
                  Sign in to sponsor a tool
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/submit">Submit your tool</Link>
              </Button>
            </div>
          </div>
        )}

        <section className="grid gap-4 md:grid-cols-4">
          {[
            {
              title: "Choose your tool",
              text: "Select an approved live or scheduled tool from your account.",
            },
            {
              title: "Pay once",
              text: "Checkout is one-time for this 30-day placement.",
            },
            {
              title: "Go live",
              text: "Your sponsor card appears after payment is confirmed.",
            },
            {
              title: "Manage later",
              text: "Track sponsor status from your founder dashboard.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-xl border border-border bg-card p-5 shadow-sm"
            >
              <h3 className="text-sm font-black text-foreground">
                {item.title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
                {item.text}
              </p>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
