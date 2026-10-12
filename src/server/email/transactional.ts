import { Resend } from "resend";

import { getEnv } from "@/server/env";

type TransactionalEmailInput = {
  to: string | string[];
  from?: string;
  subject: string;
  html: string;
  text: string;
};

let resendClient: Resend | null = null;

function getResendClient() {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    return null;
  }

  if (!resendClient) {
    resendClient = new Resend(env.RESEND_API_KEY);
  }

  return resendClient;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function paragraph(content: string) {
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(250,250,250,0.78);">${content}</p>`;
}

function ctaButton(href: string, label: string) {
  return `<a href="${escapeHtml(
    href,
  )}" style="display:inline-block;margin:10px 0 18px;border-radius:999px;background-color:#fafafa;color:#0a0a0a;font-size:15px;font-weight:800;line-height:1;padding:16px 24px;text-decoration:none;box-shadow:0 14px 28px rgba(0,0,0,0.22);">${escapeHtml(
    label,
  )}</a>`;
}

function h1(title: string) {
  return `<h1 style="margin:0 0 18px;font-size:36px;line-height:1.08;letter-spacing:-0.04em;color:#fafafa;font-weight:800;">${escapeHtml(
    title,
  )}</h1>`;
}

function eyebrow(label: string) {
  return `<div style="display:inline-block;margin:0 0 20px;padding:8px 12px;border-radius:999px;background-color:rgba(250,250,250,0.06);color:rgba(250,250,250,0.9);font-size:11px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;border:1px solid rgba(250,250,250,0.12);">${escapeHtml(
    label,
  )}</div>`;
}

function linkParagraph(href: string) {
  return paragraph(
    `If the button does not work, copy and paste this link into your browser:<br /><a href="${escapeHtml(
      href,
    )}" style="color:#fafafa;font-weight:700;word-break:break-word;">${escapeHtml(
      href,
    )}</a>`,
  );
}

export type LaunchKitEmailLinks = {
  listingUrl: string;
  twitterShareUrl: string;
  linkedinShareUrl: string;
  launchKitUrl: string;
};

function launchKitSectionHtml(kit: LaunchKitEmailLinks) {
  return [
    paragraph(
      `<strong>Rally your audience.</strong> One tap to share your launch:<br />` +
        `<a href="${escapeHtml(
          kit.twitterShareUrl,
        )}" style="color:#fafafa;font-weight:800;text-decoration:underline;">Share on X</a>` +
        ` &nbsp;·&nbsp; ` +
        `<a href="${escapeHtml(
          kit.linkedinShareUrl,
        )}" style="color:#fafafa;font-weight:800;text-decoration:underline;">Share on LinkedIn</a>`,
    ),
    paragraph(
      `Your listing: <a href="${escapeHtml(
        kit.listingUrl,
      )}" style="color:#fafafa;font-weight:700;word-break:break-word;">${escapeHtml(
        kit.listingUrl,
      )}</a>`,
    ),
    ctaButton(kit.launchKitUrl, "Open your launch kit"),
  ].join("");
}

function launchKitSectionText(kit: LaunchKitEmailLinks) {
  return [
    "Rally your audience — share your launch:",
    `Share on X: ${kit.twitterShareUrl}`,
    `Share on LinkedIn: ${kit.linkedinShareUrl}`,
    `Your listing: ${kit.listingUrl}`,
    `Your launch kit (badge + posts): ${kit.launchKitUrl}`,
  ].join("\n");
}

function getEmailAddress(value: string) {
  const angleAddress = value.match(/<([^>]+)>/);

  if (angleAddress?.[1]) {
    return angleAddress[1].trim();
  }

  return value.trim();
}

function getTimFromShipBoostAddress() {
  return `Tim from ShipBoost <${getEmailAddress(getEnv().RESEND_FROM_TRANSACTIONAL)}>`;
}

function getEmailLogoUrl() {
  const env = getEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");

  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    return "https://shipboost.io/logos/logo-white.png";
  }

  return `${appUrl}/logos/logo-white.png`;
}

