-- CreateEnum
CREATE TYPE "SponsorSlot" AS ENUM ('SIDEBAR', 'INLINE_BANNER', 'INLINE_PRODUCT');

-- AlterTable
ALTER TABLE "SponsorPlacement" ADD COLUMN     "slot" "SponsorSlot" NOT NULL DEFAULT 'SIDEBAR';

-- CreateIndex
CREATE INDEX "SponsorPlacement_slot_status_startsAt_endsAt_idx" ON "SponsorPlacement"("slot", "status", "startsAt", "endsAt");
