"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

type Screenshot = {
  id: string;
  url: string;
};

type ToolScreenshotRailProps = {
  screenshots: Screenshot[];
  toolName: string;
};

function getNextIndex(index: number, length: number) {
  return (index + 1) % length;
}

function getPreviousIndex(index: number, length: number) {
  return (index - 1 + length) % length;
}

export function ToolScreenshotRail({
  screenshots,
  toolName,
}: ToolScreenshotRailProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasMultipleScreenshots = screenshots.length > 1;
  const activeScreenshot = screenshots[activeIndex];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setActiveIndex((current) =>
      current >= screenshots.length ? Math.max(screenshots.length - 1, 0) : current,
    );
  }, [screenshots.length]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsLightboxOpen(false);
        return;
      }

      if (!hasMultipleScreenshots) {
        return;
      }

      if (event.key === "ArrowRight") {
        setActiveIndex((current) => getNextIndex(current, screenshots.length));
      }

      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => getPreviousIndex(current, screenshots.length));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasMultipleScreenshots, isLightboxOpen, screenshots.length]);

  useEffect(() => {
    if (!isLightboxOpen) {
      return;
    }

    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isLightboxOpen]);

  if (screenshots.length === 0 || !activeScreenshot) {
    return null;
  }

  function showNextScreenshot() {
    if (!hasMultipleScreenshots) {
      return;
    }

    setActiveIndex((current) => getNextIndex(current, screenshots.length));
  }

  function showPreviousScreenshot() {
    if (!hasMultipleScreenshots) {
      return;
    }

    setActiveIndex((current) => getPreviousIndex(current, screenshots.length));
  }

  const lightboxContent = isLightboxOpen ? (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-md sm:px-8"
      onClick={() => setIsLightboxOpen(false)}
    >
      <div
        className="relative flex h-full w-full max-w-6xl items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => setIsLightboxOpen(false)}
          className="absolute right-0 top-0 z-20 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:bg-black/60"
          aria-label="Close fullscreen screenshot"
        >
          <X size={18} />
        </button>

        {hasMultipleScreenshots ? (
          <>
            <button
              type="button"
              onClick={showPreviousScreenshot}
              className="absolute left-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:bg-black/60 sm:left-4"
              aria-label="Show previous screenshot"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              type="button"
              onClick={showNextScreenshot}
              className="absolute right-2 top-1/2 z-20 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white transition hover:bg-black/60 sm:right-4"
              aria-label="Show next screenshot"
            >
              <ChevronRight size={20} />
            </button>
          </>
        ) : null}

        <div className="relative h-full w-full max-h-[88vh] overflow-hidden rounded-3xl border border-white/10 bg-black/20 shadow-2xl">
          <Image
            src={activeScreenshot.url}
            alt={`${toolName} screenshot ${activeIndex + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
          />
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-4">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border bg-muted shadow-2xl shadow-black/5">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(true)}
            className="group absolute inset-0 z-10 block cursor-zoom-in"
            aria-label={`Open ${toolName} screenshot ${activeIndex + 1} fullscreen`}
          >
            <span className="sr-only">Open fullscreen screenshot</span>
          </button>
          <Image
            src={activeScreenshot.url}
            alt={`${toolName} screenshot ${activeIndex + 1}`}
            fill
            sizes="(min-width: 1280px) 896px, (min-width: 1024px) calc(100vw - 432px), 100vw"
            className="object-cover"
            priority={activeIndex === 0}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between p-3">
            <span className="rounded-full border border-black/10 bg-black/55 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-white">
              {activeIndex + 1} / {screenshots.length}
            </span>
            <span className="rounded-full border border-black/10 bg-black/55 p-2 text-white">
              <Expand size={14} />
            </span>
          </div>

          {hasMultipleScreenshots ? (
            <>
              <button
                type="button"
                onClick={showPreviousScreenshot}
                className="absolute left-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-background/90 text-foreground shadow-lg transition hover:bg-background"
                aria-label="Show previous screenshot"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                type="button"
                onClick={showNextScreenshot}
                className="absolute right-3 top-1/2 z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-black/10 bg-background/90 text-foreground shadow-lg transition hover:bg-background"
                aria-label="Show next screenshot"
              >
                <ChevronRight size={20} />
              </button>
            </>
          ) : null}
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2">
          {screenshots.map((screenshot, index) => (
            <button
              key={screenshot.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={cn(
                "relative h-24 w-40 shrink-0 overflow-hidden rounded-xl border bg-muted transition",
                index === activeIndex
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-foreground/20",
              )}
              aria-label={`Show screenshot ${index + 1}`}
              aria-pressed={index === activeIndex}
            >
              <Image
                src={screenshot.url}
                alt={`${toolName} thumbnail ${index + 1}`}
                fill
                sizes="160px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      </div>

      {mounted ? createPortal(lightboxContent, document.body) : null}
    </>
  );
}
