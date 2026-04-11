import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { toolDetailsInclude } from "@/server/db/includes";
import {
  publicRelatedToolSelect,
  publicToolDetailSelect,
} from "@/server/db/public-selects";
import {
  deleteImageFromCloudinary,
} from "@/server/cloudinary";
import { AppError } from "@/server/http/app-error";
import {
  getToolByOwner,
  getToolById,
  getToolEditorById,
  getToolEditorByOwner,
  listTools,
  listToolSummariesByOwner,
  listToolsByOwner,
  replaceToolCategories,
  replaceToolTags,
} from "@/server/repositories/tool-repository";
import { createUniqueToolSlug } from "@/server/services/slug";
import { assertCatalogAssignments } from "@/server/services/catalog";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import type {
  AdminToolCreateInput,
  AdminToolUpdateInput,
  FounderToolUpdateInput,
} from "@/server/validators/tool";

function getToolListWhere(filters: {
  search?: string;
  moderationStatus?: string;
  publicationStatus?: string;
}): Prisma.ToolWhereInput {
  return {
    moderationStatus: filters.moderationStatus as
      | Prisma.EnumModerationStatusFilter["equals"]
      | undefined,
    publicationStatus: filters.publicationStatus as
      | Prisma.EnumPublicationStatusFilter["equals"]
      | undefined,
    OR: filters.search
      ? [
          { name: { contains: filters.search, mode: "insensitive" } },
          { tagline: { contains: filters.search, mode: "insensitive" } },
          { slug: { contains: filters.search, mode: "insensitive" } },
        ]
      : undefined,
  };
}

function haveSameOrderedIds(left: string[], right: string[]) {
  return (
    left.length === right.length &&
    left.every((value, index) => value === right[index])
  );
}

export async function listAdminTools(filters: {
  search?: string;
  moderationStatus?: string;
  publicationStatus?: string;
}) {
  return listTools(prisma, getToolListWhere(filters));
}

export async function createAdminTool(input: AdminToolCreateInput) {
  await assertCatalogAssignments(input.categoryIds, input.tagIds);

  return prisma.$transaction(async (tx) => {
    const slug = await createUniqueToolSlug(input.slug ?? input.name, tx);
    const tool = await tx.tool.create({
      data: {
        ownerUserId: input.ownerUserId,
        slug,
        name: input.name,
        tagline: input.tagline,
        websiteUrl: input.websiteUrl,
        richDescription: input.richDescription,
        pricingModel: input.pricingModel,
        affiliateUrl: input.affiliateUrl,
        affiliateSource: input.affiliateSource,
        hasAffiliateProgram: input.hasAffiliateProgram,
        moderationStatus: "APPROVED",
        publicationStatus: input.publish ? "PUBLISHED" : "UNPUBLISHED",
        isFeatured: input.isFeatured,
        founderXUrl: input.founderXUrl,
        founderGithubUrl: input.founderGithubUrl,
        founderLinkedinUrl: input.founderLinkedinUrl,
        founderFacebookUrl: input.founderFacebookUrl,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        canonicalUrl: input.canonicalUrl,
        internalNote: input.internalNote,
      },
    });

    const logoMedia = await tx.toolMedia.create({
      data: {
        toolId: tool.id,
        type: "LOGO",
        sortOrder: 0,
        ...input.logo,
      },
    });

    if (input.screenshots.length > 0) {
      await tx.toolMedia.createMany({
        data: input.screenshots.map((screenshot, index) => ({
          toolId: tool.id,
          type: "SCREENSHOT",
          sortOrder: index,
          url: screenshot.url,
          publicId: screenshot.publicId,
          format: screenshot.format,
          width: screenshot.width,
          height: screenshot.height,
        })),
      });
    }

    await tx.tool.update({
      where: { id: tool.id },
      data: {
        logoMediaId: logoMedia.id,
      },
    });

    await replaceToolCategories(tx, tool.id, input.categoryIds);
    await replaceToolTags(tx, tool.id, input.tagIds);

    const createdTool = await getToolById(tx, tool.id);

    if (!createdTool) {
      throw new AppError(500, "Tool created but could not be reloaded.");
    }

    return createdTool;
  });
}

