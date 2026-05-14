# Daily Streaks, Rewards & Lottery — Design

**Status:** Draft for review
**Date:** 2026-05-13
**Author:** brainstormed with @timhart

## Goal

Drive daily repeat visits by rewarding users for cumulative active days on the platform. Inspired by Uneed (cumulative streaks, vote multipliers, milestone discounts) and FoundrList (sidebar surfacing). Designed to be **lightweight** — reuse existing signals (`ToolVote`, outbound clicks, tool page views), one new Prisma model for streak state, one for lottery rewards, and a thin service layer.

## Non-goals

- Strict-consecutive streaks (we use cumulative days, like Uneed)
- Comment-based activity (no comment system exists)
- Email notifications for rewards (in-app only)
- Platform-wide timezone change (UTC day boundary, same as launches)
- Relaunch as a reward target (no founder UI yet)

## Activity definition

A "streak day" is any **UTC calendar day** on which a signed-in user does at least one of:

1. Cast an upvote (`ToolVote` row inserted)
2. Click out to a tool's external URL (existing `outbound-click-service` log)
3. View a tool detail page (`/tools/[slug]`) — new lightweight server-side log

The first qualifying activity of a UTC day flips the user's `UserStreakDay` row for that date. Subsequent activities the same day are no-ops for streak purposes.

## Counting model

- **Cumulative**: streak = count of distinct days the user has ever had a qualifying activity. Never resets.
- **Wording**: shown as "N day streak" (Uneed convention) even though it's not strictly consecutive.
- **Day boundary**: UTC 00:00, same as `startOfUtcDay` in `src/server/services/time.ts`.
- **No restores, no resets** — simpler than FoundrList's restore system.

## Reward ladder

Awarded on first crossing each milestone. One-shot per milestone (cannot be re-earned).

| Day | Reward | Type |
|---|---|---|
| 3 | Profile streak badge | Cosmetic |
| 5 | Upvotes count 2× | Power-up |
| 10 | 10% off Premium Launch | Discount code |
| 25 | 25% off Premium Launch + unlocks Daily Lottery | Discount code + feature unlock |
| 50 | Upvotes count 3× + avatar border | Power-up + cosmetic |
| 100 | Upvotes count 5× + 50% off Premium Launch | Power-up + discount |
| 250 | 50% off Sponsor Placement | Discount |
| 365 | Free Premium Launch slot (100% off, manual fulfillment review) | Discount |

Multipliers do not stack — the highest active tier applies (e.g., a 100-day user gets 5×, not 2×+3×+5×). Cap is on tools voted per day (3, unchanged), not on vote weight.

## Discount code mechanics

- Generated via Dodo Payments `POST /discounts` at the moment a milestone is crossed.
- `usage_limit: 1` (single-use; expires on first redemption).
- No date expiry — codes valid until redeemed.
- Code stored on `StreakReward` row with `code`, `percentOff`, `productScope` (enum: `PREMIUM_LAUNCH`, `SPONSOR_PLACEMENT`), `unlockedAt`, `redeemedAt`.
- Surfaced in `/dashboard/rewards` (copyable). Marked redeemed via Dodo webhook on purchase.
- Stacking: a user can hold multiple active codes simultaneously; checkout applies whichever they paste.

## Daily lottery

Unlocks at streak day 25. Each subsequent qualifying day, the user gets exactly one roll.

### Odds (per roll)

| Outcome | Probability |
|---|---|
| Nothing | 70.0% |
| 5% off Premium Launch | 20.0% |
| 10% off Premium Launch | 6.0% |
| 25% off Premium Launch | 2.5% |
| 50% off Premium Launch | 1.0% |
| Free Premium Launch (100%) | 0.5% |

### Jackpot cap

Global cap: at most **1 jackpot (100% off) awarded per ISO week** across the entire platform. If a user rolls a jackpot but the weekly cap is already hit, silently downgrade to the 50% prize. Tracked via a `count()` query on `LotteryRoll where outcome = OFF_100 and rollDate within current ISO week` — no new table.

