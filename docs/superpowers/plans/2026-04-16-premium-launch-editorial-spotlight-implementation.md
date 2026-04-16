# Premium Launch Editorial Spotlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a founder-facing editorial spotlight bonus to the first 100 Premium Launches, including pricing/submit positioning, a dashboard autosaved spotlight brief, reminder emails, and an admin workflow to link the published spotlight article.

**Architecture:** Add one dedicated spotlight-brief record per paid Premium Launch instead of overloading `Submission`. Create the brief automatically after confirmed payment, let founders edit it via an autosaved dashboard form, send reminder emails from the paid-email flow plus a cron route, and keep publishing manual through the existing blog CMS while adding a lightweight admin link-back workflow. The published spotlight remains a normal blog article under a dedicated `Launch Spotlights` category.

**Tech Stack:** Next.js App Router, React, Prisma/Postgres, Better Auth, Resend transactional email, existing blog CMS/admin tools, Vitest

**Workflow note:** This repo is currently using a review-first workflow. Do not commit implementation work until the user reviews the finished changes.

---

## File Map

### Data model

- Modify: `prisma/schema.prisma`
- Create migration: `prisma/migrations/<timestamp>_add_submission_spotlight_briefs/`

### Server/repository/service layer

- Modify: `src/server/repositories/submission-repository.ts`
- Create: `src/server/services/submission-spotlight-service.ts`
- Create: `src/server/services/premium-launch-spotlight-reminder-service.ts`
- Modify: `src/server/services/submission-payment-service.ts`
- Modify: `src/server/services/submission-payment-service.test.ts`
- Create: `src/server/services/submission-spotlight-service.test.ts`
- Create: `src/server/services/premium-launch-spotlight-reminder-service.test.ts`

### Founder API and UI

- Create: `src/app/api/submissions/[submissionId]/spotlight-brief/route.ts`
- Modify: `src/components/founder/founder-dashboard.tsx`
- Create: `src/components/founder/launch-spotlight-brief-card.tsx`
- Create: `src/components/founder/launch-spotlight-brief-card.test.tsx`

### Admin API and UI

- Create: `src/app/api/admin/submissions/[submissionId]/spotlight/route.ts`
- Modify: `src/components/admin/admin-console-shared.tsx`
- Modify: `src/components/admin/submission-review-panel.tsx`

### Marketing and founder copy

- Modify: `src/app/pricing/page.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`
- Modify: `src/app/faqs/page.tsx`

### Email and cron

- Modify: `src/server/email/transactional.ts`
- Create: `src/app/api/cron/premium-launch-spotlights/remind-due/route.ts`

---

### Task 1: Add a dedicated spotlight brief model

**Files:**
- Modify: `prisma/schema.prisma`
- Create migration: `prisma/migrations/<timestamp>_add_submission_spotlight_briefs/`

- [ ] Add a dedicated spotlight brief model and status enum to Prisma.

```prisma
enum SubmissionSpotlightStatus {
  NOT_STARTED
  IN_PROGRESS
  READY
  PUBLISHED
}

model SubmissionSpotlightBrief {
  id                      String                    @id @default(cuid())
  submissionId            String                    @unique
  status                  SubmissionSpotlightStatus @default(NOT_STARTED)
  audience                String?
  problem                 String?
  differentiator          String?
  emphasis                String?
  primaryCtaUrl           String?
  founderQuote            String?
  wordingToAvoid          String?
  firstTouchedAt          DateTime?
  completedAt             DateTime?
  publishedAt             DateTime?
  reminderThreeDaysSentAt DateTime?
  reminderLaunchWeekSentAt DateTime?
  publishedArticleId      String?                   @unique

  submission        Submission  @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  publishedArticle  BlogArticle? @relation(fields: [publishedArticleId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

- [ ] Add the reverse relations on `Submission` and `BlogArticle`.

```prisma
model Submission {
  // existing fields...
  spotlightBrief SubmissionSpotlightBrief?
}

