# ShipBoost Positioning Refresh and OG Image Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve ShipBoost's public positioning so the site explains the product as a clear launch-and-distribution system for bootstrapped SaaS founders, not a vague premium directory, while rolling out a single site-wide OG image for all non-article pages.

**Architecture:** Keep the existing product thesis, but shift the site from abstract brand language to mechanism-led messaging. Centralize the default OG image in the shared metadata helper so all public pages inherit `/ShipBoost-OGImage.png` automatically unless they explicitly provide a page-specific image. Preserve article-specific OG behavior by keeping blog article metadata tied to each article's hero image.

**Tech Stack:** Next.js App Router, React, TypeScript, existing metadata helpers, JSON-LD schema helpers, existing marketing page components, public static asset at `public/ShipBoost-OGImage.png`

---

## Recommendation

**Do not do a full positioning pivot.**

The current strategic direction is already correct:
- weekly launches are a better wedge than noisy daily feeds
- trust-first listings are a real differentiator
- long-tail discovery is the right end-state promise

The main problem is not the thesis. The main problem is that the site explains the product too abstractly and too softly. Right now visitors have to infer the mechanism. That makes ShipBoost feel more conceptual than it actually is.

**Recommended adjustment:**
- keep the current core positioning
- make the mechanism explicit everywhere
- add visible proof of the ecosystem
- tighten CTA hierarchy so each page pushes the next logical action
- harden the contrast language so visitors immediately understand why ShipBoost is not “just another directory”

Working positioning direction:
- **Core promise:** Launch once. Keep getting discovered.
- **Expanded promise:** ShipBoost helps bootstrapped SaaS founders turn a launch into long-tail distribution.
- **Mechanism:** weekly launch boards + founder-ready public listings + categories/tags/alternatives discovery
- **Core contrast line:** Most launch sites give you a spike. Most directories give you a dead listing. ShipBoost is built to do both jobs better: launch visibility now, and discoverability after the launch window ends.

---

## Planning Notes

- This updated plan is based on:
  - `ShipBoost-Docs/launching-marketing-plan.md`
  - the revised `ShipBoost-Docs/Improve-plan.md`
  - the current application codebase
  - the new OG image requirement
- The article OG image requirement is already directionally supported in `src/app/blog/[slug]/page.tsx`, which uses `article.ogImageUrl ?? article.coverImageUrl`. That behavior should stay intact.
- The site-wide OG image rollout should be implemented centrally, not page-by-page.
- The revised `Improve-plan.md` reinforces the same core thesis as the earlier strategy doc, but pushes the copy direction harder:
  - stronger anti-generic contrast language
  - more direct mechanism-first headlines
  - more explicit founder outcome framing
  - a stronger startup-directories acquisition wedge
- The revised resource recommendations include status badges and notes, but the current app dataset does **not** yet expose those fields. The live resource data in `src/content/resources/startup-directories.ts` currently only includes:
  - `name`
  - `url`
  - `domain`
  - `dr`
  - `searchText`
- Because of that, the plan separates:
  - messaging and UX improvements that can ship immediately
  - optional resource-data enrichment if the richer CSV/source data is brought into the app

---

## File Structure

### Modify
- `src/server/seo/page-metadata.ts`
  - add a default ShipBoost OG image for public pages that do not specify one
- `src/server/seo/page-metadata.test.ts`
  - add metadata coverage for default image fallback and explicit image override
- `src/app/layout.tsx`
  - align root metadata with the same default OG image and Twitter image
- `src/app/page.tsx`
  - homepage messaging, mechanism strip, comparison block, proof block, CTA hierarchy
- `src/components/ui/hero-minimalism.tsx`
  - homepage hero headline, subhead, and supporting microcopy
- `src/app/resources/startup-directories/page.tsx`
  - headline, subhead, clearer resource value framing, stronger product bridge
- `src/components/resources/resource-unlock-panel.tsx`
  - unlock copy focused on workflow value, not vague exclusivity
