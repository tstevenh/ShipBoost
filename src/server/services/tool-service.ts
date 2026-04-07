import type { Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { toolDetailsInclude } from "@/server/db/includes";
import {
  deleteImageFromCloudinary,
  type UploadedCloudinaryAsset,
} from "@/server/cloudinary";
import { AppError } from "@/server/http/app-error";
import {
  getToolByOwner,
  getToolById,
  listTools,
  listToolsByOwner,
  replaceToolCategories,
  replaceToolTags,
} from "@/server/repositories/tool-repository";
import { createUniqueToolSlug } from "@/server/services/slug";
import { assertCatalogAssignments } from "@/server/services/catalog";
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
    where: {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    include: toolDetailsInclude,
    orderBy: [{ isFeatured: "desc" }, { updatedAt: "desc" }],
    take: options?.take,
  });
}

export async function getPublishedToolBySlug(slug: string) {
  return prisma.tool.findFirst({
    where: {
      slug,
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    include: toolDetailsInclude,
  });
}

export async function listFounderTools(ownerUserId: string) {
  return listToolsByOwner(prisma, ownerUserId);
}

export async function getFounderToolById(ownerUserId: string, toolId: string) {
  return getToolByOwner(prisma, ownerUserId, toolId);
}

export async function updateFounderTool(
  ownerUserId: string,
  toolId: string,
  input: FounderToolUpdateInput & {
    logo?: UploadedCloudinaryAsset;
    screenshots?: UploadedCloudinaryAsset[];
  },
) {
  const existing = await getToolByOwner(prisma, ownerUserId, toolId);

  if (!existing) {
    throw new AppError(404, "Tool not found.");
  }

  await assertCatalogAssignments(input.categoryIds, input.tagIds);

  const txResult = await prisma.$transaction(async (tx) => {
    const nextSlug =
      input.slug && input.slug !== existing.slug
        ? await createUniqueToolSlug(input.slug, tx)
        : undefined;

    await tx.tool.update({
      where: { id: toolId },
      data: {
        slug: nextSlug,
        name: input.name,
        tagline: input.tagline,
        websiteUrl: input.websiteUrl,
        richDescription: input.richDescription,
        pricingModel: input.pricingModel,
        affiliateUrl: input.affiliateUrl,
        affiliateSource: input.affiliateSource,
        hasAffiliateProgram: input.hasAffiliateProgram,
        founderXUrl: input.founderXUrl,
        founderGithubUrl: input.founderGithubUrl,
        founderLinkedinUrl: input.founderLinkedinUrl,
        founderFacebookUrl: input.founderFacebookUrl,
        metaTitle: input.metaTitle,
        metaDescription: input.metaDescription,
        canonicalUrl: input.canonicalUrl,
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

    const keptExistingScreenshots = existing.media.filter(
      (media) =>
        media.type === "SCREENSHOT" &&
        input.existingScreenshotIds.includes(media.id),
    );
    const removedScreenshots = existing.media.filter(
      (media) =>
        media.type === "SCREENSHOT" &&
        !input.existingScreenshotIds.includes(media.id),
    );

    if (input.screenshots || removedScreenshots.length > 0) {
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

    await replaceToolCategories(tx, toolId, input.categoryIds);
    await replaceToolTags(tx, toolId, input.tagIds);

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

  const updatedTool = await getToolById(prisma, toolId);

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