model BlogArticle {
  // existing fields...
  spotlightBrief SubmissionSpotlightBrief?
}
```

- [ ] Generate the migration locally.

Run: `npm run db:migrate -- --name add_submission_spotlight_briefs`

Expected: Prisma creates a migration adding the enum, table, and relation columns.

- [ ] Run `npx tsc --noEmit` after migration files are in place.

Expected: PASS

### Task 2: Extend submission data and create the spotlight brief after payment

**Files:**
- Modify: `src/server/repositories/submission-repository.ts`
- Modify: `src/server/services/submission-payment-service.ts`
- Modify: `src/server/services/submission-payment-service.test.ts`

- [ ] Extend founder/admin submission payloads to include spotlight summary data.

```ts
const founderSubmissionSpotlightSelect = {
  status: true,
  updatedAt: true,
  publishedAt: true,
  publishedArticle: {
    select: {
      slug: true,
      title: true,
    },
  },
} satisfies Prisma.SubmissionSpotlightBriefSelect;
```

- [ ] Include that summary in `founderSubmissionSummarySelect` and the admin submission include/select path.

```ts
export const founderSubmissionSummarySelect = {
  id: true,
  submissionType: true,
  reviewStatus: true,
  preferredLaunchDate: true,
  paymentStatus: true,
  badgeVerification: true,
  spotlightBrief: {
    select: founderSubmissionSpotlightSelect,
  },
  tool: {
    select: founderSubmissionToolSummarySelect,
  },
} satisfies Prisma.SubmissionSelect;
```

- [ ] Upsert an empty spotlight brief in `handlePremiumLaunchPaymentSucceeded(...)` after the confirmed DB write succeeds.

```ts
await prisma.submissionSpotlightBrief.upsert({
  where: { submissionId: updatedSubmission.id },
  update: {},
  create: {
    submissionId: updatedSubmission.id,
    status: "NOT_STARTED",
  },
});
```

- [ ] Update the payment service test to assert the brief is created for paid Premium Launches.

```ts
expect(prismaMock.submissionSpotlightBrief.upsert).toHaveBeenCalledWith({
  where: { submissionId: "submission_1" },
  update: {},
  create: expect.objectContaining({
    submissionId: "submission_1",
    status: "NOT_STARTED",
  }),
});
```

- [ ] Run the targeted payment test.

Run: `npm test -- src/server/services/submission-payment-service.test.ts`

Expected: PASS

### Task 3: Add founder spotlight brief service and API

**Files:**
- Create: `src/server/services/submission-spotlight-service.ts`
- Create: `src/server/services/submission-spotlight-service.test.ts`
- Create: `src/app/api/submissions/[submissionId]/spotlight-brief/route.ts`

- [ ] Create a dedicated service for founder read/save access.

```ts
export async function getFounderSpotlightBrief(
  submissionId: string,
  founder: { id: string },
) {
  // load premium submission owned by founder, include spotlightBrief
}

