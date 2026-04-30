import { prisma } from "@/server/db/client";
import { getDodoClient } from "@/server/dodo";
import { sendSponsorPlacementRenewalReminderEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { getPublicLaunchWhere } from "@/server/services/public-tool-visibility";

const SPONSOR_SLOT_LIMIT = 3;
const SPONSOR_PLACEMENT_DAYS = 30;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

type FounderLike = {
  id: string;
  email: string;
  name?: string | null;
};

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * DAY_IN_MS);
}

function getActivePlacementWhere(now = new Date()) {
  return {
    status: "ACTIVE" as const,
    disabledAt: null,
    endsAt: { gt: now },
  };
}

function getVisiblePlacementWhere(now = new Date()) {
  return getActivePlacementWhere(now);
}

function getSponsorEligibleToolWhere(founderId: string, now = new Date()) {
  return {
    ownerUserId: founderId,
    publicationStatus: "PUBLISHED" as const,
    moderationStatus: "APPROVED" as const,
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
      {
        launches: {
          some: {
            status: "APPROVED" as const,
            launchDate: {
              gt: now,
            },
          },
        },
      },
    ],
  };
}

function getDodoSponsorPlacementReturnUrl(placementId: string) {
  const env = getEnv();
  const url = new URL(`${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/advertise`);

  url.searchParams.set("checkout", "success");
  url.searchParams.set("sponsor_placement_id", placementId);

  return url.toString();
}

export async function countActiveSponsorPlacements(now = new Date()) {
  return prisma.sponsorPlacement.count({
    where: getActivePlacementWhere(now),
  });
}

