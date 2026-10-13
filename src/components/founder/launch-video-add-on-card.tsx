"use client";

import { useState } from "react";
import { Check, LoaderCircle } from "lucide-react";

import { LaunchVideoWithTimeline } from "@/components/public/launch-video-timeline";
import {
  formatLaunchVideoPriceNote,
  getLaunchVideoFeatures,
  getLaunchVideoTerms,
  type LaunchVideoDelivery,
  type LaunchVideoMode,
  type LaunchVideoOffer,
} from "@/lib/launch-video";

/** Buying a launch video for a launch that is already scheduled. */
export function LaunchVideoAddOnCard({
  submissionId,
  mode,
  delivery,
  priceUsd,
  deliveryLine,
  offer,
}: {
  submissionId: string;
  mode: LaunchVideoMode;
  delivery: LaunchVideoDelivery;
  priceUsd: number;
  deliveryLine: string;
  offer: Pick<LaunchVideoOffer, "launchPriceSpotsLeft" | "demo">;
}) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const priceNote = formatLaunchVideoPriceNote(offer, mode);
  // Features and terms follow the delivery promise, not the price.
  const deliveryMode: LaunchVideoMode = delivery === "launch_week" ? "premium" : "standalone";

  async function beginCheckout() {
    setIsOpening(true);
    setError(null);
    try {
      const response = await fetch("/api/dodo/checkout/launch-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      const payload = (await response.json().catch(() => null)) as {
        data?: { checkoutUrl?: string };
        error?: unknown;
      } | null;

      if (!response.ok || !payload?.data?.checkoutUrl) {
        throw new Error(
          typeof payload?.error === "string" ? payload.error : "Could not open checkout.",
        );
      }

      window.location.assign(payload.data.checkoutUrl);
    } catch (checkoutError) {
      setError(checkoutError instanceof Error ? checkoutError.message : "Could not open checkout.");
      setIsOpening(false);
    }
  }

  return (
    <section className="grid gap-6 rounded-[1.75rem] border border-border bg-muted/30 p-5 sm:p-6 lg:grid-cols-[1.25fr_1fr] lg:gap-8">
      <div className="min-w-0">
        {offer.demo ? <LaunchVideoWithTimeline demo={offer.demo} tone="light" /> : null}
      </div>

      <div className="flex min-w-0 flex-col">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-black tracking-tight text-foreground">${priceUsd}</span>
          <span className="text-sm font-medium text-muted-foreground">
            {mode === "premium" ? "with your Premium Launch" : "one video"}
          </span>
        </div>
        <p className="mt-2 text-sm font-bold text-foreground">{deliveryLine}</p>

        <ul className="mt-5 space-y-2">
          {getLaunchVideoFeatures(deliveryMode).map((feature) => (
            <li
              key={feature}
              className="flex items-start gap-2.5 text-sm font-medium text-foreground/70"
            >
              <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
              {feature}
            </li>
          ))}
        </ul>

        {priceNote ? (
          <p className="mt-5 text-[10px] font-black tracking-widest text-primary">{priceNote}</p>
        ) : null}
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          {getLaunchVideoTerms(deliveryMode)}
        </p>

        {error ? (
          <p className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs font-bold text-destructive">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => void beginCheckout()}
          disabled={isOpening}
          className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-60"
        >
          {isOpening ? <LoaderCircle size={16} className="animate-spin" /> : null}
          {isOpening ? "Opening checkout..." : `Add launch video for $${priceUsd}`}
        </button>
        <p className="mt-2 text-xs text-muted-foreground">
          After checkout you land on a two-minute brief. Every field in it is optional.
        </p>
      </div>
    </section>
  );
}
