"use client";

import { useCallback, useEffect, useState } from "react";

import {
  ClaimListingCard,
  type ClaimState,
} from "@/components/public/claim-listing-card";

type ClaimStatePayload = {
  claimState: ClaimState;
  viewerEmail: string | null;
};

export function ViewerClaimState({
  toolId,
  toolSlug,
  toolName,
}: {
  toolId: string;
  toolSlug: string;
  toolName: string;
}) {
  const [payload, setPayload] = useState<ClaimStatePayload | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadClaimState = useCallback(
    async (signal?: AbortSignal) => {
      setErrorMessage(null);

      const response = await fetch(`/api/tools/${toolId}/claim-state`, {
        cache: "no-store",
        signal,
      });
      const nextPayload = (await response.json().catch(() => null)) as
        | { data?: ClaimStatePayload; error?: string }
        | null;

      if (!response.ok || !nextPayload?.data) {
        throw new Error(nextPayload?.error ?? "Unable to load claim state.");
      }

      setPayload(nextPayload.data);
    },
    [toolId],
  );

  useEffect(() => {
    const controller = new AbortController();

    void (async () => {
      try {
        await loadClaimState(controller.signal);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        setPayload(null);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to load claim state.",
        );
      }
    })();

    return () => {
      controller.abort();
    };
  }, [loadClaimState]);

  if (errorMessage) {
    return (
      <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-6 text-xs font-bold uppercase tracking-widest text-destructive">
        {errorMessage}
      </div>
    );
  }

  if (!payload) {
    return null;
  }

  if (
    payload.claimState.status === "OWNED" ||
    payload.claimState.status === "OWNED_BY_YOU"
  ) {
    return null;
  }

  const claimRedirect = `/tools/${toolSlug}?claim=1`;

  return (
    <ClaimListingCard
      toolId={toolId}
      toolSlug={toolSlug}
      toolName={toolName}
      claimState={payload.claimState}
      viewerEmail={payload.viewerEmail}
      signInHref={`/sign-in?redirect=${encodeURIComponent(claimRedirect)}`}
      signUpHref={`/submit?redirect=${encodeURIComponent(claimRedirect)}`}
      onSubmitted={() => loadClaimState()}
    />
  );
}
