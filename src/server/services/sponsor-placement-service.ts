import { prisma } from "@/server/db/client";
import { getDodoClient } from "@/server/dodo";
import { sendSponsorPlacementRenewalReminderEmailMessage } from "@/server/email/transactional";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { capturePostHogEventSafely } from "@/server/posthog";
import { getSponsorSlotConfig } from "@/server/services/sponsor-pricing";
import type { SponsorSlot } from "@prisma/client";

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

function getActivePlacementWhere(now = new Date(), slot?: SponsorSlot) {
  return {
    status: "ACTIVE" as const,
    disabledAt: null,
    endsAt: { gt: now },
    ...(slot ? { slot } : {}),
  };
}

function getVisiblePlacementWhere(now = new Date(), slot?: SponsorSlot) {
  return getActivePlacementWhere(now, slot);
}

function getSponsorEligibleToolWhere(founderId: string) {
  return {
    ownerUserId: founderId,
  };
}

function getDodoSponsorPlacementReturnUrl(placementId: string) {
  const env = getEnv();
  const url = new URL(
    `${env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "")}/api/sponsor/return`,
  );

  url.searchParams.set("sponsor_placement_id", placementId);

  return url.toString();
}

async function createDodoSponsorPlacementCheckout(input: {
  placementId: string;
  toolId: string;
  slot: SponsorSlot;
  founder: FounderLike;
}) {
  const slotConfig = getSponsorSlotConfig(input.slot);

  if (!slotConfig.dodoProductId) {
    throw new AppError(
      500,
      `Dodo product for ${input.slot} sponsor placement is not configured.`,
    );
  }

  const checkout = await getDodoClient().checkoutSessions.create({
    product_cart: [
      {
        product_id: slotConfig.dodoProductId,
        quantity: 1,
      },
    ],
    customer: {
      email: input.founder.email,
      name: input.founder.name ?? undefined,
    },
    return_url: getDodoSponsorPlacementReturnUrl(input.placementId),
    metadata: {
      shipboostProduct: "sponsor_placement",
      shipboostToolId: input.toolId,
      shipboostSponsorPlacementId: input.placementId,
      shipboostSponsorSlot: input.slot,
    },
  });

  if (!checkout.checkout_url || !checkout.session_id) {
    throw new AppError(
      500,
      "Dodo checkout url or session id is missing from the session response.",
    );
  }

  await prisma.sponsorPlacement.update({
    where: { id: input.placementId },
    data: { checkoutSessionId: checkout.session_id },
  });

  return {
    checkoutUrl: checkout.checkout_url,
    checkoutId: checkout.session_id,
  };
}

export async function countActiveSponsorPlacements(
  now = new Date(),
  slot?: SponsorSlot,
) {
  return prisma.sponsorPlacement.count({
    where: getActivePlacementWhere(now, slot),
  });
}

