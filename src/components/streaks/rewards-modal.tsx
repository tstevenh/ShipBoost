"use client";

import { useEffect, useState } from "react";
import { CloseIcon } from "./streak-icons";
import { ModalPortal } from "./modal-portal";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";

interface RewardItem {
  id: string;
  code: string;
  percentOff: number;
  productScope: string;
  source: string;
  unlockedAt: string;
  redeemedAt: string | null;
}

function productLabel(scope: string) {
  if (scope === "PREMIUM_LAUNCH") return "Premium Launch";
  if (scope === "SPONSOR_PLACEMENT") return "Sponsor Placement";
  return scope;
}

export function RewardsModal({ onClose }: { onClose: () => void }) {
  const [rewards, setRewards] = useState<RewardItem[] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useBodyScrollLock();

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    fetch("/api/streaks/rewards")
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setRewards(j?.data ?? []))
      .catch(() => setRewards([]));
  }, []);

  const copy = async (id: string, code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
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
        className="w-full max-w-lg max-h-[80vh] flex flex-col relative rounded-xl border-2 border-foreground/15 bg-white dark:bg-zinc-950 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 pb-4 border-b border-foreground/10">
          <div>
            <h2 className="text-xl font-bold">My Rewards</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Discount codes earned from streaks &amp; lottery
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-muted-foreground hover:text-foreground"
          >
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 pt-4">
          {rewards === null ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Loading…
            </p>
          ) : rewards.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No rewards yet — keep your streak going.
            </p>
          ) : (
            <ul className="space-y-3">
              {rewards.map((r) => (
                <li
                  key={r.id}
                  className={`p-4 rounded-lg border ${
                    r.redeemedAt
                      ? "opacity-50 border-border"
                      : "border-foreground/20 bg-foreground/[0.03]"
                  }`}
                >
                  <p className="font-semibold">
                    {r.percentOff}% off {productLabel(r.productScope)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {r.source === "MILESTONE"
                      ? "Milestone reward"
                      : "Lottery win"}
                    {" · "}
                    {new Date(r.unlockedAt).toLocaleDateString()}
                    {r.redeemedAt ? " · Redeemed" : ""}
                  </p>
                  {!r.redeemedAt && (
                    <div className="mt-3 flex items-center gap-2">
                      <code className="flex-1 bg-muted px-3 py-1.5 rounded text-sm font-mono select-all">
                        {r.code}
                      </code>
                      <button
                        type="button"
                        onClick={() => copy(r.id, r.code)}
                        className="px-3 py-1.5 text-sm rounded bg-primary text-primary-foreground hover:opacity-90"
                      >
                        {copiedId === r.id ? "Copied" : "Copy"}
                      </button>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
