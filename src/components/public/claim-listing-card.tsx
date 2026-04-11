"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

export type ClaimState =
  | {
      status: "AVAILABLE";
      websiteDomain: string;
      claimDomain: string;
      canSubmit: true;
    }
  | {
      status:
        | "SIGN_IN_REQUIRED"
        | "OWNED"
        | "OWNED_BY_YOU"
        | "PENDING_OTHER";
      websiteDomain: string;
      canSubmit: false;
    }
  | {
      status: "DOMAIN_MISMATCH";
      websiteDomain: string;
      claimDomain: string;
      canSubmit: false;
    }
  | {
      status: "PENDING_YOURS" | "APPROVED_YOURS" | "REJECTED_YOURS";
      websiteDomain: string;
      canSubmit: boolean;
      claimId: string;
      claimDomain: string;
      founderVisibleNote: string | null;
      reviewedAt: string | null;
    };

export function ClaimListingCard({
  toolId,
  toolSlug,
  toolName,
  claimState,
  viewerEmail,
  signInHref,
  signUpHref,
  onSubmitted,
}: {
  toolId: string;
  toolSlug: string;
  toolName: string;
  claimState: ClaimState;
  viewerEmail: string | null;
  signInHref: string;
  signUpHref: string;
  onSubmitted?: () => Promise<void> | void;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attemptedAutoSubmit = useRef(false);

  const submitClaim = useCallback(async () => {
    if (isSubmitting || !claimState.canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch("/api/listing-claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ toolId }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to submit claim.");
      }

      router.replace(`/tools/${toolSlug}`);

      if (onSubmitted) {
        await onSubmitted();
      } else {
        router.refresh();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit claim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [claimState.canSubmit, isSubmitting, onSubmitted, router, toolId, toolSlug]);

  useEffect(() => {
    if (attemptedAutoSubmit.current) {
      return;
    }

    if (searchParams.get("claim") !== "1" || claimState.status !== "AVAILABLE") {
      return;
    }

    attemptedAutoSubmit.current = true;
    void submitClaim();
  }, [claimState.status, searchParams, submitClaim]);

  return (
    <div className="rounded-3xl border border-border bg-muted/20 p-8 shadow-xl shadow-black/5">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
        Claim this listing
      </p>
      <h2 className="mt-4 text-3xl font-black tracking-tight text-foreground">
        Take ownership of {toolName}
      </h2>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Claiming requires a company email that matches the listing domain{" "}
        <span className="font-bold text-foreground underline decoration-border underline-offset-4">{claimState.websiteDomain}</span>.
      </p>

      {claimState.status === "SIGN_IN_REQUIRED" ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={signInHref}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground shadow-lg shadow-black/10 transition-opacity hover:opacity-90"
          >
            Sign in to claim
          </Link>
          <Link
            href={signUpHref}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-black transition-colors hover:bg-muted"
          >
            Create account
          </Link>
        </div>
      ) : null}

      {claimState.status === "AVAILABLE" ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-border bg-card px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-widest">
            Signed in as <span className="text-foreground font-black">{viewerEmail}</span>
          </div>
          <button
            type="button"
            onClick={() => void submitClaim()}
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              "Claim this listing now"
            )}
          </button>
        </div>
      ) : null}

      {claimState.status === "DOMAIN_MISMATCH" ? (
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive uppercase tracking-widest">
          Domain mismatch. Requires a {claimState.websiteDomain} email.
        </div>
      ) : null}

      {claimState.status === "PENDING_YOURS" ? (
        <div className="mt-8 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-bold text-amber-700 uppercase tracking-widest">
          Claim request received. Reviewing now.
          {claimState.founderVisibleNote ? ` • ${claimState.founderVisibleNote}` : ""}
        </div>
      ) : null}

      {claimState.status === "REJECTED_YOURS" ? (
        <div className="mt-8 space-y-4">
          <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive uppercase tracking-widest">
            Previous claim rejected.
            {claimState.founderVisibleNote ? ` • ${claimState.founderVisibleNote}` : ""}
          </div>
          <button
            type="button"
            onClick={() => void submitClaim()}
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-black text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Retry claim"}
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-8 rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive uppercase tracking-widest">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