function renderEmailDocument(input: {
  title: string;
  preview: string;
  content: string;
}) {
  const logoUrl = getEmailLogoUrl();

  return `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;background-color:#0a0a0a;color:#fafafa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">
    <div style="display:none;overflow:hidden;max-height:0;">${escapeHtml(
      input.preview,
    )}</div>
    <div style="padding:36px 16px 48px;">
      <div style="margin:0 auto 22px;max-width:640px;text-align:center;">
        <img src="${escapeHtml(
          logoUrl,
        )}" alt="ShipBoost" width="72" height="72" style="display:block;margin:0 auto;max-width:72px;height:auto;" />
      </div>
      <div style="margin:0 auto;max-width:640px;overflow:hidden;border-radius:32px;border:1px solid rgba(250,250,250,0.08);background-color:#111111;box-shadow:0 24px 70px rgba(0,0,0,0.35);">
        <div style="padding:34px 30px 16px;text-align:left;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:800;letter-spacing:-0.01em;color:#fafafa;">ShipBoost</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(250,250,250,0.58);">Launch smarter. Get distributed.</p>
        </div>
        <div style="padding:12px 30px 28px;">${input.content}</div>
        <div style="padding:0 30px 30px;">
          <div style="border-top:1px solid rgba(250,250,250,0.08);padding-top:18px;font-size:12px;line-height:1.7;color:rgba(250,250,250,0.48);">
            ShipBoost helps founders launch smarter, get discovered faster, and keep distribution organized in one place.
          </div>
        </div>
      </div>
    </div>
  </body>
</html>`;
}

async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const env = getEnv();
  const resend = getResendClient();

  if (!resend) {
    console.info("[shipboost email:skipped]", {
      subject: input.subject,
      to: input.to,
      text: input.text,
    });
    return;
  }

  const response = await resend.emails.send({
    from: input.from ?? env.RESEND_FROM_TRANSACTIONAL,
    to: input.to,
    subject: input.subject,
    html: input.html,
    text: input.text,
    replyTo: env.RESEND_REPLY_TO_TRANSACTIONAL || undefined,
  });

  if (response.error) {
    throw new Error(response.error.message);
  }
}

export async function sendVerificationEmailMessage(input: {
  to: string;
  name?: string | null;
  verificationUrl: string;
}) {
  const subject = "Verify your ShipBoost account";
  const preview = "One click confirms your email and opens your dashboard.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Verify your email"),
      paragraph(
        `${greeting}click the button below to verify your email. Then you can submit your product, manage your listing, and schedule your launch.`,
      ),
      ctaButton(input.verificationUrl, "Verify email"),
      linkParagraph(input.verificationUrl),
      paragraph("Didn't create this account? Ignore this email."),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      "Click the link below to verify your email and open your ShipBoost dashboard.",
      input.verificationUrl,
      "",
      "Didn't create this account? Ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmailMessage(input: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const subject = "Reset your ShipBoost password";
  const preview = "Set a new password with the link below.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Reset your password"),
      paragraph(
        `${greeting}use the link below to set a new password. It expires after one use.`,
      ),
      ctaButton(input.resetUrl, "Reset password"),
      linkParagraph(input.resetUrl),
      paragraph(
        "Didn't request this? Ignore this email — your password stays the same.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      "Use this link to set a new ShipBoost password. It expires after one use.",
      input.resetUrl,
      "",
      "Didn't request this? Ignore this email — your password stays the same.",
    ].join("\n"),
  });
}

export async function sendPasswordResetConfirmationEmail(input: {
  to: string;
  name?: string | null;
  signInUrl: string;
}) {
  const subject = "Your ShipBoost password was changed";
  const preview = "Your password was just changed.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Password updated"),
      paragraph(
        `${greeting}your ShipBoost password was just changed. Sign in with the new password.`,
      ),
      ctaButton(input.signInUrl, "Sign in"),
      paragraph(
        "Didn't make this change? Reset your password again immediately and review who has access to your account.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      "Your ShipBoost password was just changed. Sign in with the new password.",
      `Sign in: ${input.signInUrl}`,
      "",
      "Didn't make this change? Reset your password again immediately and review who has access to your account.",
    ].join("\n"),
  });
}