- `src/app/pricing/page.tsx`
  - decision-oriented intro, sharper free vs premium framing, partner offer demotion
- `src/app/how-it-works/page.tsx`
  - add “why this model works,” founder outcomes, and path selection guidance
- `src/app/submit/page.tsx`
  - stronger pre-auth value framing and reduced-friction messaging
- `src/app/about/page.tsx`
  - add a concise practical summary near the top before the longer founder story
- `src/app/faqs/page.tsx`
  - add skepticism-handling questions and stronger value clarification
- `src/app/launch-guide/page.tsx`
  - expand tactical “launch into distribution” guidance and internal linking
- `src/components/marketing/content-page-shell.tsx`
  - only if needed to better support revised CTA hierarchy or page-intro formatting

### Verify, no functional changes expected
- `src/app/blog/[slug]/page.tsx`
  - confirm article hero/cover OG image behavior remains unchanged
- `public/ShipBoost-OGImage.png`
  - use this as the default site OG asset outside article pages

### Non-goals for this pass
- no full information architecture redesign
- no new proof claims that require analytics evidence you do not have yet
- no article OG override away from article hero images
- no new visual system rewrite unless messaging changes expose an obvious layout problem

---

## Messaging Guardrails

All page copy changes in this plan should follow these rules:

- Lead with the result founders want: ongoing discovery after launch
- Explain the mechanism in plain language within the first screen
- Avoid generic words unless paired with proof or structure
  - examples to avoid alone: trust, momentum, visibility, distribution
- Prefer practical contrasts over philosophy
  - weekly boards vs daily spikes
  - curated listing vs bloated directory storage
- Use contrast lines that sound specific, not polished-for-its-own-sake
  - good example: `Most launch sites give you a spike. Most directories give you a dead listing.`
- Do not overclaim private startup-directory intelligence on the public resource page
- Keep “Premium Launch” language consistent across the site

---

## Task 1: Centralize the Site-Wide OG Image

**Files:**
- `src/server/seo/page-metadata.ts`
- `src/server/seo/page-metadata.test.ts`
- `src/app/layout.tsx`
- verify `src/app/blog/[slug]/page.tsx`

- [ ] Add a shared default OG image constant for public pages.
  - target asset: `/ShipBoost-OGImage.png`
  - use an absolute URL derived from `NEXT_PUBLIC_APP_URL`
  - include a stable alt value such as `ShipBoost`

- [ ] Update `buildPublicPageMetadata` so every non-article page that omits `imageUrl` receives the default site image automatically.

- [ ] Preserve explicit image override behavior.
  - if `imageUrl` is passed, use it
  - do not force the default image over article pages or future custom landing pages

- [ ] Align root `metadata` in `src/app/layout.tsx` to use the same default image for:
  - `openGraph.images`
  - `twitter.images`

- [ ] Confirm article routes still use hero images.
  - keep `src/app/blog/[slug]/page.tsx` behavior intact
  - article pages should continue to use `article.ogImageUrl ?? article.coverImageUrl`

- [ ] Add tests in `page-metadata.test.ts` for:
  - default image is used when `imageUrl` is absent
  - explicit `imageUrl` overrides the default
  - canonical behavior still works unchanged

**Implementation note:**
Use the metadata helper as the single source of truth. The layout metadata should reference the same default image builder or constant, not duplicate a second hardcoded path.

**Verification:**
- `npm run test -- src/server/seo/page-metadata.test.ts`
- `npm run build`

---

## Task 2: Refresh the Homepage Positioning

**Files:**
- `src/app/page.tsx`
- `src/components/ui/hero-minimalism.tsx`

- [ ] Rewrite the hero so the promise is concrete in one glance.

Recommended direction:
- kicker: `Founder-first launch distribution`
- headline: `Launch once. Keep getting discovered.`
- subhead: `ShipBoost helps bootstrapped SaaS founders turn a launch into ongoing distribution with weekly launch boards, founder-ready listings, and long-tail discovery pages.`

