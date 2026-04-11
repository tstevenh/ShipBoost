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

export const founderToolSummarySelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  publicationStatus: true,
  logoMedia: {
    select: {
      url: true,
    },
  },
} satisfies Prisma.ToolSelect;

export type FounderToolSummary = Prisma.ToolGetPayload<{
  select: typeof founderToolSummarySelect;
}>;

export const founderToolEditorSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  websiteUrl: true,
  richDescription: true,
  pricingModel: true,
  hasAffiliateProgram: true,
  founderXUrl: true,
  founderGithubUrl: true,
  founderLinkedinUrl: true,
  founderFacebookUrl: true,
  logoMedia: {
    select: {
      id: true,
      url: true,
      publicId: true,
      format: true,
      width: true,
      height: true,
    },
  },
  media: {
    where: {
      type: "SCREENSHOT",
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      url: true,
      publicId: true,
      format: true,
      width: true,
      height: true,
    },
  },
  toolCategories: {
    select: {
      categoryId: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
  toolTags: {
    select: {
      tagId: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
} satisfies Prisma.ToolSelect;

export type FounderToolEditorRecord = Prisma.ToolGetPayload<{
  select: typeof founderToolEditorSelect;
}>;

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

export function getToolEditorById(db: ToolDbClient, id: string) {
  return db.tool.findUnique({
    where: { id },
    select: founderToolEditorSelect,
  });
}

export function getToolEditorByOwner(
  db: ToolDbClient,
  ownerUserId: string,
  id: string,
) {
  return db.tool.findFirst({
    where: {
      id,
      ownerUserId,
    },
    select: founderToolEditorSelect,
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

export function listToolSummariesByOwner(db: ToolDbClient, ownerUserId: string) {
  return db.tool.findMany({
    where: { ownerUserId },
    select: founderToolSummarySelect,
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
