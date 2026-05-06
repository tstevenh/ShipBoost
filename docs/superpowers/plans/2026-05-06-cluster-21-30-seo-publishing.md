# Cluster 21-30 SEO Publishing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish all cluster 21-30 buyer-intent SEO pages through ShipBoost's existing `/best` and `/alternatives` systems.

**Architecture:** Extend the code-managed SEO registries without changing route infrastructure. Best-of pages use the existing `BestPageEntry` model in `src/server/seo/best-pages.ts`; alternatives pages use the existing `AlternativesSeoEntry` model in `src/server/seo/registry.ts`.

**Tech Stack:** Next.js App Router, TypeScript, Prisma-backed public tool loader, Vitest.

---

### Task 1: Verify Tool Slugs

**Files:**
- Read: `ShipBoost-Docs/SEO-Plan/Cluster 21-30/cluster-21-30-anchor-tools-enriched-master.csv`
- Read: `my-app/src/server/seo/best-pages.ts`
- Read: `my-app/src/server/seo/registry.ts`

- [ ] Query approved published tools from the DB.
- [ ] Map planned anchor-tool names to actual DB slugs.
- [ ] Avoid confirmed duplicates listed in the Cluster 21-30 production plan.

### Task 2: Add Cluster 21-30 Best Pages

**Files:**
- Modify: `my-app/src/server/seo/best-pages.ts`
- Modify: `my-app/src/server/seo/best-pages.test.ts`

- [ ] Add reusable labels for cluster 21-30 tools.
- [ ] Add best-of pages for security/compliance, affiliate/referral, feedback/roadmapping, documentation/wiki, AI writing, team communication, e-signature/proposals, BI/dashboard, customer success, and cloud storage/backup.
- [ ] Add the new clusters to `bestHubSections`.
- [ ] Add tests requiring the new best-page slugs and hub sections.

### Task 3: Add Cluster 21-30 Alternatives Pages

**Files:**
- Modify: `my-app/src/server/seo/registry.ts`
- Modify: `my-app/src/server/seo/registry.test.ts`

- [ ] Add alternatives entries for the planned anchor tools with at least 6 compared tools each.
- [ ] Add tests requiring the new alternatives slugs.

### Task 4: Verify Publishing

**Files:**
- Verify: `my-app/src/server/seo/best-pages.test.ts`
- Verify: `my-app/src/server/seo/registry.test.ts`

- [ ] Run focused registry tests.
- [ ] Run a DB-backed page-resolution check for every new `/best` and `/alternatives` slug.
- [ ] Run type/lint/build verification if focused checks pass.
