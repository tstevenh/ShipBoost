import type { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { ExternalLink, Check, X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

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
      eyebrow="Ownership"
      title="Listing claims"
      description="Approve ownership transfers."
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[32rem]">
          <Field label="Search">
            <input
              value={claimSearch}
              onChange={(event) => onClaimSearchChange(event.target.value)}
              className={textInputClassName()}
              placeholder="Tool or email..."
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
              <option value="">All</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </Field>
        </div>

        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
          {claims.length} claims
        </div>
      </div>

      {claimError && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold text-destructive uppercase tracking-widest">
          {claimError}
        </div>
      )}

      <div className="grid gap-4">
        {claims.map((claim) => {
          const draft = getClaimDraft(claim);

          return (
            <article
              key={claim.id}
              className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-6"
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
                      <span className="px-2 py-0.5 rounded border border-border bg-card text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                        {claim.websiteDomain}
                      </span>
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border shrink-0 overflow-hidden">
                        {claim.tool.logoMedia ? (
                          <img src={claim.tool.logoMedia.url} className="w-full h-full object-cover" />
                        ) : <RefreshCw size={16} className="text-muted-foreground" />}
                      </div>
                      <div className="space-y-0.5">
                        <h3 className="text-base font-black text-foreground">{claim.tool.name}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
                          Requested {formatDate(claim.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-[10px] font-bold text-muted-foreground/80">
                      <p>Claimant: {claim.claimantUser.email}</p>
                      <p>Domain match: {claim.claimDomain}</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <Link
                      href={`/tools/${claim.tool.slug}`}
                      target="_blank"
                      className="flex items-center justify-center gap-2 w-full border border-border bg-card px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-muted transition-all"
                    >
                      <ExternalLink size={12} /> View Page
                    </Link>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 pt-4 border-t border-border">
                  <Field label="Founder note">
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
                      rows={2}
                      className={cn(textInputClassName(), "text-xs")}
                      placeholder="Visible to founder..."
                    />
                  </Field>
                  <Field label="Internal note">
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
                      rows={2}
                      className={cn(textInputClassName(), "text-xs")}
                      placeholder="Internal only..."
                    />
                  </Field>
                </div>

                {claim.status === "PENDING" && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      disabled={hasPendingAction}
                      onClick={() => void handleClaimReview(claim.id, "APPROVE")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isActionPending(`claim:${claim.id}:APPROVE`) ? (
                        <RefreshCw className="animate-spin" size={12} />
                      ) : (
                        <Check size={12} />
                      )}
                      Approve
                    </button>
                    <button
                      type="button"
                      disabled={hasPendingAction}
                      onClick={() => void handleClaimReview(claim.id, "REJECT")}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
                    >
                      {isActionPending(`claim:${claim.id}:REJECT`) ? (
                        <RefreshCw className="animate-spin" size={12} />
                      ) : (
                        <X size={12} />
                      )}
                      Reject
                    </button>
                  </div>
                )}
              </div>
            </article>
          );
        })}

        {claims.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              No claims.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
