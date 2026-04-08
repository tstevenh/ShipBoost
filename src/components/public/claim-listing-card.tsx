"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

type ClaimState =
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
}: {
  toolId: string;
  toolSlug: string;
  toolName: string;
  claimState: ClaimState;
  viewerEmail: string | null;
  signInHref: string;
  signUpHref: string;
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
      router.refresh();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to submit claim.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [claimState.canSubmit, isSubmitting, router, toolId, toolSlug]);

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
    <div className="rounded-[2rem] border border-[#9f4f1d]/12 bg-[#fff7ea] p-8 shadow-[0_24px_80px_rgba(159,79,29,0.08)]">
      <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
        Claim this listing
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
        Take ownership of {toolName} on Shipboost
      </h2>
      <p className="mt-4 text-sm leading-7 text-black/66">
        Claiming requires a company email that matches the listing domain{" "}
        <span className="font-semibold text-black">{claimState.websiteDomain}</span>.
      </p>

      {claimState.status === "SIGN_IN_REQUIRED" ? (
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href={signInHref}
            className="inline-flex items-center justify-center rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26]"
          >
            Sign in to claim
          </Link>
          <Link
            href={signUpHref}
            className="inline-flex items-center justify-center rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
          >
            Create founder account
          </Link>
        </div>
      ) : null}

      {claimState.status === "AVAILABLE" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/68">
            Signed in as {viewerEmail}. Claim will be reviewed before editing is unlocked.
          </div>
          <button
            type="button"
            onClick={() => void submitClaim()}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                Submitting claim...
              </>
            ) : (
              "Claim this listing"
            )}
          </button>
        </div>
      ) : null}

      {claimState.status === "DOMAIN_MISMATCH" ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Signed in as {viewerEmail}, but this listing can only be claimed from a{" "}
          {claimState.websiteDomain} company email. Current email domain:{" "}
          {claimState.claimDomain}.
        </div>
      ) : null}

      {claimState.status === "PENDING_YOURS" ? (
        <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          Claim request received. Shipboost is reviewing it now.
          {claimState.founderVisibleNote ? ` ${claimState.founderVisibleNote}` : ""}
        </div>
      ) : null}

      {claimState.status === "REJECTED_YOURS" ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            Your previous claim was rejected.
            {claimState.founderVisibleNote ? ` ${claimState.founderVisibleNote}` : ""}
          </div>
          <button
            type="button"
            onClick={() => void submitClaim()}
            disabled={isSubmitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Retrying..." : "Retry claim"}
          </button>
        </div>
      ) : null}

      {claimState.status === "PENDING_OTHER" ? (
        <div className="mt-6 rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-black/68">
          Another founder is already claiming this listing. Check back after review.
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
