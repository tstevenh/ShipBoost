import Link from "next/link";
import { ArrowRight, Check, MousePointer2 } from "lucide-react";

import {
  LaunchVideoTimeline,
  LaunchVideoWithTimeline,
} from "@/components/public/launch-video-timeline";
import {
  LAUNCH_VIDEO_LATER_PRICE_USD,
  LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT,
  LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS,
  type LaunchVideoOffer,
} from "@/lib/launch-video";

const POINTS = [
  "Your real interface, never a mockup",
  "One click and what it produces, cut to music",
  "Yours to post anywhere, with a small “Launched on ShipBoost” on the end card",
];

function FramesIllustration() {
  return (
    <div className="relative flex h-full min-h-48 items-center" aria-hidden="true">
      {/* 16:9 cut */}
      <div className="relative aspect-video w-[72%] rounded-xl border border-background/25 p-4">
        <div className="h-2 w-1/3 rounded-full bg-background/30" />
        <div className="mt-2 h-2 w-1/2 rounded-full bg-background/15" />
        <div className="mt-5 grid grid-cols-3 gap-2">
          <div className="h-8 rounded-md bg-background/10" />
          <div className="h-8 rounded-md bg-background/10" />
          <div className="h-8 rounded-md bg-background/10" />
        </div>
        <div className="absolute bottom-4 left-4 flex items-center">
          <div className="rounded-full bg-background px-3 py-1.5 text-[10px] font-black text-foreground">
            Export
          </div>
          <span className="absolute -left-1.5 -top-1.5 h-[calc(100%+12px)] w-[calc(100%+12px)] rounded-full border border-background/40" />
          <MousePointer2
            size={18}
            className="absolute left-[70%] top-[60%] fill-background text-foreground"
          />
        </div>
      </div>
      {/* 9:16 cut */}
      <div className="absolute right-0 top-1/2 aspect-[9/16] h-[88%] -translate-y-1/2 rounded-xl border border-background/40 bg-foreground p-3">
        <div className="h-1.5 w-2/3 rounded-full bg-background/30" />
        <div className="mt-1.5 h-1.5 w-1/2 rounded-full bg-background/15" />
        <div className="mt-4 h-16 rounded-md bg-background/10" />
        <div className="mx-auto mt-4 w-fit rounded-full bg-background px-2.5 py-1 text-[9px] font-black text-foreground">
          Export
        </div>
      </div>
    </div>
  );
}

export function LaunchVideoPricing({
  offer,
  premiumLaunchPrice,
}: {
  offer: LaunchVideoOffer;
  premiumLaunchPrice: number;
}) {
  const launchPriceLine =
    offer.launchPriceSpotsLeft > 0
      ? `Launch price for the first ${LAUNCH_VIDEO_LAUNCH_PRICE_LIMIT} videos (${offer.launchPriceSpotsLeft} left), then $${LAUNCH_VIDEO_LATER_PRICE_USD.premium} and $${LAUNCH_VIDEO_LATER_PRICE_USD.standalone}. `
      : "";

  return (
    <div id="launch-video" className="mt-20 scroll-mt-28">
      <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40 mb-2">
        Launch video
      </p>
      <h2 className="text-2xl font-black tracking-tight text-foreground">
        A 20-second film of your product doing its job.
      </h2>
      <p className="mt-3 max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground">
        One real action in your product and the result it produces, cut for X and YouTube in 16:9
        and for Shorts in 9:16. Add it to any launch.
      </p>

      <div className="mt-8 grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        {/* The film: sample video once we have one, the format until then */}
        <div className="flex flex-col justify-between gap-6 rounded-3xl bg-foreground p-6 text-background shadow-sm sm:p-8">
          {offer.demo ? (
            <LaunchVideoWithTimeline demo={offer.demo} />
          ) : (
            <>
              <div className="flex items-center justify-between text-xs font-bold text-background/60">
                <span>20 seconds</span>
                <span>16:9 and 9:16</span>
              </div>
              <FramesIllustration />
              <LaunchVideoTimeline />
            </>
          )}
        </div>

        {/* Two prices, then what every video includes */}
        <div className="flex flex-col">
          <div className="grid gap-4 sm:grid-cols-2">
            <article className="flex flex-col rounded-3xl border border-primary bg-card p-6 shadow-sm ring-4 ring-primary/5">
              <p className="text-[10px] font-black tracking-[0.2em] text-primary">
                With Premium Launch
              </p>
              <p className="mt-4 text-5xl font-black tracking-tighter text-foreground">
                ${offer.priceUsd.premium}
              </p>
              <p className="mt-3 text-sm font-medium leading-snug text-foreground/70">
                Delivered during your launch week.
              </p>
              <p className="mt-auto pt-3 text-xs text-muted-foreground">
                ${premiumLaunchPrice + offer.priceUsd.premium} together with Premium.
              </p>
            </article>
            <article className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm">
              <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40">
                With a free launch
              </p>
              <p className="mt-4 text-5xl font-black tracking-tighter text-foreground">
                ${offer.priceUsd.standalone}
              </p>
              <p className="mt-3 text-sm font-medium leading-snug text-foreground/70">
                Delivered within {LAUNCH_VIDEO_STANDALONE_DELIVERY_DAYS} days of your order.
              </p>
            </article>
          </div>

          <ul className="mt-6 space-y-3">
            {POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-2.5 text-sm font-medium text-foreground/70"
              >
                <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                {point}
              </li>
            ))}
          </ul>

          <p className="mt-5 text-xs leading-relaxed text-muted-foreground">
            {launchPriceLine}No revision rounds: we fix any fact we get wrong, and refund you in
            full if the video is late.
          </p>

          <div className="mt-auto pt-6">
            <Link
              href="/submit?addon=launch-video"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-xl shadow-black/20 transition-all hover:opacity-90 active:scale-95"
            >
              Submit with a launch video
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
