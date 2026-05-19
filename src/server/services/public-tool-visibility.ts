import type { Prisma } from "@prisma/client";

export function getPublicLaunchWhere(now = new Date()): Prisma.LaunchWhereInput {
  return {
    OR: [
      {
        status: {
          in: ["LIVE", "ENDED"],
        },
      },
      {
        status: "APPROVED",
        launchDate: {
          lte: now,
        },
      },
    ],
  };
}

export function isLaunchPubliclyVisible(
  launch: { status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED"; launchDate: Date },
  now = new Date(),
) {
  return (
    launch.status === "LIVE" ||
    launch.status === "ENDED" ||
    (launch.status === "APPROVED" && launch.launchDate <= now)
  );
}

export function getPublicLaunchBoardWhere(now = new Date()): Prisma.LaunchWhereInput {
  return {
    ...getPublicLaunchWhere(now),
    tool: getPubliclyVisibleToolWhere(now),
  };
}

export function isToolPubliclyVisible(
  tool: {
    publicationStatus: string;
    moderationStatus: string;
    launches: Array<{
      status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
      launchDate: Date;
    }>;
  },
  now = new Date(),
) {
  if (tool.publicationStatus !== "PUBLISHED" || tool.moderationStatus !== "APPROVED") {
    return false;
  }

  if (tool.launches.length === 0) {
    return true;
  }

  return tool.launches.some((launch) => isLaunchPubliclyVisible(launch, now));
}

export function getPrelaunchToolPageWhere(now = new Date()): Prisma.ToolWhereInput {
  return {
    OR: [
      {
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
        launches: {
          some: {
            status: "APPROVED",
            launchDate: {
              gt: now,
            },
          },
        },
      },
      {
        publicationStatus: "UNPUBLISHED",
        moderationStatus: "PENDING",
        submissions: {
          some: {
            reviewStatus: "PENDING",
            preferredLaunchDate: {
              gt: now,
            },
          },
        },
      },
    ],
  };
}

export function getToolPrelaunchDate(
  tool: {
    launches: Array<{
      status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
      launchDate: Date;
    }>;
    submissions?: Array<{
      reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
      preferredLaunchDate: Date | null;
    }>;
  },
  now = new Date(),
) {
  const scheduledLaunches = tool.launches
    .filter((launch) => launch.status === "APPROVED" && launch.launchDate > now)
    .map((launch) => launch.launchDate);
  const pendingSubmissionDates = (tool.submissions ?? [])
    .filter(
      (submission) =>
        submission.reviewStatus === "PENDING" &&
        submission.preferredLaunchDate &&
        submission.preferredLaunchDate > now,
    )
    .map((submission) => submission.preferredLaunchDate)
    .filter((value): value is Date => Boolean(value));
  const nextDate = [...scheduledLaunches, ...pendingSubmissionDates].sort(
    (left, right) => left.getTime() - right.getTime(),
  )[0];

  return nextDate ?? null;
}

export function isToolPrelaunchPageVisible(
  tool: {
    publicationStatus: string;
    moderationStatus: string;
    launches: Array<{
      status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
      launchDate: Date;
    }>;
    submissions?: Array<{
      reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
      preferredLaunchDate: Date | null;
    }>;
  },
  now = new Date(),
) {
  if (tool.publicationStatus === "PUBLISHED" && tool.moderationStatus === "APPROVED") {
    return Boolean(getToolPrelaunchDate({ launches: tool.launches }, now));
  }

  if (tool.publicationStatus === "UNPUBLISHED" && tool.moderationStatus === "PENDING") {
    return Boolean(
      getToolPrelaunchDate(
        {
          launches: [],
          submissions: tool.submissions,
        },
        now,
      ),
    );
  }

  return false;
}

export function getPubliclyVisibleToolWhere(now = new Date()): Prisma.ToolWhereInput {
  return {
    publicationStatus: "PUBLISHED",
    moderationStatus: "APPROVED",
    OR: [
      {
        launches: {
          none: {},
        },
      },
      {
        launches: {
          some: getPublicLaunchWhere(now),
        },
      },
    ],
  };
}

export function combinePubliclyVisibleToolWhere(
  where: Prisma.ToolWhereInput,
  now = new Date(),
): Prisma.ToolWhereInput {
  return {
    AND: [getPubliclyVisibleToolWhere(now), where],
  };
}
