# Sponsor Placement Design

## Summary

ShipBoost will add a self-serve sponsor placement product for existing approved tools. A founder can pay $59 for a one-time 30-day placement in the public left sidebar. ShipBoost will show up to three active sponsored tools at a time.

The v1 product is intentionally not a subscription. This keeps the purchase founder-friendly, avoids surprise recurring charges, and reduces billing complexity. Renewal is handled with reminder emails before the placement expires.

## Goals

- Sell three left-sidebar sponsor slots for approved ShipBoost tools.
- Keep checkout simple: one-time $59 payment for 30 days.
- Avoid recurring billing, cancellation, and refund complexity in v1.
- Only allow public, approved ShipBoost tools to be sponsored.
- Give admins a way to disable placements.
- Automatically stop showing expired placements.
- Send renewal reminder emails before expiry.

## Non-Goals

- External product advertising.
- Recurring subscriptions.
- Auction pricing or bidding.
- Category-specific sponsor inventory.
- Public sponsor analytics dashboards.
- Multi-location ad campaigns.

## User Flow

1. Founder opens `/advertise`.
2. If signed out, they are prompted to sign in.
3. Signed-in founder sees eligible tools they own.
4. Founder selects one approved public tool.
5. Founder pays $59 through Dodo checkout.
6. After payment succeeds, ShipBoost creates or activates a 30-day sponsor placement.
7. The sponsored tool appears in one of the three left-sidebar sponsor slots.
8. ShipBoost sends renewal reminders near the end of the 30-day period.
9. When the placement expires, it is no longer shown publicly.

## Eligibility

A tool is eligible when:

- The current user owns the tool through its submission or listing claim relationship.
- The tool is approved and publicly visible.
- The tool is not already in an active paid sponsor placement.

If all three sponsor slots are occupied, `/advertise` should show sold-out messaging instead of starting checkout.

## Pricing

- Product: Sponsor Placement
- Price: $59
- Term: 30 days
- Billing: one-time payment

The Dodo product id should be configured with a new environment variable:

```txt
DODO_SPONSOR_PLACEMENT_PRODUCT_ID
```

## Data Model

Add a `SponsorPlacement` model:

```prisma
model SponsorPlacement {
  id                  String                   @id @default(cuid())
  toolId              String
  tool                Tool                     @relation(fields: [toolId], references: [id], onDelete: Cascade)
  status              SponsorPlacementStatus   @default(PENDING_PAYMENT)
  startsAt            DateTime?
  endsAt              DateTime?
  paidAt              DateTime?
  disabledAt          DateTime?
  checkoutSessionId   String?                  @unique
  paymentId           String?
  renewalReminderSentAt DateTime?
  createdAt           DateTime                 @default(now())
  updatedAt           DateTime                 @updatedAt

  @@index([status, startsAt, endsAt])
  @@index([toolId, status])
}

enum SponsorPlacementStatus {
  PENDING_PAYMENT
  ACTIVE
  EXPIRED
  DISABLED
}
```

The active public query should treat a placement as visible only when:

- `status = ACTIVE`
- `startsAt <= now`
- `endsAt > now`
- `disabledAt = null`
- the related tool is still publicly visible

## Checkout

Add a sponsor checkout endpoint:

```txt
POST /api/dodo/checkout/sponsor-placement
```

Request body:

```json
{
  "toolId": "tool_123"
}
```

Behavior:

- Require an authenticated founder.
- Validate that the selected tool is eligible.
- Validate that fewer than three active placements exist.
- Create a Dodo checkout session using `DODO_SPONSOR_PLACEMENT_PRODUCT_ID`.
- Store `checkoutSessionId` on a `SponsorPlacement` row with `PENDING_PAYMENT`.
- Return the checkout URL.
- Recheck available active inventory when payment succeeds. If three active placements already exist at that moment, leave the placement paid but not public and flag it for admin follow-up. This protects the public three-slot cap if two founders pay at nearly the same time.

The Dodo webhook should route sponsor-placement payment success separately from premium launch payment success by reading checkout metadata.

Sponsor metadata:

```txt
shipboostProduct=sponsor_placement
shipboostToolId=<toolId>
shipboostSponsorPlacementId=<placementId>
```

On successful payment:

- Mark the placement `ACTIVE`.
- Set `paidAt = now`.
- Set `startsAt = now`.
- Set `endsAt = now + 30 days`.
- Revalidate public content caches for sponsor placement.

## Public Sidebar UI

The existing `SponsorSlot()` component in `showcase-layout.tsx` currently returns `null`, and the left sidebar already renders three sponsor slots. Replace this with a data-backed sponsor section.

Desktop left sidebar order:

1. Lead magnet
2. Sponsor placement 1
3. Sponsor placement 2
4. Sponsor placement 3

Right sidebar sponsor slots should be removed for v1.

Each sponsor card should show:

- `Sponsored` label
- Tool logo
- Tool name
- Tool tagline
- Primary category if available
- Link to the ShipBoost tool page

If fewer than three active placements exist, show a subtle empty sponsor card linking to `/advertise`.

## Advertise Page

Create `/advertise` as the buyer page.

Content should be direct and operational:

- “Sponsor a tool on ShipBoost”
- “$59 for 30 days”
- “Three left-sidebar placements available”
- “Available only for approved ShipBoost tools”

Authenticated state:

- Show eligible tools owned by the founder.
- Disable tools that are already actively sponsored.
- Show sold-out state if three active placements are already running.
- Start checkout from selected tool.

Unauthenticated state:

- Explain the offer.
- CTA to sign in.
- Secondary CTA to submit a tool if they do not have one listed yet.

## Admin

Add a simple sponsor placement admin surface. It can live in the existing admin console if that is the local pattern.

Admin should be able to:

- View active, pending, expired, and disabled placements.
- See tool name, owner email, status, startsAt, endsAt, and checkout id.
- Disable a placement.

V1 does not need manual creation, editing dates, or refunds.

## Renewal Emails

Add a cron-backed reminder flow:

- Send one reminder around 7 days before expiry.
- Only send when `status = ACTIVE`.
- Only send when `renewalReminderSentAt = null`.
- Email should link to `/advertise` to buy another 30-day placement.

Expired placements can either be marked `EXPIRED` by a cron job or simply filtered out by `endsAt > now`. A cron job is still useful for admin clarity.

## Caching

Public sponsor placements should use an unstable cache wrapper similar to the existing public content cache.

Use a dedicated cache tag, for example:

```txt
public:sponsor-placements
```

Revalidate this tag when:

- Sponsor payment succeeds.
- Admin disables a placement.
- Expiry cron marks placements expired.

## Testing

Unit tests:

- Eligibility rejects non-owned tools.
- Eligibility rejects non-public tools.
- Checkout rejects when three active placements exist.
- Payment success activates a placement for 30 days.
- Active public query excludes expired and disabled placements.
- Renewal reminder sends only once.

Component tests:

- Sidebar renders active sponsor cards.
- Sidebar renders empty advertise slots when fewer than three are active.
- Advertise page shows sold-out state.

Integration-level checks:

- Existing premium launch checkout still works.
- Dodo webhook routes premium launch and sponsor placement payments separately.

## Decisions

- Renewal reminder timing is 7 days before expiry.
- Sponsor card click should go to the ShipBoost tool page in v1, not directly to the advertiser website. This keeps traffic inside ShipBoost and uses existing outbound tracking from the tool page.
