"use client";

import { useEffect, useState } from "react";
import { CloseIcon, CrossSquareIcon, PrizeIcon } from "./streak-icons";
import { ModalPortal } from "./modal-portal";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

interface Props {
  roll: {
    outcome: string;
    reward: { code: string; percentOff: number; productScope: string } | null;
  };
  onClose: () => void;
}

export function LotteryModal({ roll, onClose }: Props) {
  const isLose = roll.outcome === "LOSE";
  // Lose: reveal instantly (no anticipation needed). Win: short suspense reveal.
  const [revealed, setRevealed] = useState(isLose);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isLose) return;
    const t = setTimeout(() => setRevealed(true), 600);
    return () => clearTimeout(t);
  }, [isLose]);

  useBodyScrollLock();

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const copy = async () => {
    if (!roll.reward) return;
    await navigator.clipboard.writeText(roll.reward.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <ModalPortal>
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md relative rounded-xl border-2 border-foreground/15 bg-white dark:bg-zinc-950 p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
        >
          <CloseIcon size={20} />
        </button>
        <h2 className="text-xl font-bold mb-1">Daily Lottery</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Try your luck and win exclusive rewards
        </p>
        {!revealed ? (
          <div className="text-center py-12 text-muted-foreground animate-pulse">
            Rolling…
          </div>
        ) : isLose ? (
          <div className="text-center py-6">
            <CrossSquareIcon size={56} className="mx-auto mb-4 text-foreground" />
            <p className="text-foreground font-bold mb-1">No win today</p>
            <p className="text-sm text-muted-foreground">
              Better luck tomorrow. Keep your streak going.
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <PrizeIcon size={56} className="mx-auto mb-4 text-foreground" />
            <p className="text-foreground font-bold mb-2">
              You won {roll.reward!.percentOff}% off Premium Launch
            </p>
            <code className="block bg-muted p-2 rounded text-sm my-3 select-all font-mono">
              {roll.reward!.code}
            </code>
            <button
              type="button"
              onClick={copy}
              className="text-sm underline hover:no-underline"
            >
              {copied ? "Copied" : "Copy code"}
            </button>
          </div>
        )}
      </div>
    </div>
    </ModalPortal>
  );
}
