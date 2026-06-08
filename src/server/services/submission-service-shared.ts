import { getEnv } from "@/server/env";

export type AuthenticatedFounder = {
  id: string;
};

export type DraftSaveResult = {
  submissionId: string;
  replacedLogoPublicId: string | null;
  replacedScreenshotPublicIds: string[];
};

export type SavedSubmissionDraft = {
  id: string;
  toolId: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
};

export type DeferredEmailTask = () => Promise<void>;

// The ShipBoost badge carries an explicit marker. Verification requires THIS
// marker — not merely any link to shipboost.io (which would let any site pass,
// and would fail legit badges whose href points at a non-prod host like
// localhost). Matches both the HTML form (data-shipboost-badge="free-launch")
// and the JSX-compiled form ("data-shipboost-badge":"free-launch").
export const shipBoostBadgeMarkerPattern =
  /\\?["']?data-shipboost-badge\\?["']?\s*[:=]\s*\\?["']free-launch\\?["']/i;

const scriptSrcPattern =
  /<script\b[^>]*\bsrc\s*=\s*["']([^"']+)["'][^>]*>/gi;
const anchorTagPattern = /<a\b[^>]*\bhref\s*=\s*["']([^"']+)["'][^>]*>[\s\S]*?<\/a>/gi;
const imageTagPattern = /<img\b[^>]*>/gi;

function normalizeUrlForComparison(value: string) {
  const url = new URL(value);
  url.hash = "";
  url.search = "";

  if (url.pathname !== "/") {
    url.pathname = url.pathname.replace(/\/+$/, "");
  }

  return url.toString();
}

function getAttributeValue(tag: string, attribute: string) {
  const pattern = new RegExp(
    String.raw`\b${attribute}\s*=\s*["']([^"']+)["']`,
    "i",
  );
  return pattern.exec(tag)?.[1] ?? null;
}

function stripHtmlTags(value: string) {
  return value.replace(/<[^>]+>/g, " ");
}

function hasBadgeContext(anchorHtml: string, nearbyHtml: string) {
  const anchorText = stripHtmlTags(anchorHtml);

  if (/shipboost/i.test(anchorText)) {
    return true;
  }

  if (/featured\s+on\s+shipboost/i.test(nearbyHtml)) {
    return true;
  }

  for (const match of anchorHtml.matchAll(imageTagPattern)) {
    const imageTag = match[0];
    const alt = getAttributeValue(imageTag, "alt") ?? "";
    const src = getAttributeValue(imageTag, "src") ?? "";

    if (/shipboost/i.test(alt)) {
      return true;
    }

    if (/\/badge\//i.test(src) || /shipboost-badge/i.test(src)) {
      return true;
    }
  }

  return false;
}

function hasRecognizedFreeLaunchBadge(value: string) {
  return shipBoostBadgeMarkerPattern.test(value);
}

export function hasExpectedShipBoostBadgeLink(
  html: string,
  pageUrl: string,
  expectedListingUrl: string,
) {
  let expected: string;

  try {
    expected = normalizeUrlForComparison(expectedListingUrl);
  } catch {
    return false;
  }

  for (const match of html.matchAll(anchorTagPattern)) {
    const href = match[1];
    const anchorHtml = match[0];

    if (!href || match.index === undefined) {
      continue;
    }

    let resolvedHref: string;

    try {
      resolvedHref = normalizeUrlForComparison(new URL(href, pageUrl).toString());
    } catch {
      continue;
    }

    if (resolvedHref !== expected) {
      continue;
    }

    const contextStart = Math.max(0, match.index - 250);
    const contextEnd = Math.min(html.length, match.index + anchorHtml.length + 250);
    const nearbyHtml = html.slice(contextStart, contextEnd);

    if (hasBadgeContext(anchorHtml, nearbyHtml)) {
      return true;
    }
  }

  return false;
}

export function getSameOriginScriptUrls(html: string, pageUrl: string) {
  const baseUrl = new URL(pageUrl);
  const urls: string[] = [];

  for (const match of html.matchAll(scriptSrcPattern)) {
    const src = match[1];

    if (!src) {
      continue;
    }

    const scriptUrl = new URL(src, baseUrl);

    if (
      scriptUrl.origin === baseUrl.origin &&
      scriptUrl.pathname.endsWith(".js")
    ) {
      urls.push(scriptUrl.toString());
    }
  }

  return Array.from(new Set(urls));
}

export async function hasFreeLaunchBadgeInHtmlOrScripts(
  html: string,
  pageUrl: string,
  fetchScriptText: (url: string) => Promise<string>,
  expectedListingUrl?: string,
) {
  if (hasRecognizedFreeLaunchBadge(html)) {
    return true;
  }

  if (
    expectedListingUrl &&
    hasExpectedShipBoostBadgeLink(html, pageUrl, expectedListingUrl)
  ) {
    return true;
  }

  const scriptUrls = getSameOriginScriptUrls(html, pageUrl).slice(0, 8);

  for (const scriptUrl of scriptUrls) {
    const scriptText = await fetchScriptText(scriptUrl);

    if (hasRecognizedFreeLaunchBadge(scriptText)) {
      return true;
    }

    if (
      expectedListingUrl &&
      hasExpectedShipBoostBadgeLink(scriptText, scriptUrl, expectedListingUrl)
    ) {
      return true;
    }
  }

  return false;
}

export function formatLaunchDateForEmail(value: Date) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export function getDashboardUrl() {
  const env = getEnv();
  return `${env.NEXT_PUBLIC_APP_URL}/dashboard`;
}

export async function sendProductEmailSafely(
  task: Promise<void> | DeferredEmailTask,
) {
  try {
    await (typeof task === "function" ? task() : task);
  } catch (error) {
    console.error("[shipboost email:error]", error);
  }
}

export function resolveLaunchType(
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH",
) {
  if (submissionType === "RELAUNCH") {
    return "RELAUNCH" as const;
  }

  if (submissionType === "FEATURED_LAUNCH") {
    return "FEATURED" as const;
  }

  return "FREE" as const;
}
