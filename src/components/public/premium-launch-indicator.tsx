"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createPortal } from "react-dom";
import { Check, Star, X } from "lucide-react";

const premiumFeatures = [
  "Reserve a specific launch week",
  "Dofollow backlink included by default",
  "No badge verification needed",
  "Stronger baseline board placement",
  "Editorial launch spotlight during launch period",
  "Priority support",
];

export function PremiumLaunchIndicator() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const modal =
    isOpen && isMounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="premium-launch-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-background p-6 shadow-2xl shadow-black/20 sm:p-8"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-amber-500" />
              <button
                type="button"
                aria-label="Close premium launch details"
                onClick={() => setIsOpen(false)}
                className="absolute right-5 top-5 inline-flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={16} />
              </button>

              <div className="pr-12">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  <Star size={20} fill="currentColor" />
                </div>
                <p className="mt-5 text-[10px] font-black tracking-[0.24em] text-amber-700 dark:text-amber-300">
                  Premium launch
                </p>
                <h3
                  id="premium-launch-title"
                  className="mt-2 text-2xl font-black tracking-tight text-foreground"
                >
                  Get stronger launch visibility
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
                  Premium Launches reserve timing, include a dofollow backlink,
                  and appear ahead of free launches after the vote-driven top
                  spots.
                </p>
              </div>

              <ul className="mt-6 space-y-3">
                {premiumFeatures.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-3 text-sm font-bold text-foreground/85"
                  >
                    <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/submit"
                onClick={() => setIsOpen(false)}
                className="mt-8 inline-flex w-full items-center justify-center rounded-2xl bg-foreground px-5 py-4 text-sm font-black text-background shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-[0.98]"
              >
                Get Premium Launch
              </Link>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <span className="relative inline-flex shrink-0">
        <button
          type="button"
          aria-label="Premium launch"
          onClick={() => setIsOpen(true)}
          className="peer inline-flex h-5 w-5 items-center justify-center rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-700 shadow-sm shadow-amber-950/5 transition hover:scale-105 hover:bg-amber-500/15 focus:outline-none focus:ring-2 focus:ring-amber-500/30 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-300"
        >
          <Star size={12} fill="currentColor" strokeWidth={2.5} />
        </button>
        <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-full bg-foreground px-3 py-1.5 text-[10px] font-black tracking-[0.12em] text-background shadow-lg peer-hover:block peer-focus-visible:block">
          Premium launch
        </span>
      </span>

      {modal}
    </>
  );
}
