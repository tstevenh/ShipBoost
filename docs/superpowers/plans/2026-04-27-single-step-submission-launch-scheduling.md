# Single-Step Submission Launch Scheduling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the two-step submit flow with one shared submit/edit listing editor that schedules free and premium launches from sidebar modals.

**Architecture:** Keep the current Prisma launch model and public visibility guardrails. Add founder-facing scheduling endpoints for free launch schedule/unschedule and reuse the existing premium checkout/reschedule endpoints. Extract reusable submit-form UI pieces so `/submit` and listing edit can share the same editor layout, validation, and sidebar behavior.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Zod, Vitest, Testing Library, Dodo checkout, existing Cloudinary media flow.

---

## File Map

- Modify `src/server/services/submission-draft-service.ts`
  - Add founder free launch scheduling and unscheduling functions.
  - Return launch metadata in founder submission payloads.
- Modify `src/server/services/submission-draft-service.test.ts`
  - Test free scheduling, no auto-schedule on save, and unschedule.
- Modify `src/server/services/submission-service.ts`
  - Re-export new free scheduling functions.
- Create `src/app/api/submissions/[submissionId]/schedule-free/route.ts`
  - Founder endpoint for joining the free launch queue.
- Create `src/app/api/submissions/[submissionId]/unschedule-free/route.ts`
  - Founder endpoint for removing a future free launch.
- Modify `src/app/submit/page.tsx`
  - Pass launch metadata and next free estimate into the form.
- Modify `src/components/founder/submit-product-form.tsx`
  - Collapse to single-step editor.
  - Add schedule modal state machine.
  - Add scheduled sidebar states.
  - Keep existing badge verification UI as the free path second modal.
- Modify `src/components/founder/founder-tool-editor.tsx`
  - Wrap the existing edit listing fields with the same shared editor shell and sidebar components used by submit.
- Create `src/components/founder/launch-schedule-sidebar-card.tsx`
  - Focused sidebar card for unscheduled/free scheduled/premium scheduled states.
- Create `src/components/founder/launch-schedule-modal.tsx`
  - Focused modal for step 1 path choice, free badge step, and premium date picker step.
- Create component tests under `src/components/founder/`.
  - Cover modal transitions and sidebar states.
- Modify `src/server/services/public-tool-visibility.test.ts`.
  - Lock the rule that future scheduled launches stay hidden from all public surfaces.

## Task 1: Backend Free Launch Scheduling

**Files:**
- Modify: `src/server/services/submission-draft-service.ts`
- Modify: `src/server/services/submission-service.ts`
- Modify: `src/server/services/submission-draft-service.test.ts`
- Create: `src/app/api/submissions/[submissionId]/schedule-free/route.ts`
- Create: `src/app/api/submissions/[submissionId]/unschedule-free/route.ts`

- [ ] **Step 1: Write failing service tests for explicit scheduling**

Add tests to `src/server/services/submission-draft-service.test.ts` near the existing `submitSubmissionDraft` tests.

```ts
describe("scheduleFreeSubmissionLaunch", () => {
  it("creates a future free launch only after explicit scheduling", async () => {
    prismaMock.submission.findFirst.mockResolvedValue({
      id: "submission_1",
      userId: "user_1",
      toolId: "tool_1",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "DRAFT",
      preferredLaunchDate: null,
      paymentStatus: "NOT_REQUIRED",
      badgeVerification: "PENDING",
      tool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        websiteUrl: "https://acme.com",
        logoMedia: null,
        launches: [],
      },
      user: { id: "user_1", email: "founder@example.com", name: "Founder" },
    } as never);
    prismaMock.launch.count.mockResolvedValue(0);
    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        submission: {
          update: vi.fn().mockResolvedValue({}),
        },
        tool: {
          update: vi.fn().mockResolvedValue({}),
        },
        launch: {
          create: vi.fn().mockResolvedValue({
            id: "launch_1",
            launchType: "FREE",
            status: "APPROVED",
            launchDate: new Date("2026-05-04T00:00:00.000Z"),
            startAt: new Date("2026-05-04T00:00:00.000Z"),
          }),
        },
      } as never),
    );

    const result = await scheduleFreeSubmissionLaunch("submission_1", {
      id: "user_1",
    });

    expect(result.launch.launchType).toBe("FREE");
    expect(result.launch.launchDate.toISOString()).toBe("2026-05-04T00:00:00.000Z");
  });

  it("does not create a launch when saving a draft", async () => {
    prismaMock.tool.findMany.mockResolvedValueOnce([]);
    prismaMock.submission.upsert.mockResolvedValueOnce({
      id: "submission_1",
      submissionType: "FREE_LAUNCH",
      reviewStatus: "DRAFT",
      paymentStatus: "NOT_REQUIRED",
      badgeVerification: "PENDING",
    });

    await createSubmission(
      {
        submissionType: "FREE_LAUNCH",
        requestedSlug: "acme",
        preferredLaunchDate: undefined,
        name: "Acme",
        tagline: "Launch your SaaS faster with Acme.",
        websiteUrl: "https://acme.com",
        richDescription:
          "Acme helps founders launch products faster with a focused workflow that keeps teams aligned.",
        pricingModel: "FREEMIUM",
        categoryIds: ["cm1234567890123456789012"],
        tagIds: ["cm1234567890123456789013"],
        logo: { url: "https://example.com/logo.png" },
        screenshots: [],
        affiliateUrl: undefined,
        affiliateSource: undefined,
        hasAffiliateProgram: false,
        founderXUrl: undefined,
        founderGithubUrl: undefined,
        founderLinkedinUrl: undefined,
        founderFacebookUrl: undefined,
      },
      { id: "user_1" },
    );

    expect(prismaMock.launch.create).not.toHaveBeenCalled();
  });
});
```

