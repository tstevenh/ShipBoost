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
