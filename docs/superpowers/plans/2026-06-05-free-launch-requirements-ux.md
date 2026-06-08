# Free-Launch Requirements UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Put the two free-launch requirements (verified badge + 3 board upvotes) in one in-flow panel on the launch-plans page, with a live-progress upvote modal, and gate the "Schedule free launch" button on them.

**Architecture:** A pure required-count helper + an updated server gate make UI and server agree (`min(3, available non-own board tools)`, 0 → waived). A new `free-launch-requirements` service reads requirement state and casts cap-bypassing "requirement votes" (guarded). The launch-plans page feeds requirement data into `LaunchSection`, which renders a new `FreeLaunchRequirementsPanel` (badge verify + upvote progress) and an `UpvoteRequirementModal`. The redundant sidebar badge card is removed.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Vitest (+ jsdom for components; `vi.hoisted`/`vi.mock` prisma pattern), Prisma, existing services (`upvote-service`, `launch-service`, `submission-draft-service`, `free-launch-gate`).

**Spec:** `docs/superpowers/specs/2026-06-05-free-launch-requirements-ux-design.md`. Builds on Plan A + Plan B (same branch `feat/distributor-toolkit`).

**Repo notes:**
- Run one test file: `npx vitest run <path>`. Component tests under `src/components/**/*.test.tsx` auto-run in jsdom.
- Do NOT run `npm run build` for verification (pre-existing unrelated lint errors + slow); use `npx eslint <files>` + targeted vitest.
- `AppError(status, message)` from `@/server/http/app-error`.
- Existing: `getToolUpvoteCount`, `listUserUpvotedToolIds(toolIds, userId)`, `listToolUpvoteCounts` in `upvote-service`; `listLaunchBoard("weekly")` in `launch-service` (returns ranked launches each with `.tool` = `{id,slug,name,tagline,logoMedia,...,upvoteCount}`); `assertFreeLaunchGate` + `FREE_LAUNCH_REQUIRED_BOARD_UPVOTES` in `free-launch-gate`; `scheduleFreeSubmissionLaunch` in `submission-draft-service`.

---

## File Structure

- `src/server/services/free-launch-gate.ts` — ADD `computeRequiredBoardUpvotes`; UPDATE `assertFreeLaunchGate` to take `requiredBoardUpvotes`
- `src/server/services/upvote-service.ts` — ADD `recordUpvoteWithoutDailyLimit`
- `src/server/services/free-launch-requirements.ts` — CREATE `getFreeLaunchRequirements`, `castLaunchRequirementVote`, types
- `src/server/services/submission-draft-service.ts` — UPDATE `scheduleFreeSubmissionLaunch` to compute + pass `requiredBoardUpvotes`
- `src/app/api/submissions/[submissionId]/requirement-vote/route.ts` — CREATE `POST`
- `src/components/founder/free-launch-requirements-panel.tsx` — CREATE
- `src/components/founder/upvote-requirement-modal.tsx` — CREATE
- `src/components/founder/launch-section.tsx` — MODIFY (render panel when Free, gate Schedule)
- `src/components/founder/submit-product-form.tsx` — MODIFY (pass new props to LaunchSection; remove sidebar badge card + stale description)
- `src/app/submit/page.tsx` and `src/app/dashboard/tools/[toolId]/page.tsx` — MODIFY (compute + pass `freeLaunchRequirements`)

---

## Task 1: `computeRequiredBoardUpvotes` (pure)

**Files:** Modify `src/server/services/free-launch-gate.ts`; Modify `src/server/services/free-launch-gate.test.ts`

- [ ] **Step 1: Add the failing test** to `free-launch-gate.test.ts`:

