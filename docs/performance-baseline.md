# ShipBoost Performance Baseline

## Task 0: Restore Build Verification

- Date: 2026-04-10
- Branch: `perf/remediation-task0`
- Command: `npm run build`
- Result: success

### Build blockers fixed

1. `src/components/admin/admin-console.tsx`
   Replaced `as const` inference on `navItems` with an explicit `AdminNavItem[]` type so `item.count` is safely optional during render.
2. `src/components/founder/founder-dashboard.tsx`
   Applied the same explicit nav-item typing fix to the founder dashboard sidebar.
3. `src/components/public/home-lead-magnet-form.tsx`
   Added the missing `Check` and `AlertCircle` imports from `lucide-react`.

### Current Route Classification

Key routes from the remediation plan:

| Route | Current mode |
| --- | --- |
| `/` | Dynamic |
| `/launches/[board]` | Dynamic |
| `/categories` | Static |
| `/categories/[slug]` | Dynamic |
| `/best/tag/[slug]` | Dynamic |
| `/alternatives` | Static |
| `/alternatives/[slug]` | Dynamic |
| `/tools/[slug]` | Dynamic |
| `/dashboard` | Dynamic |
| `/pricing` | Static |
| `/tags` | Static |

Full build excerpt:

```text
Route (app)
┌ ƒ /
├ ○ /_not-found
├ ƒ /admin
├ ○ /alternatives
├ ƒ /alternatives/[slug]
├ ƒ /api/admin/categories
├ ƒ /api/admin/categories/[categoryId]
├ ƒ /api/admin/listing-claims
├ ƒ /api/admin/listing-claims/[claimId]
├ ƒ /api/admin/submissions
├ ƒ /api/admin/submissions/[submissionId]/review
├ ƒ /api/admin/tags
├ ƒ /api/admin/tags/[tagId]
├ ƒ /api/admin/tools
├ ƒ /api/admin/tools/[toolId]
├ ƒ /api/auth/[...all]
├ ƒ /api/categories
├ ƒ /api/cron/launches/publish-due
├ ƒ /api/founder/tools
├ ƒ /api/founder/tools/[toolId]
├ ƒ /api/founder/tools/[toolId]/relaunch
├ ƒ /api/launches
├ ƒ /api/leads
├ ƒ /api/listing-claims
├ ƒ /api/outbound/tool/[toolId]
├ ƒ /api/polar/checkout/featured-launch
├ ƒ /api/polar/webhooks
├ ƒ /api/submissions
├ ƒ /api/submissions/[submissionId]/reschedule
├ ƒ /api/submissions/[submissionId]/submit
├ ƒ /api/submissions/[submissionId]/verify-badge
├ ƒ /api/tools/[toolId]/vote
├ ƒ /api/tools/search
├ ƒ /api/tools/slug-suggestion
├ ƒ /best/tag/[slug]
├ ○ /categories
├ ƒ /categories/[slug]
├ ƒ /dashboard
├ ƒ /dashboard/tools/[toolId]
├ ƒ /forgot-password
├ ƒ /launches/[board]
├ ○ /pricing
├ ƒ /reset-password
├ ƒ /sign-in
├ ƒ /sign-up
├ ƒ /submit
├ ○ /tags
├ ƒ /tools/[slug]
└ ƒ /verify-email

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## Task 1: Measurement Notes

Local production server:

- Command: `npm run start -- --hostname 127.0.0.1 --port 3000`
- Reference build: the successful Task 0 build above

### Anonymous route baseline

Measured against the local production server with a simple HTTP probe. Representative slugs:

- Category page: `/categories/marketing`
- Best-tag page: `/best/tag/ai`
- Alternatives page: `/alternatives/shipfast`
- Tool page: `/tools/respond-io`

| Route | Status | Anonymous TTFB | HTML bytes | Notes |
| --- | --- | --- | --- | --- |
| `/` | `200` | `2951.9 ms` | `65,297` | Homepage |
| `/launches/daily` | `200` | `4249.3 ms` | `52,238` | Daily launch board |
| `/categories/marketing` | `200` | `7573.4 ms` | `132,586` | Representative category page |
| `/best/tag/ai` | `200` | `7573.8 ms` | `135,147` | Representative best-tag page |
| `/alternatives/shipfast` | `200` | `7383.5 ms` | `76,310` | Representative alternatives page |
| `/tools/respond-io` | `200` | `13395.7 ms` | `68,006` | Representative tool detail page |
| `/dashboard` | `307` | `135.3 ms` | `9,226` | Anonymous request redirects to `/sign-in` |

### JS transferred on listing pages

Measured by summing unique `/_next/static/` script responses referenced by the rendered HTML.

| Route | Script count | JS bytes |
| --- | --- | --- |
| `/` | `12` | `785,197` |
| `/categories/marketing` | `12` | `770,344` |

### Measurement gaps still open

- Logged-in TTFB:
  Requires bootstrapping an authenticated session for apples-to-apples public-page measurements.
- DB queries per request:
  Requires Prisma query instrumentation or database-side query logging; current production client logs only errors in `NODE_ENV=production`.
- LCP on homepage and category page:
  Requires a browser trace against the local production server.

## Task 2: Public Viewer-State Split Verification

- Date: 2026-04-10
- Commands:
  - `npm run build`
  - `rg -n "getServerSession" src/app/page.tsx src/app/launches/[board]/page.tsx src/app/categories/[slug]/page.tsx src/app/best/tag/[slug]/page.tsx src/app/alternatives/[slug]/page.tsx src/app/tools/[slug]/page.tsx`
  - `curl -sS http://127.0.0.1:3001/tools/respond-io | shasum -a 256`
  - `curl -sS -H 'Cookie: fake_session=1' http://127.0.0.1:3001/tools/respond-io | shasum -a 256`
  - `curl -sS http://127.0.0.1:3001/tools/respond-io | rg -n "Claim this listing|Signed in as|Upvoted|Claim this listing now"`
