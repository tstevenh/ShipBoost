CREATE TYPE "ListingClaimStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELED');

CREATE TABLE "ListingClaim" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "claimantUserId" TEXT NOT NULL,
    "status" "ListingClaimStatus" NOT NULL DEFAULT 'PENDING',
    "claimEmail" TEXT NOT NULL,
    "claimDomain" TEXT NOT NULL,
    "websiteDomain" TEXT NOT NULL,
    "founderVisibleNote" TEXT,
    "internalAdminNote" TEXT,
    "seededToolSnapshot" JSONB NOT NULL,
    "reviewedByUserId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ListingClaim_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ListingClaim_toolId_status_idx" ON "ListingClaim"("toolId", "status");
CREATE INDEX "ListingClaim_claimantUserId_status_idx" ON "ListingClaim"("claimantUserId", "status");
CREATE INDEX "ListingClaim_reviewedByUserId_idx" ON "ListingClaim"("reviewedByUserId");
CREATE UNIQUE INDEX "ListingClaim_one_pending_per_tool_idx"
  ON "ListingClaim"("toolId")
  WHERE "status" = 'PENDING';

ALTER TABLE "ListingClaim"
  ADD CONSTRAINT "ListingClaim_toolId_fkey"
  FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingClaim"
  ADD CONSTRAINT "ListingClaim_claimantUserId_fkey"
  FOREIGN KEY ("claimantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListingClaim"
  ADD CONSTRAINT "ListingClaim_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