```ts
import { computeRequiredBoardUpvotes } from "./free-launch-gate";

describe("computeRequiredBoardUpvotes", () => {
  it("caps the requirement at 3 but never exceeds available board tools", () => {
    expect(computeRequiredBoardUpvotes(0)).toBe(0);
    expect(computeRequiredBoardUpvotes(2)).toBe(2);
    expect(computeRequiredBoardUpvotes(3)).toBe(3);
    expect(computeRequiredBoardUpvotes(10)).toBe(3);
    expect(computeRequiredBoardUpvotes(-1)).toBe(0);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (`computeRequiredBoardUpvotes` undefined)

Run: `npx vitest run src/server/services/free-launch-gate.test.ts`

- [ ] **Step 3: Implement** — add to `free-launch-gate.ts`:

```ts
export function computeRequiredBoardUpvotes(
  availableNonOwnBoardToolCount: number,
): number {
  return Math.max(0, Math.min(FREE_LAUNCH_REQUIRED_BOARD_UPVOTES, availableNonOwnBoardToolCount));
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/server/services/free-launch-gate.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/free-launch-gate.ts src/server/services/free-launch-gate.test.ts
git commit -m "feat(submissions): add computeRequiredBoardUpvotes (min(3, available))

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `assertFreeLaunchGate` takes a dynamic required count

**Files:** Modify `src/server/services/free-launch-gate.ts`; Modify `src/server/services/free-launch-gate.test.ts`

- [ ] **Step 1: Update the tests** in `free-launch-gate.test.ts` — replace the existing `assertFreeLaunchGate` describe block with:

```ts
describe("assertFreeLaunchGate", () => {
  it("throws when the badge is not verified", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "PENDING", eligibleBoardUpvoteCount: 5 }),
    ).toThrowError(AppError);
  });

  it("throws when fewer than the required board upvotes (default 3)", () => {
    expect(() =>
      assertFreeLaunchGate({ badgeVerification: "VERIFIED", eligibleBoardUpvoteCount: 2 }),
    ).toThrowError(AppError);
  });

  it("passes when badge verified and the default upvote requirement is met", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
      }),
    ).not.toThrow();
  });

  it("honors a dynamic requiredBoardUpvotes (thin board)", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: 2,
        requiredBoardUpvotes: 2,
      }),
    ).not.toThrow();
  });

  it("waives the upvote requirement when requiredBoardUpvotes is 0", () => {
    expect(() =>
      assertFreeLaunchGate({
        badgeVerification: "VERIFIED",
        eligibleBoardUpvoteCount: 0,
        requiredBoardUpvotes: 0,
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (type/behavior mismatch on `requiredBoardUpvotes`)

Run: `npx vitest run src/server/services/free-launch-gate.test.ts`

- [ ] **Step 3: Update the implementation** — replace `FreeLaunchGateInput` and `assertFreeLaunchGate` in `free-launch-gate.ts`:

```ts
export type FreeLaunchGateInput = {
  badgeVerification:
    | "NOT_REQUIRED"
    | "PENDING"
    | "VERIFIED"
    | "FAILED"
    | null
    | undefined;
  eligibleBoardUpvoteCount: number;
  /** Defaults to FREE_LAUNCH_REQUIRED_BOARD_UPVOTES; pass min(3, available) for thin boards. */
  requiredBoardUpvotes?: number;
};

export function assertFreeLaunchGate({
  badgeVerification,
  eligibleBoardUpvoteCount,
  requiredBoardUpvotes = FREE_LAUNCH_REQUIRED_BOARD_UPVOTES,
}: FreeLaunchGateInput): void {
  if (badgeVerification !== "VERIFIED") {
    throw new AppError(
      400,
      "Verify your ShipBoost badge on your site before scheduling your free launch.",
    );
  }

  if (eligibleBoardUpvoteCount < requiredBoardUpvotes) {
    throw new AppError(
      400,
      `Upvote at least ${requiredBoardUpvotes} launches on this week's board before scheduling your free launch.`,
    );
  }
}
```

- [ ] **Step 4: Run — expect PASS** (all gate tests)

Run: `npx vitest run src/server/services/free-launch-gate.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/free-launch-gate.ts src/server/services/free-launch-gate.test.ts
git commit -m "feat(submissions): free-launch gate accepts dynamic requiredBoardUpvotes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `recordUpvoteWithoutDailyLimit` (cap-bypass vote)

**Files:** Modify `src/server/services/upvote-service.ts`; Modify `src/server/services/upvote-service.test.ts` (create if absent)

This mirrors `toggleToolUpvote`'s create path (ensure public, resolve weight, create, record streak) but **skips the daily-limit check** and is **create-only** (idempotent — never deletes).

- [ ] **Step 1: Write the failing test** — add to `src/server/services/upvote-service.test.ts` (use the repo's prisma-mock pattern; create the file with this if it doesn't exist):

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    tool: { findFirst: vi.fn() },
    user: { findUnique: vi.fn() },
    toolVote: { create: vi.fn(), aggregate: vi.fn(), findFirst: vi.fn() },
    userStreakDay: { findFirst: vi.fn(), upsert: vi.fn() },
  },
}));
vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));
vi.mock("@/server/services/streak-service", () => ({
  getVoteMultiplier: vi.fn().mockResolvedValue(1),
  recordStreakActivity: vi.fn().mockResolvedValue(undefined),
}));

import { recordUpvoteWithoutDailyLimit } from "./upvote-service";

describe("recordUpvoteWithoutDailyLimit", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a vote for a public tool without checking the daily limit", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "FOUNDER" });
    prismaMock.tool.findFirst.mockResolvedValueOnce({ id: "tool_1" });
    prismaMock.toolVote.create.mockResolvedValueOnce({ id: "v1" });

    await recordUpvoteWithoutDailyLimit("tool_1", "user_1");

    expect(prismaMock.toolVote.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ toolId: "tool_1", userId: "user_1" }) }),
    );
  });

  it("throws 404 when the tool is not public", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ role: "FOUNDER" });
    prismaMock.tool.findFirst.mockResolvedValueOnce(null);
    await expect(recordUpvoteWithoutDailyLimit("nope", "user_1")).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (export missing)

Run: `npx vitest run src/server/services/upvote-service.test.ts`