- Local production server:
  - `npm run start -- --hostname 127.0.0.1 --port 3001`

### Verification results

- `npm run build` succeeded after removing server-side session and claim-state reads from the tool detail page.
- `getServerSession()` is absent from all public route files covered by Task 2.
- `/tools/respond-io` HTML is identical with and without a cookie header in the production build:
  - anonymous SHA-256: `4c0e0f136b03dd2f30ed1bbcdea3a1bf3d6c1d9fdfde590cd80176a883f14a0b`
  - fake-cookie SHA-256: `4c0e0f136b03dd2f30ed1bbcdea3a1bf3d6c1d9fdfde590cd80176a883f14a0b`
- Server-rendered tool-detail HTML no longer includes viewer-specific claim or upvote strings (`Claim this listing`, `Signed in as`, `Claim this listing now`, `Upvoted`).
- Route classification is still dynamic for the public detail/listing routes. That is expected until the later caching and `revalidate` work in Tasks 3 and beyond lands.

## Task 3: Lean Public Select Refactor

- Date: 2026-04-10
- Commands:
  - `npx tsc --noEmit`
  - `npm run build`
- Result:
  - Added `src/server/db/public-selects.ts`
  - Swapped public detail/listing services to dedicated Prisma `select` shapes in `src/server/services/tool-service.ts`, `src/server/services/seo-service.ts`, `src/server/services/catalog-service.ts`, and `src/server/services/launch-service.ts`
  - Build succeeded after the refactor

### Verification notes

- Public routes still build successfully after removing `toolDetailsInclude` from the public tool/detail/list services.
- The lean public shapes no longer request owner, submission, or launch records for the public category/tag/alternatives/tool-detail flows.
- Route classification is unchanged at this stage. The next meaningful shift should come from Task 4 cache and ISR work, not from the select refactor alone.

## Task 4: ISR And Shared Cached Loaders

- Date: 2026-04-10
- Commands:
  - `npm run build`
  - escalated `npm run start -- --hostname 127.0.0.1 --port 3001` with local `curl` probes for representative public routes
