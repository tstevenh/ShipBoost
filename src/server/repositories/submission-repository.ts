import type { Prisma, PrismaClient } from "@prisma/client";

import { toolDetailsInclude } from "@/server/db/includes";

type SubmissionDbClient = {
  submission: PrismaClient["submission"];
};

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
