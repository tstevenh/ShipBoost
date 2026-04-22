# Master Outbound Link PostHog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a master `outbound_link_clicked` PostHog event for every public outbound webpage click, while keeping `tool_outbound_click` as the specialized tool event and preserving the current tool redirect flow.

**Architecture:** Keep `/api/outbound/tool/[toolId]` as the canonical server redirect for tool links and extend it to emit both the master and specialized events. For non-tool public outbound links, add one shared browser-side `TrackedExternalLink` primitive backed by small outbound-link helpers, then adopt it in the existing public components that already render external webpage links. Finish by updating the ShipBoost PostHog dashboard to report on the new master event alongside the existing tool event.

**Tech Stack:** Next.js App Router, TypeScript, React 19, posthog-js, Vitest, Testing Library, PostHog MCP

---

## File map

- `src/lib/outbound-link.ts`
  - Shared outbound-link contract for non-tool browser tracking.
  - Owns protocol/domain filtering plus normalized master-event property building.
- `src/lib/outbound-link.test.ts`
  - Unit coverage for outbound URL eligibility and property normalization.
- `src/lib/posthog-browser.ts`
  - Existing browser PostHog wrapper.
  - Extend with a dedicated helper for `outbound_link_clicked`.
- `src/components/analytics/tracked-external-link.tsx`
  - Shared external-link component for non-tool public links.
  - Emits `outbound_link_clicked` in the browser and then navigates normally.
- `src/components/analytics/tracked-external-link.test.tsx`
  - Verifies browser tracking fires only for eligible external webpage links.
- `src/server/services/outbound-click-service.ts`
  - Existing tool redirect service.
  - Extend to emit the master outbound event in addition to `tool_outbound_click`.
- `src/server/services/outbound-click-service.test.ts`
  - Verifies tool redirects emit both events without breaking affiliate-first behavior.
- `src/components/resources/startup-directories-resource.tsx`
  - Replace raw external anchors with the shared tracked external link.
- `src/components/resources/startup-directories-resource.test.tsx`
  - Add assertions for the tracked link contract on resource rows.
- `src/app/pricing/page.tsx`
  - Replace the partner offer external CTA with the shared tracked external link.
- `src/components/blog/blog-author-card.tsx`
  - Track public author profile outbound links.
- `src/components/public/frog-dr-badge.tsx`
  - Track the public badge outbound link.
- `src/app/about/page.tsx`
  - Track the founder X link.
- `src/components/ui/flickering-footer.tsx`
  - Track footer badge rail outbound links without changing the marquee behavior.

---

### Task 1: Add the shared master outbound-link contract

**Files:**
- Create: `src/lib/outbound-link.ts`
- Create: `src/lib/outbound-link.test.ts`
- Modify: `src/lib/posthog-browser.ts`

- [ ] **Step 1: Write the failing unit tests for outbound-link eligibility and property building**

```ts
import { describe, expect, it } from "vitest";

import {
  buildOutboundLinkClickedProperties,
  isTrackableOutboundHttpUrl,
} from "@/lib/outbound-link";

describe("outbound-link", () => {
  it("accepts external http and https links", () => {
    expect(
      isTrackableOutboundHttpUrl({
        href: "https://frogdr.com/shipboost.io",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(true);

    expect(
      isTrackableOutboundHttpUrl({
        href: "http://example.com",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(true);
  });

  it("rejects internal, hash, and non-web links", () => {
    expect(
      isTrackableOutboundHttpUrl({
        href: "https://shipboost.io/pricing",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(false);
    expect(
      isTrackableOutboundHttpUrl({
        href: "#top",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(false);
    expect(
      isTrackableOutboundHttpUrl({
        href: "mailto:hello@shipboost.io",
        siteOrigin: "https://shipboost.io",
      }),
    ).toBe(false);
  });

  it("builds normalized master outbound properties", () => {
    expect(
      buildOutboundLinkClickedProperties({
        href: "https://frogdr.com/shipboost.io?via=ShipBoost",
        sourcePath: "/about?from=footer",
        sourceSurface: "footer",
        linkContext: "footer",
        linkText: "FrogDR",
        trackingMethod: "browser",
        isToolLink: false,
      }),
    ).toEqual(
      expect.objectContaining({
        href: "https://frogdr.com/shipboost.io?via=ShipBoost",
        destination_domain: "frogdr.com",
        source_path: "/about?from=footer",
        source_surface: "footer",
        link_context: "footer",
        link_text: "FrogDR",
        tracking_method: "browser",
        is_tool_link: false,
      }),
    );
  });
});
```

