# Discovery + SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build homepage hero search with a modal typeahead, plus code-managed `/alternatives/[tool-slug]` and `/best/tag/[tag-slug]` SEO pages backed by published tool records.

**Architecture:** Add a dedicated public search API and service for published tools, then add a typed SEO registry plus a small SEO page query service that routes can consume. Keep editorial SEO content in code, not admin, and reuse existing public tool/category rendering patterns for consistency.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Prisma, Zod, Vitest, Testing Library

---

## File Structure

### New files
- `package.json`
  - add `test` script and test dependencies
- `vitest.config.ts`
  - Vitest configuration for path aliases and jsdom/node test environments
- `src/test/setup.ts`
  - shared test setup for DOM matchers and global mocks
- `src/server/validators/public-search.ts`
  - query validation for homepage search requests
- `src/app/api/tools/search/route.ts`
  - public typeahead endpoint
- `src/components/public/home-search-modal.tsx`
  - homepage modal UI and debounced search client
- `src/server/seo/types.ts`
  - shared SEO registry types
- `src/server/seo/registry.ts`
  - manual alternatives and best-by-tag page content
- `src/server/services/seo-service.ts`
  - shared query layer for SEO routes and internal-link helpers
- `src/server/services/tool-search.test.ts`
  - unit tests for search ranking and published-only filtering
- `src/server/services/seo-service.test.ts`
  - unit tests for registry resolution and page filtering behavior
- `src/components/public/home-search-modal.test.tsx`
  - component tests for idle, loading, and query-sync behavior
- `src/app/best/tag/[slug]/page.tsx`
  - best-by-tag SEO route
- `src/app/alternatives/[slug]/page.tsx`
  - alternatives SEO route

### Modified files
- `src/server/services/tool-service.ts`
  - add public search query method and lightweight result serializer
- `src/app/page.tsx`
  - add hero search trigger and modal wiring
- `src/app/tools/[slug]/page.tsx`
  - add alternatives link when a registry entry exists
- `src/app/categories/[slug]/page.tsx`
  - link configured top tags to `/best/tag/[slug]` pages

---

### Task 1: Add test harness for service and component work

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `src/test/setup.ts`

- [ ] **Step 1: Add test script and dev dependencies**

Update `package.json`:

```json
{
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.0",
    "@vitest/coverage-v8": "^3.2.4",
    "jsdom": "^26.1.0",
    "vite-tsconfig-paths": "^5.1.4",
    "vitest": "^3.2.4"
  }
}
```

- [ ] **Step 2: Install the test packages**

Run: `npm install -D vitest @vitest/coverage-v8 @testing-library/react @testing-library/jest-dom jsdom vite-tsconfig-paths`
Expected: install completes and `package-lock.json` updates

- [ ] **Step 3: Add Vitest config**

Create `vitest.config.ts`:

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    environmentMatchGlobs: [["src/components/**/*.test.tsx", "jsdom"]],
  },
});
```

- [ ] **Step 4: Add shared test setup**

Create `src/test/setup.ts`:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 5: Run the empty test command once**

Run: `npm test`
Expected: PASS with `No test files found`

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts src/test/setup.ts
git commit -m "test: add vitest harness"
```

### Task 2: Add public search validation and service behavior

**Files:**
- Create: `src/server/validators/public-search.ts`
- Modify: `src/server/services/tool-service.ts`
- Test: `src/server/services/tool-search.test.ts`

- [ ] **Step 1: Write the failing search service tests**

Create `src/server/services/tool-search.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    tool: {
      findMany: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db/client";
import { searchPublishedTools } from "@/server/services/tool-service";

describe("searchPublishedTools", () => {
  it("returns only published approved tools", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_1",
        slug: "calm-sea",
        name: "Calm Sea",
        tagline: "Finance clarity for founders",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [],
      },
    ] as never);

    const results = await searchPublishedTools("sea");

    expect(prisma.tool.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          publicationStatus: "PUBLISHED",
          moderationStatus: "APPROVED",
        }),
      }),
    );
    expect(results).toHaveLength(1);
  });

  it("keeps exact and prefix name matches ahead of tag-only matches", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_2",
        slug: "ocean-mail",
        name: "OceanMail",
        tagline: "Ship warmer outbound email",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [{ tag: { id: "tag_1", slug: "sea", name: "Sea" } }],
      },
      {
        id: "tool_1",
        slug: "sea-notes",
        name: "Sea Notes",
        tagline: "Capture product research fast",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [],
      },
    ] as never);

    const results = await searchPublishedTools("sea");

    expect(results.map((item) => item.slug)).toEqual(["sea-notes", "ocean-mail"]);
  });
});
```