- Result:
  - Added `src/server/cache/public-content.ts`
  - Public routes now export explicit `revalidate` values
  - Shared cached loaders are reused in `generateMetadata` and page bodies for category, best-tag, alternatives, and tool-detail pages
  - Homepage board switching now routes through `/launches/[board]`
  - Category and best-tag sorting now stays client-side so those pages can prerender

### Updated Route Classification

| Route | Current mode | Revalidate |
| --- | --- | --- |
| `/` | Static | `300s` |
| `/launches/[board]` | SSG | `300s` |
| `/categories/[slug]` | SSG | `1800s` |
| `/best/tag/[slug]` | SSG | `1800s` |
| `/alternatives/[slug]` | SSG | `1800s` |
| `/tools/[slug]` | SSG | `3600s` |
| `/dashboard` | Dynamic | n/a |

Full build excerpt:

```text
Route (app)                                       Revalidate  Expire
┌ ○ /                                                     5m      1y
├ ○ /_not-found
├ ƒ /admin
├ ○ /alternatives
├ ● /alternatives/[slug]                                 30m      1y
├ ● /best/tag/[slug]                                     30m      1y
├ ○ /categories
├ ● /categories/[slug]                                   30m      1y
├ ƒ /dashboard
├ ● /launches/[board]                                     5m      1y
├ ○ /pricing
├ ○ /tags
├ ● /tools/[slug]                                         1h      1y
└ ƒ /verify-email

○  (Static)   prerendered as static content
●  (SSG)      prerendered as static HTML (uses generateStaticParams)
ƒ  (Dynamic)  server-rendered on demand
```

### Runtime Verification

Representative local production probes after the Task 4 changes:

| Route | First-hit TTFB | Second-hit TTFB | HTML bytes | Cache header |
| --- | --- | --- | --- | --- |
| `/` | `3.1 ms` | `2.0 ms` | `64,794` | `x-nextjs-cache: HIT` |
| `/launches/daily` | `1.1 ms` | `1.0 ms` | `55,593` | `x-nextjs-cache: HIT` |
| `/categories/marketing` | `4.8 ms` | `1.7 ms` | `140,526` | `x-nextjs-cache: HIT` |
| `/best/tag/ai` | `4.9 ms` | `1.4 ms` | `144,358` | `x-nextjs-cache: HIT` |
| `/alternatives/shipfast` | `4.8 ms` | `2.5 ms` | `76,604` | `x-nextjs-cache: HIT` |
| `/tools/respond-io` | `5.0 ms` | `1.0 ms` | `69,161` | `x-nextjs-cache: HIT` |

Observed cache-control headers:

- `/`: `s-maxage=300, stale-while-revalidate=31535700`
- `/launches/daily`: `s-maxage=300, stale-while-revalidate=31535700`
- `/categories/marketing`: `s-maxage=1800, stale-while-revalidate=31534200`
- `/best/tag/ai`: `s-maxage=1800, stale-while-revalidate=31534200`
- `/alternatives/shipfast`: `s-maxage=1800, stale-while-revalidate=31534200`
- `/tools/respond-io`: `s-maxage=3600, stale-while-revalidate=31532400`

### Notes

- The public routes covered by Task 4 are no longer request-time SSR paths in the production build.
- Relative to the Task 1 baseline, representative public-page TTFB dropped from multi-second request-time renders to low-millisecond static/ISR responses on the local production server.

## Task 5: Tool Detail Payload Trim

- Date: 2026-04-10
- Commands:
  - `npm run build`
  - `npm run start -- --hostname 127.0.0.1 --port 3001`
  - `curl -sS http://127.0.0.1:3001/tools/respond-io | wc -c`
  - `curl -sS -H 'Cookie: fake_session=1' http://127.0.0.1:3001/tools/respond-io | wc -c`
  - `curl -sS http://127.0.0.1:3001/tools/respond-io | rg -n "Similar products|Claim this listing|Signed in as"`
  - `rg -n "getListingClaimState|getSessionFromRequest|getServerSession" src/app/tools/[slug]/page.tsx`
  - `rg -n "publicRelatedToolSelect|listRelatedPublishedTools|select: publicRelatedToolSelect" src/server/services/tool-service.ts`

