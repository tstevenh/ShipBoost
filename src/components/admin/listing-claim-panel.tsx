import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";

import {
  Field,
  SectionCard,
  StatusChip,
  formatDate,
  pendingSpinnerClassName,
  textInputClassName,
  type ListingClaim,
} from "@/components/admin/admin-console-shared";

export function ListingClaimPanel({
  claims,
  claimSearch,
  onClaimSearchChange,
  claimFilter,
  onClaimFilterChange,
  claimError,
  claimNotes,
  setClaimNotes,
  handleClaimReview,
  hasPendingAction,
  isActionPending,
}: {
  claims: ListingClaim[];
  claimSearch: string;
  onClaimSearchChange: (value: string) => void;
  claimFilter: "" | ListingClaim["status"];
  onClaimFilterChange: (value: "" | ListingClaim["status"]) => void;
  claimError: string | null;
  claimNotes: Record<
    string,
    { founderVisibleNote: string; internalAdminNote: string }
  >;
  setClaimNotes: Dispatch<
    SetStateAction<
      Record<string, { founderVisibleNote: string; internalAdminNote: string }>
    >
  >;
  handleClaimReview: (claimId: string, action: "APPROVE" | "REJECT") => Promise<void>;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  function getClaimDraft(claim: ListingClaim) {
    return (
      claimNotes[claim.id] ?? {
        founderVisibleNote: claim.founderVisibleNote ?? "",
        internalAdminNote: claim.internalAdminNote ?? "",
      }
    );
  }

  return (
    <SectionCard
      eyebrow="Ownership review"
      title="Listing claims"
      description="Approve ownership transfers for seeded listings without taking them off the public site."
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="grid gap-4 sm:grid-cols-2 lg:w-[32rem]">
          <Field label="Search claims">
            <input
              value={claimSearch}
              onChange={(event) => onClaimSearchChange(event.target.value)}
              className={textInputClassName()}
              placeholder="Search by tool or claimant email"
            />
          </Field>
          <Field label="Status">
            <select
              value={claimFilter}
              onChange={(event) =>
                onClaimFilterChange(event.target.value as "" | ListingClaim["status"])
              }
              className={textInputClassName()}
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="CANCELED">Canceled</option>
            </select>
          </Field>
        </div>

        <div className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm text-black/60">
          {claims.length} claims
        </div>
      </div>

      {claimError ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {claimError}
        </div>
      ) : null}

      <div className="mt-8 space-y-4">
        {claims.map((claim) => {
          const draft = getClaimDraft(claim);

          return (
            <article
              key={claim.id}
              className="rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip
                        label={claim.status}
                        tone={
                          claim.status === "APPROVED"
                            ? "green"
                            : claim.status === "REJECTED"
                              ? "rose"
                              : claim.status === "PENDING"
                                ? "amber"
                                : "slate"
                        }
                      />
                      <span className="inline-flex rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase text-black/65">
                        {claim.websiteDomain}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-black">{claim.tool.name}</h3>
                      <p className="mt-1 text-sm text-black/58">{claim.tool.tagline}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42">
                        Requested {formatDate(claim.createdAt)}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-black/62 sm:grid-cols-2">
                      <p>Claimant: {claim.claimantUser.email}</p>
                      <p>Claim domain: {claim.claimDomain}</p>
                      {claim.reviewedAt ? (
                        <p>Reviewed: {formatDate(claim.reviewedAt)}</p>
                      ) : null}
                      {claim.reviewedBy ? (
                        <p>Reviewed by: {claim.reviewedBy.email}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Link
                      href={`/tools/${claim.tool.slug}`}
                      className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
                    >
                      View listing
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Founder-visible note">
                    <textarea
                      value={draft.founderVisibleNote}
                      onChange={(event) =>
                        setClaimNotes((current) => ({
                          ...current,
                          [claim.id]: {
                            ...draft,
                            founderVisibleNote: event.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className={textInputClassName()}
                    />
                  </Field>
                  <Field label="Internal admin note">
                    <textarea
                      value={draft.internalAdminNote}
                      onChange={(event) =>
                        setClaimNotes((current) => ({
                          ...current,
                          [claim.id]: {
                            ...draft,
                            internalAdminNote: event.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className={textInputClassName()}
                    />
                  </Field>
                </div>

                {claim.status === "PENDING" ? (
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={hasPendingAction}
                      onClick={() => void handleClaimReview(claim.id, "APPROVE")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`claim:${claim.id}:APPROVE`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Approving...
                        </>
                      ) : (
                        "Approve claim"
                      )}
                    </button>
                    <button
                      type="button"
                      disabled={hasPendingAction}
                      onClick={() => void handleClaimReview(claim.id, "REJECT")}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`claim:${claim.id}:REJECT`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Rejecting...
                        </>
                      ) : (
                        "Reject claim"
                      )}
                    </button>
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}

        {claims.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
            No claims match the current filter.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
