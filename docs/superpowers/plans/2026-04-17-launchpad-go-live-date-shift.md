# Launchpad Go-Live Date Shift Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the launchpad anchor from Friday, May 1, 2026 UTC to Monday, May 4, 2026 UTC, move the existing scheduled free launch to May 4, and update visible product copy and tests to match.

**Architecture:** Keep the current scheduling logic intact and only change the fallback go-live date plus the exact strings and fixtures that depend on it. Handle the existing May 1 launch record with a narrowly scoped Prisma maintenance script that defaults to dry-run and only mutates data when explicitly confirmed.

**Tech Stack:** Next.js 16, React 19, TypeScript, Vitest, Prisma, Node.js scripts

---

## File Structure

- Modify: `src/server/env.ts`
  - Change the code fallback for `LAUNCHPAD_GO_LIVE_AT` to `2026-05-04T00:00:00Z`.
- Modify: `src/server/services/submission-payment-service.ts`
  - Update hardcoded validation copy from May 1 to May 4.
- Modify: `src/server/services/launch-scheduling.test.ts`
  - Shift the anchor and expected week fixtures from May 1 to May 4.
- Modify: `src/server/services/submission-payment-service.test.ts`
  - Shift the mocked go-live floor and validation message assertions to May 4.
- Modify: `src/server/services/submission-review-service.test.ts`
  - Shift the free-launch scheduling fixture from May 1 to May 4.
- Modify: `src/server/services/launch-service.test.ts`
  - Update ranked launch fixtures so the “first launch week” is May 4 instead of May 1.
- Modify: `src/server/services/public-tool-visibility.test.ts`
  - Update “future scheduled launch” reference dates so they remain correct relative to the new first week.
- Create: `scripts/shift-launchpad-go-live-to-may-4.mjs`
  - Add a dry-run-first Prisma script that finds free launches scheduled for `2026-05-01T00:00:00Z` and moves them to `2026-05-04T00:00:00Z` when `--confirm` is passed.
- Modify: `package.json`
  - Add a script entry to run the one-time launch shift through `scripts/run-with-env.mjs`.
- Modify: `src/components/founder/submit-product-form.tsx`
  - Replace visible May 1 launch-copy references with May 4.
- Modify: `src/components/public/prelaunch-surface.tsx`
  - Replace visible May 1 opening copy with May 4.
- Modify: `src/app/pricing/page.tsx`
  - Replace visible May 1 pricing/prelaunch copy with May 4.
- Modify: `src/app/submit/page.tsx`
  - Replace visible May 1 submit-page copy with May 4.
- Modify: `src/app/dashboard/page.tsx`
  - Replace visible May 1 dashboard banner copy with May 4.
- Modify: `docs/deploy-digitalocean-app-platform.md`
  - Update the documented env example so it does not advertise the old May 1 date.

## Task 1: Shift the Scheduling Fallback and Date-Bound Backend Tests

**Files:**
- Modify: `src/server/env.ts`
- Modify: `src/server/services/submission-payment-service.ts`
- Test: `src/server/services/launch-scheduling.test.ts`
- Test: `src/server/services/submission-payment-service.test.ts`
- Test: `src/server/services/submission-review-service.test.ts`
- Test: `src/server/services/launch-service.test.ts`
- Test: `src/server/services/public-tool-visibility.test.ts`

- [ ] **Step 1: Update the failing tests to use the Monday anchor**

```ts
// src/server/services/launch-scheduling.test.ts
const result = await scheduleNextFreeLaunchDate(db as never, {
  weeklySlots: 10,
  fromDate: new Date("2026-04-14T12:00:00.000Z"),
  goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
});

expect(result.toISOString()).toBe("2026-05-04T00:00:00.000Z");
```

```ts
// src/server/services/launch-scheduling.test.ts
const result = listSelectableLaunchWeeks({
  count: 2,
  fromDate: new Date("2026-05-06T12:00:00.000Z"),
  goLiveAt: new Date("2026-05-04T00:00:00.000Z"),
});

expect(result.map((date) => date.toISOString())).toEqual([
  "2026-05-11T00:00:00.000Z",
  "2026-05-18T00:00:00.000Z",
]);
```

```ts
// src/server/services/submission-payment-service.test.ts
vi.mock("@/server/services/launch-scheduling", () => ({
  getLaunchpadGoLiveAtUtc: () => new Date("2026-05-04T00:00:00.000Z"),
  isAnchoredLaunchWeekStart: (date: Date, options?: { goLiveAt?: Date }) => {
    const launchpadGoLiveAt =
      options?.goLiveAt ?? new Date("2026-05-04T00:00:00.000Z");
    // keep the existing modulo logic unchanged
  },
}));

await expect(
  createPremiumLaunchCheckout("submission_1", founder),
).rejects.toThrow("Choose May 4, 2026 UTC or later.");
```

