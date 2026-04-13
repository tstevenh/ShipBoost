# Deploy ShipBoost to DigitalOcean App Platform

This app is a Next.js 16 web service with Prisma, Better Auth, Polar webhooks, Cloudinary uploads, and protected cron endpoints.

## Before You Deploy

Have these ready:

- a GitHub repo that DigitalOcean can access
- the production domain: `shipboost.io`
- a PostgreSQL database
- a Resend account and a verified sending domain
- a Cloudinary account
- a Polar production product and webhook
- a long random value for `BETTER_AUTH_SECRET`
- a long random value for `CRON_SECRET`

This repo already includes a production env template in [`.env.production.example`](/Users/tsth/Coding/shipboost/my-app/.env.production.example).

## App Platform Settings

Create one **Web Service** from the `my-app` directory.

- Source directory: `my-app`
- Environment: `Node.js`
- Build command: `npm run build`
- Run command: `npm run start`
- HTTP port: `8080`

Recommended runtime:

- Node.js `20.x`

The repo also pins Node `20.x` in [`package.json`](/Users/tsth/Coding/shipboost/my-app/package.json).

## Database

Use a production Postgres database and set:

- `DATABASE_URL`
- `DIRECT_URL`

For Prisma in production, run migrations with:

```bash
npm run db:deploy
```

If you use a DigitalOcean managed Postgres database, App Platform can either inject connection values from the database component or you can paste the full URLs manually.

## Required Production Environment Variables

These should be set before the first production deploy:

```env
DATABASE_URL=
DIRECT_URL=
APP_ENV=production
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=https://shipboost.io
NEXT_PUBLIC_APP_URL=https://shipboost.io
RESEND_API_KEY=
RESEND_FROM_TRANSACTIONAL="ShipBoost <hello@shipboost.io>"
RESEND_REPLY_TO_TRANSACTIONAL=hello@shipboost.io
CRON_SECRET=
ADMIN_EMAIL=admin@shipboost.io
ADMIN_NAME=Shipboost Admin
```

## Feature-Specific Environment Variables

Set these if you want the related feature live at launch.

### Email via Resend

Treat Resend as required for a real launch. This app requires email verification for normal email/password sign-in flows.

```env
RESEND_API_KEY=
RESEND_FROM_TRANSACTIONAL="ShipBoost <hello@shipboost.io>"
RESEND_REPLY_TO_TRANSACTIONAL=hello@shipboost.io
RESEND_FROM_MARKETING="ShipBoost <hello@shipboost.io>"
```

### Cloudinary uploads

```env
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_UPLOAD_FOLDER=shipboost
```

### Polar featured launch payments

```env
POLAR_ACCESS_TOKEN=
POLAR_WEBHOOK_SECRET=
POLAR_SERVER=production
POLAR_FEATURED_LAUNCH_PRODUCT_ID=
POLAR_SUCCESS_URL=https://shipboost.io/dashboard?checkout=success&checkout_id={CHECKOUT_ID}
POLAR_RETURN_URL=https://shipboost.io/submit
```

### Optional

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
POSTHOG_KEY=
POSTHOG_HOST=https://us.i.posthog.com
NEXT_PUBLIC_PRELAUNCH_MODE=false
LAUNCHPAD_GO_LIVE_AT=2026-05-01T00:00:00Z
FREE_LAUNCH_SLOTS_PER_WEEK=10
FOUNDING_PREMIUM_LAUNCH_LIMIT=100
BETTER_AUTH_API_KEY=
```

## Domain Setup

After the first successful deploy:

1. In App Platform, add `shipboost.io` as the primary domain.
2. Add `www.shipboost.io` too if you want it redirected or served.
3. Follow the DNS instructions that App Platform gives you.
4. Wait for SSL issuance to complete before switching all traffic.

Then make sure the app env matches the final domain:

- `BETTER_AUTH_URL=https://shipboost.io`
- `NEXT_PUBLIC_APP_URL=https://shipboost.io`

## Webhooks and Scheduled Requests

### Polar webhook

Set the Polar production webhook target to:

```text
https://shipboost.io/api/polar/webhooks
```

### Launch publish cron

Call:

```text
POST https://shipboost.io/api/cron/launches/publish-due
Authorization: Bearer <CRON_SECRET>
```

### Public content revalidation cron

Call:

```text
POST https://shipboost.io/api/cron/public-content/revalidate
Authorization: Bearer <CRON_SECRET>
```

If you do not schedule these, launches and cache refreshes will rely only on normal user traffic and webhooks.

## First Launch Sequence

1. Push the repo to GitHub.
2. Create the App Platform app from the repo.
3. Set source directory to `my-app`.
4. Add all production environment variables.
5. Deploy the web service.
6. Run `npm run db:deploy` against production.
7. Run `npm run db:seed` once against production.
8. Promote your real admin account if needed with `npm run auth:promote-admin -- <email>`.
9. Add `shipboost.io` and `www.shipboost.io` in App Platform.
10. Update Polar webhook and any OAuth redirect URLs to the production domain.

## Post-Launch Checks

Verify these flows in production:

- homepage loads on `https://shipboost.io`
- sign up, email verification, sign in, forgot password
- founder draft save and Cloudinary media upload
- submission flow
- admin login and review screens
- Polar checkout success and webhook processing
- cron endpoints respond with `200` when called with the bearer secret
