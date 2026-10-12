import { errorResponse, ok } from "@/server/http/response";
import { getLaunchVideoOffer } from "@/server/services/launch-video-service";

// Spots left and booked weeks change with every order; never serve a static copy.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return ok(await getLaunchVideoOffer());
  } catch (error) {
    return errorResponse(error);
  }
}