- [ ] **Step 3: Implement** — add to `upvote-service.ts` (reuses existing module-private `ensurePublicTool`, `resolveVoteWeight`, `getUserVoteRole`, and `recordStreakActivity`):

```ts
export async function recordUpvoteWithoutDailyLimit(
  toolId: string,
  userId: string,
): Promise<void> {
  const role = await getUserVoteRole(userId);
  await ensurePublicTool(toolId);
  const weight = await resolveVoteWeight(userId, role);

  try {
    await prisma.toolVote.create({
      data: { toolId, userId, weight },
    });
  } catch (error) {
    // Idempotent: an existing vote (unique toolId+userId) is fine.
    if (!isUniqueConstraintError(error)) {
      throw error;
    }
  }

  void recordStreakActivity(userId).catch((err) => {
    console.error("[shipboost streak] record activity (requirement vote) failed", err);
  });
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/server/services/upvote-service.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/upvote-service.ts src/server/services/upvote-service.test.ts
git commit -m "feat(upvote): add recordUpvoteWithoutDailyLimit for gated requirement votes

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `free-launch-requirements` service

**Files:** Create `src/server/services/free-launch-requirements.ts`; Create `src/server/services/free-launch-requirements.test.ts`

Reads requirement state and casts guarded, cap-bypassing requirement votes.

- [ ] **Step 1: Write the failing test**:

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: { submission: { findFirst: vi.fn() } },
}));
vi.mock("@/server/db/client", () => ({ prisma: prismaMock }));

const listLaunchBoard = vi.fn();
const listUserUpvotedToolIds = vi.fn();
const recordUpvoteWithoutDailyLimit = vi.fn();
vi.mock("@/server/services/launch-service", () => ({ listLaunchBoard: (...a: unknown[]) => listLaunchBoard(...a) }));
vi.mock("@/server/services/upvote-service", () => ({
  listUserUpvotedToolIds: (...a: unknown[]) => listUserUpvotedToolIds(...a),
  recordUpvoteWithoutDailyLimit: (...a: unknown[]) => recordUpvoteWithoutDailyLimit(...a),
}));

import { castLaunchRequirementVote, getFreeLaunchRequirements } from "./free-launch-requirements";

const board = [
  { tool: { id: "own", slug: "own", name: "Own", tagline: "", logoMedia: null, upvoteCount: 0 } },
  { tool: { id: "a", slug: "a", name: "A", tagline: "ta", logoMedia: { url: "u" }, upvoteCount: 5 } },
  { tool: { id: "b", slug: "b", name: "B", tagline: "tb", logoMedia: null, upvoteCount: 2 } },
];

describe("getFreeLaunchRequirements", () => {
  beforeEach(() => vi.clearAllMocks());

  it("excludes the own tool, marks upvoted, and computes required=min(3,available)", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({
      id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING",
    });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce(["a"]);

    const r = await getFreeLaunchRequirements("s1", { id: "u1" });

    expect(r.boardTools.map((t) => t.id)).toEqual(["a", "b"]); // own excluded
    expect(r.boardTools.find((t) => t.id === "a")?.hasUpvoted).toBe(true);
    expect(r.requiredCount).toBe(2); // only 2 non-own tools
    expect(r.eligibleCount).toBe(1);
    expect(r.badgeVerification).toBe("PENDING");
  });
});

describe("castLaunchRequirementVote", () => {
  beforeEach(() => vi.clearAllMocks());

  it("rejects voting on a tool not on the board", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({ id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING" });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]);
    await expect(castLaunchRequirementVote("s1", "not-on-board", { id: "u1" })).rejects.toThrow();
  });

  it("rejects voting on the founder's own tool", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({ id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING" });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]);
    await expect(castLaunchRequirementVote("s1", "own", { id: "u1" })).rejects.toThrow();
  });

  it("records the vote and returns the updated eligible count", async () => {
    prismaMock.submission.findFirst.mockResolvedValueOnce({ id: "s1", toolId: "own", submissionType: "FREE_LAUNCH", badgeVerification: "PENDING" });
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce([]); // before
    recordUpvoteWithoutDailyLimit.mockResolvedValueOnce(undefined);
    listLaunchBoard.mockResolvedValueOnce(board);
    listUserUpvotedToolIds.mockResolvedValueOnce(["a"]); // after

    const r = await castLaunchRequirementVote("s1", "a", { id: "u1" });
    expect(recordUpvoteWithoutDailyLimit).toHaveBeenCalledWith("a", "u1");
    expect(r.eligibleCount).toBe(1);
    expect(r.requiredCount).toBe(2);
  });
});
```

- [ ] **Step 2: Run — expect FAIL** (module missing)

Run: `npx vitest run src/server/services/free-launch-requirements.test.ts`

- [ ] **Step 3: Implement** `src/server/services/free-launch-requirements.ts`:

```ts
import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { computeRequiredBoardUpvotes } from "@/server/services/free-launch-gate";
import { listLaunchBoard } from "@/server/services/launch-service";
import {
  listUserUpvotedToolIds,
  recordUpvoteWithoutDailyLimit,
} from "@/server/services/upvote-service";

export type RequirementBoardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  upvoteCount: number;
  hasUpvoted: boolean;
};

export type FreeLaunchRequirements = {
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  boardTools: RequirementBoardTool[];
  requiredCount: number;
  eligibleCount: number;
};

type Founder = { id: string };

async function getOwnedFreeSubmission(submissionId: string, founder: Founder) {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, userId: founder.id },
    select: { id: true, toolId: true, submissionType: true, badgeVerification: true },
  });
  if (!submission) throw new AppError(404, "Submission not found.");
  if (submission.submissionType === "FEATURED_LAUNCH") {
    throw new AppError(400, "Premium launches do not use the free-launch requirements.");
  }
  return submission;
}

async function loadRequirementState(submission: {
  toolId: string;
  badgeVerification: FreeLaunchRequirements["badgeVerification"];
}, founder: Founder): Promise<FreeLaunchRequirements> {
  const launches = await listLaunchBoard("weekly");
  const nonOwn = launches
    .map((launch) => launch.tool)
    .filter((tool) => tool.id !== submission.toolId);

  const upvotedIds = new Set(
    await listUserUpvotedToolIds(nonOwn.map((t) => t.id), founder.id),
  );

  const boardTools: RequirementBoardTool[] = nonOwn.map((tool) => ({
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    logoUrl: tool.logoMedia?.url ?? null,
    upvoteCount: tool.upvoteCount ?? 0,
    hasUpvoted: upvotedIds.has(tool.id),
  }));

  return {
    badgeVerification: submission.badgeVerification,
    boardTools,
    requiredCount: computeRequiredBoardUpvotes(boardTools.length),
    eligibleCount: upvotedIds.size,
  };
}

export async function getFreeLaunchRequirements(
  submissionId: string,
  founder: Founder,
): Promise<FreeLaunchRequirements> {
  const submission = await getOwnedFreeSubmission(submissionId, founder);
  return loadRequirementState(submission, founder);
}

export async function castLaunchRequirementVote(
  submissionId: string,
  toolId: string,
  founder: Founder,
): Promise<{ eligibleCount: number; requiredCount: number }> {
  const submission = await getOwnedFreeSubmission(submissionId, founder);

  if (toolId === submission.toolId) {
    throw new AppError(400, "You can't upvote your own launch.");
  }

  const before = await loadRequirementState(submission, founder);
  const target = before.boardTools.find((tool) => tool.id === toolId);
  if (!target) {
    throw new AppError(400, "That launch isn't on this week's board.");
  }
  if (before.eligibleCount >= before.requiredCount) {
    return { eligibleCount: before.eligibleCount, requiredCount: before.requiredCount };
  }

  await recordUpvoteWithoutDailyLimit(toolId, founder.id);

  const after = await loadRequirementState(submission, founder);
  return { eligibleCount: after.eligibleCount, requiredCount: after.requiredCount };
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/server/services/free-launch-requirements.test.ts`

- [ ] **Step 5: Commit**

```bash
git add src/server/services/free-launch-requirements.ts src/server/services/free-launch-requirements.test.ts
git commit -m "feat(submissions): free-launch-requirements service (state + guarded requirement vote)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Requirement-vote route

**Files:** Create `src/app/api/submissions/[submissionId]/requirement-vote/route.ts`

Mirror the existing submission routes (see `verify-badge/route.ts`): `requireSession`, `getEnv`, `ok`/`errorResponse`.

- [ ] **Step 1: Implement**:

```ts
import type { NextRequest } from "next/server";

import { requireSession } from "@/server/auth/session";
import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { castLaunchRequirementVote } from "@/server/services/free-launch-requirements";

type RouteContext = { params: Promise<{ submissionId: string }> };

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    getEnv();
    const session = await requireSession(request);
    const { submissionId } = await context.params;
    const body = (await request.json()) as { toolId?: unknown };
    if (typeof body.toolId !== "string" || body.toolId.length === 0) {
      return errorResponse(new Error("toolId is required"));
    }
    const result = await castLaunchRequirementVote(submissionId, body.toolId, {
      id: session.user.id,
    });
    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 2: Verify** — `npx eslint "src/app/api/submissions/[submissionId]/requirement-vote/route.ts"` clean; confirm `requireSession`, `ok`, `errorResponse` import paths match `verify-badge/route.ts` (open it to compare).

- [ ] **Step 3: Commit**

