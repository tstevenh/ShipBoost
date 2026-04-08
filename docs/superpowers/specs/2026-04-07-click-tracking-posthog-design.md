# Click Tracking With PostHog Design

## Purpose
Implement reliable outbound click tracking for public tool links using a server redirect endpoint and PostHog as the only analytics store.

This slice covers:
- tracked server redirects for outbound tool links
- PostHog event capture for public outbound clicks
- strict validation against saved tool destination URLs
- support across all public surfaces

This slice does not cover:
- local database click counters
- reporting dashboards inside Shipboost
- ranking changes based on clicks
- arbitrary external URL passthrough
- advanced fraud detection or dedupe logic

## Confirmed product decisions
- Click tracking should use PostHog, not a local DB table.
- Tracking should use a server redirect endpoint rather than client-side capture.
- All public surfaces should use the tracked redirect.
- Redirects must be strictly validated against the tool’s saved destination URLs.

## Goals
- Capture outbound engagement reliably even when the browser navigates away immediately.
- Keep analytics data clean by only tracking known, tool-owned destinations.
- Centralize outbound tracking logic in one endpoint rather than duplicating capture logic across the frontend.
- Make the tracked-link system easy to reuse on new public surfaces.

## Non-goals
- Measuring client-side time-on-page before click.
- PostHog dashboard configuration in this slice.
- Sponsor billing or CPC attribution logic.

## Architecture

### 1. Tracking model
Outbound clicks are not stored in Shipboost’s database.

The server redirect endpoint is the system of record for click capture behavior, and PostHog is the only persistence layer for click analytics.

### 2. Redirect endpoint
Add a route that receives:
- `toolId`
- `target`
- `source`

Recommended shape:
- `/api/outbound/tool/[toolId]?target=website&source=tool_page`
- `/api/outbound/tool/[toolId]?target=affiliate&source=launch_board`

The endpoint should:
1. load the tool
2. validate that the tool is publicly visible
3. resolve the destination from the tool record
4. capture the event to PostHog
5. redirect to the destination URL

### 3. Strict destination validation
The endpoint must not accept arbitrary outbound URLs from the client.

Instead:
- `target=website` maps only to `tool.websiteUrl`
- `target=affiliate` maps only to `tool.affiliateUrl`

If the requested target is unavailable or invalid:
- return `404` or `400`
- do not redirect

This prevents analytics poisoning and open-redirect abuse.

### 4. Tool eligibility
Tracked redirects should only work for public tools.

That means the endpoint should reuse the existing public visibility rule rather than checking publication flags manually.

If the tool is hidden, future-dated, or otherwise not public:
- the redirect should fail

### 5. PostHog event shape
Recommended event name:
- `tool_outbound_click`

Recommended properties:
- `tool_id`
- `tool_slug`
- `tool_name`
- `destination_type` with values:
  - `website`
  - `affiliate`
- `destination_url`
- `source_surface`
- `source_path`
- `is_featured`
- `current_launch_type`

Potential future properties:
- `category_slug`
- `launch_board`
- `search_query`

### 6. Identity
For signed-in users:
- use the session user id as PostHog `distinctId`

For signed-out users:
- still capture the event using a lightweight anonymous id strategy

Pragmatic MVP recommendation:
- accept an optional anonymous id from a cookie or query helper later
- if not available, generate a request-local anonymous id to avoid blocking capture

This slice does not attempt full identity stitching.

### 7. Failure behavior
PostHog capture failure must not block the redirect.

If analytics capture fails:
- log the error server-side
- still redirect to the destination

User experience takes priority over analytics completeness here.

## Public surfaces to migrate
- launch board `Visit site`
- tool page `Visit website`
- tool page `Explore affiliate offer`
- public tool cards `Explore offer`
- category pages where tool cards link outbound
- best-tag pages where tool cards link outbound
- alternatives pages where tool cards link outbound

Any public outbound tool destination should go through the tracked redirect.

## Integration boundary

### PostHog client helper
Create a small server-side PostHog helper responsible for:
- singleton client creation
- capture method for `tool_outbound_click`
- best-effort flush/shutdown behavior if needed

Do not scatter raw PostHog client construction across route files.

### Link-building helper
Consider a small helper to build tracked outbound URLs consistently:
- `buildTrackedToolOutboundUrl(toolId, target, source)`

This keeps the public UI from manually constructing query strings in multiple places.

## Error handling
- invalid tool id: `404`
- non-public tool: `404`
- `target=affiliate` with no affiliate URL: `404`
- unsupported target: `400`
- PostHog failure: log and continue redirect

## Testing

### Redirect behavior
- valid website target redirects correctly
- valid affiliate target redirects correctly
- missing affiliate URL rejects correctly
- hidden/future tool rejects correctly

### Analytics behavior
- PostHog capture is called with expected event name and properties
- signed-in user id is passed as `distinctId`
- redirect still succeeds if capture throws

### Surface integration
- launch board links resolve to tracked URLs
- tool page outbound links resolve to tracked URLs
- affiliate links resolve through the redirect instead of direct external URLs

## Implementation notes
- Use PostHog only; do not add a local click-event Prisma model.
- Reuse the existing public visibility helper.
- Keep the endpoint narrowly scoped to tool-owned destinations to avoid creating an open redirect.

## Follow-on work enabled by this design
- click-based ranking or trending logic
- founder-facing click analytics
- sponsor/ad performance reporting
- click-to-signup or click-to-upvote funnel analysis in PostHog
