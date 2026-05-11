import { errorResponse, ok } from "@/server/http/response";
import { getServerSession } from "@/server/auth/session";
import {
  countActiveSponsorPlacements,
  listFounderSponsorEligibleTools,
} from "@/server/services/sponsor-placement-service";

export type SponsorEligibilityTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  hasActiveSponsor: boolean;
};

export type SponsorEligibilityResponse = {
  isSignedIn: boolean;
  soldOut: boolean;
  activeCount: number;
  tools: SponsorEligibilityTool[];
};

export async function GET() {
  try {
    const session = await getServerSession();
    const isSignedIn = Boolean(session?.user);

    const [activeCount, tools] = await Promise.all([
      countActiveSponsorPlacements(),
      isSignedIn
        ? listFounderSponsorEligibleTools(session!.user.id)
        : Promise.resolve([] as Awaited<ReturnType<typeof listFounderSponsorEligibleTools>>),
    ]);

    const data: SponsorEligibilityResponse = {
      isSignedIn,
      soldOut: activeCount >= 3,
      activeCount,
      tools: tools.map((tool) => ({
        id: tool.id,
        slug: tool.slug,
        name: tool.name,
        tagline: tool.tagline,
        hasActiveSponsor: tool.sponsorPlacements.length > 0,
      })),
    };

    return ok(data);
  } catch (error) {
    return errorResponse(error);
  }
}