```ts
// src/server/services/submission-review-service.test.ts
scheduleNextFreeLaunchDateMock.mockResolvedValueOnce(
  new Date("2026-05-04T00:00:00.000Z"),
);
prismaMock.launch.create.mockResolvedValue({
  id: "launch_free_1",
  launchType: "FREE",
  status: "APPROVED",
  launchDate: new Date("2026-05-04T00:00:00.000Z"),
});
```

```ts
// src/server/services/launch-service.test.ts
makeLaunch({
  id: "free-a",
  toolId: "free-a",
  launchType: "FREE",
  launchDate: "2026-05-04T00:00:00.000Z",
  createdAt: "2026-04-20T00:00:00.000Z",
  boardVoteCount: 3,
});
```

```ts
// src/server/services/public-tool-visibility.test.ts
expect(
  isToolPubliclyVisible(
    {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
      launches: [
        {
          status: "APPROVED",
          launchDate: new Date("2026-05-11T00:00:00.000Z"),
        },
      ],
    },
    new Date("2026-05-04T00:00:00.000Z"),
  ),
).toBe(false);
```

- [ ] **Step 2: Run the targeted backend tests to verify the new assertions fail before code changes**

Run:

```bash
npm test -- src/server/services/launch-scheduling.test.ts src/server/services/submission-payment-service.test.ts src/server/services/submission-review-service.test.ts src/server/services/launch-service.test.ts src/server/services/public-tool-visibility.test.ts
```

Expected:

```text
FAIL ... expected "2026-05-01T00:00:00.000Z" to equal "2026-05-04T00:00:00.000Z"
FAIL ... Choose May 1, 2026 UTC or later.
```

- [ ] **Step 3: Make the minimal backend code changes**

```ts
// src/server/env.ts
LAUNCHPAD_GO_LIVE_AT: z
  .string()
  .trim()
  .datetime({ offset: true })
  .default("2026-05-04T00:00:00Z"),
```

```ts
// src/server/services/submission-payment-service.ts
if (launchWeekStart < goLiveFloor) {
  throw new AppError(400, "Choose May 4, 2026 UTC or later.");
}
```

```ts
// src/server/services/submission-payment-service.ts
if (nextLaunchDate < goLiveFloor) {
  throw new AppError(400, "Choose May 4, 2026 UTC or later.");
}
```

- [ ] **Step 4: Run the targeted backend tests again**

Run:

```bash
npm test -- src/server/services/launch-scheduling.test.ts src/server/services/submission-payment-service.test.ts src/server/services/submission-review-service.test.ts src/server/services/launch-service.test.ts src/server/services/public-tool-visibility.test.ts
```

Expected:

```text
PASS src/server/services/launch-scheduling.test.ts
PASS src/server/services/submission-payment-service.test.ts
PASS src/server/services/submission-review-service.test.ts
PASS src/server/services/launch-service.test.ts
PASS src/server/services/public-tool-visibility.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/server/env.ts src/server/services/submission-payment-service.ts src/server/services/launch-scheduling.test.ts src/server/services/submission-payment-service.test.ts src/server/services/submission-review-service.test.ts src/server/services/launch-service.test.ts src/server/services/public-tool-visibility.test.ts
git commit -m "feat: move launchpad go-live fallback to may 4"
```

## Task 2: Add and Run the One-Time Free Launch Shift Script

**Files:**
- Create: `scripts/shift-launchpad-go-live-to-may-4.mjs`
- Modify: `package.json`

- [ ] **Step 1: Write the script with dry-run-first behavior**

