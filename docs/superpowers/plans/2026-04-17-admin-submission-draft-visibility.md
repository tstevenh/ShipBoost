# Admin Submission Draft Visibility Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the admin `Moderate` tab clearly distinguish drafts from real review items, let admins open a read-only submission detail view, and expose assigned launch dates consistently in admin and founder surfaces.

**Architecture:** Reuse the existing admin submissions pipeline instead of adding a new data model. The list view keeps mixed `DRAFT` and `PENDING` items, but the shared status helpers become explicit, the moderation cards gain compact progress metadata, and a new admin detail page renders the saved submission/tool payload read-only. Founder dashboard changes stay narrow: refine the state mapping so approved launches with an assigned future slot read as `Scheduled`.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Vitest, Testing Library, Prisma-backed server services.

---

## File Structure

### Files to modify

- `src/components/admin/admin-console-shared.tsx`
  - Extend the `Submission` type with `updatedAt`.
  - Add explicit lifecycle helpers for `DRAFT`.
  - Add a badge-label helper for list/detail rendering.

- `src/components/admin/submission-review-panel.tsx`
  - Render `Last updated`, badge status, and assigned launch date.
  - Convert founder and tool labels into links to the new detail page.
  - Preserve review actions for actionable `PENDING` rows only.

- `src/server/services/submission-draft-service.ts`
  - Add an admin-only detail loader that returns one submission with tool relations.

- `src/server/services/submission-service.ts`
  - Re-export the new admin detail loader.

- `src/components/founder/founder-dashboard.tsx`
  - Treat approved free launches with a future assigned slot as `Scheduled`.
  - Keep showing the launch-date chip using the latest launch record.

### Files to create

- `src/components/admin/admin-console-shared.test.ts`
  - Unit tests for lifecycle and badge-label helpers.

- `src/components/admin/submission-review-panel.test.tsx`
  - Rendering tests for draft vs pending cards and link targets.

- `src/components/admin/submission-detail-view.tsx`
  - Read-only admin submission detail UI.

- `src/components/admin/submission-detail-view.test.tsx`
  - Read-only rendering tests for saved form data and schedule metadata.

- `src/app/admin/submissions/[submissionId]/page.tsx`
  - Server page that loads one submission and renders the detail view.

- `src/app/admin/submissions/[submissionId]/page.test.tsx`
  - Server page tests for found vs missing submissions.

- `src/components/founder/founder-dashboard.test.tsx`
  - Founder state/launch-date rendering tests.

## Task 1: Fix Shared Submission Status Logic And Moderation Card Metadata

**Files:**
- Modify: `src/components/admin/admin-console-shared.tsx`
- Modify: `src/components/admin/submission-review-panel.tsx`
- Create: `src/components/admin/admin-console-shared.test.ts`
- Create: `src/components/admin/submission-review-panel.test.tsx`

- [ ] **Step 1: Write failing helper tests for lifecycle and badge labels**

```ts
import { describe, expect, it } from "vitest";

import {
  getSubmissionLifecycle,
  getSubmissionBadgeLabel,
  type Submission,
} from "@/components/admin/admin-console-shared";

function buildSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "submission_1",
    submissionType: "FREE_LAUNCH",
    reviewStatus: "DRAFT",
    preferredLaunchDate: null,
    paymentStatus: "NOT_REQUIRED",
    badgeFooterUrl: null,
    badgeVerification: "PENDING",
    founderVisibleNote: null,
    internalReviewNote: null,
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T01:00:00.000Z",
    spotlightBrief: null,
    user: {
      id: "user_1",
      name: "Founder",
      email: "founder@example.com",
    },
    tool: {
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      tagline: "Ship faster",
      websiteUrl: "https://acme.test",
      logoMedia: null,
      launches: [],
    },
    ...overrides,
  };
}

describe("admin-console-shared", () => {
  it("returns Draft for draft submissions", () => {
    expect(getSubmissionLifecycle(buildSubmission())).toEqual({
      label: "Draft",
      tone: "slate",
    });
  });

  it("returns a pending badge label for free-launch drafts", () => {
    expect(getSubmissionBadgeLabel(buildSubmission())).toBe("Badge: Pending");
  });

  it("returns not-required badge label for premium launches", () => {
    expect(
      getSubmissionBadgeLabel(
        buildSubmission({
          submissionType: "FEATURED_LAUNCH",
          paymentStatus: "PAID",
          badgeVerification: "NOT_REQUIRED",
        }),
      ),
    ).toBe("Badge: Not required");
  });
});
```

