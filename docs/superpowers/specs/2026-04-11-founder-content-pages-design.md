# Founder Content Pages Design

## Purpose
Add three founder-facing content pages that work as conversion pages first and SEO pages second:

- `/launch-guide`
- `/how-it-works`
- `/faqs`

These pages should attract founders searching for launch guidance, explain ShipBoost clearly, and push qualified visitors toward `/submit` and `/pricing`.

## Confirmed product decisions

- The pages should suit the ShipBoost brand system.
- The pages should feel native to the current app theme.
- Existing components and styling patterns should be reused wherever possible.
- New shared components should only be created when there is no suitable existing pattern.
- The pages should be SEO-optimized.
- The pages should act as conversion pages for founders with strong CTAs to `/submit` and `/pricing`.
- `/faqs` should use a collapsible accordion.

## Scope

This slice covers:

- three new app routes with page metadata
- page copy and information architecture for each route
- consistent editorial UI using the current ShipBoost theme
- repeated founder CTAs
- a reusable accordion component only if needed for `/faqs`

This slice does not cover:

- blog CMS or markdown pipeline
- search or filtering inside FAQs
- analytics instrumentation beyond what already exists
- schema beyond basic metadata unless it is trivial to add

## Page roles

### `/launch-guide`
Primary job:
- rank for broad founder-intent launch queries
- establish ShipBoost as a practical operator-led launch platform

Target keyword themes:
- product launch guide
- saas launch guide
- how to launch a product
- startup launch checklist

Content shape:
- hero with direct promise
- common launch mistakes
- practical launch framework
- weekly launch checklist
- free vs premium decision section
- final CTA block

### `/how-it-works`
Primary job:
- explain the ShipBoost system clearly for founders evaluating the product

Target keyword themes:
- how ShipBoost works
- launch platform process
- premium launch vs free launch

Content shape:
- hero
- 3-step workflow
- free launch flow
- premium launch flow
- weekly ranking rules
- what happens after submission
- final CTA block

### `/faqs`
Primary job:
- answer objections and long-tail founder questions before submission

Target keyword themes:
- startup launch faq
- launch platform faq
- launch week scheduling
- backlink verification faq

Content shape:
- short intro
- grouped accordion sections
- final CTA block

FAQ groups:
- submission basics
- free vs premium
- scheduling and ranking
- listings and visibility
- payments and edits

## UX and visual approach

These pages should reuse the current ShipBoost visual language:

- monochrome editorial feel
- strong lowercase headings
- dense but clean sections
- restrained cards and dividers
- strong black primary CTAs
- no playful illustrations or off-brand decorative effects

Preferred reuse sources:

- pricing page layout and card treatment
- submit page CTA patterns
- prelaunch and homepage spacing/section rhythms
- existing footer

Only introduce new shared components if they solve repeated structure across pages. The most likely additions are:

- a simple shared content-page hero wrapper
- a shared CTA section
- a reusable FAQ accordion item

## Content and conversion rules

- Every page should have a strong CTA near the top.
- Every page should repeat conversion CTAs at least once in the body and once near the end.
- CTA destinations:
  - primary: `/submit`
  - secondary: `/pricing`
- Copy should sound direct, practical, and anti-fluff.
- Avoid generic startup-marketing language.
- Keep paragraphs short and easy to scan.

## SEO rules

- Each page must have distinct metadata and a distinct H1.
- The three pages should target different search intent to avoid cannibalization.
- Section hierarchy should be clean with meaningful H2s.
- Copy should be readable as landing-page content, not blog filler.
- `/faqs` should be structured in a way that can support FAQ schema later if desired.

## Route implementation

Create:

- `src/app/launch-guide/page.tsx`
- `src/app/how-it-works/page.tsx`
- `src/app/faqs/page.tsx`

Each page should:

- export route metadata
- render as a static server component
- use the shared app shell and footer

## Recommended build order

1. `/how-it-works`
2. `/launch-guide`
3. `/faqs`

Why:

- `/how-it-works` establishes the core content-page pattern fastest
- `/launch-guide` extends the same shell into longer SEO content
- `/faqs` finishes with the only interactive requirement, the accordion

## Testing

- verify each route renders and builds
- verify metadata compiles
- verify accordion behavior on `/faqs`
- verify CTAs point to `/submit` and `/pricing`
- verify the pages match current theme conventions on desktop and mobile

## Implementation notes

- Reuse existing components first.
- Keep any new shared components small and page-specific.
- Avoid introducing a parallel marketing design system.
- Favor static content and simple composition over over-engineering.