Alternative approved headline:
- `Turn your SaaS launch into long-tail distribution.`

- [ ] Add a 3-step mechanism strip directly under the hero.

Recommended structure:
1. `Launch into a weekly board`
2. `Get a founder-ready public listing`
3. `Stay discoverable after launch day`

Each step should include one short outcome sentence.

- [ ] Add a comparison section that explains why ShipBoost exists.

Recommended columns:
- `Daily launch feeds`
- `Generic directories`
- `ShipBoost`

Focus on:
- spike vs durability
- clutter vs clarity
- storage vs discovery

Recommended contrast line to include somewhere in this section:
- `Most launch sites give you a spike. Most directories give you a dead listing. ShipBoost is built to do both jobs better: launch visibility now, and discoverability after the launch window ends.`

- [ ] Rewrite the current discovery section into founder outcomes.

Recommended section title:
- `What founders get after launch`

Recommended bullets:
- weekly board visibility
- permanent public listing
- category and tag discovery
- alternatives-page visibility
- founder dashboard control

- [ ] Add visible proof blocks or screenshot slots.

Priority proof surfaces:
- weekly board
- listing page
- alternatives page
- startup directories resource
- dashboard

If no screenshot component exists yet, first ship this as a simple grid of existing screenshots with short captions.

- [ ] Tighten CTA order.

Recommended order:
- primary: `Submit your product`
- secondary: `See launch pricing`
- tertiary: `Browse the startup directories resource`

**Implementation note:**
Do not overcomplicate the homepage with too many new sections in one pass. The minimum effective version is:
- clearer hero
- mechanism strip
- comparison block
- outcome block
- proof block
- cleaner CTA block

**Verification:**
- homepage renders without layout regressions on desktop and mobile
- metadata still resolves through `buildPublicPageMetadata`
- `npm run build`

---

## Task 3: Reframe the Startup Directories Resource as the Acquisition Wedge

**Files:**
- `src/app/resources/startup-directories/page.tsx`
- `src/components/resources/resource-unlock-panel.tsx`

- [ ] Rewrite the page headline and subhead to match the actual public resource.

Recommended direction:
- headline: `300+ startup directories and launch sites in one clean, searchable list`
- subhead: `ShipBoost’s startup directories resource helps founders skip scattered bookmarks and find launch opportunities faster with a searchable list sorted by DR, name, and site.`

- [ ] Add a “What this resource helps you do” section.

Recommended bullets:
- build a shortlist faster
- prioritize higher-DR sites first
- keep launch research in one place
- discover directories you would have missed manually

- [ ] Add a compact “What’s included” section.

Include only what is truly public:
- site name
- site URL
- DR
- searchable hosted access

- [ ] Add a “What founders use this for” section.

Recommended bullets:
- planning a launch shortlist
- prioritizing higher-DR opportunities first
- reducing blind submissions
- keeping distribution research in one place

- [ ] Rewrite the founder bridge section so the resource does not become a dead end.

Recommended framing:
- `Want more than a list?`
- explain that ShipBoost turns research into actual launch distribution via weekly boards, listings, and discovery pages

- [ ] Rewrite the unlock panel around workflow value.

Recommended unlock headline:
- `Unlock the full searchable list of 300+ startup directories`

Recommended supporting copy:
- emphasize search, sort, hosted access, and less spreadsheet juggling
- do not imply private operational intelligence is included

- [ ] Review button labels and CTA destinations.
  - keep `/submit` as the main product CTA
  - consider changing “Get done-for-you distribution” to a clearer secondary label if it still distracts

**Implementation note:**
This page should sell speed and convenience, not mystery. The more honest it is, the stronger it becomes as a wedge.

**Current data constraint:**
The current in-app resource dataset does **not** include `submitted`, `badgeRequired`, `easyUpload`, or `notes`. Do not scope those badges into the first implementation pass unless the richer source data is imported into the app first.

