import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    tool: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    listingClaim: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

import {
  createListingClaim,
  getListingClaimState,
  reviewListingClaim,
} from "@/server/services/listing-claim-service";

describe("listing-claim-service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a claim when the founder email matches the tool domain", async () => {
    prismaMock.tool.findUnique.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      tagline: "Ship faster",
      websiteUrl: "https://app.acme.com",
      moderationStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
      ownerUserId: null,
    });
    prismaMock.listingClaim.findFirst.mockResolvedValueOnce(null);
    prismaMock.listingClaim.create.mockResolvedValueOnce({
      id: "claim_1",
      status: "PENDING",
      claimEmail: "founder@acme.com",
      claimDomain: "acme.com",
      websiteDomain: "app.acme.com",
      founderVisibleNote: null,
      internalAdminNote: null,
      reviewedAt: null,
      tool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        tagline: "Ship faster",
        websiteUrl: "https://app.acme.com",
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        ownerUserId: null,
        logoMedia: null,
      },
      claimantUser: {
        id: "user_1",
        name: "Founder",
        email: "founder@acme.com",
      },
      reviewedBy: null,
    });

    const claim = await createListingClaim({
      toolId: "tool_1",
      claimantUserId: "user_1",
      claimantEmail: "founder@acme.com",
    });

    expect(prismaMock.listingClaim.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          toolId: "tool_1",
          claimantUserId: "user_1",
          claimDomain: "acme.com",
        }),
      }),
    );
    expect(claim.id).toBe("claim_1");
  });

  it("blocks claim creation when another pending claim exists", async () => {
    prismaMock.tool.findUnique.mockResolvedValueOnce({
      id: "tool_1",
      slug: "acme",
      name: "Acme",
      tagline: "Ship faster",
      websiteUrl: "https://acme.com",
      moderationStatus: "APPROVED",
      publicationStatus: "PUBLISHED",
      ownerUserId: null,
    });
    prismaMock.listingClaim.findFirst.mockResolvedValueOnce({
      id: "claim_existing",
      claimantUserId: "user_2",
    });

    await expect(
      createListingClaim({
        toolId: "tool_1",
        claimantUserId: "user_1",
        claimantEmail: "founder@acme.com",
      }),
    ).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  it("returns a domain mismatch claim state for signed-in users on the wrong domain", async () => {
    prismaMock.tool.findUnique.mockResolvedValueOnce({
      id: "tool_1",
      ownerUserId: null,
      websiteUrl: "https://acme.com",
    });
    prismaMock.listingClaim.findFirst.mockResolvedValueOnce(null);
    prismaMock.listingClaim.findFirst.mockResolvedValueOnce(null);

    const state = await getListingClaimState("tool_1", {
      userId: "user_1",
      email: "founder@other.com",
    });

    expect(state).toEqual({
      status: "DOMAIN_MISMATCH",
      websiteDomain: "acme.com",
      claimDomain: "other.com",
      canSubmit: false,
    });
  });

  it("approves a pending claim and transfers ownership", async () => {
    prismaMock.listingClaim.findUnique.mockResolvedValueOnce({
      id: "claim_1",
      toolId: "tool_1",
      claimantUserId: "user_1",
      status: "PENDING",
      claimEmail: "founder@acme.com",
      claimDomain: "acme.com",
      websiteDomain: "acme.com",
      founderVisibleNote: null,
      internalAdminNote: null,
      reviewedAt: null,
      tool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        tagline: "Ship faster",
        websiteUrl: "https://acme.com",
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        ownerUserId: null,
        logoMedia: null,
      },
      claimantUser: {
        id: "user_1",
        name: "Founder",
        email: "founder@acme.com",
      },
      reviewedBy: null,
    });

    prismaMock.$transaction.mockImplementation(async (callback) =>
      callback({
        tool: {
          update: prismaMock.tool.update,
        },
        listingClaim: {
          update: prismaMock.listingClaim.update,
        },
      }),
    );

    prismaMock.listingClaim.update.mockResolvedValueOnce({
      id: "claim_1",
      status: "APPROVED",
      founderVisibleNote:
        "Claim approved. You can now manage this listing from your dashboard.",
      internalAdminNote: "Looks good.",
      reviewedAt: new Date(),
      tool: {
        id: "tool_1",
        slug: "acme",
        name: "Acme",
        tagline: "Ship faster",
        websiteUrl: "https://acme.com",
        moderationStatus: "APPROVED",
        publicationStatus: "PUBLISHED",
        ownerUserId: "user_1",
        logoMedia: null,
      },
      claimantUser: {
        id: "user_1",
        name: "Founder",
        email: "founder@acme.com",
      },
      reviewedBy: {
        id: "admin_1",
        name: "Admin",
        email: "admin@shipboost.com",
      },
    });

    const claim = await reviewListingClaim(
      "claim_1",
      { action: "APPROVE", internalAdminNote: "Looks good." },
      "admin_1",
    );

    expect(prismaMock.tool.update).toHaveBeenCalledWith({
      where: { id: "tool_1" },
      data: { ownerUserId: "user_1" },
    });
    expect(claim.status).toBe("APPROVED");
  });
});
