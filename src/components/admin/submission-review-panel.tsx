import {
  Field,
  SectionCard,
  StatusChip,
  formatDate,
  getPaymentStatusLabel,
  getSubmissionLifecycle,
  pendingSpinnerClassName,
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
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  function getSubmissionReviewDraft(submission: Submission) {
    return (
      submissionNotes[submission.id] ?? {
        founderVisibleNote: submission.founderVisibleNote ?? "",
        internalReviewNote: submission.internalReviewNote ?? "",
      }
    );
  }

  return (
    <SectionCard
      eyebrow="Review queue"
      title="Moderate founder submissions"
      description="Approve launches, reject bad fits, and write the notes founders will actually see."
    >
      <div className="mb-6 flex flex-col gap-3 md:flex-row">
        <input
          value={submissionSearch}
          onChange={(event) => onSubmissionSearchChange(event.target.value)}
          placeholder="Search by founder, email, tool, or slug"
          className={textInputClassName()}
        />
        <select
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
          <option value="">All statuses</option>
        </select>
      </div>

      {submissionError ? (
        <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {submissionError}
        </div>
      ) : null}

      <div className="space-y-4">
        {submissions.map((submission) => {
          const draft = getSubmissionReviewDraft(submission);
          const lifecycle = getSubmissionLifecycle(submission);
          const requiresManualReview =
            submission.reviewStatus === "PENDING" &&
            !(
              submission.submissionType === "FEATURED_LAUNCH" &&
              submission.paymentStatus === "PENDING"
            );

          return (
            <article
              key={submission.id}
              className="rounded-[1.75rem] border border-black/10 bg-[#fffdf9] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusChip label={lifecycle.label} tone={lifecycle.tone} />
                    <StatusChip label={submission.submissionType} tone="slate" />
                    <StatusChip
                      label={getPaymentStatusLabel(submission)}
                      tone="neutral"
                    />
                    <StatusChip
                      label={submission.badgeVerification}
                      tone="neutral"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-black">
                      {submission.tool.name}
                    </h3>
                    <p className="mt-1 text-sm text-black/58">
                      {submission.tool.tagline}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-black/62 sm:grid-cols-2">
                    <p>
                      Founder: {submission.user.name ?? "Unnamed founder"} (
                      {submission.user.email})
                    </p>
                    <p>Submitted: {formatDate(submission.createdAt)}</p>
                    <p>Slug: {submission.tool.slug}</p>
                    {submission.preferredLaunchDate ? (
                      <p>Preferred date: {formatDate(submission.preferredLaunchDate)}</p>
                    ) : null}
                    {submission.submissionType === "FEATURED_LAUNCH" &&
                    submission.paymentStatus === "PENDING" ? (
                      <p className="sm:col-span-2">
                        This featured launch will auto-approve after payment. It
                        does not need the normal review queue.
                      </p>
                    ) : null}
                    <p>
                      Badge URL: {submission.badgeFooterUrl ? "Provided" : "Not required"}
                    </p>
                  </div>
                </div>

                <a
                  href={submission.tool.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
                >
                  Visit site
                </a>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-2">
                <Field label="Founder-visible note">
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
                    rows={3}
                    className={textInputClassName()}
                    placeholder="Optional note the founder will see."
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
                    rows={3}
                    className={textInputClassName()}
                    placeholder="Internal reasoning for your team."
                  />
                </Field>
              </div>

              {requiresManualReview ? (
                <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => handleSubmissionReview(submission.id, "APPROVE")}
                    disabled={hasPendingAction}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isActionPending(`review:${submission.id}:APPROVE`) ? (
                      <>
                        <span className={pendingSpinnerClassName()} />
                        Approving...
                      </>
                    ) : (
                      "Approve and publish"
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmissionReview(submission.id, "REJECT")}
                    disabled={hasPendingAction}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isActionPending(`review:${submission.id}:REJECT`) ? (
                      <>
                        <span className={pendingSpinnerClassName()} />
                        Rejecting...
                      </>
                    ) : (
                      "Reject submission"
                    )}
                  </button>
                </div>
              ) : null}
            </article>
          );
        })}

        {submissions.length === 0 ? (
          <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
            No submissions matched this filter.
          </div>
        ) : null}
      </div>
    </SectionCard>
  );
}