- [ ] **Step 2: Run the helper test file and confirm it fails**

Run: `npm test -- src/components/admin/admin-console-shared.test.ts`

Expected: FAIL because `updatedAt` is missing from the `Submission` type and `getSubmissionBadgeLabel` does not exist yet.

- [ ] **Step 3: Implement the shared helper changes**

```ts
export type Submission = {
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
  updatedAt: string;
  spotlightBrief: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "READY" | "PUBLISHED";
    updatedAt: string;
    publishedAt: string | null;
    publishedArticle: {
      slug: string;
      title: string;
    } | null;
  } | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    launches: Array<{
      id: string;
      launchType: string;
      status: string;
      launchDate: string;
    }>;
  };
};

export function getSubmissionLifecycle(submission: Submission) {
  if (submission.reviewStatus === "DRAFT") {
    return { label: "Draft", tone: "slate" as const };
  }

  if (submission.reviewStatus === "REJECTED") {
    return { label: "Needs changes", tone: "rose" as const };
  }

  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PENDING"
  ) {
    return { label: "Awaiting payment", tone: "amber" as const };
  }

  if (submission.reviewStatus === "APPROVED") {
    return { label: "Approved", tone: "green" as const };
  }

  return { label: "Pending review", tone: "amber" as const };
}

export function getSubmissionBadgeLabel(submission: Submission) {
  if (submission.submissionType !== "FREE_LAUNCH") {
    return "Badge: Not required";
  }

  if (submission.badgeVerification === "VERIFIED") {
    return "Badge: Verified";
  }

  if (submission.badgeVerification === "FAILED") {
    return "Badge: Failed";
  }

  return "Badge: Pending";
}
```

- [ ] **Step 4: Write the failing moderation card rendering test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SubmissionReviewPanel } from "@/components/admin/submission-review-panel";
import type { Submission } from "@/components/admin/admin-console-shared";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

function buildSubmission(overrides: Partial<Submission> = {}): Submission {
  return {
    id: "submission_1",
    submissionType: "FREE_LAUNCH",
    reviewStatus: "DRAFT",
    preferredLaunchDate: null,
    paymentStatus: "NOT_REQUIRED",
    badgeFooterUrl: null,
    badgeVerification: "PENDING",
    founderVisibleNote: null,
    internalReviewNote: null,
    createdAt: "2026-04-17T00:00:00.000Z",
    updatedAt: "2026-04-17T01:00:00.000Z",
    spotlightBrief: null,
    user: { id: "user_1", name: "Founder", email: "founder@example.com" },
    tool: {
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      tagline: "Ship faster",
      websiteUrl: "https://acme.test",
      logoMedia: null,
      launches: [],
    },
    ...overrides,
  };
}