export async function saveFounderSpotlightBrief(
  submissionId: string,
  founder: { id: string },
  input: {
    audience?: string;
    problem?: string;
    differentiator?: string;
    emphasis?: string;
    primaryCtaUrl?: string;
    founderQuote?: string;
    wordingToAvoid?: string;
  },
) {
  // validate paid premium submission
  // compute status: NOT_STARTED / IN_PROGRESS / READY / PUBLISHED
  // set firstTouchedAt when the first non-empty field appears
  // set completedAt when all required fields are present
}
```

- [ ] Use one helper to compute founder-facing brief status so the rule is consistent.

```ts
function getSpotlightStatus(input: SpotlightDraftInput): SubmissionSpotlightStatus {
  const required = [
    input.audience,
    input.problem,
    input.differentiator,
    input.emphasis,
    input.primaryCtaUrl,
  ];

  if (required.every((value) => !value?.trim())) return "NOT_STARTED";
  if (required.every((value) => value?.trim())) return "READY";
  return "IN_PROGRESS";
}
```

- [ ] Add founder-owned GET/PATCH route.

```ts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const session = await requireSession(request);
  const { submissionId } = await params;
  return ok(await getFounderSpotlightBrief(submissionId, { id: session.user.id }));
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  const session = await requireSession(request);
  const { submissionId } = await params;
  const body = spotlightBriefSchema.parse(await request.json());
  return ok(await saveFounderSpotlightBrief(submissionId, { id: session.user.id }, body));
}
```

- [ ] Cover the service with tests for:
  - non-premium submissions rejected
  - unpaid premium submissions rejected
  - first save changes status to `IN_PROGRESS`
  - complete required fields change status to `READY`
  - CTA URL validation rejects malformed URLs

- [ ] Run the new service test.

Run: `npm test -- src/server/services/submission-spotlight-service.test.ts`

Expected: PASS

### Task 4: Add the dashboard brief UI with autosave

**Files:**
- Create: `src/components/founder/launch-spotlight-brief-card.tsx`
- Create: `src/components/founder/launch-spotlight-brief-card.test.tsx`
- Modify: `src/components/founder/founder-dashboard.tsx`

- [ ] Create a focused spotlight card component instead of making `founder-dashboard.tsx` absorb all brief logic.

```tsx
type LaunchSpotlightBriefCardProps = {
  submissionId: string;
  status: "NOT_STARTED" | "IN_PROGRESS" | "READY" | "PUBLISHED";
  initialPublishedArticle?: { slug: string; title: string } | null;
};
```

- [ ] Implement debounced autosave in the card.

```tsx
useEffect(() => {
  if (!isDirty) return;

  const timeout = window.setTimeout(() => {
    void saveDraft();
  }, 800);

  return () => window.clearTimeout(timeout);
}, [draft, isDirty, saveDraft]);
```

- [ ] Keep the founder experience simple:
  - status chip
  - short explanation of what the spotlight is
  - five required fields
  - optional founder quote / wording-to-avoid fields
  - saved / saving / error state
  - read-only published state with article link

- [ ] Render the card only for paid Premium Launches in the dashboard.

```tsx
{sub.submissionType === "FEATURED_LAUNCH" && sub.paymentStatus === "PAID" ? (
  <LaunchSpotlightBriefCard
    submissionId={sub.id}
    status={sub.spotlightBrief?.status ?? "NOT_STARTED"}
    initialPublishedArticle={sub.spotlightBrief?.publishedArticle ?? null}
  />
) : null}
```

- [ ] Add tests for:
  - loads initial status
  - autosaves after edits
  - renders published-state link when article exists

- [ ] Run the founder component test.

Run: `npm test -- src/components/founder/launch-spotlight-brief-card.test.tsx`

Expected: PASS

### Task 5: Update pricing, submit, and FAQ positioning

**Files:**
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/components/founder/submit-product-form.tsx`
- Modify: `src/app/faqs/page.tsx`

- [ ] Update the Premium pricing card description and bullets.

```ts
description:
  "Reserve your launch week, skip badge verification, get stronger baseline placement, and receive a ShipBoost editorial launch spotlight during your launch period.",
points: [
  "Reserve a specific launch week",
  "Skip badge verification and launch faster",
  "Get stronger baseline board placement",
  "Keep a permanent public listing",
  "Includes one editorial launch spotlight during launch period",
],
```

- [ ] Add a short founding-bonus explainer below the pricing cards.

```tsx
<section className="mt-10 rounded-3xl border border-border bg-card p-8">
  <h2 className="text-2xl font-black">What is the editorial launch spotlight?</h2>
  <p className="mt-3 text-sm text-muted-foreground">
    A ShipBoost editorial launch spotlight is a founder feature published during launch week...
  </p>
  <p className="mt-3 text-xs font-bold text-muted-foreground">
    The editorial launch spotlight is a standardized ShipBoost founder feature, not a custom commissioned article.
  </p>
</section>
```

- [ ] Update the Premium option helper copy in the submit flow and replace weaker bullets like `Lower-friction launch flow` with the spotlight value.

