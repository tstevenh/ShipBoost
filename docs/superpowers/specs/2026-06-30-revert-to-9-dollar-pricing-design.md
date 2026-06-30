# Revert Premium Launch pricing to the $9 founding structure

**Date:** 2026-06-30
**Status:** Approved (design)
**Repos:** `my-app` (product) and `outreach` (cold email) — sibling working dirs.

## Problem

Premium Launch was raised from a flat **$9 founding price** to a **$19 "Early Access" ladder**.
Real Dodo revenue roughly **halved (~$245 May → ~$125 June)**, and most June sales only
closed at an effective $9 via the `LAUNCH9` discount code. The market is paying $9.

The $9-era wording and scarcity structure is a known-good converter (it drove May), so we
revert to it rather than design a new mechanic.

## Goal

Restore the **flat $9 "founding" price + spots-left scarcity** structure — the exact wording
and structure that was live during May — in both the app and the cold-email pipeline. Also
close the revenue-visibility gap so revenue is queryable from the DB going forward.

## Hard scope constraint

**Pricing hunks only.** Do NOT change anything outside pricing. Preserve every current-version
feature: SEO, performance indexes, badge/free-launch verification, LLM personalization, hybrid
email templates, the `{{shipboost_dr}}` DR variable, and the in-app `LAUNCH9` free→premium
*upsell* (a conversion path, left intact; at $9 list it is simply redundant, not a discount).

This is a **surgical content revert**, NOT `git revert` of commits — later commits layered
non-pricing work onto the same files, so commit-level reverts would lose good changes or drag
back unrelated ones. Pull proven $9 wording from the pre-change commits and re-apply only the
pricing portions on top of the current code.

## Reference commits (source of proven $9 wording)

- `my-app`: ladder introduced in `687b1f9` → `254feac` → `daa29c5`. Flat $9 existed before
  (`5fd79ed`). Pre-ladder state is the wording source.
- `outreach`: clean $9 wording lived at `56411b3^`. `56411b3` switched to $19 Early Access;
  `857fb88` added the `LAUNCH9` code + fake-deadline machinery.

## Part 1 — `my-app`: ladder → flat $9 + founding scarcity

- `src/lib/premium-pricing.ts` — remove (the ladder config/resolver; did not exist pre-$19).
  Verify and clean all importers.
- `src/components/founder/premium-pricing-ladder.tsx` — neutralize the multi-tier stepper;
  restore the simple "$9 founding — N of M spots left" bar (or remove if pre-ladder used inline copy).
- `src/app/submit/page.tsx`, `src/app/dashboard/tools/[toolId]/page.tsx`,
  `src/app/pricing/page.tsx`, `src/components/founder/launch-section.tsx` — switch ladder
  rendering back to flat $9 + founding-slots scarcity. **Pricing hunks only**; leave the
  `LAUNCH9` upsell block and all non-pricing markup untouched.
- `src/server/services/founding-offer-service.ts` — keep `getPaidPremiumLaunchCount` /
  `getRemainingFoundingPremiumLaunchSpots`; ensure they drive the simple slots-left display.
- `src/server/services/dodo-product-service.ts` — current price displays as plain **$9**;
  drop the `$19` compare-at anchor (set to none, matching the pre-ladder card).
- **Manual (operator) step, flagged in the PR/handoff:** set `DODO_PREMIUM_LAUNCH_PRODUCT_ID`
  price to **$9** in the Dodo dashboard. The app reads the live product price, so the real
  charge follows the dashboard.

## Part 2 — `outreach`: cold-email templates → clean $9

- `src/lib/draft/templates.ts`, `follow-up-templates.ts`, `hybrid-templates.ts` — restore the
  `$9 founding, ${SLOTS_LEFT} of ${SLOTS_TOTAL} spots left` price/action blocks from `56411b3^`.
  **Keep** all later non-pricing improvements (DR variable, hybrid LLM templates, structure).
  Remove `{{discount_code}}` / `{{discount_deadline}}` tokens from every template body.
- `src/lib/draft/render.ts` — drop `discount_code` / `discount_deadline` from `RenderVars`
  (now unused; `substitute()` throws on missing vars, so stray tokens must be gone).
- `src/lib/draft/discount.ts`, `src/lib/draft/format-deadline.ts` — delete (only served the
  $9-via-code pitch).
- `src/lib/pipeline/process-launch.ts` (and any follow-up pipeline call site) — stop calling
  `getOutreachDiscount` / populating discount fields.

## Part 3 — Revenue-tracking fix (folded in)

- **Migration (additive, non-breaking):** add nullable `amountCents Int?` and
  `discountCode String?` to `Submission`.
- **Webhook** (`src/app/api/dodo/webhooks/route.ts` → `payment.succeeded` handler in
  `submission-payment-service.ts`): on payment success, call
  `dodo.payments.retrieve(paymentId)` to read the real `total_amount` (+ discount), and persist
  `amountCents` / `discountCode` alongside `paidAt`.
- Historical backfill of the 29 prior launches is **out of scope** (optional one-off script later).
- After this, revenue is queryable directly from the DB — no manual Dodo reconciliation.

## Testing

- `my-app`: unit tests asserting the founding/slots display resolves to **$9 + correct
  spots-left**; update any ladder/$19 test expectations to $9. Webhook test asserting
  `amountCents` / `discountCode` are persisted on `payment.succeeded`.
- `outreach`: template render tests assert price copy is **$9 founding + SLOTS_LEFT/SLOTS_TOTAL**
  and that no template references `discount_code` / `discount_deadline`; `substitute()` no
  longer requires those vars.

## Out of scope (explicitly unchanged)

SEO, indexes, badge/verification, LLM personalization, hybrid template structure, DR variable,
the in-app `LAUNCH9` free→premium upsell feature, and any non-pricing markup or logic.
