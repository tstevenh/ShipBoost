-- CreateEnum
CREATE TYPE "LaunchVideoOrderStatus" AS ENUM ('PENDING', 'PAID', 'DELIVERED', 'REFUNDED', 'CANCELED');

-- CreateTable
CREATE TABLE "LaunchVideoOrder" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "LaunchVideoOrderStatus" NOT NULL DEFAULT 'PENDING',
    "launchWeekStart" TIMESTAMP(3) NOT NULL,
    "focusNote" TEXT,
    "priceCents" INTEGER NOT NULL,
    "checkoutSessionId" TEXT,
    "paymentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LaunchVideoOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LaunchVideoOrder_paymentId_key" ON "LaunchVideoOrder"("paymentId");

-- CreateIndex
CREATE INDEX "LaunchVideoOrder_status_launchWeekStart_idx" ON "LaunchVideoOrder"("status", "launchWeekStart");

-- CreateIndex
CREATE INDEX "LaunchVideoOrder_submissionId_idx" ON "LaunchVideoOrder"("submissionId");

-- AddForeignKey
ALTER TABLE "LaunchVideoOrder" ADD CONSTRAINT "LaunchVideoOrder_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