### Roll flow

1. User does first qualifying activity of the day → server checks `streak >= 25` and no roll yet today.
2. If both true, server pre-rolls the outcome and stores `LotteryRoll { userId, rollDate, outcome, codeId? }`.
3. Frontend opens lottery modal automatically on next page render (one-time per day).
4. Modal shows roll animation, then reveal: lose copy or "Congrats! You won X" with copyable code.
5. If user dismisses modal before rolling animation completes, the outcome is still recorded — sidebar shows "Played ✓" and "View My Rewards" links to the result.
6. Sidebar "Try Your Luck!" button is the manual entry: opens the same modal (re-displays today's outcome).

### Anti-abuse

- Roll is keyed by `(userId, rollDate)` — DB unique constraint prevents double rolls.
- Outcome is computed server-side; client cannot influence.

## Leaderboard

- Public page at `/streaks` (no auth required, good for SEO).
- Top 50 users sorted by streak day count desc. Ties broken by `User.createdAt` asc (older user wins).
- Self-rank pinned at bottom if signed-in user is outside top 50.
- **Opt-in by default** (matching competitor norms). One-click hide on profile → `User.hideFromLeaderboard: bool`.
- Cached for 5 minutes (top-50 doesn't change often; reuse `src/server/cache/` helpers).

## UI surfaces

### Left sidebar widget (persistent on `/`, `/launches/*`, `/feed`)

Two cards stacked:

**Streak card:**
- Header: "N DAY STREAK" + info tooltip
- Last 5 UTC days as flame icons (filled if active, dim if not)
- "Next reward: <copy> at <N> days" with progress bar
- "Check the leaderboard →" link to `/streaks`

**Daily Lottery card:**
- Locked state (streak < 25): "Unlocks at 25-day streak" with lock icon
- Available state (rolled today not yet): "Today's Draw: Available" + `Try Your Luck! 🎰` button
- Played state: "Today's Draw: Played ✓" + "You've played today!"
- Footer: "View My Rewards →" link to `/dashboard/rewards`

### Lottery modal

- Triggered automatically on first qualifying activity of the day for 25+ users, OR by clicking the sidebar button.
- Roll animation (~1.5s), then reveal:
  - **Lose:** red X icon, "You lost — Sorry, you didn't win anything today. Come back tomorrow 🐱"
  - **Win:** green check, "Congrats! You won **<reward>** 🎉", code with copy button, "View My Rewards →"

### `/dashboard/rewards` page

- Active codes (copyable, with product scope label)
- Redeemed codes (grayed)
- Past lottery losses count (small, for trivia)

### `/streaks` page

- Hero: site-wide stats (total users with active streak, longest streak)
- Top 50 list (rank, avatar, username, "is on a N day streak")
- Reward ladder reference table
- Lottery odds table (transparency)
- Self-position pinned for signed-in users outside top 50

### Profile pages

- Streak count + badge (day 3+)
- Avatar border (day 50+)
- Public unless user opted out

## Data model

### New Prisma models

```prisma
model UserStreakDay {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  day       DateTime // startOfUtcDay
  createdAt DateTime @default(now())

  @@unique([userId, day])
  @@index([userId])
}

model StreakReward {
  id            String              @id @default(cuid())
  userId        String
  user          User                @relation(fields: [userId], references: [id], onDelete: Cascade)
  source        StreakRewardSource  // MILESTONE or LOTTERY
  milestoneDay  Int?                // null for lottery
  productScope  StreakProductScope  // PREMIUM_LAUNCH or SPONSOR_PLACEMENT
  percentOff    Int                 // 5, 10, 25, 50, 100
  code          String              @unique
  dodoDiscountId String?
  unlockedAt    DateTime            @default(now())
  redeemedAt    DateTime?

  @@index([userId])
}

model LotteryRoll {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  rollDate  DateTime // startOfUtcDay
  outcome   String   // LOSE, OFF_5, OFF_10, OFF_25, OFF_50, OFF_100
  rewardId  String?  // FK into StreakReward when outcome != LOSE
  createdAt DateTime @default(now())

  @@unique([userId, rollDate])
}

enum StreakRewardSource {
  MILESTONE
  LOTTERY
}

enum StreakProductScope {
  PREMIUM_LAUNCH
  SPONSOR_PLACEMENT
}
```

### User additions

```prisma
model User {
  // ... existing fields
  hideFromLeaderboard Boolean @default(false)
  streakDays          UserStreakDay[]
  streakRewards       StreakReward[]
  lotteryRolls        LotteryRoll[]
}
```

### Derived state (not stored)

- **Current streak day count** = `count(UserStreakDay where userId = X)`
- **Active vote multiplier** = derived from current count via milestone table
- **Today's lottery state** = lookup `LotteryRoll where userId = X and rollDate = today`

We do **not** store a denormalized `streakCount` column; computed via cached count. Cache invalidates on `UserStreakDay` insert.

## Service layer

New file: `src/server/services/streak-service.ts`

Exported functions:

- `recordStreakActivity(userId, source)` — idempotent; upserts `UserStreakDay` for today; returns `{ newMilestone?: number, lotteryAvailable: bool }`
- `getStreakSnapshot(userId)` — `{ count, lastActiveDay, nextMilestone, activeMultiplier, lotteryUnlocked, todayRoll? }`
- `rollLottery(userId)` — server-side roll; respects weekly jackpot cap; returns outcome + reward (if any)
- `getActiveRewards(userId)` — list `StreakReward` rows
- `getLeaderboard(limit = 50)` — cached top N
- `getVoteMultiplier(userId)` — used by upvote-service to weight votes

Integration points (minimal):

- `upvote-service.ts` → on vote, call `recordStreakActivity(userId, "VOTE")` and apply multiplier to vote weight
- `outbound-click-service.ts` → on click (when signed in), call `recordStreakActivity(userId, "OUTBOUND")`
- New tiny middleware on `/tools/[slug]` page → call `recordStreakActivity(userId, "PAGEVIEW")` once per request, fire-and-forget
- Dodo webhook handler → on `subscription.created` / `order.paid`, mark matching `StreakReward.redeemedAt`

## Upvote weight question (open)

Vote multipliers affect the launch leaderboard ranking. We need to decide how to apply the weight:

- **Option 1:** `ToolVote.weight Int @default(1)` column; sum weights for ranking
- **Option 2:** Insert N rows on vote (e.g., 5 rows for 5× multiplier) — simpler ranking SQL, but pollutes the table

Recommendation: **Option 1**. One schema change; ranking query becomes `SUM(weight)` instead of `COUNT()`. Backfill existing rows to `weight=1`.

## Testing approach

- Service tests next to `streak-service.ts` covering: milestone crossing, idempotent activity recording, lottery cap enforcement, multiplier resolution
- Integration test: upvote flow records streak day and applies multiplier
- Component test: sidebar widget states (no streak, active, lottery locked, lottery available, lottery played)
- Lottery roll outcome distribution: statistical test on 100k iterations within ±1% of declared odds

## Rollout

1. Ship DB migration + service layer (no UI)
2. Backfill: for each user, generate `UserStreakDay` rows from existing `ToolVote.createdAt` distinct days (free historical streak credit, good first-impression on launch day)
3. Ship sidebar widget + `/streaks` + `/dashboard/rewards` together
4. Announce via in-app banner

## Open items for plan phase

- Exact copy for modal states and locked sidebar
- Avatar border visual design (frontend-design pass)
- Whether to show lottery odds publicly (recommended yes — transparency)
- Dodo Discounts API exact request/response shape (verify against current SDK version)

## Out of scope (deferred)

- Platform timezone shift to UTC+7 (Jakarta 2pm) — separate spec if pursued
- Streak restores / freeze passes
- Comment-based activity (no comments)
- Push notifications / email reminders
- Relaunch as a reward (no founder UI)