### Verification results

- `npm run build` succeeded and `/tools/[slug]` remained SSG with `revalidate = 1h`.
- The tool page server render does not import or call `getListingClaimState`, `getSessionFromRequest`, or `getServerSession`.
- Related products remain on the summary query path via `publicRelatedToolSelect` in `src/server/services/tool-service.ts`.
- The screenshot rail and related-products rail now render only after hydration, so they do not inflate initial HTML.
- `/tools/respond-io` HTML bytes improved from the Task 4 runtime verification value of `69,161` bytes to `62,953` bytes on the local production server.
- Anonymous and fake-cookie requests both returned `62,953` bytes, confirming the initial HTML remains viewer-agnostic.
- The initial HTML no longer contains `Similar products`, `Claim this listing`, or `Signed in as`.

## Task 6: Dashboard Summary Query Refactor

- Date: 2026-04-10
- Commands:
  - `npx tsc --noEmit`
  - `npm run build`
  - escalated `node scripts/run-with-env.mjs node --experimental-strip-types --input-type=module` payload probes against the configured Postgres database
- Result:
  - Replaced founder dashboard submission/tool list queries with summary-grade Prisma `select` shapes
  - Kept the checkout reconciliation path conditional in `src/app/dashboard/page.tsx`
  - Trimmed the dashboard page serialization to the exact fields read by `FounderDashboard`

### Serialized dashboard payload comparison

Measured on the same representative founder dataset before and after the refactor:

- Dataset shape: `9` submissions, `8` owned tools, `0` claims
- Measurement method: `Buffer.byteLength(JSON.stringify({ initialSubmissions, initialTools, initialClaims }))`

| Payload section | Before | After | Delta |
| --- | --- | --- | --- |
| `initialSubmissions` | `39,222` bytes | `5,139` bytes | `-34,083` bytes (`-86.9%`) |
| `initialTools` | `3,854` bytes | `2,234` bytes | `-1,620` bytes (`-42.0%`) |
| `initialClaims` | `2` bytes | `2` bytes | `0` |
| Total props passed into `FounderDashboard` | `43,134` bytes | `7,431` bytes | `-35,703` bytes (`-82.8%`, `5.8x` smaller) |

### Verification notes

- `npx tsc --noEmit` passed after the founder summary-query change.
- `npm run build` passed with `/dashboard` remaining dynamic, as intended.
- The steady-state dashboard path no longer loads owner records, full media arrays, category/tag relations, submission history, or vote counts for founder-owned tools.
- Checkout reconciliation remains conditional on `?checkout=success&checkout_id=...`, so the normal dashboard request path stays on the lean summary queries.

## Task 6A: Submission Flow Refactor

- Date: 2026-04-10
- Commands:
  - `npx vitest run src/server/services/submission-draft-update.test.ts src/server/services/submission-draft-service.test.ts src/server/services/submit-relaunch-draft.test.ts`
  - `npx tsc --noEmit`
  - `npm run build`
  - escalated local production probes against `http://localhost:3000`
- Result:
  - Added `/api/submissions/media` so pending logo/screenshot files upload independently from draft persistence
  - Switched the submit form to reuse uploaded Cloudinary asset references and persist drafts over JSON
  - Added a last-saved payload signature on the client so the step-2 happy path skips redundant `saveDraft()` calls when nothing changed
  - Changed `createSubmission()` to return a compact draft summary instead of reloading the full submission record after every save
  - Added `src/server/cache/catalog-options.ts` so `/submit` and `/dashboard/tools/[toolId]` can reuse cached category/tag option lists
  - Added admin category/tag cache invalidation with `revalidateTag(..., "max")`
  - Updated the draft-update transaction to skip rewriting unchanged logo, screenshot, category, and tag rows

### Verification notes