export async function sendWelcomeEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
}) {
  const subject = "Your ShipBoost account is verified";
  const preview = "Submit your product when you're ready.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Verified"),
      paragraph(
        `${greeting}your email is verified. Your dashboard is ready.`,
      ),
      paragraph(
        "Three ways to start: submit a free launch, reserve a premium launch slot, or list your product without launching yet. All three live in the dashboard.",
      ),
      ctaButton(input.dashboardUrl, "Open dashboard"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      "Your email is verified. Your ShipBoost dashboard is ready.",
      "Three ways to start: submit a free launch, reserve a premium launch slot, or list your product without launching yet.",
      `Open dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendMagicLinkSignInEmailMessage(input: {
  to: string;
  signInUrl: string;
}) {
  const subject = "Your ShipBoost sign-in link";
  const preview = "One-click access to your dashboard.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Sign in"),
      paragraph(
        "Click the button below to sign in to ShipBoost. The link expires after one use.",
      ),
      ctaButton(input.signInUrl, "Sign in to ShipBoost"),
      linkParagraph(input.signInUrl),
      paragraph("Didn't request this? Ignore it."),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      "Click the link below to sign in to ShipBoost. The link expires after one use.",
      input.signInUrl,
      "",
      "Didn't request this? Ignore it.",
    ].join("\n"),
  });
}

export async function sendDirectoriesAccessEmailMessage(input: {
  to: string;
  accessUrl: string;
}) {
  const subject = "Your startup directories list is ready";
  const preview = "Open the full directories list inside ShipBoost.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Your directories list"),
      paragraph(
        "Here's your access link. Browse the full directory, search it, and filter by category without leaving the app.",
      ),
      ctaButton(input.accessUrl, "Open the directories"),
      linkParagraph(input.accessUrl),
      paragraph(
        "Didn't request this? Ignore it. The link still works when you come back.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      "Your ShipBoost startup directories list is ready. Browse, search, and filter the full directory inside ShipBoost.",
      input.accessUrl,
      "",
      "Didn't request this? Ignore it. The link still works when you come back.",
    ].join("\n"),
  });
}

export async function sendSubmissionReceivedEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  preferredLaunchDate?: string | null;
}) {
  const subject = `${input.toolName} is in — review starts now`;
  const preview = "Your submission landed. We'll be in touch with the next step.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Submission received"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}your ${escapeHtml(
          input.submissionType.replaceAll("_", " ").toLowerCase(),
        )} submission for <strong>${escapeHtml(
          input.toolName,
        )}</strong> is in.`,
      ),
      paragraph(
        input.submissionType === "FEATURED_LAUNCH"
          ? `Next: complete payment to lock in your premium launch${
              input.preferredLaunchDate
                ? ` for ${escapeHtml(input.preferredLaunchDate)}`
                : ""
            }.`
          : "We'll review it and email you when there's a decision.",
      ),
      ctaButton(input.dashboardUrl, "Open dashboard"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `${input.toolName} is in — review starts now.`,
      input.submissionType === "FEATURED_LAUNCH"
        ? `Next: complete payment to lock in your premium launch${
            input.preferredLaunchDate ? ` for ${input.preferredLaunchDate}` : ""
          }.`
        : "We'll review it and email you when there's a decision.",
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendSubmissionApprovedEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  launchDate?: string | null;
}) {
  const subject = `${input.toolName} is approved`;
  const preview = input.launchDate
    ? "Your launch is scheduled."
    : "Your listing is live in the dashboard.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Approved"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}<strong>${escapeHtml(
          input.toolName,
        )}</strong> is approved.`,
      ),
      paragraph(
        input.launchDate
          ? `Launch scheduled for <strong>${escapeHtml(
              input.launchDate,
            )}</strong>. We'll send a prep email 24 hours before it goes live.`
          : "Your listing is live in the dashboard.",
      ),
      ctaButton(input.dashboardUrl, "Open dashboard"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `${input.toolName} is approved.`,
      input.launchDate
        ? `Launch scheduled for ${input.launchDate}. We'll send a prep email 24 hours before it goes live.`
        : "Your listing is live in the dashboard.",
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendSubmissionRejectedEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  founderVisibleNote?: string | null;
}) {
  const subject = `${input.toolName} needs changes before it can go live`;
  const preview = "A few things need updating before we can approve it.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Needs changes"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}<strong>${escapeHtml(
          input.toolName,
        )}</strong> isn't ready to go live yet. A few things need updating before we can approve it.`,
      ),
      input.founderVisibleNote
        ? paragraph(`Reviewer note: ${escapeHtml(input.founderVisibleNote)}`)
        : paragraph(
            "Open the dashboard to see what to fix.",
          ),
      ctaButton(input.dashboardUrl, "Open dashboard"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `${input.toolName} isn't ready to go live yet. A few things need updating before we can approve it.`,
      input.founderVisibleNote ? `Reviewer note: ${input.founderVisibleNote}` : "Open the dashboard to see what to fix.",
      `Dashboard: ${input.dashboardUrl}`,
    ]
      .filter(Boolean)
      .join("\n"),
  });
}

export async function sendPremiumLaunchPaidEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  spotlightBriefUrl: string;
  toolName: string;
  launchDate: string;
}) {
  const subject = `${input.toolName} premium launch is reserved for ${input.launchDate}`;
  const preview = "Slot confirmed. Your spotlight brief is the next step.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Premium launch reserved"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}payment is in. <strong>${escapeHtml(
          input.toolName,
        )}</strong> is reserved for premium launch on <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`,
      ),
      paragraph(
        "Your premium launch includes a written editorial spotlight from our editor — included with the founding pricing. Fill in the brief so we have the angle, audience, and CTA before launch week.",
      ),
      ctaButton(input.spotlightBriefUrl, "Complete spotlight brief"),
      paragraph(
        "Skip the brief and we'll write the spotlight from your existing listing details. Either way, your spotlight runs during launch week.",
      ),
      ctaButton(input.dashboardUrl, "Open dashboard"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `Payment is in. ${input.toolName} is reserved for premium launch on ${input.launchDate}.`,
      "Your premium launch includes a written editorial spotlight from our editor — included with the founding pricing. Fill in the brief so we have the angle, audience, and CTA before launch week.",
      `Spotlight brief: ${input.spotlightBriefUrl}`,
      "Skip the brief and we'll write the spotlight from your existing listing details. Either way, your spotlight runs during launch week.",
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export type LaunchVideoDeliveryEmailInfo =
  | { kind: "premium"; launchWeek: string }
  | { kind: "standalone"; deliverBy: string };

function describeLaunchVideoDelivery(delivery: LaunchVideoDeliveryEmailInfo) {
  return delivery.kind === "premium"
    ? `during your launch week of ${delivery.launchWeek}`
    : `by ${delivery.deliverBy}`;
}

const LAUNCH_VIDEO_BRIEF_ASK =
  "Two minutes in the brief makes the video sharper: the one action people should see, a screenshot before and after it, and one true number. Every field is optional. Skip it and we build the video from your site and listing.";

export async function sendLaunchVideoBookedEmailMessage(input: {
  to: string;
  name?: string | null;
  briefUrl: string;
  toolName: string;
  delivery: LaunchVideoDeliveryEmailInfo;
}) {
  const subject = `Launch video booked for ${input.toolName}`;
  const deliveryText = describeLaunchVideoDelivery(input.delivery);
  const preview = `Delivered ${deliveryText}. The brief takes two minutes.`;
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Launch video booked"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}payment is in. We'll deliver a 20-second launch video of <strong>${escapeHtml(
          input.toolName,
        )}</strong>, in 16:9 and 9:16, <strong>${escapeHtml(deliveryText)}</strong>.`,
      ),
      paragraph(escapeHtml(LAUNCH_VIDEO_BRIEF_ASK)),
      ctaButton(input.briefUrl, "Open video brief"),
      paragraph(
        "Every video uses one fixed format, so there are no revision rounds. If we get a fact about your product wrong, we fix it.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    from: getTimFromShipBoostAddress(),
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `Payment is in. We'll deliver a 20-second launch video of ${input.toolName}, in 16:9 and 9:16, ${deliveryText}.`,
      LAUNCH_VIDEO_BRIEF_ASK,
      `Video brief: ${input.briefUrl}`,
      "Every video uses one fixed format, so there are no revision rounds. If we get a fact about your product wrong, we fix it.",
    ].join("\n"),
  });
}

