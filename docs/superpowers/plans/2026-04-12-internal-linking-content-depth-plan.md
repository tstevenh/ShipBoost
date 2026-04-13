# Internal Linking and Content Depth Plan

Date: 2026-04-12
Project: `my-app`
Scope: Public SEO routes only

## Objective

Improve organic performance by:

1. increasing crawlable internal links between public SEO pages
2. deepening content on thin or mostly-list pages
3. aligning each page’s content structure with its actual search intent

This plan is based on the current implementation in `src/app` and the shared public UI components that control most crawl paths.

## Current Scan Summary

The current SEO foundation is technically solid:

- schema is in place
- metadata is in place
- sitemap and robots are in place
- dynamic public routes are statically generated where appropriate

The weak point is not crawlability in the binary sense. It is crawl efficiency and topical reinforcement.

The main gaps:

- many important internal paths depend on cards, buttons, or shared UI rather than obvious editorial links inside page copy
- the homepage and launch-board pages have very little crawlable explanatory text
- category, tag, and alternatives pages are mostly list pages with short intros
- tool pages have product description plus sidebar links, but not enough contextual navigation to related comparison or taxonomy pages
- the content pages link mostly to `submit` and `pricing`, but do not strongly distribute authority back into category, tag, alternatives, and tool discovery surfaces
- the filter bar uses client-side buttons, which are weaker crawl surfaces than plain links for board discovery

## Shared Priorities

These are the best sitewide improvements because they lift multiple route families at once.

### 1. Replace or supplement non-anchor navigation with crawlable links

Current issue:

- [FilterBar.tsx](/Users/tsth/Coding/shipboost/my-app/src/components/FilterBar.tsx:1) uses `button` + `router.push()` for weekly/monthly/yearly board navigation

Improvement:

- render those period controls as normal `Link` anchors or add a crawlable text-link fallback nearby

Why this is best:

- board pages become more discoverable through standard HTML links
- internal PageRank flow becomes more explicit
- this is a high-leverage fix touching homepage and launch-board templates at once

### 2. Make taxonomy links visible inside tool cards

Current issue:

- [public-directory-tool-card.tsx](/Users/tsth/Coding/shipboost/my-app/src/components/public/public-directory-tool-card.tsx:1) shows tags as plain text spans, not links

Improvement:

- turn card tags into links where the source route context allows it
- optionally add a small category link line on cards when category data is available

Why this is best:

- category/tag hubs gain far more internal links from the highest-volume list surfaces
- users can pivot into deeper discovery paths directly from launch, category, tag, and alternatives lists

### 3. Add reusable “Related Navigation” modules

Current issue:

- most pages only have one or two contextual links near the hero or footer

Improvement:

- create reusable modules for:
  - related categories
  - related tags
  - related alternatives
  - related guides

Why this is best:

- avoids hand-coding cross-link blocks on every route
- gives each page type a predictable “next step” section
- improves both SEO distribution and user browsing depth

## Route-by-Route Plan

## 1. Homepage `/`

Page intent:

- brand entry
- launch discovery
- directory discovery

Current implementation:

- strong visual hero in [hero-minimalism.tsx](/Users/tsth/Coding/shipboost/my-app/src/components/ui/hero-minimalism.tsx:1)
- launch list or prelaunch surface
- no meaningful editorial text block under the main launch feed
- no explicit crawlable section linking to categories, tags, alternatives, or guides

Internal linking improvements:

- add a “Browse ShipBoost by path” section under the launch feed with direct links to:
  - `/categories`
  - `/tags`
  - `/alternatives`
  - `/pricing`
  - `/how-it-works`
  - `/launch-guide`
  - `/faqs`
- add a small “Popular categories” module with direct links to key category pages
- add a “Popular comparisons” module with links to strongest alternatives pages
- make board switching crawlable with `Link` anchors

Content depth additions:

- add a 2-3 paragraph “What ShipBoost is” / “How discovery works here” section
- add a short explainer on weekly launches vs noisy daily feeds
- add a “How founders use ShipBoost” section with 3 short use cases:
  - launch visibility
  - category discovery
  - alternatives comparison

Why this is best:

- the homepage is currently visually strong but text-light
- adding discovery links and explanatory copy makes it a true topical hub, not just a feed page
- this is the best place to distribute authority into all major public route families

Priority: High

## 2. Launch boards `/launches/[board]`

Page intent:

- browse launches by time window
- freshness and ranking discovery

Current implementation:

- same structure as home with hero + filter bar + launch list
- little to no board-specific editorial context
- board nav depends on client-side buttons

Internal linking improvements:

- convert weekly/monthly/yearly controls to normal links
- add a “Related discovery paths” section linking to:
  - key categories
  - pricing
  - launch guide
  - submit
