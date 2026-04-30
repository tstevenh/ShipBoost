import Link from "next/link";
import { useState } from "react";
import { ExternalLink, Check, X, RefreshCw, Clock, Rocket } from "lucide-react";
import { NativeSelect } from "@/components/forms/native-select";
import { cn } from "@/lib/utils";
import {
  Field,
  SectionCard,
  StatusChip,
  formatDate,
  getSubmissionBadgeLabel,
  getPaymentStatusLabel,
  getSubmissionLifecycle,
  textInputClassName,
  type Submission,
} from "@/components/admin/admin-console-shared";

export function SubmissionReviewPanel({
  submissionSearch,
  onSubmissionSearchChange,
  submissionFilter,
  onSubmissionFilterChange,
  submissionError,
  submissions,
  submissionNotes,
  setSubmissionNotes,
  handleSubmissionReview,
  handleSubmissionSpotlightLink,
  hasPendingAction,
  isActionPending,
}: {
  submissionSearch: string;
  onSubmissionSearchChange: (value: string) => void;
  submissionFilter: "" | Submission["reviewStatus"];
  onSubmissionFilterChange: (value: "" | Submission["reviewStatus"]) => void;
  submissionError: string | null;
  submissions: Submission[];
  submissionNotes: Record<
    string,
    { founderVisibleNote: string; internalReviewNote: string }
  >;
  setSubmissionNotes: React.Dispatch<
    React.SetStateAction<
      Record<string, { founderVisibleNote: string; internalReviewNote: string }>
    >
  >;
  handleSubmissionReview: (
    submissionId: string,
    action: "APPROVE" | "REJECT",
  ) => void | Promise<void>;
  handleSubmissionSpotlightLink: (
    submissionId: string,
    articleSlug: string,
  ) => void | Promise<void>;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  const [spotlightDrafts, setSpotlightDrafts] = useState<Record<string, string>>({});

  function getSubmissionReviewDraft(submission: Submission) {
    return (
      submissionNotes[submission.id] ?? {
        founderVisibleNote: submission.founderVisibleNote ?? "",
        internalReviewNote: submission.internalReviewNote ?? "",
      }
    );
  }

  function getSpotlightDraft(submission: Submission) {
    return (
      spotlightDrafts[submission.id] ??
      submission.spotlightBrief?.publishedArticle?.slug ??
      ""
    );
  }

  return (
    <SectionCard
      eyebrow="Reviews"
      title="Submissions"
      description="Approve launches and write founder notes."
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:w-[32rem]">
          <Field label="Search">
            <input
              value={submissionSearch}
              onChange={(event) => onSubmissionSearchChange(event.target.value)}
              placeholder="Founder, tool, email..."
              className={textInputClassName()}
            />
          </Field>
          <Field label="Filter">
            <NativeSelect
              value={submissionFilter}
              onChange={(event) =>
                onSubmissionFilterChange(
                  event.target.value as "" | Submission["reviewStatus"],
                )
              }
              className={textInputClassName()}
            >
              <option value="PENDING">Pending only</option>
              <option value="APPROVED">Approved only</option>
              <option value="REJECTED">Rejected only</option>
              <option value="">All</option>
            </NativeSelect>
          </Field>
        </div>

        <div className="text-[10px] font-black  tracking-widest text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border">
          {submissions.length} items
        </div>
      </div>

      {submissionError && (
        <div className="mb-6 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold text-destructive  tracking-widest">
          {submissionError}
        </div>
      )}

      <div className="grid gap-4">
        {submissions.map((submission) => {
          const draft = getSubmissionReviewDraft(submission);
          const lifecycle = getSubmissionLifecycle(submission);
          const latestLaunch = submission.tool.launches[0] ?? null;
          const requiresManualReview =
            submission.reviewStatus === "PENDING" &&
            !(
              submission.submissionType === "FEATURED_LAUNCH" &&
              submission.paymentStatus === "PENDING"
            );

          return (
            <article
              key={submission.id}
              className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-6"
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip label={lifecycle.label} tone={lifecycle.tone} />
                      <span className="px-2 py-0.5 rounded border border-border bg-card text-[10px] font-black  tracking-widest text-muted-foreground">
                        {submission.submissionType}
                      </span>
                      <StatusChip
                        label={`Pay: ${getPaymentStatusLabel(submission)}`}
                        tone="neutral"
                      />
                      <StatusChip
                        label={getSubmissionBadgeLabel(submission)}
                        tone="neutral"
                      />
                    </div>

                    <div className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-card flex items-center justify-center border border-border shrink-0 overflow-hidden">
                        {submission.tool.logoMedia ? (
                          <>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={submission.tool.logoMedia.url} alt={`${submission.tool.name} logo`} className="w-full h-full object-cover" />
                          </>
                        ) : <Rocket size={16} className="text-muted-foreground" />}
                      </div>
                      <div className="space-y-0.5">
                        <Link
                          href={`/admin/submissions/${submission.id}`}
                          className="text-base font-black text-foreground hover:opacity-80"
                        >
                          {submission.tool.name}
                        </Link>
                        <p className="text-[10px] font-black  tracking-widest text-muted-foreground/50">
                          Submitted {formatDate(submission.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-2 text-[10px] font-bold text-muted-foreground/80">
                      <p>
                        Founder:{" "}
                        <Link
                          href={`/admin/submissions/${submission.id}`}
                          className="text-foreground underline decoration-border underline-offset-4"
                        >
                          {submission.user.email}
                        </Link>
                      </p>
                      <p>Slug: {submission.tool.slug}</p>
                      <p>Last updated: {formatDate(submission.updatedAt)}</p>
                      {submission.preferredLaunchDate && (
                        <p className="text-primary flex items-center gap-1">
                          <Clock size={10} />
                          {formatDate(submission.preferredLaunchDate)}
                        </p>
                      )}
                      {latestLaunch && (
                        <p>Launch date: {formatDate(latestLaunch.launchDate)}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 min-w-[140px]">
                    <a
                      href={submission.tool.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-center gap-2 w-full border border-border bg-card px-4 py-2 rounded-lg text-[10px] font-black  tracking-widest hover:bg-muted transition-all"
                    >
                      <ExternalLink size={12} /> Visit Site
                    </a>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 pt-4 border-t border-border">
                  <Field label="Founder note">
                    <textarea
                      value={draft.founderVisibleNote}
                      onChange={(event) =>
                        setSubmissionNotes((current) => ({
                          ...current,
                          [submission.id]: {
                            ...draft,
                            founderVisibleNote: event.target.value,
                          },
                        }))
                      }
                      rows={2}
                      className={cn(textInputClassName(), "text-xs")}
                      placeholder="Note for founder..."
                    />
                  </Field>
                  <Field label="Internal review note">
                    <textarea
                      value={draft.internalReviewNote}
                      onChange={(event) =>
                        setSubmissionNotes((current) => ({
                          ...current,
                          [submission.id]: {
                            ...draft,
                            internalReviewNote: event.target.value,
                          },
                        }))
                      }
                      rows={2}
                      className={cn(textInputClassName(), "text-xs")}
                      placeholder="Team only..."
                    />
                  </Field>
                </div>

                {submission.submissionType === "FEATURED_LAUNCH" &&
                submission.paymentStatus === "PAID" ? (
                  <div className="grid gap-4 border-t border-border pt-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip
                          label={`Spotlight: ${
                            submission.spotlightBrief?.status ?? "NOT_STARTED"
                          }`}
                          tone={
                            submission.spotlightBrief?.status === "PUBLISHED"
                              ? "green"
                              : submission.spotlightBrief?.status === "READY"
                                ? "green"
                                : submission.spotlightBrief?.status ===
                                    "IN_PROGRESS"
                                  ? "amber"
                                  : "slate"
                          }
                        />
                        {submission.spotlightBrief?.publishedArticle ? (
                          <a
                            href={`/blog/${submission.spotlightBrief.publishedArticle.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-black tracking-widest text-primary hover:opacity-80"
                          >
                            <ExternalLink size={12} />
                            {submission.spotlightBrief.publishedArticle.title}
                          </a>
                        ) : null}
                      </div>
                      <Field
                        label="Spotlight article slug"
                        hint="Use a published article in the Launch Spotlights category."
                      >
                        <input
                          value={getSpotlightDraft(submission)}
                          onChange={(event) =>
                            setSpotlightDrafts((current) => ({
                              ...current,
                              [submission.id]: event.target.value,
                            }))
                          }
                          placeholder="launch-week-feature-acme"
                          className={textInputClassName()}
                        />
                      </Field>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSubmissionSpotlightLink(
                          submission.id,
                          getSpotlightDraft(submission),
                        )
                      }
                      disabled={
                        hasPendingAction || !getSpotlightDraft(submission).trim()
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-[10px] font-black tracking-widest hover:bg-muted disabled:opacity-50"
                    >
                      {isActionPending(`spotlight:${submission.id}`) ? (
                        <RefreshCw className="animate-spin" size={12} />
                      ) : (
                        <Rocket size={12} />
                      )}
                      Link spotlight
                    </button>
                  </div>
                ) : null}

                {requiresManualReview && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => handleSubmissionReview(submission.id, "APPROVE")}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-[10px] font-black  tracking-widest text-primary-foreground shadow-lg shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
                    >
                      {isActionPending(`review:${submission.id}:APPROVE`) ? (
                        <RefreshCw className="animate-spin" size={12} />
                      ) : (
                        <Check size={12} />
                      )}
                      Approve & Publish
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmissionReview(submission.id, "REJECT")}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-2 text-[10px] font-black  tracking-widest text-destructive transition hover:bg-destructive/20 disabled:opacity-50"
                    >
                      {isActionPending(`review:${submission.id}:REJECT`) ? (
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

        {submissions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/30 px-5 py-10 text-center">
            <p className="text-xs font-bold text-muted-foreground  tracking-widest">
              No submissions.
            </p>
          </div>
        )}
      </div>
    </SectionCard>
  );
}
