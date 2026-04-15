import { beforeEach, describe, expect, it, vi } from "vitest";

const { getEnvMock, DodoPaymentsMock } = vi.hoisted(() => ({
  getEnvMock: vi.fn(),
  DodoPaymentsMock: vi.fn(),
}));

vi.mock("@/server/env", () => ({
  getEnv: getEnvMock,
}));

vi.mock("dodopayments", () => ({
  default: DodoPaymentsMock,
}));

describe("dodo", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("maps test mode and appends submission context to the dashboard return url", async () => {
    getEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: "https://shipboost.io",
      DODO_PAYMENTS_API_KEY: "dodo_test_key",
      DODO_PAYMENTS_MODE: "test",
      DODO_PAYMENTS_RETURN_URL: undefined,
    });

    const { getDodoClient, getDodoDashboardReturnUrl } = await import(
      "@/server/dodo"
    );

    getDodoClient();

    expect(DodoPaymentsMock).toHaveBeenCalledWith({
      bearerToken: "dodo_test_key",
      environment: "test_mode",
    });
    expect(getDodoDashboardReturnUrl("submission_1")).toBe(
      "https://shipboost.io/dashboard?checkout=success&submission_id=submission_1",
    );
  });

  it("uses the explicit return url when configured", async () => {
    getEnvMock.mockReturnValue({
      NEXT_PUBLIC_APP_URL: "https://shipboost.io",
      DODO_PAYMENTS_API_KEY: "dodo_live_key",
      DODO_PAYMENTS_MODE: "live",
      DODO_PAYMENTS_RETURN_URL: "https://shipboost.io/custom-dashboard?tab=billing",
    });

    const { getDodoClient, getDodoDashboardReturnUrl } = await import(
      "@/server/dodo"
    );

    getDodoClient();

    expect(DodoPaymentsMock).toHaveBeenCalledWith({
      bearerToken: "dodo_live_key",
      environment: "live_mode",
    });
    expect(getDodoDashboardReturnUrl("submission_42")).toBe(
      "https://shipboost.io/custom-dashboard?tab=billing&checkout=success&submission_id=submission_42",
    );
  });
});