- Focused submission-flow service tests passed after the diff-aware update change.
- `npx tsc --noEmit` passed after the submission-flow refactor.
- `npm run build` passed with the new `/api/submissions/media` route.
- Repeat saves with unchanged media now take the JSON-only `/api/submissions` path by construction; they no longer require multipart parsing or Cloudinary uploads.

### Authenticated flow measurements

Measured on the local production server with a temporary founder account and real session cookies.

Initial refactor measurements before the diff-aware update patch:

| Flow | Result | Time |
| --- | --- | --- |
| Sign in | Success | `2411.8 ms` |
| First save: media upload | Success | `8331.2 ms` |
| First save: JSON draft create | Success | `7037.0 ms` |
| First save: end-to-end | Success | `15368.3 ms` |
| Repeat save: JSON draft update with unchanged media/taxonomy | Success | `13665.3 ms` |
| Free-launch submit after saved draft | Success | `9188.5 ms` |
| Featured-launch draft save | Success | `6829.6 ms` |
| Featured checkout | Initial probe failed | `6968.6 ms` |

Featured checkout failure analysis:

- The initial checkout probe used a synthetic `example.com` founder email, and Polar sandbox rejected it as non-deliverable before creating the checkout.
- After switching the temporary founder to a deliverable test-domain email, the same saved featured draft completed checkout creation successfully:
  - featured checkout retry: `10069.3 ms`
  - status: `200`

Post-patch repeat-save measurement on a fresh production build:

| Flow | Before patch | After patch | Delta |
| --- | --- | --- | --- |
| First save: media upload | `8331.2 ms` | `8425.4 ms` | `+94.2 ms` |
| First save: JSON draft create | `7037.0 ms` | `6982.9 ms` | `-54.1 ms` |
| First save: end-to-end | `15368.3 ms` | `15408.3 ms` | `+40.0 ms` |
| Repeat save: JSON draft update with unchanged media/taxonomy | `13665.3 ms` | `10047.0 ms` | `-3618.3 ms` (`-26.5%`, `1.36x` faster) |

### Notes

- The client-side no-op path for unchanged step-2 submit/checkout transitions is still in place via the payload-signature guard in `SubmitProductForm`.
- The server-side draft update path is now materially leaner, but repeat saves are still slow enough to keep founder edit/resubmit flows in scope for Task 6B.

## Task 6B: Founder And Admin Action Paths

- Date: 2026-04-10
- Commands:
  - `npx vitest run src/server/services/submission-review-service.test.ts src/server/services/submit-relaunch-draft.test.ts src/server/services/listing-claim-service.test.ts`
  - `npx tsc --noEmit`
  - `npm run build`
  - escalated local production probes against `http://localhost:3000` using saved founder cookies and development admin headers
- Result:
  - Founder draft submit and admin submission review no longer wait for founder notification email delivery before returning JSON; the routes now schedule those sends with `after(...)`
  - Added `Server-Timing` and `X-ShipBoost-Route-Time-Ms` headers on the founder save, founder submit, admin submission review, and admin listing-claim review routes
  - Founder tool updates now load the existing record from the compact founder-editor select instead of `toolDetailsInclude`
  - Founder tool updates now skip category/tag validation when the requested taxonomy is unchanged

### Sequential local production timings

Representative probes were rerun sequentially on isolated fixture records to avoid the inflated numbers seen during the earlier parallel probe attempt.

| Flow | Route server time | End-to-end total | Payload bytes | Notes |
| --- | --- | --- | --- | --- |
| Founder save, metadata-only JSON PATCH | `5432.5 ms` | `5459.6 ms` | `716` | After switching `updateFounderTool()` to the compact founder-editor select and skipping no-op taxonomy validation |
| Founder save, metadata-only JSON PATCH | `11066.6 ms` | `11098.3 ms` | `716` | Same probe before the compact founder-save read/validation fix in this session |
| Founder resubmit, verified `FREE_LAUNCH` draft | `4804.5 ms` | `4860.5 ms` | `421` | Apples-to-apples follow-up to the Task 6A free-launch submit measurement |
| Admin approve, pending `LISTING_ONLY` submission | `4767.4 ms` | `4787.4 ms` | `899` | First clean sequential post-change baseline |
| Admin reject, pending `LISTING_ONLY` submission | `3942.5 ms` | `3953.1 ms` | `895` | First clean sequential post-change baseline |
| Claim approve, pending listing claim | `2645.2 ms` | `2661.6 ms` | `656` | First clean sequential post-change baseline |
| Claim reject, pending listing claim | `2652.3 ms` | `2664.1 ms` | `651` | First clean sequential post-change baseline |

