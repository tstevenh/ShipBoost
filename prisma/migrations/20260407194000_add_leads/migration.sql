CREATE TYPE "LeadStatus" AS ENUM ('ACTIVE', 'UNSUBSCRIBED');

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'ACTIVE',
    "source" TEXT NOT NULL,
    "leadMagnet" TEXT NOT NULL,
    "consentedAt" TIMESTAMP(3) NOT NULL,
    "firstSubscribedAt" TIMESTAMP(3) NOT NULL,
    "lastSubmittedAt" TIMESTAMP(3) NOT NULL,
    "resendContactId" TEXT,
    "name" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "utmContent" TEXT,
    "utmTerm" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_source_idx" ON "Lead"("source");
CREATE INDEX "Lead_leadMagnet_idx" ON "Lead"("leadMagnet");
