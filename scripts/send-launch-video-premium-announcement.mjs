// One-time email from Tim to Premium founders whose launch week has passed,
// announcing the $99 launch video (7-day delivery).
//
//   node scripts/run-with-env.mjs node scripts/send-launch-video-premium-announcement.mjs
//       Dry run (default): lists every recipient and prints one sample email.
//   ... --test=you@example.com
//       Sends the first recipient's email to that address, exactly as founders get it.
//   ... --send
//       Sends to every recipient not already in the sent log.
//   ... --send --only=founder@example.com
//       Sends to that one founder only, even one on the excluded list.
//
// The sent log (scripts/.launch-video-announcement-sent.json) makes --send safe
// to re-run: anyone already emailed is skipped.

import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { PrismaClient } from "@prisma/client";
import { Resend } from "resend";

const SAMPLE_URL = "https://shipboost.io/pricing#launch-video";
const PRICE_USD = 99;
const LATER_PRICE_USD = 149;
const LAUNCH_PRICE_LIMIT = 10;
const SEND_DELAY_MS = 700;
// A personal note from Tim's own address, replies straight back to him.
const FROM = "Tim from ShipBoost <tim@shipboost.io>";
const REPLY_TO = "tim@shipboost.io";
// Links always point at production, whatever .env.local says.
const APP_URL = "https://shipboost.io";

// Greetings where the account name is a brand or handle, checked by hand.
const GREETING_OVERRIDES = {
  "energetekk@proton.me": "there",
  "ashar@thehumanlyapp.com": "Ashar",
  "info@mamar.ca": "Fadi",
  "asn.tech.2019@gmail.com": "there",
  "support@akmon.app": "there",
  "social@kitchenbathmarketing.com": "there",
  "shippedbytim@gmail.com": "there",
};

// Never emailed: the founder's own accounts.
const EXCLUDED_EMAILS = new Set(["tsth02035@gmail.com"]);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const sentLogPath = path.join(scriptDir, ".launch-video-announcement-sent.json");

const args = process.argv.slice(2);
const testTo = args.find((arg) => arg.startsWith("--test="))?.slice("--test=".length);
const sendAll = args.includes("--send");
const only = args.find((arg) => arg.startsWith("--only="))?.slice("--only=".length);

