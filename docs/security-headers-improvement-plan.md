# ShipBoost Security Headers Audit And Improvement Plan

Date: 2026-05-01

## Implementation Status

Safe baseline implemented in `next.config.ts`:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- restrictive `Permissions-Policy`
- `Cross-Origin-Opener-Policy: same-origin-allow-popups`
- `X-DNS-Prefetch-Control: on`
- `poweredByHeader: false`

Not implemented yet:

- HSTS, pending subdomain/HTTPS readiness confirmation.
- CSP, pending report-only rollout.
- COEP/CORP, intentionally deferred to avoid breaking cross-origin assets.

## Current Audit Summary

Live checks against `https://shipboost.io/`, `https://shipboost.io/sign-in`, `https://www.shipboost.io/`, and `http://shipboost.io/` show that production is behind Cloudflare and DigitalOcean App Platform. HTTP correctly redirects to HTTPS, and `www.shipboost.io` redirects to the apex domain. The HTTPS responses currently lack the core app security headers that scanners such as securityheaders.com expect.

Observed production gaps:

- No `Content-Security-Policy`
- No `Strict-Transport-Security`
- No `X-Content-Type-Options`
- No `Referrer-Policy`
- No `Permissions-Policy`
- No `X-Frame-Options`
- No `Cross-Origin-Opener-Policy`
- `X-Powered-By: Next.js` is exposed

## Scanner Finding Coverage

This plan covers the May 1, 2026 SecurityHeaders.com report for `https://shipboost.io/`.

| Report item | Covered by plan | Planned value / action |
| --- | --- | --- |
| `Strict-Transport-Security` missing | Yes | Add `Strict-Transport-Security: max-age=31536000; includeSubDomains` after confirming all subdomains are HTTPS-capable. Consider `preload` only later. |
| `Content-Security-Policy` missing | Yes | Start with `Content-Security-Policy-Report-Only`, then enforce CSP after analytics, auth, images, and payment flows are verified. |
| `X-Frame-Options` missing | Yes | Add `X-Frame-Options: DENY`. The scanner recommends `SAMEORIGIN`; `DENY` is stricter and appropriate unless ShipBoost needs to be embedded in same-origin frames. |
| `X-Content-Type-Options` missing | Yes | Add `X-Content-Type-Options: nosniff`. |
| `Referrer-Policy` missing | Yes | Add `Referrer-Policy: strict-origin-when-cross-origin`. |
| `Permissions-Policy` missing | Yes | Add a restrictive policy disabling unused browser APIs such as camera, microphone, geolocation, payment, USB, serial, Bluetooth, and browsing topics. |
| Upcoming `Cross-Origin-Embedder-Policy` | Deferred | Do not enable globally yet; COEP can break third-party images/scripts unless every cross-origin asset sends compatible CORS/CORP headers. |
| Upcoming `Cross-Origin-Opener-Policy` | Yes | Add `Cross-Origin-Opener-Policy: same-origin-allow-popups` first, then consider `same-origin` after Google auth and payment flows are verified. |
| Upcoming `Cross-Origin-Resource-Policy` | Deferred | Consider `Cross-Origin-Resource-Policy: same-origin` for app-owned static/API responses later, but avoid a blind global rollout because the directory intentionally displays cross-origin media. |
| `x-powered-by: Next.js` exposed | Yes | Set `poweredByHeader: false` in `next.config.ts`. |
| `server: cloudflare` exposed | Acknowledged | Cloudflare controls this. It is generally acceptable and not a core grade blocker compared with the missing browser security headers. |

Codebase findings:

- `next.config.ts` has redirects and image config only; there is no `headers()` policy.
- `poweredByHeader` is not disabled.
- `images.remotePatterns` currently allows all HTTP and HTTPS hosts. This is operationally convenient for a directory, but it keeps the image optimizer surface very broad and permits insecure HTTP image origins.
- The app uses third-party browser services that must be represented in CSP:
  - Google Analytics via `https://www.googletagmanager.com`
  - Google Analytics collection endpoints such as `https://www.google-analytics.com`, `https://region1.google-analytics.com`, and `https://stats.g.doubleclick.net`
  - Umami via `https://cloud.umami.is`
  - PostHog via `POSTHOG_HOST`, production example `https://us.i.posthog.com`
  - Cloudinary for uploaded media
- The app includes inline analytics initialization through `next/script`, so a strict CSP needs either nonce support or a short interim use of `'unsafe-inline'`.

## Target

Improve the scanner grade without breaking authentication, analytics, uploads, payment redirects, SEO pages, static assets, external badges, public media, or Next.js runtime behavior. Feature preservation is the primary constraint; the grade improvement should be staged so risky headers are observed before they are enforced.

Security target:

- Set all standard browser hardening headers globally.
- Use CSP in report-only mode first, then enforce after fixing violations.
- Keep third-party allowlists explicit.
- Remove insecure image-origin allowances where possible.
- Put verification into a repeatable command/checklist so regressions are easy to catch.

## Feature Preservation Rules

Do not ship a security-header change that has not been checked against the product flows ShipBoost depends on.