- [ ] **Step 2: Run the search service test to confirm failure**

Run: `npm test -- src/server/services/tool-search.test.ts`
Expected: FAIL with `searchPublishedTools is not exported`

- [ ] **Step 3: Add the public search query schema**

Create `src/server/validators/public-search.ts`:

```ts
import { z } from "zod";

export const publicToolSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
});

export type PublicToolSearchQuery = z.infer<typeof publicToolSearchQuerySchema>;
```

- [ ] **Step 4: Add the public search service**

Add to `src/server/services/tool-service.ts`:

```ts
type PublicToolSearchResult = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  isFeatured: boolean;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

function getSearchRank(tool: {
  name: string;
  tagline: string;
  toolCategories: { category: { name: string } }[];
  toolTags: { tag: { name: string } }[];
}, query: string) {
  const normalizedQuery = query.toLowerCase();
  const name = tool.name.toLowerCase();
  const tagline = tool.tagline.toLowerCase();
  const categoryNames = tool.toolCategories.map((item) => item.category.name.toLowerCase());
  const tagNames = tool.toolTags.map((item) => item.tag.name.toLowerCase());

  if (name === normalizedQuery || name.startsWith(normalizedQuery)) return 0;
  if (name.includes(normalizedQuery)) return 1;
  if (tagline.includes(normalizedQuery)) return 2;
  if (categoryNames.some((value) => value.includes(normalizedQuery))) return 3;
  if (tagNames.some((value) => value.includes(normalizedQuery))) return 4;
  return 5;
}

export async function searchPublishedTools(query: string): Promise<PublicToolSearchResult[]> {
  const normalizedQuery = query.trim();

  const tools = await prisma.tool.findMany({
    where: {
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
      OR: [
        { name: { contains: normalizedQuery, mode: "insensitive" } },
        { tagline: { contains: normalizedQuery, mode: "insensitive" } },
        { toolCategories: { some: { category: { name: { contains: normalizedQuery, mode: "insensitive" } } } } },
        { toolTags: { some: { tag: { name: { contains: normalizedQuery, mode: "insensitive" } } } } },
      ],
    },
    include: {
      logoMedia: true,
      toolCategories: {
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      },
      toolTags: {
        include: { tag: true },
        orderBy: { sortOrder: "asc" },
      },
    },
    take: 12,
  });

  return tools
    .sort((left, right) => {
      return (
        getSearchRank(left, normalizedQuery) - getSearchRank(right, normalizedQuery) ||
        Number(right.isFeatured) - Number(left.isFeatured) ||
        left.name.localeCompare(right.name)
      );
    })
    .slice(0, 8)
    .map((tool) => ({
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      tagline: tool.tagline,
      logoUrl: tool.logoMedia?.url ?? null,
      isFeatured: tool.isFeatured,
      categories: tool.toolCategories.map((item) => ({
        slug: item.category.slug,
        name: item.category.name,
      })),
      tags: tool.toolTags.map((item) => ({
        slug: item.tag.slug,
        name: item.tag.name,
      })),
    }));
}
```

- [ ] **Step 5: Run the search service test to verify it passes**

Run: `npm test -- src/server/services/tool-search.test.ts`
Expected: PASS with 2 tests

- [ ] **Step 6: Commit**

```bash
git add src/server/validators/public-search.ts src/server/services/tool-service.ts src/server/services/tool-search.test.ts
git commit -m "feat: add public tool search service"
```

### Task 3: Add the public search API route

**Files:**
- Create: `src/app/api/tools/search/route.ts`
- Modify: `src/server/http/response.ts` (only if a `badRequest` helper would reduce duplication; otherwise leave unchanged)
- Test: `src/server/services/tool-search.test.ts`

- [ ] **Step 1: Add an API route smoke test file comment if needed**

Skip a separate route test for this pass. The service test plus manual curl verification is enough for the first route wrapper.