```bash
git add "src/app/api/submissions/[submissionId]/requirement-vote/route.ts"
git commit -m "feat(api): POST requirement-vote for free-launch upvote gating

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Use the dynamic required count in `scheduleFreeSubmissionLaunch`

**Files:** Modify `src/server/services/submission-draft-service.ts`

The gate currently passes only `eligibleBoardUpvoteCount`. Compute `requiredCount` from board availability so the server matches the UI (and thin boards aren't blocked).

- [ ] **Step 1: Update imports** — ensure these are imported (add missing names; `computeRequiredBoardUpvotes` is new):

```ts
import { listCurrentWeekBoardToolIds } from "@/server/services/launch-service";
import { listUserUpvotedToolIds } from "@/server/services/upvote-service";
import { assertFreeLaunchGate, computeRequiredBoardUpvotes } from "@/server/services/free-launch-gate";
```

- [ ] **Step 2: Replace the gate block** inserted in Plan B (the `boardToolIds` / `eligibleBoardUpvoteCount` / `assertFreeLaunchGate` block right after the `paymentStatus === "PAID"` guard) with:

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
    requiredBoardUpvotes: computeRequiredBoardUpvotes(boardToolIds.length),
  });
```

- [ ] **Step 3: Verify** — `npx eslint src/server/services/submission-draft-service.ts` clean; `npx vitest run src/server/services/submission-draft-service.test.ts src/server/services/submission-draft-update.test.ts` PASS.

- [ ] **Step 4: Commit**

```bash
git add src/server/services/submission-draft-service.ts
git commit -m "feat(submissions): gate uses requiredBoardUpvotes = min(3, available)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: `UpvoteRequirementModal` component

**Files:** Create `src/components/founder/upvote-requirement-modal.tsx`; Create `src/components/founder/upvote-requirement-modal.test.tsx`

- [ ] **Step 1: Write the failing test**:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UpvoteRequirementModal } from "./upvote-requirement-modal";

const baseTools = [
  { id: "a", slug: "a", name: "Acme", tagline: "ta", logoUrl: null, upvoteCount: 3, hasUpvoted: false },
  { id: "b", slug: "b", name: "Beta", tagline: "tb", logoUrl: null, upvoteCount: 1, hasUpvoted: false },
];

afterEach(() => vi.restoreAllMocks());

describe("UpvoteRequirementModal", () => {
  it("shows progress and casts a vote, updating progress from the response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { eligibleCount: 1, requiredCount: 2 } }),
    }));
    const onProgress = vi.fn();

    render(
      <UpvoteRequirementModal
        submissionId="s1"
        tools={baseTools}
        eligibleCount={0}
        requiredCount={2}
        onProgress={onProgress}
        onClose={() => {}}
      />,
    );

    expect(screen.getByText(/0\s*\/\s*2/)).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: /upvote/i })[0]);

    await waitFor(() => expect(onProgress).toHaveBeenCalledWith(1, 2));
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/components/founder/upvote-requirement-modal.test.tsx`

- [ ] **Step 3: Implement** `upvote-requirement-modal.tsx`:

```tsx
"use client";

import { useState } from "react";
import { ArrowUp, Check, X } from "lucide-react";

export type RequirementBoardTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  upvoteCount: number;
  hasUpvoted: boolean;
};

type Props = {
  submissionId: string;
  tools: RequirementBoardTool[];
  eligibleCount: number;
  requiredCount: number;
  onProgress: (eligibleCount: number, requiredCount: number) => void;
  onClose: () => void;
};

export function UpvoteRequirementModal({
  submissionId,
  tools,
  eligibleCount,
  requiredCount,
  onProgress,
  onClose,
}: Props) {
  const [voted, setVoted] = useState<Set<string>>(
    () => new Set(tools.filter((t) => t.hasUpvoted).map((t) => t.id)),
  );
  const [count, setCount] = useState(eligibleCount);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const done = count >= requiredCount;

  async function upvote(toolId: string) {
    setPendingId(toolId);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/requirement-vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message ?? "Could not record your upvote.");
      setVoted((prev) => new Set(prev).add(toolId));
      setCount(payload.data.eligibleCount);
      onProgress(payload.data.eligibleCount, payload.data.requiredCount);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not record your upvote.");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
      <div className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <h2 className="font-heading text-base font-semibold">Support this week&apos;s launches</h2>
            <p className="text-sm text-muted-foreground">
              {done ? "You're all set — close to continue." : `${count} / ${requiredCount} upvotes`}
            </p>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-md p-1 hover:bg-muted">
            <X className="size-4" />
          </button>
        </div>

        {/* progress bar */}
        <div className="px-6 pt-4">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${requiredCount === 0 ? 100 : Math.min(100, (count / requiredCount) * 100)}%` }}
            />
          </div>
        </div>

        {error ? <p className="px-6 pt-3 text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-col gap-2 overflow-y-auto px-6 py-4">
          {tools.map((tool) => {
            const isVoted = voted.has(tool.id);
            return (
              <div key={tool.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{tool.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{tool.tagline}</p>
                </div>
                <button
                  type="button"
                  disabled={isVoted || pendingId === tool.id || done}
                  onClick={() => void upvote(tool.id)}
                  className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                >
                  {isVoted ? <Check className="size-3.5" /> : <ArrowUp className="size-3.5" />}
                  {isVoted ? "Upvoted" : "Upvote"}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/components/founder/upvote-requirement-modal.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/founder/upvote-requirement-modal.tsx src/components/founder/upvote-requirement-modal.test.tsx
git commit -m "feat(founder): upvote requirement modal with live progress

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: `FreeLaunchRequirementsPanel` component

**Files:** Create `src/components/founder/free-launch-requirements-panel.tsx`; Create `src/components/founder/free-launch-requirements-panel.test.tsx`

Owns both steps. Badge verify calls the existing `POST /api/submissions/[id]/verify-badge`. Exposes `onAllRequirementsMet(met: boolean)` so `LaunchSection` can enable/disable Schedule.

- [ ] **Step 1: Write the failing test**:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FreeLaunchRequirementsPanel } from "./free-launch-requirements-panel";

const tools = [
  { id: "a", slug: "a", name: "Acme", tagline: "ta", logoUrl: null, upvoteCount: 3, hasUpvoted: false },
  { id: "b", slug: "b", name: "Beta", tagline: "tb", logoUrl: null, upvoteCount: 1, hasUpvoted: false },
];

describe("FreeLaunchRequirementsPanel", () => {
  it("reports not-met when badge unverified, and shows the upvote progress", () => {
    const onMet = vi.fn();
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badgeSnippet={'<a></a>'}
        badgePreviewSrc="/badge.svg"
        initialBadgeVerification="PENDING"
        tools={tools}
        initialEligibleCount={0}
        requiredCount={2}
        onRequirementsMet={onMet}
      />,
    );
    expect(onMet).toHaveBeenLastCalledWith(false);
    expect(screen.getByText(/0\s*\/\s*2/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upvote now/i })).toBeInTheDocument();
  });

  it("waives the upvote step when requiredCount is 0", () => {
    const onMet = vi.fn();
    render(
      <FreeLaunchRequirementsPanel
        submissionId="s1"
        badgeSnippet={'<a></a>'}
        badgePreviewSrc="/badge.svg"
        initialBadgeVerification="VERIFIED"
        tools={[]}
        initialEligibleCount={0}
        requiredCount={0}
        onRequirementsMet={onMet}
      />,
    );
    expect(onMet).toHaveBeenLastCalledWith(true); // badge verified + votes waived
    expect(screen.getByText(/no other launches to upvote/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run — expect FAIL**

Run: `npx vitest run src/components/founder/free-launch-requirements-panel.test.tsx`

- [ ] **Step 3: Implement** `free-launch-requirements-panel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";

import { UpvoteRequirementModal, type RequirementBoardTool } from "./upvote-requirement-modal";

type BadgeVerification = "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";

type Props = {
  submissionId: string;
  badgeSnippet: string;
  badgePreviewSrc: string;
  initialBadgeVerification: BadgeVerification;
  tools: RequirementBoardTool[];
  initialEligibleCount: number;
  requiredCount: number;
  onRequirementsMet: (met: boolean) => void;
};

export function FreeLaunchRequirementsPanel({
  submissionId,
  badgeSnippet,
  badgePreviewSrc,
  initialBadgeVerification,
  tools,
  initialEligibleCount,
  requiredCount,
  onRequirementsMet,
}: Props) {
  const [badge, setBadge] = useState<BadgeVerification>(initialBadgeVerification);
  const [eligibleCount, setEligibleCount] = useState(initialEligibleCount);
  const [modalOpen, setModalOpen] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const badgeOk = badge === "VERIFIED";
  const votesOk = eligibleCount >= requiredCount;

  useEffect(() => {
    onRequirementsMet(badgeOk && votesOk);
  }, [badgeOk, votesOk, onRequirementsMet]);

  async function verifyBadge() {
    setVerifying(true);
    setError(null);
    try {
      const res = await fetch(`/api/submissions/${submissionId}/verify-badge`, { method: "POST" });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error?.message ?? "Verification failed.");
      const status: BadgeVerification = payload.data?.badgeVerification ?? "VERIFIED";
      setBadge(status);
      if (status !== "VERIFIED") setError("We couldn't find the badge on your site yet.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  function copySnippet() {
    if (typeof navigator !== "undefined" && navigator.clipboard) void navigator.clipboard.writeText(badgeSnippet);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6">
      <h3 className="font-heading text-base font-semibold">Before you can schedule</h3>
      <p className="mt-1 text-sm text-muted-foreground">Two quick steps to join this week&apos;s board.</p>

      {error ? <p className="mt-3 text-sm text-destructive">{error}</p> : null}

      {/* Step 1: badge */}
      <div className="mt-4 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground">1 ·</span> Verify your ShipBoost badge
          </span>
          {badgeOk ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
              <ShieldCheck className="size-4" /> Verified
            </span>
          ) : null}
        </div>
        {!badgeOk ? (
          <div className="mt-3 flex flex-col gap-3">
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border bg-muted/40 px-4 py-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={badgePreviewSrc} alt="ShipBoost badge" className="h-12 w-auto" />
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={copySnippet} className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted">
                {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {copied ? "Copied" : "Copy snippet"}
              </button>
              <button type="button" disabled={verifying} onClick={() => void verifyBadge()} className="inline-flex items-center gap-1.5 rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90 disabled:opacity-50">
                {verifying ? "Verifying..." : "Verify badge now"}
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* Step 2: upvotes */}
      <div className="mt-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">
            <span className="text-muted-foreground">2 ·</span> Upvote launches this week
          </span>
          {votesOk ? <Check className="size-4 text-emerald-600" /> : null}
        </div>
        {requiredCount === 0 ? (
          <p className="mt-2 text-xs text-muted-foreground">Waived — no other launches to upvote yet.</p>
        ) : (
          <div className="mt-3 flex items-center gap-3">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div className="h-full bg-foreground transition-all" style={{ width: `${Math.min(100, (eligibleCount / requiredCount) * 100)}%` }} />
            </div>
            <span className="text-xs font-medium text-muted-foreground">{eligibleCount} / {requiredCount}</span>
            {!votesOk ? (
              <button type="button" onClick={() => setModalOpen(true)} className="rounded-md bg-foreground px-2.5 py-1.5 text-xs font-medium text-background hover:opacity-90">
                Upvote now
              </button>
            ) : null}
          </div>
        )}
      </div>

      {modalOpen ? (
        <UpvoteRequirementModal
          submissionId={submissionId}
          tools={tools}
          eligibleCount={eligibleCount}
          requiredCount={requiredCount}
          onProgress={(c) => setEligibleCount(c)}
          onClose={() => setModalOpen(false)}
        />
      ) : null}
    </section>
  );
}
```

- [ ] **Step 4: Run — expect PASS**

Run: `npx vitest run src/components/founder/free-launch-requirements-panel.test.tsx`

- [ ] **Step 5: Commit**

```bash
git add src/components/founder/free-launch-requirements-panel.tsx src/components/founder/free-launch-requirements-panel.test.tsx
git commit -m "feat(founder): free-launch requirements panel (badge verify + upvote progress)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Wire panel into `LaunchSection` + gate Schedule

**Files:** Modify `src/components/founder/launch-section.tsx`

- [ ] **Step 1: Read** the file fully. Note: `selectedLaunch` state ("FREE"|"FEATURED"), the Free card markup, and the free schedule action/button. Identify where the two plan cards end (to insert the panel below them) and the "Schedule free launch" button.

- [ ] **Step 2: Extend props** — add to `LaunchSectionProps`:

```ts
  appUrl: string;
  toolSlug: string;
  badgeSnippet: string;
  badgePreviewSrc: string;
  freeLaunchRequirements: import("@/server/services/free-launch-requirements").FreeLaunchRequirements | null;
```

- [ ] **Step 3: Render the panel + gate the button.** Import the panel and track readiness:

```tsx
import { FreeLaunchRequirementsPanel } from "@/components/founder/free-launch-requirements-panel";
// inside the component:
const [freeRequirementsMet, setFreeRequirementsMet] = useState(false);
```
Below the two plan cards, when `selectedLaunch === "FREE"` and `freeLaunchRequirements` is present, render:

```tsx
{selectedLaunch === "FREE" && freeLaunchRequirements ? (
  <FreeLaunchRequirementsPanel
    submissionId={submissionId}
    badgeSnippet={badgeSnippet}
    badgePreviewSrc={badgePreviewSrc}
    initialBadgeVerification={freeLaunchRequirements.badgeVerification}
    tools={freeLaunchRequirements.boardTools}
    initialEligibleCount={freeLaunchRequirements.eligibleCount}
    requiredCount={freeLaunchRequirements.requiredCount}
    onRequirementsMet={setFreeRequirementsMet}
  />
) : null}
```
On the **free** "Schedule free launch" button add `disabled={selectedLaunch === "FREE" && !freeRequirementsMet}` (combine with any existing disabled condition) and, when disabled for this reason, render a short helper line beneath it: `"Verify your badge and upvote {requiredCount} launches to continue."` Leave the premium path untouched.

- [ ] **Step 4: Verify** — `npx eslint src/components/founder/launch-section.tsx` clean; `npx vitest run src/components/founder` PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/founder/launch-section.tsx
git commit -m "feat(founder): show requirements panel + gate Schedule on free launch

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Feed data from form + page; remove the old sidebar badge card

**Files:** Modify `src/components/founder/submit-product-form.tsx`; Modify `src/app/submit/page.tsx`; Modify `src/app/dashboard/tools/[toolId]/page.tsx`

- [ ] **Step 1: Pass new props from `submit-product-form.tsx` to `<LaunchSection>`.** It already computes `getFreeLaunchBadgeSnippet`, `getBadgePreviewSrc`, `appUrl`, `shipboostToolUrl`, and receives a new `freeLaunchRequirements` prop (added in Step 3). Add to the `<LaunchSection ... />` JSX:

```tsx
        appUrl={appUrl}
        toolSlug={form.requestedSlug}
        badgeSnippet={getFreeLaunchBadgeSnippet(badgeTheme)}
        badgePreviewSrc={getBadgePreviewSrc(badgeTheme)}
        freeLaunchRequirements={freeLaunchRequirements}
```

- [ ] **Step 2: Remove the redundant sidebar badge card.** Delete the `{showBadgeVerifyCard ? ( ... ) : null}` block (the "Add the ShipBoost badge" card, ~1573–1631) — the panel now owns badge verify. Also delete the stale free-launch description paragraph (~1376, the "A verified ShipBoost badge is required for your free launch..." block that lives in the separate scheduled-info area only if it's now redundant — KEEP it if it's the scheduled-confirmation copy; only remove the pre-schedule badge instructions). Confirm `getFreeLaunchBadgeSnippet`, `getBadgePreviewSrc`, `handleVerifyBadge`/`badgeTheme` remain (still used to build the props passed to LaunchSection). Remove now-unused state (`showBadgeVerifyCard`, `copiedBadgeTheme`, etc.) ONLY if nothing else references them (grep first).

- [ ] **Step 3: Add the `freeLaunchRequirements` prop to `SubmitProductFormProps`** and destructuring (default `null`):

```ts
  // in SubmitProductFormProps:
  freeLaunchRequirements?: import("@/server/services/free-launch-requirements").FreeLaunchRequirements | null;
  // in destructuring:
  freeLaunchRequirements = null,
```

- [ ] **Step 4: Compute + pass it from the server pages.** In BOTH `src/app/submit/page.tsx` and `src/app/dashboard/tools/[toolId]/page.tsx`, where `<SubmitProductForm ... initialDraft={...} />` is rendered, compute requirements for a free draft and pass them. Add the import and the value:

```tsx
import { getFreeLaunchRequirements } from "@/server/services/free-launch-requirements";
// where initialDraft is known and the viewer is the owner:
const freeLaunchRequirements =
  initialDraft && initialDraft.submissionType !== "FEATURED_LAUNCH"
    ? await getFreeLaunchRequirements(initialDraft.id, { id: session.user.id })
    : null;
// pass: <SubmitProductForm ... freeLaunchRequirements={freeLaunchRequirements} />
```
Match each page's existing variable names for `initialDraft`/`session` (read the file; `submit/page.tsx` may name the draft differently — adapt).

- [ ] **Step 5: Verify** — `npx eslint` on all three files clean; `npx vitest run src/components/founder` PASS; then manual: `npm run dev`, open `/submit?...&section=launch` for a free draft → panel shows; verify badge + 3 upvotes via the modal → "Schedule free launch" enables; the old sidebar "Add the ShipBoost badge" card is gone.

- [ ] **Step 6: Commit**

```bash
git add src/components/founder/submit-product-form.tsx src/app/submit/page.tsx "src/app/dashboard/tools/[toolId]/page.tsx"
git commit -m "feat(founder): feed free-launch requirements to LaunchSection; remove sidebar badge card

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Co-located requirements panel on launch page → Tasks 8, 9, 10 ✔
- Upvote modal, real votes, live progress → Tasks 4, 5, 7 ✔
- Cap-bypass requirement votes, guarded → Tasks 3, 4 ✔
- Required = min(3, available); 0 → waived (UI + server gate) → Tasks 1, 2, 6, 8 ✔
- Disable Schedule until met → Task 9 ✔
- Remove sidebar badge card + stale description → Task 10 ✔
- Premium untouched; own tool excluded; already-eligible pre-checked; thin/empty board → covered in service (Task 4) + gate (Task 6) + panel (Task 8) ✔

**Placeholder scan:** none — every code step is complete. "Adapt to the page's variable names" notes (Tasks 9, 10) are real integration confirmations, not deferred work.

**Type consistency:** `FreeLaunchRequirements` / `RequirementBoardTool` defined in Task 4 (service) and Task 7 (the modal re-exports `RequirementBoardTool` for component use — both have identical fields: `id, slug, name, tagline, logoUrl, upvoteCount, hasUpvoted`). `castLaunchRequirementVote` returns `{eligibleCount, requiredCount}` (Task 4) consumed in the route (Task 5) and modal (Task 7). `assertFreeLaunchGate` gains optional `requiredBoardUpvotes` (Task 2) used in Task 6. `computeRequiredBoardUpvotes` (Task 1) used in Tasks 4 + 6. Panel props (Task 8) match the `<FreeLaunchRequirementsPanel>` call site (Task 9). LaunchSection new props (Task 9) match the `<LaunchSection>` call site (Task 10).

> Note on the `RequirementBoardTool` type: it is declared in BOTH `free-launch-requirements.ts` (server) and `upvote-requirement-modal.tsx` (client) to avoid importing server code into a client bundle. Keep the two definitions field-identical.
