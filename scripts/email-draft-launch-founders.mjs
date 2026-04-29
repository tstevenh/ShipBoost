import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const shouldSend = process.argv.includes("--send");
const expectedCount = 10;

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeAppUrl() {
  const configuredUrl = (
    process.env.DRAFT_LAUNCH_RESUME_APP_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    "https://shipboost.io"
  ).replace(/\/$/, "");

  if (shouldSend && /localhost|127\.0\.0\.1/.test(configuredUrl)) {
    return "https://shipboost.io";
  }

  return configuredUrl;
}

function buildResumeLink(toolId) {
  return `${normalizeAppUrl()}/dashboard/tools/${toolId}`;
}

function buildEmail({ founderName, toolName, resumeLink }) {
  const safeFounderName = founderName?.trim() || "there";
  const subject = "Your ShipBoost launch is almost ready";
  const preview = `Your ${toolName} launch draft is still saved on ShipBoost.`;
  const text = [
    `Hey ${safeFounderName},`,
    "",
    `Your ${toolName} launch draft is still saved on ShipBoost.`,
    "",
    "You’re one step away from joining the launch queue. Review your listing, choose your launch option, and schedule your launch here:",
    "",
    resumeLink,
    "",
    "Free launches can join the queue without extra setup. You can also add a ShipBoost badge if you want the extra trust signal before launch.",
    "",
    "See you on the launchpad,",
    "ShipBoost",
  ].join("\n");

  const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charSet="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;background-color:#0a0a0a;color:#fafafa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">
    <div style="display:none;overflow:hidden;max-height:0;">${escapeHtml(preview)}</div>
    <div style="padding:36px 16px 48px;">
      <div style="margin:0 auto;max-width:640px;overflow:hidden;border-radius:32px;border:1px solid rgba(250,250,250,0.08);background-color:#111111;box-shadow:0 24px 70px rgba(0,0,0,0.35);">
        <div style="padding:34px 30px 16px;text-align:left;">
          <p style="margin:0 0 4px;font-size:13px;font-weight:800;letter-spacing:-0.01em;color:#fafafa;">ShipBoost</p>
          <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(250,250,250,0.58);">Launch smarter. Get distributed.</p>
        </div>
        <div style="padding:12px 30px 28px;">
          <h1 style="margin:0 0 18px;font-size:36px;line-height:1.08;letter-spacing:-0.04em;color:#fafafa;font-weight:800;">Your ShipBoost launch is almost ready</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(250,250,250,0.78);">Hey ${escapeHtml(safeFounderName)},</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(250,250,250,0.78);">Your ${escapeHtml(toolName)} launch draft is still saved on ShipBoost.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(250,250,250,0.78);">You’re one step away from joining the launch queue. Review your listing, choose your launch option, and schedule your launch here:</p>
          <a href="${escapeHtml(resumeLink)}" style="display:inline-block;margin:10px 0 18px;border-radius:999px;background-color:#fafafa;color:#0a0a0a;font-size:15px;font-weight:800;line-height:1;padding:16px 24px;text-decoration:none;box-shadow:0 14px 28px rgba(0,0,0,0.22);">Continue your launch</a>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(250,250,250,0.78);">Free launches can join the queue without extra setup. You can also add a ShipBoost badge if you want the extra trust signal before launch.</p>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.75;color:rgba(250,250,250,0.78);">See you on the launchpad,<br />ShipBoost</p>
          <p style="margin:0 0 16px;font-size:13px;line-height:1.65;color:rgba(250,250,250,0.5);">If the button does not work, copy and paste this link into your browser:<br /><a href="${escapeHtml(resumeLink)}" style="color:#fafafa;font-weight:700;word-break:break-word;">${escapeHtml(resumeLink)}</a></p>
        </div>
      </div>
    </div>
  </body>
</html>`;

  return { subject, html, text };
}

async function main() {
  const submissions = await prisma.submission.findMany({
    where: {
      reviewStatus: "DRAFT",
      submissionType: "FREE_LAUNCH",
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
      tool: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
    },
  });

  const uniqueEmails = new Set(
    submissions.map((submission) => submission.user.email.toLowerCase()),
  );

  if (submissions.length !== expectedCount || uniqueEmails.size !== expectedCount) {
    throw new Error(
      `Refusing to send: expected ${expectedCount} draft free-launch submissions and ${expectedCount} unique founder emails, got ${submissions.length} submissions and ${uniqueEmails.size} unique emails.`,
    );
  }

  const targets = submissions.map((submission) => ({
    submissionId: submission.id,
    toolName: submission.tool.name,
    toolSlug: submission.tool.slug,
    to: submission.user.email,
    founderName: submission.user.name,
    resumeLink: buildResumeLink(submission.tool.id),
  }));

  console.log(
    JSON.stringify(
      {
        mode: shouldSend ? "send" : "dry-run",
        count: targets.length,
        targets,
      },
      null,
      2,
    ),
  );

  if (!shouldSend) {
    return;
  }

  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is required to send.");
  }

  const resend = new Resend(process.env.RESEND_API_KEY);
  const from =
    process.env.RESEND_FROM_TRANSACTIONAL || "ShipBoost <onboarding@resend.dev>";
  const replyTo = process.env.RESEND_REPLY_TO_TRANSACTIONAL || undefined;
  const results = [];

  for (const target of targets) {
    const email = buildEmail({
      founderName: target.founderName,
      toolName: target.toolName,
      resumeLink: target.resumeLink,
    });
    const response = await resend.emails.send({
      from,
      to: target.to,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo,
    });

    if (response.error) {
      throw new Error(
        `Resend failed for ${target.to}: ${response.error.message}`,
      );
    }

    results.push({
      to: target.to,
      toolName: target.toolName,
      emailId: response.data?.id ?? null,
    });
  }

  console.log(JSON.stringify({ sent: results.length, results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
