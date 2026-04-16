# Premium Launch Editorial Spotlight Design

## Goal

Upgrade ShipBoost Premium Launch from a mostly placement-based offer into a stronger founder-facing package by adding a tightly scoped editorial bonus for the founding offer.

This should:
- increase perceived value of Premium Launch
- make the `$9` founding offer easier to say yes to
- create more indexable content for ShipBoost
- strengthen internal linking between listing, launch, and content surfaces
- preserve a future path to unbundle editorial support later

## Core Decision

The editorial benefit is **not** the permanent identity of Premium Launch.

Premium Launch should still be sold primarily as:
- reserve a specific launch week
- skip badge verification
- get stronger baseline board placement
- keep a permanent public listing

The editorial layer is a **founding bonus for the first 100 Premium Launches**.

## Naming

Use:
- `editorial launch spotlight`
- `founder feature`
- `launch-week editorial`

Avoid:
- `review`
- `review article`
- `product review`
- `custom article`

`Editorial launch spotlight` is the right label because it sounds premium and structured without implying a deep, custom, founder-directed content engagement.

## Offer Structure

### Public Premium offer

Premium Launch becomes:
- reserve a specific launch week
- skip badge verification
- get stronger baseline placement
- keep a permanent public listing
- founding bonus: one ShipBoost editorial launch spotlight during launch week

### Founding-offer framing

The editorial launch spotlight is included only for the first 100 Premium Launches as part of the founding offer.

This keeps the current offer more compelling without locking ShipBoost into this exact packaging forever.

## Pricing Positioning

The Premium card should highlight the editorial benefit, but it should not make the whole offer depend on that one bonus.

### Recommended Premium description

`Reserve your launch week, skip badge verification, get stronger baseline placement, and receive a ShipBoost editorial launch spotlight during your launch period.`

### Recommended Premium bullets

- `Reserve a specific launch week`
- `Skip badge verification and launch faster`
- `Get stronger baseline board placement`
- `Keep a permanent public listing`
- `Includes one editorial launch spotlight during launch period`

### Founding bonus reinforcement

Add founding-offer subtext:

`Founding bonus for the first 100 Premium Launches: includes one ShipBoost editorial launch spotlight linked to your listing.`

### Pricing explainer section

Under the pricing cards, add a short explainer block:

Title:
- `What is the editorial launch spotlight?`

Body:
- A ShipBoost editorial launch spotlight is a founder feature published during launch week. It creates an additional discovery surface linked to your ShipBoost listing and external website, while helping visitors find your product through ShipBoost’s launch, category, and related-page paths.

Boundary line:
- `The editorial launch spotlight is a standardized ShipBoost founder feature, not a custom commissioned article.`

## Submit Flow Positioning

Premium should feel clearly more valuable during plan selection, not only on the pricing page.

### Premium helper copy

Use:

`Best for founders who care about timing, lower friction, stronger placement, and an editorial launch spotlight during launch week.`

### Comparison framing

Make the difference blunt and easy to scan.

Free Launch:
- weekly board placement
- public listing after approval
- badge required

Premium Launch:
- reserve a launch week
- no badge required
- stronger baseline placement
- editorial launch spotlight included

### Post-checkout expectation copy

Add a short note near the Premium CTA / confirmation flow:

`After checkout, ShipBoost reserves your week, opens your spotlight brief in the dashboard, and publishes your editorial launch spotlight during launch week.`

## Founder Workflow

The spotlight brief should live in the dashboard, not as a forced post-checkout interruption.

### Workflow

- founder purchases Premium Launch
- dashboard shows a new `Launch Spotlight Brief` step
- founder can open it whenever they want
- the form autosaves
- the founder can come back later and continue
- ShipBoost uses that brief to create the spotlight

### Founder flexibility

The founder should be able to complete the brief whenever they are available, not only right after checkout.

This requires:
- draft state
- autosave
- clear dashboard status

## Spotlight Brief

The brief should be standardized across all Premium Launches.

Every founder gets the same core questions.

### Required fields

1. `Who is this for?`
2. `What problem does it solve?`
3. `What makes it stand out?`
4. `What should ShipBoost emphasize?`
5. `Primary CTA URL`

### Optional fields

- founder quote
- extra screenshot choice
- wording to avoid

This gives ShipBoost enough structure to write consistently without turning the product into a custom content service.

## Timing And Reminder Rules

### Publish timing promise

ShipBoost guarantees the spotlight is published **during launch week**.

ShipBoost may publish it on **any day within launch week** at its discretion.

### Reminder cadence

- reminder after payment if the brief is still untouched
- reminder 3 days before launch week if still incomplete
- final reminder at the start of launch week

### Founder cutoff

The founder can keep filling the brief up until launch week begins.

Because ShipBoost has a fallback-content rule, this late cutoff is workable.

## Fallback Rule

If the founder does not finish the brief in time, ShipBoost can still publish the spotlight using:
- submission data
- listing data
- existing uploaded media

This fallback is essential. Without it, the launch-week guarantee becomes fragile.

## Editorial Scope

The spotlight must be tightly standardized.

### Recommended format

- `350–600 words`
- founder/product overview
- problem solved
- who it is for
- what makes it stand out
- one logo / hero image
- one screenshot where useful
- link to ShipBoost listing
- external founder website link
- internal links to relevant category / alternatives / related pages when appropriate

### Revision rule

Allow factual corrections only.

Do not promise open-ended revision rounds.

### ShipBoost control

ShipBoost controls:
- final title
- final structure
- final framing
- internal linking choices

## Editorial Boundaries

Do not promise:
- custom deep review
- investigative critique
- hands-on product testing
- custom keyword strategy
- founder-written guest-post treatment
- unlimited revisions

The public protection line should be used consistently:

`The editorial launch spotlight is a standardized ShipBoost founder feature, not a custom commissioned article.`

## Content Architecture

Use the existing blog system.

### Category

Create a dedicated blog category:
- `Launch Spotlights`

This is better than inventing a new content type because:
- blog article SEO behavior already exists
- article OG behavior already exists
- category archive pages are natural
- existing blog tooling can manage it

## Internal Linking Rules

Every spotlight should include:

### Required internal links

- the founder’s ShipBoost listing
- at least one relevant category page
- at least one relevant alternatives / best-of / cluster page when relevant

### Required external link

- founder website / CTA URL

This turns the spotlight into a real discovery node instead of a filler article.

## Dashboard / Ops Status Model

Premium Launch should gain a visible spotlight workflow state in the dashboard.

Suggested states:
- `Not started`
- `In progress`
- `Ready`
- `Published`

This is important so the bonus is not only promised publicly but also visible operationally.

## FAQ Updates

Add a Premium FAQ explaining:
- what the editorial launch spotlight is
- that it is included for the first 100 Premium Launches
- that it is standardized rather than custom commissioned editorial work

## What Changes From The Original Draft

The original idea is directionally strong, but this refined version makes it safer and more shippable.

### Tightened

- the spotlight is a **founding bonus**, not a permanent all-future Premium promise
- the delivery model is dashboard brief + autosave, not ad hoc follow-up
- the format is standardized and shorter
- the revision scope is reduced to factual corrections
- fallback publishing from existing listing data is explicit

### Reduced / reframed

- the public-facing copy should not lean too heavily on SEO language
- the founder-facing story should stay centered on visibility, timing, and discovery assets
- the spotlight should not become the sole identity of Premium

## Recommendation

Ship this as a **Founding Premium Upgrade**:
- Premium core offer stays intact
- editorial launch spotlight becomes the premium-feeling bonus that makes the founding offer feel unusually generous
- operational boundaries stay tight enough that the promise remains credible