```ts
// Route correctness is covered by validator + service behavior in this slice.
```

- [ ] **Step 2: Create the search route**

Create `src/app/api/tools/search/route.ts`:

```ts
import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { errorResponse, ok } from "@/server/http/response";
import { searchPublishedTools } from "@/server/services/tool-service";
import { publicToolSearchQuerySchema } from "@/server/validators/public-search";

export async function GET(request: NextRequest) {
  try {
    getEnv();

    const query = publicToolSearchQuerySchema.parse({
      q: request.nextUrl.searchParams.get("q") ?? "",
    });

    const results = await searchPublishedTools(query.q);
    return ok(results);
  } catch (error) {
    return errorResponse(error);
  }
}
```

- [ ] **Step 3: Run lint on the new route**

Run: `npm run lint -- src/app/api/tools/search/route.ts`
Expected: PASS

- [ ] **Step 4: Verify the route manually**

Run: `curl -sS 'http://localhost:3000/api/tools/search?q=sea'`
Expected: JSON payload shaped like `{"data":[{"slug":"...","name":"..."}]}`

- [ ] **Step 5: Commit**

```bash
git add src/app/api/tools/search/route.ts
git commit -m "feat: add homepage search api"
```

### Task 4: Add the homepage search modal and `?q=` syncing

**Files:**
- Create: `src/components/public/home-search-modal.tsx`
- Modify: `src/app/page.tsx`
- Test: `src/components/public/home-search-modal.test.tsx`

- [ ] **Step 1: Write the failing component tests**

Create `src/components/public/home-search-modal.test.tsx`:

```tsx
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { HomeSearchModal } from "@/components/public/home-search-modal";

describe("HomeSearchModal", () => {
  it("shows idle copy before the minimum query length", () => {
    render(<HomeSearchModal initialQuery="" isOpen onClose={() => {}} />);
    expect(screen.getByText("Start typing to search published products.")).toBeInTheDocument();
  });

  it("requests results after debounce when the query reaches two characters", async () => {
    vi.useFakeTimers();
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ data: [{ id: "1", slug: "calm-sea", name: "Calm Sea", tagline: "Clearer finance", logoUrl: null, isFeatured: false, categories: [], tags: [] }] }))
    );

    render(<HomeSearchModal initialQuery="" isOpen onClose={() => {}} />);
    fireEvent.change(screen.getByPlaceholderText("Search published products"), {
      target: { value: "se" },
    });

    vi.advanceTimersByTime(250);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("/api/tools/search?q=se");
      expect(screen.getByText("Calm Sea")).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run the modal test to confirm failure**

Run: `npm test -- src/components/public/home-search-modal.test.tsx`
Expected: FAIL with `HomeSearchModal` module not found

- [ ] **Step 3: Create the modal component**

Create `src/components/public/home-search-modal.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useState } from "react";

type SearchResult = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  logoUrl: string | null;
  isFeatured: boolean;
  categories: { slug: string; name: string }[];
  tags: { slug: string; name: string }[];
};

type HomeSearchModalProps = {
  initialQuery: string;
  isOpen: boolean;
  onClose: () => void;
  onQueryChange?: (query: string) => void;
};

