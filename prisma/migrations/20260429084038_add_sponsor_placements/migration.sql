-- CreateEnum
CREATE TYPE "SponsorPlacementStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'DISABLED', 'PAID_WAITLISTED');

-- CreateTable
CREATE TABLE "SponsorPlacement" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "status" "SponsorPlacementStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "startsAt" TIMESTAMP(3),
    "endsAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "disabledAt" TIMESTAMP(3),
    "checkoutSessionId" TEXT,
    "paymentId" TEXT,
    "renewalReminderSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SponsorPlacement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SponsorPlacement_checkoutSessionId_key" ON "SponsorPlacement"("checkoutSessionId");

-- CreateIndex
CREATE INDEX "SponsorPlacement_status_startsAt_endsAt_idx" ON "SponsorPlacement"("status", "startsAt", "endsAt");

-- CreateIndex
CREATE INDEX "SponsorPlacement_toolId_status_idx" ON "SponsorPlacement"("toolId", "status");

-- AddForeignKey
ALTER TABLE "SponsorPlacement" ADD CONSTRAINT "SponsorPlacement_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;
