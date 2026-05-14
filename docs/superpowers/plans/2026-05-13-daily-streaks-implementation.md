# Daily Streaks, Rewards & Lottery — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship cumulative-day streak tracking with milestone rewards, daily lottery (gated at day 25), public leaderboard, and sidebar/modal UI — wired into existing upvote, outbound-click, and tool-page-view signals.

**Architecture:** New `streak-service.ts` owns all streak logic. Three new Prisma models (`UserStreakDay`, `StreakReward`, `LotteryRoll`). Activity recording is idempotent per UTC day, called fire-and-forget from existing services. Vote multipliers reuse the existing `ToolVote.weight` column. Discount codes generated via Dodo Payments `discounts.create()`. UI lives in a persistent left sidebar plus a `/streaks` public page and `/dashboard/rewards` page.

**Tech Stack:** Next.js 16 + React 19 (App Router), Prisma + Postgres, Better Auth, Dodo Payments SDK, Vitest + jsdom + @testing-library, Tailwind.

**Spec:** `docs/superpowers/specs/2026-05-13-daily-streaks-design.md`

---

## File Structure

**Server (new):**
- `src/server/services/streak-service.ts` — core streak/lottery/reward logic
- `src/server/services/streak-service.test.ts` — unit tests
- `src/server/services/streak-rewards-dodo.ts` — Dodo discount code generation
- `src/server/services/streak-rewards-dodo.test.ts`
- `src/server/services/streak-leaderboard.ts` — cached leaderboard query
- `src/app/api/streaks/snapshot/route.ts` — GET current user snapshot
- `src/app/api/streaks/lottery/route.ts` — POST roll lottery
- `src/app/api/streaks/me/visibility/route.ts` — PATCH hideFromLeaderboard
- `src/app/api/streaks/backfill/route.ts` — admin-only one-shot backfill

**Server (modified):**
- `prisma/schema.prisma` — add models + User fields
- `src/server/services/upvote-service.ts` — apply streak multiplier to weight; record activity
- `src/server/services/outbound-click-service.ts` — record activity when signed in
- `src/app/api/polar/webhooks/route.ts` OR Dodo webhook — mark `StreakReward.redeemedAt` (check which payment provider applies — Dodo for Premium Launch)
- `src/app/tools/[slug]/page.tsx` — call recordStreakActivity (fire-and-forget) on view

**UI (new):**
- `src/components/streaks/streak-sidebar.tsx` — streak + lottery cards
- `src/components/streaks/lottery-modal.tsx` — roll/reveal modal
- `src/components/streaks/streak-flames.tsx` — last-5-days flame row
- `src/components/streaks/reward-list.tsx` — for dashboard rewards page
- `src/app/streaks/page.tsx` — public leaderboard
- `src/app/dashboard/rewards/page.tsx` — user's rewards

**UI (modified):**
- `src/app/page.tsx`, `src/app/launches/[board]/page.tsx`, `src/app/feed/page.tsx` (if exists) — slot in `<StreakSidebar />`
- `src/components/founder/founder-dashboard.tsx` — possibly link to /dashboard/rewards
- `src/app/(profile-route)/page.tsx` — show streak badge + avatar border (locate exact path during Task 17)

---

## Task 1: Database migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create migration via `npm run db:migrate -- --name daily_streaks`

- [ ] **Step 1: Add models and enums to schema**

Append to `prisma/schema.prisma`:

```prisma
enum StreakRewardSource {
  MILESTONE
  LOTTERY
}

enum StreakProductScope {
  PREMIUM_LAUNCH
  SPONSOR_PLACEMENT
}

enum LotteryOutcome {
  LOSE
  OFF_5
  OFF_10
  OFF_25
  OFF_50
  OFF_100
}

model UserStreakDay {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  day       DateTime
  createdAt DateTime @default(now())

  @@unique([userId, day])
  @@index([userId])
}

model StreakReward {
  id             String              @id @default(cuid())
  userId         String
  user           User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  source         StreakRewardSource
  milestoneDay   Int?
  productScope   StreakProductScope
  percentOff     Int
  code           String              @unique
  dodoDiscountId String?
  unlockedAt     DateTime            @default(now())
  redeemedAt     DateTime?

  rollsAwarded LotteryRoll[]

  @@index([userId])
}

model LotteryRoll {
  id        String         @id @default(cuid())
  userId    String
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  rollDate  DateTime
  outcome   LotteryOutcome
  rewardId  String?
  reward    StreakReward?  @relation(fields: [rewardId], references: [id], onDelete: SetNull)
  createdAt DateTime       @default(now())

  @@unique([userId, rollDate])
  @@index([outcome, rollDate])
}
```

In the existing `model User` block, add these fields (alongside other relations):

```prisma
  hideFromLeaderboard Boolean         @default(false)
  streakDays          UserStreakDay[]
  streakRewards       StreakReward[]
  lotteryRolls        LotteryRoll[]
```

- [ ] **Step 2: Generate the migration**

Run: `npm run db:migrate -- --name daily_streaks`

Expected: prisma creates `prisma/migrations/<timestamp>_daily_streaks/migration.sql` and applies it. Prisma client regenerates.

- [ ] **Step 3: Verify Prisma client compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`

Expected: no errors mentioning the new models.

- [ ] **Step 4: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "feat(db): add streak/reward/lottery models"
```

---

## Task 2: Time helpers — confirm UTC day boundary

**Files:**
- Read: `src/server/services/time.ts`

- [ ] **Step 1: Confirm `startOfUtcDay` exists**

Run: `grep -n "startOfUtcDay" src/server/services/time.ts`

Expected: function defined that returns `Date.UTC(year, month, date)`. Reuse this throughout the streak service. No new helper needed.

If missing, add:

```ts
export function startOfUtcDay(date: Date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}
```

(No commit needed if it already exists.)

---

## Task 3: Streak service — recordStreakActivity (TDD)

**Files:**
- Create: `src/server/services/streak-service.ts`
- Create: `src/server/services/streak-service.test.ts`

- [ ] **Step 1: Write the failing test**