describe("submission-review-panel", () => {
  it("does not show review actions for drafts and links to the detail page", () => {
    render(
      <SubmissionReviewPanel
        submissionSearch=""
        onSubmissionSearchChange={() => {}}
        submissionFilter=""
        onSubmissionFilterChange={() => {}}
        submissionError={null}
        submissions={[buildSubmission()]}
        submissionNotes={{}}
        setSubmissionNotes={() => {}}
        handleSubmissionReview={() => {}}
        handleSubmissionSpotlightLink={() => {}}
        hasPendingAction={false}
        isActionPending={() => false}
      />,
    );

    expect(screen.queryByRole("button", { name: /approve & publish/i })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Acme" })).toHaveAttribute(
      "href",
      "/admin/submissions/submission_1",
    );
    expect(screen.getByText("Badge: Pending")).toBeInTheDocument();
    expect(screen.getByText(/Last updated/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 5: Run the panel test file and confirm it fails**

Run: `npm test -- src/components/admin/submission-review-panel.test.tsx`

Expected: FAIL because the panel does not render links, badge summary, or last-updated metadata yet.

- [ ] **Step 6: Implement the moderation card changes**

```tsx
import Link from "next/link";

import {
  Field,
  SectionCard,
  StatusChip,
  formatDate,
  getPaymentStatusLabel,
  getSubmissionBadgeLabel,
  getSubmissionLifecycle,
  textInputClassName,
  type Submission,
} from "@/components/admin/admin-console-shared";

// inside the card body
const latestLaunch = submission.tool.launches[0] ?? null;

<div className="space-y-0.5">
  <Link
    href={`/admin/submissions/${submission.id}`}
    className="text-base font-black text-foreground hover:opacity-80"
  >
    {submission.tool.name}
  </Link>
  <p className="text-[10px] font-black tracking-widest text-muted-foreground/50">
    Submitted {formatDate(submission.createdAt)}
  </p>
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
  {latestLaunch ? <p>Launch date: {formatDate(latestLaunch.launchDate)}</p> : null}
</div>

<div className="flex flex-wrap items-center gap-2">
  <StatusChip label={lifecycle.label} tone={lifecycle.tone} />
  <span className="px-2 py-0.5 rounded border border-border bg-card text-[10px] font-black tracking-widest text-muted-foreground">
    {submission.submissionType}
  </span>
  <StatusChip label={`Pay: ${getPaymentStatusLabel(submission)}`} tone="neutral" />
  <StatusChip label={getSubmissionBadgeLabel(submission)} tone="neutral" />
</div>
```

- [ ] **Step 7: Run the focused admin tests and confirm they pass**

Run: `npm test -- src/components/admin/admin-console-shared.test.ts src/components/admin/submission-review-panel.test.tsx`

Expected: PASS with the draft label fixed, the badge label rendered, and the draft card lacking review actions.

- [ ] **Step 8: Commit the shared/admin list changes**

```bash
git add src/components/admin/admin-console-shared.tsx \
  src/components/admin/submission-review-panel.tsx \
  src/components/admin/admin-console-shared.test.ts \
  src/components/admin/submission-review-panel.test.tsx
git commit -m "feat: clarify admin submission draft states"
```

## Task 2: Add The Admin Submission Detail Page

**Files:**
- Modify: `src/server/services/submission-draft-service.ts`
- Modify: `src/server/services/submission-service.ts`
- Create: `src/components/admin/submission-detail-view.tsx`
- Create: `src/components/admin/submission-detail-view.test.tsx`
- Create: `src/app/admin/submissions/[submissionId]/page.tsx`
- Create: `src/app/admin/submissions/[submissionId]/page.test.tsx`

- [ ] **Step 1: Write the failing detail-view test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SubmissionDetailView } from "@/components/admin/submission-detail-view";

const submission = {
  id: "submission_1",
  submissionType: "FREE_LAUNCH",
  reviewStatus: "DRAFT",
  preferredLaunchDate: null,
  paymentStatus: "NOT_REQUIRED",
  badgeFooterUrl: "https://acme.test",
  badgeVerification: "PENDING",
  founderVisibleNote: null,
  internalReviewNote: null,
  createdAt: "2026-04-17T00:00:00.000Z",
  updatedAt: "2026-04-17T01:00:00.000Z",
  user: { id: "user_1", name: "Founder", email: "founder@example.com" },
  tool: {
    id: "tool_1",
    slug: "acme",
    name: "Acme",
    tagline: "Ship faster",
    websiteUrl: "https://acme.test",
    richDescription: "A founder-facing description that is long enough to display.",
    pricingModel: "FREEMIUM",
    affiliateUrl: null,
    affiliateSource: null,
    hasAffiliateProgram: false,
    founderXUrl: "https://x.com/acme",
    founderGithubUrl: null,
    founderLinkedinUrl: null,
    founderFacebookUrl: null,
    logoMedia: { url: "https://cdn.test/logo.png" },
    media: [{ id: "media_1", type: "SCREENSHOT", url: "https://cdn.test/shot.png", sortOrder: 0 }],
    toolCategories: [{ categoryId: "cat_1", category: { id: "cat_1", name: "Analytics", slug: "analytics" } }],
    toolTags: [{ tagId: "tag_1", tag: { id: "tag_1", name: "AI", slug: "ai" } }],
    launches: [{ id: "launch_1", launchType: "FREE", status: "APPROVED", launchDate: "2026-05-08T00:00:00.000Z" }],
  },
};

describe("submission-detail-view", () => {
  it("renders saved draft fields and assigned launch date", () => {
    render(<SubmissionDetailView submission={submission as never} />);

    expect(screen.getByText("Acme")).toBeInTheDocument();
    expect(screen.getByText("Badge: Pending")).toBeInTheDocument();
    expect(screen.getByText(/Launch date/i)).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
    expect(screen.getByText("AI")).toBeInTheDocument();
    expect(screen.getByText("https://x.com/acme")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the detail-view test and confirm it fails**

Run: `npm test -- src/components/admin/submission-detail-view.test.tsx`

Expected: FAIL because the view component does not exist yet.

- [ ] **Step 3: Add the admin detail loader in the service layer**

```ts
export async function getAdminSubmissionDetail(submissionId: string) {
  const submission = await getSubmissionById(prisma, submissionId);

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  return submission;
}
```

```ts
export {
  createSubmission,
  getAdminSubmissionDetail,
  getFounderSubmissionDraft,
  listAdminSubmissionQueue,
  listFounderSubmissions,
  submitSubmissionDraft,
  verifyFreeLaunchBadge,
} from "@/server/services/submission-draft-service";
```

- [ ] **Step 4: Build the read-only detail view component**

```tsx
import { formatDate, getSubmissionBadgeLabel, getSubmissionLifecycle, StatusChip } from "@/components/admin/admin-console-shared";

export function SubmissionDetailView({
  submission,
}: {
  submission: Awaited<ReturnType<typeof getAdminSubmissionDetail>>;
}) {
  const lifecycle = getSubmissionLifecycle({
    ...submission,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    tool: {
      ...submission.tool,
      launches: submission.tool.launches.map((launch) => ({
        ...launch,
        launchDate: launch.launchDate.toISOString(),
      })),
    },
  });
  const latestLaunch = submission.tool.launches[0] ?? null;
  const screenshots = submission.tool.media.filter((media) => media.type === "SCREENSHOT");

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <div className="flex flex-wrap gap-2">
          <StatusChip label={lifecycle.label} tone={lifecycle.tone} />
          <StatusChip
            label={getSubmissionBadgeLabel({
              ...submission,
              createdAt: submission.createdAt.toISOString(),
              updatedAt: submission.updatedAt.toISOString(),
              preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
              tool: {
                ...submission.tool,
                launches: submission.tool.launches.map((launch) => ({
                  ...launch,
                  launchDate: launch.launchDate.toISOString(),
                })),
              },
            } as never)}
            tone="neutral"
          />
        </div>
        <h2 className="mt-4 text-3xl font-black tracking-tight">{submission.tool.name}</h2>
        <p className="mt-2 text-sm font-medium text-muted-foreground">{submission.tool.tagline}</p>
        <dl className="mt-6 grid gap-4 sm:grid-cols-2">
          <div><dt className="text-[10px] font-black tracking-widest text-muted-foreground">Founder</dt><dd>{submission.user.email}</dd></div>
          <div><dt className="text-[10px] font-black tracking-widest text-muted-foreground">Slug</dt><dd>{submission.tool.slug}</dd></div>
          <div><dt className="text-[10px] font-black tracking-widest text-muted-foreground">Created</dt><dd>{formatDate(submission.createdAt.toISOString())}</dd></div>
          <div><dt className="text-[10px] font-black tracking-widest text-muted-foreground">Last updated</dt><dd>{formatDate(submission.updatedAt.toISOString())}</dd></div>
          {latestLaunch ? (
            <div><dt className="text-[10px] font-black tracking-widest text-muted-foreground">Launch date</dt><dd>{formatDate(latestLaunch.launchDate.toISOString())}</dd></div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <h3 className="text-xl font-black">Saved submission data</h3>
        <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{submission.tool.richDescription}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {submission.tool.toolCategories.map((item) => (
            <span key={item.categoryId} className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] font-black tracking-widest">{item.category.name}</span>
          ))}
          {submission.tool.toolTags.map((item) => (
            <span key={item.tagId} className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] font-black tracking-widest">{item.tag.name}</span>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {screenshots.map((media) => (
            <img key={media.id} src={media.url} alt={`${submission.tool.name} screenshot`} className="h-40 w-full rounded-2xl border border-border object-cover" />
          ))}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 5: Add the server page and missing-submission test**

```tsx
import { notFound } from "next/navigation";

import { SubmissionDetailView } from "@/components/admin/submission-detail-view";
import { AppError } from "@/server/http/app-error";
import { getAdminSubmissionDetail } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export default async function AdminSubmissionDetailPage({
  params,
}: RouteContext) {
  const { submissionId } = await params;

  try {
    const submission = await getAdminSubmissionDetail(submissionId);
    return <SubmissionDetailView submission={submission} />;
  } catch (error) {
    if (error instanceof AppError && error.statusCode === 404) {
      notFound();
    }

    throw error;
  }
}
```

```tsx
import { describe, expect, it, vi } from "vitest";

const { getAdminSubmissionDetailMock, notFoundMock } = vi.hoisted(() => ({
  getAdminSubmissionDetailMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/server/services/submission-service", () => ({
  getAdminSubmissionDetail: getAdminSubmissionDetailMock,
}));

import { AppError } from "@/server/http/app-error";
import AdminSubmissionDetailPage from "@/app/admin/submissions/[submissionId]/page";

describe("admin submission detail page", () => {
  it("calls notFound for an unknown submission", async () => {
    getAdminSubmissionDetailMock.mockRejectedValueOnce(new AppError(404, "Submission not found."));

    await expect(
      AdminSubmissionDetailPage({
        params: Promise.resolve({ submissionId: "missing_submission" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 6: Run the new detail tests and confirm they pass**

Run: `npm test -- src/components/admin/submission-detail-view.test.tsx src/app/admin/submissions/[submissionId]/page.test.tsx`

Expected: PASS with the read-only UI rendering and the page converting a missing submission into `notFound()`.

- [ ] **Step 7: Commit the admin detail page changes**

```bash
git add src/server/services/submission-draft-service.ts \
  src/server/services/submission-service.ts \
  src/components/admin/submission-detail-view.tsx \
  src/components/admin/submission-detail-view.test.tsx \
  'src/app/admin/submissions/[submissionId]/page.tsx' \
  'src/app/admin/submissions/[submissionId]/page.test.tsx'
git commit -m "feat: add admin submission detail view"
```

## Task 3: Show Free-Launch Schedule State Correctly In Founder Dashboard

**Files:**
- Modify: `src/components/founder/founder-dashboard.tsx`
- Create: `src/components/founder/founder-dashboard.test.tsx`

- [ ] **Step 1: Write the failing founder dashboard test**

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FounderDashboard } from "@/components/founder/founder-dashboard";

describe("founder-dashboard", () => {
  it("shows Scheduled for approved free launches with a future launch slot", () => {
    render(
      <FounderDashboard
        initialSubmissions={[
          {
            id: "submission_1",
            submissionType: "FREE_LAUNCH",
            reviewStatus: "APPROVED",
            preferredLaunchDate: null,
            paymentStatus: "NOT_REQUIRED",
            badgeVerification: "VERIFIED",
            spotlightBrief: null,
            tool: {
              id: "tool_1",
              slug: "acme",
              name: "Acme",
              websiteUrl: "https://acme.test",
              logoMedia: null,
              launches: [
                {
                  id: "launch_1",
                  launchType: "FREE",
                  status: "APPROVED",
                  launchDate: "2099-05-08T00:00:00.000Z",
                },
              ],
            },
          },
        ]}
        initialTools={[]}
        initialClaims={[]}
        founderEmail="founder@example.com"
        founderRole="FOUNDER"
        initialActiveNav="submissions"
      />,
    );

    expect(screen.getByText("Scheduled")).toBeInTheDocument();
    expect(screen.getByText(/Launch date:/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the founder dashboard test and confirm it fails**

Run: `npm test -- src/components/founder/founder-dashboard.test.tsx`

Expected: FAIL because approved free launches currently resolve to the generic `Approved` label.

- [ ] **Step 3: Implement the founder state mapping update**

```ts
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

  if (currentLaunch?.status === "APPROVED") {
    return { label: "Scheduled", tone: "green" };
  }

  if (submission.reviewStatus === "APPROVED") {
    return { label: "Approved", tone: "green" };
  }

  return { label: "Pending review", tone: "amber" };
}
```

- [ ] **Step 4: Run the founder dashboard test and the existing approval-email service tests**

Run: `npm test -- src/components/founder/founder-dashboard.test.tsx src/server/services/submission-review-service.test.ts`

Expected: PASS, confirming the dashboard reads approved scheduled launches correctly and the approval email path still carries the launch date.

- [ ] **Step 5: Commit the founder scheduling state change**

```bash
git add src/components/founder/founder-dashboard.tsx \
  src/components/founder/founder-dashboard.test.tsx
git commit -m "feat: show scheduled free launches in founder dashboard"
```

## Task 4: Final Verification

**Files:**
- Modify: none
- Test: `src/components/admin/admin-console-shared.test.ts`
- Test: `src/components/admin/submission-review-panel.test.tsx`
- Test: `src/components/admin/submission-detail-view.test.tsx`
- Test: `src/app/admin/submissions/[submissionId]/page.test.tsx`
- Test: `src/components/founder/founder-dashboard.test.tsx`
- Test: `src/server/services/submission-review-service.test.ts`

- [ ] **Step 1: Run the targeted full verification suite**

Run:

```bash
npm test -- \
  src/components/admin/admin-console-shared.test.ts \
  src/components/admin/submission-review-panel.test.tsx \
  src/components/admin/submission-detail-view.test.tsx \
  'src/app/admin/submissions/[submissionId]/page.test.tsx' \
  src/components/founder/founder-dashboard.test.tsx \
  src/server/services/submission-review-service.test.ts
```

Expected: PASS for all targeted files.

- [ ] **Step 2: Run lint on the touched code paths**

Run:

```bash
npm run lint -- \
  src/components/admin/admin-console-shared.tsx \
  src/components/admin/submission-review-panel.tsx \
  src/components/admin/submission-detail-view.tsx \
  'src/app/admin/submissions/[submissionId]/page.tsx' \
  src/components/founder/founder-dashboard.tsx
```

Expected: PASS with no new lint errors in the touched files.

- [ ] **Step 3: Commit the final integrated pass**

```bash
git add src/components/admin/admin-console-shared.tsx \
  src/components/admin/submission-review-panel.tsx \
  src/components/admin/submission-detail-view.tsx \
  'src/app/admin/submissions/[submissionId]/page.tsx' \
  src/components/admin/admin-console-shared.test.ts \
  src/components/admin/submission-review-panel.test.tsx \
  src/components/admin/submission-detail-view.test.tsx \
  'src/app/admin/submissions/[submissionId]/page.test.tsx' \
  src/components/founder/founder-dashboard.tsx \
  src/components/founder/founder-dashboard.test.tsx \
  src/server/services/submission-draft-service.ts \
  src/server/services/submission-service.ts
git commit -m "feat: add admin draft visibility and launch schedule detail"
```

## Self-Review

Spec coverage check:

- Mixed `Moderate` list is covered in Task 1.
- Read-only admin detail page is covered in Task 2.
- Free-launch assigned date visibility and founder scheduled-state behavior are covered in Task 3.
- Existing approval email behavior is validated in Task 3 and preserved.

Placeholder scan:

- No `TODO`, `TBD`, or “similar to” references remain.
- Each test and implementation step includes concrete code and commands.

Type consistency:

- `Submission.updatedAt` is introduced in Task 1 and then used in Task 2.
- Admin detail UI uses the same `launches` relation shape already returned by `getSubmissionById`.
- Founder `Scheduled` logic relies on existing `launch.status === "APPROVED"` rather than inventing a new status.
