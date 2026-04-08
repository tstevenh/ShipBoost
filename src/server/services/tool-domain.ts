import type { Prisma, PrismaClient } from "@prisma/client";

import { AppError } from "@/server/http/app-error";

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

function toRootDomain(host: string) {
  const normalized = normalizeHost(host);
  const parts = normalized.split(".").filter(Boolean);

  if (parts.length <= 2) {
    return normalized;
  }

  return parts.slice(-2).join(".");
}

export function getToolRootDomain(websiteUrl: string) {
  try {
    return toRootDomain(new URL(websiteUrl).hostname);
  } catch {
    throw new AppError(400, "Website URL must be a valid public URL.");
  }
}

type DuplicateToolLookupDb =
  | {
      tool: Pick<PrismaClient["tool"], "findMany">;
    }
  | {
      tool: Pick<Prisma.TransactionClient["tool"], "findMany">;
    };

export async function findDuplicateToolByRootDomain(
  db: DuplicateToolLookupDb,
  websiteUrl: string,
  options?: { excludeToolId?: string },
) {
  const requestedDomain = getToolRootDomain(websiteUrl);
  const tools = await db.tool.findMany({
    where: options?.excludeToolId
      ? {
          id: {
            not: options.excludeToolId,
          },
        }
      : undefined,
    select: {
      id: true,
      slug: true,
      name: true,
      ownerUserId: true,
      websiteUrl: true,
    },
  });

  for (const tool of tools) {
    try {
      if (getToolRootDomain(tool.websiteUrl) === requestedDomain) {
        return tool;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function buildDuplicateSubmissionDetails(
  tool: {
    id: string;
    slug: string;
    name: string;
    ownerUserId: string | null;
  },
  founderUserId: string,
) {
  const ownedByYou = tool.ownerUserId === founderUserId;

  return {
    duplicateTool: {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      ownedByYou,
      ctaHref: ownedByYou ? `/dashboard/tools/${tool.id}` : null,
      ctaLabel: ownedByYou ? "Manage existing listing" : null,
    },
  };
}