Expected initial result: tests fail because `scheduleFreeSubmissionLaunch` does not exist.

- [ ] **Step 2: Add service functions**

In `src/server/services/submission-draft-service.ts`, import scheduling helpers if not already present:

```ts
import {
  scheduleNextFreeLaunchDate,
  UTC_WEEK_IN_DAYS,
} from "@/server/services/launch-scheduling";
import { addUtcDays } from "@/server/services/time";
```

Add this helper and exported function near `submitSubmissionDraft`:

```ts
function serializeFounderLaunch(launch: {
  id: string;
  launchType: "FREE" | "FEATURED" | "RELAUNCH";
  status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
  launchDate: Date;
}) {
  return {
    id: launch.id,
    launchType: launch.launchType,
    status: launch.status,
    launchDate: launch.launchDate,
  };
}

export async function scheduleFreeSubmissionLaunch(
  submissionId: string,
  founder: AuthenticatedFounder,
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  if (submission.submissionType === "FEATURED_LAUNCH") {
    throw new AppError(400, "Premium launches must use checkout.");
  }

  if (submission.paymentStatus === "PAID") {
    throw new AppError(400, "Paid launches cannot join the free queue.");
  }

  const existingFreeLaunch = submission.tool.launches.find(
    (launch) =>
      launch.launchType === "FREE" &&
      launch.status !== "REJECTED" &&
      launch.status !== "ENDED",
  );

  if (existingFreeLaunch) {
    return {
      submission,
      launch: serializeFounderLaunch(existingFreeLaunch),
    };
  }

  let createdLaunch: Awaited<ReturnType<typeof prisma.launch.create>>;

  await prisma.$transaction(async (tx) => {
    const launchDate = await scheduleNextFreeLaunchDate(tx);

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        submissionType: "FREE_LAUNCH",
        reviewStatus: "PENDING",
        paymentStatus: "NOT_REQUIRED",
        preferredLaunchDate: launchDate,
      },
    });

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        moderationStatus: "PENDING",
        publicationStatus: "UNPUBLISHED",
        currentLaunchType: "FREE",
      },
    });

    createdLaunch = await tx.launch.create({
      data: {
        toolId: submission.toolId,
        createdById: founder.id,
        launchType: "FREE",
        status: "APPROVED",
        launchDate,
        startAt: launchDate,
        endAt: addUtcDays(launchDate, UTC_WEEK_IN_DAYS),
        priorityWeight: 0,
      },
    });
  });

  return {
    submission: await getSubmissionByIdForFounder(prisma, submission.id, founder.id),
    launch: serializeFounderLaunch(createdLaunch!),
  };
}
```

Add unschedule:

```ts
export async function unscheduleFreeSubmissionLaunch(
  submissionId: string,
  founder: AuthenticatedFounder,
) {
  const submission = await getSubmissionByIdForFounder(
    prisma,
    submissionId,
    founder.id,
  );

  if (!submission) {
    throw new AppError(404, "Submission not found.");
  }

  const freeLaunch = submission.tool.launches.find(
    (launch) =>
      launch.launchType === "FREE" &&
      launch.status === "APPROVED" &&
      launch.launchDate > new Date(),
  );

  if (!freeLaunch) {
    throw new AppError(400, "This free launch is not scheduled.");
  }

  await prisma.$transaction(async (tx) => {
    await tx.launch.delete({
      where: { id: freeLaunch.id },
    });

    await tx.submission.update({
      where: { id: submission.id },
      data: {
        reviewStatus: "DRAFT",
        preferredLaunchDate: null,
      },
    });

    await tx.tool.update({
      where: { id: submission.toolId },
      data: {
        currentLaunchType: null,
      },
    });
  });

  return getSubmissionByIdForFounder(prisma, submission.id, founder.id);
}
```

In `src/server/services/submission-service.ts`, add the new exports:

```ts
export {
  scheduleFreeSubmissionLaunch,
  unscheduleFreeSubmissionLaunch,
} from "@/server/services/submission-draft-service";
```

- [ ] **Step 3: Create API routes**

Create `src/app/api/submissions/[submissionId]/schedule-free/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { scheduleFreeSubmissionLaunch } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const result = await scheduleFreeSubmissionLaunch(submissionId, {
      id: session.user.id,
    });
    revalidateAllPublicContent();

    return ok({
      submission: result.submission,
      launch: {
        ...result.launch,
        launchDate: result.launch.launchDate.toISOString(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
}
```

Create `src/app/api/submissions/[submissionId]/unschedule-free/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { unscheduleFreeSubmissionLaunch } from "@/server/services/submission-service";

type RouteContext = {
  params: Promise<{ submissionId: string }>;
};

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const submission = await unscheduleFreeSubmissionLaunch(submissionId, {
      id: session.user.id,
    });
    revalidateAllPublicContent();

    return ok(submission);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 4: Run backend tests**

Run:

```bash
npm test -- src/server/services/submission-draft-service.test.ts src/server/services/public-tool-visibility.test.ts
```

Expected: service tests pass; public visibility tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/submission-draft-service.ts src/server/services/submission-service.ts src/server/services/submission-draft-service.test.ts src/app/api/submissions/[submissionId]/schedule-free/route.ts src/app/api/submissions/[submissionId]/unschedule-free/route.ts
git commit -m "feat: schedule free launches from founder flow"
```

## Task 2: Pass Launch State Into Submit Form

**Files:**
- Modify: `src/app/submit/page.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`

- [ ] **Step 1: Extend form input types**

In `src/components/founder/submit-product-form.tsx`, add:

```ts
type FounderLaunch = {
  id: string;
  launchType: "FREE" | "FEATURED" | "RELAUNCH";
  status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
  launchDate: string;
};
```

Add to `initialDraft.tool`:

```ts
launches: FounderLaunch[];
```

Add to `SubmitProductFormProps`:

```ts
nextFreeLaunchEstimate?: {
  launchDate: string;
  daysUntilLaunch: number;
} | null;
```

- [ ] **Step 2: Pass launches from server page**

In `src/app/submit/page.tsx`, extend `initialDraft.tool`:

```ts
launches: submission.tool.launches.map((launch) => ({
  id: launch.id,
  launchType: launch.launchType,
  status: launch.status,
  launchDate: launch.launchDate.toISOString(),
})),
```

Compute free estimate after catalog options:

```ts
const estimatedFreeLaunchDate = await scheduleNextFreeLaunchDate(undefined, {
  weeklySlots: env.FREE_LAUNCH_SLOTS_PER_WEEK,
});
const daysUntilLaunch = Math.max(
  0,
  Math.ceil(
    (estimatedFreeLaunchDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000),
  ),
);
```

Pass into component:

```tsx
nextFreeLaunchEstimate={{
  launchDate: estimatedFreeLaunchDate.toISOString(),
  daysUntilLaunch,
}}
```

- [ ] **Step 3: Verify typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: no new type errors from submit page or form props.

- [ ] **Step 4: Commit**

```bash
git add src/app/submit/page.tsx src/components/founder/submit-product-form.tsx
git commit -m "feat: pass launch schedule state to submit editor"
```

## Task 3: Extract Sidebar Card Component

**Files:**
- Create: `src/components/founder/launch-schedule-sidebar-card.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`
- Test: `src/components/founder/launch-schedule-sidebar-card.test.tsx`

- [ ] **Step 1: Write component tests**

Create `src/components/founder/launch-schedule-sidebar-card.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LaunchScheduleSidebarCard } from "./launch-schedule-sidebar-card";

describe("LaunchScheduleSidebarCard", () => {
  it("shows scheduling CTA when there is no launch", async () => {
    const onSchedule = vi.fn();
    render(
      <LaunchScheduleSidebarCard
        launch={null}
        isComplete
        onSchedule={onSchedule}
        onSkipLine={vi.fn()}
        onUnscheduleFree={vi.fn()}
        onChangePremiumDate={vi.fn()}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /schedule your launch/i }));

    expect(onSchedule).toHaveBeenCalledOnce();
  });

  it("shows free scheduled actions", () => {
    render(
      <LaunchScheduleSidebarCard
        launch={{
          id: "launch_1",
          launchType: "FREE",
          status: "APPROVED",
          launchDate: "2026-08-18T00:00:00.000Z",
        }}
        isComplete
        onSchedule={vi.fn()}
        onSkipLine={vi.fn()}
        onUnscheduleFree={vi.fn()}
        onChangePremiumDate={vi.fn()}
      />,
    );

    expect(screen.getByText(/Your product is scheduled to launch on/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip the waiting line/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /unschedule your launch/i })).toBeInTheDocument();
  });

  it("does not show unschedule for premium launch", () => {
    render(
      <LaunchScheduleSidebarCard
        launch={{
          id: "launch_1",
          launchType: "FEATURED",
          status: "APPROVED",
          launchDate: "2026-05-04T00:00:00.000Z",
        }}
        isComplete
        onSchedule={vi.fn()}
        onSkipLine={vi.fn()}
        onUnscheduleFree={vi.fn()}
        onChangePremiumDate={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: /change launch date/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /unschedule/i })).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement component**

Create `src/components/founder/launch-schedule-sidebar-card.tsx`:

```tsx
"use client";

