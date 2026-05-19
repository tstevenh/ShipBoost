import { errorResponse, ok } from "@/server/http/response";
import { getServerSession } from "@/server/auth/session";
import {
  countActiveSponsorPlacementsBySlot,
  listFounderSponsorEligibleTools,
} from "@/server/services/sponsor-placement-service";
import {
  getSponsorSlotConfig,
  ALL_SPONSOR_SLOTS,
} from "@/server/services/sponsor-pricing";
import type { SponsorSlot } from "@prisma/client";

export type SponsorEligibilityTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  activeSlots: SponsorSlot[];
};

export type SponsorEligibilitySlot = {
  slot: SponsorSlot;
  label: string;
  description: string;
  priceUsd: number;
  inventoryCap: number;
  activeCount: number;
  soldOut: boolean;
};

export type SponsorEligibilityResponse = {
  isSignedIn: boolean;
  tools: SponsorEligibilityTool[];
  slots: SponsorEligibilitySlot[];
};

export async function GET() {
  try {
    const session = await getServerSession();
    const isSignedIn = Boolean(session?.user);

    const [slotCounts, tools] = await Promise.all([
      countActiveSponsorPlacementsBySlot(),
      isSignedIn
        ? listFounderSponsorEligibleTools(session!.user.id)
        : Promise.resolve(
            [] as Awaited<ReturnType<typeof listFounderSponsorEligibleTools>>,
          ),
    ]);

    const slots: SponsorEligibilitySlot[] = ALL_SPONSOR_SLOTS.map((slot) => {
      const config = getSponsorSlotConfig(slot);
      const activeCount = slotCounts[slot];
      return {
        slot,
        label: config.label,
        description: config.description,
        priceUsd: config.priceUsd,
        inventoryCap: config.inventoryCap,
        activeCount,
        soldOut: activeCount >= config.inventoryCap,
      };
    });

    const data: SponsorEligibilityResponse = {
      isSignedIn,
      slots,
      tools: tools.map((tool) => ({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        tagline: tool.tagline,
        activeSlots: tool.sponsorPlacements.map((p) => p.slot),
      })),
    };

    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
