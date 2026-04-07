# Shipboost

Shipboost is a launch-and-distribution app for bootstrapped SaaS founders.

The current MVP supports:

- founder auth with Better Auth
- draft-first product submissions
- free launches gated by badge verification
- featured launches with Polar checkout and scheduled launch dates
- affiliate-ready public listing pages
- admin moderation
- launch boards
- Cloudinary media storage
- Neon/Postgres via Prisma
- transactional email via Resend

The app lives in [`my-app`](/Users/tsth/Coding/shipboost/my-app). Strategy and product docs live in [`saas-launch-directory-docs`](/Users/tsth/Coding/shipboost/saas-launch-directory-docs).

## Product model

Shipboost is built around one focused wedge:

- audience: bootstrapped SaaS founders
- free offer: free launch with Shipboost badge requirement
- paid offer: featured launch with scheduled date and payment
- monetization support: affiliate links on listings and later done-for-you distribution services

## Current workflows

### Founder flows

- `LISTING_ONLY`
  - founder creates a draft
  - founder submits for review
  - admin approves/rejects

- `FREE_LAUNCH`
  - founder creates a draft
  - founder installs the Shipboost badge on the homepage
  - founder verifies badge
  - founder submits for review
  - admin approves
  - system assigns the next available free-launch slot

- `FEATURED_LAUNCH`
  - founder creates a draft
  - founder chooses a preferred launch date
  - founder clicks `Launch and pay`
  - Polar checkout opens
  - successful payment auto-approves the launch
  - launch is scheduled automatically

### Admin flows

- review founder submissions
- approve or reject free launches and listing-only submissions
- manage categories, tags, and tools
- monitor featured launches and payment state

### Public flows

- homepage with daily launch pad
- category pages
- tool detail pages with Markdown-rendered long descriptions
- daily and weekly launch boards

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma
- PostgreSQL / Neon
- Better Auth
- Polar
- Cloudinary
- Resend
- Zod
- React Markdown + GFM

## Repository structure

```text
shipboost/
├── my-app/                      # Next.js application
│   ├── prisma/                  # Prisma schema, migrations, seed
│   ├── scripts/                 # Local helper scripts
│   └── src/
│       ├── app/                 # App Router pages and API routes
│       ├── components/          # UI components
│       └── server/              # Services, validators, auth, email, Polar
└── saas-launch-directory-docs/  # Product and strategy docs
```

## Implemented areas

### Auth

- Better Auth session-based auth
- email/password sign up and sign in
- email verification
- forgot/reset password flow
- admin role promotion script

### Founder workspace

- draft-first submit form
- Markdown toolbar for rich descriptions
- slug suggestion from product name
- Cloudinary uploads on draft save
- free-launch badge verification
- featured launch checkout handoff
- dashboard status tracking
- featured launch rescheduling before go-live
- listing edit flow

### Launch system

- free-launch daily slot scheduling
- featured launch preferred date scheduling
- launch publishing cron endpoint
- launch boards by period

### Email

- auth emails
- submission received
- submission approved
- submission rejected
- featured payment received
- launch live

### Payments

- Polar checkout creation
- webhook handling for `order.paid` and refunds
- featured launch auto-approval on successful payment

## Requirements

- Node.js 20+
- npm
- Neon/Postgres database
- Cloudinary account
- Polar sandbox account
- Resend account

## Local setup

### 1. Install dependencies

```bash
cd /Users/tsth/Coding/shipboost/my-app
npm install
```

### 2. Create env file

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Populate the required values.

### 3. Generate Prisma client

```bash
npm run prisma:generate
```

### 4. Run migrations

```bash
npm run db:migrate -- --name init
```

If you pulled recent changes that add the draft-first launch flow, make sure this migration is applied:

```bash
npm run db:migrate -- --name add_submission_draft_status
```

### 5. Seed starter data

```bash
npm run db:seed
```

This seeds:

- one admin user from `ADMIN_EMAIL` / `ADMIN_NAME`
- starter categories
- starter tags

### 6. Start the app

```bash
npm run dev
```

Open `http://localhost:3000`.

## Environment variables

These are the current app envs from [`my-app/.env.example`](/Users/tsth/Coding/shipboost/my-app/.env.example).

### Core app

```env
DATABASE_URL=""
DIRECT_URL=""
APP_ENV="development"
BETTER_AUTH_SECRET=""
BETTER_AUTH_API_KEY=""
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET=""
```

### Resend

```env
RESEND_API_KEY=""
RESEND_FROM_TRANSACTIONAL="Shipboost <onboarding@resend.dev>"
RESEND_REPLY_TO_TRANSACTIONAL=""
RESEND_FROM_MARKETING=""
```

### Cloudinary

```env
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
CLOUDINARY_UPLOAD_FOLDER="shipboost"
```

