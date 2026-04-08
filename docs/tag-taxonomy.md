# ShipBoost Tag Taxonomy

This is the normalized tag model for ShipBoost.

The UI can stay flat, but internally the tags should be thought of in four buckets:
- use case / function
- founder context / business stage
- technical / platform
- format / product style

## Principles

- Tags should help browsing and pSEO, not just label everything.
- Use-case tags are the highest-value tags.
- Founder-context tags are a key differentiator for ShipBoost.
- Technical and format tags should be used selectively.
- Avoid flooding a tool with too many generic tags.

## Normalized tag set

### Bucket 1: Use case / function

- `email-marketing`
- `crm`
- `affiliate-marketing`
- `customer-support`
- `analytics`
- `seo`
- `automation`
- `forms`
- `surveys`
- `onboarding`
- `invoicing`
- `monitoring`
- `scheduling`
- `documentation`
- `note-taking`
- `project-management`
- `social-media`
- `lead-generation`
- `outreach`
- `user-feedback`

These are the strongest browse tags and the best default candidates for future `/best/tag/[slug]` pages.

### Bucket 2: Founder context / business stage

- `bootstrapped`
- `indie-hackers`
- `founder-led`
- `early-stage`
- `growth`
- `launch`
- `distribution`
- `monetization`
- `retention`
- `validation`
- `acquisition`
- `conversion`

These are strategically important for ShipBoost because they describe founder intent and stage, not just software function.

### Bucket 3: Technical / platform

- `ai`
- `nextjs`
- `api`
- `no-code`
- `open-source`
- `shopify`
- `webflow`
- `wordpress`
- `chrome-extension`
- `macos`

Use these when a platform or technical stack meaningfully affects discovery.

### Bucket 4: Format / product style

- `boilerplate`
- `template`
- `marketplace`
- `directory`
- `plugin`
- `dashboard`
- `widget`

These are secondary tags. Use them when the product format is genuinely part of the buying decision.

## Priority tags

If you do not want to roll out all best-tag pages at once, start with these:

### Tier 1: Highest-value browse and SEO tags

- `ai`
- `seo`
- `analytics`
- `automation`
- `customer-support`
- `lead-generation`
- `email-marketing`

### Tier 2: Strong founder-context tags

- `bootstrapped`
- `launch`
- `distribution`
- `growth`
- `validation`

### Tier 3: Only when enough tools exist

- `api`
- `no-code`
- `directory`
- `plugin`
- `template`

## Tags to use carefully

These are valid, but easy to overuse:

- `growth`
  - useful for founder context, but broad
- `api`
  - meaningful only when API access is part of the core product
- `dashboard`
  - often too generic to help discovery
- `widget`
  - use only when embeddability matters
- `directory`
  - useful for directory products, but not for every listing that merely appears in one

## Tagging guidance

For most tools, keep the tag mix disciplined:

- 1 to 2 use-case tags
- 1 founder-context tag when relevant
- 0 to 1 technical tag
- 0 to 1 format tag

That usually means around 2 to 4 total tags per tool.

## SEO guidance

Best-tag pages should not be created for every tag immediately.

Create `/best/tag/[slug]` pages first for:
- use-case tags with strong browse intent
- founder-context tags that clearly match ShipBoost’s ICP
- technical tags only when there are enough real published tools

Alternatives pages stay separate and should remain fully manual.

## Syncing tags into the database

The canonical tag list lives in:
- [scripts/tag-taxonomy.mjs](/Users/tsth/Coding/shipboost/my-app/scripts/tag-taxonomy.mjs)

To sync those tags into the database:

```bash
npm run tags:sync
```

That command will:
- create missing tags
- update names for existing matching slugs
- mark synced tags as active

If you also want to deactivate tags that are not in the canonical taxonomy:

```bash
npm run tags:sync:deactivate-missing
```

That command will not delete tags. It only sets `isActive = false` for extra tags not present in the taxonomy source.

## Seed behavior

The app seed now reuses the same taxonomy source.

Relevant files:
- [prisma/seed.mjs](/Users/tsth/Coding/shipboost/my-app/prisma/seed.mjs)
- [scripts/tag-taxonomy.mjs](/Users/tsth/Coding/shipboost/my-app/scripts/tag-taxonomy.mjs)
- [scripts/sync-tag-taxonomy.mjs](/Users/tsth/Coding/shipboost/my-app/scripts/sync-tag-taxonomy.mjs)
