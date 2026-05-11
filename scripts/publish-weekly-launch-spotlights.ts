import { readFile } from "node:fs/promises";

import { prisma } from "@/server/db/client";
import { uploadImageToCloudinary } from "@/server/cloudinary";
import {
  createAdminBlogArticle,
  updateAdminBlogArticle,
} from "@/server/services/blog-service";
import { linkPublishedSpotlightArticle } from "@/server/services/submission-spotlight-service";

const articles = [
  {
    submissionId: "cmovshrcg000uui0sk36sdi1u",
    slug: "superkabe-cold-email-deliverability-auto-healing",
    title: "Superkabe: Cold Email Deliverability With Auto-Healing Protection",
    excerpt:
      "Superkabe helps outbound teams protect cold email deliverability with validation, ESP-aware routing, real-time monitoring, and auto-healing senders.",
    metaTitle:
      "Superkabe: Cold Email Deliverability With Auto-Healing Protection",
    metaDescription:
      "Superkabe helps outbound teams protect cold email deliverability with validation, ESP-aware routing, real-time monitoring, and auto-healing senders.",
    coverPath: "/Users/tsth/Downloads/Directory-Badge/Superkabe Cover Image.png",
    coverAlt: "Launch Spotlights: Superkabe cover image",
    markdownContent: `# Superkabe: Cold Email Deliverability With Auto-Healing Sender Protection

Superkabe is a cold email platform built for outbound teams that care about deliverability before it breaks.

Most cold email tools help teams write sequences, connect inboxes, and send campaigns. Superkabe focuses on what happens underneath that workflow: whether the mailbox is healthy, whether the lead should be contacted, whether the recipient's email provider matters, and whether a sender needs to be paused before it damages the rest of the system.

For outbound marketers, GTM teams, agencies, and startup founders, that difference matters. A campaign can look fine on the surface while reply rates fall, bounce rates climb, or domain reputation quietly gets worse.

![Superkabe cold email deliverability dashboard](https://res.cloudinary.com/dhdy0tbpt/image/upload/v1778176693/ShipBoost/screenshots/screenshot-8b81c2af-4857-49a0-857f-38e1df90c4de.webp)

Superkabe is designed to give outbound teams a more active layer of protection around cold email sending.

## What Superkabe Does

Superkabe combines cold email sending, AI sequence drafting, lead validation, mailbox rotation, ESP-aware routing, and deliverability monitoring in one platform.

Teams can send across unlimited mailboxes, including Gmail, Microsoft 365, and SMTP inboxes. Before a lead reaches a sender, Superkabe validates the email, checks risk signals, and routes the send based on the recipient's email provider.

That means the platform is not just asking whether a campaign should send. It is asking which sender should handle the message, whether the lead is safe to contact, and whether the mailbox is still healthy enough to keep sending.

Superkabe also includes Slack alerts, reporting, CSV exports, and Claude / MCP-powered AI workflows for outbound teams that want help drafting and managing campaigns.

## Why Superkabe Stands Out

The core idea behind Superkabe is that deliverability should not be treated as a cleanup job after something goes wrong.

Its submission highlights a 5-phase auto-healing pipeline: Pause, Quarantine, Restricted Send, Warm Recovery, and Healthy. Superkabe describes this as an active rehabilitation system for compromised mailboxes.

Instead of a simple pause or unpause switch, the platform detects degraded senders, quarantines them, checks DNS and health signals, limits sending during recovery, and gradually returns the mailbox to healthy sending behavior when it meets the right criteria.

![Superkabe sender health and campaign protection](https://res.cloudinary.com/dhdy0tbpt/image/upload/v1778176693/ShipBoost/screenshots/screenshot-d86abbbe-8fe6-4036-91bb-5b25f56ac96a.webp)

That is useful for outbound teams because mailbox health is rarely isolated. One bad sender can affect domain reputation, campaign performance, and the reliability of the broader outbound motion.

## Built Around Deliverability Protection

Superkabe's listing describes a multi-stage protection layer that starts before sending.

Each lead goes through validation for syntax, MX records, disposable domains, catch-all risk, and additional verification for risky leads. Invalid emails are blocked before they reach a sender.

From there, Superkabe classifies leads through a health gate: GREEN, YELLOW, or RED. Safer leads route normally, riskier leads can be capped, and high-risk leads can be blocked entirely.

The platform also uses ESP-aware routing. A lead going to Gmail, Outlook, Mimecast, or another provider can be routed to the mailbox most likely to land in the inbox for that recipient environment.

That gives outbound teams more control than a basic round-robin sending setup.

## Auto-Pause, Correlation, And Recovery

Superkabe also monitors mailbox health in real time.

The platform checks signals such as bounce rates, SMTP and IMAP connectivity, and DNS authentication, including SPF, DKIM, and DMARC. When a mailbox crosses a risk threshold, Superkabe can auto-pause the sender and use correlation logic to understand whether the issue is tied to the mailbox, the domain, or the campaign.

That matters because the right fix depends on the root cause.

If a single mailbox is damaged, the team needs to isolate and recover it. If the domain is the issue, continuing to send from nearby inboxes may make the problem worse. If the campaign is attracting bad replies or bad delivery signals, the message and list may need attention.

Superkabe is built to make those distinctions clearer.

## Where Superkabe Fits In An Outbound Stack

Superkabe is best understood as a cold email platform for teams that want deliverability protection built into the sending workflow, not bolted on afterward.

It can support:

- Cold email sequence creation
- Unlimited mailbox sending
- Gmail, Microsoft 365, and SMTP inboxes
- Email validation before sending
- ESP-aware lead routing
- Mailbox rotation
- Bounce monitoring
- Auto-pause rules
- Sender recovery workflows
- Slack alerts and campaign reporting

For agencies and GTM teams running outbound at scale, the value is operational. Superkabe helps reduce the chance that a campaign keeps sending through a damaged setup for days or weeks before someone notices.

## Why Superkabe Matters Now

Cold email is getting harder to run casually.

Inbox providers are stricter, buyers are more sensitive to low-quality outreach, and teams that rely on outbound cannot afford to treat deliverability as an afterthought.

Superkabe's pitch is direct: tools like Instantly and Smartlead may help teams send, but Superkabe is built to fight for sender health when things start going wrong.

That positioning makes it especially relevant for outbound teams that have already felt the pain of damaged inboxes, falling reply rates, or domain reputation problems.

Superkabe does not just help teams launch cold email campaigns. It helps them keep the sending system healthier while those campaigns run.

## Superkabe Launch Spotlight

Superkabe is launching on ShipBoost as a featured launch for outbound marketers, GTM teams, outbound agencies, and startup founders that want stronger cold email deliverability protection.

If your outbound motion depends on keeping inboxes healthy, Superkabe is worth a closer look. It combines sending, validation, routing, monitoring, and auto-healing workflows into one platform built around deliverability from the start.

[Explore Superkabe](https://app.superkabe.com/signup)`,
  },
  {
    submissionId: "cmoqygomj000ems0uiciem2h5",
    slug: "setlist-free-band-planning-app",
    title: "Setlist: A Free Band Planning App Built for Gigging Musicians",
    excerpt:
      "Setlist helps bands plan gigs, rehearsals, songs, setlists, venues, and practice sessions in one free collaborative app.",
    metaTitle: "Setlist: A Free Band Planning App Built for Gigging Musicians",
    metaDescription:
      "Setlist helps bands plan gigs, rehearsals, songs, setlists, venues, and practice sessions in one free collaborative app.",
    coverPath: "/Users/tsth/Downloads/Directory-Badge/Setlist Cover image.png",
    coverAlt: "Launch Spotlights: Setlist cover image",
    markdownContent: `# Setlist: A Free Band Planning App Built for Gigging Musicians

Setlist is a free planning and collaboration app for bands.

It helps musicians organize songs, build setlists, plan rehearsals, manage gigs, track venues, and practice together without stitching together spreadsheets, chat threads, calendar invites, and last-minute messages.

For musicians and band members, that kind of organization is practical. A band is a creative project, but it is also a coordination problem. People need to know what songs are ready, what needs work, what the next event requires, and what will actually be played on stage.

![Setlist band planning and gig organization app](https://res.cloudinary.com/dhdy0tbpt/image/upload/v1777884390/ShipBoost/screenshots/screenshot-2c5bf7e6-80d2-4048-8e26-f1532c33291b.webp)

Setlist gives bands one shared place to manage that work.

## What Setlist Does

Setlist helps bands plan gigs and rehearsals, build a shared song collection, create setlists, and keep event details organized.

Bands can add songs, vote on them, leave comments, and track their state as they move from idea to rehearsal-ready to stage-ready. When it is time to prepare for a gig, the band can create setlists with drag-and-drop and print them for the stage.

The app also includes a shared band calendar for rehearsals, gigs, and other events. Each event can include details, comments, venues, and attached setlists, so the band has a clearer view of what is coming up and what needs to be ready.

That makes Setlist less like a generic notes app and more like a focused operating system for bands.

## Why Setlist Stands Out

Setlist stands out because it is built specifically around the way gigging bands work.

A generic project management tool can track tasks. A calendar can track dates. A document can hold song notes. A playlist can hold practice material. But bands often need all of those pieces connected around the same thing: getting songs ready and performing them together.

Setlist connects that workflow directly.

![Setlist song collection and setlist workflow](https://res.cloudinary.com/dhdy0tbpt/image/upload/v1777884390/ShipBoost/screenshots/screenshot-8256359e-6905-4011-85e2-2f02fc7cbf6c.webp)

The founder describes the product as a passion project built by a musician and professional developer with decades of programming experience. That shows in the product angle. Setlist is not trying to be a broad productivity platform. It is trying to solve the specific coordination problems that show up inside bands.

## Built For Bands, Not Generic Teams

Organizing musicians is often harder than it looks.

A band may need to agree on songs, rehearse difficult parts, remember venue details, prepare printed setlists, manage comments from different members, and keep track of what has changed since the last rehearsal.

Setlist gives bands a shared place to do that work.

The song collection can become the band's source of truth. Voting and comments help members discuss what should be played. State tracking shows what is ready and what still needs work. Setlists can be built from that library and attached to real events.

That is the difference between simply writing down songs and actually managing the band's working repertoire.

## Practice, Events, And Stage Prep In One Place

Setlist also includes practice-focused tools.

Bands can use built-in audio playback, loop tricky sections, slow parts down, and work through difficult material before rehearsal or a gig. The app also supports looking up lyrics, tabs, and album artwork without leaving the workflow.

For events, Setlist lets bands track venues, rehearse around a shared schedule, and keep gig details in one place.

![Setlist rehearsal calendar and band collaboration](https://res.cloudinary.com/dhdy0tbpt/image/upload/v1777884390/ShipBoost/screenshots/screenshot-89f359d7-6440-479a-9b32-cf5b68b5f1dc.webp)

That matters because band planning usually breaks when details are scattered. A setlist might live in one message, venue notes in another, rehearsal availability in a calendar, and song comments in a separate thread.

Setlist brings those pieces together around the actual work of playing music.

## Where Setlist Fits In A Band Workflow

Setlist is best understood as a collaboration hub for bands that want to stay organized without turning music into admin work.

It can support:

- Song collection management
- Song voting and comments
- Readiness tracking for songs
- Drag-and-drop setlist building
- Printable setlists for gigs
- Shared rehearsal and gig calendars
- Venue tracking
- Event comments and details
- Practice playback
- Lyrics, tabs, and album artwork lookup

Because the product is free, with no ads, subscriptions, or data selling, it also fits bands that want a lightweight tool without adding another paid subscription to the group.

## Why Setlist Matters Now

A lot of creative collaboration still happens through tools that were not designed for the work.

Bands use group chats, notes apps, shared calendars, spreadsheets, streaming links, and memory. That can work for a while, but it gets messy when the band plays more often, adds more songs, or needs to coordinate across multiple people.

Setlist gives musicians a more focused option.

The product is built for the everyday reality of a gigging band: choosing songs, rehearsing them, building the set, tracking the event, and showing up prepared.

That focus is the value. Setlist does not try to turn bands into office teams. It gives musicians a tool shaped around the way they already work.

## Setlist Launch Spotlight

Setlist is launching on ShipBoost as a featured launch for musicians and band members who want a cleaner way to plan gigs, rehearsals, songs, and setlists together.

If your band is still organizing everything through scattered messages, calendar entries, and separate documents, Setlist is worth a closer look. It gives bands a free, collaborative place to manage the work behind every rehearsal and show.

[Explore Setlist](https://setlist.rocks)`,
  },
];