export async function countActiveSponsorPlacementsBySlot(
  now = new Date(),
): Promise<Record<SponsorSlot, number>> {
  const counts = await prisma.sponsorPlacement.groupBy({
    by: ["slot"],
    where: getActivePlacementWhere(now),
    _count: { id: true },
  });

  const result: Record<SponsorSlot, number> = {
    SIDEBAR: 0,
    INLINE_BANNER: 0,
    INLINE_PRODUCT: 0,
  };

  for (const row of counts) {
    result[row.slot] = row._count.id;
  }

  return result;
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
        select: { slot: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function listActiveSponsorPlacements(
  slot?: SponsorSlot,
  now = new Date(),
) {
  const config = slot ? getSponsorSlotConfig(slot) : null;
  return prisma.sponsorPlacement.findMany({
    where: {
      ...getVisiblePlacementWhere(now, slot),
      tool: {
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
    },
    select: {
      id: true,
      slot: true,
      startsAt: true,
      endsAt: true,
      tool: {
        select: {
          id: true,
          slug: true,
          name: true,
          tagline: true,
          websiteUrl: true,
          affiliateUrl: true,
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
    ...(config ? { take: config.inventoryCap } : {}),
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
      slot: true,
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
  slot: SponsorSlot = "SIDEBAR",
) {
  const slotConfig = getSponsorSlotConfig(slot);

  if (!slotConfig.dodoProductId) {
    throw new AppError(
      500,
      `Dodo product for ${slot} sponsor placement is not configured.`,
    );
  }

  const tool = await prisma.tool.findFirst({
    where: {
      id: toolId,
      ...getSponsorEligibleToolWhere(founder.id),
      sponsorPlacements: {
        none: getActivePlacementWhere(new Date(), slot),
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
    throw new AppError(
      400,
      "Tool is not eligible for this sponsor placement tier.",
    );
  }

  if ((await countActiveSponsorPlacements(new Date(), slot)) >= slotConfig.inventoryCap) {
    throw new AppError(409, `${slotConfig.label} sponsor placements are sold out.`);
  }

  const placement = await prisma.sponsorPlacement.create({
    data: {
      toolId: tool.id,
      slot,
      status: "PENDING_PAYMENT",
    },
    select: { id: true },
  });

  try {
    return await createDodoSponsorPlacementCheckout({
      placementId: placement.id,
      toolId: tool.id,
      slot,
      founder,
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
}

export async function createPendingSponsorPlacementCheckout(
  placementId: string,
  founder: FounderLike,
) {
  const placement = await prisma.sponsorPlacement.findUnique({
    where: { id: placementId },
    select: {
      id: true,
      slot: true,
      status: true,
      disabledAt: true,
      tool: {
        select: {
          id: true,
          ownerUserId: true,
          sponsorPlacements: {
            where: getActivePlacementWhere(new Date()),
            select: { slot: true },
          },
        },
      },
    },
  });

  if (!placement || placement.tool.ownerUserId !== founder.id) {
    throw new AppError(404, "Sponsor placement not found.");
  }

  if (placement.disabledAt || placement.status !== "PENDING_PAYMENT") {
    throw new AppError(409, "This sponsor placement is not awaiting payment.");
  }

  const slotConfig = getSponsorSlotConfig(placement.slot);
  if ((await countActiveSponsorPlacements(new Date(), placement.slot)) >= slotConfig.inventoryCap) {
    throw new AppError(409, `${slotConfig.label} sponsor placements are sold out.`);
  }

  if (placement.tool.sponsorPlacements.some((entry) => entry.slot === placement.slot)) {
    throw new AppError(409, `Tool already has an active ${slotConfig.label} sponsor placement.`);
  }

  return createDodoSponsorPlacementCheckout({
    placementId: placement.id,
    toolId: placement.tool.id,
    slot: placement.slot,
    founder,
  });
}

export async function cancelPendingSponsorPlacement(
  placementId: string,
  founderId: string,
) {
  const placement = await prisma.sponsorPlacement.findUnique({
    where: { id: placementId },
    select: {
      id: true,
      status: true,
      disabledAt: true,
      tool: {
        select: {
          ownerUserId: true,
        },
      },
    },
  });

  if (!placement || placement.tool.ownerUserId !== founderId) {
    throw new AppError(404, "Sponsor placement not found.");
  }

  if (placement.disabledAt || placement.status !== "PENDING_PAYMENT") {
    throw new AppError(409, "Only pending sponsor placements can be canceled.");
  }

  return prisma.sponsorPlacement.update({
    where: { id: placement.id },
    data: {
      status: "DISABLED",
      disabledAt: new Date(),
    },
    select: {
      id: true,
      status: true,
      disabledAt: true,
    },
  });
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
          toolId: true,
          slot: true,
          status: true,
          startsAt: true,
          tool: {
            select: {
              id: true,
              ownerUserId: true,
              slug: true,
              name: true,
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
            toolId: true,
            slot: true,
            status: true,
            startsAt: true,
            tool: {
              select: {
                id: true,
                ownerUserId: true,
                slug: true,
                name: true,
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

  const slotConfig = getSponsorSlotConfig(placement.slot);
  if ((await countActiveSponsorPlacements(now, placement.slot)) >= slotConfig.inventoryCap) {
    const updatedPlacement = await prisma.sponsorPlacement.update({
      where: { id: placement.id },
      data: {
        status: "PAID_WAITLISTED",
        paidAt: now,
        paymentId: input.paymentId,
        checkoutSessionId: input.checkoutSessionId ?? undefined,
      },
    });
    await capturePostHogEventSafely(
      {
        distinctId: placement.tool.ownerUserId ?? placement.toolId,
        event: "sponsor_placement_paid",
        properties: {
          sponsor_placement_id: placement.id,
          sponsor_slot: placement.slot,
          tool_id: placement.toolId,
          tool_slug: placement.tool.slug,
          tool_name: placement.tool.name,
          payment_id: input.paymentId,
          checkout_session_id: input.checkoutSessionId ?? null,
          sponsor_placement_status: "PAID_WAITLISTED",
        },
      },
      "sponsor-placement-paid-waitlisted",
    );
    return updatedPlacement;
  }

  const updatedPlacement = await prisma.sponsorPlacement.update({
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
  await capturePostHogEventSafely(
    {
      distinctId: placement.tool.ownerUserId ?? placement.toolId,
      event: "sponsor_placement_paid",
      properties: {
        sponsor_placement_id: placement.id,
        sponsor_slot: placement.slot,
        tool_id: placement.toolId,
        tool_slug: placement.tool.slug,
        tool_name: placement.tool.name,
        payment_id: input.paymentId,
        checkout_session_id: input.checkoutSessionId ?? null,
        sponsor_placement_status: "ACTIVE",
      },
    },
    "sponsor-placement-paid-active",
  );
  return updatedPlacement;
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
  )}/?advertise=1`;

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

export async function createPendingSponsorPlacements(
  toolId: string,
  founderId: string,
  slots: SponsorSlot[],
): Promise<Array<{ slot: SponsorSlot; placementId: string }>> {
  if (slots.length === 0) return [];

  const tool = await prisma.tool.findFirst({
    where: { id: toolId, ...getSponsorEligibleToolWhere(founderId) },
    select: { id: true },
  });

  if (!tool) {
    throw new AppError(400, "Tool is not eligible for sponsor placements.");
  }

  const now = new Date();
  const [activeCountsBySlot, activeForTool] = await Promise.all([
    countActiveSponsorPlacementsBySlot(now),
    prisma.sponsorPlacement.findMany({
      where: { toolId, slot: { in: slots }, ...getActivePlacementWhere(now) },
      select: { slot: true },
    }),
  ]);
  const activeSlotsForTool = new Set(activeForTool.map((p) => p.slot));

  for (const slot of slots) {
    const slotConfig = getSponsorSlotConfig(slot);

    if (!slotConfig.dodoProductId) {
      throw new AppError(500, `Dodo product for ${slot} sponsor placement is not configured.`);
    }

    if (activeCountsBySlot[slot] >= slotConfig.inventoryCap) {
      throw new AppError(409, `${slotConfig.label} sponsor placements are sold out.`);
    }

    if (activeSlotsForTool.has(slot)) {
      throw new AppError(409, `Tool already has an active ${slotConfig.label} sponsor placement.`);
    }
  }

  const created = await Promise.all(
    slots.map((slot) =>
      prisma.sponsorPlacement.create({
        data: { toolId, slot, status: "PENDING_PAYMENT" },
        select: { id: true, slot: true },
      }),
    ),
  );

  return created.map((row) => ({ slot: row.slot, placementId: row.id }));
}
