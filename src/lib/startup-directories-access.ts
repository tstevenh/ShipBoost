import { authClient } from "@/lib/auth-client";

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

  const magicLinkResult = await authClient.signIn.magicLink({
    email: normalizedEmail,
    callbackURL: "/resources/startup-directories",
    metadata: {
      intent: "directories-access",
      resource: "startup-directories",
    },
  } as any);

  if (magicLinkResult?.error) {
    throw new Error(
      magicLinkResult.error.message ??
        "Your email was saved, but we could not send the access link right now.",
    );
  }

  return normalizedEmail;
}
