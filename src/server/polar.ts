import { Polar } from "@polar-sh/sdk";

import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";

export function getPolarClient() {
  const env = getEnv();

  if (!env.POLAR_ACCESS_TOKEN) {
    throw new AppError(500, "Polar access token is not configured.");
  }

  return new Polar({
    accessToken: env.POLAR_ACCESS_TOKEN,
    server: env.POLAR_SERVER,
  });
}

export function getPolarCheckoutUrls() {
  const env = getEnv();

  return {
    successUrl:
      env.POLAR_SUCCESS_URL ??
      `${env.NEXT_PUBLIC_APP_URL}/dashboard?checkout=success&checkout_id={CHECKOUT_ID}`,
    returnUrl: env.POLAR_RETURN_URL ?? `${env.NEXT_PUBLIC_APP_URL}/submit`,
  };
}
