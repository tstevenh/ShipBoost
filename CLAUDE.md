# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Next.js version warning

This project runs **Next.js 16 + React 19**. APIs, routing conventions, and caching defaults differ from older Next.js. Before writing or modifying app-router code, consult `node_modules/next/dist/docs/` for the current behavior — do not rely on training-data memory of Next.js 13/14/15.

## Commands

All commands run from `my-app/` (this directory).

```bash
npm run dev                    # next dev
npm run build                  # next build
npm run lint                   # eslint
npm run test                   # vitest run (one-shot)
npx vitest <path>              # run a single test file (watch)
npx vitest run <path>          # run a single test file (no watch)
npx vitest -t "<name>"         # filter by test name

npm run prisma:generate        # regenerate Prisma client (run after schema.prisma changes)
npm run prisma:studio          # Prisma Studio with .env.local loaded
npm run db:migrate -- --name <name>   # create + apply dev migration
npm run db:deploy              # apply migrations in CI/prod
npm run db:seed                # seed admin user + starter categories/tags

npm run auth:promote-admin -- you@example.com   # promote a user to ADMIN role
```

Node 20.x is required (see `package.json#engines`).

### Env loading for scripts

Node scripts that need `.env.local` are wrapped via `scripts/run-with-env.mjs` (it parses `.env.local` itself, no dotenv dep). When adding a new script that touches the DB or external services, invoke it the same way: `node scripts/run-with-env.mjs node scripts/your-script.mjs`. Don't add a fresh dotenv import.

### Local cron testing

Scheduled launch publishing runs at `GET /api/cron/launches/publish-due`. In dev, if `CRON_SECRET` is empty the route is unauthenticated; otherwise pass `x-cron-secret: $CRON_SECRET`.

### Local Polar webhook testing

```bash
polar listen http://localhost:3000/api/polar/webhooks
```

Copy the printed secret into `POLAR_WEBHOOK_SECRET`. The listener must point at `/api/polar/webhooks`, not `/`.

## Architecture

### Layered server code (`src/server/`)

The server tree enforces a deliberate layering. Respect it when adding features:

- `db/client.ts` — single Prisma client. Always import from here.
- `db/includes.ts`, `db/public-selects.ts` — shared Prisma `include`/`select` shapes. Reuse these so public responses don't accidentally leak internal fields (e.g., founder notes).
- `repositories/` — thin Prisma wrappers (`tool-repository`, `submission-repository`). Pure data access; no business rules.
- `validators/` — Zod schemas for every API/route boundary. Route handlers must parse input through these.
- `services/` — business logic. This is where the bulk of feature work lives (launch scheduling, submission lifecycle, payments, SEO, search, claims, sponsor placements, relaunches, etc.). Services compose repositories + validators and own all rules.
- `http/app-error.ts`, `http/response.ts` — typed errors and JSON response helpers used by route handlers. Throw `AppError` from services; convert to responses at the route boundary.
- `auth/session.ts`, `auth/request-context.ts` — Better Auth session resolution and per-request context. Route handlers use these instead of touching Better Auth directly.
- `email/transactional.ts` — Resend transactional sends.
- `cloudinary.ts`, `uploads/` — Cloudinary upload + cleanup. Files only upload on draft save; failed persistence triggers compensation cleanup. Listing edits delete replaced media after a successful update.
- `seo/` — canonical/OG/Twitter metadata builders for tool pages.
- `cache/` — caching helpers for catalog/SEO data.

App Router code in `src/app/` should stay thin: validate with `validators/`, call into `services/`, format with `http/response.ts`. Don't put business logic in route handlers or page components.

### Submissions and launches (the core domain)

A `Submission` is the founder's draft. It has a `kind` of `LISTING_ONLY`, `FREE_LAUNCH`, or `FEATURED_LAUNCH`, and progresses through draft → submitted → approved/rejected. Approval (or successful Polar payment for `FEATURED_LAUNCH`) materializes a `Tool` and, for launches, schedules a `Launch` row.

- Free launches: gated by **badge verification**. The verifier fetches the founder's submitted website and looks for `data-shipboost-badge="free-launch"` (also checked in same-origin scripts — see commit `9486df4`). They land in the next available daily slot.
- Featured launches: founder picks a preferred date, app creates a Polar checkout, `order.paid` webhook auto-approves and schedules.
- Publishing: `Launch` rows go live through the cron route, not on a timer in-process.
- Launch boards are **gated by go-live countdown** (commit `bcebf06`); when reading/altering board logic, check the gate.

When changing submission flows, look at the matching `*-service.ts` file and its `*.test.ts` siblings — most flows have direct tests.

### Auth

Better Auth with the Prisma adapter. Sessions are server-side; admin role is a column promoted via `auth:promote-admin`. There is a `prisma/better-auth.generated.prisma` and a `schema.prisma.before-auth` snapshot — Better Auth owns part of the schema, so when editing `schema.prisma` be aware that auth tables are generated/managed.

### Tests

Vitest with `vite-tsconfig-paths` (so `@/*` works in tests). Component tests under `src/components/**/*.test.tsx` get jsdom; everything else runs in node. Setup is just `@testing-library/jest-dom/vitest`. Service tests sit next to their service file (`*.test.ts` in `src/server/services/`) — follow that convention.

### Path alias

`@/*` → `src/*` (configured in `tsconfig.json` and picked up by Vitest). Use it consistently.

### Security headers and images

Global security headers (CSP-adjacent: `X-Frame-Options: DENY`, `Permissions-Policy`, `Cross-Origin-Opener-Policy: same-origin-allow-popups`, etc.) are set in `next.config.ts`. `next/image` `remotePatterns` are wide-open (`**`) to support arbitrary tool/screenshot hosts — keep that in mind before tightening.

## Docs worth reading

- `docs/seo-registry.md` — canonical/OG behavior for tool pages
- `docs/tag-taxonomy.md` — tag system and the `tags:sync` script
- `docs/performance-baseline.md`, `docs/security-headers-improvement-plan.md`, `docs/deploy-digitalocean-app-platform.md` — current targets/plans
- `docs/superpowers/plans/`, `docs/superpowers/specs/` — in-progress feature plans/specs