`src/server/services/streak-service.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/server/db/client";
import { recordStreakActivity } from "./streak-service";

async function makeUser() {
  return prisma.user.create({
    data: { email: `s-${crypto.randomUUID()}@test.local`, name: "Streak Tester" },
  });
}

describe("recordStreakActivity", () => {
  beforeEach(async () => {
    await prisma.lotteryRoll.deleteMany();
    await prisma.streakReward.deleteMany();
    await prisma.userStreakDay.deleteMany();
  });

  it("creates a UserStreakDay for today (UTC) on first activity", async () => {
    const user = await makeUser();
    const result = await recordStreakActivity(user.id);
    expect(result.recorded).toBe(true);
    expect(result.streakCount).toBe(1);
    const rows = await prisma.userStreakDay.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
  });

  it("is idempotent within the same UTC day", async () => {
    const user = await makeUser();
    await recordStreakActivity(user.id);
    const second = await recordStreakActivity(user.id);
    expect(second.recorded).toBe(false);
    expect(second.streakCount).toBe(1);
  });

  it("returns crossed milestone when count hits 3, 5, 10, 25, 50, 100, 250, 365", async () => {
    const user = await makeUser();
    // Seed 4 prior days; 5th call should cross day-5 milestone
    for (let i = 1; i <= 4; i++) {
      await prisma.userStreakDay.create({
        data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
      });
    }
    const result = await recordStreakActivity(user.id);
    expect(result.streakCount).toBe(5);
    expect(result.crossedMilestone).toBe(5);
  });
});
```

- [ ] **Step 2: Run the test (should fail — file does not exist)**

Run: `npx vitest run src/server/services/streak-service.test.ts`

Expected: FAIL — cannot resolve `./streak-service`.

- [ ] **Step 3: Implement minimal service**

`src/server/services/streak-service.ts`:

```ts
import { prisma } from "@/server/db/client";
import { startOfUtcDay } from "@/server/services/time";

export const STREAK_MILESTONES = [3, 5, 10, 25, 50, 100, 250, 365] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export const LOTTERY_UNLOCK_DAY: StreakMilestone = 25;

export interface RecordActivityResult {
  recorded: boolean;
  streakCount: number;
  crossedMilestone: StreakMilestone | null;
}

export async function recordStreakActivity(
  userId: string,
  now: Date = new Date(),
): Promise<RecordActivityResult> {
  const today = startOfUtcDay(now);

  try {
    await prisma.userStreakDay.create({ data: { userId, day: today } });
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      const streakCount = await prisma.userStreakDay.count({ where: { userId } });
      return { recorded: false, streakCount, crossedMilestone: null };
    }
    throw error;
  }

  const streakCount = await prisma.userStreakDay.count({ where: { userId } });
  const crossedMilestone =
    (STREAK_MILESTONES as readonly number[]).includes(streakCount)
      ? (streakCount as StreakMilestone)
      : null;

  return { recorded: true, streakCount, crossedMilestone };
}
```

- [ ] **Step 4: Run the test (should pass)**

Run: `npx vitest run src/server/services/streak-service.test.ts`

Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/streak-service.ts src/server/services/streak-service.test.ts
git commit -m "feat(streaks): add recordStreakActivity service"
```

---

## Task 4: Streak service — getStreakSnapshot + getVoteMultiplier (TDD)

**Files:**
- Modify: `src/server/services/streak-service.ts`
- Modify: `src/server/services/streak-service.test.ts`

- [ ] **Step 1: Add tests**

Append to `streak-service.test.ts`:

```ts
import { getStreakSnapshot, getVoteMultiplier } from "./streak-service";

describe("getVoteMultiplier", () => {
  it("returns 1 below day 5", async () => {
    const user = await makeUser();
    expect(await getVoteMultiplier(user.id)).toBe(1);
  });

  it("returns 2 at day 5, 3 at day 50, 5 at day 100", async () => {
    const user = await makeUser();
    for (let i = 1; i <= 5; i++) {
      await prisma.userStreakDay.create({
        data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
      });
    }
    expect(await getVoteMultiplier(user.id)).toBe(2);
  });
});

describe("getStreakSnapshot", () => {
  it("returns nextMilestone and lottery state", async () => {
    const user = await makeUser();
    for (let i = 1; i <= 3; i++) {
      await prisma.userStreakDay.create({
        data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
      });
    }
    const snap = await getStreakSnapshot(user.id);
    expect(snap.streakCount).toBe(3);
    expect(snap.nextMilestone).toBe(5);
    expect(snap.lotteryUnlocked).toBe(false);
    expect(snap.activeMultiplier).toBe(1);
  });
});
```

- [ ] **Step 2: Run tests (should fail)**

Run: `npx vitest run src/server/services/streak-service.test.ts -t "getVoteMultiplier|getStreakSnapshot"`

Expected: FAIL — imports undefined.

- [ ] **Step 3: Implement**

Append to `src/server/services/streak-service.ts`:

```ts
const MULTIPLIER_TIERS: Array<{ minDays: number; multiplier: number }> = [
  { minDays: 100, multiplier: 5 },
  { minDays: 50, multiplier: 3 },
  { minDays: 5, multiplier: 2 },
];

export async function getVoteMultiplier(userId: string): Promise<number> {
  const count = await prisma.userStreakDay.count({ where: { userId } });
  for (const tier of MULTIPLIER_TIERS) {
    if (count >= tier.minDays) return tier.multiplier;
  }
  return 1;
}

export interface StreakSnapshot {
  streakCount: number;
  nextMilestone: StreakMilestone | null;
  activeMultiplier: number;
  lotteryUnlocked: boolean;
  last5Days: Array<{ day: string; active: boolean }>;
}