**Optional enhancement if richer source data is available:**
- extend `StartupDirectoryResourceItem` with lightweight editorial fields such as:
  - `submitted?: boolean`
  - `badgeRequired?: boolean`
  - `easyUpload?: boolean`
  - `notes?: string`
- surface them as chips or concise notes in the resource UI
- keep this additive and non-blocking; do not wait for full taxonomy or pricing enrichment

This optional enhancement is high leverage, but it is a separate data-shape change, not just copy work.

**Verification:**
- public preview still works
- signed-in unlock flow copy still makes sense
- `npm run build`

---

## Task 4: Make Pricing Feel Like a Real Decision, Not a Queue Jump

**Files:**
- `src/app/pricing/page.tsx`

- [ ] Rewrite the page intro to be decision-oriented.

Recommended direction:
- help founders self-segment between Free Launch and Premium Launch
- frame Premium as lower-friction and higher-intent, not just “pay to skip the line”

- [ ] Reframe Free Launch around outcomes.

Recommended emphasis:
- founder-ready listing
- weekly launch visibility
- public profile after approval
- badge verification as trust/quality control

- [ ] Reframe Premium Launch around meaningful value.

Recommended emphasis:
- reserve a launch week
- skip badge verification
- stronger baseline board placement
- less submission friction
- permanent public listing after launch

- [ ] Keep the crossed-out price behavior simple.
  - keep the compare-at price static in UI if needed
  - continue pulling the live Dodo product price for the actual current price
  - do not move pricing logic into the client

- [ ] Rewrite “Why ShipBoost” into four concrete product pillars.

Recommended pillars:
- weekly launch visibility
- cleaner public listings
- post-launch discoverability
- founder workflow in one place

- [ ] Make the partner offer clearly secondary.
  - label it as a partner offer
  - visually keep it subordinate to ShipBoost’s own launch products

**Implementation note:**
The pricing page should answer “which path fits me?” within a few seconds. It should not rely on founders already understanding the product model.

**Verification:**
- live Dodo price rendering still works
- founding-spots countdown still renders
- no client-side regression in pricing hydration
- `npm run build`

---

## Task 5: Improve the Explanation Layer on How It Works and Submit

**Files:**
- `src/app/how-it-works/page.tsx`
- `src/app/submit/page.tsx`

### How It Works

- [ ] Add a section explaining why ShipBoost’s model exists.

Recommended framing:
- daily launch resets bury products too fast
- bloated directories create storage, not discovery
- ShipBoost combines visibility and durable public discovery

- [ ] Add a section for “What founders get after launch.”

Recommended outcomes:
- public listing
- weekly board visibility
- category/tag discovery
- alternatives visibility
- dashboard control

- [ ] Add a “Which path should you choose?” section.

Recommended guidance:
- choose Free Launch if flexibility is fine and badge verification is acceptable
- choose Premium Launch if timing matters and lower friction matters

- [ ] Make ranking logic feel fair and intentional.
  - top 3 still vote-earned
  - premium receives stronger baseline after the leaderboard
  - explain that this is a balance between merit and paid support

### Submit

- [ ] Add a value block before the account/signup wall.

Recommended bullets:
- weekly launch board placement
- founder-ready public listing
- ongoing discovery paths
- dashboard control

- [ ] Make draft-first messaging visible before login and near the form entry point.

Recommended line:
- `Save your draft anytime and come back later. You do not need to finish everything in one session.`

- [ ] Explain badge verification clearly.

Recommended rationale:
- free launch badge verification protects quality and filters low-intent submissions

- [ ] Add lower-friction microcopy.

Recommended examples:
- you can update your listing later
- one category is enough to get started
- a clean logo and a few screenshots go a long way
- Premium Launch skips badge verification

**Implementation note:**
Do not turn the submit page into a long sales page. It should reduce anxiety and justify effort, not bury the form.

