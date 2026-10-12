-- AlterTable
ALTER TABLE "LaunchVideoOrder" ADD COLUMN     "avoidNote" TEXT,
ADD COLUMN     "briefReminderSentAt" TIMESTAMP(3),
ADD COLUMN     "briefUpdatedAt" TIMESTAMP(3),
ADD COLUMN     "highlightClaim" TEXT,
ADD COLUMN     "screenshots" JSONB;