### Before/after comparison notes

- Founder metadata-only listing save improved from `11098.3 ms` to `5459.6 ms` end-to-end after removing the heavy pre-update `toolDetailsInclude` read and skipping unchanged taxonomy validation.
  - Delta: `-5638.7 ms` (`-50.8%`, `2.03x` faster)
- Founder free-launch submit improved relative to the Task 6A baseline:
  - before: `9188.5 ms`
  - after: `4860.5 ms`
  - delta: `-4328.0 ms` (`-47.1%`, `1.89x` faster)
- The admin review and claim flows did not have pre-change sequential HTTP baselines recorded earlier in the remediation doc. This session adds route timing headers plus stable post-change numbers so future regressions or follow-up trims can be measured directly.

### Payload notes

- The moderation and claim review responses are already compact after the earlier trimming work:
  - admin approve body: `899` bytes
  - admin reject body: `895` bytes
  - claim approve body: `656` bytes
  - claim reject body: `651` bytes
- Given those response sizes, the remaining cost on admin review/claim routes is dominated by server-side work rather than avoidable JSON transfer.
- Free-launch submit remains slower than draft save because it still reloads full submission detail and waits on transactional email work in the request lifecycle.

## Task 9: Public Query Index Migration

- Date: 2026-04-11
- Commands:
  - `npm run prisma:format`
  - `node scripts/run-with-env.mjs ./node_modules/.bin/prisma migrate dev --name add_public_query_indexes`
  - escalated `EXPLAIN (ANALYZE, BUFFERS)` probes via `node scripts/run-with-env.mjs node --input-type=module`
- Result:
  - Added composite indexes to `prisma/schema.prisma`:
    - `Tool(publicationStatus, moderationStatus, updatedAt)`
    - `Tool(publicationStatus, moderationStatus, createdAt)`
    - `Launch(status, launchDate, priorityWeight)`
    - `ToolCategory(categoryId, sortOrder)`
    - `ToolTag(tagId, sortOrder)`
    - `Submission(userId, createdAt)`
  - Generated and applied migration `prisma/migrations/20260411023131_add_public_query_indexes/migration.sql`

### Before/after `EXPLAIN ANALYZE` summary

Representative query plans on the current Neon dataset:

| Query | Before | After | Observation |
| --- | --- | --- | --- |
| Published tools ordered by `updatedAt` | Seq scan + top-N sort, `0.095 ms` | Seq scan + top-N sort, `0.099 ms` | Current `Tool` table is too small for the planner to prefer the new composite index |
| Published `ai` tag tools ordered by `createdAt` | `ToolTag` seq scan + `Tool` PK lookups, `0.191 ms` | Same shape, `0.261 ms` | Future-facing index only at current scale |
| Monthly launch board | `launchDate` bitmap scan + sort, `0.066 ms` | Seq scan + sort, `0.045 ms` | Planner flips to full-table scan because `Launch` is tiny |
| Category relation ordered by `sortOrder` | `ToolCategory` seq scan + sort, `0.061 ms` | `ToolCategory` seq scan + sort, `0.051 ms` | Index exists for growth; current table is too small |
| Tag relation ordered by `sortOrder` | `ToolTag` seq scan + sort, `0.097 ms` | `ToolTag` seq scan + sort, `0.076 ms` | Index exists for growth; current table is too small |
| Founder submission list ordered by `createdAt` | `Submission` seq scan + sort, `0.742 ms` | `Submission` seq scan + sort, `0.069 ms` | Runtime improved on the warm follow-up probe, but the planner still treats the table as tiny |