**Verification:**
- unauthenticated submit route remains clear and fast
- authenticated form path still loads with the same data dependencies
- `npm run build`

---

## Task 6: Support the Core Positioning with Authority Pages

**Files:**
- `src/app/about/page.tsx`
- `src/app/faqs/page.tsx`
- `src/app/launch-guide/page.tsx`
- optionally `src/components/marketing/content-page-shell.tsx`

### About

- [ ] Add a concise practical summary block near the top.

Purpose:
- explain in plain language what ShipBoost is
- explain who it is for
- explain how it differs from daily feeds and generic directories

This should come before the longer founder story so first-time visitors do not have to read several paragraphs to orient themselves.

### FAQs

- [ ] Add more skepticism-handling questions.

Recommended additions:
- `Why not just launch on Product Hunt or a generic directory?`
- `What happens after my launch week ends?`
- `Why does Free Launch require a badge?`
- `Is Premium Launch still merit-based if votes decide the top 3?`
- `Do I keep my public listing after launch?`

### Launch Guide

- [ ] Expand the guide from “launch advice” into “launch into distribution” guidance.

Recommended additions:
- preparing trust signals before launch
- choosing the right launch surface
- what to do after launch week
- how founder listings, categories, and alternatives compound over time

- [ ] Add stronger internal links to:
  - `/pricing`
  - `/how-it-works`
  - `/resources/startup-directories`
  - `/submit`

**Implementation note:**
These pages should support the main positioning, not drift into generic startup content.

**Verification:**
- page intros remain concise and readable
- internal links are valid
- `npm run build`

---

## Task 7: Final Positioning Sweep and QA

**Files to review across the site:**
- homepage
- pricing
- how it works
- submit
- resource page
- about
- FAQs
- launch guide
- layout metadata
- page metadata helper

- [ ] Sweep for outdated abstract phrasing that no longer matches the new structure.

High-risk phrases to review:
- “trust, visibility, momentum” without explanation
- “curated distribution” without mechanism
- any lingering “featured launch” wording

- [ ] Confirm the OG image behavior across page types.

Expected result:
- default site pages use `ShipBoost-OGImage.png`
- article pages use their article hero image
- explicit page-specific metadata still wins over the default

- [ ] Confirm there is no public copy that implies the resource includes private ops intelligence.

- [ ] Run the core verification commands.

Recommended commands:
- `npm run test -- src/server/seo/page-metadata.test.ts`
- `npx tsc --noEmit`
- `npm run build`

---

## Recommended Rollout Order

### Phase 1: Highest-leverage clarity pass
- Task 1: site-wide OG image
- Task 2: homepage
- Task 3: startup directories resource
- Task 4: pricing
- Task 5: how it works and submit

### Phase 1.5: Optional resource-data enhancement
- if the richer startup-directories source data is available, add lightweight editorial fields and status badges
- do not block the clarity refresh on this
- prefer a small set of high-signal fields over a full enrichment project

### Phase 2: Authority reinforcement
- Task 6: about
- Task 6: FAQs
- Task 6: launch guide

### Phase 3: Post-refresh evaluation
- review whether improved clarity changes conversion behavior
- only after that decide whether a larger structural or design rewrite is necessary

---

## Success Criteria

The refresh is successful if:
- the homepage explains ShipBoost in one screen without requiring inference
- the resource page feels honest and useful, not overclaimed
- pricing makes Free vs Premium feel like a rational decision
- the submit page lowers effort anxiety before the form
- authority pages reinforce the same product logic
- all non-article pages use the new default OG image
- article pages continue to use article hero images

---

## Bottom Line

ShipBoost does not need a new strategic identity. It needs a clearer explanation of the one it already has.

The right implementation is:
- keep the current core thesis
- sharpen the promise
- explain the mechanism early
- add visible proof
- centralize the new site OG image

That is lower risk, cleaner to ship, and more likely to improve conversion than a full positioning rewrite.