- [ ] **Step 2: Run the unit tests to verify they fail**

Run:

```bash
npx vitest run src/lib/outbound-link.test.ts
```

Expected:

```text
FAIL  src/lib/outbound-link.test.ts
Error: Failed to resolve import "@/lib/outbound-link"
```

- [ ] **Step 3: Implement the shared outbound-link helpers**

```ts
export type OutboundLinkSurface =
  | "startup_directories"
  | "pricing_page"
  | "blog_author_card"
  | "about_page"
  | "footer"
  | "frogdr_badge";

export type OutboundLinkContext =
  | "startup_directories"
  | "pricing"
  | "blog"
  | "about"
  | "footer";

type IsTrackableInput = {
  href: string;
  siteOrigin: string;
};

type BuildPropertiesInput = {
  href: string;
  sourcePath: string;
  sourceSurface: OutboundLinkSurface;
  linkContext: OutboundLinkContext;
  linkText?: string;
  trackingMethod: "browser" | "server_redirect";
  isToolLink: boolean;
  toolId?: string;
  toolSlug?: string;
  toolName?: string;
};

export function isTrackableOutboundHttpUrl({
  href,
  siteOrigin,
}: IsTrackableInput) {
  try {
    const resolved = new URL(href, siteOrigin);
    const site = new URL(siteOrigin);

    if (!["http:", "https:"].includes(resolved.protocol)) {
      return false;
    }

    return resolved.origin !== site.origin;
  } catch {
    return false;
  }
}

export function buildOutboundLinkClickedProperties(
  input: BuildPropertiesInput,
) {
  const url = new URL(input.href);

  return {
    href: url.toString(),
    destination_domain: url.hostname,
    source_path: input.sourcePath,
    source_surface: input.sourceSurface,
    link_context: input.linkContext,
    link_text: input.linkText ?? null,
    tracking_method: input.trackingMethod,
    is_tool_link: input.isToolLink,
    tool_id: input.toolId ?? null,
    tool_slug: input.toolSlug ?? null,
    tool_name: input.toolName ?? null,
  };
}
```

```ts
import posthog from "posthog-js";

import { buildOutboundLinkClickedProperties } from "@/lib/outbound-link";

export function captureBrowserOutboundLinkClicked(
  input: Parameters<typeof buildOutboundLinkClickedProperties>[0],
) {
  posthog.capture(
    "outbound_link_clicked",
    buildOutboundLinkClickedProperties(input),
  );
}
```

- [ ] **Step 4: Run the unit tests to verify they pass**

Run:

```bash
npx vitest run src/lib/outbound-link.test.ts
```

Expected:

```text
PASS  src/lib/outbound-link.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/outbound-link.ts src/lib/outbound-link.test.ts src/lib/posthog-browser.ts
git commit -m "feat: add master outbound link tracking helpers"
```

---

### Task 2: Add the shared tracked external-link component

**Files:**
- Create: `src/components/analytics/tracked-external-link.tsx`
- Create: `src/components/analytics/tracked-external-link.test.tsx`

- [ ] **Step 1: Write the failing component tests**

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { captureBrowserOutboundLinkClickedMock } = vi.hoisted(() => ({
  captureBrowserOutboundLinkClickedMock: vi.fn(),
}));

vi.mock("@/lib/posthog-browser", () => ({
  captureBrowserOutboundLinkClicked: captureBrowserOutboundLinkClickedMock,
}));

import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";