- add “Popular tools from this board” text links if data volume supports it

Content depth additions:

- add a board-specific intro under the hero:
  - weekly: why weekly cohorts matter
  - monthly: what this month board represents
  - yearly: what “top of the year” signals
- add a short “How ranking works on ShipBoost” block linking to `/how-it-works`
- add a “Want to get listed?” block linking to `/submit` and `/pricing`

Why this is best:

- these pages are currently mostly feed surfaces
- they need some durable, crawlable context so they do not read like thin variants of the homepage

Priority: High

## 3. Daily redirect `/launches/daily`

Page intent:

- legacy route cleanup

Current implementation:

- redirects to `/launches/weekly`

Improvement:

- keep as redirect
- ensure sitemap never includes this route

Why this is best:

- no need to build content here
- redirect behavior is the right outcome

Priority: Low

## 4. Category index `/categories`

Page intent:

- taxonomy discovery
- browse tools by category

Current implementation:

- simple grid of categories with a short intro
- links to category pages are present
- no category grouping, no editorial guidance, no links to guides or comparisons

Internal linking improvements:

- add grouped category sections such as:
  - growth
  - product and support
  - development and infrastructure
- add links from the page body to:
  - `/launch-guide`
  - `/alternatives`
  - `/tags`
- add “Popular category pages” or “Founder favorites” text links above the grid

Content depth additions:

- add a short intro on how to use categories on ShipBoost
- add a “How to choose a category page” section
- add a short explanation of what makes a category useful here: curated tools, featured picks, founder-friendly discovery

Why this is best:

- this page is already link-rich, but it lacks topical framing
- a stronger intro and a few editorial bridges make it a real category hub rather than only a navigation screen

Priority: Medium

## 5. Category detail `/categories/[slug]`

Page intent:

- rank for “best X tools”
- help users evaluate a tool set in one category

Current implementation:

- breadcrumb
- intro
- stats
- featured picks
- full tool grid
- only strong permanent link is back to `/categories`

Internal linking improvements:

- add “Related categories” block below the intro or below the grid
- add “Popular tags in this category” links
- add “Relevant alternatives” links when an alternatives page exists for tools in the category
- add links to `/launch-guide`, `/pricing`, and `/submit` only if presented contextually, not as generic CTA spam

Content depth additions:

- add a “How to evaluate ${category} tools” section
- add a “What founders usually optimize for” section with 3-5 criteria
- add a short “Who this category is for” section
- add a category-specific FAQ block if enough patterns repeat

Why this is best:

- category pages already have the right product inventory
- what they lack is decision-support content and deeper onward paths
- this is one of the highest-value pSEO templates in the project

Priority: High

## 6. Tag index `/tags`

Page intent:

- feature/use-case discovery
- browse tools by specific attributes

Current implementation:

- intro plus flat tag chip list
- links to best-tag pages exist
- no grouping or explanation of what the tags mean

Internal linking improvements:

- group tags into sections where possible:
  - use case
  - stack
  - founder profile
  - product model
- add links to `/categories` and `/alternatives`
- add a “Most-used tags” section above the full list

Content depth additions:

- explain how tags differ from categories
- add a short section on using tags to refine discovery
- add examples like “AI tools”, “Open source tools”, “Bootstrapped tools”

Why this is best:

- “tags” is not naturally strong user language
- editorial framing helps search engines and users understand why these pages exist

Priority: Medium

## 7. Best-tag detail `/best/tag/[slug]`

Page intent:

- rank for feature/use-case searches
- help users discover tools sharing a trait

Current implementation:

- intro, breadcrumb, sort button, tool grid
- links back to tags
- no related tags, no related categories, no guide bridges

Internal linking improvements:

- add “Related tags” links
- add “Relevant categories” links based on the tools shown
- add “Related alternatives” links where the tag overlaps with known comparison hubs
- add contextual links to `/launch-guide` and `/how-it-works` only when the tag fits founder-launch intent

Content depth additions:

- add “What counts as ${tag} on ShipBoost” section
- add “Why founders look for ${tag} tools” section
- add “How to choose between these tools” guidance
- add a short FAQ block for high-intent tags

Why this is best:

- these pages are strong candidates for long-tail SEO, but only if they become more than a tagged list
- related tags and category pivots are especially important here

Priority: High

## 8. Alternatives index `/alternatives`

Page intent:

- comparison hub discovery
- browse comparison pages

Current implementation:

- grid of alternatives pages with short descriptions
- links exist, but the page is still mostly a directory of comparison entries

Internal linking improvements:

- add sections grouping alternatives by category or workflow
- add links to category pages and high-intent guides
- add “Most searched comparisons” text links near the top

Content depth additions:

- add an intro explaining what these comparison pages help with
- add a “How to use alternatives pages” section
- add a short explanation of how ShipBoost approaches comparison: fit, workflow, founder context

Why this is best:

- current structure is functional, but thin
- comparisons are high-intent pages and deserve a stronger hub page feeding into them

Priority: Medium

## 9. Alternatives detail `/alternatives/[slug]`

Page intent:

- comparison intent
- users evaluating substitute products

Current implementation:

- intro
- anchor product block
- alternatives grid
- one link to the anchor tool listing
- no comparison framework or fit guidance

Internal linking improvements:

- add links to:
  - anchor tool page
  - relevant category pages
  - relevant best-tag pages
  - adjacent alternatives pages
- add a “Related comparisons” block

Content depth additions:

- add “When the anchor tool is still the right fit” section
- add “When to choose an alternative instead” section
- add “What to compare across these tools” criteria list
- add short “Best for X” summaries if editorially supportable

Why this is best:

- alternatives pages can convert high-value comparison queries
- right now they surface inventory, but not enough reasoning
- comparison guidance improves both usefulness and topical specificity

Priority: High

## 10. Tool detail `/tools/[slug]`

Page intent:

- product evaluation
- route users toward related tools and categories

Current implementation:

- hero
- screenshots
- markdown description
- category link
- tag links
- related tools
- no breadcrumb
- no explicit links to alternatives pages
- no “more in category” editorial navigation beyond sidebar details

Internal linking improvements:

- add breadcrumb links: Home > Category > Tool
- add a dedicated “Explore this category” section with links to:
  - category page
  - sibling tools
  - relevant tags
- add “Compare alternatives” section when an alternatives page exists
- add a “Related founder resources” block linking to launch guide or pricing only when contextually useful

Content depth additions:

- add structured sub-sections beneath the description:
  - what this tool does
  - best fit
  - pricing model
  - related categories/tags
- add “Why it’s listed on ShipBoost” or “Who it’s for” if the data model supports it
- add lightweight FAQ only if there is enough real data, not invented copy

Why this is best:

- tool pages already have the strongest base content, but the onward navigation is still too shallow
- this is the single most important template for distributing users into category, tag, and alternatives paths

Priority: High

## 11. Pricing `/pricing`

Page intent:

- commercial evaluation
- route users into submit flow or help content

Current implementation:

- pricing tiers
- some trust copy
- links mainly to `/submit`

Internal linking improvements:

- add text links to:
  - `/how-it-works`
  - `/faqs`
  - `/launch-guide`
- add contextual links from each tier to relevant explanatory pages

Content depth additions:

- add “Which option fits which founder” section
- add a comparison table for Free vs Premium vs Done-for-you
- add a short “What happens after you pay or submit” section

Why this is best:

- pricing pages benefit from objection handling and next-step clarity
- these additions reduce friction and add internal links to supporting pages

Priority: Medium

## 12. Submit `/submit`

Page intent:

- conversion
- start submission flow

Current implementation:

- gated entry for logged-out users
- sign-up/sign-in links
- almost no supporting internal links for undecided visitors

Internal linking improvements:

- add a small pre-submit resource block with links to:
  - `/pricing`
  - `/how-it-works`
  - `/faqs`
  - `/launch-guide`

Content depth additions:

- add a short “Before you submit” checklist
- add a “Who should use Free vs Premium” mini explainer

Why this is best:

- this page gets commercial-intent traffic and user hesitation
- supporting links reduce dead ends for people not ready to authenticate yet

Priority: Medium

## 13. How It Works `/how-it-works`

Page intent:

- explain process
- support launch and pricing decisions

Current implementation:

- decent content depth
- only strong in-body link is to `/faqs`
- shell CTA links to `/submit` and `/pricing`

Internal linking improvements:

- add contextual text links inside relevant sections to:
  - `/pricing`
  - `/launch-guide`
  - launch-board pages
- add links to relevant category or tool discovery pages sparingly

Content depth additions:

- add a mini table of contents near the top
- add examples of free vs premium founder paths
- add a short section on how founders should prepare listing assets

Why this is best:

- this page is already closer to good content depth
- it mainly needs better authority distribution into the rest of the funnel

Priority: Medium

## 14. Launch Guide `/launch-guide`

Page intent:

- informational founder guide
- launch-prep support

Current implementation:

- good content structure
- light on internal discovery links

Internal linking improvements:

- add contextual links to:
  - `/how-it-works`
  - `/pricing`
  - `/submit`
  - category pages like marketing, analytics, support, development when naturally relevant

Content depth additions:

