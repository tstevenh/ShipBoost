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
  return `<p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(16,16,16,0.76);">${content}</p>`;
}

function ctaButton(href: string, label: string) {
  return `<a href="${escapeHtml(
    href,
  )}" style="display:inline-block;margin:8px 0 18px;border-radius:18px;background-color:#143f35;color:#ffffff;font-size:15px;font-weight:700;line-height:1;padding:16px 22px;text-decoration:none;">${escapeHtml(
    label,
  )}</a>`;
}

function h1(title: string) {
  return `<h1 style="margin:0 0 18px;font-size:34px;line-height:1.15;letter-spacing:-0.03em;">${escapeHtml(
    title,
  )}</h1>`;
}

function renderEmailDocument(input: {
  title: string;
  preview: string;
  content: string;
}) {
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(input.title)}</title>
  </head>
  <body style="margin:0;background-color:#f3efe7;color:#101010;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">
    <div style="display:none;overflow:hidden;max-height:0;">${escapeHtml(
      input.preview,
    )}</div>
    <div style="padding:32px 16px;">
      <div style="margin:0 auto;max-width:640px;overflow:hidden;border-radius:28px;border:1px solid rgba(16,16,16,0.08);background-color:#fffdf7;box-shadow:0 24px 80px rgba(0,0,0,0.08);">
        <div style="padding:24px 28px;border-bottom:1px solid rgba(16,16,16,0.08);background-color:#143f35;color:#f8efe3;">
          <div style="display:inline-block;padding:10px 14px;border-radius:16px;background-color:#9f4f1d;font-size:13px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Shipboost</div>
          <p style="margin:16px 0 0;font-size:14px;line-height:1.6;color:rgba(248,239,227,0.78);">Distribution workflows for bootstrapped SaaS founders.</p>
        </div>
        <div style="padding:32px 28px;">${input.content}</div>
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
  const subject = "Verify your Shipboost account";
  const preview = "Confirm your email to activate your founder workspace.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Confirm your founder account"),
      paragraph(
        `${greeting}verify your email to activate your Shipboost account and unlock your submission dashboard, listing management, and launch workflow.`,
      ),
      ctaButton(input.verificationUrl, "Verify email"),
      paragraph(
        `If the button does not work, copy and paste this link into your browser:<br /><a href="${escapeHtml(
          input.verificationUrl,
        )}">${escapeHtml(input.verificationUrl)}</a>`,
      ),
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
      "Verify your email to activate your Shipboost account.",
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
  const subject = "Reset your Shipboost password";
  const preview = "Use this secure link to reset your password.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Reset your password"),
      paragraph(
        `${greeting}use the secure link below to choose a new password for your Shipboost account.`,
      ),
      ctaButton(input.resetUrl, "Reset password"),
      paragraph(
        `If the button does not work, copy and paste this link into your browser:<br /><a href="${escapeHtml(
          input.resetUrl,
        )}">${escapeHtml(input.resetUrl)}</a>`,
      ),
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
      "Use this link to reset your Shipboost password:",
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
  const subject = "Your Shipboost password was changed";
  const preview = "Your password was updated successfully.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Password updated"),
      paragraph(
        `${greeting}your Shipboost password has been updated successfully.`,
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
      "Your Shipboost password has been updated successfully.",
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
  const subject = "Your Shipboost founder workspace is ready";
  const preview = "Your account is verified and ready for submissions.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("You’re in"),
      paragraph(
        `${greeting}your email is verified and your Shipboost founder workspace is ready.`,
      ),
      paragraph(
        "Next step: submit your SaaS, request a featured launch, or start with a clean affiliate-ready listing.",
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
      "Your email is verified and your Shipboost founder workspace is ready.",
      `Open dashboard: ${input.dashboardUrl}`,
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
  const subject = `${input.toolName} was submitted to Shipboost`;
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
        )}</strong> is now in Shipboost.`,
      ),
      paragraph(
        input.submissionType === "FEATURED_LAUNCH"
          ? `Next step: complete payment to reserve your featured launch${
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
      `${input.toolName} was submitted to Shipboost.`,
      input.submissionType === "FEATURED_LAUNCH"
        ? `Complete payment to reserve your featured launch${
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
    : "Your Shipboost listing is approved.";
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
  const preview = "Your Shipboost submission needs changes before it can go live.";
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

export async function sendFeaturedLaunchPaidEmailMessage(input: {
  to: string;
  name?: string | null;
  dashboardUrl: string;
  toolName: string;
  launchDate: string;
}) {
  const subject = `${input.toolName} featured launch is reserved`;
  const preview = "Payment received and your featured launch slot is confirmed.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Featured launch reserved"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}payment was received for <strong>${escapeHtml(
          input.toolName,
        )}</strong>.`,
      ),
      paragraph(
        `Your featured launch is scheduled for <strong>${escapeHtml(
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
      `Featured launch date: ${input.launchDate}`,
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
  const subject = `${input.toolName} is now live on Shipboost`;
  const preview = "Your scheduled launch has gone live.";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Launch is live"),
      paragraph(
        `${input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, "}your scheduled launch for <strong>${escapeHtml(
          input.toolName,
        )}</strong> is now live on Shipboost.`,
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
      `${input.toolName} is now live on Shipboost.`,
      `Launch time: ${input.launchDate}`,
      `Dashboard: ${input.dashboardUrl}`,
    ].join("\n"),
  });
}

export async function sendStartupDirectoriesLeadMagnetEmail(input: {
  to: string;
  name?: string | null;
  directoriesUrl: string;
}) {
  const subject = "Your 800+ startup directories list is ready";
  const preview = "Use this list to find more places to submit your startup.";
  const greeting = input.name ? `Hi ${escapeHtml(input.name)}, ` : "Hi, ";
  const html = renderEmailDocument({
    title: subject,
    preview,
    content: [
      h1("Here’s your startup directories list"),
      paragraph(
        `${greeting}here is the 800+ startup directories list you requested from Shipboost.`,
      ),
      paragraph(
        "Use it to find relevant places to submit your startup and build compounding distribution over time.",
      ),
      ctaButton(input.directoriesUrl, "Open the directories list"),
      paragraph(
        "You’ll also get occasional startup growth and distribution emails from Shipboost. You can unsubscribe any time.",
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
      "Here is your 800+ startup directories list:",
      input.directoriesUrl,
      "",
      "You’ll also get occasional startup growth and distribution emails from Shipboost. You can unsubscribe any time.",
    ].join("\n"),
  });
}
