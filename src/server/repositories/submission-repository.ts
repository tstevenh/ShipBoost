import type { Prisma, PrismaClient } from "@prisma/client";

import { toolDetailsInclude } from "@/server/db/includes";

type SubmissionDbClient = {
  submission: PrismaClient["submission"];
};

const founderSubmissionLaunchSummarySelect = {
  id: true,
  launchType: true,
  status: true,
  launchDate: true,
} satisfies Prisma.LaunchSelect;

const founderSubmissionToolSummarySelect = {
  id: true,
  slug: true,
  name: true,
  websiteUrl: true,
  logoMedia: {
    select: {
      url: true,
    },
  },
  launches: {
    select: founderSubmissionLaunchSummarySelect,
    orderBy: {
      launchDate: "desc" as const,
    },
  },
} satisfies Prisma.ToolSelect;

const founderSubmissionSpotlightSummarySelect = {
  status: true,
  updatedAt: true,
  publishedAt: true,
  publishedArticle: {
    select: {
      slug: true,
      title: true,
    },
  },
} satisfies Prisma.SubmissionSpotlightBriefSelect;

export const founderSubmissionSummarySelect = {
  id: true,
  submissionType: true,
  reviewStatus: true,
  preferredLaunchDate: true,
  paymentStatus: true,
  badgeVerification: true,
  spotlightBrief: {
    select: founderSubmissionSpotlightSummarySelect,
  },
  tool: {
    select: founderSubmissionToolSummarySelect,
  },
} satisfies Prisma.SubmissionSelect;

export type FounderSubmissionSummary = Prisma.SubmissionGetPayload<{
  select: typeof founderSubmissionSummarySelect;
}>;

export function listSubmissionSummariesForFounder(
  db: SubmissionDbClient,
  userId: string,
) {
  return db.submission.findMany({
    where: {
      userId,
    },
    select: founderSubmissionSummarySelect,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function listSubmissionsForFounder(
  db: SubmissionDbClient,
  userId: string,
) {
  return db.submission.findMany({
    where: {
      userId,
    },
    include: {
      tool: {
        include: toolDetailsInclude,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function getSubmissionById(db: SubmissionDbClient, id: string) {
  return db.submission.findUnique({
    where: { id },
    include: {
      user: true,
      tool: {
        include: toolDetailsInclude,
      },
    },
  });
}

export function getSubmissionByIdForFounder(
  db: SubmissionDbClient,
  id: string,
  userId: string,
) {
  return db.submission.findFirst({
    where: {
      id,
      userId,
    },
    include: {
      user: true,
      tool: {
        include: toolDetailsInclude,
      },
    },
  });
}

export function listAdminSubmissions(
  db: SubmissionDbClient,
  where: Prisma.SubmissionWhereInput = {},
) {
  return db.submission.findMany({
    where,
    include: {
      spotlightBrief: {
        select: founderSubmissionSpotlightSummarySelect,
      },
      user: true,
      tool: {
        include: toolDetailsInclude,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}
