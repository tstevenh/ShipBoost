# Founder Content Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build `/how-it-works`, `/launch-guide`, and `/faqs` as ShipBoost-themed, SEO-optimized founder conversion pages with strong CTAs to `/submit` and `/pricing`.

**Architecture:** Reuse the existing app shell, typography, page spacing, footer, and CTA styles from current marketing pages. Add only two small shared components: a static content-page wrapper for consistent page structure and a collapsible FAQ accordion for `/faqs`.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Tailwind CSS, lucide-react

---

## File Structure

### Create
- `src/components/marketing/content-page-shell.tsx`
  - Shared wrapper for hero, sections, CTA blocks, and footer integration.
- `src/components/marketing/faq-accordion.tsx`
  - Small client accordion for grouped FAQ items.
- `src/app/how-it-works/page.tsx`
  - Static explainer page with SEO metadata.
- `src/app/launch-guide/page.tsx`
  - Static long-form launch guide page with SEO metadata.
- `src/app/faqs/page.tsx`
  - Static FAQ page with grouped accordions and SEO metadata.

### Modify
- `src/components/app/app-header.tsx`
  - Add navigation links for the new content pages only if there is an obvious existing place in public nav.

### Verify
- `npx tsc --noEmit`
- `npm run build`

---

### Task 1: Build shared content page shell

**Files:**
- Create: `src/components/marketing/content-page-shell.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create the shared shell component**

```tsx
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Footer } from "@/components/ui/footer";

type ContentPageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  children: React.ReactNode;
  finalCtaTitle?: string;
  finalCtaDescription?: string;
};