### Notes

- The migration is still worth keeping even though the seed-sized dataset does not force index usage yet.
- The current query planner decisions are consistent with the table sizes shown in the plans: tens of rows, not tens of thousands.
- These indexes are aimed at future directory growth and at preventing planner regressions once the public catalog and submission volume increase materially.

## Task 10: Final Public-Route Re-Measurement

- Date: 2026-04-11
- Commands:
  - `npm run build`
  - escalated `npm run start -- --hostname 127.0.0.1 --port 3000`
  - escalated host-side HTTP probes for route TTFB/HTML and asset transfer
- Result:
  - Re-measured the representative public routes from Task 1 on the current production build
  - Broadened `next.config.ts` remote image patterns so valid external tool logos can flow through `next/image`
  - Moved the homepage search modal behind a dedicated client-only wrapper to keep that sidebar widget off the server path

### Public route comparison

Task 1 baseline vs current local production probe:

| Route | Task 1 anonymous TTFB | Current TTFB | Task 1 HTML bytes | Current HTML bytes | Current cache |
| --- | --- | --- | --- | --- | --- |
| `/` | `2951.9 ms` | `1.2 ms` | `65,297` | `66,671` | `HIT` |
| `/launches/daily` | `4249.3 ms` | `1.7 ms` | `52,238` | `58,473` | `HIT` |
| `/categories/marketing` | `7573.4 ms` | `1.4 ms` | `132,586` | `220,460` | `HIT` |
| `/best/tag/ai` | `7573.8 ms` | `1.1 ms` | `135,147` | `226,389` | `HIT` |
| `/alternatives/shipfast` | `7383.5 ms` | `1.3 ms` | `76,310` | `101,137` | `HIT` |
| `/tools/respond-io` | `13395.7 ms` | `0.6 ms` | `68,006` | `65,524` | `HIT` |

### JS transferred on key public pages

Task 1 baseline vs current local production probe:

| Route | Task 1 scripts | Current scripts | Task 1 JS bytes | Current JS bytes | Delta |
| --- | --- | --- | --- | --- | --- |
| `/` | `12` | `13` | `785,197` | `783,257` | `-1,940` bytes (`-0.2%`) |
| `/categories/marketing` | `12` | `13` | `770,344` | `770,995` | `+651` bytes (`+0.1%`) |
| `/tools/respond-io` | n/a | `13` | n/a | `770,250` | First recorded in Task 10 |

### Initial image transfer on key public pages

This is the first explicit image-byte snapshot captured for the Task 7 shell/image work.

| Route | Image count in HTML | Image bytes fetched from rendered `src` URLs | Broken image count |
| --- | --- | --- | --- |
| `/` | `8` | `93,206` | `0` |
| `/categories/marketing` | `27` | `311,569` | `11` |
| `/tools/respond-io` | `3` | `53,864` | `0` |

### Notes

- The main win remains request-time latency: the public routes moved from multi-second SSR responses to low-millisecond cache-hit responses on the local production server.
- JS transfer on the homepage and representative category page is effectively flat relative to Task 1. The shell/image changes did not produce a material bundle reduction on this measurement method.
- HTML bytes increased materially on the category, best-tag, and alternatives pages because more listing markup is now rendered into the prerendered payload instead of being deferred behind client-only shells.
- The remaining `11` broken category-page logos are upstream asset issues, not `next/image` configuration failures. Representative failures observed during the probe:
  - `https://www.waalaxy.com/favicon.ico` -> upstream `404`
  - `https://socialrails.com/favicon.ico` -> upstream `403`
  - `https://manychat.com/favicon.ico` -> upstream `403`
  - `https://www.partnero.com/favicon.ico` -> invalid image response
  - `https://www.promotekit.com/favicon.ico` -> invalid image response
- Logged-in TTFB, DB queries per request, and browser-based LCP are still not captured in this doc.
