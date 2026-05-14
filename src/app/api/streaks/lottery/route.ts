import type { NextRequest } from "next/server";
import { requireSession } from "@/server/auth/session";
import { rollLottery } from "@/server/services/streak-service";
import { errorResponse, ok } from "@/server/http/response";
import { AppError } from "@/server/http/app-error";

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    try {
      const result = await rollLottery(session.user.id);
      return ok(result);
    } catch (err) {
      // Convert generic lottery errors into a 400 AppError so they render nicely
      if (err instanceof Error) {
        throw new AppError(400, err.message);
      }
      throw err;
    }
  } catch (err) {
    return errorResponse(err);
  }
}