import { CalendarDays, PartyPopper } from "lucide-react";

import { cn } from "@/lib/utils";

export type FounderLaunch = {
  id: string;
  launchType: "FREE" | "FEATURED" | "RELAUNCH";
  status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
  launchDate: string;
};

function formatLaunchDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function LaunchScheduleSidebarCard({
  launch,
  isComplete,
  onSchedule,
  onSkipLine,
  onUnscheduleFree,
  onChangePremiumDate,
}: {
  launch: FounderLaunch | null;
  isComplete: boolean;
  onSchedule: () => void;
  onSkipLine: () => void;
  onUnscheduleFree: () => void;
  onChangePremiumDate: () => void;
}) {
  if (!launch) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <CalendarDays size={16} className="text-primary" />
          <h3 className="text-base font-black text-foreground">Schedule your launch</h3>
        </div>
        <p className="mb-5 text-sm font-medium leading-relaxed text-muted-foreground">
          When you are ready, choose your launch path and schedule your launch.
        </p>
        <button
          type="button"
          onClick={onSchedule}
          disabled={!isComplete}
          className={cn(
            "w-full rounded-xl px-4 py-3 text-sm font-black transition",
            isComplete
              ? "bg-primary text-primary-foreground hover:opacity-90"
              : "cursor-not-allowed border border-border bg-muted text-muted-foreground",
          )}
        >
          Schedule your launch
        </button>
      </div>
    );
  }

  const isPremium = launch.launchType === "FEATURED";

  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-3 flex items-center gap-2">
        <PartyPopper size={16} className="text-primary" />
        <h3 className="text-base font-black text-foreground">Launch Scheduled</h3>
      </div>
      <p className="mb-5 text-sm font-medium leading-relaxed text-muted-foreground">
        {isPremium
          ? `You skipped the waiting line. Your product is scheduled to launch on ${formatLaunchDate(launch.launchDate)}.`
          : `Your product is scheduled to launch on ${formatLaunchDate(launch.launchDate)}.`}
      </p>
      {isPremium ? (
        <button
          type="button"
          onClick={onChangePremiumDate}
          className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
        >
          Change launch date
        </button>
      ) : (
        <div className="space-y-3">
          <button
            type="button"
            onClick={onSkipLine}
            className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90"
          >
            Skip the waiting line
          </button>
          <button
            type="button"
            onClick={onUnscheduleFree}
            className="w-full rounded-xl border border-destructive/50 px-4 py-3 text-sm font-black text-destructive transition hover:bg-destructive/10"
          >
            Unschedule your launch
          </button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run component test**

Run:

```bash
npm test -- src/components/founder/launch-schedule-sidebar-card.test.tsx
```

Expected: tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/founder/launch-schedule-sidebar-card.tsx src/components/founder/launch-schedule-sidebar-card.test.tsx
git commit -m "feat: add launch scheduling sidebar card"
```

## Task 4: Extract Schedule Modal Component

**Files:**
- Create: `src/components/founder/launch-schedule-modal.tsx`
- Test: `src/components/founder/launch-schedule-modal.test.tsx`

- [ ] **Step 1: Write modal tests**

Create `src/components/founder/launch-schedule-modal.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { LaunchScheduleModal } from "./launch-schedule-modal";

describe("LaunchScheduleModal", () => {
  it("moves from launch path choice to free badge prompt", async () => {
    render(
      <LaunchScheduleModal
        open
        mode="choose"
        freeEstimate={{ launchDate: "2026-08-18T00:00:00.000Z", daysUntilLaunch: 112 }}
        premiumLaunchWeeks={[{ value: "2026-05-04", label: "Week of May 4, 2026" }]}
        selectedPremiumDate=""
        onModeChange={vi.fn()}
        onClose={vi.fn()}
        onJoinFree={vi.fn()}
        onContinueFreeWithoutBadge={vi.fn()}
        onCopyBadge={vi.fn()}
        onVerifyBadge={vi.fn()}
        onSelectedPremiumDateChange={vi.fn()}
        onStartPremiumCheckout={vi.fn()}
        isBusy={false}
      />,
    );

    expect(screen.getByText(/Join the waiting line/i)).toBeInTheDocument();
    expect(screen.getByText(/Estimated launch: in ~112 days/i)).toBeInTheDocument();
  });

  it("shows premium founding price and benefits", () => {
    render(
      <LaunchScheduleModal
        open
        mode="choose"
        freeEstimate={null}
        premiumLaunchWeeks={[{ value: "2026-05-04", label: "Week of May 4, 2026" }]}
        selectedPremiumDate=""
        onModeChange={vi.fn()}
        onClose={vi.fn()}
        onJoinFree={vi.fn()}
        onContinueFreeWithoutBadge={vi.fn()}
        onCopyBadge={vi.fn()}
        onVerifyBadge={vi.fn()}
        onSelectedPremiumDateChange={vi.fn()}
        onStartPremiumCheckout={vi.fn()}
        isBusy={false}
      />,
    );

    expect(screen.getByText("$19")).toBeInTheDocument();
    expect(screen.getByText("$9")).toBeInTheDocument();
    expect(screen.getByText(/Reserve a specific launch week/i)).toBeInTheDocument();
    expect(screen.getByText(/stronger baseline board placement/i)).toBeInTheDocument();
    expect(screen.getByText(/editorial launch spotlight/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement modal**

Create `src/components/founder/launch-schedule-modal.tsx` with three modes: `"choose"`, `"free-badge"`, `"premium-date"`.

```tsx
"use client";

import { CalendarDays, Check, ShieldCheck, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type LaunchScheduleModalMode = "choose" | "free-badge" | "premium-date";

export function LaunchScheduleModal({
  open,
  mode,
  freeEstimate,
  premiumLaunchWeeks,
  selectedPremiumDate,
  onModeChange,
  onClose,
  onJoinFree,
  onContinueFreeWithoutBadge,
  onCopyBadge,
  onVerifyBadge,
  onSelectedPremiumDateChange,
  onStartPremiumCheckout,
  isBusy,
}: {
  open: boolean;
  mode: LaunchScheduleModalMode;
  freeEstimate: { launchDate: string; daysUntilLaunch: number } | null;
  premiumLaunchWeeks: Array<{ value: string; label: string }>;
  selectedPremiumDate: string;
  onModeChange: (mode: LaunchScheduleModalMode) => void;
  onClose: () => void;
  onJoinFree: () => void;
  onContinueFreeWithoutBadge: () => void;
  onCopyBadge: () => void;
  onVerifyBadge: () => void;
  onSelectedPremiumDateChange: (date: string) => void;
  onStartPremiumCheckout: () => void;
  isBusy: boolean;
}) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-2xl border border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="text-lg font-black text-foreground">
            {mode === "premium-date"
              ? "Skip the line and launch your product"
              : mode === "free-badge"
                ? "Get approved faster"
                : "Schedule your launch"}
          </h2>
          <button type="button" onClick={onClose} aria-label="Close schedule modal">
            <X size={18} />
          </button>
        </div>

        {mode === "choose" ? (
          <div className="grid gap-4 p-6">
            <button
              type="button"
              onClick={onJoinFree}
              className="rounded-2xl border border-border bg-card p-5 text-left transition hover:border-primary"
            >
              <h3 className="font-black text-foreground">Join the waiting line (Free)</h3>
              <p className="mt-2 text-sm font-medium text-muted-foreground">
                Get an automatic launch week and be part of the free launch queue.
              </p>
              <p className="mt-3 text-sm font-black text-primary">
                {freeEstimate
                  ? `Estimated launch: in ~${freeEstimate.daysUntilLaunch} days`
                  : "Estimated launch date calculated after saving."}
              </p>
            </button>

            <button
              type="button"
              onClick={() => onModeChange("premium-date")}
              className="rounded-2xl border border-primary/40 bg-primary/5 p-5 text-left transition hover:border-primary"
            >
              <div className="flex items-end gap-2">
                <span className="text-sm font-black text-muted-foreground line-through">$19</span>
                <span className="text-3xl font-black text-foreground">$9</span>
              </div>
              <p className="mt-1 text-xs font-black text-primary">
                Founding price for the first 100 premium launches
              </p>
              <ul className="mt-4 space-y-2 text-sm font-bold text-foreground/80">
                {[
                  "Reserve a specific launch week",
                  "Get stronger baseline board placement",
                  "Includes one editorial launch spotlight during launch period",
                ].map((benefit) => (
                  <li key={benefit} className="flex gap-2">
                    <Check size={15} className="mt-0.5 text-primary" />
                    {benefit}
                  </li>
                ))}
              </ul>
              <p className="mt-4 font-black text-primary">Skip the waiting line ($9)</p>
            </button>
          </div>
        ) : null}

        {mode === "free-badge" ? (
          <div className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <ShieldCheck size={18} className="text-primary" />
              <h3 className="font-black text-foreground">Get reviewed within 24-48 hours</h3>
            </div>
            <p className="text-sm font-medium leading-relaxed text-muted-foreground">
              Add a small ShipBoost badge to your homepage or footer to unlock priority review.
              It helps visitors see where you launched, adds a simple trust signal to your site,
              and helps more founders discover ShipBoost.
            </p>
            <p className="mt-3 text-sm font-medium leading-relaxed text-muted-foreground">
              Your badge is optional. You can still submit without it, but standard free launches
              are reviewed after priority submissions.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onCopyBadge}
                className="rounded-xl border border-border px-4 py-3 text-sm font-black"
              >
                Add badge for faster approval
              </button>
              <button
                type="button"
                onClick={onContinueFreeWithoutBadge}
                disabled={isBusy}
                className="rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground disabled:opacity-50"
              >
                Continue without badge
              </button>
            </div>
            <button
              type="button"
              onClick={onVerifyBadge}
              className="mt-3 text-xs font-black text-primary"
            >
              I added it, verify now
            </button>
          </div>
        ) : null}

        {mode === "premium-date" ? (
          <div className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <CalendarDays size={18} className="text-primary" />
              <h3 className="font-black text-foreground">Choose your launch week</h3>
            </div>
            <select
              value={selectedPremiumDate}
              onChange={(event) => onSelectedPremiumDateChange(event.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none"
            >
              <option value="">Select a launch week</option>
              {premiumLaunchWeeks.map((week) => (
                <option key={week.value} value={week.value}>
                  {week.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onStartPremiumCheckout}
              disabled={!selectedPremiumDate || isBusy}
              className={cn(
                "mt-6 w-full rounded-xl px-4 py-3 text-sm font-black transition",
                selectedPremiumDate
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "cursor-not-allowed bg-muted text-muted-foreground",
              )}
            >
              {selectedPremiumDate ? `Launch on ${selectedPremiumDate} ($9)` : "Choose a launch date"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Run modal tests**

Run:

```bash
npm test -- src/components/founder/launch-schedule-modal.test.tsx
```

Expected: tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/founder/launch-schedule-modal.tsx src/components/founder/launch-schedule-modal.test.tsx
git commit -m "feat: add launch scheduling modal"
```

## Task 5: Collapse Submit Form to One-Step Editor

**Files:**
- Modify: `src/components/founder/submit-product-form.tsx`
- Test: `src/components/founder/submit-product-form.test.tsx`

- [ ] **Step 1: Write UI behavior tests**

Create or extend `src/components/founder/submit-product-form.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { SubmitProductForm } from "./submit-product-form";

const categories = [{ id: "cat_1", name: "Marketing", slug: "marketing", description: null }];
const tags = [{ id: "tag_1", name: "SEO", slug: "seo", description: null }];

describe("SubmitProductForm launch scheduling", () => {
  it("renders the editor without a separate choose-plan step", () => {
    render(
      <SubmitProductForm
        categories={categories}
        tags={tags}
        supportEmail="support@shipboost.io"
        premiumLaunchWeeks={[{ value: "2026-05-04", label: "Week of May 4, 2026" }]}
        nextFreeLaunchEstimate={{ launchDate: "2026-08-18T00:00:00.000Z", daysUntilLaunch: 112 }}
      />,
    );

    expect(screen.getByText(/Schedule your launch/i)).toBeInTheDocument();
    expect(screen.queryByText(/Choose your launch path/i)).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Remove step state and old plan page**

In `src/components/founder/submit-product-form.tsx`:

- Remove `const [step, setStep] = useState<1 | 2>(...)`.
- Remove the multi-step header.
- Remove the entire old `step === 2` choose plan JSX.
- Change the main branch to always render the editor grid.
- Rename `handleProceedToPlan` to `handleSaveDraft`.

Replacement handler:

```ts
async function handleSaveDraft() {
  setErrorMessage(null);
  setSuccessMessage(null);

  try {
    await saveDraft();
    setSuccessMessage("Product saved.");
  } catch (error) {
    setErrorMessage(getErrorMessage(error, "Unable to save your product."));
  }
}
```

- [ ] **Step 3: Add schedule state and handlers**

Add state:

```ts
const [scheduleModalMode, setScheduleModalMode] =
  useState<LaunchScheduleModalMode>("choose");
const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
const [currentLaunch, setCurrentLaunch] = useState<FounderLaunch | null>(
  initialDraft?.tool.launches.find((launch) =>
    ["APPROVED", "LIVE"].includes(launch.status),
  ) ?? null,
);
```

Add open schedule handler:

```ts
function openScheduleModal() {
  if (incompleteChecklistItems.length > 0) {
    setErrorMessage(`Please complete: ${incompleteChecklistItems.join(", ")}.`);
    return;
  }

  setScheduleModalMode("choose");
  setIsScheduleModalOpen(true);
}
```

Add free path handlers:

```ts
async function handleJoinFreeQueue() {
  const savedDraft = await saveDraft({
    submissionType: "FREE_LAUNCH",
    preferredLaunchDate: "",
  });
  setBadgePromptSubmissionId(savedDraft.id);
  setDraftSubmissionId(savedDraft.id);
  setScheduleModalMode("free-badge");
}

async function handleScheduleFreeWithoutBadge() {
  if (!draftSubmissionId && !badgePromptSubmissionId) {
    throw new Error("Save your product before scheduling.");
  }

  setIsSubmittingDraft(true);

  try {
    const submissionId = badgePromptSubmissionId ?? draftSubmissionId;
    const response = await fetch(`/api/submissions/${submissionId}/schedule-free`, {
      method: "POST",
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to schedule your launch.");
    }

    setCurrentLaunch(payload.data.launch);
    setIsScheduleModalOpen(false);
    setSuccessMessage(`Launch scheduled for ${payload.data.launch.launchDate.slice(0, 10)}.`);
  } finally {
    setIsSubmittingDraft(false);
  }
}
```

Add premium path handler:

```ts
async function handleStartPremiumCheckout() {
  if (!form.preferredLaunchDate) {
    throw new Error("Please choose your preferred launch week first.");
  }

  const savedDraft = await saveDraft({
    submissionType: "FEATURED_LAUNCH",
    preferredLaunchDate: form.preferredLaunchDate,
  });
  const response = await fetch("/api/dodo/checkout/premium-launch", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ submissionId: savedDraft.id }),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error || "Unable to start checkout.");
  }

  captureBrowserPostHogEvent("premium_launch_checkout_started", {
    submission_id: savedDraft.id,
    source_surface: "submit_product_form",
  });
  window.location.href = payload.data.checkoutUrl;
}
```

- [ ] **Step 4: Wire extracted components**

Import:

```ts
import {
  LaunchScheduleModal,
  type LaunchScheduleModalMode,
} from "@/components/founder/launch-schedule-modal";
import {
  LaunchScheduleSidebarCard,
  type FounderLaunch,
} from "@/components/founder/launch-schedule-sidebar-card";
```

Use in sidebar:

```tsx
<LaunchScheduleSidebarCard
  launch={currentLaunch}
  isComplete={incompleteChecklistItems.length === 0}
  onSchedule={openScheduleModal}
  onSkipLine={() => {
    setScheduleModalMode("premium-date");
    setIsScheduleModalOpen(true);
  }}
  onUnscheduleFree={() => void handleUnscheduleFreeLaunch()}
  onChangePremiumDate={() => {
    setScheduleModalMode("premium-date");
    setIsScheduleModalOpen(true);
  }}
/>
```

Use near root:

```tsx
<LaunchScheduleModal
  open={isScheduleModalOpen}
  mode={scheduleModalMode}
  freeEstimate={nextFreeLaunchEstimate ?? null}
  premiumLaunchWeeks={premiumLaunchWeeks}
  selectedPremiumDate={form.preferredLaunchDate}
  onModeChange={setScheduleModalMode}
  onClose={() => setIsScheduleModalOpen(false)}
  onJoinFree={() => void handleJoinFreeQueue()}
  onContinueFreeWithoutBadge={() => void handleScheduleFreeWithoutBadge()}
  onCopyBadge={() => void handleCopyBadgeSnippet()}
  onVerifyBadge={() => void handleVerifyBadge()}
  onSelectedPremiumDateChange={(date) =>
    setForm((current) => ({
      ...current,
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: date,
    }))
  }
  onStartPremiumCheckout={() => void handleStartPremiumCheckout()}
  isBusy={isBusy}
/>
```

- [ ] **Step 5: Run focused tests and lint**

Run:

```bash
npm test -- src/components/founder/submit-product-form.test.tsx src/components/founder/launch-schedule-sidebar-card.test.tsx src/components/founder/launch-schedule-modal.test.tsx
npx eslint src/components/founder/submit-product-form.tsx src/components/founder/launch-schedule-sidebar-card.tsx src/components/founder/launch-schedule-modal.tsx
```

Expected: tests pass and eslint reports no errors for these files.

- [ ] **Step 6: Commit**

```bash
git add src/components/founder/submit-product-form.tsx src/components/founder/submit-product-form.test.tsx
git commit -m "feat: make submit flow single-step"
```

## Task 6: Reuse Editor UX for Edit Listing

**Files:**
- Modify: `src/components/founder/founder-tool-editor.tsx`
- Create: `src/components/founder/product-listing-editor-shell.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`

- [ ] **Step 1: Extract editor shell**

Create `src/components/founder/product-listing-editor-shell.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";

export function ProductListingEditorShell({
  sidebar,
  children,
}: {
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        {sidebar}
      </aside>
      <section className="min-w-0">
        {children}
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Use shell in submit form**

Replace the existing submit form grid with:

```tsx
<ProductListingEditorShell sidebar={sidebarContent}>
  {editorContent}
</ProductListingEditorShell>
```

Keep `sidebarContent` and `editorContent` defined as local JSX constants in `SubmitProductForm` to avoid moving all form logic at once.

- [ ] **Step 3: Use same shell in founder tool editor**

In `src/components/founder/founder-tool-editor.tsx`, wrap existing edit form content with `ProductListingEditorShell` and use the same sidebar card components:

```tsx
<ProductListingEditorShell sidebar={sidebarContent}>
  {editorContent}
</ProductListingEditorShell>
```

For existing published listings, pass `launch={latestLaunch ?? null}` to `LaunchScheduleSidebarCard`.

- [ ] **Step 4: Run focused checks**

Run:

```bash
npx eslint src/components/founder/founder-tool-editor.tsx src/components/founder/product-listing-editor-shell.tsx src/components/founder/submit-product-form.tsx
npm test -- src/components/founder/founder-dashboard.test.tsx
```

Expected: lint passes for touched files; founder dashboard tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/founder/founder-tool-editor.tsx src/components/founder/product-listing-editor-shell.tsx src/components/founder/submit-product-form.tsx
git commit -m "feat: align listing editor with submit flow"
```

## Task 7: Preserve Public Visibility Invariants

**Files:**
- Modify: `src/server/services/public-tool-visibility.test.ts`
- Modify: `src/server/services/public-tool-visibility.ts` only when the new regression tests expose a mismatch with the approved visibility invariant.

- [ ] **Step 1: Add regression tests**

Add:

```ts
it("hides published approved tools with only future approved launches", () => {
  const visible = isToolPubliclyVisible(
    {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
      launches: [
        {
          status: "APPROVED",
          launchDate: new Date("2026-08-18T00:00:00.000Z"),
        },
      ],
    },
    new Date("2026-05-01T00:00:00.000Z"),
  );

  expect(visible).toBe(false);
});

it("shows published approved tools once approved launch date arrives", () => {
  const visible = isToolPubliclyVisible(
    {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
      launches: [
        {
          status: "APPROVED",
          launchDate: new Date("2026-05-01T00:00:00.000Z"),
        },
      ],
    },
    new Date("2026-05-01T00:00:01.000Z"),
  );

  expect(visible).toBe(true);
});
```

- [ ] **Step 2: Run tests**

Run:

```bash
npm test -- src/server/services/public-tool-visibility.test.ts src/server/services/launch-service.test.ts
```

Expected: tests pass without changing visibility logic. If tests fail, fix `getPubliclyVisibleToolWhere` and `isToolPubliclyVisible` to match the design invariant.

- [ ] **Step 3: Commit**

```bash
git add src/server/services/public-tool-visibility.test.ts src/server/services/public-tool-visibility.ts
git commit -m "test: lock scheduled launch visibility"
```

## Task 8: End-to-End Verification

**Files:**
- No new files unless a bug is found during verification.

- [ ] **Step 1: Typecheck**

Run:

```bash
npx tsc --noEmit
```

Expected: exits 0.

- [ ] **Step 2: Lint touched files**

Run:

```bash
npx eslint src/app/submit/page.tsx src/app/api/submissions/[submissionId]/schedule-free/route.ts src/app/api/submissions/[submissionId]/unschedule-free/route.ts src/components/founder/submit-product-form.tsx src/components/founder/launch-schedule-sidebar-card.tsx src/components/founder/launch-schedule-modal.tsx src/components/founder/product-listing-editor-shell.tsx src/components/founder/founder-tool-editor.tsx src/server/services/submission-draft-service.ts src/server/services/public-tool-visibility.ts
```

Expected: exits 0.

- [ ] **Step 3: Run focused tests**

Run:

```bash
npm test -- src/server/services/submission-draft-service.test.ts src/server/services/public-tool-visibility.test.ts src/server/services/launch-service.test.ts src/components/founder/launch-schedule-sidebar-card.test.tsx src/components/founder/launch-schedule-modal.test.tsx src/components/founder/submit-product-form.test.tsx
```

Expected: exits 0.

- [ ] **Step 4: Browser smoke test**

Start the dev server:

```bash
npm run dev
```

Manual check:

- Visit `/submit`.
- Fill required fields.
- Confirm checklist hides.
- Click `Schedule your launch`.
- Confirm first modal shows free and premium choices.
- Click free path and continue without badge.
- Confirm modal closes and sidebar shows scheduled free launch.
- Confirm free scheduled sidebar has `Skip the waiting line` and `Unschedule your launch`.
- Start premium path from sidebar.
- Confirm date selector appears before checkout.
- For a paid premium fixture, confirm sidebar shows only `Change launch date`.

- [ ] **Step 5: Final commit if verification fixes were needed**

```bash
git status --short
git add src/app/submit/page.tsx src/components/founder src/server/services src/app/api/submissions
git commit -m "fix: polish single-step launch scheduling"
```
