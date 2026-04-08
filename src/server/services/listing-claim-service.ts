import type { ListingClaimStatus, Prisma } from "@prisma/client";

import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import {
  domainsMatchForClaim,
  getEmailDomain,
  getWebsiteDomain,
} from "@/server/services/claim-domain";
import type {
  ListingClaimListQuery,
  ListingClaimReviewInput,
} from "@/server/validators/listing-claim";

const listingClaimInclude = {
  tool: {
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      websiteUrl: true,
      moderationStatus: true,
      publicationStatus: true,
      ownerUserId: true,
      logoMedia: {
        select: {
          url: true,
        },
      },
    },
  },
  claimantUser: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  reviewedBy: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
} satisfies Prisma.ListingClaimInclude;

export type ListingClaimRecord = Prisma.ListingClaimGetPayload<{
  include: typeof listingClaimInclude;
}>;

export type ListingClaimState =
  | {
      status: "AVAILABLE";
      websiteDomain: string;
      claimDomain: string;
      canSubmit: true;
    }
  | {
      status:
        | "SIGN_IN_REQUIRED"
        | "OWNED"
        | "OWNED_BY_YOU"
        | "PENDING_OTHER";
      websiteDomain: string;
      canSubmit: false;
    }
  | {
      status: "DOMAIN_MISMATCH";
      websiteDomain: string;
      claimDomain: string;
      canSubmit: false;
    }
  | {
      status: "PENDING_YOURS" | "APPROVED_YOURS" | "REJECTED_YOURS";
      websiteDomain: string;
      canSubmit: boolean;
      claimId: string;
      claimDomain: string;
      founderVisibleNote: string | null;
      reviewedAt: Date | null;
    };

function buildSeededToolSnapshot(tool: {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  ownerUserId: string | null;
  moderationStatus: string;
  publicationStatus: string;
}) {
  return {
    id: tool.id,
    slug: tool.slug,
    name: tool.name,
    websiteUrl: tool.websiteUrl,
    ownerUserId: tool.ownerUserId,
    moderationStatus: tool.moderationStatus,
    publicationStatus: tool.publicationStatus,
  };
}

function getClaimSearchWhere(filters: ListingClaimListQuery): Prisma.ListingClaimWhereInput {
  return {
    status: filters.status,
    OR: filters.search
      ? [
          { claimEmail: { contains: filters.search, mode: "insensitive" } },
          {
            tool: {
              name: { contains: filters.search, mode: "insensitive" },
            },
          },
          {
            tool: {
              slug: { contains: filters.search, mode: "insensitive" },
            },
          },
        ]
      : undefined,
  };
}

