-- CreateEnum
CREATE TYPE "StreakRewardSource" AS ENUM ('MILESTONE', 'LOTTERY');

-- CreateEnum
CREATE TYPE "StreakProductScope" AS ENUM ('PREMIUM_LAUNCH', 'SPONSOR_PLACEMENT');

-- CreateEnum
CREATE TYPE "LotteryOutcome" AS ENUM ('LOSE', 'OFF_5', 'OFF_10', 'OFF_25', 'OFF_50', 'OFF_100');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "hideFromLeaderboard" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "UserStreakDay" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "day" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserStreakDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreakReward" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "source" "StreakRewardSource" NOT NULL,
    "milestoneDay" INTEGER,
    "productScope" "StreakProductScope" NOT NULL,
    "percentOff" INTEGER NOT NULL,
    "code" TEXT NOT NULL,
    "dodoDiscountId" TEXT,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "redeemedAt" TIMESTAMP(3),

    CONSTRAINT "StreakReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LotteryRoll" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rollDate" TIMESTAMP(3) NOT NULL,
    "outcome" "LotteryOutcome" NOT NULL,
    "rewardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LotteryRoll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserStreakDay_userId_idx" ON "UserStreakDay"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserStreakDay_userId_day_key" ON "UserStreakDay"("userId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "StreakReward_code_key" ON "StreakReward"("code");

-- CreateIndex
CREATE INDEX "StreakReward_userId_idx" ON "StreakReward"("userId");

-- CreateIndex
CREATE INDEX "LotteryRoll_outcome_rollDate_idx" ON "LotteryRoll"("outcome", "rollDate");

-- CreateIndex
CREATE UNIQUE INDEX "LotteryRoll_userId_rollDate_key" ON "LotteryRoll"("userId", "rollDate");

-- AddForeignKey
ALTER TABLE "UserStreakDay" ADD CONSTRAINT "UserStreakDay_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StreakReward" ADD CONSTRAINT "StreakReward_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryRoll" ADD CONSTRAINT "LotteryRoll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LotteryRoll" ADD CONSTRAINT "LotteryRoll_rewardId_fkey" FOREIGN KEY ("rewardId") REFERENCES "StreakReward"("id") ON DELETE SET NULL ON UPDATE CASCADE;