export async function getStreakSnapshot(
  userId: string,
  now: Date = new Date(),
): Promise<StreakSnapshot> {
  const today = startOfUtcDay(now);
  const fiveDaysAgo = new Date(today.getTime() - 4 * 86_400_000);

  const [streakCount, recentDays] = await Promise.all([
    prisma.userStreakDay.count({ where: { userId } }),
    prisma.userStreakDay.findMany({
      where: { userId, day: { gte: fiveDaysAgo } },
      select: { day: true },
    }),
  ]);

  const activeSet = new Set(recentDays.map((r) => r.day.toISOString()));
  const last5Days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(today.getTime() - (4 - i) * 86_400_000);
    return { day: d.toISOString(), active: activeSet.has(d.toISOString()) };
  });

  const nextMilestone =
    STREAK_MILESTONES.find((m) => m > streakCount) ?? null;

  let activeMultiplier = 1;
  for (const tier of MULTIPLIER_TIERS) {
    if (streakCount >= tier.minDays) {
      activeMultiplier = tier.multiplier;
      break;
    }
  }

  return {
    streakCount,
    nextMilestone,
    activeMultiplier,
    lotteryUnlocked: streakCount >= LOTTERY_UNLOCK_DAY,
    last5Days,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/server/services/streak-service.test.ts`

Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/streak-service.ts src/server/services/streak-service.test.ts
git commit -m "feat(streaks): add snapshot + vote multiplier helpers"
```

---

## Task 5: Dodo discount code generation (TDD with mock)

**Files:**
- Create: `src/server/services/streak-rewards-dodo.ts`
- Create: `src/server/services/streak-rewards-dodo.test.ts`

**Verification required during implementation:** Open `node_modules/dodopayments/dist/resources/discounts.d.ts` (or equivalent) to confirm the create method signature. If the SDK shape differs from what's used below, adjust the wrapper but keep the same exported interface.

- [ ] **Step 1: Write the failing test**

`src/server/services/streak-rewards-dodo.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";
import { createDodoStreakDiscount } from "./streak-rewards-dodo";

vi.mock("@/server/dodo", () => ({
  getDodoClient: () => ({
    discounts: {
      create: vi.fn(async (input: unknown) => ({
        discount_id: "disc_test_123",
        code: (input as { code: string }).code,
      })),
    },
  }),
}));

describe("createDodoStreakDiscount", () => {
  it("generates a single-use code scoped to a product", async () => {
    const result = await createDodoStreakDiscount({
      userId: "user_abc",
      percentOff: 25,
      productScope: "PREMIUM_LAUNCH",
    });
    expect(result.dodoDiscountId).toBe("disc_test_123");
    expect(result.code).toMatch(/^STREAK25-/);
  });
});
```

- [ ] **Step 2: Run test (should fail)**

Run: `npx vitest run src/server/services/streak-rewards-dodo.test.ts`

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

`src/server/services/streak-rewards-dodo.ts`:

```ts
import { customAlphabet } from "nanoid";
import { getDodoClient } from "@/server/dodo";
import { env } from "@/lib/env";

const nano = customAlphabet("ABCDEFGHJKMNPQRSTUVWXYZ23456789", 8);

export type StreakProductScope = "PREMIUM_LAUNCH" | "SPONSOR_PLACEMENT";

export interface CreateDiscountInput {
  userId: string;
  percentOff: number;
  productScope: StreakProductScope;
}

export interface CreatedDiscount {
  code: string;
  dodoDiscountId: string;
}

function getProductId(scope: StreakProductScope): string {
  if (scope === "PREMIUM_LAUNCH") return env.DODO_PREMIUM_LAUNCH_PRODUCT_ID;
  return env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID;
}

export async function createDodoStreakDiscount({
  userId,
  percentOff,
  productScope,
}: CreateDiscountInput): Promise<CreatedDiscount> {
  const code = `STREAK${percentOff}-${nano()}`;
  const dodo = getDodoClient();
  const discount = await dodo.discounts.create({
    code,
    amount: percentOff * 100, // Dodo uses basis points: 2500 = 25%
    type: "percentage",
    usage_limit: 1,
    restricted_to: [getProductId(productScope)],
    metadata: { userId, source: "streak" },
  });
  return { code, dodoDiscountId: discount.discount_id ?? discount.id };
}
```

If `env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID` doesn't exist yet, add it to `src/lib/env.ts` (Zod schema) and document in `.env.example`.

- [ ] **Step 4: Run test (should pass)**

Run: `npx vitest run src/server/services/streak-rewards-dodo.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/streak-rewards-dodo.ts src/server/services/streak-rewards-dodo.test.ts src/lib/env.ts
git commit -m "feat(streaks): add Dodo discount code generation"
```

---

## Task 6: Milestone reward unlocking (TDD)

**Files:**
- Modify: `src/server/services/streak-service.ts`
- Modify: `src/server/services/streak-service.test.ts`

- [ ] **Step 1: Add test**

```ts
import { unlockMilestoneReward } from "./streak-service";

vi.mock("@/server/services/streak-rewards-dodo", () => ({
  createDodoStreakDiscount: vi.fn(async ({ percentOff }) => ({
    code: `STREAK${percentOff}-TESTCODE`,
    dodoDiscountId: `disc_${percentOff}`,
  })),
}));

describe("unlockMilestoneReward", () => {
  it("creates a StreakReward for day-10 (10% off Premium Launch)", async () => {
    const user = await makeUser();
    const reward = await unlockMilestoneReward(user.id, 10);
    expect(reward).not.toBeNull();
    expect(reward!.percentOff).toBe(10);
    expect(reward!.productScope).toBe("PREMIUM_LAUNCH");
    const dbRow = await prisma.streakReward.findUnique({ where: { id: reward!.id } });
    expect(dbRow?.code).toMatch(/^STREAK10-/);
  });

  it("returns null for cosmetic-only milestones (day 3)", async () => {
    const user = await makeUser();
    const reward = await unlockMilestoneReward(user.id, 3);
    expect(reward).toBeNull();
  });

  it("does not duplicate rewards if called twice for same milestone", async () => {
    const user = await makeUser();
    await unlockMilestoneReward(user.id, 10);
    const second = await unlockMilestoneReward(user.id, 10);
    expect(second).toBeNull();
    const all = await prisma.streakReward.findMany({ where: { userId: user.id } });
    expect(all).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run test — should fail**

Run: `npx vitest run src/server/services/streak-service.test.ts -t unlockMilestoneReward`

Expected: FAIL — function undefined.

- [ ] **Step 3: Implement**

Add to `streak-service.ts`:

```ts
import { createDodoStreakDiscount } from "./streak-rewards-dodo";

interface MilestoneRewardConfig {
  productScope: "PREMIUM_LAUNCH" | "SPONSOR_PLACEMENT";
  percentOff: number;
}

const MILESTONE_REWARDS: Partial<Record<StreakMilestone, MilestoneRewardConfig>> = {
  10: { productScope: "PREMIUM_LAUNCH", percentOff: 10 },
  25: { productScope: "PREMIUM_LAUNCH", percentOff: 25 },
  100: { productScope: "PREMIUM_LAUNCH", percentOff: 50 },
  250: { productScope: "SPONSOR_PLACEMENT", percentOff: 50 },
  365: { productScope: "PREMIUM_LAUNCH", percentOff: 100 },
};

export async function unlockMilestoneReward(
  userId: string,
  milestone: StreakMilestone,
) {
  const config = MILESTONE_REWARDS[milestone];
  if (!config) return null;

  const existing = await prisma.streakReward.findFirst({
    where: { userId, source: "MILESTONE", milestoneDay: milestone },
  });
  if (existing) return null;

  const { code, dodoDiscountId } = await createDodoStreakDiscount({
    userId,
    percentOff: config.percentOff,
    productScope: config.productScope,
  });

  return prisma.streakReward.create({
    data: {
      userId,
      source: "MILESTONE",
      milestoneDay: milestone,
      productScope: config.productScope,
      percentOff: config.percentOff,
      code,
      dodoDiscountId,
    },
  });
}
```

- [ ] **Step 4: Wire into `recordStreakActivity`**

Modify the existing `recordStreakActivity` return path to call `unlockMilestoneReward`:

```ts
// After computing crossedMilestone, before returning:
if (crossedMilestone) {
  await unlockMilestoneReward(userId, crossedMilestone).catch((err) => {
    console.error("[shipboost streak] milestone reward failed", err);
  });
}
```

- [ ] **Step 5: Run all streak-service tests**

Run: `npx vitest run src/server/services/streak-service.test.ts`

Expected: all passing.

- [ ] **Step 6: Commit**

```bash
git add src/server/services/streak-service.ts src/server/services/streak-service.test.ts
git commit -m "feat(streaks): unlock milestone rewards on crossing"
```

---

## Task 7: Lottery roll service (TDD)

**Files:**
- Modify: `src/server/services/streak-service.ts`
- Modify: `src/server/services/streak-service.test.ts`

- [ ] **Step 1: Add tests**

```ts
import { rollLottery, LOTTERY_ODDS } from "./streak-service";

describe("rollLottery", () => {
  it("rejects if streak < 25", async () => {
    const user = await makeUser();
    await expect(rollLottery(user.id)).rejects.toThrow(/not unlocked/i);
  });

  it("creates one LotteryRoll per UTC day (idempotent)", async () => {
    const user = await makeUser();
    for (let i = 1; i <= 25; i++) {
      await prisma.userStreakDay.create({
        data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
      });
    }
    const first = await rollLottery(user.id);
    const second = await rollLottery(user.id);
    expect(second.alreadyRolled).toBe(true);
    expect(second.outcome).toBe(first.outcome);
    const rows = await prisma.lotteryRoll.findMany({ where: { userId: user.id } });
    expect(rows).toHaveLength(1);
  });

  it("downgrades OFF_100 to OFF_50 when weekly jackpot cap is hit", async () => {
    // Force RNG by patching a seam: outcome resolver accepts an optional seed.
    const user = await makeUser();
    for (let i = 1; i <= 25; i++) {
      await prisma.userStreakDay.create({
        data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
      });
    }
    // Seed an existing jackpot this week
    await prisma.lotteryRoll.create({
      data: {
        userId: (await makeUser()).id,
        rollDate: startOfUtcDay(new Date()),
        outcome: "OFF_100",
      },
    });
    const result = await rollLottery(user.id, { forceOutcome: "OFF_100" });
    expect(result.outcome).toBe("OFF_50");
  });

  it("odds table sums to 1.0", () => {
    const total = LOTTERY_ODDS.reduce((acc, o) => acc + o.probability, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});
```

- [ ] **Step 2: Run — should fail**

Run: `npx vitest run src/server/services/streak-service.test.ts -t rollLottery`

Expected: FAIL.

- [ ] **Step 3: Implement**

Add to `streak-service.ts`:

```ts
import { startOfUtcDay } from "@/server/services/time";

export const LOTTERY_ODDS: Array<{ outcome: "LOSE" | "OFF_5" | "OFF_10" | "OFF_25" | "OFF_50" | "OFF_100"; probability: number }> = [
  { outcome: "LOSE", probability: 0.70 },
  { outcome: "OFF_5", probability: 0.20 },
  { outcome: "OFF_10", probability: 0.06 },
  { outcome: "OFF_25", probability: 0.025 },
  { outcome: "OFF_50", probability: 0.01 },
  { outcome: "OFF_100", probability: 0.005 },
];

const PERCENT_BY_OUTCOME: Record<string, number> = {
  OFF_5: 5, OFF_10: 10, OFF_25: 25, OFF_50: 50, OFF_100: 100,
};

function rollOutcome(): (typeof LOTTERY_ODDS)[number]["outcome"] {
  const r = Math.random();
  let acc = 0;
  for (const entry of LOTTERY_ODDS) {
    acc += entry.probability;
    if (r < acc) return entry.outcome;
  }
  return "LOSE";
}

function startOfIsoWeek(date: Date) {
  const d = startOfUtcDay(date);
  const day = d.getUTCDay();
  const offset = day === 0 ? 6 : day - 1;
  return new Date(d.getTime() - offset * 86_400_000);
}

export interface LotteryRollResult {
  outcome: (typeof LOTTERY_ODDS)[number]["outcome"];
  alreadyRolled: boolean;
  reward: { id: string; code: string; percentOff: number; productScope: string } | null;
}

export async function rollLottery(
  userId: string,
  options: { now?: Date; forceOutcome?: (typeof LOTTERY_ODDS)[number]["outcome"] } = {},
): Promise<LotteryRollResult> {
  const now = options.now ?? new Date();
  const today = startOfUtcDay(now);

  const streakCount = await prisma.userStreakDay.count({ where: { userId } });
  if (streakCount < LOTTERY_UNLOCK_DAY) {
    throw new Error("Lottery is not unlocked yet");
  }

  const existing = await prisma.lotteryRoll.findUnique({
    where: { userId_rollDate: { userId, rollDate: today } },
    include: { reward: true },
  });
  if (existing) {
    return {
      outcome: existing.outcome,
      alreadyRolled: true,
      reward: existing.reward
        ? {
            id: existing.reward.id,
            code: existing.reward.code,
            percentOff: existing.reward.percentOff,
            productScope: existing.reward.productScope,
          }
        : null,
    };
  }

  let outcome = options.forceOutcome ?? rollOutcome();

  if (outcome === "OFF_100") {
    const weekStart = startOfIsoWeek(now);
    const jackpotsThisWeek = await prisma.lotteryRoll.count({
      where: { outcome: "OFF_100", rollDate: { gte: weekStart } },
    });
    if (jackpotsThisWeek >= 1) outcome = "OFF_50";
  }

  let reward = null;
  if (outcome !== "LOSE") {
    const percentOff = PERCENT_BY_OUTCOME[outcome];
    const { code, dodoDiscountId } = await createDodoStreakDiscount({
      userId,
      percentOff,
      productScope: "PREMIUM_LAUNCH",
    });
    reward = await prisma.streakReward.create({
      data: {
        userId,
        source: "LOTTERY",
        productScope: "PREMIUM_LAUNCH",
        percentOff,
        code,
        dodoDiscountId,
      },
    });
  }

  await prisma.lotteryRoll.create({
    data: { userId, rollDate: today, outcome, rewardId: reward?.id ?? null },
  });

  return {
    outcome,
    alreadyRolled: false,
    reward: reward
      ? { id: reward.id, code: reward.code, percentOff: reward.percentOff, productScope: reward.productScope }
      : null,
  };
}
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/server/services/streak-service.test.ts`

Expected: all passing.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/streak-service.ts src/server/services/streak-service.test.ts
git commit -m "feat(streaks): add lottery roll service with jackpot cap"
```

---

## Task 8: Integrate streak recording into upvote service

**Files:**
- Modify: `src/server/services/upvote-service.ts`
- Modify: `src/server/services/upvote-service.test.ts`

- [ ] **Step 1: Add test for multiplier applied to vote weight**

In `upvote-service.test.ts`:

```ts
import { prisma } from "@/server/db/client";

it("applies streak multiplier to vote weight for 5-day-streak user", async () => {
  // create user, tool, 5 streak days
  const user = await prisma.user.create({ data: { email: `m-${crypto.randomUUID()}@t.t`, name: "x" } });
  const tool = await prisma.tool.create({ data: { /* minimum fields */ } });
  for (let i = 1; i <= 5; i++) {
    await prisma.userStreakDay.create({
      data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
    });
  }
  await castUpvote({ userId: user.id, role: "USER", toolId: tool.id });
  const vote = await prisma.toolVote.findFirst({ where: { userId: user.id, toolId: tool.id } });
  expect(vote?.weight).toBe(2);
});
```

(Adapt to existing test fixtures in the file. If `castUpvote` isn't the exported function name, use whatever exists.)

- [ ] **Step 2: Run test — should fail**

Run: `npx vitest run src/server/services/upvote-service.test.ts -t multiplier`

Expected: FAIL — vote weight will be 1.

- [ ] **Step 3: Modify upvote service**

In `upvote-service.ts`, replace `getVoteWeightForRole`:

```ts
import { getVoteMultiplier, recordStreakActivity } from "./streak-service";

async function resolveVoteWeight(userId: string, role: UserRole): Promise<number> {
  if (role === "ADMIN") return ADMIN_VOTE_WEIGHT;
  return getVoteMultiplier(userId);
}
```

At the call site where `ToolVote` is created, swap `getVoteWeightForRole(role)` for `await resolveVoteWeight(user.id, role)`.

Immediately after the vote is created, fire-and-forget the streak record:

```ts
void recordStreakActivity(user.id).catch((err) => {
  console.error("[shipboost streak] record activity (vote) failed", err);
});
```

- [ ] **Step 4: Run tests**

Run: `npx vitest run src/server/services/upvote-service.test.ts`

Expected: new test passes, existing tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/server/services/upvote-service.ts src/server/services/upvote-service.test.ts
git commit -m "feat(streaks): apply vote multiplier and record streak activity on vote"
```

---

## Task 9: Integrate streak recording into outbound clicks + tool page views

**Files:**
- Modify: `src/server/services/outbound-click-service.ts`
- Modify: `src/app/tools/[slug]/page.tsx` (or the actual tool detail page path — confirm with `find src/app -path '*tools*' -name 'page.tsx'`)

- [ ] **Step 1: Locate outbound click recording site**

Run: `grep -n "logClick\|recordClick\|outboundClick" src/server/services/outbound-click-service.ts`

Find the function that creates the click log row.

- [ ] **Step 2: Add streak recording in outbound-click-service**

After the click is logged, if `session?.user?.id` is present:

```ts
import { recordStreakActivity } from "@/server/services/streak-service";

// after click log created:
if (userId) {
  void recordStreakActivity(userId).catch((err) => {
    console.error("[shipboost streak] record activity (outbound) failed", err);
  });
}
```

- [ ] **Step 3: Locate tool detail page**

Run: `find src/app -path '*tools*' -name 'page.tsx' | head`

In the server component, after auth session resolution and before render:

```tsx
import { recordStreakActivity } from "@/server/services/streak-service";

const session = await getSessionFromRequest();
if (session?.user.id) {
  void recordStreakActivity(session.user.id).catch(() => {});
}
```

- [ ] **Step 4: Build to confirm no SSR errors**

Run: `npm run build 2>&1 | tail -30`

Expected: build succeeds. Streak activity calls don't block render (fire-and-forget).

- [ ] **Step 5: Commit**

```bash
git add src/server/services/outbound-click-service.ts src/app/tools
git commit -m "feat(streaks): record activity on outbound clicks and tool page views"
```

---

## Task 10: API routes — snapshot, lottery roll, visibility

**Files:**
- Create: `src/app/api/streaks/snapshot/route.ts`
- Create: `src/app/api/streaks/lottery/route.ts`
- Create: `src/app/api/streaks/me/visibility/route.ts`

- [ ] **Step 1: Snapshot route**

```ts
import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/server/auth/session";
import { getStreakSnapshot } from "@/server/services/streak-service";
import { errorResponse, jsonResponse } from "@/server/http/response";

export async function GET(req: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session?.user) return errorResponse(401, "Sign in required");
  const snapshot = await getStreakSnapshot(session.user.id);
  return jsonResponse(snapshot);
}
```

- [ ] **Step 2: Lottery route**

```ts
import { NextRequest } from "next/server";
import { getSessionFromRequest } from "@/server/auth/session";
import { rollLottery } from "@/server/services/streak-service";
import { errorResponse, jsonResponse } from "@/server/http/response";

export async function POST(req: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session?.user) return errorResponse(401, "Sign in required");
  try {
    const result = await rollLottery(session.user.id);
    return jsonResponse(result);
  } catch (err) {
    return errorResponse(400, err instanceof Error ? err.message : "Roll failed");
  }
}
```

- [ ] **Step 3: Visibility route**

```ts
import { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionFromRequest } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { errorResponse, jsonResponse } from "@/server/http/response";

const Body = z.object({ hideFromLeaderboard: z.boolean() });

export async function PATCH(req: NextRequest) {
  const session = await getSessionFromRequest();
  if (!session?.user) return errorResponse(401, "Sign in required");
  const body = Body.parse(await req.json());
  await prisma.user.update({
    where: { id: session.user.id },
    data: { hideFromLeaderboard: body.hideFromLeaderboard },
  });
  return jsonResponse({ ok: true });
}
```

- [ ] **Step 4: Smoke test with curl**

Run dev server: `npm run dev &`
Wait, then: `curl -s http://localhost:3000/api/streaks/snapshot` — expect 401.
Kill the dev server.

- [ ] **Step 5: Commit**

```bash
git add src/app/api/streaks
git commit -m "feat(streaks): add snapshot, lottery, visibility API routes"
```

---

## Task 11: Leaderboard service + page

**Files:**
- Create: `src/server/services/streak-leaderboard.ts`
- Create: `src/app/streaks/page.tsx`

- [ ] **Step 1: Implement leaderboard service**

```ts
import { unstable_cache } from "next/cache";
import { prisma } from "@/server/db/client";

export interface LeaderboardEntry {
  userId: string;
  username: string | null;
  name: string | null;
  avatarUrl: string | null;
  streakCount: number;
  rank: number;
}

async function loadTop(limit: number): Promise<LeaderboardEntry[]> {
  const rows = await prisma.$queryRaw<Array<{
    userId: string;
    username: string | null;
    name: string | null;
    avatarUrl: string | null;
    streakCount: bigint;
  }>>`
    SELECT u.id as "userId", u.username, u.name, u."image" as "avatarUrl",
           COUNT(s.id) as "streakCount"
    FROM "User" u
    JOIN "UserStreakDay" s ON s."userId" = u.id
    WHERE u."hideFromLeaderboard" = false
    GROUP BY u.id
    ORDER BY COUNT(s.id) DESC, u."createdAt" ASC
    LIMIT ${limit}
  `;
  return rows.map((r, i) => ({
    userId: r.userId,
    username: r.username,
    name: r.name,
    avatarUrl: r.avatarUrl,
    streakCount: Number(r.streakCount),
    rank: i + 1,
  }));
}

export const getStreakLeaderboard = unstable_cache(
  async (limit = 50) => loadTop(limit),
  ["streak-leaderboard", "v1"],
  { revalidate: 300 },
);

export async function getUserRank(userId: string): Promise<LeaderboardEntry | null> {
  const myCount = await prisma.userStreakDay.count({ where: { userId } });
  if (myCount === 0) return null;
  const ahead = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM (
      SELECT u.id, COUNT(s.id) as c
      FROM "User" u
      JOIN "UserStreakDay" s ON s."userId" = u.id
      WHERE u."hideFromLeaderboard" = false AND u.id != ${userId}
      GROUP BY u.id
      HAVING COUNT(s.id) > ${myCount}
    ) sub
  `;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, username: true, name: true, image: true },
  });
  if (!user) return null;
  return {
    userId: user.id,
    username: user.username,
    name: user.name,
    avatarUrl: user.image,
    streakCount: myCount,
    rank: Number(ahead[0].count) + 1,
  };
}
```

(Adjust column names — `image` vs `avatarUrl` — based on actual `User` schema. Run `grep "image\|avatarUrl" prisma/schema.prisma` to confirm.)

- [ ] **Step 2: Implement `/streaks` page**

```tsx
import { getStreakLeaderboard, getUserRank } from "@/server/services/streak-leaderboard";
import { getSessionFromRequest } from "@/server/auth/session";