async function getAssignments() {
  const [author, category] = await Promise.all([
    prisma.blogAuthor.findUnique({ where: { slug: "tim" } }),
    prisma.blogCategory.findUnique({ where: { slug: "launch-spotlights" } }),
  ]);

  if (!author) {
    throw new Error("Missing blog author: tim");
  }

  if (!category) {
    throw new Error("Missing blog category: launch-spotlights");
  }

  return { author, category };
}

async function publishArticle(input: (typeof articles)[number]) {
  const { author, category } = await getAssignments();
  const existing = await prisma.blogArticle.findUnique({
    where: { slug: input.slug },
    select: { id: true },
  });
  const cover = await uploadImageToCloudinary(await readFile(input.coverPath), {
    kind: "blog-cover",
    filename: input.coverPath.split("/").at(-1) ?? `${input.slug}.png`,
  });
  const canonicalUrl = `https://shipboost.io/blog/${input.slug}`;
  const payload = {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    markdownContent: input.markdownContent,
    status: "PUBLISHED" as const,
    authorId: author.id,
    primaryCategoryId: category.id,
    coverImageUrl: cover.url,
    coverImagePublicId: cover.publicId,
    coverImageAlt: input.coverAlt,
    metaTitle: input.metaTitle,
    metaDescription: input.metaDescription,
    canonicalUrl,
    ogImageUrl: cover.url,
    tagIds: [],
  };

  const article = existing
    ? await updateAdminBlogArticle(existing.id, payload)
    : await createAdminBlogArticle(payload);

  const linked = await linkPublishedSpotlightArticle({
    submissionId: input.submissionId,
    articleSlug: article.slug,
  });

  return {
    title: article.title,
    slug: article.slug,
    url: canonicalUrl,
    coverImageUrl: cover.url,
    coverImagePublicId: cover.publicId,
    spotlightStatus: linked.status,
    spotlightPublishedAt: linked.publishedAt,
  };
}

async function main() {
  const results = [];

  for (const article of articles) {
    results.push(await publishArticle(article));
  }

  console.log(JSON.stringify(results, null, 2));
}

void main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
