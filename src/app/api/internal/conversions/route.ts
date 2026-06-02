import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";
import { listPaidConversions } from "@/server/services/conversions-export-service";

export const dynamic = "force-dynamic";

function assertConversionsAccess(request: NextRequest) {
  const env = getEnv();
  const configuredSecret = env.CONVERSIONS_SYNC_SECRET?.trim();

  if (!configuredSecret) {
    if (env.APP_ENV === "production") {
      throw new AppError(
        500,
        "CONVERSIONS_SYNC_SECRET must be configured before exporting conversions in production.",
      );
    }
    return;
  }

  const bearer = request.headers.get("authorization");
  const provided =
    bearer?.startsWith("Bearer ")
      ? bearer.slice("Bearer ".length).trim()
      : request.headers.get("x-conversions-secret")?.trim() ?? "";

  if (provided !== configuredSecret) {
    throw new AppError(401, "Invalid conversions sync secret.");
  }
}

export async function GET(request: NextRequest) {
  try {
    assertConversionsAccess(request);

    const sinceParam = request.nextUrl.searchParams.get("since");
    let since: Date | undefined;
    if (sinceParam) {
      const parsed = new Date(sinceParam);
      if (Number.isNaN(parsed.getTime())) {
        throw new AppError(400, "`since` must be a valid ISO date.");
      }
      since = parsed;
    }

    const conversions = await listPaidConversions(since);

    return ok({ conversions, generatedAt: new Date().toISOString() });
  } catch (error) {
    return errorResponse(error);
  }
}
