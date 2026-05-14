import { prisma } from "@/server/db/client";
import { startOfUtcDay } from "@/server/services/time";
import { createDodoStreakDiscount } from "./streak-rewards-dodo";

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
      // Already recorded today — skip the COUNT, caller doesn't need it on the duplicate path.
      return { recorded: false, streakCount: -1, crossedMilestone: null };
    }
    throw error;
  }

  const streakCount = await prisma.userStreakDay.count({ where: { userId } });
  const crossedMilestone =
    (STREAK_MILESTONES as readonly number[]).includes(streakCount)
      ? (streakCount as StreakMilestone)
      : null;

  if (crossedMilestone) {
    await unlockMilestoneReward(userId, crossedMilestone).catch((err) => {
      console.error("[shipboost streak] milestone reward failed", err);
    });
  }

  return { recorded: true, streakCount, crossedMilestone };
}

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

export async function getStreakSnapshot(userId: string): Promise<StreakSnapshot> {
  const streakCount = await prisma.userStreakDay.count({ where: { userId } });

  // 5-day cycle: day 1→[1,0,0,0,0], day 5→[1,1,1,1,1], day 6→[1,0,0,0,0], …
  const filledInCycle =
    streakCount === 0 ? 0 : ((streakCount - 1) % 5) + 1;
  const last5Days = Array.from({ length: 5 }, (_, i) => ({
    day: String(i + 1),
    active: i < filledInCycle,
  }));

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

export const LOTTERY_ODDS: Array<{ outcome: "LOSE" | "OFF_5" | "OFF_10" | "OFF_25" | "OFF_50" | "OFF_100"; probability: number }> = [
  { outcome: "LOSE", probability: 0.92 },
  { outcome: "OFF_5", probability: 0.05 },
  { outcome: "OFF_10", probability: 0.02 },
  { outcome: "OFF_25", probability: 0.007 },
  { outcome: "OFF_50", probability: 0.002 },
  { outcome: "OFF_100", probability: 0.001 },
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