```tsx
<p className="text-sm text-muted-foreground font-medium mb-8 flex-1">
  Best for founders who care about timing, lower friction, stronger placement, and an editorial launch spotlight during launch week.
</p>
```

- [ ] Add one FAQ entry:

```ts
{
  question: "What is the editorial launch spotlight?",
  answer:
    "For the first 100 Premium Launches, ShipBoost includes one standardized editorial launch spotlight published during launch week. It is a founder feature linked to your listing, not a custom commissioned article.",
}
```

- [ ] Run typecheck after the copy changes.

Run: `npx tsc --noEmit`

Expected: PASS

### Task 6: Update the paid email and add reminder email automation

**Files:**
- Modify: `src/server/email/transactional.ts`
- Create: `src/server/services/premium-launch-spotlight-reminder-service.ts`
- Create: `src/server/services/premium-launch-spotlight-reminder-service.test.ts`
- Create: `src/app/api/cron/premium-launch-spotlights/remind-due/route.ts`

- [ ] Upgrade the paid Premium Launch email so it doubles as the first reminder.

```ts
await sendPremiumLaunchPaidEmailMessage({
  to: updatedSubmission.user.email,
  name: updatedSubmission.user.name,
  dashboardUrl: getDashboardUrl(),
  toolName: updatedSubmission.tool.name,
  launchDate: formatLaunchDateForEmail(...),
  spotlightBriefUrl: `${getDashboardUrl()}?tab=submissions`,
});
```

- [ ] Add a dedicated reminder email helper with stage-specific copy.

```ts
type SpotlightReminderStage = "THREE_DAYS_BEFORE" | "LAUNCH_WEEK_START";

export async function sendPremiumLaunchSpotlightReminderEmailMessage(input: {
  to: string;
  name: string | null | undefined;
  toolName: string;
  launchDate: string;
  dashboardUrl: string;
  stage: SpotlightReminderStage;
}) {
  // stage-specific subject + body
}
```

- [ ] Add a reminder service that selects due spotlights from paid Premium Launches.

```ts
export async function sendDuePremiumLaunchSpotlightReminders(now = new Date()) {
  // find paid premium submissions with spotlightBrief.status !== "PUBLISHED"
  // send 3-days-before reminder when launchDate - 3d <= now and reminderThreeDaysSentAt is null
  // send launch-week-start reminder when launchDate <= now and reminderLaunchWeekSentAt is null
  // persist sent timestamps after each successful send
}
```

- [ ] Add a cron route following the existing cron secret pattern.

```ts
export async function POST(request: NextRequest) {
  if (readCronSecret(request) !== getEnv().CRON_SECRET) {
    throw new AppError(401, "Invalid cron secret.");
  }

  return ok(await sendDuePremiumLaunchSpotlightReminders());
}
```

- [ ] Cover the reminder service with tests for:
  - no email when spotlight already published
  - 3-days-before reminder sends once
  - launch-week-start reminder sends once
  - sent timestamps prevent duplicate sends

- [ ] Run the reminder service test.

Run: `npm test -- src/server/services/premium-launch-spotlight-reminder-service.test.ts`

Expected: PASS

### Task 7: Add the admin article-linking workflow

**Files:**
- Create: `src/app/api/admin/submissions/[submissionId]/spotlight/route.ts`
- Modify: `src/components/admin/admin-console-shared.tsx`
- Modify: `src/components/admin/submission-review-panel.tsx`
- Modify: `src/server/services/submission-spotlight-service.ts`
- Modify: `src/server/services/submission-spotlight-service.test.ts`

- [ ] Add an admin service method that links a published blog article by slug and marks the spotlight published.

