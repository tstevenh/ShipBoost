# About Page Founder Story Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite `/about` into a founder-voice, entity-defining page that explains why ShipBoost exists, what problem it solves, and who it serves.

**Architecture:** Keep the existing `ContentPageShell` and replace the short positioning sections with a long-form founder narrative. Update page metadata to better reflect founder story, product story, and problem framing while preserving existing schema wiring.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, existing marketing content components

---

### Task 1: Rewrite the About page content

**Files:**
- Modify: `src/app/about/page.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Rewrite metadata to match the new entity-focused page**

Update the page metadata copy in `src/app/about/page.tsx` so the title and description reflect founder story, product story, and problem framing.

- [ ] **Step 2: Replace the short section blocks with long-form founder-voice content**

Keep `ContentPageShell`, but rewrite the page body into:

1. founder-story opener
2. problem framing
3. product story and why ShipBoost is built this way
4. who ShipBoost is for
5. founder signoff with X link

Include editorial internal links to:

- `/how-it-works`
- `/pricing`
- `/submit`

- [ ] **Step 3: Add founder signoff block**

Add a closing section that includes:

- founder-voice signoff
- founder title
- X link: `https://x.com/Timhrt_`

- [ ] **Step 4: Verify the page compiles cleanly**

Run:

```bash
npx tsc --noEmit
```

Expected: command exits successfully with no TypeScript errors.

- [ ] **Step 5: Commit**

```bash
git add src/app/about/page.tsx docs/superpowers/plans/2026-04-12-about-page-founder-story-implementation.md
git commit -m "feat: rewrite about page in founder voice"
```