Non-negotiable flows to preserve:

- Public homepage, launch boards, category pages, tag pages, best pages, alternatives pages, tool pages, blog pages, and SEO metadata.
- External product logos, screenshots, blog cover images, Cloudinary-hosted uploads, and public badge images.
- Email/password sign-up, sign-in, verification, magic link, forgot-password, reset-password, and Google sign-in.
- Founder dashboard, tool submission, image upload, launch scheduling, badge-copy flow, and listing claim flow.
- Admin dashboard, submission review, catalog editing, blog editing, sponsor placement management, and launch operations.
- Dodo checkout redirects and Dodo webhook handling.
- Google Analytics, Umami, and PostHog on public routes where they are intentionally enabled.
- Existing Cloudflare and DigitalOcean routing, including apex and `www` behavior.

Rollout guardrails:

- Add low-risk static headers first.
- Put CSP in `Content-Security-Policy-Report-Only` before enforcement.
- Do not enable `Cross-Origin-Embedder-Policy` globally in this phase.
- Do not enable a strict global `Cross-Origin-Resource-Policy` in this phase.
- Do not add HSTS `preload` until all subdomains are known, HTTPS-only, and intentionally ready for preload.
- Keep a one-line rollback path for every change, usually reverting the `next.config.ts` header block or switching CSP back to report-only.

## Recommended Header Baseline

Implement global response headers in `next.config.ts` first. This is the fastest low-risk improvement because it applies to app routes, pages, redirects, and API routes served by Next.js.

Recommended low-risk baseline:

```ts
const securityHeaders = [
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Permissions-Policy",
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), serial=(), bluetooth=(), browsing-topics=(), clipboard-read=(), clipboard-write=(self)",
  },
  {
    key: "Cross-Origin-Opener-Policy",
    value: "same-origin-allow-popups",
  },
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];
```

Notes:

- Use `same-origin-allow-popups` instead of `same-origin` until Google auth and payment redirects are manually verified. If social auth is confirmed to use only full-page redirects, consider upgrading to `same-origin`.
- `X-Frame-Options` is redundant with CSP `frame-ancestors`, but still useful for older clients and scanner coverage.
- The `Permissions-Policy` keeps `clipboard-write=(self)` because the app has a badge-copy flow that uses `navigator.clipboard.writeText`.
- Disabling `payment=()` is safe for the current Dodo redirect checkout model. If a browser-native `PaymentRequest` flow is added later, update this policy.

Also set:

```ts
const nextConfig: NextConfig = {
  poweredByHeader: false,
  // existing redirects/images...
};
```

Add HSTS after confirming subdomain readiness:

```ts
{
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains",
}
```

HSTS deployment rule:

- First confirm every active and planned subdomain under `shipboost.io` is HTTPS-capable.
- Confirm Cloudflare SSL mode is Full Strict or equivalent.
- Confirm `http://shipboost.io` and `http://www.shipboost.io` redirect cleanly to HTTPS.
- Add `includeSubDomains` only after that confirmation.
- Do not add `preload` in the first pass.

## CSP Rollout

### Phase 1: Report-Only CSP

Add `Content-Security-Policy-Report-Only` first and run it for at least one production traffic window. This catches the real hosts used by analytics, fonts, images, Next.js chunks, Cloudinary media, badges, and OAuth redirects without breaking users.

Initial report-only policy:

```text
default-src 'self';
base-uri 'self';
object-src 'none';
frame-ancestors 'none';
form-action 'self';
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://cloud.umami.is;
style-src 'self' 'unsafe-inline';
img-src 'self' https: data: blob:;
font-src 'self' data:;
connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://analytics.google.com https://stats.g.doubleclick.net https://cloud.umami.is https://us.i.posthog.com;
frame-src 'self';
worker-src 'self' blob:;
manifest-src 'self';
media-src 'self' https: data: blob:;
upgrade-insecure-requests;
```

Phase 1 tradeoff:

- This should improve security posture but still permits inline scripts and broad HTTPS images.
- The broad `img-src https:` matches the current product-directory reality and avoids breaking externally hosted logos, badges, and screenshots.
- If `POSTHOG_HOST` differs from `https://us.i.posthog.com`, add the actual host.
- Do not enforce CSP until browser checks confirm no important public, founder, admin, analytics, upload, auth, or payment flow is blocked.

### Phase 2: Enforced CSP

After report-only violations are reviewed, switch to `Content-Security-Policy` enforcement.

Keep enforcement pragmatic:

- Keep `'unsafe-inline'` for `script-src` only if nonce implementation is not ready.
- Keep `style-src 'unsafe-inline'` if React/Next/client styling emits inline styles during UI flows.
- Keep `img-src https:` until image loading is routed through a controlled media proxy or all external image hosts are known.
- Keep enforcement reversible: if production reports show blocked functionality, immediately revert to `Content-Security-Policy-Report-Only`.

### Phase 3: Strict CSP With Nonces

For a stronger long-term policy, add request-scoped CSP nonces through Next middleware and pass the nonce to `next/script` usage.

