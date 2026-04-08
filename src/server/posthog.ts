import { getEnv } from "@/server/env";

type CaptureInput = {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
};

function getPostHogConfig() {
  const env = getEnv();

  return {
    key: env.POSTHOG_KEY,
    host: (env.POSTHOG_HOST ?? "https://us.i.posthog.com").replace(/\/$/, ""),
  };
}

export async function capturePostHogEvent(input: CaptureInput) {
  const config = getPostHogConfig();

  if (!config.key) {
    return;
  }

  await fetch(`${config.host}/capture/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: config.key,
      distinct_id: input.distinctId,
      event: input.event,
      properties: input.properties ?? {},
    }),
  });
}
