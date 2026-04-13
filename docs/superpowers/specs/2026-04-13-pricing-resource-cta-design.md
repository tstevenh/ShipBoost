# Pricing And Resource CTA Refresh Design

## Goal

Make three focused product-facing updates:

1. Align launch copy so ShipBoost consistently uses `badge verification` language instead of `backlink verification`.
2. Add a strong page-level founder CTA near the top of `/resources/startup-directories` that sends founders to `/submit`.
3. Add `shipboost.io` to the startup directories resource and visually highlight it as a recommended listing.

## Scope

In scope:

- pricing page copy updates
- founder submission flow copy cleanup where it still says `backlink`
- startup directories resource page CTA block
- startup directories dataset update for ShipBoost
- highlighted rendering treatment for recommended rows

Out of scope:

- changing launch logic or validation rules
- adding per-row submission CTAs
- changing the unlocked resource auth flow
- changing the partner offer or other pricing tiers beyond terminology cleanup

## Recommended Approach

Use one editorial CTA block near the top of the resource page and one highlighted row inside the directories table.

Reasoning:

- the page-level CTA is the clearest conversion point for founders browsing the resource
- including ShipBoost in the resource itself keeps the list honest and self-referential without feeling hidden
- a light `Recommended` treatment gives visibility without making the directory feel like an ad page

## Behavior

### Pricing and founder copy

- On `/pricing`, change `Requires backlink verification` to `Requires badge verification`.
- On `/pricing`, change `No backlink required` to `No badge required`.
- In founder-facing launch copy, replace any remaining `backlink` phrasing with `badge` phrasing where it refers to the verification requirement.
- Premium Launch should continue to communicate that badge verification is skipped or not required.

### Resource page CTA

- Add a page-level CTA block near the top of `/resources/startup-directories`, below the page intro and above the resource content.
- CTA should speak directly to founders who want to submit their product to ShipBoost.
- Primary action links to `/submit`.
- Secondary support copy can explain that founders can choose free or premium launch paths.
- This CTA should appear for both signed-in and signed-out visitors.

### Resource list highlight

- Add `shipboost.io` to the startup directories dataset.
- Mark it as recommended in the data model instead of hard-coding UI logic around the domain name.
- In the rendered table:
  - recommended rows appear before non-recommended rows when sort values tie
  - recommended rows receive a subtle visual treatment such as a badge, tinted background, or stronger label
  - preview mode can include ShipBoost if it falls within the visible rows after sorting/filtering

## Data Shape

Extend the resource item type with an optional boolean field:

```ts
recommended?: boolean
```

ShipBoost entry should include:

- name: `ShipBoost`
- url: `https://shipboost.io`
- domain: `shipboost.io`
- search terms including `shipboost`, `shipboost.io`, and full URL

## Error Handling And Edge Cases

- Search should continue to work exactly as it does today.
- If a query matches only ShipBoost, the table should still render correctly.
- Empty-state messaging should remain intact.
- Preview mode should not break if recommended items are present.

## Testing

Verify:

- pricing page shows `badge verification` language only
- founder submission UI shows no stale `backlink` phrasing
- resource page renders the new CTA and `/submit` link
- `shipboost.io` appears in the resource list
- recommended styling is visible and does not break sorting or search
- existing resource tests still pass, with new assertions added where needed

## Files Expected To Change

- `src/app/pricing/page.tsx`
- `src/components/founder/submit-product-form.tsx`
- `src/app/resources/startup-directories/page.tsx`
- `src/components/resources/startup-directories-resource.tsx`
- `src/content/resources/startup-directories.ts`
- related tests if needed
