import type { Prisma, PrismaClient } from "@prisma/client";

import { toolDetailsInclude } from "@/server/db/includes";

export type ToolDetails = Prisma.ToolGetPayload<{
  include: typeof toolDetailsInclude;
}>;

type ToolDbClient = {
  tool: PrismaClient["tool"];
};

type ToolTxClient = {
  toolCategory: PrismaClient["toolCategory"];
  toolTag: PrismaClient["toolTag"];
};

export function listTools(
  db: ToolDbClient,
  where: Prisma.ToolWhereInput = {},
) {
  return db.tool.findMany({
    where,
    include: toolDetailsInclude,
    orderBy: {
      createdAt: "desc",
    },
  });
}

export function getToolById(db: ToolDbClient, id: string) {
  return db.tool.findUnique({
    where: { id },
    include: toolDetailsInclude,
  });
}

export function listToolsByOwner(db: ToolDbClient, ownerUserId: string) {
  return db.tool.findMany({
    where: { ownerUserId },
    include: toolDetailsInclude,
    orderBy: {
      updatedAt: "desc",
    },
  });
}

export function getToolByOwner(db: ToolDbClient, ownerUserId: string, id: string) {
  return db.tool.findFirst({
    where: {
      id,
      ownerUserId,
    },
    include: toolDetailsInclude,
  });
}

export async function replaceToolCategories(
  tx: ToolTxClient,
  toolId: string,
  categoryIds: string[],
) {
  await tx.toolCategory.deleteMany({ where: { toolId } });
  await tx.toolCategory.createMany({
    data: categoryIds.map((categoryId, index) => ({
      toolId,
      categoryId,
      sortOrder: index,
    })),
  });
}

export async function replaceToolTags(
  tx: ToolTxClient,
  toolId: string,
  tagIds: string[],
) {
  await tx.toolTag.deleteMany({ where: { toolId } });
  await tx.toolTag.createMany({
    data: tagIds.map((tagId, index) => ({
      toolId,
      tagId,
      sortOrder: index,
    })),
  });
}
