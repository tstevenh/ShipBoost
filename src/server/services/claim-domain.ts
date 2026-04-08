import { AppError } from "@/server/http/app-error";

function normalizeHost(value: string) {
  return value.trim().toLowerCase().replace(/^www\./, "");
}

function parseHost(value: string) {
  try {
    return normalizeHost(new URL(value).hostname);
  } catch {
    throw new AppError(400, "Listing website URL must be a valid public URL.");
  }
}

export function getWebsiteDomain(websiteUrl: string) {
  return parseHost(websiteUrl);
}

export function getEmailDomain(email: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const atIndex = normalizedEmail.lastIndexOf("@");

  if (atIndex <= 0 || atIndex === normalizedEmail.length - 1) {
    throw new AppError(400, "A valid company email is required to claim a listing.");
  }

  return normalizeHost(normalizedEmail.slice(atIndex + 1));
}

export function domainsMatchForClaim(email: string, websiteUrl: string) {
  const emailDomain = getEmailDomain(email);
  const websiteDomain = getWebsiteDomain(websiteUrl);

  return (
    emailDomain === websiteDomain ||
    emailDomain.endsWith(`.${websiteDomain}`) ||
    websiteDomain.endsWith(`.${emailDomain}`)
  );
}
