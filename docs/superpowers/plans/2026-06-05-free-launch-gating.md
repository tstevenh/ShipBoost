# Free-Launch Gating Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make free launches earn their slot — require a verified ShipBoost badge **and** 3 upvotes on the current week's board before a founder can schedule a free launch — while keeping the premium ($19) flow frictionless and flipping the listing-link policy so dofollow is premium-only.

**Architecture:** A pure gate helper (`assertFreeLaunchGate`) holds the rules and is unit-tested in isolation. It's invoked inside `scheduleFreeSubmissionLaunch` (the only free-launch entry point) **after** the existing `FEATURED_LAUNCH` rejection, so the premium path never reaches it. The board-eligibility count reuses existing data access (`listCurrentWeekBoardToolIds` + `listUserUpvotedToolIds`). The link policy lives in the existing `resolveToolWebsiteRel` helper. Marketing copy is updated to match the locked positioning: free = badge required, follow-status not featured; dofollow = premium perk.

**Tech Stack:** TypeScript, Vitest (`vi.hoisted`/`vi.mock` prisma pattern, see `src/server/services/submission-draft-service.test.ts`), existing services (`upvote-service`, `launch-service`, `submission-draft-service`), `AppError` from `@/server/http/app-error`.

**Locked decisions (from product discussion):**
- Free launch link = **nofollow**; **dofollow = premium-only** (option A). Drop the old "badge-verified free → dofollow" rule.
- Upvote gate = **3 upvotes on the current week's board** (excluding the founder's own tool).
- Premium stays frictionless: no badge, no upvote gate.
- Public copy: never feature follow-status for free; dofollow listed as a Premium benefit; be truthful in FAQ.

**Key files discovered:**
- `src/server/services/submission-draft-service.ts:755` — `scheduleFreeSubmissionLaunch` (gate insertion point; existing `FEATURED_LAUNCH` reject at `:773`, `PAID` reject at `:777`).
- `src/lib/outbound-link.ts:59` — `resolveToolWebsiteRel` (current policy: free+VERIFIED returns `"noopener"` = dofollow — must change).
- `src/lib/outbound-link.test.ts:84` — test "follows links for badge-verified free launches" (must flip).
- `src/server/services/launch-service.ts` — has `getLaunchBoardWindow` (from `launch-scheduling`) + `getPublicLaunchBoardWhere` (from `public-tool-visibility`) in scope; no import of submission code (no cycle).
- `src/server/services/upvote-service.ts:137` — `listUserUpvotedToolIds(toolIds, userId)`.

**Out of scope:** the badge asset / embed / OG card / launch kit (that's the already-written Distributor Toolkit plan, `2026-06-05-distributor-toolkit.md`). This plan reuses the `data-shipboost-badge="free-launch"` marker that the existing verifier already checks.

---

## File Structure

- `src/lib/outbound-link.ts` — MODIFY `resolveToolWebsiteRel` (free always nofollow; premium-only dofollow)
- `src/lib/outbound-link.test.ts` — MODIFY the badge-verified expectation
- `src/server/services/free-launch-gate.ts` — CREATE pure `assertFreeLaunchGate`
- `src/server/services/free-launch-gate.test.ts` — CREATE
- `src/server/services/launch-service.ts` — ADD `listCurrentWeekBoardToolIds`
- `src/server/services/launch-service.test.ts` — CREATE (covers the new export)
- `src/server/services/submission-draft-service.ts` — MODIFY `scheduleFreeSubmissionLaunch` (wire the gate)
- `src/components/founder/launch-section.tsx` — MODIFY feature copy + add a gate-requirements hint
- `src/app/pricing/page.tsx`, `src/app/how-it-works/page.tsx`, `src/app/faqs/page.tsx`, `src/app/launch-guide/page.tsx` — MODIFY copy

---

## Task 1: Flip the listing-link policy (dofollow = premium-only)

**Files:**
- Modify: `src/lib/outbound-link.ts:59-69`
- Modify: `src/lib/outbound-link.test.ts`

- [ ] **Step 1: Update the failing test first**

In `src/lib/outbound-link.test.ts`, the existing test (around `:84`) asserts badge-verified free launches get `"noopener"`. Replace that test so verified free launches are now **nofollow**:

```ts
  it("nofollow links for badge-verified free launches (dofollow is premium-only)", () => {
    expect(
      resolveToolWebsiteRel({
        badgeVerification: "VERIFIED",
        currentLaunchType: "FREE",
        isFeatured: false,
      }),
    ).toBe("nofollow noopener");
  });
```

Leave the premium test (`:94`, expects `"noopener"`) and the listing-only / unverified tests unchanged.

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/lib/outbound-link.test.ts`
Expected: FAIL — current helper still returns `"noopener"` for verified free.

- [ ] **Step 3: Update the helper**

Replace the body of `resolveToolWebsiteRel` in `src/lib/outbound-link.ts:59-69` with:

```ts
export function resolveToolWebsiteRel(input: ToolWebsiteRelPolicyInput) {
  // Dofollow is a premium-only benefit. Free launches (even badge-verified)
  // get a nofollow link; the badge is required for verification, not for follow status.
  if (input.isFeatured || input.currentLaunchType === "FEATURED") {
    return "noopener";
  }

  return "nofollow noopener";
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/lib/outbound-link.test.ts`
Expected: PASS (premium = `noopener`; free/verified/listing = `nofollow noopener`).

- [ ] **Step 5: Commit**

```bash
git add src/lib/outbound-link.ts src/lib/outbound-link.test.ts
git commit -m "feat(seo): make dofollow premium-only; free listings always nofollow"
```

---

## Task 2: `listCurrentWeekBoardToolIds` (board eligibility source)

**Files:**
- Modify: `src/server/services/launch-service.ts` (add export)
- Create: `src/server/services/launch-service.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    launch: { findMany: vi.fn() },
  },
}));

vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

import { listCurrentWeekBoardToolIds } from "./launch-service";

describe("listCurrentWeekBoardToolIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns de-duplicated tool ids for the current week's board", async () => {
    prismaMock.launch.findMany.mockResolvedValueOnce([
      { toolId: "tool_a" },
      { toolId: "tool_b" },
      { toolId: "tool_a" },
    ]);

    const ids = await listCurrentWeekBoardToolIds(new Date("2026-06-03T00:00:00Z"));

    expect(ids.sort()).toEqual(["tool_a", "tool_b"]);
    expect(prismaMock.launch.findMany).toHaveBeenCalledTimes(1);
  });

  it("returns an empty array when the board is empty", async () => {
    prismaMock.launch.findMany.mockResolvedValueOnce([]);
    expect(await listCurrentWeekBoardToolIds(new Date("2026-06-03T00:00:00Z"))).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/launch-service.test.ts`
Expected: FAIL — `listCurrentWeekBoardToolIds` is not exported.

- [ ] **Step 3: Add the export to `launch-service.ts`**

Add near `listLaunchBoard` (it already uses `getLaunchBoardWindow` and `getPublicLaunchBoardWhere`, both in scope):

```ts
export async function listCurrentWeekBoardToolIds(
  now = new Date(),
): Promise<string[]> {
  const { windowStart, windowEnd } = getLaunchBoardWindow("weekly", now);

  const launches = await prisma.launch.findMany({
    where: {
      launchDate: { gte: windowStart, lte: windowEnd },
      ...getPublicLaunchBoardWhere(now),
    },
    select: { toolId: true },
  });

  return [...new Set(launches.map((launch) => launch.toolId))];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/launch-service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/server/services/launch-service.ts src/server/services/launch-service.test.ts
git commit -m "feat(launch): add listCurrentWeekBoardToolIds for free-launch gating"
```

---

## Task 3: Pure free-launch gate helper

**Files:**
- Create: `src/server/services/free-launch-gate.ts`
- Create: `src/server/services/free-launch-gate.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, expect, it } from "vitest";

import { AppError } from "@/server/http/app-error";
import {
  FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
  assertFreeLaunchGate,
} from "./free-launch-gate";

describe("assertFreeLaunchGate", () => {
  it("throws when the badge is not verified", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "PENDING", eligibleBoardUpvoteCount: 5 }),
    ).toThrowError(AppError);
  });

  it("throws when fewer than the required board upvotes", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "VERIFIED", eligibleBoardUpvoteCount: 2 }),
    ).toThrowError(AppError);
  });

  it("passes when badge verified and upvote requirement met", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/server/services/free-launch-gate.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import { AppError } from "@/server/http/app-error";

export const FREE_LAUNCH_REQUIRED_BOARD_UPVOTES = 3;

export type FreeLaunchGateInput = {
  badgeVerification:
    | "NOT_REQUIRED"
    | "PENDING"
    | "VERIFIED"
    | "FAILED"
    | null
    | undefined;
  eligibleBoardUpvoteCount: number;
};

export function assertFreeLaunchGate({
  badgeVerification,
  eligibleBoardUpvoteCount,
}: FreeLaunchGateInput): void {
  if (badgeVerification !== "VERIFIED") {
    throw new AppError(
      400,
      "Verify your ShipBoost badge on your site before scheduling your free launch.",
    );
  }

  if (eligibleBoardUpvoteCount < FREE_LAUNCH_REQUIRED_BOARD_UPVOTES) {
    throw new AppError(
      400,
      `Upvote at least ${FREE_LAUNCH_REQUIRED_BOARD_UPVOTES} launches on this week's board before scheduling your free launch.`,
    );
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/server/services/free-launch-gate.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/server/services/free-launch-gate.ts src/server/services/free-launch-gate.test.ts
git commit -m "feat(submissions): add pure free-launch gate (badge + board upvotes)"
```

---

## Task 4: Wire the gate into `scheduleFreeSubmissionLaunch`

**Files:**
- Modify: `src/server/services/submission-draft-service.ts`

This is the only free-launch entry point. Insert the gate **after** the `FEATURED_LAUNCH` reject (`:773`) and `PAID` reject (`:777`) so the premium path never reaches it.

- [ ] **Step 1: Add imports**

At the top of `src/server/services/submission-draft-service.ts` (with the other `@/server/services/*` imports):

```ts
import { listCurrentWeekBoardToolIds } from "@/server/services/launch-service";
import { listUserUpvotedToolIds } from "@/server/services/upvote-service";
import { assertFreeLaunchGate } from "@/server/services/free-launch-gate";
```

> Verify there is no import cycle warning after adding these (launch-service and upvote-service do not import submission-draft-service, so there should be none). If a cycle appears, inline the `prisma.launch.findMany` query from Task 2 here instead of importing `listCurrentWeekBoardToolIds`.

- [ ] **Step 2: Insert the gate**

In `scheduleFreeSubmissionLaunch`, immediately after the existing block:

```ts
  if (submission.paymentStatus === "PAID") {
    throw new AppError(400, "Paid launches cannot join the free queue.");
  }
```

add:

```ts
  const boardToolIds = (await listCurrentWeekBoardToolIds()).filter(
    (toolId) => toolId !== submission.toolId,
  );
  const eligibleBoardUpvoteCount = (
    await listUserUpvotedToolIds(boardToolIds, founder.id)
  ).length;

  assertFreeLaunchGate({
    badgeVerification: submission.badgeVerification,
    eligibleBoardUpvoteCount,
  });
```

> `submission.badgeVerification`, `submission.toolId`, and `founder.id` are all already in scope in this function. `listUserUpvotedToolIds` returns the subset of `boardToolIds` the founder has upvoted; excluding the founder's own `toolId` prevents self-vote gaming.

- [ ] **Step 3: Build + lint**

Run: `npm run lint && npm run build`
Expected: no type/lint errors. (No existing test calls `scheduleFreeSubmissionLaunch`, so nothing breaks.)

- [ ] **Step 4: Manual verification (dev)**

Run: `npm run dev`. As a founder with an unverified free draft, hit `POST /api/submissions/<id>/schedule-free`:
- Unverified badge → `400` "Verify your ShipBoost badge…".
- Verified badge but <3 board upvotes → `400` "Upvote at least 3 launches…".
- Verified + 3 board upvotes → schedules (200) as before.
- A `FEATURED_LAUNCH` submission still returns the existing "Premium launches must go through checkout." (gate not reached).

- [ ] **Step 5: Commit**

```bash
git add src/server/services/submission-draft-service.ts
git commit -m "feat(submissions): gate free-launch scheduling on verified badge + 3 board upvotes"
```

---

## Task 5: Surface the requirements in the schedule-free UI

**Files:**
- Modify: `src/components/founder/launch-section.tsx`

A raw 400 is poor UX. Show the two requirements near the free-launch schedule action so founders understand the gate before they click.

- [ ] **Step 1: Update the free-tier feature copy (line ~62)**

Replace the line:

```tsx
  "Website link (nofollow by default; add the badge to upgrade to dofollow)",
```

with:

```tsx
  "Public listing with a link to your site",
```

- [ ] **Step 2: Add a requirements hint near the schedule button**

Find the free-launch schedule action in this component and render this hint above/beside it (place within the existing free-launch branch markup):

```tsx
<ul className="mt-3 space-y-1 text-sm text-muted-foreground">
  <li>• Add the ShipBoost badge to your site and verify it</li>
  <li>• Upvote 3 launches on this week&apos;s board</li>
</ul>
```

- [ ] **Step 3: Build + lint + run the component's existing tests**

Run: `npm run lint && npx vitest run src/components/founder`
Expected: PASS; no regressions.

- [ ] **Step 4: Commit**

```bash
git add src/components/founder/launch-section.tsx
git commit -m "feat(founder): show badge + upvote requirements on free-launch scheduling"
```

---

## Task 6: Marketing copy rewrite (positioning)

**Files:**
- Modify: `src/app/pricing/page.tsx`, `src/app/how-it-works/page.tsx`, `src/app/faqs/page.tsx`, `src/app/launch-guide/page.tsx`

**Messaging rules (locked):** Free = "verified ShipBoost badge required" + sell exposure/listing/board visibility; **never** state or imply the free link's follow status. Premium = keep "guaranteed dofollow link" + editorial article as the differentiator. Be truthful in FAQ if asked.

Apply these exact replacements (open each file, match the quoted current text in context, replace):

- [ ] **Step 1: `src/app/pricing/page.tsx`**

`:135` — replace:
```tsx
<CheckItem text="Website link (nofollow by default; add the badge to upgrade to dofollow)" />
```
with:
```tsx
<CheckItem text="Public listing with a link to your site" />
<CheckItem text="Verified ShipBoost badge required" />
```
Leave the premium line (`:180`, "Guaranteed dofollow link from your listing and editorial article") unchanged — it is now the differentiator.

- [ ] **Step 2: `src/app/how-it-works/page.tsx`**

- `:22` → `"Founders submit their product, listing details, and launch preference. Free launches require a verified ShipBoost badge on your site and include a public listing with a link to your product."`
- `:41` → `"Public listing with a link to your site"`
- `:42` → `"Verified ShipBoost badge required"`
- `:190` → `"You want a credible public listing and weekly board visibility. A verified ShipBoost badge is required for free launches."`
- Leave `:52` and `:194` (premium "guaranteed dofollow") unchanged.

- [ ] **Step 3: `src/app/faqs/page.tsx`**

- `:47` → replace the free clause so it reads: `"... Free Launch is reviewed and queued into the next available weekly cohort and requires a verified ShipBoost badge on your site."` (keep the premium-vs-free editorial framing intact; remove the "nofollow … upgrade to dofollow" clause.)
- `:57` → `"The badge is required for Free Launch. It shows visitors where you launched, adds a trust signal to your site, and lets ShipBoost verify your launch."`
- `:62` → `"The badge is required for Free Launch so ShipBoost can verify it. It is not part of the Premium Launch flow — Premium includes a guaranteed dofollow link by default."`
- Leave `:52` (premium editorial) unchanged.

- [ ] **Step 4: `src/app/launch-guide/page.tsx`**

- `:165` → `"Use the free option when you want visibility and can add the required ShipBoost badge to your site."`
- Leave `:170` (premium) unchanged.

- [ ] **Step 5: Verify nothing stale remains + build**

Run:
```bash
grep -rniE "nofollow|optional .*badge|badge.*optional|unlock a dofollow" src/app src/components | grep -viE "test|outbound-link"
npm run lint && npm run build
```
Expected: the grep returns no user-facing "nofollow / optional badge / unlock dofollow" free-tier copy; build passes.

- [ ] **Step 6: Commit**

```bash
git add src/app/pricing/page.tsx src/app/how-it-works/page.tsx src/app/faqs/page.tsx src/app/launch-guide/page.tsx
git commit -m "docs(copy): badge now required for free; dofollow positioned as premium perk"
```

---

## Self-Review

**Spec coverage:**
- Mandatory verified badge for free launch → Task 3 (`assertFreeLaunchGate`) + Task 4 (wired into the only free entry point). ✔
- 3 upvotes on the current week's board, excluding own tool → Task 2 (`listCurrentWeekBoardToolIds`) + Task 4 (`.filter(id !== ownTool)` + `listUserUpvotedToolIds`). ✔
- Premium stays frictionless → gate inserted after the `FEATURED_LAUNCH` reject; premium routes through checkout/webhook untouched; Task 4 Step 4 verifies featured still gets the checkout message. ✔
- Free = nofollow, dofollow = premium-only → Task 1. ✔
- Copy positioning (badge required; dofollow = premium; no free follow-status) → Tasks 5–6. ✔

**Placeholder scan:** none — every code step has complete code; copy steps give exact new strings. The "verify no import cycle" note is a real check with a concrete fallback, not deferred work.

**Type consistency:** `assertFreeLaunchGate({badgeVerification, eligibleBoardUpvoteCount})` and `FREE_LAUNCH_REQUIRED_BOARD_UPVOTES` are defined in Task 3 and used identically in Tasks 3 (test) and 4 (wiring). `listCurrentWeekBoardToolIds(now?)` returns `string[]` in Task 2 and is consumed as such in Task 4. `resolveToolWebsiteRel` signature unchanged (Task 1 only changes the body).

---

## Sequencing note

Ship the **Distributor Toolkit** plan first (it builds the badge this gate depends on). This plan's badge requirement reuses the same `data-shipboost-badge="free-launch"` marker the existing verifier checks — no new verification code needed. Consider gating the upvote requirement behind a feature flag for the first week if you want to measure free-submission conversion before/after, per the earlier discussion.
