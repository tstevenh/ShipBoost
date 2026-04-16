-- CreateEnum
CREATE TYPE "SubmissionSpotlightStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'READY', 'PUBLISHED');

-- CreateTable
CREATE TABLE "SubmissionSpotlightBrief" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "status" "SubmissionSpotlightStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "audience" TEXT,
    "problem" TEXT,
    "differentiator" TEXT,
    "emphasis" TEXT,
    "primaryCtaUrl" TEXT,
    "founderQuote" TEXT,
    "wordingToAvoid" TEXT,
    "firstTouchedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "reminderThreeDaysSentAt" TIMESTAMP(3),
    "reminderLaunchWeekSentAt" TIMESTAMP(3),
    "publishedArticleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubmissionSpotlightBrief_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionSpotlightBrief_submissionId_key" ON "SubmissionSpotlightBrief"("submissionId");

-- CreateIndex
CREATE UNIQUE INDEX "SubmissionSpotlightBrief_publishedArticleId_key" ON "SubmissionSpotlightBrief"("publishedArticleId");

-- CreateIndex
CREATE INDEX "SubmissionSpotlightBrief_status_idx" ON "SubmissionSpotlightBrief"("status");

-- AddForeignKey
ALTER TABLE "SubmissionSpotlightBrief" ADD CONSTRAINT "SubmissionSpotlightBrief_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "Submission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubmissionSpotlightBrief" ADD CONSTRAINT "SubmissionSpotlightBrief_publishedArticleId_fkey" FOREIGN KEY ("publishedArticleId") REFERENCES "BlogArticle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
