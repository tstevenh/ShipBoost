import { Resend } from "resend";

import { getEnv } from "@/server/env";

type TransactionalEmailInput = {
  to: string | string[];
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
    from: env.RESEND_FROM_TRANSACTIONAL,
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
  const preview = "Confirm your email to activate your founder workspace.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Confirm your founder account"),
      paragraph(
        `${greeting}verify your email to activate your ShipBoost account and unlock your submission dashboard, listing management, and launch workflow.`,
      ),
      ctaButton(input.verificationUrl, "Verify email"),
      linkParagraph(input.verificationUrl),
      paragraph("If you did not create this account, you can ignore this email."),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      input.name ? `Hi ${input.name},` : "Hi,",
      "",
      "Verify your email to activate your ShipBoost account.",
      input.verificationUrl,
      "",
      "If you did not create this account, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetEmailMessage(input: {
  to: string;
  name?: string | null;
  resetUrl: string;
}) {
  const subject = "Reset your ShipBoost password";
  const preview = "Use this secure link to reset your password.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Reset your password"),
      paragraph(
        `${greeting}use the secure link below to choose a new password for your ShipBoost account.`,
      ),
      ctaButton(input.resetUrl, "Reset password"),
      linkParagraph(input.resetUrl),
      paragraph(
        "If you did not request this, you can ignore this email and your password will stay the same.",
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
      "Use this link to reset your ShipBoost password:",
      input.resetUrl,
      "",
      "If you did not request this, you can ignore this email.",
    ].join("\n"),
  });
}

export async function sendPasswordResetConfirmationEmail(input: {
  to: string;
  name?: string | null;
  signInUrl: string;
}) {
  const subject = "Your ShipBoost password was changed";
  const preview = "Your password was updated successfully.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Password updated"),
      paragraph(
        `${greeting}your ShipBoost password has been updated successfully.`,
      ),
      paragraph(
        "If you made this change, you can sign in again with your new password.",
      ),
      ctaButton(input.signInUrl, "Sign in"),
      paragraph(
        "If you did not make this change, reset your password again immediately and review your account access.",
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
      "Your ShipBoost password has been updated successfully.",
      `Sign in: ${input.signInUrl}`,
      "",
      "If you did not make this change, reset your password again immediately.",
    ].join("\n"),
  });
}