export async function listAdminListingClaims(filters: ListingClaimListQuery = {}) {
  return prisma.listingClaim.findMany({
    where: getClaimSearchWhere(filters),
    include: listingClaimInclude,
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function listFounderListingClaims(claimantUserId: string) {
  return prisma.listingClaim.findMany({
    where: { claimantUserId },
    include: listingClaimInclude,
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function getListingClaimState(
  toolId: string,
  viewer?: { userId: string | null; email: string | null },
): Promise<ListingClaimState> {
  const tool = await prisma.tool.findUnique({
    where: { id: toolId },
    select: {
      id: true,
      ownerUserId: true,
      websiteUrl: true,
    },
  });

  if (!tool) {
    throw new AppError(404, "Tool not found.");
  }

  const websiteDomain = getWebsiteDomain(tool.websiteUrl);

  if (tool.ownerUserId) {
    return {
      status: tool.ownerUserId === viewer?.userId ? "OWNED_BY_YOU" : "OWNED",
      websiteDomain,
      canSubmit: false,
    };
  }

  const pendingClaim = await prisma.listingClaim.findFirst({
    where: {
      toolId,
      status: "PENDING",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (pendingClaim) {
    if (pendingClaim.claimantUserId === viewer?.userId) {
      return {
        status: "PENDING_YOURS",
        websiteDomain,
        canSubmit: false,
        claimId: pendingClaim.id,
        claimDomain: pendingClaim.claimDomain,
        founderVisibleNote: pendingClaim.founderVisibleNote,
        reviewedAt: pendingClaim.reviewedAt,
      };
    }

    return {
      status: "PENDING_OTHER",
      websiteDomain,
      canSubmit: false,
    };
  }

  if (!viewer?.userId || !viewer.email) {
    return {
      status: "SIGN_IN_REQUIRED",
      websiteDomain,
      canSubmit: false,
    };
  }

  const claimDomain = getEmailDomain(viewer.email);
  const latestViewerClaim = await prisma.listingClaim.findFirst({
    where: {
      toolId,
      claimantUserId: viewer.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (latestViewerClaim?.status === "APPROVED") {
    return {
      status: "APPROVED_YOURS",
      websiteDomain,
      canSubmit: false,
      claimId: latestViewerClaim.id,
      claimDomain,
      founderVisibleNote: latestViewerClaim.founderVisibleNote,
      reviewedAt: latestViewerClaim.reviewedAt,
    };
  }

  if (!domainsMatchForClaim(viewer.email, tool.websiteUrl)) {
    return {
      status: "DOMAIN_MISMATCH",
      websiteDomain,
      claimDomain,
      canSubmit: false,
    };
  }

  if (latestViewerClaim?.status === "REJECTED") {
    return {
      status: "REJECTED_YOURS",
      websiteDomain,
      canSubmit: true,
      claimId: latestViewerClaim.id,
      claimDomain,
      founderVisibleNote: latestViewerClaim.founderVisibleNote,
      reviewedAt: latestViewerClaim.reviewedAt,
    };
  }

  return {
    status: "AVAILABLE",
    websiteDomain,
    claimDomain,
    canSubmit: true,
  };
}

export async function createListingClaim(input: {
  toolId: string;
  claimantUserId: string;
  claimantEmail: string;
}) {
  const tool = await prisma.tool.findUnique({
    where: { id: input.toolId },
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      websiteUrl: true,
      moderationStatus: true,
      publicationStatus: true,
      ownerUserId: true,
    },
  });

  if (!tool) {
    throw new AppError(404, "Listing not found.");
  }

  if (
    tool.publicationStatus !== "PUBLISHED" ||
    tool.moderationStatus !== "APPROVED"
  ) {
    throw new AppError(400, "Only approved public listings can be claimed.");
  }

  if (tool.ownerUserId === input.claimantUserId) {
    throw new AppError(409, "You already own this listing.");
  }

  if (tool.ownerUserId) {
    throw new AppError(409, "This listing already has an owner.");
  }

  const claimDomain = getEmailDomain(input.claimantEmail);
  const websiteDomain = getWebsiteDomain(tool.websiteUrl);

  if (!domainsMatchForClaim(input.claimantEmail, tool.websiteUrl)) {
    throw new AppError(
      400,
      `Use a company email on ${websiteDomain} to claim this listing.`,
    );
  }

  const existingPendingClaim = await prisma.listingClaim.findFirst({
    where: {
      toolId: tool.id,
      status: "PENDING",
    },
    include: listingClaimInclude,
  });

  if (existingPendingClaim) {
    if (existingPendingClaim.claimantUserId === input.claimantUserId) {
      return existingPendingClaim;
    }

    throw new AppError(409, "This listing already has a pending claim review.");
  }

  return prisma.listingClaim.create({
    data: {
      toolId: tool.id,
      claimantUserId: input.claimantUserId,
      claimEmail: input.claimantEmail,
      claimDomain,
      websiteDomain,
      seededToolSnapshot: buildSeededToolSnapshot(tool),
    },
    include: listingClaimInclude,
  });
}

export async function reviewListingClaim(
  claimId: string,
  input: ListingClaimReviewInput,
  adminUserId: string,
) {
  const claim = await prisma.listingClaim.findUnique({
    where: { id: claimId },
    include: listingClaimInclude,
  });

  if (!claim) {
    throw new AppError(404, "Listing claim not found.");
  }

  if (claim.status !== "PENDING") {
    throw new AppError(409, "Only pending listing claims can be reviewed.");
  }

  const reviewedAt = new Date();

  if (input.action === "APPROVE") {
    return prisma.$transaction(async (tx) => {
      await tx.tool.update({
        where: { id: claim.toolId },
        data: {
          ownerUserId: claim.claimantUserId,
        },
      });

      return tx.listingClaim.update({
        where: { id: claim.id },
        data: {
          status: "APPROVED",
          founderVisibleNote:
            input.founderVisibleNote ??
            "Claim approved. You can now manage this listing from your dashboard.",
          internalAdminNote: input.internalAdminNote,
          reviewedAt,
          reviewedByUserId: adminUserId,
        },
        include: listingClaimInclude,
      });
    });
  }

  return prisma.listingClaim.update({
    where: { id: claim.id },
    data: {
      status: "REJECTED",
      founderVisibleNote:
        input.founderVisibleNote ??
        "Claim rejected. Use a company email matching the listing domain and try again if needed.",
      internalAdminNote: input.internalAdminNote,
      reviewedAt,
      reviewedByUserId: adminUserId,
    },
    include: listingClaimInclude,
  });
}

export function isClaimPending(status: ListingClaimStatus) {
  return status === "PENDING";
}
