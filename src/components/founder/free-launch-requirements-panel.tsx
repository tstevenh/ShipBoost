"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

import { UpvoteRequirementModal, type RequirementBoardTool } from "./upvote-requirement-modal";

type BadgeVerification = "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";

type Props = {
  submissionId: string;
  badgeSnippet: string;
  badgePreviewSrc: string;
  initialBadgeVerification: BadgeVerification;
  tools: RequirementBoardTool[];
  initialEligibleCount: number;
  requiredCount: number;
  onRequirementsMet: (met: boolean) => void;
};

export function FreeLaunchRequirementsPanel({
  submissionId,
  badgeSnippet,
  badgePreviewSrc,
  initialBadgeVerification,
  tools,
  initialEligibleCount,
  requiredCount,
  onRequirementsMet,
}: Props) {
  const [badge, setBadge] = useState<BadgeVerification>(initialBadgeVerification);
  const [eligibleCount, setEligibleCount] = useState(initialEligibleCount);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badgeOk = badge === "VERIFIED";
  const votesOk = eligibleCount >= requiredCount;

  useEffect(() => {
    onRequirementsMet(badgeOk && votesOk);
  }, [badgeOk, votesOk, onRequirementsMet]);

  async function verifyBadge() {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/verify-badge`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message ?? "Verification failed.");
      const status: BadgeVerification = payload.data?.badgeVerification ?? "VERIFIED";
      setBadge(status);
      if (status !== "VERIFIED") setError("We couldn't find the badge on your site yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  function copySnippet() {
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(badgeSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-heading text-base font-semibold">Before you can schedule</h3>
      <p className="mt-1 text-sm text-muted-foreground">Two quick steps to join this week&apos;s board.</p>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      <div className="mt-4 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground">1 ·</span> Verify your ShipBoost badge
          </span>
          {badgeOk ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ShieldCheck className="size-4" /> Verified
            </span>
          ) : null}
        </div>
        {!badgeOk ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgePreviewSrc} alt="ShipBoost badge" className="h-12 w-auto" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copySnippet} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy snippet"}
              </button>
              <button type="button" disabled={verifying} onClick={() => void verifyBadge()} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50">
                {verifying ? "Verifying..." : "Verify badge now"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground">2 ·</span> Upvote launches this week
          </span>
          {votesOk ? <Check className="size-4 text-emerald-600" /> : null}
        </div>
        {requiredCount === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Waived — no other launches to upvote yet.</p>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(100, (eligibleCount / requiredCount) * 100)}%` }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{eligibleCount} / {requiredCount}</span>
            {!votesOk ? (
              <button type="button" onClick={() => setModalOpen(true)} className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90">
                Upvote now
              </button>
            ) : null}
          </div>
        )}
      </div>

      {modalOpen ? (
        <UpvoteRequirementModal
          submissionId={submissionId}
          tools={tools}
          eligibleCount={eligibleCount}
          requiredCount={requiredCount}
          onProgress={(c) => setEligibleCount(c)}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