```ts
export async function linkPublishedSpotlightArticle(input: {
  submissionId: string;
  articleSlug: string;
}) {
  const article = await prisma.blogArticle.findUnique({
    where: { slug: input.articleSlug },
    include: { primaryCategory: true },
  });

  if (!article || article.status !== "PUBLISHED") {
    throw new AppError(400, "Select a published spotlight article.");
  }

  if (article.primaryCategory.slug !== "launch-spotlights") {
    throw new AppError(400, "Spotlight articles must use the Launch Spotlights category.");
  }

  return prisma.submissionSpotlightBrief.update({
    where: { submissionId: input.submissionId },
    data: {
      status: "PUBLISHED",
      publishedAt: new Date(),
      publishedArticleId: article.id,
    },
  });
}
```

- [ ] Add an admin-only PATCH route.

```ts
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ submissionId: string }> },
) {
  await requireRole(request, "ADMIN");
  const { submissionId } = await params;
  const body = adminSpotlightLinkSchema.parse(await request.json());
  return ok(await linkPublishedSpotlightArticle({ submissionId, articleSlug: body.articleSlug }));
}
```

- [ ] Extend the admin submission type with spotlight summary.

```ts
spotlightBrief?: {
  status: "NOT_STARTED" | "IN_PROGRESS" | "READY" | "PUBLISHED";
  updatedAt: string;
  publishedAt: string | null;
  publishedArticle: { slug: string; title: string } | null;
};
```

- [ ] Add a compact spotlight section to `SubmissionReviewPanel`.

```tsx
<Field label="Spotlight article slug">
  <input
    value={spotlightDraft.articleSlug}
    onChange={(event) => setSpotlightDraft(...)}
    placeholder="launch-week-feature-acme"
    className={textInputClassName()}
  />
</Field>
```

- [ ] Show the brief status and published article link in admin so ops can see whether the founder finished the brief before publishing.

- [ ] Cover the admin link method in the spotlight service test:
  - rejects unpublished article
  - rejects wrong category
  - marks spotlight published when slug is valid

- [ ] Run the spotlight service test again.

Run: `npm test -- src/server/services/submission-spotlight-service.test.ts`

Expected: PASS

### Task 8: Manual content ops setup and full verification

**Files:**
- No new code unless verification finds issues

- [ ] Create the `Launch Spotlights` category in the existing admin blog UI if it does not already exist.

Manual steps:
1. Open `/admin/blog`
2. Create category `Launch Spotlights`
3. Use slug `launch-spotlights`
4. Add a short description so the archive page is not empty-state quality

- [ ] Verify the founder flow manually.

Manual checklist:
1. Create or use a paid Premium Launch submission
2. Confirm the dashboard shows `Launch Spotlight Brief`
3. Type into the brief and confirm autosave
4. Confirm the paid email mentions the spotlight brief
5. Simulate reminder windows in test data and hit the cron route
6. Publish a blog article in `Launch Spotlights`
7. Link the article from admin via article slug
8. Confirm founder dashboard changes from `Ready` to `Published`

- [ ] Run the focused test suite.

Run:
```bash
npm test -- \
  src/server/services/submission-payment-service.test.ts \
  src/server/services/submission-spotlight-service.test.ts \
  src/server/services/premium-launch-spotlight-reminder-service.test.ts \
  src/components/founder/launch-spotlight-brief-card.test.tsx
```

Expected: PASS

- [ ] Run full typecheck and build.

Run:
```bash
npx tsc --noEmit
npm run build
```

Expected: PASS

## Spec Coverage Check

Covered from the spec:
- pricing highlight and explainer section
- submit-flow comparison and Premium helper copy
- dashboard-managed spotlight brief with autosave
- standardized brief questions
- launch-week publish promise with ShipBoost timing discretion
- reminder cadence: paid-email reminder + 3-days-before + launch-week-start
- fallback publishing support through existing listing/submission data
- standardized editorial scope and status tracking
- Launch Spotlights blog category
- admin workflow to connect the published article back to the paid Premium Launch

Not automated in this plan:
- auto-generating the spotlight article itself
- auto-publishing the article into the blog CMS
- founder revision workflow beyond factual correction handling by ops

These exclusions are intentional to keep v1 operationally safe.
