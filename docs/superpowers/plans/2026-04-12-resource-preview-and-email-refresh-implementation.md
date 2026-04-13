# Resource Preview And Email Refresh Implementation Plan

> **For agentic workers:** Use `superpowers:executing-plans` or execute this plan inline task-by-task. Track progress with the checkbox steps below.

**Goal:** Convert `/resources/startup-directories` from a redirect-first gated route into a preview-first public resource page, add a dedicated directories-access email, and refresh transactional email styling/copy to the current ShipBoost theme.

**Architecture:** Keep Better Auth magic-link as the only auth mechanism. Split email templates by intent instead of by auth system. Render the resource route in two states: signed-out preview with compact unlock panel, and signed-in full table.

**Tech Stack:** Next.js App Router, React, TypeScript, Better Auth, Resend, Vitest, Testing Library, Tailwind CSS.

---

## File Structure

### Resource page

- Modify: `src/app/resources/startup-directories/page.tsx`
  - Remove the signed-out redirect and render preview/full states.
- Modify: `src/components/resources/startup-directories-resource.tsx`
  - Add preview mode support and Reddit exclusion in preview.
- Add: `src/components/resources/resource-unlock-panel.tsx`
  - Compact resource-specific unlock form and messaging.
- Add or modify tests for preview behavior.

### Lead magnet flow

- Modify: `src/components/public/home-lead-magnet-form.tsx`
  - Keep lead capture, but route email fulfillment through the dedicated directories-access flow and clearer copy.
- Modify: `src/components/public/home-lead-magnet-form.test.tsx`
  - Cover the dedicated resource-access flow.

### Email system

- Modify: `src/server/email/transactional.ts`
  - Introduce shared updated visual shell.
  - Split sign-in email and directories-access email.
- Modify: `src/lib/auth.ts`
  - Ensure normal auth sign-in uses the generic sign-in email helper.
- Add any new email-focused tests.

---

## Task 1: Convert the resource page to preview-first behavior

**Files:**
- Modify: `src/app/resources/startup-directories/page.tsx`
- Modify: `src/components/resources/startup-directories-resource.tsx`
- Add: `src/components/resources/resource-unlock-panel.tsx`

- [ ] Update `page.tsx` so it loads the session and renders:
  - full resource when signed in
  - preview plus unlock panel when signed out

- [ ] Add a preview mode prop to `StartupDirectoriesResource`
  - limit preview rows to `12`
  - exclude all `reddit.com` rows in preview
  - keep full rows for signed-in users

- [ ] Build `resource-unlock-panel.tsx`
  - email input
  - resource-specific CTA
  - inline success and error states
  - reusable enough for this resource, but not a generic site-wide promo block

- [ ] Verify the signed-out page no longer redirects.

**Verification:**
- visit `/resources/startup-directories` signed out
- confirm preview rows render
- confirm no Reddit rows appear in preview
- confirm signed-in users still see the full table

---

## Task 2: Split directories access email from generic sign-in email

**Files:**
- Modify: `src/server/email/transactional.ts`
- Modify: `src/lib/auth.ts`

- [ ] Refactor the transactional email renderer to use the current ShipBoost theme
  - shared header/footer
  - updated button styling
  - updated spacing and copy rhythm

- [ ] Rename or add the generic auth email helper
  - `sendMagicLinkSignInEmailMessage(...)`
  - used only for `/sign-in` and generic auth entry points

- [ ] Add `sendDirectoriesAccessEmailMessage(...)`
  - subject and CTA specific to the startup directories resource
  - message framed as resource access, not generic sign-in

- [ ] Update `auth.ts` so Better Auth continues using the generic sign-in email helper by default.

**Verification:**
- direct `/sign-in` magic-link request sends the generic sign-in email
- lead-magnet/resource unlock flow sends the directories-access email

---

## Task 3: Update homepage lead magnet and resource unlock flows

**Files:**
- Modify: `src/components/public/home-lead-magnet-form.tsx`
- Modify: `src/components/public/home-lead-magnet-form.test.tsx`
- Modify: `src/components/resources/resource-unlock-panel.tsx`

- [ ] Keep `/api/leads` as the first step in both flows.
- [ ] After successful lead capture, trigger the dedicated directories-access email path.
- [ ] Ensure success messaging is explicit and visible:
  - homepage: access link copy
  - resource page: compact unlock-panel success state

- [ ] Ensure errors distinguish between:
  - failed lead capture
  - lead captured but access email failed

**Verification:**
- homepage flow captures lead first, then sends directories-access email
- resource unlock panel does the same
- success/error states remain visible after submission

---

## Task 4: Add tests for preview mode and email intent split

**Files:**
- Modify or add:
  - `src/components/resources/startup-directories-resource.test.tsx`
  - `src/components/public/home-lead-magnet-form.test.tsx`
  - email-focused tests near transactional helpers if the repo already follows that pattern

- [ ] Add a test that preview mode excludes `reddit.com`
- [ ] Add a test that preview mode limits rows
- [ ] Add a test that homepage lead magnet uses the directories-access flow
- [ ] Add a test that auth-form sign-in still uses the generic sign-in flow

**Verification command:**
- `npm run test -- src/components/resources/startup-directories-resource.test.tsx src/components/public/home-lead-magnet-form.test.tsx src/components/auth/auth-form.test.tsx`

---

## Task 5: Final verification and rollout notes

- [ ] Run `npx tsc --noEmit`
- [ ] Run the focused test suite
- [ ] Manually verify:
  - signed-out preview page
  - signed-in full page
  - homepage lead magnet submission
  - `/sign-in` magic-link submission

- [ ] Confirm env requirements are documented for public rollout:
  - verified Resend sending domain
  - `RESEND_FROM_TRANSACTIONAL` on that domain
  - real `BETTER_AUTH_URL`
  - real `NEXT_PUBLIC_APP_URL`

## Rollout Notes

- Local testing with `onboarding@resend.dev` is limited to the Resend account owner's email.
- Public rollout is not complete until Resend uses a verified domain sender.
- The separate Resend contact-sync error (`One or more properties do not exist`) should be handled as a follow-up cleanup if it is still present after this slice.

