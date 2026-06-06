"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

import { UpvoteRequirementModal, type RequirementBoardTool } from "./upvote-requirement-modal";

type BadgeVerification = "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";

export type BadgePreviewOption = {
  theme: "light" | "dark";
  label: string;
  previewSrc: string;
  snippet: string;
};

type Props = {
  submissionId: string;
  badges: BadgePreviewOption[];
  initialBadgeVerification: BadgeVerification;
  tools: RequirementBoardTool[];
  initialEligibleCount: number;
  requiredCount: number;
  onRequirementsMet: (met: boolean) => void;
};

export function FreeLaunchRequirementsPanel({
  submissionId,
  badges,
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
  const [copiedTheme, setCopiedTheme] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const badgeOk = badge === "VERIFIED";
  const votesOk = eligibleCount >= requiredCount;
  const shownCount = Math.min(eligibleCount, requiredCount);

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
      const status: BadgeVerification = payload.data?.badgeVerification ?? "FAILED";
      setBadge(status);
      if (status !== "VERIFIED") setError("We couldn't find the badge on your site yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  function copySnippet(theme: string, snippet: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(snippet);
    setCopiedTheme(theme);
    window.setTimeout(() => setCopiedTheme(null), 1600);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-heading text-base font-semibold">Before you publish your launch</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Verify your badge and support a few fellow founders launching this week.
      </p>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {/* Step 1: badge — light + dark side by side */}
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
            <p className="text-xs text-muted-foreground">Pick the badge that fits your site, paste it on your homepage or footer, then verify.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {badges.map((b) => (
                <div key={b.theme} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                  <div className="flex min-h-16 items-center justify-center rounded-md border border-dashed border-border bg-muted/40 px-3 py-3">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={b.previewSrc} alt={`ShipBoost ${b.label} badge`} className="h-10 w-auto" />
                  </div>
                  <button
                    type="button"
                    onClick={() => copySnippet(b.theme, b.snippet)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    {copiedTheme === b.theme ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    {copiedTheme === b.theme ? "Copied" : `Copy ${b.label}`}
                  </button>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={verifying}
                onClick={() => void verifyBadge()}
                className="inline-flex items-center justify-center gap-1.5 rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50"
              >
                {verifying ? "Verifying..." : "Verify badge now"}
              </button>
              <a
                href="mailto:support@shipboost.io?subject=ShipBoost%20badge%20verification%20help"
                className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
              >
                Can&apos;t verify? Contact support
              </a>
            </div>
          </div>
        ) : null}
      </div>

      {/* Step 2: upvotes */}
      <div className="mt-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground">2 ·</span> Support fellow founders launching this week
          </span>
          {votesOk ? <Check className="size-4 text-emerald-600" /> : null}
        </div>
        {requiredCount === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Waived — no other launches to support yet.</p>
        ) : (
          <>
          <p className="mt-2 text-xs text-muted-foreground">
            Upvote {requiredCount} {requiredCount === 1 ? "launch" : "launches"} on this week&apos;s board before you publish — pay it forward.
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(100, (eligibleCount / requiredCount) * 100)}%` }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{shownCount} / {requiredCount}</span>
            {!votesOk ? (
              <button type="button" onClick={() => setModalOpen(true)} className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90">
                Upvote now
              </button>
            ) : null}
          </div>
          </>
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