```js
// scripts/shift-launchpad-go-live-to-may-4.mjs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FROM_DATE = new Date("2026-05-01T00:00:00.000Z");
const TO_DATE = new Date("2026-05-04T00:00:00.000Z");

async function main() {
  const confirm = process.argv.includes("--confirm");

  const launches = await prisma.launch.findMany({
    where: {
      launchType: "FREE",
      launchDate: FROM_DATE,
    },
    select: {
      id: true,
      toolId: true,
      launchDate: true,
      startAt: true,
      status: true,
    },
  });

  if (launches.length === 0) {
    console.log("No free launches found at 2026-05-01T00:00:00.000Z.");
    return;
  }

  console.log(`Found ${launches.length} free launch(es) to move:`);
  launches.forEach((launch) => {
    console.log(`- ${launch.id} (${launch.toolId}) ${launch.launchDate.toISOString()}`);
  });

  if (!confirm) {
    console.log("DRY RUN: rerun with --confirm to move them to 2026-05-04T00:00:00.000Z.");
    return;
  }

  const result = await prisma.launch.updateMany({
    where: {
      launchType: "FREE",
      launchDate: FROM_DATE,
    },
    data: {
      launchDate: TO_DATE,
      startAt: TO_DATE,
    },
  });

  console.log(`Updated ${result.count} free launch(es) to 2026-05-04T00:00:00.000Z.`);
}
```

```json
// package.json
{
  "scripts": {
    "launchpad:shift-go-live-to-may4": "node scripts/run-with-env.mjs node scripts/shift-launchpad-go-live-to-may-4.mjs"
  }
}
```

- [ ] **Step 2: Run the script in dry-run mode**

Run:

```bash
npm run launchpad:shift-go-live-to-may4
```

Expected:

```text
Found 1 free launch(es) to move:
- <launch-id> (<tool-id>) 2026-05-01T00:00:00.000Z
DRY RUN: rerun with --confirm to move them to 2026-05-04T00:00:00.000Z.
```

- [ ] **Step 3: Run the confirmed update**

Run:

```bash
node scripts/run-with-env.mjs node scripts/shift-launchpad-go-live-to-may-4.mjs --confirm
```

Expected:

```text
Updated 1 free launch(es) to 2026-05-04T00:00:00.000Z.
```

- [ ] **Step 4: Re-run the script in dry-run mode to confirm it no-ops**

Run:

```bash
npm run launchpad:shift-go-live-to-may4
```

Expected:

```text
No free launches found at 2026-05-01T00:00:00.000Z.
```

- [ ] **Step 5: Commit**

```bash
git add scripts/shift-launchpad-go-live-to-may-4.mjs package.json
git commit -m "feat: add one-time may 4 launch shift script"
```

## Task 3: Update Founder/Public Copy and Deployment Reference Text

**Files:**
- Modify: `src/components/founder/submit-product-form.tsx`
- Modify: `src/components/public/prelaunch-surface.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/app/submit/page.tsx`
- Modify: `src/app/dashboard/page.tsx`
- Modify: `docs/deploy-digitalocean-app-platform.md`

- [ ] **Step 1: Replace the visible May 1 copy with May 4**

```tsx
// src/components/founder/submit-product-form.tsx
<p className="mt-3 text-sm font-bold leading-relaxed text-foreground">
  ShipBoost opens on May 4, 2026 UTC. Free launches are queued
  into weekly cohorts, and premium launches can reserve a launch
  week ahead of the opening.
</p>
```

```tsx
// src/components/founder/submit-product-form.tsx
<p className="text-[10px] font-bold  tracking-widest text-muted-foreground">
  {isPrelaunch
    ? "Choose one of the available weekly launch windows starting May 4, 2026 UTC."
    : "Premium launches are reserved by week, not by day."}
</p>
```

```tsx
// src/components/public/prelaunch-surface.tsx
<p className="text-xl font-medium leading-relaxed text-muted-foreground/80 max-w-2xl">
  ShipBoost opens on May 4, 2026 UTC. Free launches enter weekly
  cohorts. Premium launches can lock a week early and skip badge
  verification.
</p>
```

```tsx
// src/app/pricing/page.tsx
description: isPrelaunch
  ? "Choose the ShipBoost launch path that fits your product stage. Start free, reserve a Premium Launch for the May 4 opening cohort, or use our partner submission service."
  : "Choose the ShipBoost launch path that fits your product stage. Start free, reserve a Premium Launch, or use our partner submission service."
```

```tsx
// src/app/submit/page.tsx
<p className="mt-3 text-sm font-bold text-foreground">
  ShipBoost opens on May 4, 2026 UTC. Submit now to line up your
  launch before the public opening.
</p>
```

```tsx
// src/app/dashboard/page.tsx
<p className="mt-3 text-sm font-bold leading-relaxed text-foreground">
  ShipBoost opens on May 4, 2026 UTC. Your free launches are being
  queued into weekly cohorts, and premium launches can reserve
  their preferred launch week ahead of go-live.
</p>
```

```env
# docs/deploy-digitalocean-app-platform.md
LAUNCHPAD_GO_LIVE_AT=2026-05-04T00:00:00Z
```

