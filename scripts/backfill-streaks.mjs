import DodoPayments from "dodopayments";
import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const WITH_REWARDS = process.argv.includes("--rewards");
const prisma = new PrismaClient();

const REWARD_CONFIG = new Map([
  [10, { productScope: "PREMIUM_LAUNCH", percentOff: 10 }],
  [25, { productScope: "PREMIUM_LAUNCH", percentOff: 25 }],
  [100, { productScope: "PREMIUM_LAUNCH", percentOff: 50 }],
  [250, { productScope: "SPONSOR_PLACEMENT", percentOff: 50 }],
  [365, { productScope: "PREMIUM_LAUNCH", percentOff: 100 }],
]);

function startOfUtcDay(date) {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

function dayKey(date) {
  return startOfUtcDay(date).toISOString();
}

function generateCodeSuffix() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
}

function getDodoClient() {
  const apiKey = process.env.DODO_PAYMENTS_API_KEY;
  if (!apiKey) throw new Error("Missing DODO_PAYMENTS_API_KEY.");

  return new DodoPayments({
    bearerToken: apiKey,
    environment:
      process.env.DODO_PAYMENTS_MODE === "test" ? "test_mode" : "live_mode",
  });
}

function getDodoProductId(productScope) {
  const envKey =
    productScope === "PREMIUM_LAUNCH"
      ? "DODO_PREMIUM_LAUNCH_PRODUCT_ID"
      : "DODO_SPONSOR_PLACEMENT_PRODUCT_ID";
  const productId = process.env[envKey];
  if (!productId) throw new Error(`Missing ${envKey}.`);
  return productId;
}

async function createDodoStreakDiscount(dodo, { userId, percentOff, productScope }) {
  const code = `STREAK${percentOff}-${generateCodeSuffix()}`;
  const discount = await dodo.discounts.create({
    code,
    amount: percentOff * 100,
    type: "percentage",
    usage_limit: 1,
    restricted_to: [getDodoProductId(productScope)],
    metadata: { userId, source: "streak" },
  });
  return { code, dodoDiscountId: discount.discount_id };
}

async function main() {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN (pass --apply to write) ===");
  console.log(WITH_REWARDS ? "Rewards: enabled" : "Rewards: skipped");

  const [votes, existingStreakDays, existingRewards] = await Promise.all([
    prisma.toolVote.findMany({
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userStreakDay.findMany({
      select: { userId: true, day: true },
    }),
    prisma.streakReward.findMany({
      where: { source: "MILESTONE" },
      select: { userId: true, milestoneDay: true },
    }),
  ]);

  const voteDayKeys = new Set();
  const existingDayKeys = new Set();
  const existingCounts = new Map();
  const missingRows = [];

  for (const streakDay of existingStreakDays) {
    const key = `${streakDay.userId}:${dayKey(streakDay.day)}`;
    existingDayKeys.add(key);
    existingCounts.set(
      streakDay.userId,
      (existingCounts.get(streakDay.userId) ?? 0) + 1,
    );
  }

  for (const vote of votes) {
    const day = startOfUtcDay(vote.createdAt);
    const key = `${vote.userId}:${day.toISOString()}`;
    if (voteDayKeys.has(key)) continue;
    voteDayKeys.add(key);
    if (!existingDayKeys.has(key)) {
      missingRows.push({ userId: vote.userId, day });
    }
  }

  const missingByUser = new Map();
  for (const row of missingRows) {
    missingByUser.set(row.userId, (missingByUser.get(row.userId) ?? 0) + 1);
  }

  const existingRewardKeys = new Set(
    existingRewards
      .filter((reward) => reward.milestoneDay !== null)
      .map((reward) => `${reward.userId}:${reward.milestoneDay}`),
  );

  const rewardPlans = [];
  for (const [userId, missingCount] of missingByUser) {
    const before = existingCounts.get(userId) ?? 0;
    const after = before + missingCount;
    for (const [milestone, config] of REWARD_CONFIG) {
      if (
        before < milestone &&
        after >= milestone &&
        !existingRewardKeys.has(`${userId}:${milestone}`)
      ) {
        rewardPlans.push({ userId, milestone, ...config });
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        voteRows: votes.length,
        voteUserDays: voteDayKeys.size,
        existingStreakDays: existingStreakDays.length,
        missingStreakDays: missingRows.length,
        usersAffected: missingByUser.size,
        milestoneRewardsToCreate: rewardPlans.length,
        rewardPlans,
      },
      null,
      2,
    ),
  );

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to restore streak days.");
    console.log("Add --rewards to also create missing Dodo milestone rewards.");
    return;
  }

  if (WITH_REWARDS && rewardPlans.length > 0) {
    getDodoClient();
    for (const plan of rewardPlans) getDodoProductId(plan.productScope);
  }

  let inserted = 0;
  for (const row of missingRows) {
    try {
      await prisma.userStreakDay.create({ data: row });
      inserted++;
    } catch (err) {
      if (err?.code !== "P2002") throw err;
    }
  }
  console.log(`Inserted ${inserted} missing streak day row(s).`);

  if (!WITH_REWARDS || rewardPlans.length === 0) return;

  const dodo = getDodoClient();
  let rewardsCreated = 0;
  for (const plan of rewardPlans) {
    const existing = await prisma.streakReward.findFirst({
      where: {
        userId: plan.userId,
        source: "MILESTONE",
        milestoneDay: plan.milestone,
      },
      select: { id: true },
    });
    if (existing) continue;

    const { code, dodoDiscountId } = await createDodoStreakDiscount(dodo, plan);
    await prisma.streakReward.create({
      data: {
        userId: plan.userId,
        source: "MILESTONE",
        milestoneDay: plan.milestone,
        productScope: plan.productScope,
        percentOff: plan.percentOff,
        code,
        dodoDiscountId,
      },
    });
    rewardsCreated++;
    console.log(
      `Created milestone reward: user=${plan.userId} day=${plan.milestone} code=${code}`,
    );
  }
  console.log(`Created ${rewardsCreated} milestone reward(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