describe("TrackedExternalLink", () => {
  it("captures the master outbound event for external webpage links", () => {
    render(
      <TrackedExternalLink
        href="https://frogdr.com/shipboost.io"
        sourceSurface="footer"
        linkContext="footer"
      >
        FrogDR
      </TrackedExternalLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "FrogDR" }));

    expect(captureBrowserOutboundLinkClickedMock).toHaveBeenCalledWith(
      expect.objectContaining({
        href: "https://frogdr.com/shipboost.io",
        sourceSurface: "footer",
        linkContext: "footer",
        trackingMethod: "browser",
        isToolLink: false,
      }),
    );
  });

  it("does not capture for internal links", () => {
    render(
      <TrackedExternalLink
        href="/pricing"
        sourceSurface="footer"
        linkContext="footer"
      >
        Pricing
      </TrackedExternalLink>,
    );

    fireEvent.click(screen.getByRole("link", { name: "Pricing" }));

    expect(captureBrowserOutboundLinkClickedMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the component tests to verify they fail**

Run:

```bash
npx vitest run src/components/analytics/tracked-external-link.test.tsx
```

Expected:

```text
FAIL  src/components/analytics/tracked-external-link.test.tsx
Error: Failed to resolve import "@/components/analytics/tracked-external-link"
```

- [ ] **Step 3: Implement the tracked external-link component**

```tsx
"use client";

import type { AnchorHTMLAttributes, ReactNode } from "react";

import {
  type OutboundLinkContext,
  type OutboundLinkSurface,
  isTrackableOutboundHttpUrl,
} from "@/lib/outbound-link";
import { captureBrowserOutboundLinkClicked } from "@/lib/posthog-browser";

type TrackedExternalLinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  children: ReactNode;
  href: string;
  sourceSurface: OutboundLinkSurface;
  linkContext: OutboundLinkContext;
  linkText?: string;
};

export function TrackedExternalLink({
  children,
  href,
  sourceSurface,
  linkContext,
  linkText,
  onClick,
  ...props
}: TrackedExternalLinkProps) {
  return (
    <a
      {...props}
      href={href}
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented || typeof window === "undefined") {
          return;
        }

        if (
          !isTrackableOutboundHttpUrl({
            href,
            siteOrigin: window.location.origin,
          })
        ) {
          return;
        }

        captureBrowserOutboundLinkClicked({
          href,
          sourcePath: `${window.location.pathname}${window.location.search}`,
          sourceSurface,
          linkContext,
          linkText:
            linkText ??
            (typeof children === "string" ? children : undefined),
          trackingMethod: "browser",
          isToolLink: false,
        });
      }}
    >
      {children}
    </a>
  );
}
```

- [ ] **Step 4: Run the component tests to verify they pass**

Run:

```bash
npx vitest run src/components/analytics/tracked-external-link.test.tsx
```

Expected:

```text
PASS  src/components/analytics/tracked-external-link.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/analytics/tracked-external-link.tsx src/components/analytics/tracked-external-link.test.tsx
git commit -m "feat: add tracked external link component"
```

---

### Task 3: Extend the tool redirect flow to emit the master event

**Files:**
- Modify: `src/server/services/outbound-click-service.ts`
- Modify: `src/server/services/outbound-click-service.test.ts`

- [ ] **Step 1: Add the failing redirect test for the master event**

```ts
it("emits the master outbound event alongside tool_outbound_click", async () => {
  prismaMock.tool.findFirst.mockResolvedValueOnce({
    id: "tool_1",
    slug: "acme",
    name: "Acme",
    websiteUrl: "https://acme.com",
    affiliateUrl: "https://partner.com/acme",
    isFeatured: true,
    currentLaunchType: "FEATURED",
  });
  getSessionFromRequestMock.mockResolvedValueOnce({
    user: { id: "user_1" },
  });

  await resolveTrackedToolOutboundClick({
    toolId: "tool_1",
    target: "website",
    source: "tool_page",
    referer: "http://localhost:3000/tools/acme",
    request: new Request("http://localhost:3000"),
  });

  expect(capturePostHogEventMock).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({
      event: "outbound_link_clicked",
      properties: expect.objectContaining({
        href: "https://partner.com/acme",
        destination_domain: "partner.com",
        source_surface: "tool_page",
        link_context: "tool_page",
        tracking_method: "server_redirect",
        is_tool_link: true,
        tool_id: "tool_1",
      }),
    }),
  );

  expect(capturePostHogEventMock).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({
      event: "tool_outbound_click",
    }),
  );
});
```

- [ ] **Step 2: Run the redirect test to verify it fails**

Run:

```bash
npx vitest run src/server/services/outbound-click-service.test.ts
```

Expected:

```text
FAIL  src/server/services/outbound-click-service.test.ts
AssertionError: expected "capturePostHogEvent" to have been called with event "outbound_link_clicked"
```

- [ ] **Step 3: Emit the master outbound event from the redirect service**

```ts
import { buildOutboundLinkClickedProperties } from "@/lib/outbound-link";

// inside resolveTrackedToolOutboundClick after destinationUrl is finalized
const outboundProperties = buildOutboundLinkClickedProperties({
  href: destinationUrl,
  sourcePath: sourcePath ?? "/unknown",
  sourceSurface: input.source,
  linkContext:
    input.source === "tool_page" ? "tool_page" : "tool_listing",
  trackingMethod: "server_redirect",
  isToolLink: true,
  toolId: tool.id,
  toolSlug: tool.slug,
  toolName: tool.name,
});

try {
  await capturePostHogEvent({
    distinctId,
    event: "outbound_link_clicked",
    properties: outboundProperties,
  });

  await capturePostHogEvent({
    distinctId,
    event: "tool_outbound_click",
    properties: {
      tool_id: tool.id,
      tool_slug: tool.slug,
      tool_name: tool.name,
      destination_type: input.target,
      destination_url: destinationUrl,
      destination_url_original: resolvedTarget.url,
      destination_url_final: destinationUrl,
      destination_domain: getDestinationDomain(resolvedTarget.url),
      source_surface: input.source,
      source_path: sourcePath,
      used_affiliate_url: resolvedTarget.usedAffiliateUrl,
      is_featured: tool.isFeatured,
      current_launch_type: tool.currentLaunchType,
    },
  });
} catch (error) {
  console.error("[shipboost outbound-click:capture-error]", error);
}
```

- [ ] **Step 4: Run the redirect tests to verify they pass**

Run:

```bash
npx vitest run src/server/services/outbound-click-service.test.ts
```

Expected:

```text
PASS  src/server/services/outbound-click-service.test.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/server/services/outbound-click-service.ts src/server/services/outbound-click-service.test.ts
git commit -m "feat: emit master outbound event for tool redirects"
```

---

### Task 4: Adopt tracked external links across public non-tool surfaces

**Files:**
- Modify: `src/components/resources/startup-directories-resource.tsx`
- Modify: `src/components/resources/startup-directories-resource.test.tsx`
- Modify: `src/app/pricing/page.tsx`
- Modify: `src/components/blog/blog-author-card.tsx`
- Modify: `src/components/public/frog-dr-badge.tsx`
- Modify: `src/app/about/page.tsx`
- Modify: `src/components/ui/flickering-footer.tsx`

- [ ] **Step 1: Add the failing startup directories test**

```tsx
it("uses tracked external links for directory visits", () => {
  render(<StartupDirectoriesResource />);

  const visitLink = screen.getAllByRole("link", { name: /visit/i })[0];

  expect(visitLink).toHaveAttribute("href", "https://reddit.com/r/startups");
  expect(visitLink).toHaveAttribute("target", "_blank");
  expect(visitLink).toHaveAttribute("rel", "noreferrer");
});
```

- [ ] **Step 2: Run the resource and tracked-link tests to verify they fail on the missing adoption**

Run:

```bash
npx vitest run src/components/resources/startup-directories-resource.test.tsx src/components/analytics/tracked-external-link.test.tsx
```

Expected:

```text
FAIL  src/components/resources/startup-directories-resource.test.tsx
AssertionError: expected rendered Visit links to come from the tracked external-link component contract
```

- [ ] **Step 3: Replace raw public external anchors with `TrackedExternalLink`**

```tsx
// startup-directories-resource.tsx
import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";

<TrackedExternalLink
  href={item.url}
  target="_blank"
  rel="noreferrer"
  sourceSurface="startup_directories"
  linkContext="startup_directories"
  linkText={`Visit ${item.name}`}
  className={item.recommended ? recommendedClassName : defaultClassName}
>
  Visit
</TrackedExternalLink>
```

```tsx
// pricing/page.tsx
import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";

<TrackedExternalLink
  href={tier.ctaHref}
  target="_blank"
  rel="noreferrer"
  sourceSurface="pricing_page"
  linkContext="pricing"
  linkText={tier.ctaLabel}
  className={cn(
    "inline-flex w-full items-center justify-center gap-2 rounded-2xl px-6 py-4 text-sm font-black transition-all active:scale-95 shadow-xl",
    "bg-foreground text-background hover:opacity-90 shadow-black/10",
  )}
>
  {tier.ctaLabel}
  <ArrowRight size={16} />
</TrackedExternalLink>
```

```tsx
// blog-author-card.tsx
<TrackedExternalLink
  href={author.xUrl}
  target="_blank"
  rel="noreferrer"
  sourceSurface="blog_author_card"
  linkContext="blog"
>
  X
</TrackedExternalLink>
```

```tsx
// about/page.tsx
<TrackedExternalLink
  href="https://x.com/Timhrt_"
  target="_blank"
  rel="noreferrer"
  sourceSurface="about_page"
  linkContext="about"
  className="mt-3 inline-flex text-sm font-black text-foreground hover:underline underline-offset-4"
>
  Follow on X
</TrackedExternalLink>
```

```tsx
// frog-dr-badge.tsx
<TrackedExternalLink
  href="https://frogdr.com/shipboost.io?via=Shipboost&utm_source=shipboost.io"
  target="_blank"
  rel="noopener noreferrer"
  sourceSurface="frogdr_badge"
  linkContext="footer"
  linkText="Monitor your Domain Rating with FrogDR"
  className={cn("mx-auto block w-fit", className)}
>
  {/* existing badge images */}
</TrackedExternalLink>
```

```tsx
// flickering-footer.tsx
<TrackedExternalLink
  key={`${badge.id}-${index}`}
  href={badge.href}
  target="_blank"
  rel={badge.rel}
  title={badge.title}
  sourceSurface="footer"
  linkContext="footer"
  linkText={badge.title ?? badge.label}
  className="flex h-12 min-w-[118px] items-center justify-center rounded-lg border border-border/70 bg-background/95 px-2.5 py-1.5 shadow-[0_10px_40px_-28px_rgba(10,10,10,0.9)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-background"
>
  {badgeContent}
</TrackedExternalLink>
```

- [ ] **Step 4: Run the focused public-surface tests to verify they pass**

Run:

```bash
npx vitest run src/components/resources/startup-directories-resource.test.tsx src/components/analytics/tracked-external-link.test.tsx
```

Expected:

```text
PASS  src/components/resources/startup-directories-resource.test.tsx
PASS  src/components/analytics/tracked-external-link.test.tsx
```

- [ ] **Step 5: Commit**

```bash
git add src/components/resources/startup-directories-resource.tsx src/components/resources/startup-directories-resource.test.tsx src/app/pricing/page.tsx src/components/blog/blog-author-card.tsx src/components/public/frog-dr-badge.tsx src/app/about/page.tsx src/components/ui/flickering-footer.tsx
git commit -m "feat: track public non-tool outbound links"
```

---

### Task 5: Update the PostHog dashboard and verify the rollout

**Files:**
- Modify via PostHog MCP: existing ShipBoost dashboard
- Modify via PostHog MCP: outbound insights using `outbound_link_clicked` and `tool_outbound_click`

- [ ] **Step 1: Create or update master outbound insights in PostHog**

Create these insights:

```text
1. "Outbound clicks over time"
   - event: outbound_link_clicked
   - interval: day

2. "Outbound clicks by context"
   - event: outbound_link_clicked
   - breakdown: link_context

3. "Outbound clicks by destination domain"
   - event: outbound_link_clicked
   - breakdown: destination_domain

4. "Tool outbound clicks over time"
   - event: tool_outbound_click
   - interval: day

5. "Tool outbound clicks by tool"
   - event: tool_outbound_click
   - breakdown: tool_slug
```

- [ ] **Step 2: Replace the existing dashboard tiles with the updated insights**

Use PostHog MCP to:

```text
- fetch the current ShipBoost dashboard
- remove stale sample tiles that only reflect the old sample state
- attach the five outbound insights above
- keep the dashboard focused on ShipBoost traffic sent outward
```

- [ ] **Step 3: Run final local verification**

Run:

```bash
npx vitest run src/lib/outbound-link.test.ts src/components/analytics/tracked-external-link.test.tsx src/components/resources/startup-directories-resource.test.tsx src/server/services/outbound-click-service.test.ts
npx tsc --noEmit
npm run build
```

Expected:

```text
PASS  all targeted vitest files
Found 0 errors from TypeScript
Next.js build completes successfully
```

- [ ] **Step 4: Run final manual analytics verification**

Verify:

```text
- clicking a tool CTA creates both outbound_link_clicked and tool_outbound_click
- clicking a startup directory Visit link creates outbound_link_clicked only
- clicking the pricing partner CTA creates outbound_link_clicked only
- destination_domain, source_surface, link_context, tracking_method, and is_tool_link are populated as designed
```

- [ ] **Step 5: Commit**

```bash
# No repo commit required for MCP-only dashboard changes.
# If you also document the dashboard locally, add only that file explicitly.
```