- [ ] **Step 2: Verify the old visible copy is gone from product code and deployment docs**

Run:

```bash
rg -n "May 1, 2026 UTC|2026-05-01T00:00:00Z" src/app src/components src/server/env.ts docs/deploy-digitalocean-app-platform.md
```

Expected:

```text
src/server/services/launch-scheduling.test.ts:...
src/server/services/submission-payment-service.test.ts:...
```

The search should return no product-copy hits in `src/app`, `src/components`, or `src/server/env.ts`. Remaining hits should only be historical test fixtures you have not updated yet or no output at all.

- [ ] **Step 3: Run lint on the edited UI/server files**

Run:

```bash
npm run lint -- src/components/founder/submit-product-form.tsx src/components/public/prelaunch-surface.tsx src/app/pricing/page.tsx src/app/submit/page.tsx src/app/dashboard/page.tsx src/server/env.ts src/server/services/submission-payment-service.ts
```

Expected:

```text
✔ No ESLint warnings or errors
```

- [ ] **Step 4: Commit**

```bash
git add src/components/founder/submit-product-form.tsx src/components/public/prelaunch-surface.tsx src/app/pricing/page.tsx src/app/submit/page.tsx src/app/dashboard/page.tsx docs/deploy-digitalocean-app-platform.md
git commit -m "feat: move launchpad opening copy to may 4"
```

## Task 4: Final Verification and Cleanup Pass

**Files:**
- Modify: `docs/superpowers/plans/2026-04-17-launchpad-go-live-date-shift.md` (check off completed steps during execution only)

- [ ] **Step 1: Run the focused end-to-end verification suite**

Run:

```bash
npm test -- src/server/services/launch-scheduling.test.ts src/server/services/submission-payment-service.test.ts src/server/services/submission-review-service.test.ts src/server/services/launch-service.test.ts src/server/services/public-tool-visibility.test.ts
npm run lint -- src/server/env.ts src/server/services/submission-payment-service.ts src/components/founder/submit-product-form.tsx src/components/public/prelaunch-surface.tsx src/app/pricing/page.tsx src/app/submit/page.tsx src/app/dashboard/page.tsx
```

Expected:

```text
PASS src/server/services/launch-scheduling.test.ts
PASS src/server/services/submission-payment-service.test.ts
PASS src/server/services/submission-review-service.test.ts
PASS src/server/services/launch-service.test.ts
PASS src/server/services/public-tool-visibility.test.ts
✔ No ESLint warnings or errors
```

- [ ] **Step 2: Run one last grep to catch stale May 1 references in active source**

Run:

```bash
rg -n "May 1, 2026 UTC|2026-05-01T00:00:00Z" src/app src/components src/server scripts package.json
```

Expected:

```text
src/server/services/launch-scheduling.test.ts:...
src/server/services/submission-payment-service.test.ts:...
```

Only intentional historical references in tests or the one-time shift script should remain. There should be no stale May 1 references in live behavior or visible copy.

- [ ] **Step 3: Review the actual scheduled launch date in the admin/founder surfaces**

Run:

```bash
git diff --stat HEAD~3..HEAD
```

Then manually confirm in the app that the previously scheduled free launch now shows May 4, 2026 in:

- admin moderate/detail view
- founder dashboard

Expected:

```text
The moved free launch displays May 4, 2026 consistently anywhere launchDate is rendered.
```

- [ ] **Step 4: Commit**

```bash
git add src/server/env.ts src/server/services/submission-payment-service.ts src/server/services/launch-scheduling.test.ts src/server/services/submission-payment-service.test.ts src/server/services/submission-review-service.test.ts src/server/services/launch-service.test.ts src/server/services/public-tool-visibility.test.ts scripts/shift-launchpad-go-live-to-may-4.mjs package.json src/components/founder/submit-product-form.tsx src/components/public/prelaunch-surface.tsx src/app/pricing/page.tsx src/app/submit/page.tsx src/app/dashboard/page.tsx docs/deploy-digitalocean-app-platform.md
git commit -m "feat: shift launchpad go-live to may 4"
```

## Self-Review

- Spec coverage:
  - Fallback anchor shift: covered in Task 1.
  - Existing May 1 launch move: covered in Task 2.
  - UI copy updates: covered in Task 3.
  - Test and verification updates: covered in Tasks 1 and 4.
- Placeholder scan:
  - No `TODO`, `TBD`, or vague “handle appropriately” language remains in the task steps.
- Type consistency:
  - All referenced files, command names, dates, and script paths match the current repo structure and the approved spec.