export function ContentPageShell({
  eyebrow,
  title,
  description,
  primaryCtaLabel = "Submit your product",
  primaryCtaHref = "/submit",
  secondaryCtaLabel = "View pricing",
  secondaryCtaHref = "/pricing",
  children,
  finalCtaTitle = "Ready to launch with more signal and less noise?",
  finalCtaDescription = "Start with a free launch or reserve a Premium Launch week.",
}: ContentPageShellProps) {
  return (
    <main className="flex-1 flex flex-col bg-muted/20 pt-32">
      <section className="mx-auto w-full max-w-5xl px-6">
        <div className="space-y-6 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/40">
            {eyebrow}
          </p>
          <h1 className="text-5xl font-black tracking-tight text-foreground lowercase sm:text-6xl">
            {title}
          </h1>
          <p className="max-w-3xl text-lg font-medium leading-relaxed text-muted-foreground/80 sm:text-xl">
            {description}
          </p>
          <div className="flex flex-col gap-4 pt-2 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-95"
            >
              {primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted active:scale-95"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </div>

        <div className="space-y-12 py-12">{children}</div>

        <section className="mb-32 rounded-[2.5rem] border border-border bg-card p-8 shadow-sm sm:p-12">
          <div className="max-w-3xl space-y-4">
            <h2 className="text-3xl font-black tracking-tight text-foreground lowercase sm:text-4xl">
              {finalCtaTitle}
            </h2>
            <p className="text-lg font-medium leading-relaxed text-muted-foreground/80">
              {finalCtaDescription}
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href={primaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-95"
            >
              {primaryCtaLabel}
              <ArrowRight size={18} />
            </Link>
            <Link
              href={secondaryCtaHref}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-card px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted active:scale-95"
            >
              {secondaryCtaLabel}
            </Link>
          </div>
        </section>
      </section>
      <Footer className="mt-auto" />
    </main>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/content-page-shell.tsx
git commit -m "feat: add shared founder content page shell"
```

### Task 2: Build FAQ accordion

**Files:**
- Create: `src/components/marketing/faq-accordion.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create the accordion component**

```tsx
"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export type FaqItem = {
  question: string;
  answer: string;
};

export type FaqGroup = {
  title: string;
  items: FaqItem[];
};

export function FaqAccordion({ groups }: { groups: FaqGroup[] }) {
  const [openKey, setOpenKey] = useState("0-0");

  return (
    <div className="space-y-10">
      {groups.map((group, groupIndex) => (
        <section key={group.title} className="space-y-4">
          <h2 className="text-2xl font-black tracking-tight text-foreground lowercase">
            {group.title}
          </h2>
          <div className="space-y-3">
            {group.items.map((item, itemIndex) => {
              const key = `${groupIndex}-${itemIndex}`;
              const isOpen = openKey === key;

              return (
                <article key={item.question} className="rounded-3xl border border-border bg-card shadow-sm">
                  <button
                    type="button"
                    onClick={() => setOpenKey(isOpen ? "" : key)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <span className="text-base font-black text-foreground">
                      {item.question}
                    </span>
                    <ChevronDown
                      className={cn("h-5 w-5 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")}
                    />
                  </button>
                  {isOpen ? (
                    <div className="border-t border-border px-6 py-5 text-sm font-medium leading-relaxed text-muted-foreground">
                      {item.answer}
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/marketing/faq-accordion.tsx
git commit -m "feat: add founder faq accordion"
```

### Task 3: Build `/how-it-works`

**Files:**
- Create: `src/app/how-it-works/page.tsx`
- Use: `src/components/marketing/content-page-shell.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create the page with metadata and content**

```tsx
import type { Metadata } from "next";
import Link from "next/link";
import { ContentPageShell } from "@/components/marketing/content-page-shell";

export const metadata: Metadata = {
  title: "How ShipBoost Works | ShipBoost",
  description:
    "Learn how ShipBoost works: weekly launch cohorts, free vs Premium Launch rules, ranking, approval, and what founders can expect after submitting.",
};

const steps = [
  {
    title: "1. Submit your product",
    body:
      "Founders submit their product, listing details, and launch preference. Free launches require badge verification. Premium Launches skip that step.",
  },
  {
    title: "2. Get placed into the right launch flow",
    body:
      "Free launches are reviewed and queued into weekly cohorts. Premium Launches reserve a launch week after payment confirmation.",
  },
  {
    title: "3. Launch into a weekly board",
    body:
      "ShipBoost organizes launches in weekly windows so strong products stay visible longer and founders are not buried in a one-day spike.",
  },
];

const rules = [
  {
    title: "Free Launch",
    points: [
      "Reviewed before approval",
      "Requires backlink verification",
      "Queued into the next available weekly cohort",
    ],
  },
  {
    title: "Premium Launch",
    points: [
      "Choose a launch week",
      "Skip badge verification",
      "Starts ahead of free launches outside the top vote slots",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <ContentPageShell
      eyebrow="How it works"
      title="how ShipBoost works"
      description="ShipBoost is built for bootstrapped SaaS founders who want a cleaner launch system, clearer rules, and stronger distribution than a noisy daily feed."
    >
      <section className="grid gap-6">
        {steps.map((step) => (
          <article key={step.title} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground lowercase">
              {step.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {step.body}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {rules.map((rule) => (
          <article key={rule.title} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground lowercase">
              {rule.title}
            </h2>
            <ul className="mt-6 space-y-3">
              {rule.points.map((point) => (
                <li key={point} className="text-sm font-medium leading-relaxed text-muted-foreground">
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground lowercase">
          how ranking works
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
          The top three spots are earned by the most upvotes in the active week. After that, Premium Launches appear ahead of free launches, which gives paid launches stronger baseline placement without removing the vote-driven leaderboard.
        </p>
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground lowercase">
          what happens after submission
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
          Founders can track review status, payment state, and launch date from the dashboard. Once scheduled, the launch date stays visible on the submission card so there is no ambiguity about timing.
        </p>
        <div className="mt-6">
          <Link href="/faqs" className="text-sm font-black text-foreground hover:underline underline-offset-4">
            Read the founder FAQs →
          </Link>
        </div>
      </section>
    </ContentPageShell>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/how-it-works/page.tsx
git commit -m "feat: add how it works content page"
```

### Task 4: Build `/launch-guide`

**Files:**
- Create: `src/app/launch-guide/page.tsx`
- Use: `src/components/marketing/content-page-shell.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create the page with metadata and content**

```tsx
import type { Metadata } from "next";
import { ContentPageShell } from "@/components/marketing/content-page-shell";

export const metadata: Metadata = {
  title: "Launch Guide For Bootstrapped SaaS Founders | ShipBoost",
  description:
    "A practical launch guide for bootstrapped SaaS founders: what to prepare, what to avoid, how weekly launches work, and how to turn launch into momentum.",
};

const mistakes = [
  "Launching without proof, screenshots, or a clear product story",
  "Relying on a one-day traffic spike instead of a distribution plan",
  "Using generic listings that do not build trust with the right users",
];

const checklist = [
  "Tight tagline and positioning",
  "Credible landing page and screenshots",
  "Founder profile links and social proof",
  "Launch week selected or planned",
  "Clear CTA and onboarding path after discovery",
];

export default function LaunchGuidePage() {
  return (
    <ContentPageShell
      eyebrow="Launch guide"
      title="a launch guide for founders who want momentum, not noise"
      description="Most launch advice is built around short-term spikes. This guide focuses on trust, positioning, and distribution so a launch keeps working after day one."
      finalCtaTitle="Put the guide into practice"
      finalCtaDescription="If your product is ready, submit it to ShipBoost or compare free and Premium Launch options."
    >
      <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground lowercase">
          the launch mistakes that waste good products
        </h2>
        <ul className="mt-6 space-y-4">
          {mistakes.map((mistake) => (
            <li key={mistake} className="text-base font-medium leading-relaxed text-muted-foreground/80">
              {mistake}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "1. Prepare trust signals",
            body: "Before launch, tighten the tagline, screenshots, pricing clarity, and founder links. Distribution works better when the product already looks credible.",
          },
          {
            title: "2. Pick the right launch channel",
            body: "Not every launch surface is equal. Daily feeds reward noise. Weekly cohorts give better products more room to be seen and compared.",
          },
          {
            title: "3. Keep distributing after launch",
            body: "A launch should lead into directory submissions, social proof, founder outreach, and a public listing that keeps compounding.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground lowercase">
              {item.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {item.body}
            </p>
          </article>
        ))}
      </section>

      <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground lowercase">
          weekly launch checklist
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {checklist.map((item) => (
            <div key={item} className="rounded-2xl border border-border bg-muted/20 p-5 text-sm font-bold text-foreground">
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {[
          {
            title: "when free launch is enough",
            body: "Use the free option when you want visibility, can complete badge verification, and are comfortable joining the next available weekly cohort.",
          },
          {
            title: "when Premium Launch makes sense",
            body: "Use Premium Launch when timing matters, you want to reserve a specific week, or you want stronger baseline placement in the board.",
          },
        ].map((item) => (
          <article key={item.title} className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
            <h2 className="text-2xl font-black tracking-tight text-foreground lowercase">
              {item.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {item.body}
            </p>
          </article>
        ))}
      </section>
    </ContentPageShell>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/launch-guide/page.tsx
git commit -m "feat: add founder launch guide page"
```

### Task 5: Build `/faqs`

**Files:**
- Create: `src/app/faqs/page.tsx`
- Use: `src/components/marketing/content-page-shell.tsx`
- Use: `src/components/marketing/faq-accordion.tsx`
- Test: `npx tsc --noEmit`

- [ ] **Step 1: Create the page with grouped FAQs**

```tsx
import type { Metadata } from "next";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { FaqAccordion, type FaqGroup } from "@/components/marketing/faq-accordion";

export const metadata: Metadata = {
  title: "Founder FAQs | ShipBoost",
  description:
    "Answers to the most common ShipBoost founder questions about submissions, free vs Premium Launch, launch weeks, ranking, payments, and listing visibility.",
};

const groups: FaqGroup[] = [
  {
    title: "submission basics",
    items: [
      {
        question: "Who should submit to ShipBoost?",
        answer:
          "ShipBoost is built for bootstrapped SaaS founders who want trust, visibility, and repeatable distribution instead of a one-day spike.",
      },
      {
        question: "Can I submit before launch day?",
        answer:
          "Yes. Founders can submit ahead of public opening and line up a free or Premium Launch week.",
      },
    ],
  },
  {
    title: "free vs premium",
    items: [
      {
        question: "What is the difference between Free Launch and Premium Launch?",
        answer:
          "Free Launch goes through review, requires badge verification, and is queued into the next available weekly cohort. Premium Launch lets you reserve a launch week, skips badge verification, and gets stronger baseline placement.",
      },
      {
        question: "Do I need a backlink for Premium Launch?",
        answer:
          "No. Badge verification is required for free launches, not Premium Launches.",
      },
    ],
  },
  {
    title: "scheduling and ranking",
    items: [
      {
        question: "How do launch weeks work?",
        answer:
          "ShipBoost uses weekly cohorts instead of daily launch resets. Free launches are queued into available weeks, and Premium Launches reserve a week directly.",
      },
      {
        question: "How is the launch board ranked?",
        answer:
          "The top three spots are earned by the most upvotes in the active week. After that, Premium Launches appear ahead of free launches.",
      },
    ],
  },
  {
    title: "payments and edits",
    items: [
      {
        question: "When is Premium Launch confirmed?",
        answer:
          "Premium Launch is confirmed after payment is completed and the launch week is reserved in your dashboard.",
      },
      {
        question: "Can I edit my submission later?",
        answer:
          "Yes. Draft submissions can be resumed, and approved founders can manage their listing details from the dashboard.",
      },
    ],
  },
];

export default function FaqsPage() {
  return (
    <ContentPageShell
      eyebrow="Founder FAQs"
      title="the practical questions founders ask before they launch"
      description="Straight answers on submission rules, launch weeks, ranking, payments, and what to expect after you submit to ShipBoost."
      finalCtaTitle="Still deciding?"
      finalCtaDescription="Review pricing or start your submission and see which launch path fits your product."
    >
      <FaqAccordion groups={groups} />
    </ContentPageShell>
  );
}
```

- [ ] **Step 2: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/app/faqs/page.tsx
git commit -m "feat: add founder faqs page"
```

### Task 6: Add navigation entry if appropriate

**Files:**
- Modify: `src/components/app/app-header.tsx`
- Test: `npm run build`

- [ ] **Step 1: Add the new links only if the existing public nav has room**

```tsx
const staticLinks = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/launch-guide", label: "Launch guide" },
  { href: "/faqs", label: "FAQs" },
];
```

If the header is already full, skip this task and rely on internal CTA links instead.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS and routes include `/how-it-works`, `/launch-guide`, and `/faqs`

- [ ] **Step 3: Commit**

```bash
git add src/components/app/app-header.tsx
git commit -m "feat: add founder content page navigation"
```

### Task 7: Final verification

**Files:**
- Verify: `src/app/how-it-works/page.tsx`
- Verify: `src/app/launch-guide/page.tsx`
- Verify: `src/app/faqs/page.tsx`
- Verify: `src/components/marketing/content-page-shell.tsx`
- Verify: `src/components/marketing/faq-accordion.tsx`

- [ ] **Step 1: Run typecheck**

Run: `npx tsc --noEmit`
Expected: PASS

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Smoke-check route output**

Run:

```bash
curl -sS http://127.0.0.1:3000/how-it-works
curl -sS http://127.0.0.1:3000/launch-guide
curl -sS http://127.0.0.1:3000/faqs
```

Expected:
- HTML response for all three pages
- page titles and CTA text present

- [ ] **Step 4: Commit**

```bash
git add src/app/how-it-works/page.tsx src/app/launch-guide/page.tsx src/app/faqs/page.tsx src/components/marketing/content-page-shell.tsx src/components/marketing/faq-accordion.tsx
git commit -m "feat: add founder content pages"
```

## Self-review

Spec coverage:
- route creation covered in Tasks 3-5
- shared theme reuse covered in Tasks 1-2
- strong CTAs covered in Tasks 1 and 3-5
- FAQ accordion covered in Task 2 and Task 5
- optional header exposure covered in Task 6
- verification covered in Task 7

Placeholder scan:
- no TBD/TODO placeholders remain
- all created files and commands are explicit

Type consistency:
- shared shell powers all three pages
- FAQ types are defined in the accordion component and reused by `/faqs`