### Polar

```env
POLAR_ACCESS_TOKEN=""
POLAR_WEBHOOK_SECRET=""
POLAR_SERVER="sandbox"
POLAR_FEATURED_LAUNCH_PRODUCT_ID=""
POLAR_SUCCESS_URL="http://localhost:3000/dashboard?checkout=success&checkout_id={CHECKOUT_ID}"
POLAR_RETURN_URL="http://localhost:3000/submit"
```

### Seed admin

```env
ADMIN_EMAIL="admin@example.com"
ADMIN_NAME="Shipboost Admin"
```

## Important scripts

Run these inside [`my-app`](/Users/tsth/Coding/shipboost/my-app):

```bash
npm run dev
npm run build
npm run lint
npm run prisma:generate
npm run prisma:studio
npm run db:migrate -- --name <migration_name>
npm run db:seed
npm run auth:promote-admin -- you@example.com
```

## Admin setup

If you sign up with a founder account and want admin access:

```bash
npm run auth:promote-admin -- your-email@example.com
```

That updates the existing user role to `ADMIN`.

## Payment setup with Polar

### Create the featured launch product

In Polar sandbox:

- create a one-time product
- copy its product ID
- put it in `POLAR_FEATURED_LAUNCH_PRODUCT_ID`

### Local webhook testing

Run:

```bash
polar login
polar listen http://localhost:3000/api/polar/webhooks
```

Copy the printed secret into:

```env
POLAR_WEBHOOK_SECRET=""
```

Important:

- point the listener to `/api/polar/webhooks`
- not to `/`

### Expected featured flow

- founder saves featured draft
- founder clicks `Launch and pay`
- app creates Polar checkout
- founder pays
- Polar sends `order.paid`
- app marks submission `PAID`
- app auto-approves and schedules the featured launch

## Scheduled launch publishing

Due launches are published through:

- [`/api/cron/launches/publish-due`](/Users/tsth/Coding/shipboost/my-app/src/app/api/cron/launches/publish-due/route.ts)

### Local testing

If `APP_ENV=development` and `CRON_SECRET` is empty:

```bash
curl http://localhost:3000/api/cron/launches/publish-due
```

If `CRON_SECRET` is set:

```bash
curl -H "x-cron-secret: YOUR_SECRET" http://localhost:3000/api/cron/launches/publish-due
```

### Production

You need a real cron trigger to call this route regularly.

## Badge verification

Free launches require badge verification before they can be submitted for review.

Current implementation:

- founder saves a free-launch draft
- submit page shows a badge snippet
- founder adds the snippet to the homepage
- founder clicks `Verify badge now`
- app fetches the submitted website URL and checks for:
  - `data-shipboost-badge="free-launch"`

If verification fails, founders can use the prefilled manual verification email link from the form.

## Cloudinary upload behavior

Uploads are not sent to Cloudinary while the founder is still typing.

Current behavior:

- files stay local in the browser until draft save
- on save, files upload to Cloudinary
- app stores only metadata in Neon/Postgres
- on failed submission persistence, uploaded assets are cleaned up
- on founder listing edit, replaced media is deleted from Cloudinary after successful update

## SEO behavior

Current tool page metadata:

- title:
  - manual `metaTitle` if set
  - fallback: `Product Name | Shipboost`
- description:
  - manual `metaDescription` if set
  - fallback: `Tagline. First useful sentence from richDescription.`
  - fallback of last resort: `Discover <product> on Shipboost - <tagline>`

Tool pages also set canonical, Open Graph, and Twitter metadata.

## Notes on email

Transactional email is wired through Resend.

Important local-dev note:

- `onboarding@resend.dev` is only useful for limited testing
- for real delivery to arbitrary inboxes, verify your own domain in Resend

Recommended production split:

- transactional: `auth@notify.yourdomain.com`
- marketing: `newsletter@updates.yourdomain.com`

## Known limitations

- no automated browser-based badge verification for JS-only websites
- no scheduled cleanup job for old draft media beyond current compensation cleanup
- no full analytics stack yet
- no production deployment config in this README yet
- Better Auth hosted dashboard is optional and not required for core auth

## Recommended test checklist

### Founder

- sign up
- verify account
- save a `FREE_LAUNCH` draft
- verify badge
- submit for review
- save a `FEATURED_LAUNCH` draft
- complete Polar checkout
- reschedule future featured launch

### Admin

- promote account to admin
- review free launch
- reject and approve submissions
- edit tools/categories/tags

### Public

- homepage daily launch pad
- category pages
- tool page metadata and Markdown rendering
- daily and weekly launch boards

## Docs

Product and strategy docs are in:

- [`saas-launch-directory-docs`](/Users/tsth/Coding/shipboost/saas-launch-directory-docs)

## License

No license file has been added yet.
