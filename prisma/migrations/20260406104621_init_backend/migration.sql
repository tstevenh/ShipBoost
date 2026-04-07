-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'ADMIN');

-- CreateEnum
CREATE TYPE "PricingModel" AS ENUM ('FREE', 'FREEMIUM', 'PAID', 'CUSTOM', 'CONTACT_SALES');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED', 'HIDDEN');

-- CreateEnum
CREATE TYPE "PublicationStatus" AS ENUM ('UNPUBLISHED', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubmissionType" AS ENUM ('LISTING_ONLY', 'FREE_LAUNCH', 'FEATURED_LAUNCH', 'RELAUNCH');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "BadgeVerificationStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'VERIFIED', 'FAILED');

-- CreateEnum
CREATE TYPE "LaunchType" AS ENUM ('FREE', 'FEATURED', 'RELAUNCH');

-- CreateEnum
CREATE TYPE "LaunchStatus" AS ENUM ('PENDING', 'APPROVED', 'LIVE', 'ENDED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('LOGO', 'SCREENSHOT');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'FOUNDER',
    "bio" TEXT,
    "xUrl" TEXT,
    "githubUrl" TEXT,
    "linkedinUrl" TEXT,
    "facebookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tool" (
    "id" TEXT NOT NULL,
    "ownerUserId" TEXT,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "richDescription" TEXT NOT NULL,
    "pricingModel" "PricingModel" NOT NULL,
    "affiliateUrl" TEXT,
    "affiliateSource" TEXT,
    "hasAffiliateProgram" BOOLEAN NOT NULL DEFAULT false,
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationStatus" "PublicationStatus" NOT NULL DEFAULT 'UNPUBLISHED',
    "launchBadgeRequired" BOOLEAN NOT NULL DEFAULT false,
    "badgeVerification" "BadgeVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "currentLaunchType" "LaunchType",
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "founderXUrl" TEXT,
    "founderGithubUrl" TEXT,
    "founderLinkedinUrl" TEXT,
    "founderFacebookUrl" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "canonicalUrl" TEXT,
    "internalNote" TEXT,
    "logoMediaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tool_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolMedia" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "type" "MediaType" NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "format" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "seoIntro" TEXT,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "faqJson" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolCategory" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ToolTag" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ToolTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "submissionType" "SubmissionType" NOT NULL,
    "requestedSlug" TEXT,
    "badgeFooterUrl" TEXT,
    "badgeVerification" "BadgeVerificationStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'PENDING',
    "founderVisibleNote" TEXT,
    "internalReviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Launch" (
    "id" TEXT NOT NULL,
    "toolId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "launchType" "LaunchType" NOT NULL,
    "status" "LaunchStatus" NOT NULL DEFAULT 'PENDING',
    "launchDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "priorityWeight" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Launch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_slug_key" ON "Tool"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tool_logoMediaId_key" ON "Tool"("logoMediaId");

-- CreateIndex
CREATE INDEX "Tool_ownerUserId_idx" ON "Tool"("ownerUserId");

-- CreateIndex
CREATE INDEX "Tool_moderationStatus_idx" ON "Tool"("moderationStatus");

-- CreateIndex
CREATE INDEX "Tool_publicationStatus_idx" ON "Tool"("publicationStatus");

-- CreateIndex
CREATE INDEX "ToolMedia_toolId_idx" ON "ToolMedia"("toolId");

-- CreateIndex
CREATE INDEX "ToolMedia_type_idx" ON "ToolMedia"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_slug_key" ON "Tag"("slug");

-- CreateIndex
CREATE INDEX "ToolCategory_categoryId_idx" ON "ToolCategory"("categoryId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolCategory_toolId_categoryId_key" ON "ToolCategory"("toolId", "categoryId");

-- CreateIndex
CREATE INDEX "ToolTag_tagId_idx" ON "ToolTag"("tagId");

-- CreateIndex
CREATE UNIQUE INDEX "ToolTag_toolId_tagId_key" ON "ToolTag"("toolId", "tagId");

-- CreateIndex
CREATE INDEX "Submission_userId_reviewStatus_idx" ON "Submission"("userId", "reviewStatus");

-- CreateIndex
CREATE INDEX "Submission_toolId_idx" ON "Submission"("toolId");

-- CreateIndex
CREATE INDEX "Launch_toolId_status_idx" ON "Launch"("toolId", "status");

-- CreateIndex
CREATE INDEX "Launch_launchDate_idx" ON "Launch"("launchDate");

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_ownerUserId_fkey" FOREIGN KEY ("ownerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tool" ADD CONSTRAINT "Tool_logoMediaId_fkey" FOREIGN KEY ("logoMediaId") REFERENCES "ToolMedia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolMedia" ADD CONSTRAINT "ToolMedia_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCategory" ADD CONSTRAINT "ToolCategory_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolCategory" ADD CONSTRAINT "ToolCategory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolTag" ADD CONSTRAINT "ToolTag_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ToolTag" ADD CONSTRAINT "ToolTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Launch" ADD CONSTRAINT "Launch_toolId_fkey" FOREIGN KEY ("toolId") REFERENCES "Tool"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Launch" ADD CONSTRAINT "Launch_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