export async function updateAdminTool(toolId: string, input: AdminToolUpdateInput) {
  const existing = await getToolById(prisma, toolId);

  if (!existing) {
    throw new AppError(404, "Tool not found.");
  }

  if (input.categoryIds || input.tagIds) {
    await assertCatalogAssignments(
      input.categoryIds ?? existing.toolCategories.map((item) => item.categoryId),
      input.tagIds ?? existing.toolTags.map((item) => item.tagId),
    );
  }

  return prisma.$transaction(async (tx) => {
    const nextSlug =
      input.slug && input.slug !== existing.slug
        ? await createUniqueToolSlug(input.slug, tx)
        : undefined;

    await tx.tool.update({
      where: { id: toolId },
      data: {
        ownerUserId: input.ownerUserId,
        slug: nextSlug,
        name: input.name,
        tagline: input.tagline,
        websiteUrl: input.websiteUrl,
        richDescription: input.richDescription,
        pricingModel: input.pricingModel,
        affiliateUrl: input.affiliateUrl,
        affiliateSource: input.affiliateSource,
        hasAffiliateProgram: input.hasAffiliateProgram,
        moderationStatus: input.moderationStatus,
        publicationStatus: input.publicationStatus,
        launchBadgeRequired: input.launchBadgeRequired,
        badgeVerification: input.badgeVerification,
        isFeatured: input.isFeatured,
        founderXUrl: input.founderXUrl,
        founderGithubUrl: input.founderGithubUrl,
        founderLinkedinUrl: input.founderLinkedinUrl,
        founderFacebookUrl: input.founderFacebookUrl,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        canonicalUrl: input.canonicalUrl,
        internalNote: input.internalNote,
      },
    });

    if (input.logo) {
      if (existing.logoMediaId) {
        await tx.toolMedia.update({
          where: { id: existing.logoMediaId },
          data: input.logo,
        });
      } else {
        const logoMedia = await tx.toolMedia.create({
          data: {
            toolId,
            type: "LOGO",
            sortOrder: 0,
            ...input.logo,
          },
        });

        await tx.tool.update({
          where: { id: toolId },
          data: {
            logoMediaId: logoMedia.id,
          },
        });
      }
    }

    if (input.screenshots) {
      await tx.toolMedia.deleteMany({
        where: {
          toolId,
          type: "SCREENSHOT",
        },
      });

      if (input.screenshots.length > 0) {
        await tx.toolMedia.createMany({
          data: input.screenshots.map((screenshot, index) => ({
            toolId,
            type: "SCREENSHOT",
            sortOrder: index,
            url: screenshot.url,
            publicId: screenshot.publicId,
            format: screenshot.format,
            width: screenshot.width,
            height: screenshot.height,
          })),
        });
      }
    }

    if (input.categoryIds) {
      await replaceToolCategories(tx, toolId, input.categoryIds);
    }

    if (input.tagIds) {
      await replaceToolTags(tx, toolId, input.tagIds);
    }

    const updatedTool = await getToolById(tx, toolId);

    if (!updatedTool) {
      throw new AppError(500, "Tool updated but could not be reloaded.");
    }

    return updatedTool;
  });
}

export async function listPublishedTools(options?: { take?: number }) {
  return prisma.tool.findMany({
    where: getPubliclyVisibleToolWhere(),
    include: toolDetailsInclude,
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: options?.take,
  });
}

export type PublicToolSearchResult = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  isFeatured: boolean;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

function getSearchRank(
  tool: {
    name: string;
    tagline: string;
    toolCategories: { category: { name: string } }[];
    toolTags: { tag: { name: string } }[];
  },
  query: string,
) {
  const normalizedQuery = query.toLowerCase();
  const normalizedName = tool.name.toLowerCase();
  const normalizedTagline = tool.tagline.toLowerCase();
  const categoryNames = tool.toolCategories.map((item) =>
    item.category.name.toLowerCase(),
  );
  const tagNames = tool.toolTags.map((item) => item.tag.name.toLowerCase());

  if (
    normalizedName === normalizedQuery ||
    normalizedName.startsWith(normalizedQuery)
  ) {
    return 0;
  }

  if (normalizedName.includes(normalizedQuery)) {
    return 1;
  }

  if (normalizedTagline.includes(normalizedQuery)) {
    return 2;
  }

  if (categoryNames.some((value) => value.includes(normalizedQuery))) {
    return 3;
  }

  if (tagNames.some((value) => value.includes(normalizedQuery))) {
    return 4;
  }

  return 5;
}

