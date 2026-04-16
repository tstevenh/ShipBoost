import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";
import { sendDuePremiumLaunchSpotlightReminders } from "@/server/services/premium-launch-spotlight-reminder-service";

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
        "CRON_SECRET must be configured before running spotlight reminders in production.",
      );
    }

    return;
  }

  if (getProvidedSecret(request) !== configuredSecret) {
    throw new AppError(401, "Invalid cron secret.");
  }
}

async function handleRequest(request: NextRequest) {
  try {
    assertCronAccess(request);
    return ok(await sendDuePremiumLaunchSpotlightReminders());
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
