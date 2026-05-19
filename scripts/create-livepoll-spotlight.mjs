import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const slug = 'livepoll-io-free-live-polling-q-and-a-quizzes';
const title = 'livepoll.io: Free Forever Live Polling, Q&A, and Quizzes';
const excerpt =
  "livepoll.io is a free-forever live polling, Q&A, and quiz platform for presenters, trainers, and educators. No paywalls, no participant caps, no feature tiers — up to 1,000 participants per session, every poll type unlocked.";
const metaTitle = 'livepoll.io: Free Live Polling, Q&A & Quizzes';
const metaDescription =
  'livepoll.io is a free-forever live polling, Q&A, and quiz tool for presenters. No paywalls, no participant caps, no feature tiers — up to 1,000 per session.';

const markdownContent = `# livepoll.io: Free Forever Live Polling, Q&A, and Quizzes

Live polling tools have a tell. They market themselves as "free" until the moment your session matters — then the paywall hits. Cap of 25 participants on the free plan. Quizzes locked to the paid tier. Word clouds, gone. Anonymous Q&A, paid. The actual feature you need for the meeting in fifteen minutes is on the other side of a credit card.

That model isn't free. It's a trial dressed up as free.

livepoll.io is built on the opposite premise: every feature, every session, for everyone, permanently — funded by ads on the join and results pages, not by gating the product.

## What livepoll.io does

livepoll.io is a live polling, Q&A, and quiz platform for presenters, trainers, and educators. In one session you can run live polls, word clouds, multiple-choice quizzes, ratings, and open Q&A — without switching apps or upgrading plans to unlock the format you actually want.

Up to 1,000 participants per session are included on the free plan. Not a trial. Not a 14-day window. The number doesn't shrink later.

## What's broken about the alternative

Mentimeter, Slido, Kahoot, AhaSlides — they're all built on the same revenue model: free is a top-of-funnel acquisition stage, and the real product is the paid version.

That means the free experience is engineered to fail at scale. Participant limits get smaller every year. Features get reclassified as premium. The free plan exists to demo what's possible, not to be a usable tool for the people who can't or won't pay.

livepoll.io rebuilt the model from scratch. Revenue comes from ads displayed on the participant-facing join page and the post-session results page — places that are unavoidable but don't interrupt the presentation. The presenter's view stays clean. The session experience stays clean. The features stay unlocked.

## How it works

**One session, every poll type** — Live polls, word clouds, multiple-choice quizzes, ratings, and open Q&A all run inside the same session. No tier-juggling, no app-switching mid-presentation.

**1,000 participants on the free plan** — Included. Not throttled, not capped after launch. The free plan is meant to actually work for real classrooms, conferences, and team meetings.

**Ads only at the edges** — Participants see ads when they join (on the entry page) and after the session (on the results page). The presenter view and the live session itself stay ad-free.

**No feature tiers** — Every poll type, every interaction format, every participant count up to the limit. There isn't a "Pro" version with extra features waiting to be unlocked.

## Who this is for

Teachers running live quiz reviews. Trainers running interactive workshops. Conference speakers wanting real-time audience response. Team leads doing pulse polls in all-hands meetings. Anyone who's bumped into a participant cap at the wrong moment and decided they need a tool that doesn't do that.

The trade-off is explicit: participants see ads at the entry and exit points of the session. If that's a deal-breaker, it's not the right tool. If it's not, the rest of the experience stays free permanently.

## Try it

[Open livepoll.io](https://livepoll.io) — or see the [livepoll.io listing on ShipBoost](/tools/livepoll-io) for category context.
`;

const author = await prisma.blogAuthor.findUniqueOrThrow({ where: { slug: 'tim' } });
const category = await prisma.blogCategory.findUniqueOrThrow({ where: { slug: 'launch-spotlights' } });

const tagSlugs = ['founder-marketing', 'saas-launch'];
const tags = await prisma.blogTag.findMany({
  where: { slug: { in: tagSlugs } },
  select: { id: true, slug: true },
});

const now = new Date();

const article = await prisma.blogArticle.create({
  data: {
    slug,
    title,
    excerpt,
    markdownContent,
    status: 'PUBLISHED',
    authorId: author.id,
    primaryCategoryId: category.id,
    metaTitle,
    metaDescription,
    publishedAt: now,
    lastUpdatedAt: now,
    articleTags: {
      create: tags.map((t, i) => ({ tagId: t.id, sortOrder: i })),
    },
  },
});

console.log(`Created article: ${article.slug} (id: ${article.id})`);

// Link to spotlight brief if one exists for this tool's submission
const brief = await prisma.submissionSpotlightBrief.findFirst({
  where: {
    submission: { tool: { slug: 'livepoll-io' } },
  },
  select: { id: true, publishedArticleId: true },
});

if (brief) {
  await prisma.submissionSpotlightBrief.update({
    where: { id: brief.id },
    data: {
      publishedArticleId: article.id,
      publishedAt: now,
      status: 'PUBLISHED',
    },
  });
  console.log(`Linked spotlight brief ${brief.id} → article ${article.id}`);
} else {
  console.warn('No spotlight brief found for livepoll-io — skipped linking');
}

await prisma.$disconnect();