export async function searchPublishedTools(
  query: string,
): Promise<PublicToolSearchResult[]> {
  const normalizedQuery = query.trim();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const tools = await prisma.tool.findMany({
    where: {
      ...getPubliclyVisibleToolWhere(),
      OR: [
        { name: { contains: normalizedQuery, mode: "insensitive" } },
        { tagline: { contains: normalizedQuery, mode: "insensitive" } },
        {
          toolCategories: {
            some: {
              category: {
                name: { contains: normalizedQuery, mode: "insensitive" },
              },
            },
          },
        },
        {
          toolTags: {
            some: {
              tag: {
                name: { contains: normalizedQuery, mode: "insensitive" },
              },
            },
          },
        },
      ],
    },
    include: {
      logoMedia: true,
      toolCategories: {
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      },
      toolTags: {
        include: { tag: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 12,
  });

  return tools
    .sort((left, right) => {
      return (
        getSearchRank(left, normalizedQuery) -
          getSearchRank(right, normalizedQuery) ||
        Number(right.isFeatured) - Number(left.isFeatured) ||
        left.name.localeCompare(right.name)
      );
    })
    .slice(0, 8)
    .map((tool) => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      tagline: tool.tagline,
      logoUrl: tool.logoMedia?.url ?? null,
      isFeatured: tool.isFeatured,
      categories: tool.toolCategories.map((item) => ({
        slug: item.category.slug,
        name: item.category.name,
      })),
      tags: tool.toolTags.map((item) => ({
        slug: item.tag.slug,
        name: item.tag.name,
      })),
    }));
}

export async function getPublishedToolBySlug(slug: string) {
  const tool = await prisma.tool.findFirst({
    where: {
      slug,
      ...getPubliclyVisibleToolWhere(),
    },
    select: publicToolDetailSelect,
  });

  if (!tool) {
    return null;
  }

  return {
    ...tool,
    upvoteCount: tool._count.toolVotes,
  };
}

export async function listRelatedPublishedTools(
  toolId: string,
  options: {
    categoryIds?: string[];
    tagIds?: string[];
    take?: number;
  },
) {
  const categoryIds = options.categoryIds ?? [];
  const tagIds = options.tagIds ?? [];

  if (categoryIds.length === 0 && tagIds.length === 0) {
    return [];
  }

  return prisma.tool.findMany({
    where: {
      id: {
        not: toolId,
      },
      ...getPubliclyVisibleToolWhere(),
      OR: [
        categoryIds.length > 0
          ? {
              toolCategories: {
                some: {
                  categoryId: {
                    in: categoryIds,
                  },
                },
              },
            }
          : undefined,
        tagIds.length > 0
          ? {
              toolTags: {
                some: {
                  tagId: {
                    in: tagIds,
                  },
                },
              },
            }
          : undefined,
      ].filter(Boolean) as Prisma.ToolWhereInput[],
    },
    select: publicRelatedToolSelect,
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: options.take ?? 4,
  });
}

export async function listFounderTools(ownerUserId: string) {
  return listToolSummariesByOwner(prisma, ownerUserId);
}

export async function getFounderToolById(ownerUserId: string, toolId: string) {
  return getToolByOwner(prisma, ownerUserId, toolId);
}

export async function getFounderToolEditorById(
  ownerUserId: string,
  toolId: string,
) {
  return getToolEditorByOwner(prisma, ownerUserId, toolId);
}

export async function deleteFounderTool(ownerUserId: string, toolId: string) {
  const existing = await getToolByOwner(prisma, ownerUserId, toolId);

  if (!existing) {
    throw new AppError(404, "Tool not found.");
  }

  const publicIds = [
    existing.logoMedia?.publicId,
    ...existing.media.map((media) => media.publicId),
  ].filter((publicId): publicId is string => Boolean(publicId));

  await prisma.tool.delete({
    where: { id: toolId },
  });

  if (publicIds.length > 0) {
    await Promise.allSettled(
      publicIds.map((publicId) => deleteImageFromCloudinary(publicId)),
    );
  }

  return {
    id: existing.id,
    slug: existing.slug,
    name: existing.name,
  };
}

export async function updateFounderTool(
  ownerUserId: string,
  toolId: string,
  input: FounderToolUpdateInput,
) {
  const existing = await getToolEditorByOwner(prisma, ownerUserId, toolId);

  if (!existing) {
    throw new AppError(404, "Tool not found.");
  }

  const existingCategoryIds = existing.toolCategories.map(
    (item) => item.categoryId,
  );
  const categoriesChanged = !haveSameOrderedIds(
    existingCategoryIds,
    input.categoryIds,
  );
  const existingTagIds = existing.toolTags.map((item) => item.tagId);
  const tagsChanged = !haveSameOrderedIds(existingTagIds, input.tagIds);

  if (categoriesChanged || tagsChanged) {
    await assertCatalogAssignments(input.categoryIds, input.tagIds);
  }

  const txResult = await prisma.$transaction(async (tx) => {
    const nextSlug =
      input.slug && input.slug !== existing.slug
        ? await createUniqueToolSlug(input.slug, tx)
        : undefined;
    const nextToolData: Prisma.ToolUpdateInput = {};

    if (nextSlug) {
      nextToolData.slug = nextSlug;
    }

    if (input.name !== existing.name) {
      nextToolData.name = input.name;
    }

    if (input.tagline !== existing.tagline) {
      nextToolData.tagline = input.tagline;
    }

    if (input.websiteUrl !== existing.websiteUrl) {
      nextToolData.websiteUrl = input.websiteUrl;
    }

    if (input.richDescription !== existing.richDescription) {
      nextToolData.richDescription = input.richDescription;
    }

    if (input.pricingModel !== existing.pricingModel) {
      nextToolData.pricingModel = input.pricingModel;
    }

    if (input.hasAffiliateProgram !== existing.hasAffiliateProgram) {
      nextToolData.hasAffiliateProgram = input.hasAffiliateProgram;
    }

    const nextFounderXUrl = input.founderXUrl ?? null;
    if (nextFounderXUrl !== (existing.founderXUrl ?? null)) {
      nextToolData.founderXUrl = nextFounderXUrl;
    }

    const nextFounderGithubUrl = input.founderGithubUrl ?? null;
    if (nextFounderGithubUrl !== (existing.founderGithubUrl ?? null)) {
      nextToolData.founderGithubUrl = nextFounderGithubUrl;
    }

    const nextFounderLinkedinUrl = input.founderLinkedinUrl ?? null;
    if (nextFounderLinkedinUrl !== (existing.founderLinkedinUrl ?? null)) {
      nextToolData.founderLinkedinUrl = nextFounderLinkedinUrl;
    }

    const nextFounderFacebookUrl = input.founderFacebookUrl ?? null;
    if (nextFounderFacebookUrl !== (existing.founderFacebookUrl ?? null)) {
      nextToolData.founderFacebookUrl = nextFounderFacebookUrl;
    }

    if (Object.keys(nextToolData).length > 0) {
      await tx.tool.update({
        where: { id: toolId },
        data: nextToolData,
      });
    }

    if (input.logo) {
      if (existing.logoMedia?.id) {
        await tx.toolMedia.update({
          where: { id: existing.logoMedia.id },
          data: input.logo,
        });
      } else {
        const logoMedia = await tx.toolMedia.create({
          data: {
            toolId,
            type: "LOGO",
            sortOrder: 0,
            ...input.logo,
          },
        });

        await tx.tool.update({
          where: { id: toolId },
          data: {
            logoMediaId: logoMedia.id,
          },
        });
      }
    }

    const keptExistingScreenshots = existing.media.filter((media) =>
      input.existingScreenshotIds.includes(media.id),
    );
    const removedScreenshots = existing.media.filter(
      (media) => !input.existingScreenshotIds.includes(media.id),
    );
    const hasScreenshotChanges =
      removedScreenshots.length > 0 || (input.screenshots?.length ?? 0) > 0;

    if (hasScreenshotChanges) {
      await tx.toolMedia.deleteMany({
        where: {
          toolId,
          type: "SCREENSHOT",
        },
      });

      const nextScreenshots = [
        ...keptExistingScreenshots.map((media) => ({
          url: media.url,
          publicId: media.publicId ?? undefined,
          format: media.format ?? undefined,
          width: media.width ?? undefined,
          height: media.height ?? undefined,
        })),
        ...(input.screenshots ?? []),
      ].slice(0, 3);

      if (nextScreenshots.length > 0) {
        await tx.toolMedia.createMany({
          data: nextScreenshots.map((screenshot, index) => ({
            toolId,
            type: "SCREENSHOT",
            sortOrder: index,
            url: screenshot.url,
            publicId: screenshot.publicId,
            format: screenshot.format,
            width: screenshot.width,
            height: screenshot.height,
          })),
        });
      }
    }

    if (categoriesChanged) {
      await replaceToolCategories(tx, toolId, input.categoryIds);
    }

    if (tagsChanged) {
      await replaceToolTags(tx, toolId, input.tagIds);
    }

    return {
      replacedLogoPublicId:
        input.logo && existing.logoMedia?.publicId
          ? existing.logoMedia.publicId
          : null,
      removedScreenshotPublicIds: removedScreenshots
        .map((media) => media.publicId)
        .filter((publicId): publicId is string => Boolean(publicId)),
    };
  }, {
    maxWait: 15_000,
    timeout: 15_000,
  });

  const updatedTool = await getToolEditorById(prisma, toolId);

  if (!updatedTool) {
    throw new AppError(500, "Tool updated but could not be reloaded.");
  }

  return Promise.resolve(txResult).then(async (result) => {
    const deletions: Promise<unknown>[] = [];

    if (
      result.replacedLogoPublicId &&
      result.replacedLogoPublicId !== input.logo?.publicId
    ) {
      deletions.push(deleteImageFromCloudinary(result.replacedLogoPublicId));
    }

    result.removedScreenshotPublicIds.forEach((publicId) => {
      if (!(input.screenshots ?? []).some((item) => item.publicId === publicId)) {
        deletions.push(deleteImageFromCloudinary(publicId));
      }
    });

    if (deletions.length > 0) {
      await Promise.allSettled(deletions);
    }

    return updatedTool;
  });
}
