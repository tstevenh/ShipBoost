# Newsletter Lead Capture Design

## Goal

Capture email leads for Shipboost's "800+ startup directories list" offer using a single opt-in flow, persist them in the app database, sync them into Resend, and immediately send the promised lead magnet email.

## Scope

This slice covers:

- a dedicated `Lead` data model
- a public lead capture endpoint
- DB-first lead persistence with duplicate-safe upsert behavior
- Resend contact sync
- immediate lead magnet delivery email
- backend-first design that can be wired to homepage, pricing, or footer capture points later

This slice does not cover:

- full newsletter campaign management UI
- unsubscribe center UI
- broadcast composition workflows
- analytics dashboards
- multi-step lead scoring or CRM automation

## Product Behavior

The first offer is:

- "Get the 800+ startup directories list"

User flow:

1. User enters their email into a capture form.
2. Shipboost stores the lead immediately using single opt-in.
3. Shipboost syncs or updates the corresponding Resend contact.
4. Shipboost sends the promised directory-list email immediately.
5. The lead is eligible for future newsletter sends.

Consent copy should be explicit anywhere the form is rendered:

> Get the 800+ startup directories list plus occasional startup growth emails. Unsubscribe anytime.

## Architecture

Use Shipboost's database as the source of truth for acquisition and lead state.

Why DB-first:

- keeps capture records under app control
- makes dedupe rules explicit
- avoids coupling business logic to a third-party contact store
- leaves room for future admin exports, segmentation, and conversion attribution

Resend is used for:

- contact sync
- lead magnet delivery email
- future newsletter sending infrastructure

## Data Model

Add a `Lead` model to Prisma with these fields:

- `id`
- `email` - unique, normalized lowercase
- `status` - enum
- `source`
- `leadMagnet`
- `consentedAt`
- `firstSubscribedAt`
- `lastSubmittedAt`
- `resendContactId`
- optional `name`
- optional `utmSource`
- optional `utmMedium`
- optional `utmCampaign`
- optional `utmContent`
- optional `utmTerm`
- `createdAt`
- `updatedAt`

Suggested enum:

```prisma
enum LeadStatus {
  ACTIVE
  UNSUBSCRIBED
}
```

First version keeps status minimal. `BOUNCED` or `SUPPRESSED` can be added later if webhook handling is introduced.

## Lead Rules

### Dedupe

Email is unique.

If the same email is submitted again:

- do not create a second lead
- update `lastSubmittedAt`
- fill any missing source / lead magnet / UTM fields if useful
- keep `firstSubscribedAt` unchanged
- return success, not an error

This keeps repeated submissions idempotent and UX-friendly.

### Canonical values

First launch values:

- `source`: `homepage_directory_list`
- `leadMagnet`: `startup-directories-800`

These should be request-driven values so future forms can reuse the same backend.

## Route Design

Add:

- `POST /api/leads`

Request body:

```json
{
  "email": "founder@example.com",
  "source": "homepage_directory_list",
  "leadMagnet": "startup-directories-800",
  "utmSource": "twitter",
  "utmMedium": "social",
  "utmCampaign": "directory-list"
}
```

Validation:

- valid email required
- `source` required
- `leadMagnet` required
- UTM fields optional

Response behavior:

- `201` when a lead is newly created
- `200` when an existing lead is updated / re-confirmed

Returned payload should be minimal, for example:

```json
{
  "id": "lead_123",
  "email": "founder@example.com",
  "status": "ACTIVE"
}
```

## Service Design

Add a dedicated lead-capture service responsible for:

1. normalizing email
2. upserting the lead
3. syncing the Resend contact
4. sending the lead magnet email

Suggested functions:

- `captureLead(input)`
- `syncLeadToResend(lead)`
- `sendLeadMagnetEmail(lead)`

The route should stay thin and delegate all business logic to the service layer.

## Resend Integration

Use Resend Contacts API to create or update a contact.

Store useful metadata as contact properties where possible:

- `source`
- `lead_magnet`
- `utm_source`
- `utm_medium`
- `utm_campaign`
- `utm_content`
- `utm_term`

For the first pass:

- contact sync can be best-effort
- delivery email uses the existing Resend email infrastructure already present in Shipboost

No full Broadcast or Topic management needs to be built in-app yet.

## Delivery Email

Shipboost should send the promised lead magnet email immediately after capture.

The first delivery email can be simple:

- subject clearly references the 800+ startup directories list
- body explains what the list is
- includes the delivery asset or the link to it
- sets expectations for occasional growth / distribution emails later

If the actual asset is not ready yet, the implementation should support a configurable destination:

- direct hosted file URL, or
- Notion / Airtable / Google Sheet / internal page URL

Recommended env variable:

- `LEAD_MAGNET_STARTUP_DIRECTORIES_URL`

That keeps the system deployable before the final asset hosting choice is locked.

## Failure Behavior

### DB save fails

- request fails
- return error to client

### DB save succeeds but Resend contact sync fails

- keep the DB lead
- log the Resend error server-side
- still return success to the user

### DB save succeeds but lead magnet email fails

- keep the DB lead
- log the send failure server-side
- still return success to the user

This is deliberate. The important thing is to not lose the lead. Delivery retries can be added later if needed.

### Resend not configured

If Resend env vars are missing:

- DB capture should still work
- contact sync is skipped
- delivery email is skipped
- server logs should make this obvious

This allows local development and soft-launch environments to keep capturing leads without blocking on full email setup.

## Public UI Boundary

The backend should be reusable from multiple surfaces:

- homepage hero
- pricing/services page
- footer
- future modal or popup

But implementation should not assume all of those are needed now.

The first integration point can be the homepage once the backend is verified.

## Compliance Notes

This design assumes true inbound opt-in:

- user voluntarily enters their email
- the offer is explicit
- future newsletter emails include unsubscribe

This design is not for scraped or purchased email lists.

## Testing

Add tests for:

- email normalization
- lead create vs update behavior
- duplicate submission idempotency
- UTM / source persistence
- Resend sync skipped when env is missing
- delivery email helper behavior
- route validation and response codes

## Open Decisions Resolved

- Opt-in model: single opt-in
- Source of truth: Shipboost DB
- Email provider: Resend
- Immediate fulfillment: yes, send the lead magnet email right away
- Initial use case: 800+ startup directories list

## Recommended Implementation Order

1. add `Lead` schema + migration
2. add lead validator
3. add lead capture service
4. add Resend contact sync helper
5. add lead magnet delivery email helper
6. add `POST /api/leads`
7. verify backend
8. wire the first public capture form
