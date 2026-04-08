"use client";

import Link from "next/link";
import { useState } from "react";

type FounderSubmission = {
  id: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  preferredLaunchDate: string | null;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeFooterUrl: string | null;
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  founderVisibleNote: string | null;
  internalReviewNote: string | null;
  createdAt: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    launches: Array<{
      id: string;
      launchType: "FREE" | "FEATURED" | "RELAUNCH";
      status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
      launchDate: string;
    }>;
  };
};

type FounderToolSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  moderationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  publicationStatus: "UNPUBLISHED" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  updatedAt: string;
  launches: Array<{
    id: string;
    launchType: "FREE" | "FEATURED" | "RELAUNCH";
    status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
    launchDate: string;
  }>;
  logoMedia: { url: string } | null;
};

type FounderListingClaim = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  claimEmail: string;
  claimDomain: string;
  websiteDomain: string;
  founderVisibleNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
  };
};

type SubmissionStateSummary = {
  label: string;
  tone: "green" | "amber" | "rose" | "slate";
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function badgeTone(status: FounderSubmission["badgeVerification"]) {
  if (status === "VERIFIED") {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  if (status === "FAILED") {
    return "bg-rose-50 border-rose-200 text-rose-700";
  }

  if (status === "PENDING") {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }

  return "bg-black/[0.04] border-black/10 text-black/60";
}

function getSubmissionState(submission: FounderSubmission): SubmissionStateSummary {
  const currentLaunch = submission.tool.launches[0];

  if (submission.reviewStatus === "DRAFT") {
    if (
      submission.submissionType === "FREE_LAUNCH" &&
      submission.badgeVerification === "VERIFIED"
    ) {
      return { label: "Ready to submit", tone: "green" };
    }

    return { label: "Draft", tone: "slate" };
  }

  if (submission.reviewStatus === "REJECTED") {
    return { label: "Needs changes", tone: "rose" };
  }

  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PENDING"
  ) {
    return { label: "Awaiting payment", tone: "amber" };
  }

  if (currentLaunch?.status === "LIVE") {
    return { label: "Live", tone: "green" };
  }

  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PAID" &&
    currentLaunch?.status === "APPROVED"
  ) {
    return { label: "Scheduled", tone: "green" };
  }

  if (submission.reviewStatus === "APPROVED") {
    return { label: "Approved", tone: "green" };
  }

  return { label: "Pending review", tone: "amber" };
}

function submissionStateTone(tone: SubmissionStateSummary["tone"]) {
  if (tone === "green") {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  if (tone === "rose") {
    return "bg-rose-50 border-rose-200 text-rose-700";
  }

  if (tone === "slate") {
    return "bg-slate-100 border-slate-200 text-slate-700";
  }

  return "bg-amber-50 border-amber-200 text-amber-700";
}

function getPaymentLabel(submission: FounderSubmission) {
  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PENDING"
  ) {
    return "Awaiting payment";
  }

  return submission.paymentStatus;
}

async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload?.data as T;
}

function toDateInputValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureFeaturedLaunch(submission: FounderSubmission) {
  if (
    submission.submissionType !== "FEATURED_LAUNCH" ||
    submission.paymentStatus !== "PAID"
  ) {
    return false;
  }

  const featuredLaunch = submission.tool.launches.find(
    (launch) => launch.launchType === "FEATURED",
  );

  if (!featuredLaunch) {
    return false;
  }

  const launchDate = new Date(featuredLaunch.launchDate);
  const now = new Date();

  return (
    featuredLaunch.status !== "LIVE" &&
    featuredLaunch.status !== "ENDED" &&
    launchDate > now
  );
}

