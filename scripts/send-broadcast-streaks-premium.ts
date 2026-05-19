import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const prisma = new PrismaClient();
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

// RESEND_FROM_TRANSACTIONAL is already in "Name <email@domain>" or plain email format.
// Use it as-is. Fall back to a sensible default.
const FROM =
  process.env.RESEND_FROM_TRANSACTIONAL ??
  "Tim from ShipBoost <tim@shipboost.io>";

const LOGO_URL = (() => {
  const appUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://shipboost.io").replace(/\/$/, "");
  if (appUrl.includes("localhost") || appUrl.includes("127.0.0.1")) {
    return "https://shipboost.io/logos/logo-white.png";
  }
  return `${appUrl}/logos/logo-white.png`;
})();

const SUBJECT = "25 days = 25% off Premium Launch";
const PREVIEW = "New streak system + concrete Premium Launch value.";

function getFirstName(name: string | null): string {
  if (!name) return "there";
  const first = name.trim().split(/\s+/)[0];
  return first || "there";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderBody(): string {
  const text78 = "color:rgba(250,250,250,0.78)";
  const text58 = "color:rgba(250,250,250,0.58)";
  const text90 = "color:#fafafa";

  return `
    <p style="margin:0 0 18px;font-size:16px;line-height:1.75;${text78};">
      Hey,
    </p>
    <p style="margin:0 0 24px;font-size:16px;line-height:1.75;${text78};">
      Quick founder note. Two things shipped this week worth your time.
    </p>

    <div style="border-top:1px solid rgba(250,250,250,0.08);margin:28px 0;"></div>

    <h2 style="margin:0 0 14px;font-size:22px;line-height:1.2;letter-spacing:-0.02em;font-weight:800;${text90};">
      1. Daily Streaks are live
    </h2>
    <p style="margin:0 0 16px;font-size:16px;line-height:1.75;${text78};">
      Show up daily — upvote a tool, click out to a product, view a tool page — and your streak count grows. Each milestone unlocks something concrete:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin:0 0 18px;">
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 5</strong> — your upvotes count 2× on the launch board</td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 10</strong> — 10% off Premium Launch (auto-generated discount code)</td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 25</strong> — 25% off Premium Launch, plus the Daily Lottery unlocks</td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 50</strong> — votes count 3×, avatar border on your profile</td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 100</strong> — votes count 5×, 50% off Premium Launch</td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 250</strong> — 50% off Sponsor Placement</td></tr>
      <tr><td style="padding:6px 0;font-size:15px;line-height:1.7;${text78};"><strong style="${text90};">Day 365</strong> — free Premium Launch slot</td></tr>
    </table>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.75;${text78};">
      The lottery is the fun part. Once you cross day 25, you get one roll per day. Most days you'll see "no win today" — but a small percentage of rolls land you a real Premium Launch discount code. Including a rare 100% off jackpot.
    </p>
    <p style="margin:0 0 8px;font-size:16px;line-height:1.75;${text78};">
      Leaderboard, current streaks, full reward ladder →
      <a href="https://shipboost.io/streaks" style="color:#fafafa;font-weight:700;text-decoration:underline;">shipboost.io/streaks</a>
    </p>

    <div style="border-top:1px solid rgba(250,250,250,0.08);margin:32px 0;"></div>

    <h2 style="margin:0 0 14px;font-size:22px;line-height:1.2;letter-spacing:-0.02em;font-weight:800;${text90};">
      2. Premium Launch — what you actually get
    </h2>
    <p style="margin:0 0 14px;font-size:16px;line-height:1.75;${text78};">
      Five things, every Premium Launch:
    </p>
    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin:0 0 18px;">
      <tr><td style="padding:8px 0;font-size:15px;line-height:1.7;${text78};">→ <strong style="${text90};">Reserve any launch week.</strong> Skip the free queue.</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;line-height:1.7;${text78};">→ <strong style="${text90};">Guaranteed dofollow backlink</strong> from shipboost.io. DR 39 and climbing.</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;line-height:1.7;${text78};">→ <strong style="${text90};">One hand-written editorial article</strong> — our editor reads your brief and writes a real human take. Permanently hosted at /blog. Indexed by Google. Not AI, not a template.</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;line-height:1.7;${text78};">→ <strong style="${text90};">Stronger baseline placement</strong> on the launch board during your week.</td></tr>
      <tr><td style="padding:8px 0;font-size:15px;line-height:1.7;${text78};">→ <strong style="${text90};">No badge verification step.</strong></td></tr>
    </table>
    <p style="margin:0 0 18px;font-size:16px;line-height:1.75;${text78};">
      The editorial is the underrated piece. It's the asset that keeps working months after your launch day. Other launch sites give you 24 hours of attention and a dead listing. We're trying to do the opposite — durable visibility that compounds.
    </p>

    <table cellpadding="0" cellspacing="0" border="0" role="presentation" style="width:100%;margin:22px 0;">
      <tr>
        <td style="background-color:rgba(250,250,250,0.04);border-left:3px solid #fafafa;padding:14px 18px;border-radius:6px;">
          <p style="margin:0 0 4px;font-size:15px;line-height:1.6;${text90};"><strong>Founding price: $9</strong> for the first 100 Premium Launches.</p>
          <p style="margin:0;font-size:14px;line-height:1.6;${text58};">Regular price is $19 after that. Free queue is ~6 weeks out — Premium lets you pick the week you want.</p>
        </td>
      </tr>
    </table>

    <a href="https://shipboost.io/submit" style="display:inline-block;margin:14px 0 24px;border-radius:999px;background-color:#fafafa;color:#0a0a0a;font-size:15px;font-weight:800;line-height:1;padding:16px 24px;text-decoration:none;box-shadow:0 14px 28px rgba(0,0,0,0.22);">
      → Reserve your launch week ($9)
    </a>

    <div style="border-top:1px solid rgba(250,250,250,0.08);margin:24px 0 18px;"></div>

    <p style="margin:0 0 4px;font-size:15px;line-height:1.5;${text90};">Tim</p>
    <p style="margin:0 0 20px;font-size:14px;line-height:1.5;${text58};">Founder, ShipBoost</p>

    <p style="margin:0;font-size:14px;line-height:1.7;${text58};">
      <strong style="${text90};">PS</strong> — Streaks count from today, even if you've been a ShipBoost user for months. Don't wait — one vote, one click, one page view counts as one streak day. The 2× vote multiplier at day 5 hits fast.
    </p>
  `;
}

function renderFullEmail(): string {
  const body = renderBody();
  const safePreview = escapeHtml(PREVIEW);

  return `<!DOCTYPE html>
<html>
<head>
<meta charSet="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(SUBJECT)}</title>
</head>
<body style="margin:0;background-color:#0a0a0a;color:#fafafa;font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,sans-serif;">
<div style="display:none;overflow:hidden;max-height:0;">${safePreview}</div>
<div style="padding:36px 16px 48px;">
  <div style="margin:0 auto 22px;max-width:640px;text-align:center;">
    <img src="${escapeHtml(LOGO_URL)}" alt="ShipBoost" width="72" height="72" style="display:block;margin:0 auto;max-width:72px;height:auto;" />
  </div>
  <div style="margin:0 auto;max-width:640px;overflow:hidden;border-radius:32px;border:1px solid rgba(250,250,250,0.08);background-color:#111111;box-shadow:0 24px 70px rgba(0,0,0,0.35);">
    <div style="padding:34px 30px 16px;text-align:left;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:800;letter-spacing:-0.01em;color:#fafafa;">ShipBoost</p>
      <p style="margin:0;font-size:13px;line-height:1.7;color:rgba(250,250,250,0.58);">Launch smarter. Get distributed.</p>
    </div>
    <div style="padding:12px 30px 28px;">${body}</div>
    <div style="padding:0 30px 30px;">
      <div style="border-top:1px solid rgba(250,250,250,0.08);padding-top:18px;font-size:12px;line-height:1.7;color:rgba(250,250,250,0.48);">
        You're getting this because you signed up at shipboost.io. Reply if you have questions.
      </div>
    </div>
  </div>
</div>
</body>
</html>`;
}

function renderPlainText(): string {
  return `Hey,

Quick founder note. Two things shipped this week worth your time.

1. DAILY STREAKS ARE LIVE

Show up daily — upvote a tool, click out to a product, view a tool page — and your streak count grows. Each milestone unlocks something concrete:

- Day 5: your upvotes count 2× on the launch board
- Day 10: 10% off Premium Launch (auto-generated discount code)
- Day 25: 25% off Premium Launch, plus the Daily Lottery unlocks
- Day 50: votes count 3×, avatar border on your profile
- Day 100: votes count 5×, 50% off Premium Launch
- Day 250: 50% off Sponsor Placement
- Day 365: free Premium Launch slot

The lottery is the fun part. Once you cross day 25, you get one roll per day. Most days you'll see "no win today" — but a small percentage of rolls land you a real Premium Launch discount code. Including a rare 100% off jackpot.

Leaderboard, current streaks, full reward ladder → https://shipboost.io/streaks

2. PREMIUM LAUNCH — WHAT YOU ACTUALLY GET

Five things, every Premium Launch:
- Reserve any launch week. Skip the free queue.
- Guaranteed dofollow backlink from shipboost.io. DR 39 and climbing.
- One hand-written editorial article — our editor reads your brief and writes a real human take. Permanently hosted at /blog. Indexed by Google. Not AI, not a template.
- Stronger baseline placement on the launch board during your week.
- No badge verification step.

The editorial is the underrated piece. It's the asset that keeps working months after your launch day. Other launch sites give you 24 hours of attention and a dead listing. We're trying to do the opposite — durable visibility that compounds.

Founding price: $9 for the first 100 Premium Launches. Regular price is $19 after that. Free queue is ~6 weeks out — Premium lets you pick the week you want.

→ Reserve your launch week ($9): https://shipboost.io/submit

Tim
Founder, ShipBoost

PS — Streaks count from today, even if you've been a ShipBoost user for months. Don't wait — one vote, one click, one page view counts as one streak day. The 2× vote multiplier at day 5 hits fast.`;
}

async function sendOne(email: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: "RESEND_API_KEY not configured" };
  try {
    const res = await resend.emails.send({
      from: FROM,
      to: email,
      subject: SUBJECT,
      html: renderFullEmail(),
      text: renderPlainText(),
    });
    if (res.error) return { ok: false, error: String(res.error.message ?? res.error) };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0] ?? "test";

  if (mode === "test") {
    const testEmail = args[1] ?? "tsth02035@gmail.com";
    console.log(`Sending test to ${testEmail}…`);
    const result = await sendOne(testEmail);
    if (result.ok) {
      console.log("✅ Sent. Check your inbox.");
    } else {
      console.error("❌ Failed:", result.error);
      process.exit(1);
    }
    return;
  }

  if (mode === "all") {
    if (!args.includes("--confirm")) {
      const users = await prisma.user.findMany({
        where: {
          emailVerified: true,
          email: { not: { contains: "@test.local" } },
        },
        select: { email: true, name: true },
      });
      console.log(`Would send to ${users.length} verified users.`);
      console.log("Sample of first 5:");
      users.slice(0, 5).forEach((u) => console.log(`  ${u.email}`));
      console.log("\nDry-run only. Re-run with: npx tsx scripts/send-broadcast-streaks-premium.ts all --confirm");
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        emailVerified: true,
        email: { not: { contains: "@test.local" } },
      },
      select: { email: true, name: true },
    });

    console.log(`Sending to ${users.length} users in batches (1 every 110ms to respect Resend rate limit)…`);
    let sent = 0;
    let failed = 0;
    const failures: Array<{ email: string; error: string }> = [];
    for (const u of users) {
      const result = await sendOne(u.email);
      if (result.ok) {
        sent++;
      } else {
        failed++;
        failures.push({ email: u.email, error: result.error ?? "unknown" });
        console.error(`  ❌ ${u.email}: ${result.error}`);
      }
      // Resend free tier: 10 req/sec. We sleep 110ms between sends to stay well below.
      await new Promise((r) => setTimeout(r, 110));
      if ((sent + failed) % 25 === 0) {
        console.log(`  …progress: ${sent + failed}/${users.length}`);
      }
    }
    console.log(`\nDone. Sent: ${sent} · Failed: ${failed}`);
    if (failures.length > 0) {
      console.log("Failures:");
      failures.forEach((f) => console.log(`  ${f.email} — ${f.error}`));
    }
    return;
  }

  console.error(`Unknown mode: ${mode}. Use "test" or "all".`);
  process.exit(1);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
