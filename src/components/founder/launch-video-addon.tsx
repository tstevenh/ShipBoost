"use client";

import { Check } from "lucide-react";

import { LaunchVideoWithTimeline } from "@/components/public/launch-video-timeline";
import {
  LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH,
  formatLaunchVideoPriceNote,
  getLaunchVideoFeatures,
  getLaunchVideoTerms,
  type LaunchVideoMode,
  type LaunchVideoOffer,
} from "@/lib/launch-video";
import { cn } from "@/lib/utils";

export function LaunchVideoAddon({
  offer,
  mode,
  selected,
  premiumBundleTotal,
  focusNote,
  onToggle,
  onFocusNoteChange,
  onSwitchToPremium,
}: {
  offer: LaunchVideoOffer;
  mode: LaunchVideoMode;
  selected: boolean;
  /** Premium Launch + video, shown to free launchers as the cheaper path. */
  premiumBundleTotal?: number;
  focusNote: string;
  onToggle: () => void;
  onFocusNoteChange: (value: string) => void;
  onSwitchToPremium?: () => void;
}) {
  const priceNote = formatLaunchVideoPriceNote(offer, mode);
  const showPremiumNudge =
    mode === "standalone" &&
    onSwitchToPremium !== undefined &&
    premiumBundleTotal !== undefined &&
    premiumBundleTotal < offer.priceUsd.standalone;

  return (
    <div>
      <p className="mb-4 text-[10px] font-black tracking-[0.3em] text-foreground/40">
        Launch video
      </p>
      <p className="mb-4 text-sm font-medium text-muted-foreground">
        Most launch posts are a screenshot and a link, and people scroll past both. Optional — added at checkout.
      </p>

      <div
        className={cn(
          "rounded-2xl border bg-card transition-all",
          selected ? "border-primary ring-2 ring-primary/5" : "border-border",
        )}
      >
        <div className="flex items-center gap-3 p-4">
          <input
            type="checkbox"
            id="launch-video-addon"
            checked={selected}
            onChange={onToggle}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <label htmlFor="launch-video-addon" className="flex-1 cursor-pointer">
            <span className="text-sm font-black text-foreground">Add a launch video</span>
            <p className="mt-0.5 text-xs font-medium text-muted-foreground">
              A 20-second film of your product doing its job.
            </p>
          </label>
          <div className="shrink-0 text-right">
            <span className="text-sm font-black text-foreground">${offer.priceUsd[mode]}</span>
            <span className="text-xs font-medium text-muted-foreground"> / video</span>
          </div>
        </div>

        <div className="border-t border-border px-4 pb-5 pt-4">
          {offer.demo ? (
            <div className="mb-5">
              <LaunchVideoWithTimeline demo={offer.demo} tone="light" />
            </div>
          ) : null}
          <ul className="space-y-2">
            {getLaunchVideoFeatures(mode).map((feature) => (
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
            <p className="mt-4 text-[10px] font-black tracking-widest text-primary">{priceNote}</p>
          ) : null}
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {getLaunchVideoTerms(mode)}
          </p>

          {showPremiumNudge ? (
            <div className="mt-4 flex flex-col gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs font-medium text-muted-foreground">
                <span className="font-black text-foreground">
                  Premium Launch + video is ${premiumBundleTotal}
                </span>
                , less than the video alone. It includes the editorial article and a reserved week.
              </p>
              <button
                type="button"
                onClick={onSwitchToPremium}
                className="shrink-0 rounded-xl border border-foreground px-3 py-1.5 text-xs font-black text-foreground transition hover:bg-foreground hover:text-background"
              >
                Switch to Premium
              </button>
            </div>
          ) : null}

          {selected ? (
            <div className="mt-4">
              <label
                htmlFor="launch-video-focus"
                className="mb-2 block text-xs font-black text-foreground"
              >
                What should people see your product do?{" "}
                <span className="font-medium text-muted-foreground">(optional)</span>
              </label>
              <input
                id="launch-video-focus"
                type="text"
                value={focusNote}
                maxLength={LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH}
                onChange={(event) => onFocusNoteChange(event.target.value)}
                placeholder="Example: upload a CSV and get a clean chart back"
                className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                One action and its result. The video is built around it. Leave it empty and we pick
                one from your site.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
