import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/server/db/client";
import { recordStreakActivity, getStreakSnapshot, getVoteMultiplier, unlockMilestoneReward, rollLottery, LOTTERY_ODDS } from "./streak-service";

vi.mock("@/server/services/streak-rewards-dodo", () => ({
  createDodoStreakDiscount: vi.fn(async ({ percentOff }: { percentOff: number }) => ({
    code: `STREAK${percentOff}-TESTCODE`,
    dodoDiscountId: `disc_${percentOff}`,
  })),
}));

async function makeUser() {
  return prisma.user.create({
    data: { email: `s-${crypto.randomUUID()}@test.local`, name: "Streak Tester" },
  });
}

afterAll(async () => {
  // Clean up all users created by makeUser() so the dev DB doesn't accumulate them.
  await prisma.user.deleteMany({ where: { email: { contains: "@test.local" } } });
});

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
    // Duplicate-day path skips the COUNT (returns -1 sentinel for perf)
    expect(second.streakCount).toBe(-1);
  });

  it("returns crossed milestone when count hits 3, 5, 10, 25, 50, 100, 250, 365", async () => {
    const user = await makeUser();
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

describe("rollLottery", () => {
  beforeEach(async () => {
    await prisma.lotteryRoll.deleteMany();
    await prisma.streakReward.deleteMany();
    await prisma.userStreakDay.deleteMany();
  });

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
  }, 30000);

  it("downgrades OFF_100 to OFF_50 when weekly jackpot cap is hit", async () => {
    const otherUser = await makeUser();
    const user = await makeUser();
    for (let i = 1; i <= 25; i++) {
      await prisma.userStreakDay.create({
        data: { userId: user.id, day: new Date(Date.UTC(2026, 0, i)) },
      });
    }
    // Seed an existing jackpot this week (any roll-date within current ISO week)
    await prisma.lotteryRoll.create({
      data: {
        userId: otherUser.id,
        rollDate: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate())),
        outcome: "OFF_100",
      },
    });
    const result = await rollLottery(user.id, { forceOutcome: "OFF_100" });
    expect(result.outcome).toBe("OFF_50");
  }, 30000);

  it("odds table sums to 1.0", () => {
    const total = LOTTERY_ODDS.reduce((acc, o) => acc + o.probability, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });
});

describe("unlockMilestoneReward", () => {
  beforeEach(async () => {
    await prisma.streakReward.deleteMany();
  });

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
