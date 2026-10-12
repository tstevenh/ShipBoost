"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { Maximize2, Volume2, VolumeX } from "lucide-react";

import { cn } from "@/lib/utils";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

function subscribeToReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION_QUERY);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function getReducedMotion() {
  return window.matchMedia(REDUCED_MOTION_QUERY).matches;
}

// Shows the poster until the video scrolls into view, then streams and loops it
// muted. Nothing downloads before that, so the page's first load is unaffected.
// Optional overlay buttons turn the sound on in place or open the large player.
export function LaunchVideoDemo({
  videoUrl,
  posterUrl,
  label,
  className,
  orientation = "landscape",
  onProgress,
  soundOn = false,
  onToggleSound,
  onExpand,
  held = false,
}: {
  videoUrl: string;
  posterUrl: string;
  label: string;
  className?: string;
  orientation?: "landscape" | "portrait";
  /** Called with playback position (0–1) every frame while playing. */
  onProgress?: (fraction: number) => void;
  soundOn?: boolean;
  /** Shows a sound button over the video. */
  onToggleSound?: () => void;
  /** Shows an expand button over the video. */
  onExpand?: () => void;
  /** Keeps the video paused, e.g. while the large player is open. */
  held?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onProgressRef = useRef(onProgress);
  const heldRef = useRef(held);
  const visibleRef = useRef(false);

  useEffect(() => {
    onProgressRef.current = onProgress;
  }, [onProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) video.muted = !soundOn;
  }, [soundOn]);

  useEffect(() => {
    heldRef.current = held;
    const video = videoRef.current;
    if (!video) return;
    if (held) {
      video.pause();
    } else if (visibleRef.current) {
      void video.play().catch(() => {});
    }
  }, [held]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let frame = 0;
    const report = () => {
      if (video.duration > 0) onProgressRef.current?.(video.currentTime / video.duration);
    };
    const tick = () => {
      report();
      frame = requestAnimationFrame(tick);
    };
    const start = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(tick);
    };
    const stop = () => {
      cancelAnimationFrame(frame);
      report();
    };

    video.addEventListener("play", start);
    video.addEventListener("pause", stop);
    video.addEventListener("seeked", report);
    return () => {
      cancelAnimationFrame(frame);
      video.removeEventListener("play", start);
      video.removeEventListener("pause", stop);
      video.removeEventListener("seeked", report);
    };
  }, []);
  const reducedMotion = useSyncExternalStore(
    subscribeToReducedMotion,
    getReducedMotion,
    () => false,
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        visibleRef.current = Boolean(entry?.isIntersecting);
        if (visibleRef.current && !heldRef.current) {
          void video.play().catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-muted/40",
        className,
      )}
    >
      <video
        ref={videoRef}
        src={videoUrl}
        poster={posterUrl}
        aria-label={label}
        muted
        loop
        playsInline
        preload="none"
        controls={reducedMotion}
        className={
          orientation === "portrait"
            ? "block aspect-[9/16] h-full w-auto object-cover"
            : "block aspect-video w-full object-cover"
        }
      />
      {onToggleSound || onExpand ? (
        <div className="absolute bottom-2.5 right-2.5 flex gap-1.5">
          {onToggleSound ? (
            <button
              type="button"
              onClick={onToggleSound}
              aria-label={soundOn ? "Mute sample video" : "Turn on sound"}
              aria-pressed={soundOn}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              {soundOn ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>
          ) : null}
          {onExpand ? (
            <button
              type="button"
              onClick={onExpand}
              aria-label="Watch larger with sound"
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur transition hover:bg-black/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
            >
              <Maximize2 size={14} />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