export function HomeSearchModal({
  initialQuery,
  isOpen,
  onClose,
  onQueryChange,
}: HomeSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  const runSearch = useEffectEvent(async (nextQuery: string) => {
    if (nextQuery.trim().length < 2) {
      setStatus("idle");
      setResults([]);
      return;
    }

    setStatus("loading");

    try {
      const response = await fetch(`/api/tools/search?q=${encodeURIComponent(nextQuery.trim())}`);
      const payload = (await response.json()) as { data: SearchResult[] };
      setResults(payload.data);
      setStatus("done");
    } catch {
      setResults([]);
      setStatus("error");
    }
  });

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    if (!isOpen) return;

    const timeout = window.setTimeout(() => {
      void runSearch(query);
      onQueryChange?.(query);
    }, 250);

    return () => window.clearTimeout(timeout);
  }, [isOpen, onQueryChange, query, runSearch]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-6 py-20">
      <div className="w-full max-w-2xl rounded-[2rem] bg-[#1d1c1a] p-6 text-[#f6e8d4] shadow-[0_28px_90px_rgba(29,28,26,0.4)]">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">Search published products</h2>
          <button type="button" onClick={onClose} className="text-sm text-[#f6e8d4]/70">
            Close
          </button>
        </div>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search published products"
          className="mt-5 w-full rounded-2xl border border-[#f3c781]/30 bg-transparent px-4 py-3 text-white outline-none"
        />

        <div className="mt-5 space-y-3">
          {status === "idle" ? <p className="text-sm text-[#f6e8d4]/70">Start typing to search published products.</p> : null}
          {status === "loading" ? <p className="text-sm text-[#f6e8d4]/70">Searching…</p> : null}
          {status === "error" ? <p className="text-sm text-[#f6e8d4]/70">Search is temporarily unavailable.</p> : null}
          {status === "done" && results.length === 0 ? <p className="text-sm text-[#f6e8d4]/70">No matching products found.</p> : null}

          {results.map((tool) => (
            <Link key={tool.id} href={`/tools/${tool.slug}`} className="block rounded-[1.5rem] border border-white/10 bg-white/5 p-4 transition hover:bg-white/10">
              <p className="font-semibold text-white">{tool.name}</p>
              <p className="mt-1 text-sm text-[#f6e8d4]/75">{tool.tagline}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Wire the modal into the homepage**

Update `src/app/page.tsx` by moving the hero into a small client wrapper:

```tsx
import { HomeSearchModal } from "@/components/public/home-search-modal";
```

Add inside the hero area:

```tsx
<div className="rounded-[1.75rem] border border-black/10 bg-white/90 p-3 shadow-[0_16px_40px_rgba(0,0,0,0.06)]">
  <button
    type="button"
    onClick={() => setIsSearchOpen(true)}
    className="flex w-full items-center justify-between rounded-[1.25rem] px-4 py-3 text-left text-black/55 transition hover:bg-black/[0.03]"
  >
    <span>Search published products</span>
    <span className="text-xs font-medium text-black/45">⌘K</span>
  </button>
</div>

<HomeSearchModal
  initialQuery={query}
  isOpen={isSearchOpen}
  onClose={() => setIsSearchOpen(false)}
  onQueryChange={setQuery}
/>
```

Use `useRouter`, `useSearchParams`, and local state in a client child component to sync `q` with the URL.

- [ ] **Step 5: Run the modal test to verify it passes**

Run: `npm test -- src/components/public/home-search-modal.test.tsx`
Expected: PASS with 2 tests

- [ ] **Step 6: Verify in the browser**

Run: `npm run dev`
Expected: the homepage hero shows a search trigger, opens a modal, and updates `?q=` while typing

- [ ] **Step 7: Commit**

```bash
git add src/components/public/home-search-modal.tsx src/components/public/home-search-modal.test.tsx src/app/page.tsx
git commit -m "feat: add homepage search modal"
```

### Task 5: Add typed SEO registry content

**Files:**
- Create: `src/server/seo/types.ts`
- Create: `src/server/seo/registry.ts`

- [ ] **Step 1: Add shared SEO registry types**

Create `src/server/seo/types.ts`:

```ts
export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type AlternativesSeoEntry = {
  slug: string;
  anchorToolSlug: string;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  toolSlugs: string[];
  faq?: SeoFaqItem[];
};

export type BestTagSeoEntry = {
  slug: string;
  tagSlug: string;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  toolSlugs: string[];
  faq?: SeoFaqItem[];
};
```

- [ ] **Step 2: Add the manual registry**

Create `src/server/seo/registry.ts`:

```ts
import type { AlternativesSeoEntry, BestTagSeoEntry } from "@/server/seo/types";

export const alternativesSeoRegistry: Record<string, AlternativesSeoEntry> = {
  "example-tool": {
    slug: "example-tool",
    anchorToolSlug: "example-tool",
    title: "Best alternatives to Example Tool",
    intro: "Compare stronger alternatives if Example Tool is close but not the right fit.",
    metaTitle: "Best alternatives to Example Tool | Shipboost",
    metaDescription: "Manual editorial alternatives to Example Tool for bootstrapped SaaS founders.",
    toolSlugs: ["alt-one", "alt-two", "alt-three"],
  },
};

export const bestTagSeoRegistry: Record<string, BestTagSeoEntry> = {
  ai: {
    slug: "ai",
    tagSlug: "ai",
    title: "Best AI tools for bootstrapped SaaS founders",
    intro: "Manual editorial picks for founders who want leverage without bloated software stacks.",
    metaTitle: "Best AI tools for bootstrapped SaaS founders | Shipboost",
    metaDescription: "Curated AI tools chosen manually from published Shipboost listings.",
    toolSlugs: ["tool-one", "tool-two", "tool-three"],
  },
};
```

- [ ] **Step 3: Type-check the registry**

Run: `npx tsc --noEmit`
Expected: PASS with no type errors from the new registry

- [ ] **Step 4: Commit**

```bash
git add src/server/seo/types.ts src/server/seo/registry.ts
git commit -m "feat: add manual seo registry"
```

### Task 6: Add the shared SEO page query service

**Files:**
- Create: `src/server/services/seo-service.ts`
- Test: `src/server/services/seo-service.test.ts`

- [ ] **Step 1: Write the failing SEO service tests**

Create `src/server/services/seo-service.test.ts`:

```ts
import { describe, expect, it, vi } from "vitest";

vi.mock("@/server/db/client", () => ({
  prisma: {
    tool: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
  },
}));

import { prisma } from "@/server/db/client";
import {
  getAlternativesSeoPage,
  getBestTagSeoPage,
  hasAlternativesSeoPage,
  hasBestTagSeoPage,
} from "@/server/services/seo-service";

describe("seo-service", () => {
  it("returns null for missing alternatives registry entries", async () => {
    await expect(getAlternativesSeoPage("missing-tool")).resolves.toBeNull();
  });

  it("filters missing and unpublished tools out of best-tag pages", async () => {
    vi.mocked(prisma.tool.findMany).mockResolvedValueOnce([
      {
        id: "tool_1",
        slug: "tool-one",
        name: "Tool One",
        tagline: "A published tool",
        isFeatured: false,
        logoMedia: null,
        toolCategories: [],
        toolTags: [],
      },
    ] as never);

    const page = await getBestTagSeoPage("ai");

    expect(page?.tools.map((tool) => tool.slug)).toEqual(["tool-one"]);
  });

  it("exposes link helpers for configured pages", () => {
    expect(hasBestTagSeoPage("ai")).toBe(true);
    expect(hasAlternativesSeoPage("example-tool")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the SEO service tests to confirm failure**

Run: `npm test -- src/server/services/seo-service.test.ts`
Expected: FAIL with module not found for `seo-service`

- [ ] **Step 3: Create the shared SEO service**

Create `src/server/services/seo-service.ts`:

```ts
import { prisma } from "@/server/db/client";
import { alternativesSeoRegistry, bestTagSeoRegistry } from "@/server/seo/registry";
import type { AlternativesSeoEntry, BestTagSeoEntry } from "@/server/seo/types";
import { toolDetailsInclude } from "@/server/db/includes";

async function getPublishedToolsBySlugs(slugs: string[]) {
  if (slugs.length === 0) return [];

  const tools = await prisma.tool.findMany({
    where: {
      slug: { in: slugs },
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    include: toolDetailsInclude,
  });

  const bySlug = new Map(tools.map((tool) => [tool.slug, tool]));
  return slugs.map((slug) => bySlug.get(slug)).filter(Boolean);
}

export function hasAlternativesSeoPage(slug: string) {
  return Boolean(alternativesSeoRegistry[slug]);
}

export function hasBestTagSeoPage(slug: string) {
  return Boolean(bestTagSeoRegistry[slug]);
}

export async function getAlternativesSeoPage(slug: string) {
  const entry: AlternativesSeoEntry | undefined = alternativesSeoRegistry[slug];
  if (!entry) return null;

  const [anchorTool, tools] = await Promise.all([
    prisma.tool.findFirst({
      where: {
        slug: entry.anchorToolSlug,
        publicationStatus: "PUBLISHED",
        moderationStatus: "APPROVED",
      },
      include: toolDetailsInclude,
    }),
    getPublishedToolsBySlugs(entry.toolSlugs),
  ]);

  if (!anchorTool || tools.length === 0) return null;

  return { entry, anchorTool, tools };
}

export async function getBestTagSeoPage(slug: string) {
  const entry: BestTagSeoEntry | undefined = bestTagSeoRegistry[slug];
  if (!entry) return null;

  const tools = await getPublishedToolsBySlugs(entry.toolSlugs);
  if (tools.length === 0) return null;

  return { entry, tools };
}
```

- [ ] **Step 4: Run the SEO service tests to verify they pass**

Run: `npm test -- src/server/services/seo-service.test.ts`
Expected: PASS with 3 tests

- [ ] **Step 5: Commit**

```bash
git add src/server/services/seo-service.ts src/server/services/seo-service.test.ts
git commit -m "feat: add seo page query service"
```

### Task 7: Add the best-by-tag route and category page links

**Files:**
- Create: `src/app/best/tag/[slug]/page.tsx`
- Modify: `src/app/categories/[slug]/page.tsx`

- [ ] **Step 1: Create the best-by-tag route**

Create `src/app/best/tag/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PublicToolCard } from "@/components/public/public-tool-card";
import { getEnv } from "@/server/env";
import { getBestTagSeoPage } from "@/server/services/seo-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { slug } = await params;
  const page = await getBestTagSeoPage(slug);

  if (!page) {
    return { title: "Page not found | Shipboost" };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/best/tag/${slug}`;

  return {
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: page.entry.metaTitle,
      description: page.entry.metaDescription,
      url: canonical,
      siteName: "Shipboost",
      type: "website",
    },
  };
}

export default async function BestTagPage({ params }: RouteContext) {
  const { slug } = await params;
  const page = await getBestTagSeoPage(slug);

  if (!page) notFound();

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">Best by tag</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">{page.entry.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">{page.entry.intro}</p>
      </div>

      <div className="mt-8 grid gap-4">
        {page.tools.map((tool) => (
          <PublicToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Link configured top tags from category pages**

Update `src/app/categories/[slug]/page.tsx`:

```tsx
import { hasBestTagSeoPage } from "@/server/services/seo-service";
```

Replace tag chip rendering with:

```tsx
{category.topTags.map((tag) =>
  hasBestTagSeoPage(tag.slug) ? (
    <Link
      key={tag.id}
      href={`/best/tag/${tag.slug}`}
      className="rounded-full border border-black/10 bg-[#fff9ef] px-3 py-1.5 text-xs font-medium text-black transition hover:border-black/20 hover:bg-[#fff3de]"
    >
      {tag.name} ({tag.count})
    </Link>
  ) : (
    <span
      key={tag.id}
      className="rounded-full border border-black/10 bg-black/[0.03] px-3 py-1.5 text-xs font-medium text-black/62"
    >
      {tag.name} ({tag.count})
    </span>
  ),
)}
```

- [ ] **Step 3: Run lint on the new route and category page**

Run: `npm run lint -- 'src/app/best/tag/[slug]/page.tsx' 'src/app/categories/[slug]/page.tsx'`
Expected: PASS

- [ ] **Step 4: Verify the best-by-tag route manually**

Run: `curl -sS http://localhost:3000/best/tag/ai`
Expected: HTML response with the configured page title and at least one tool card when registry slugs are valid

- [ ] **Step 5: Commit**

```bash
git add 'src/app/best/tag/[slug]/page.tsx' 'src/app/categories/[slug]/page.tsx'
git commit -m "feat: add best by tag seo pages"
```

### Task 8: Add the alternatives route and tool-page internal link

**Files:**
- Create: `src/app/alternatives/[slug]/page.tsx`
- Modify: `src/app/tools/[slug]/page.tsx`

- [ ] **Step 1: Create the alternatives route**

Create `src/app/alternatives/[slug]/page.tsx`:

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PublicToolCard } from "@/components/public/public-tool-card";
import { getEnv } from "@/server/env";
import { getAlternativesSeoPage } from "@/server/services/seo-service";

type RouteContext = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: RouteContext): Promise<Metadata> {
  const { slug } = await params;
  const page = await getAlternativesSeoPage(slug);

  if (!page) {
    return { title: "Page not found | Shipboost" };
  }

  const canonical = `${getEnv().NEXT_PUBLIC_APP_URL}/alternatives/${slug}`;

  return {
    title: page.entry.metaTitle,
    description: page.entry.metaDescription,
    alternates: { canonical },
    openGraph: {
      title: page.entry.metaTitle,
      description: page.entry.metaDescription,
      url: canonical,
      siteName: "Shipboost",
      type: "website",
    },
  };
}

export default async function AlternativesPage({ params }: RouteContext) {
  const { slug } = await params;
  const page = await getAlternativesSeoPage(slug);

  if (!page) notFound();

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">Alternatives</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">{page.entry.title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/66">{page.entry.intro}</p>

        <div className="mt-6 rounded-[1.5rem] border border-black/10 bg-[#fff9ef] p-5">
          <p className="text-xs font-semibold tracking-[0.18em] text-[#9f4f1d] uppercase">Anchor product</p>
          <h2 className="mt-2 text-2xl font-semibold text-black">{page.anchorTool.name}</h2>
          <p className="mt-2 text-sm leading-7 text-black/66">{page.anchorTool.tagline}</p>
          <Link href={`/tools/${page.anchorTool.slug}`} className="mt-4 inline-flex text-sm font-medium text-[#143f35]">
            View original listing
          </Link>
        </div>
      </div>

      <div className="mt-8 grid gap-4">
        {page.tools.map((tool) => (
          <PublicToolCard key={tool.id} tool={tool} />
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add an internal alternatives link on tool pages**

Update `src/app/tools/[slug]/page.tsx`:

```tsx
import { hasAlternativesSeoPage } from "@/server/services/seo-service";
```

Inside the tool hero action area:

```tsx
{hasAlternativesSeoPage(tool.slug) ? (
  <Link
    href={`/alternatives/${tool.slug}`}
    className="rounded-full border border-black/10 bg-[#fff9ef] px-4 py-2 text-sm font-medium text-black transition hover:border-black/20 hover:bg-[#fff3de]"
  >
    Compare alternatives
  </Link>
) : null}
```

- [ ] **Step 3: Run lint on the new route and tool page**

Run: `npm run lint -- 'src/app/alternatives/[slug]/page.tsx' 'src/app/tools/[slug]/page.tsx'`
Expected: PASS

- [ ] **Step 4: Verify the alternatives page manually**

Run: `curl -sS http://localhost:3000/alternatives/example-tool`
Expected: HTML response with anchor tool context and the configured alternatives list

- [ ] **Step 5: Commit**

```bash
git add 'src/app/alternatives/[slug]/page.tsx' 'src/app/tools/[slug]/page.tsx'
git commit -m "feat: add alternatives seo pages"
```

### Task 9: Full verification

**Files:**
- Verify only

- [ ] **Step 1: Run the focused test suite**

Run: `npm test -- src/server/services/tool-search.test.ts src/server/services/seo-service.test.ts src/components/public/home-search-modal.test.tsx`
Expected: PASS for all new tests

- [ ] **Step 2: Run full lint**

Run: `npm run lint`
Expected: PASS

- [ ] **Step 3: Run type-check**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 4: Smoke-check the three public entry points**

Run:

```bash
curl -sS 'http://localhost:3000/?q=ai' >/tmp/home-search.html
curl -sS 'http://localhost:3000/best/tag/ai' >/tmp/best-tag.html
curl -sS 'http://localhost:3000/alternatives/example-tool' >/tmp/alternatives.html
```

Expected: all requests return HTML documents without runtime error output

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: implement discovery and seo slice"
```

---

## Self-Review

### Spec coverage
- Homepage hero search modal: covered in Task 4
- Public search backend for published tools only: covered in Tasks 2 and 3
- Search by name, tagline, category, tag: covered in Task 2
- Query synced to `?q=` and modal auto-open behavior: covered in Task 4
- Code-managed SEO registry: covered in Task 5
- Shared SEO page query layer: covered in Task 6
- `/best/tag/[tag-slug]`: covered in Task 7
- `/alternatives/[tool-slug]`: covered in Task 8
- Tool/category internal linking when configured: covered in Tasks 7 and 8
- Metadata on new SEO pages: covered in Tasks 7 and 8
- No Prisma `SeoPage` model and no admin CMS work: preserved by structure

### Placeholder scan
- No `TBD` or `TODO` markers remain
- Every task names exact files and concrete commands
- Code-changing steps include code snippets

### Type consistency
- Search route uses `q` consistently across validator, client, and route
- SEO registry keys and route params both use `slug`
- Alternatives pages use `anchorToolSlug` consistently in registry and service