export async function listFounderSponsorEligibleTools(founderId: string) {
  return prisma.tool.findMany({
    where: getSponsorEligibleToolWhere(founderId),
    select: {
      id: true,
      slug: true,
      name: true,
      tagline: true,
      websiteUrl: true,
      logoMedia: { select: { url: true } },
      sponsorPlacements: {
        where: getActivePlacementWhere(),
        select: { id: true, endsAt: true },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function listActiveSponsorPlacements(now = new Date()) {
  return prisma.sponsorPlacement.findMany({
    where: {
      ...getVisiblePlacementWhere(now),
      tool: {
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
    },
    select: {
      id: true,
      startsAt: true,
      endsAt: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          websiteUrl: true,
          logoMedia: { select: { url: true } },
          toolCategories: {
            select: { category: { select: { name: true, slug: true } } },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { startsAt: "asc" },
    take: SPONSOR_SLOT_LIMIT,
  });
}

export async function listFounderSponsorPlacements(founderId: string) {
  return prisma.sponsorPlacement.findMany({
    where: {
      disabledAt: null,
      status: {
        in: ["PENDING_PAYMENT", "ACTIVE", "PAID_WAITLISTED", "EXPIRED"],
      },
      tool: {
        ownerUserId: founderId,
      },
    },
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      paidAt: true,
      createdAt: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          websiteUrl: true,
          logoMedia: { select: { url: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
}

export async function createSponsorPlacementCheckout(
  toolId: string,
  founder: FounderLike,
) {
  const tool = await prisma.tool.findFirst({
    where: {
      id: toolId,
      ...getSponsorEligibleToolWhere(founder.id),
      sponsorPlacements: {
        none: getActivePlacementWhere(),
      },
    },
    select: {
      id: true,
      name: true,
      launches: {
        select: {
          status: true,
          launchDate: true,
        },
      },
    },
  });

  if (!tool) {
    throw new AppError(400, "Tool is not eligible for sponsor placement.");
  }

  if ((await countActiveSponsorPlacements()) >= SPONSOR_SLOT_LIMIT) {
    throw new AppError(409, "Sponsor placements are sold out.");
  }

  const env = getEnv();

  if (!env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID) {
    throw new AppError(
      500,
      "Dodo sponsor placement product is not configured.",
    );
  }

  const placement = await prisma.sponsorPlacement.create({
    data: {
      toolId: tool.id,
      status: "PENDING_PAYMENT",
    },
    select: { id: true },
  });

  let checkout: Awaited<
    ReturnType<ReturnType<typeof getDodoClient>["checkoutSessions"]["create"]>
  >;

  try {
    checkout = await getDodoClient().checkoutSessions.create({
      product_cart: [
        {
          product_id: env.DODO_SPONSOR_PLACEMENT_PRODUCT_ID,
          quantity: 1,
        },
      ],
      customer: {
        email: founder.email,
        name: founder.name ?? undefined,
      },
      return_url: getDodoSponsorPlacementReturnUrl(placement.id),
      metadata: {
        shipboostProduct: "sponsor_placement",
        shipboostToolId: tool.id,
        shipboostSponsorPlacementId: placement.id,
      },
    });
  } catch (error) {
    await prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: {
        status: "DISABLED",
        disabledAt: new Date(),
      },
    });
    throw error;
  }

  if (!checkout.checkout_url || !checkout.session_id) {
    throw new AppError(
      500,
      "Dodo checkout url or session id is missing from the session response.",
    );
  }

  await prisma.sponsorPlacement.update({
    where: { id: placement.id },
    data: { checkoutSessionId: checkout.session_id },
  });

  return {
    checkoutUrl: checkout.checkout_url,
    checkoutId: checkout.session_id,
  };
}

export async function reconcileSponsorPlacementPayment(input: {
  placementId?: string;
  paymentId: string;
  founderUserId: string;
}) {
  let normalizedPlacementId = input.placementId?.trim() ?? "";
  const normalizedPaymentId = input.paymentId.trim();
  const normalizedFounderUserId = input.founderUserId.trim();

  if (!normalizedPaymentId || !normalizedFounderUserId) {
    return null;
  }

  const dodo = getDodoClient();
  let payment: Awaited<ReturnType<typeof dodo.payments.retrieve>> | null = null;

  if (!normalizedPlacementId) {
    payment = await dodo.payments.retrieve(normalizedPaymentId);

    if (payment.status !== "succeeded") {
      return null;
    }

    const metadataPlacementId = payment.metadata?.shipboostSponsorPlacementId;

    if (typeof metadataPlacementId !== "string" || !metadataPlacementId.trim()) {
      return null;
    }

    normalizedPlacementId = metadataPlacementId.trim();
  }

  const existingPlacement = await prisma.sponsorPlacement.findUnique({
    where: { id: normalizedPlacementId },
    select: {
      id: true,
      status: true,
      startsAt: true,
      paymentId: true,
      tool: {
        select: {
          ownerUserId: true,
          launches: {
            select: {
              status: true,
              launchDate: true,
            },
          },
        },
      },
    },
  });

  if (!existingPlacement) {
    return null;
  }

  if (existingPlacement.tool.ownerUserId !== normalizedFounderUserId) {
    throw new AppError(
      403,
      "This sponsor placement does not belong to your account.",
    );
  }

  if (
    existingPlacement.status === "ACTIVE" ||
    existingPlacement.status === "PAID_WAITLISTED"
  ) {
    return existingPlacement;
  }

  payment ??= await dodo.payments.retrieve(normalizedPaymentId);

  if (payment.status !== "succeeded") {
    return existingPlacement;
  }

  const metadataProduct = payment.metadata?.shipboostProduct;
  const metadataPlacementId = payment.metadata?.shipboostSponsorPlacementId;

  if (
    typeof metadataProduct === "string" &&
    metadataProduct !== "sponsor_placement"
  ) {
    throw new AppError(
      409,
      "This payment does not belong to a sponsor placement.",
    );
  }

  if (
    typeof metadataPlacementId === "string" &&
    metadataPlacementId !== normalizedPlacementId
  ) {
    throw new AppError(
      409,
      "This payment does not belong to the current sponsor placement.",
    );
  }

  return handleSponsorPlacementPaymentSucceeded({
    paymentId: payment.payment_id,
    checkoutSessionId: payment.checkout_session_id ?? null,
    metadata: {
      ...(payment.metadata ?? {}),
      shipboostSponsorPlacementId: normalizedPlacementId,
    },
  });
}

export async function handleSponsorPlacementPaymentSucceeded(input: {
  paymentId: string;
  checkoutSessionId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  const placementId =
    typeof input.metadata?.shipboostSponsorPlacementId === "string"
      ? input.metadata.shipboostSponsorPlacementId
      : null;

  const placement = placementId
    ? await prisma.sponsorPlacement.findUnique({
        where: { id: placementId },
        select: {
          id: true,
          status: true,
          startsAt: true,
          tool: {
            select: {
              launches: {
                select: {
                  status: true,
                  launchDate: true,
                },
              },
            },
          },
        },
      })
    : input.checkoutSessionId
      ? await prisma.sponsorPlacement.findUnique({
          where: { checkoutSessionId: input.checkoutSessionId },
          select: {
            id: true,
            status: true,
            startsAt: true,
            tool: {
              select: {
                launches: {
                  select: {
                    status: true,
                    launchDate: true,
                  },
                },
              },
            },
          },
        })
      : null;

  if (!placement) {
    return null;
  }

  if (placement.status === "ACTIVE") {
    return placement;
  }

  const now = new Date();
  const startsAt = now;

  if ((await countActiveSponsorPlacements(now)) >= SPONSOR_SLOT_LIMIT) {
    return prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: {
        status: "PAID_WAITLISTED",
        paidAt: now,
        paymentId: input.paymentId,
        checkoutSessionId: input.checkoutSessionId ?? undefined,
      },
    });
  }

  return prisma.sponsorPlacement.update({
    where: { id: placement.id },
    data: {
      status: "ACTIVE",
      paidAt: now,
      startsAt,
      endsAt: addDays(startsAt, SPONSOR_PLACEMENT_DAYS),
      paymentId: input.paymentId,
      checkoutSessionId: input.checkoutSessionId ?? undefined,
    },
  });
}

export async function listAdminSponsorPlacements() {
  return prisma.sponsorPlacement.findMany({
    select: {
      id: true,
      status: true,
      startsAt: true,
      endsAt: true,
      paidAt: true,
      disabledAt: true,
      checkoutSessionId: true,
      paymentId: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          owner: { select: { email: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });
}

export async function disableSponsorPlacement(placementId: string) {
  return prisma.sponsorPlacement.update({
    where: { id: placementId },
    data: {
      status: "DISABLED",
      disabledAt: new Date(),
    },
  });
}

export async function processSponsorPlacementLifecycle(now = new Date()) {
  const expired = await prisma.sponsorPlacement.updateMany({
    where: {
      status: "ACTIVE",
      endsAt: { lte: now },
    },
    data: {
      status: "EXPIRED",
    },
  });

  const reminderThreshold = addDays(now, 7);
  const placements = await prisma.sponsorPlacement.findMany({
    where: {
      status: "ACTIVE",
      renewalReminderSentAt: null,
      endsAt: {
        gt: now,
        lte: reminderThreshold,
      },
    },
    select: {
      id: true,
      endsAt: true,
      tool: {
        select: {
          name: true,
          owner: { select: { email: true } },
        },
      },
    },
  });

  let remindersSent = 0;
  const advertiseUrl = `${getEnv().NEXT_PUBLIC_APP_URL.replace(
    /\/$/,
    "",
  )}/advertise`;

  for (const placement of placements) {
    if (!placement.endsAt || !placement.tool.owner?.email) {
      continue;
    }

    await sendSponsorPlacementRenewalReminderEmailMessage({
      to: placement.tool.owner.email,
      toolName: placement.tool.name,
      endsAt: placement.endsAt.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      advertiseUrl,
    });

    await prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: { renewalReminderSentAt: now },
    });

    remindersSent += 1;
  }

  return {
    expiredCount: expired.count,
    remindersSent,
  };
}