export function FounderDashboard({
  initialSubmissions,
  initialTools,
  initialClaims,
  founderEmail,
  founderRole,
  initialSuccessMessage,
}: {
  initialSubmissions: FounderSubmission[];
  initialTools: FounderToolSummary[];
  initialClaims: FounderListingClaim[];
  founderEmail: string;
  founderRole: string;
  initialSuccessMessage?: string | null;
}) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [tools, setTools] = useState(initialTools);
  const [claims, setClaims] = useState(initialClaims);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialSuccessMessage ?? null,
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(
    null,
  );
  const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(
    null,
  );
  const [pendingSubmitId, setPendingSubmitId] = useState<string | null>(null);
  const [pendingRescheduleId, setPendingRescheduleId] = useState<string | null>(
    null,
  );
  const [rescheduleDrafts, setRescheduleDrafts] = useState<Record<string, string>>(
    () =>
      Object.fromEntries(
        initialSubmissions
          .filter((submission) => submission.preferredLaunchDate)
          .map((submission) => [
            submission.id,
            toDateInputValue(submission.preferredLaunchDate as string),
          ]),
      ),
  );

  const pendingCount = submissions.filter(
    (submission) => getSubmissionState(submission).label === "Pending review",
  ).length;
  const awaitingPaymentCount = submissions.filter(
    (submission) => getSubmissionState(submission).label === "Awaiting payment",
  ).length;
  const approvedCount = submissions.filter(
    (submission) => submission.reviewStatus === "APPROVED",
  ).length;
  const pendingClaimCount = claims.filter((claim) => claim.status === "PENDING").length;

  function updateSubmission(nextSubmission: FounderSubmission) {
    setSubmissions((current) =>
      current.map((submission) =>
        submission.id === nextSubmission.id ? nextSubmission : submission,
      ),
    );
  }

  function refresh() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);
    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const nextSubmissions = await apiRequest<FounderSubmission[]>(
          "/api/submissions",
        );
        const nextTools = await apiRequest<FounderToolSummary[]>(
          "/api/founder/tools",
        );
        const nextClaims = await apiRequest<FounderListingClaim[]>(
          "/api/listing-claims",
        );
        setSubmissions(nextSubmissions);
        setTools(nextTools);
        setClaims(nextClaims);
        setRescheduleDrafts(
          Object.fromEntries(
            nextSubmissions
              .filter((submission) => submission.preferredLaunchDate)
              .map((submission) => [
                submission.id,
                toDateInputValue(submission.preferredLaunchDate as string),
              ]),
          ),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to refresh submissions.",
        );
      } finally {
        setIsRefreshing(false);
      }
    })();
  }

  function beginFeaturedCheckout(submissionId: string) {
    if (pendingCheckoutId) {
      return;
    }

    setPendingCheckoutId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const result = await apiRequest<{
          checkoutUrl: string;
          checkoutId: string;
        }>("/api/polar/checkout/featured-launch", {
          method: "POST",
          body: JSON.stringify({ submissionId }),
        });

        window.location.href = result.checkoutUrl;
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to start checkout.",
        );
        setPendingCheckoutId(null);
      }
    })();
  }

  function verifyDraftBadge(submissionId: string) {
    if (pendingVerificationId) {
      return;
    }

    setPendingVerificationId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const result = await apiRequest<{
          verified: boolean;
          message: string;
          submission: FounderSubmission;
        }>(`/api/submissions/${submissionId}/verify-badge`, {
          method: "POST",
        });

        updateSubmission(result.submission);

        if (result.verified) {
          setSuccessMessage(result.message);
        } else {
          setErrorMessage(result.message);
        }
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify the Shipboost badge.",
        );
      } finally {
        setPendingVerificationId(null);
      }
    })();
  }

  function submitDraft(submissionId: string) {
    if (pendingSubmitId) {
      return;
    }

    setPendingSubmitId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const result = await apiRequest<FounderSubmission>(
          `/api/submissions/${submissionId}/submit`,
          {
            method: "POST",
          },
        );

        updateSubmission(result);
        setSuccessMessage("Launch submitted for review.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to submit the launch draft.",
        );
      } finally {
        setPendingSubmitId(null);
      }
    })();
  }

  function rescheduleFeaturedLaunch(submissionId: string) {
    const preferredLaunchDate = rescheduleDrafts[submissionId];

    if (!preferredLaunchDate || pendingRescheduleId) {
      return;
    }

    setPendingRescheduleId(submissionId);

    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const updatedSubmission = await apiRequest<FounderSubmission>(
          `/api/submissions/${submissionId}/reschedule`,
          {
            method: "PATCH",
            body: JSON.stringify({ preferredLaunchDate }),
          },
        );

        setSubmissions((current) =>
          current.map((submission) =>
            submission.id === submissionId ? updatedSubmission : submission,
          ),
        );
        setRescheduleDrafts((current) => ({
          ...current,
          [submissionId]: updatedSubmission.preferredLaunchDate
            ? toDateInputValue(updatedSubmission.preferredLaunchDate)
            : preferredLaunchDate,
        }));
        setSuccessMessage("Featured launch rescheduled.");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to reschedule featured launch.",
        );
      } finally {
        setPendingRescheduleId(null);
      }
    })();
  }

  return (
    <div className="grid gap-8">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="rounded-[1.75rem] border border-black/10 bg-[#fff9ef] p-5">
          <p className="text-sm text-black/55">Founder email</p>
          <p className="mt-2 text-lg font-semibold text-black">{founderEmail}</p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#f3f8f6] p-5">
          <p className="text-sm text-black/55">Role</p>
          <p className="mt-2 text-lg font-semibold text-black">{founderRole}</p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#fff6f2] p-5">
          <p className="text-sm text-black/55">Pending reviews</p>
          <p className="mt-2 text-3xl font-semibold text-black">{pendingCount}</p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#f6f2ff] p-5">
          <p className="text-sm text-black/55">Approved / awaiting payment</p>
          <p className="mt-2 text-3xl font-semibold text-black">
            {approvedCount} / {awaitingPaymentCount}
          </p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#eef6ff] p-5">
          <p className="text-sm text-black/55">Pending claims</p>
          <p className="mt-2 text-3xl font-semibold text-black">{pendingClaimCount}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
            Founder workspace
          </p>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
            Track your launch pipeline.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-black/66">
            Submit a new SaaS for listing, free launch with badge requirement,
            or a featured launch request. This dashboard is your operating
            surface until the rest of the founder tooling lands.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/submit"
              className="inline-flex items-center justify-center rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26]"
            >
              Submit a product
            </Link>
            <button
              type="button"
              onClick={refresh}
              disabled={isRefreshing}
              className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isRefreshing ? "Refreshing..." : "Refresh status"}
            </button>
          </div>

          {errorMessage ? (
            <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}
          {successMessage ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}
        </section>

        <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.24)] sm:p-10">
          <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
            What converts next
          </p>
          <div className="mt-6 space-y-4 text-sm leading-7 text-[#f8efe3]/82">
            <p>Use `FREE_LAUNCH` when you can place the Shipboost badge in your footer right away.</p>
            <p>Use `FEATURED_LAUNCH` when you want priority placement and faster attention on launch day.</p>
            <p>Use `LISTING_ONLY` when you just want a clean affiliate-ready profile without a launch request.</p>
          </div>
        </aside>
      </div>

      <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Listing claims
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
              Ownership requests in review
            </h2>
          </div>
          <span className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm text-black/60">
            {claims.length} total
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {claims.map((claim) => (
            <article
              key={claim.id}
              className="rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase text-black/65">
                      {claim.status}
                    </span>
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
                    <p>Claim email: {claim.claimEmail}</p>
                    <p>Domain match: {claim.claimDomain}</p>
                    {claim.reviewedAt ? (
                      <p>Reviewed: {formatDate(claim.reviewedAt)}</p>
                    ) : null}
                    {claim.founderVisibleNote ? (
                      <p className="sm:col-span-2">Review note: {claim.founderVisibleNote}</p>
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
            </article>
          ))}

          {claims.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
              No listing claims yet. Claim a seeded public listing to manage it from this dashboard.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              My listings
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
              Edit and maintain your public profiles
            </h2>
          </div>
          <span className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm text-black/60">
            {tools.length} listings
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {tools.map((tool) => (
            <article
              key={tool.id}
              className="rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase text-black/65">
                      {tool.moderationStatus}
                    </span>
                    <span className="inline-flex rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase text-black/65">
                      {tool.publicationStatus}
                    </span>
                    {tool.isFeatured ? (
                      <span className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase text-amber-700">
                        Featured
                      </span>
                    ) : null}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-black">{tool.name}</h3>
                    <p className="mt-1 text-sm text-black/58">{tool.tagline}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42">
                      Updated {formatDate(tool.updatedAt)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Link
                    href={`/dashboard/tools/${tool.id}`}
                    className="rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26]"
                  >
                    Edit listing
                  </Link>
                  <Link
                    href={`/tools/${tool.slug}`}
                    className="rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
                  >
                    View page
                  </Link>
                </div>
              </div>
            </article>
          ))}

          {tools.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
              No listings yet. Submit your first product to create one.
            </div>
          ) : null}
        </div>
      </section>

      <section className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
              Submission status
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
              Your listings and launch requests
            </h2>
          </div>
          <span className="rounded-full border border-black/10 bg-black/[0.03] px-4 py-2 text-sm text-black/60">
            {submissions.length} total
          </span>
        </div>

        <div className="mt-8 space-y-4">
          {submissions.map((submission) => (
            <article
              key={submission.id}
              className="rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5"
            >
              {(() => {
                const canReschedule = isFutureFeaturedLaunch(submission);
                const featuredLaunch = submission.tool.launches.find(
                  (launch) => launch.launchType === "FEATURED",
                );
                const submissionState = getSubmissionState(submission);

                return (
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${submissionStateTone(submissionState.tone)}`}
                    >
                      {submissionState.label}
                    </span>
                    <span className="inline-flex rounded-full border border-black/10 bg-black/[0.03] px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase text-black/65">
                      {submission.submissionType}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${badgeTone(submission.badgeVerification)}`}
                    >
                      {submission.badgeVerification}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold text-black">
                      {submission.tool.name}
                    </h3>
                    <p className="mt-1 text-sm text-black/58">
                      {submission.tool.tagline}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42">
                      Submitted {formatDate(submission.createdAt)}
                    </p>
                  </div>

                  <div className="grid gap-2 text-sm text-black/62 sm:grid-cols-2">
                    <p>Slug: {submission.tool.slug}</p>
                    {submission.preferredLaunchDate ? (
                      <p>
                        Preferred date: {formatDate(submission.preferredLaunchDate)}
                      </p>
                    ) : null}
                    <p>Payment: {getPaymentLabel(submission)}</p>
                    <p>
                      Badge check target: {submission.submissionType === "FREE_LAUNCH" ? "Homepage" : "Not required"}
                    </p>
                    {submission.tool.launches[0] ? (
                      <p>
                        Launch slot: {formatDate(submission.tool.launches[0].launchDate)}
                      </p>
                    ) : null}
                    {submission.tool.launches[0] ? (
                      <p>
                        Launch status: {submission.tool.launches[0].status}
                      </p>
                    ) : null}
                    {submission.founderVisibleNote ? (
                      <p className="sm:col-span-2">
                        Founder note: {submission.founderVisibleNote}
                      </p>
                    ) : null}
                  </div>

                  {canReschedule && featuredLaunch ? (
                    <div className="rounded-[1.25rem] border border-[#9f4f1d]/12 bg-[#fff7ea] p-4">
                      <p className="text-sm font-semibold text-black">
                        Reschedule featured launch
                      </p>
                      <p className="mt-1 text-xs leading-6 text-black/55">
                        You can move this launch to any future date until it goes live.
                      </p>
                      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <input
                          type="date"
                          value={
                            rescheduleDrafts[submission.id] ??
                            (submission.preferredLaunchDate
                              ? toDateInputValue(submission.preferredLaunchDate)
                              : "")
                          }
                          min={toDateInputValue(new Date().toISOString())}
                          onChange={(event) =>
                            setRescheduleDrafts((current) => ({
                              ...current,
                              [submission.id]: event.target.value,
                            }))
                          }
                          className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10"
                        />
                        <button
                          type="button"
                          onClick={() => rescheduleFeaturedLaunch(submission.id)}
                          disabled={pendingRescheduleId !== null}
                          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#9f4f1d]/20 bg-white px-4 py-3 text-sm font-semibold text-[#9f4f1d] transition hover:bg-[#fff2df] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {pendingRescheduleId === submission.id ? (
                            <>
                              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#9f4f1d]/30 border-t-[#9f4f1d]" />
                              Rescheduling...
                            </>
                          ) : (
                            "Reschedule launch"
                          )}
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  {submission.reviewStatus === "DRAFT" ? (
                    <Link
                      href={`/dashboard/tools/${submission.tool.id}`}
                      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
                    >
                      Edit draft
                    </Link>
                  ) : null}
                  {submission.submissionType === "FREE_LAUNCH" &&
                  submission.reviewStatus === "DRAFT" ? (
                    <button
                      type="button"
                      onClick={() => verifyDraftBadge(submission.id)}
                      disabled={pendingVerificationId !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#9f4f1d]/20 bg-white px-4 py-2 text-sm font-semibold text-[#9f4f1d] transition hover:bg-[#fff2df] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingVerificationId === submission.id ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#9f4f1d]/30 border-t-[#9f4f1d]" />
                          Verifying...
                        </>
                      ) : (
                        "Verify badge"
                      )}
                    </button>
                  ) : null}
                  {submission.reviewStatus === "DRAFT" &&
                  submission.submissionType !== "FEATURED_LAUNCH" ? (
                    <button
                      type="button"
                      onClick={() => submitDraft(submission.id)}
                      disabled={
                        pendingSubmitId !== null ||
                        (submission.submissionType === "FREE_LAUNCH" &&
                          submission.badgeVerification !== "VERIFIED")
                      }
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingSubmitId === submission.id ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Submitting...
                        </>
                      ) : (
                        "Submit for review"
                      )}
                    </button>
                  ) : null}
                  {submission.submissionType === "FEATURED_LAUNCH" &&
                  submission.paymentStatus !== "PAID" ? (
                    <button
                      type="button"
                      onClick={() => beginFeaturedCheckout(submission.id)}
                      disabled={pendingCheckoutId !== null}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#9f4f1d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#7d3f17] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {pendingCheckoutId === submission.id ? (
                        <>
                          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                          Opening checkout...
                        </>
                      ) : (
                        "Pay featured launch"
                      )}
                    </button>
                  ) : null}
                  <a
                    href={submission.tool.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
                  >
                    Visit site
                  </a>
                </div>
              </div>
                );
              })()}
            </article>
          ))}

          {submissions.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
              No submissions yet. Start with your first listing or launch request.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