/** "Ana Lopez" → "Ana". Usernames, emails and blanks fall back to "there". */
function firstName(name, email) {
  if (GREETING_OVERRIDES[email]) return GREETING_OVERRIDES[email];
  const first = (name ?? "").trim().split(/\s+/)[0] ?? "";
  if (!/^[\p{L}'-]{2,}$/u.test(first)) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}

function launchMonth(date) {
  const sameYear = date.getUTCFullYear() === new Date().getUTCFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}

function joinNames(names) {
  return names.length <= 1
    ? names.join("")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

function readSentLog() {
  if (!existsSync(sentLogPath)) return {};
  return JSON.parse(readFileSync(sentLogPath, "utf8"));
}

function writeSentLog(log) {
  writeFileSync(sentLogPath, `${JSON.stringify(log, null, 2)}\n`);
}

async function loadRecipients(prisma) {
  const now = new Date();
  const submissions = await prisma.submission.findMany({
    where: {
      submissionType: "FEATURED_LAUNCH",
      paymentStatus: "PAID",
      user: { role: { not: "ADMIN" } },
      tool: {
        launches: {
          some: {
            launchType: "FEATURED",
            status: { in: ["APPROVED", "LIVE", "ENDED"] },
            launchDate: { lte: now },
          },
        },
      },
      // Skip anyone who already bought a video for this product.
      launchVideoOrders: { none: { status: { in: ["PAID", "DELIVERED"] } } },
    },
    select: {
      id: true,
      user: { select: { id: true, email: true, name: true } },
      tool: {
        select: {
          name: true,
          launches: {
            where: { launchType: "FEATURED", launchDate: { lte: now } },
            orderBy: { launchDate: "desc" },
            take: 1,
            select: { launchDate: true },
          },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // One email per founder, naming every Premium product they launched.
  const byUser = new Map();
  for (const submission of submissions) {
    if (only ? submission.user.email !== only : EXCLUDED_EMAILS.has(submission.user.email)) continue;
    const entry = byUser.get(submission.user.id) ?? {
      userId: submission.user.id,
      email: submission.user.email,
      firstName: firstName(submission.user.name, submission.user.email),
      products: [],
    };
    if (!entry.products.some((product) => product.name === submission.tool.name)) {
      entry.products.push({
        name: submission.tool.name,
        launchDate: submission.tool.launches[0]?.launchDate ?? null,
        link: `${APP_URL}/dashboard/submissions/${submission.id}/launch-video`,
      });
    }
    byUser.set(submission.user.id, entry);
  }

  return [...byUser.values()];
}

function buildEmail(recipient) {
  const names = recipient.products.map((product) => product.name);
  const single = recipient.products.length === 1;
  const product = recipient.products[0];
  const toolNames = joinNames(names);
  const subject = `a launch video for ${toolNames}`;
  const months = [
    ...new Set(
      recipient.products
        .filter((item) => item.launchDate)
        .map((item) => launchMonth(item.launchDate)),
    ),
  ];
  const launchedWhen = months.length > 0 ? ` in ${joinNames(months)}` : "";
  const subjectOfVideo = single ? product.name : "your product";

  const paragraphs = [
    `Hi ${recipient.firstName},`,
    `I'm Tim, founder of ShipBoost. You launched ${toolNames} with us on Premium${launchedWhen}, so I wanted you to hear about this before anyone else.`,
    `We've started making launch videos. Each one is 20 seconds of ${subjectOfVideo} doing one real thing, the result it gets, and an end card. You get a 16:9 cut for your site and X, and a 9:16 cut for Reels, TikTok and Shorts. Here's one we made for Tally so you can see the format: ${SAMPLE_URL}`,
    "Most launch posts are a screenshot and a link, and people scroll past both. A video of your product working gives them a reason to stop. It keeps working after launch day too: on your homepage, in a pinned post, or in your next product update.",
    `For Premium founders it's $${PRICE_USD}, delivered within 7 days of your order. That's the launch price for the first ${LAUNCH_PRICE_LIMIT} videos. After that it goes to $${LATER_PRICE_USD}.`,
    single
      ? `If you'd like one for ${product.name}, this link goes straight to it: ${product.link}`
      : [
          "If you'd like one, these links go straight to it:",
          ...recipient.products.map((item) => `${item.name}: ${item.link}`),
        ].join("\n"),
    `There are no revision rounds. If we get a fact about ${subjectOfVideo} wrong, we fix it. If it isn't delivered within 7 days, you get a full refund.`,
    "Thanks again for launching with ShipBoost.",
    "Tim\nFounder, ShipBoost",
    `P.S. Not interested? Reply "no" and I won't email you about this again.`,
  ];

  return { subject, text: paragraphs.join("\n\n") };
}

async function main() {
  const prisma = new PrismaClient();
  const recipients = await loadRecipients(prisma);
  await prisma.$disconnect();

  const sentLog = readSentLog();
  const pending = recipients.filter((recipient) => !sentLog[recipient.email]);

  console.log(`Recipients: ${recipients.length} founders (${pending.length} not emailed yet)\n`);
  for (const recipient of recipients) {
    const status = sentLog[recipient.email] ? "sent" : "pending";
    console.log(
      `[${status}] ${recipient.email} | Hi ${recipient.firstName} | ${recipient.products
        .map((product) => product.name)
        .join(", ")}`,
    );
  }

  if (recipients.length === 0) return;

  const sample = buildEmail(pending[0] ?? recipients[0]);

  if (!testTo && !sendAll) {
    console.log(`\n--- Sample email ---\nSubject: ${sample.subject}\n\n${sample.text}\n`);
    console.log("Dry run only. Use --test=<email> to send a test, --send to send to everyone.");
    return;
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not set.");

  const resend = new Resend(apiKey);
  const from = FROM;
  const replyTo = REPLY_TO;
  const headers = { "List-Unsubscribe": `<mailto:${REPLY_TO}?subject=unsubscribe>` };

  if (testTo) {
    const response = await resend.emails.send({
      from,
      to: testTo,
      replyTo,
      subject: sample.subject,
      text: sample.text,
      headers,
    });
    if (response.error) throw new Error(response.error.message);
    console.log(`\nTest sent to ${testTo} (content for ${(pending[0] ?? recipients[0]).email}).`);
    return;
  }

  let sent = 0;
  for (const recipient of pending) {
    const email = buildEmail(recipient);
    const response = await resend.emails.send({
      from,
      to: recipient.email,
      replyTo,
      subject: email.subject,
      text: email.text,
      headers,
    });

    if (response.error) {
      console.error(`FAILED ${recipient.email}: ${response.error.message}`);
    } else {
      sentLog[recipient.email] = { sentAt: new Date().toISOString(), id: response.data?.id };
      writeSentLog(sentLog);
      sent += 1;
      console.log(`sent ${recipient.email}`);
    }

    await new Promise((resolve) => setTimeout(resolve, SEND_DELAY_MS));
  }

  console.log(`\nDone: ${sent} of ${pending.length} sent.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