export async function sendWelcomeEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
}) {
  const subject = "Your ShipBoost founder workspace is ready";
  const preview = "Your account is verified and ready for submissions.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("You’re in"),
      paragraph(
        `${greeting}your email is verified and your ShipBoost founder workspace is ready.`,
      ),
      paragraph(
        "Next step: submit your SaaS, request a premium launch, or start with a clean affiliate-ready listing.",
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
      "Your email is verified and your ShipBoost founder workspace is ready.",
      `Open dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendMagicLinkSignInEmailMessage(input: {
  to: string;
  signInUrl: string;
}) {
  const subject = "Your ShipBoost sign-in link";
  const preview = "Use this secure link to open your ShipBoost account.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      eyebrow("Secure sign-in"),
      h1("Sign in securely"),
      paragraph(
        "Use the secure sign-in link below to open your ShipBoost account and get back to your founder workspace.",
      ),
      ctaButton(input.signInUrl, "Sign in to ShipBoost"),
      linkParagraph(input.signInUrl),
      paragraph("If you did not request this email, you can ignore it."),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      "Use this secure sign-in link to open your ShipBoost account:",
      input.signInUrl,
      "",
      "If you did not request this email, you can ignore it.",
    ].join("\n"),
  });
}

export async function sendDirectoriesAccessEmailMessage(input: {
  to: string;
  accessUrl: string;
}) {
  const subject = "Your startup directories access link";
  const preview = "Open the hosted startup directories resource inside ShipBoost.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      eyebrow("Directories access"),
      h1("Your directories list is ready"),
      paragraph(
        "Here is your access link to the hosted startup directories resource inside ShipBoost. Open it to browse the full list, search faster, and work through the sheet without leaving the app.",
      ),
      ctaButton(input.accessUrl, "Open the directories"),
      linkParagraph(input.accessUrl),
      paragraph(
        "If you did not request this email, you can ignore it. The preview page will still be there when you come back.",
      ),
    ].join(""),
  });

  await sendTransactionalEmail({
    to: input.to,
    subject,
    html,
    text: [
      "Your startup directories access link is ready:",
      input.accessUrl,
      "",
      "Open it to access the full hosted directories resource inside ShipBoost.",
      "",
      "If you did not request this email, you can ignore it.",
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
  const subject = `${input.toolName} was submitted to ShipBoost`;
  const preview = "Your submission is in and the review workflow has started.";
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
        )}</strong> is now in ShipBoost.`,
      ),
      paragraph(
        input.submissionType === "FEATURED_LAUNCH"
          ? `Next step: complete payment to reserve your premium launch${
              input.preferredLaunchDate
                ? ` for ${escapeHtml(input.preferredLaunchDate)}`
                : ""
            }.`
          : "We’ll review it and update you as soon as the next step is decided.",
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
      `${input.toolName} was submitted to ShipBoost.`,
      input.submissionType === "FEATURED_LAUNCH"
        ? `Complete payment to reserve your premium launch${
            input.preferredLaunchDate ? ` for ${input.preferredLaunchDate}` : ""
          }.`
        : "We’ll review it and update you as soon as the next step is decided.",
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
  const subject = `${input.toolName} was approved`;
  const preview = input.launchDate
    ? "Your launch is approved and scheduled."
    : "Your ShipBoost listing is approved.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Submission approved"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}your submission for <strong>${escapeHtml(
          input.toolName,
        )}</strong> has been approved.`,
      ),
      paragraph(
        input.launchDate
          ? `Your launch is scheduled for <strong>${escapeHtml(
              input.launchDate,
            )}</strong>.`
          : "Your listing is approved and available in your founder dashboard.",
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
      `Your submission for ${input.toolName} has been approved.`,
      input.launchDate ? `Launch date: ${input.launchDate}` : "Your listing is approved.",
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
  const subject = `${input.toolName} was not approved`;
  const preview = "Your ShipBoost submission needs changes before it can go live.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Submission needs changes"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}your submission for <strong>${escapeHtml(
          input.toolName,
        )}</strong> was not approved yet.`,
      ),
      input.founderVisibleNote
        ? paragraph(`Reviewer note: ${escapeHtml(input.founderVisibleNote)}`)
        : paragraph(
            "Check your dashboard for the latest status and update your submission if needed.",
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
      `Your submission for ${input.toolName} was not approved yet.`,
      input.founderVisibleNote ? `Reviewer note: ${input.founderVisibleNote}` : "",
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
  toolName: string;
  launchDate: string;
}) {
  const subject = `${input.toolName} premium launch is reserved`;
  const preview = "Payment received and your premium launch slot is confirmed.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Premium launch reserved"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}payment was received for <strong>${escapeHtml(
          input.toolName,
        )}</strong>.`,
      ),
      paragraph(
        `Your premium launch is scheduled for <strong>${escapeHtml(
          input.launchDate,
        )}</strong>.`,
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
      `Payment was received for ${input.toolName}.`,
      `Premium launch date: ${input.launchDate}`,
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendLaunchLiveEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  launchDate: string;
}) {
  const subject = `${input.toolName} is now live on ShipBoost`;
  const preview = "Your scheduled launch has gone live.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Launch is live"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}your scheduled launch for <strong>${escapeHtml(
          input.toolName,
        )}</strong> is now live on ShipBoost.`,
      ),
      paragraph(`Launch time: <strong>${escapeHtml(input.launchDate)}</strong>.`),
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
      `${input.toolName} is now live on ShipBoost.`,
      `Launch time: ${input.launchDate}`,
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}