- add a “What a strong ShipBoost listing includes” section
- add a “Post-launch distribution checklist” section
- add tool/category examples if you have real on-site patterns to cite

Why this is best:

- this page can become a strong mid-funnel entry page
- linking it into practical discovery surfaces will make it more useful and more connected

Priority: Medium

## 15. FAQs `/faqs`

Page intent:

- answer objections
- support conversions

Current implementation:

- good FAQ structure
- shell CTA links to `/submit` and `/pricing`
- weak contextual deep links inside answers

Internal linking improvements:

- add inline links inside answers to:
  - `/pricing`
  - `/how-it-works`
  - `/submit`
  - `/contact`

Content depth additions:

- expand questions where users likely hesitate:
  - review timing
  - launch scheduling
  - listing edits
  - backlink verification
- add a final “Still not sure?” resource cluster with links to the guide pages

Why this is best:

- FAQs already match user intent well
- richer answers and deeper links help both SEO and conversion support

Priority: Medium

## 16. About `/about`

Page intent:

- trust
- brand positioning

Current implementation:

- solid trust copy
- shell CTA links to submit/pricing
- little discovery linking beyond those defaults

Internal linking improvements:

- add contextual links to:
  - `/how-it-works`
  - `/launch-guide`
  - `/categories`
  - `/alternatives`

Content depth additions:

- add a “How the directory stays useful” section
- add a “What founders can do on ShipBoost” section

Why this is best:

- about pages are not usually traffic leaders, but they can reinforce brand trust and route users back into core discovery pages

Priority: Low

## 17. Contact `/contact`

Page intent:

- trust and support

Current implementation:

- already links to `/how-it-works` and `/faqs`
- shell links to `/submit`

Internal linking improvements:

- add link to `/pricing`
- add link to `/about`

Content depth additions:

- optional: add “Best place to start before contacting us” section with route recommendations

Why this is best:

- this page is already in decent shape
- only light support work is needed

Priority: Low

## 18. Affiliate `/affiliate`

Page intent:

- disclosure and trust

Current implementation:

- legal-style content
- shell already links to `/privacy`

Internal linking improvements:

- keep minimal

Content depth additions:

- none needed for SEO

Why this is best:

- this page is compliance-oriented, not a traffic-growth priority

Priority: Low

## 19. Privacy `/privacy`

Page intent:

- legal and trust

Current implementation:

- legal content with shell links to `/terms`

Internal linking improvements:

- keep minimal

Content depth additions:

- none needed for SEO

Why this is best:

- legal clarity matters more than SEO expansion here

Priority: Low

## 20. Terms `/terms`

Page intent:

- legal and trust

Current implementation:

- legal content with shell links to `/privacy`

Internal linking improvements:

- keep minimal

Content depth additions:

- none needed for SEO

Why this is best:

- same reasoning as privacy and affiliate

Priority: Low

## Recommended Rollout Order

### Phase 1: Highest-impact crawl and depth improvements

1. shared crawlable anchor updates
   - board navigation
   - tool-card taxonomy links
2. homepage
3. tool detail pages
4. category detail pages
5. alternatives detail pages
6. best-tag detail pages

### Phase 2: Hub strengthening

1. launch boards
2. categories index
3. tags index
4. alternatives index

### Phase 3: Mid-funnel content linking

1. pricing
2. submit
3. how it works
4. launch guide
5. faqs

### Phase 4: Trust-page cleanup

1. about
2. contact
3. legal pages only if needed

## Best Bets Per Page Type

If we want the highest ROI additions, these are the best single changes per template.

- Homepage:
  add a crawlable discovery hub section with category, tag, alternatives, and guide links
- Launch boards:
  replace router buttons with normal anchor links and add board-specific text context
- Category detail:
  add “how to choose” content plus related categories, tags, and alternatives
- Best-tag detail:
  add related tags and explanatory copy about what the tag means
- Alternatives detail:
  add comparison criteria and adjacent comparison links
- Tool detail:
  add breadcrumb, category navigation, and alternatives navigation
- Pricing:
  add comparison table plus support links to how-it-works and FAQs
- Submit:
  add pre-submit help links and checklist
- Content pages:
  add more contextual in-body links to discovery surfaces, not just CTAs

## Implementation Notes

- Prefer reusable editorial modules instead of bespoke blocks on every page
- Keep new internal links crawlable and server-rendered
- Avoid adding generic SEO fluff; every new section should help a founder make a decision or navigate to a better-fit page
- Do not add fake comparison claims, ratings, or tool judgments that are not supported by real data
- For content depth, prioritize:
  - decision-support copy
  - route pivots
  - explanatory context
  over long filler paragraphs