export default async function StreaksPage() {
  const [top, session] = await Promise.all([
    getStreakLeaderboard(50),
    getSessionFromRequest(),
  ]);
  const myRank = session?.user
    ? await getUserRank(session.user.id)
    : null;
  const inTop = myRank && top.some((e) => e.userId === myRank.userId);

  return (
    <main className="mx-auto max-w-3xl py-10 px-4">
      <h1 className="text-3xl font-bold mb-2">Streaks Leaderboard</h1>
      <p className="text-muted-foreground mb-8">
        The most consistent ShipBoost users. Updated every 5 minutes.
      </p>
      <ol className="space-y-2">
        {top.map((entry) => (
          <li key={entry.userId} className="flex items-center gap-3 p-3 rounded-md border">
            <span className="w-8 text-right text-sm text-muted-foreground">#{entry.rank}</span>
            {/* avatar + name + streakCount */}
            <span className="font-medium">{entry.username ?? entry.name}</span>
            <span className="ml-auto text-orange-500 font-semibold">{entry.streakCount} day streak</span>
          </li>
        ))}
      </ol>
      {myRank && !inTop && (
        <div className="mt-6 p-3 rounded-md border bg-muted">
          <span className="text-sm">Your rank: #{myRank.rank} — {myRank.streakCount} day streak</span>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 3: Verify build**

Run: `npm run build 2>&1 | tail -20`

Expected: builds. Visit `/streaks` in dev to eyeball.

- [ ] **Step 4: Commit**

```bash
git add src/server/services/streak-leaderboard.ts src/app/streaks
git commit -m "feat(streaks): add leaderboard service and /streaks page"
```

---

## Task 12: Streak sidebar widget (UI)

**Files:**
- Create: `src/components/streaks/streak-sidebar.tsx`
- Create: `src/components/streaks/streak-flames.tsx`
- Create: `src/components/streaks/streak-sidebar.test.tsx`

- [ ] **Step 1: Implement flames component**

```tsx
import { Flame } from "lucide-react";

export function StreakFlames({ days }: { days: Array<{ active: boolean }> }) {
  return (
    <div className="flex gap-1.5" aria-label="Last 5 days activity">
      {days.map((d, i) => (
        <Flame
          key={i}
          size={20}
          className={d.active ? "text-orange-500 fill-orange-500" : "text-muted-foreground/30"}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement sidebar component (client)**

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { StreakFlames } from "./streak-flames";
import { LotteryModal } from "./lottery-modal";

interface Snapshot {
  streakCount: number;
  nextMilestone: number | null;
  activeMultiplier: number;
  lotteryUnlocked: boolean;
  last5Days: Array<{ day: string; active: boolean }>;
}

interface TodayRoll {
  outcome: string;
  reward: { code: string; percentOff: number; productScope: string } | null;
}

export function StreakSidebar() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [todayRoll, setTodayRoll] = useState<TodayRoll | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    fetch("/api/streaks/snapshot")
      .then((r) => (r.ok ? r.json() : null))
      .then(setSnapshot);
  }, []);

  if (!snapshot) return null;

  const handleRoll = async () => {
    const res = await fetch("/api/streaks/lottery", { method: "POST" });
    if (!res.ok) return;
    const data = await res.json();
    setTodayRoll(data);
    setModalOpen(true);
  };

  return (
    <aside className="flex flex-col gap-4 w-full max-w-xs">
      <div className="rounded-lg border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-orange-500">
            {snapshot.streakCount} DAY STREAK
          </h3>
        </div>
        <StreakFlames days={snapshot.last5Days} />
        {snapshot.nextMilestone && (
          <div className="mt-3 text-sm">
            <p className="text-muted-foreground">Next reward:</p>
            <p>at {snapshot.nextMilestone} days</p>
            <div className="mt-1 h-2 bg-muted rounded">
              <div
                className="h-2 bg-orange-500 rounded"
                style={{ width: `${(snapshot.streakCount / snapshot.nextMilestone) * 100}%` }}
              />
            </div>
          </div>
        )}
        <Link href="/streaks" className="text-sm text-orange-500 mt-3 inline-block">
          Check the leaderboard →
        </Link>
      </div>

      <div className="rounded-lg border bg-card p-4">
        <h3 className="font-semibold mb-3">Daily Lottery</h3>
        {!snapshot.lotteryUnlocked ? (
          <div className="text-sm text-muted-foreground">
            🔒 Unlocks at 25-day streak
          </div>
        ) : todayRoll ? (
          <div>
            <p className="text-sm mb-2">Today's Draw: <span className="text-green-500">Played ✓</span></p>
            <button onClick={() => setModalOpen(true)} className="text-sm underline">
              View today's result
            </button>
          </div>
        ) : (
          <button
            onClick={handleRoll}
            className="w-full rounded-md bg-orange-500 text-white py-2 font-medium"
          >
            Try Your Luck! 🎰
          </button>
        )}
        <Link href="/dashboard/rewards" className="text-sm text-orange-500 mt-3 inline-block">
          View My Rewards →
        </Link>
      </div>

      {modalOpen && todayRoll && (
        <LotteryModal roll={todayRoll} onClose={() => setModalOpen(false)} />
      )}
    </aside>
  );
}
```

- [ ] **Step 3: Component test**

```tsx
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { StreakSidebar } from "./streak-sidebar";

describe("StreakSidebar", () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url) => {
      if (url === "/api/streaks/snapshot") {
        return {
          ok: true,
          json: async () => ({
            streakCount: 3,
            nextMilestone: 5,
            activeMultiplier: 1,
            lotteryUnlocked: false,
            last5Days: Array(5).fill({ day: "", active: false }),
          }),
        };
      }
      return { ok: false };
    }) as unknown as typeof fetch;
  });

  it("renders streak count and locked lottery", async () => {
    render(<StreakSidebar />);
    expect(await screen.findByText(/3 DAY STREAK/)).toBeInTheDocument();
    expect(await screen.findByText(/Unlocks at 25-day streak/)).toBeInTheDocument();
  });
});
```

- [ ] **Step 4: Run component test**

Run: `npx vitest run src/components/streaks/streak-sidebar.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/streaks
git commit -m "feat(streaks): add sidebar widget with streak + lottery cards"
```

---

## Task 13: Lottery modal

**Files:**
- Create: `src/components/streaks/lottery-modal.tsx`

- [ ] **Step 1: Implement modal**

```tsx
"use client";

import { useEffect, useState } from "react";

interface Props {
  roll: {
    outcome: string;
    reward: { code: string; percentOff: number; productScope: string } | null;
  };
  onClose: () => void;
}

export function LotteryModal({ roll, onClose }: Props) {
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setRevealed(true), 1500);
    return () => clearTimeout(t);
  }, []);

  const isLose = roll.outcome === "LOSE";
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
    >
      <div className="bg-card rounded-lg p-8 max-w-md w-full mx-4 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 text-muted-foreground"
        >
          ✕
        </button>
        <h2 className="text-xl font-bold mb-1">Daily Lottery</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Try your luck and win exclusive rewards!
        </p>
        {!revealed ? (
          <div className="text-center py-12 animate-pulse">Rolling…</div>
        ) : isLose ? (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">❌</div>
            <p className="text-red-500 font-bold mb-1">You lost</p>
            <p className="text-sm">
              Sorry, you didn't win anything today. Come back tomorrow 🐱
            </p>
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-green-500 font-bold mb-2">
              Congrats! You won {roll.reward!.percentOff}% off Premium Launch
            </p>
            <code className="block bg-muted p-2 rounded text-sm my-3">
              {roll.reward!.code}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(roll.reward!.code)}
              className="text-sm underline"
            >
              Copy code
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/streaks/lottery-modal.tsx
git commit -m "feat(streaks): add lottery roll/reveal modal"
```

---

## Task 14: Slot sidebar into home, launches, and feed pages

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `src/app/launches/[board]/page.tsx`
- Modify: `src/app/feed/page.tsx` (if it exists)

- [ ] **Step 1: Check existing page layouts**

Run: `grep -n "aside\|sidebar\|grid" src/app/page.tsx | head -10`

If pages have a multi-column layout, render `<StreakSidebar />` in the left column. If not, this task includes adding a grid wrapper. Do the minimum needed.

- [ ] **Step 2: Add the sidebar**

```tsx
import { StreakSidebar } from "@/components/streaks/streak-sidebar";

// inside the layout where you want it:
<div className="grid grid-cols-[auto_1fr] gap-6">
  <StreakSidebar />
  <div>{/* existing page content */}</div>
</div>
```

Use Next.js 16 conventions — keep the page as a Server Component, the sidebar is a Client Component already.

- [ ] **Step 3: Manual verify**

Run: `npm run dev` and visit `/`, `/launches/<some board>`, sign in. Sidebar should render with "0 DAY STREAK" for a new user. Cast an upvote — refresh — should show "1 DAY STREAK".

- [ ] **Step 4: Commit**

```bash
git add src/app
git commit -m "feat(streaks): slot StreakSidebar into home/launches/feed"
```

---

## Task 15: Auto-open lottery modal on first activity of the day

**Files:**
- Modify: `src/components/streaks/streak-sidebar.tsx`

- [ ] **Step 1: Modify snapshot endpoint to include today's roll status**

In `src/app/api/streaks/snapshot/route.ts` — extend the response:

```ts
import { prisma } from "@/server/db/client";
import { startOfUtcDay } from "@/server/services/time";

// inside GET handler, after getStreakSnapshot:
const todayRoll = snapshot.lotteryUnlocked
  ? await prisma.lotteryRoll.findUnique({
      where: { userId_rollDate: { userId: session.user.id, rollDate: startOfUtcDay(new Date()) } },
      include: { reward: true },
    })
  : null;

return jsonResponse({ ...snapshot, todayRoll });
```

- [ ] **Step 2: In sidebar, auto-roll if unlocked + no roll today**

In `StreakSidebar`:

```tsx
useEffect(() => {
  if (snapshot?.lotteryUnlocked && !todayRoll) {
    handleRoll(); // also opens the modal
  }
}, [snapshot, todayRoll]);
```

Guard against re-running (use a ref or localStorage key `streak-rolled-${todayUTC}` so dismissing doesn't re-trigger within the same render cycle).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/streaks/snapshot src/components/streaks
git commit -m "feat(streaks): auto-open lottery modal on first activity"
```

---

## Task 16: Dashboard rewards page

**Files:**
- Create: `src/app/dashboard/rewards/page.tsx`
- Create: `src/components/streaks/reward-list.tsx`

- [ ] **Step 1: Implement page (server component)**

```tsx
import { getSessionFromRequest } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { RewardList } from "@/components/streaks/reward-list";
import { redirect } from "next/navigation";

export default async function RewardsPage() {
  const session = await getSessionFromRequest();
  if (!session?.user) redirect("/sign-in");
  const rewards = await prisma.streakReward.findMany({
    where: { userId: session.user.id },
    orderBy: { unlockedAt: "desc" },
  });
  return (
    <main className="mx-auto max-w-2xl py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Rewards</h1>
      <RewardList rewards={rewards.map((r) => ({
        id: r.id,
        code: r.code,
        percentOff: r.percentOff,
        productScope: r.productScope,
        source: r.source,
        unlockedAt: r.unlockedAt.toISOString(),
        redeemedAt: r.redeemedAt?.toISOString() ?? null,
      }))} />
    </main>
  );
}
```

- [ ] **Step 2: Implement RewardList (client for copy button)**

```tsx
"use client";

interface RewardItem {
  id: string;
  code: string;
  percentOff: number;
  productScope: string;
  source: string;
  unlockedAt: string;
  redeemedAt: string | null;
}

export function RewardList({ rewards }: { rewards: RewardItem[] }) {
  if (rewards.length === 0) {
    return <p className="text-muted-foreground">No rewards yet — keep your streak going.</p>;
  }
  return (
    <ul className="space-y-3">
      {rewards.map((r) => (
        <li key={r.id} className={`p-4 rounded-md border ${r.redeemedAt ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">
                {r.percentOff}% off {r.productScope.replace("_", " ").toLowerCase()}
              </p>
              <p className="text-xs text-muted-foreground">
                {r.source === "MILESTONE" ? "Milestone reward" : "Lottery win"} ·{" "}
                {new Date(r.unlockedAt).toLocaleDateString()}
                {r.redeemedAt ? " · Redeemed" : ""}
              </p>
            </div>
            {!r.redeemedAt && (
              <button
                onClick={() => navigator.clipboard.writeText(r.code)}
                className="px-3 py-1 text-sm rounded bg-muted"
              >
                Copy {r.code}
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/rewards src/components/streaks/reward-list.tsx
git commit -m "feat(streaks): add /dashboard/rewards page"
```

---

## Task 17: Mark redeemed via Dodo webhook

**Files:**
- Modify: the Dodo webhook handler (find it with `grep -rn "dodo.*webhook\|webhooks/dodo" src/app/api`)

- [ ] **Step 1: Locate Dodo webhook route**

Run: `find src/app/api -path '*dodo*' -name 'route.ts'`

- [ ] **Step 2: Add redemption marker**

When handling `payment.succeeded` / `subscription.created` / `order.paid` (whichever event Dodo fires for completed checkouts), check if a discount code was applied and mark the reward redeemed:

```ts
import { prisma } from "@/server/db/client";

const discountCode = payload?.data?.discount_code ?? payload?.discount?.code;
if (discountCode) {
  await prisma.streakReward.updateMany({
    where: { code: discountCode, redeemedAt: null },
    data: { redeemedAt: new Date() },
  });
}
```

(Verify the actual payload shape against Dodo docs or by inspecting `src/server/services/submission-payment-service.ts` for existing webhook parsing.)

- [ ] **Step 3: Commit**

```bash
git add src/app/api
git commit -m "feat(streaks): mark StreakReward redeemed on Dodo webhook"
```

---

## Task 18: Profile streak badge + avatar border + hide-from-leaderboard toggle

**Files:**
- Locate profile page: `find src/app -path '*profile*' -name 'page.tsx'` or `find src/app -path '*user*' -name 'page.tsx'`
- Locate settings page for hide toggle

- [ ] **Step 1: Add streak count + avatar border on profile**

Add to the profile component:

```tsx
import { prisma } from "@/server/db/client";

const streakCount = await prisma.userStreakDay.count({ where: { userId: profile.id } });
const borderClass = streakCount >= 50 ? "ring-4 ring-orange-500" : "";

// In avatar render:
<img src={profile.image} className={`rounded-full ${borderClass}`} />

// Badge:
{streakCount >= 3 && (
  <span className="ml-2 text-xs px-2 py-0.5 bg-orange-500/20 text-orange-500 rounded">
    🔥 {streakCount} day streak
  </span>
)}
```

- [ ] **Step 2: Hide toggle in settings**

In the user settings page (locate with `grep -rn "hideFromLeaderboard\|settings/profile" src/app`):

```tsx
"use client";
// add a labeled checkbox bound to a fetch PATCH /api/streaks/me/visibility
```

- [ ] **Step 3: Commit**

```bash
git add src/app src/components
git commit -m "feat(streaks): show profile badge, avatar border, leaderboard toggle"
```

---

## Task 19: Backfill script (one-shot)

**Files:**
- Create: `scripts/backfill-streaks.mjs`

- [ ] **Step 1: Implement script**

```js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const votes = await prisma.toolVote.findMany({
    select: { userId: true, createdAt: true },
  });

  const buckets = new Map(); // userId -> Set<isoDay>
  for (const v of votes) {
    const day = new Date(Date.UTC(v.createdAt.getUTCFullYear(), v.createdAt.getUTCMonth(), v.createdAt.getUTCDate()));
    const key = day.toISOString();
    if (!buckets.has(v.userId)) buckets.set(v.userId, new Set());
    buckets.get(v.userId).add(key);
  }

  let inserted = 0;
  for (const [userId, days] of buckets) {
    for (const dayIso of days) {
      try {
        await prisma.userStreakDay.create({
          data: { userId, day: new Date(dayIso) },
        });
        inserted++;
      } catch (err) {
        if (err.code !== "P2002") throw err;
      }
    }
  }
  console.log(`Backfilled ${inserted} streak day rows for ${buckets.size} users`);
}

main().finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Run once against dev DB**

Run: `node scripts/run-with-env.mjs node scripts/backfill-streaks.mjs`

Expected: log line showing inserted count.

- [ ] **Step 3: Commit**

```bash
git add scripts/backfill-streaks.mjs
git commit -m "chore(streaks): backfill UserStreakDay from historical votes"
```

---

## Task 20: Full test pass + lint

- [ ] **Step 1: Run all tests**

Run: `npm run test`

Expected: all passing.

- [ ] **Step 2: Lint**

Run: `npm run lint`

Expected: clean.

- [ ] **Step 3: Build**

Run: `npm run build`

Expected: build succeeds.

- [ ] **Step 4: Manual smoke test in dev**

- Sign in as a fresh user → sidebar shows "0 DAY STREAK"
- Cast an upvote → sidebar updates to "1 DAY STREAK"
- Manually set `UserStreakDay` count to 25 in DB → reload → lottery card unlocks
- Click "Try Your Luck!" → modal opens with rolling animation → outcome reveals
- Visit `/streaks` → user appears in list
- Toggle "Hide from leaderboard" in settings → reload `/streaks` → user is hidden

- [ ] **Step 5: Final commit if any fixes**

```bash
git add -A
git commit -m "chore(streaks): final polish"
```

---

## Notes on lightweight discipline

- **No new caching layer.** Reuse `unstable_cache` for the leaderboard; computed snapshots are not cached (single user query is cheap).
- **No denormalized `streakCount` column.** `COUNT(*)` on indexed `(userId)` is fast enough at our scale.
- **No new tables for jackpot cap.** Weekly `COUNT()` query on `LotteryRoll` covers it.
- **No email infrastructure.** All notifications are in-app.
- **No new auth or permission layer.** Reuses `getSessionFromRequest`.
- **Fire-and-forget activity recording** — never blocks votes or page renders.
- **One service file** for everything streak-related except the Dodo wrapper and the leaderboard query (split for testability).
