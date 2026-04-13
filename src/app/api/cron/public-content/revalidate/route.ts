import type { NextRequest } from "next/server";

import { revalidateAllPublicContent } from "@/server/cache/public-content";
import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";

function getProvidedSecret(request: NextRequest) {
  const bearerHeader = request.headers.get("authorization");

  if (bearerHeader?.startsWith("Bearer ")) {
    return bearerHeader.slice("Bearer ".length).trim();
  }

  return request.headers.get("x-cron-secret")?.trim() ?? "";
}

function assertCronAccess(request: NextRequest) {
  const env = getEnv();
  const configuredSecret = env.CRON_SECRET?.trim();

  if (!configuredSecret) {
    if (env.APP_ENV === "production") {
      throw new AppError(
        500,
        "CRON_SECRET must be configured before running public cache revalidation in production.",
      );
    }

    return;
  }

  const providedSecret = getProvidedSecret(request);

  if (providedSecret !== configuredSecret) {
    throw new AppError(401, "Invalid cron secret.");
  }
}

async function handleRequest(request: NextRequest) {
  try {
    assertCronAccess(request);
    revalidateAllPublicContent();
    return ok({ revalidated: true });
  } catch (error) {
    return errorResponse(error);
  }
}

export async function GET(request: NextRequest) {
  return handleRequest(request);
}

export async function POST(request: NextRequest) {
  return handleRequest(request);
}
