import { authClient } from "@/lib/auth-client";
import { captureBrowserPostHogEvent } from "@/lib/posthog-browser";
import { getEmailDomain } from "@/lib/posthog-shared";

type StartupDirectoriesAccessInput = {
  email: string;
  source: string;
  leadMagnet: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
};

export async function requestStartupDirectoriesAccess(
  input: StartupDirectoriesAccessInput,
) {
  const normalizedEmail = input.email.trim().toLowerCase();
  const response = await fetch("/api/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: normalizedEmail,
      source: input.source,
      leadMagnet: input.leadMagnet,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      utmContent: input.utmContent,
      utmTerm: input.utmTerm,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | { error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Unable to join the list right now.");
  }

  captureBrowserPostHogEvent("lead_magnet_submitted", {
    source: input.source,
    lead_magnet: input.leadMagnet,
    email_domain: getEmailDomain(normalizedEmail),
    utm_source: input.utmSource ?? null,
    utm_medium: input.utmMedium ?? null,
    utm_campaign: input.utmCampaign ?? null,
    utm_content: input.utmContent ?? null,
    utm_term: input.utmTerm ?? null,
  });

  const magicLinkPayload = {
    email: normalizedEmail,
    callbackURL: "/resources/startup-directories",
    metadata: {
      intent: "directories-access",
      resource: "startup-directories",
    },
  } as Parameters<typeof authClient.signIn.magicLink>[0];

  const magicLinkResult = await authClient.signIn.magicLink(magicLinkPayload);

  if (magicLinkResult?.error) {
    throw new Error(
      magicLinkResult.error.message ??
        "Your email was saved, but we could not send the access link right now.",
    );
  }

  return normalizedEmail;
}
