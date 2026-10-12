"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import {
  LAUNCH_VIDEO_DEMO_CAPTION,
  type LaunchVideoDemo as LaunchVideoDemoSource,
} from "@/lib/launch-video";

export type LaunchVideoFormat = "landscape" | "portrait";

export const LAUNCH_VIDEO_FORMAT_LABELS: Record<LaunchVideoFormat, string> = {
  landscape: "16:9",
  portrait: "9:16",
};

/** The sample at full size, with sound and the browser's own playback controls. */
export function LaunchVideoLightbox({
  demo,
  initialFormat,
  onClose,
}: {
  demo: LaunchVideoDemoSource;
  initialFormat: LaunchVideoFormat;
  onClose: () => void;
}) {
  const [format, setFormat] = useState<LaunchVideoFormat>(
    initialFormat === "portrait" && demo.portrait ? "portrait" : "landscape",
  );
  const closeRef = useRef<HTMLButtonElement>(null);
  const source = format === "portrait" && demo.portrait ? demo.portrait : demo;

  useBodyScrollLock();

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      previouslyFocused?.focus?.();
    };
  }, [onClose]);

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sample launch video"
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center gap-4 bg-black/85 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="flex w-full max-w-5xl items-center justify-between gap-3">
        {demo.portrait ? (
          <div
            role="group"
            aria-label="Video format"
            className="flex rounded-full border border-white/20 p-0.5 text-xs font-bold"
          >
            {(Object.keys(LAUNCH_VIDEO_FORMAT_LABELS) as LaunchVideoFormat[]).map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={format === option}
                onClick={() => setFormat(option)}
                className={`rounded-full px-3 py-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white ${
                  format === option ? "bg-white text-black" : "text-white/60 hover:text-white"
                }`}
              >
                {LAUNCH_VIDEO_FORMAT_LABELS[option]}
              </button>
            ))}
          </div>
        ) : (
          <span />
        )}
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        >
          <X size={16} />
        </button>
      </div>

      <video
        key={format}
        src={source.videoUrl}
        poster={source.posterUrl}
        aria-label={`Sample launch video, ${LAUNCH_VIDEO_FORMAT_LABELS[format]}, with sound`}
        controls
        autoPlay
        playsInline
        className={
          format === "portrait"
            ? "aspect-[9/16] h-[78dvh] max-w-full rounded-2xl bg-black"
            : "aspect-video max-h-[78dvh] w-full max-w-5xl rounded-2xl bg-black"
        }
      />

      <p className="max-w-5xl text-center text-xs text-white/60">{LAUNCH_VIDEO_DEMO_CAPTION}</p>
    </div>,
    document.body,
  );
}
