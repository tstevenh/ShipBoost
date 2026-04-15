import DodoPayments from "dodopayments";

import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";

export function getDodoEnvironment() {
  return getEnv().DODO_PAYMENTS_MODE === "test" ? "test_mode" : "live_mode";
}

export function getDodoClient() {
  const env = getEnv();

  if (!env.DODO_PAYMENTS_API_KEY) {
    throw new AppError(500, "Dodo Payments API key is not configured.");
  }

  return new DodoPayments({
    bearerToken: env.DODO_PAYMENTS_API_KEY,
    environment: getDodoEnvironment(),
  });
}

export function getDodoDashboardReturnUrl(submissionId: string) {
  const env = getEnv();
  const url = new URL(
    env.DODO_PAYMENTS_RETURN_URL ?? `${env.NEXT_PUBLIC_APP_URL}/dashboard`,
  );

  url.searchParams.set("checkout", "success");
  url.searchParams.set("submission_id", submissionId);

  return url.toString();
}
