"use client";

import { useState } from "react";

import { LaunchVideoDemo } from "@/components/public/launch-video-demo";
import {
  LAUNCH_VIDEO_FORMAT_LABELS as FORMAT_LABELS,
  LaunchVideoLightbox,
  type LaunchVideoFormat as Format,
} from "@/components/public/launch-video-lightbox";
import {
  LAUNCH_VIDEO_DEMO_CAPTION,
  type LaunchVideoDemo as LaunchVideoDemoSource,
} from "@/lib/launch-video";

// The fixed format, in seconds: what happens where on the 20-second timeline.
const BEATS = [
  { at: 0, label: "Hook" },
  { at: 7, label: "Click" },
  // Three seconds after the click: too close to label on a phone.
  { at: 10, label: "Result", desktopOnly: true },
  { at: 17, label: "End card" },
];
const DURATION = 20;

/**
 * The 20-second ruler under the film. With `progress` (0–1) the playhead follows
 * the sample video; without it, it sweeps on its own in real time.
 */
export function LaunchVideoTimeline({ progress }: { progress?: number }) {
  return (
    <div aria-hidden="true">
      <div className="relative h-5">
        {Array.from({ length: DURATION + 1 }, (_, second) => (
          <span
            key={second}
            className={
              second % 5 === 0
                ? "absolute bottom-0 h-3 w-px bg-background/50"
                : "absolute bottom-0 h-1.5 w-px bg-background/25"
            }
            style={{ left: `${(second / DURATION) * 100}%` }}
          />
        ))}
        <span
          className={`absolute -top-1 bottom-0 w-px bg-background${
            progress === undefined ? " sb-playhead" : ""
          }`}
          style={progress === undefined ? undefined : { left: `${progress * 100}%` }}
        >
          <span className="absolute -left-[3px] -top-[3px] h-[7px] w-[7px] rounded-full bg-background" />
        </span>
      </div>
      <div className="relative mt-2 h-4">
        {BEATS.map((beat) => {
          const reached = progress !== undefined && progress * DURATION >= beat.at;
          return (
            <span
              key={beat.label}
              className={`absolute whitespace-nowrap text-[11px] font-bold transition-colors ${
                reached ? "text-background" : "text-background/60"
              }${"desktopOnly" in beat ? " hidden sm:inline" : ""}`}
              style={{ left: `${(beat.at / DURATION) * 100}%` }}
            >
              {beat.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

const TONES = {
  // On the dark film panel (pricing page).
  dark: {
    meta: "text-background/60",
    group: "border-background/20",
    ring: "focus-visible:ring-background",
    active: "bg-background text-foreground",
    idle: "text-background/60 hover:text-background",
    frame: "border-background/20",
  },
  // On a light card (submit page add-on).
  light: {
    meta: "text-muted-foreground",
    group: "border-border",
    ring: "focus-visible:ring-primary",
    active: "bg-foreground text-background",
    idle: "text-muted-foreground hover:text-foreground",
    frame: "",
  },
} as const;

/**
 * The sample with a 16:9 / 9:16 toggle, sound and expand buttons, and a caption
 * saying whose video it is. On the dark pricing panel it also shows the timeline
 * kept in sync with the video.
 */
export function LaunchVideoWithTimeline({
  demo,
  tone = "dark",
}: {
  demo: LaunchVideoDemoSource;
  tone?: keyof typeof TONES;
}) {
  const [format, setFormat] = useState<Format>("landscape");
  const [progress, setProgress] = useState(0);
  const [soundOn, setSoundOn] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const source = format === "portrait" && demo.portrait ? demo.portrait : demo;
  const styles = TONES[tone];

  function selectFormat(next: Format) {
    setFormat(next);
    setProgress(0);
  }

  return (
    <>
      <div className={`flex items-center justify-between text-xs font-bold ${styles.meta}`}>
        <span>20 seconds</span>
        {demo.portrait ? (
          <div
            role="group"
            aria-label="Video format"
            className={`flex rounded-full border p-0.5 ${styles.group}`}
          >
            {(Object.keys(FORMAT_LABELS) as Format[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={format === option}
                onClick={() => selectFormat(option)}
                className={`rounded-full px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 ${styles.ring} ${
                  format === option ? styles.active : styles.idle
                }`}
              >
                {FORMAT_LABELS[option]}
              </button>
            ))}
          </div>
        ) : (
          <span>16:9 and 9:16</span>
        )}
      </div>

      {/* Fixed 16:9 stage so switching formats never moves the page. The video is
          absolutely positioned: a tall 9:16 video would otherwise stretch the stage. */}
      <div className={`relative aspect-video${tone === "light" ? " mt-3" : ""}`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <LaunchVideoDemo
            key={format}
            videoUrl={source.videoUrl}
            posterUrl={source.posterUrl}
            label={`Sample launch video, ${FORMAT_LABELS[format]}`}
            orientation={format}
            className={`${format === "portrait" ? "h-full" : "w-full"} ${styles.frame}`}
            onProgress={setProgress}
            soundOn={soundOn}
            onToggleSound={() => setSoundOn((on) => !on)}
            onExpand={() => setExpanded(true)}
            held={expanded}
          />
        </div>
      </div>

      {tone === "dark" ? (
        <div>
          <LaunchVideoTimeline progress={progress} />
          <p className={`mt-4 text-xs ${styles.meta}`}>{LAUNCH_VIDEO_DEMO_CAPTION}</p>
        </div>
      ) : (
        <p className={`mt-2 text-xs ${styles.meta}`}>{LAUNCH_VIDEO_DEMO_CAPTION}</p>
      )}

      {expanded ? (
        <LaunchVideoLightbox
          demo={demo}
          initialFormat={format}
          onClose={() => setExpanded(false)}
        />
      ) : null}
    </>
  );
}