export async function sendLaunchVideoBriefReminderEmailMessage(input: {
  to: string;
  name?: string | null;
  briefUrl: string;
  toolName: string;
  delivery: LaunchVideoDeliveryEmailInfo;
}) {
  const subject = `Your ${input.toolName} launch video brief is still empty`;
  const deliveryText = describeLaunchVideoDelivery(input.delivery);
  const html = renderEmailDocument({
    title: subject,
    preview: "Two minutes now, a sharper video later.",
    content: [
      h1("Launch video brief"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}we start on the <strong>${escapeHtml(
          input.toolName,
        )}</strong> video soon. It is due <strong>${escapeHtml(deliveryText)}</strong>.`,
      ),
      paragraph(escapeHtml(LAUNCH_VIDEO_BRIEF_ASK)),
      ctaButton(input.briefUrl, "Open video brief"),
    ].join(""),
  });

  await sendTransactionalEmail({
    from: getTimFromShipBoostAddress(),
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `We start on the ${input.toolName} video soon. It is due ${deliveryText}.`,
      LAUNCH_VIDEO_BRIEF_ASK,
      `Video brief: ${input.briefUrl}`,
    ].join("\n"),
  });
}

export async function sendLaunchVideoOrderAdminEmailMessage(input: {
  to: string;
  toolName: string;
  toolUrl: string;
  listingUrl: string;
  founderEmail: string;
  orderType: string;
  deliverBy: string;
  focusNote?: string | null;
  amountPaid: string;
  launchPriceSpotsLeft: number;
  laterPrices: string;
}) {
  const subject = `Launch video order: ${input.toolName} (deliver by ${input.deliverBy})`;
  const lines = [
    `Product: ${input.toolName}`,
    `Site: ${input.toolUrl}`,
    `Listing: ${input.listingUrl}`,
    `Founder: ${input.founderEmail}`,
    `Type: ${input.orderType}`,
    `Deliver by: ${input.deliverBy}`,
    `Focus: ${input.focusNote || "(none given)"}`,
    `Paid: ${input.amountPaid}`,
    input.launchPriceSpotsLeft > 0
      ? `Launch-price videos left: ${input.launchPriceSpotsLeft}`
      : `That was the last launch-price video. Raise both Dodo launch video products to ${input.laterPrices}.`,
  ];
  const html = renderEmailDocument({
    title: subject,
    preview: `${input.toolName}, deliver by ${input.deliverBy}`,
    content: [
      eyebrow("New order"),
      h1("Launch video order"),
      ...lines.map((line) => paragraph(escapeHtml(line))),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: lines.join("\n"),
  });
}

export type SpotlightReminderStage = "THREE_DAYS_BEFORE" | "LAUNCH_WEEK_START";

export async function sendPremiumLaunchSpotlightReminderEmailMessage(input: {
  to: string;
  name?: string | null;
  toolName: string;
  launchDate: string;
  dashboardUrl: string;
  stage: SpotlightReminderStage;
}) {
  const subject =
    input.stage === "THREE_DAYS_BEFORE"
      ? `${input.toolName} spotlight brief is due in 3 days`
      : `${input.toolName} launch week is live — spotlight brief still open`;
  const preview =
    input.stage === "THREE_DAYS_BEFORE"
      ? "Launch week starts soon. We need your spotlight brief."
      : "Last chance to shape the spotlight angle.";
  const heading =
    input.stage === "THREE_DAYS_BEFORE"
      ? "Spotlight brief is due"
      : "Last chance to shape the spotlight";
  const intro =
    input.stage === "THREE_DAYS_BEFORE"
      ? `<strong>${escapeHtml(
          input.toolName,
        )}</strong> launches in 3 days on <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`
      : `<strong>${escapeHtml(
          input.toolName,
        )}</strong> launch week started on <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`;
  const reminder =
    input.stage === "THREE_DAYS_BEFORE"
      ? "Fill in the spotlight brief now so our editor has your angle, audience, and CTA before launch week. Skip it and we'll write the spotlight from your existing listing details."
      : "Your spotlight brief is still open. Fill it in if you want to shape the angle. Skip it and we'll publish from your existing listing details — either way, the spotlight runs this week.";

  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1(heading),
      paragraph(`${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}${intro}`),
      paragraph(reminder),
      ctaButton(input.dashboardUrl, "Open spotlight brief"),
      paragraph(
        "Standardized format — our editor follows a consistent house style, not a custom commissioned piece.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      input.stage === "THREE_DAYS_BEFORE"
        ? `${input.toolName} launches in 3 days on ${input.launchDate}.`
        : `${input.toolName} launch week started on ${input.launchDate}.`,
      reminder,
      `Spotlight brief: ${input.dashboardUrl}`,
      "",
      "Standardized format — our editor follows a consistent house style, not a custom commissioned piece.",
    ].join("\n"),
  });
}

export async function sendLaunchLiveEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  launchDate: string;
  launchKit?: LaunchKitEmailLinks;
}) {
  const subject = `${input.toolName} is live on ShipBoost`;
  const preview = "Your launch is on the weekly board. The next 7 days decide your position.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Launch is live"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}<strong>${escapeHtml(
          input.toolName,
        )}</strong> is live on ShipBoost as of <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`,
      ),
      paragraph(
        "The next 7 days decide your weekly board position. Bring your supporters, share your listing link, and watch the board.",
      ),
      paragraph(
        "The #1 product of the week wins the homepage featured spot for the following week.",
      ),
      input.launchKit ? launchKitSectionHtml(input.launchKit) : "",
      ctaButton(input.dashboardUrl, "Open the launch board"),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `${input.toolName} is live on ShipBoost as of ${input.launchDate}.`,
      "The next 7 days decide your weekly board position. Bring your supporters, share your listing link, and watch the board.",
      "The #1 product of the week wins the homepage featured spot for the following week.",
      ...(input.launchKit ? ["", launchKitSectionText(input.launchKit)] : []),
      `Launch board: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendLaunchPrepEmailMessage(input: {
  to: string;
  name?: string | null;
  launchBoardUrl: string;
  toolName: string;
  launchDate: string;
  launchKit?: LaunchKitEmailLinks;
}) {
  const subject = `${input.toolName} launches on ShipBoost in 24 hours`;
  const preview = "Launch is tomorrow. Today is the prep window.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      eyebrow("Launch in 24 hours"),
      h1("Get your audience ready"),
      paragraph(
        `${greeting}<strong>${escapeHtml(
          input.toolName,
        )}</strong> launches on ShipBoost tomorrow — <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`,
      ),
      paragraph(
        "Use today to get ready: schedule your posts, line up your founder communities, prep your newsletter, and make sure the people who already follow your work know when to support the launch.",
      ),
      paragraph(
        "Why it matters: the #1 product of the week wins the homepage featured spot for the following week — a $59 visibility slot. More upvotes means more board position, more clicks, more launch-week signal.",
      ),
      paragraph(
        "Bring your supporters. Compete for the top spot.",
      ),
      input.launchKit ? launchKitSectionHtml(input.launchKit) : "",
      ctaButton(input.launchBoardUrl, "Open the weekly board"),
      linkParagraph(input.launchBoardUrl),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    from: getTimFromShipBoostAddress(),
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      `${input.toolName} launches on ShipBoost tomorrow — ${input.launchDate}. Today is the prep window.`,
      "Use today to get ready: schedule your posts, line up your founder communities, prep your newsletter, and make sure the people who already follow your work know when to support the launch.",
      "Why it matters: the #1 product of the week wins the homepage featured spot for the following week — a $59 visibility slot. More upvotes means more board position, more clicks, more launch-week signal.",
      "Bring your supporters. Compete for the top spot.",
      ...(input.launchKit ? ["", launchKitSectionText(input.launchKit)] : []),
      `Weekly board: ${input.launchBoardUrl}`,
      "",
      "Tim from ShipBoost",
    ].join("\n"),
  });
}

export async function sendSponsorPlacementRenewalReminderEmailMessage(input: {
  to: string;
  toolName: string;
  endsAt: string;
  advertiseUrl: string;
}) {
  const subject = `${input.toolName} sponsor placement ends ${input.endsAt}`;
  const preview = `Renew before ${input.endsAt} to keep the sidebar spot.`;
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      eyebrow("Sponsor placement"),
      h1(`Sponsor placement ends ${input.endsAt}`),
      paragraph(
        `<strong>${escapeHtml(
          input.toolName,
        )}</strong> is sponsored on ShipBoost until <strong>${escapeHtml(
          input.endsAt,
        )}</strong>.`,
      ),
      paragraph(
        "Renew for another 30 days to keep the sidebar spot. One-time placement, no auto-renewal.",
      ),
      ctaButton(input.advertiseUrl, "Renew placement"),
      linkParagraph(input.advertiseUrl),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      `${input.toolName} is sponsored on ShipBoost until ${input.endsAt}.`,
      "Renew for another 30 days to keep the sidebar spot. One-time placement, no auto-renewal.",
      `Renew: ${input.advertiseUrl}`,
    ].join("\n"),
  });
}