Target script policy:

```text
script-src 'self' 'nonce-{requestNonce}' https://www.googletagmanager.com https://cloud.umami.is;
```

Implementation considerations:

- Generate a per-request nonce in middleware.
- Add it to the CSP header and expose it to server rendering through request headers.
- Pass the nonce into `next/script` analytics components.
- Verify Next.js App Router streaming, static pages, and client transitions before enforcing.

## Image Origin Hardening

Current config:

```ts
images: {
  remotePatterns: [
    { protocol: "https", hostname: "**", pathname: "/**" },
    { protocol: "http", hostname: "**", pathname: "/**" },
  ],
}
```

Recommended sequence:

1. Remove the universal `http` pattern immediately unless there is a confirmed production need for HTTP-only images.
2. Prefer Cloudinary-hosted uploaded media for founder logos, screenshots, and blog images.
3. For third-party product logos, either:
   - use plain `<img>` for untrusted remote image URLs where optimization is not needed, or
   - build a server-side image proxy with SSRF protections, size limits, content-type validation, and domain allow/deny rules.
4. Once the data model is consistently Cloudinary-backed, restrict Next image optimization to:
   - `res.cloudinary.com`
   - the app domain
   - a small explicit badge/logo allowlist if still needed.

## Cloudflare And DigitalOcean Settings

Keep the app-level headers in Next.js as the source of truth. Use Cloudflare/DigitalOcean only for edge-specific hardening and redirects.

Recommended Cloudflare checks:

- SSL/TLS mode is Full or Full Strict.
- Always Use HTTPS is enabled.
- Automatic HTTPS Rewrites is enabled only if it does not mask mixed-content bugs.
- HSTS is either disabled at Cloudflare while the app controls it, or configured identically. Avoid contradictory HSTS values.
- If using Cloudflare Transform Rules for headers, ensure they do not overwrite app headers accidentally.

Recommended DigitalOcean checks:

- `shipboost.io` is the primary domain.
- `www.shipboost.io` continues to redirect to `https://shipboost.io/`.
- No platform-level header rule conflicts with Next.js.

## Test Plan

Run local build validation:

```bash
npm run lint
npm run build
```

Run local header validation against a production build:

```bash
npm run build
npm run start
curl -sSI http://localhost:3000/
curl -sSI http://localhost:3000/sign-in
curl -sSI http://localhost:3000/api/leads
```

Run production validation after deploy:

```bash
curl -sSI https://shipboost.io/
curl -sSI https://shipboost.io/sign-in
curl -sSI https://www.shipboost.io/
curl -sSI http://shipboost.io/
```

Manual browser checks after CSP changes:

- Homepage renders and client navigation works.
- Sign up, sign in, magic link, password reset, and Google sign-in work.
- Founder dashboard loads.
- Product submission media upload works.
- Tool pages render Cloudinary/external images.
- Blog pages render cover images.
- Dodo checkout redirect works.
- PostHog, Google Analytics, and Umami requests are either successful or intentionally disabled on private routes.
- Browser console has no CSP enforcement errors.

External scanner checks:

- securityheaders.com
- Mozilla Observatory

## Implementation Order

1. Add non-CSP security headers and disable `X-Powered-By`.
2. Verify public, auth, founder, admin, analytics, upload, and checkout flows.
3. Confirm all `shipboost.io` subdomains are HTTPS-ready, then add HSTS without `preload`.
4. Deploy and verify scanner grade improves.
5. Add CSP in report-only mode.
6. Review CSP violation reports and browser console output.
7. Enforce CSP only after the report-only window shows no feature-breaking violations.
8. Add nonce-based CSP to remove `'unsafe-inline'` from `script-src`.
9. Remove universal HTTP image optimization only if production data permits it.
10. Tighten image handling and `img-src` gradually.
11. Consider HSTS preload only after all subdomains are confirmed HTTPS-only and the domain is ready for browser preload submission.

## Rollback Plan

If a feature breaks after deployment:

1. Revert CSP enforcement to `Content-Security-Policy-Report-Only`, or remove the CSP header temporarily.
2. If auth or checkout popups/redirects break, change `Cross-Origin-Opener-Policy` back from any stricter value to `same-origin-allow-popups`.
3. If media breaks, restore broader `img-src` and Next image remote patterns while investigating the blocked origin.
4. If a subdomain breaks after HSTS, fix HTTPS on that subdomain immediately. Avoid HSTS preload until this risk is fully eliminated.
5. Redeploy, then rerun the production curl checks and manual browser checks.

## Risk Register

- CSP can break analytics, OAuth, client navigation, Next.js scripts, or image rendering if enforced too early.
- HSTS with `includeSubDomains` can break any non-HTTPS subdomain.
- HSTS preload is difficult to undo and should be treated as a separate production readiness decision.
- Tightening image hosts too aggressively can break directory logos/screenshots because the app currently handles many third-party product images.
- `Cross-Origin-Opener-Policy: same-origin` can interfere with popup-based auth or payment flows; start with `same-origin-allow-popups`.
