# Upvotes Backend Design

## Purpose
Implement a signed-in upvote system for public tools so launch-board entries can accumulate social proof while live, and keep that vote count after the launch window ends.

This slice covers:
- tool-level upvote persistence
- signed-in vote toggle behavior
- daily active upvote cap of 3 per user
- vote eligibility for public tools only
- backend data returned for launch board and public tool pages

This slice does not cover:
- guest voting
- ranking changes based on votes
- notifications
- anti-fraud heuristics beyond auth + per-user constraints
- admin moderation for votes

## Confirmed product decisions
- Votes should matter on live launches, but the count continues after the tool leaves the launch board.
- Users can still upvote from the public tool page.
- Voting requires sign-in.
- Each user can have one active upvote per tool.
- Upvotes are toggleable, so users can remove them later.
- Each user may have at most 3 active same-day upvotes across public tools.
- Removing a same-day upvote refunds that daily slot.
- The daily cap applies to any public tool, not only currently live launch-board tools.

## Goals
- Add a simple vote primitive that fits both launch-board and evergreen tool pages.
- Prevent duplicate votes per user/tool pair.
- Enforce the daily active cap without introducing soft-delete complexity.
- Expose vote count and viewer vote state to public-facing queries.

## Non-goals
- Re-ranking launch boards by upvote count.
- Historical vote analytics dashboards.
- Vote weighting, trust scores, or anonymous voting.

## Architecture

### 1. Vote ownership model
Votes belong to `Tool`, not `Launch`.

This is required because:
- launches are time-bounded
- you want the count to survive after the launch window
- users can continue voting on the public tool page later

The launch board should read the tool’s current vote count instead of owning a separate board-specific vote model.

### 2. Vote model
Add a dedicated `ToolVote` model.

Recommended fields:
- `id`
- `toolId`
- `userId`
- `createdAt`
- `updatedAt`

Recommended constraints:
- unique `(toolId, userId)`
- index by `userId, createdAt`
- index by `toolId`

No soft-delete field is needed in this slice. Toggle/remove should delete the row. This keeps both the active count and the refunded daily-slot behavior simple.

### 3. Public eligibility
A tool is votable only if it is already publicly visible under the existing public visibility rules.

That means the vote service should reuse the same visibility rule already used for public pages. Hidden, future, rejected, or otherwise non-public tools cannot be voted on.

### 4. Daily cap model
The daily limit is based on active upvotes created today by the current user.

That means:
- create vote on tool A today -> counts toward today’s cap
- create vote on tool B today -> counts toward today’s cap
- remove vote on tool A the same day -> one slot becomes available again

This is easiest to implement by:
- deleting rows on toggle-off
- counting rows where `userId = currentUser` and `createdAt >= startOfDay(now)`

No historical action ledger is required for MVP.

### 5. Toggle behavior
Upvote API behavior should be toggle-based:
- if no vote exists for `(toolId, userId)`, create one
- if a vote exists, delete it

On create:
- validate the tool is public
- enforce daily active cap of 3

On delete:
- remove the vote row
- return the updated count and remaining daily slots

### 6. Returned state
The service and route should return enough state for frontend use:
- `hasUpvoted`
- `upvoteCount`
- `dailyVotesRemaining`

This keeps the UI simple without requiring multiple follow-up requests.

## Route and API shape

### Vote toggle endpoint
Add a signed-in endpoint:
- `POST /api/tools/[toolId]/vote`

Behavior:
- require session
- load tool and confirm public eligibility
- toggle vote
- return the updated state

No separate delete route is needed.

## Data loading boundaries

### Vote service
Add a dedicated upvote service responsible for:
- checking tool eligibility
- enforcing uniqueness
- enforcing the daily cap
- computing count and viewer state
- performing the toggle

### Tool and launch queries
Extend public tool and launch-board queries to include:
- total upvote count
- current viewer vote state when a session is available

These queries should consume the vote service or shared Prisma helpers, but the vote rules themselves should remain in a focused service.

## Error handling
- signed-out user: `401`
- tool not found: `404`
- non-public tool: `404` or `403` depending on query boundary; prefer not to leak hidden tools
- daily cap exceeded: `409`
- duplicate create race: handled by unique constraint and retried/normalized into success state

## Testing

### Vote creation
- creates a vote for a public tool
- returns correct count and `hasUpvoted`

### Toggle remove
- removes existing vote
- refunds same-day slot

### Daily cap
- allows up to 3 active same-day votes
- blocks the 4th
- allows another vote after one same-day vote is removed

### Eligibility
- future or hidden tools cannot be voted on
- already public tools can be voted on from either launch board or tool page contexts

### Query shape
- launch board returns vote count
- public tool page returns vote count and viewer-voted state when session exists

## Implementation notes
- Keep ranking unchanged in this slice. Votes should be displayed first, not used for ordering yet.
- Prefer deleting votes over soft-deleting to make the daily cap refund rule trivial.
- Reuse the current public tool visibility logic rather than duplicating publication checks.

## Follow-on work enabled by this design
- sort launch boards by votes
- “trending” or “most loved” surfaces
- founder analytics on vote growth
- rate limiting / abuse heuristics beyond signed-in users
