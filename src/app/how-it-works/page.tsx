import type { Metadata } from "next";
import Link from "next/link";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildArticlePageSchema } from "@/server/seo/page-schema";

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
    title: "2. Enter the right launch flow",
    body:
      "Free launches are reviewed and queued into weekly cohorts. Premium Launches reserve a launch week after payment confirmation.",
  },
  {
    title: "3. Launch into a weekly board",
    body:
      "ShipBoost organizes launches in weekly windows so strong products stay visible longer and are not buried in a one-day spike.",
  },
];

const rules = [
  {
    title: "Free Launch",
    points: [
      "Reviewed before approval",
      "Requires badge verification",
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
  const env = getEnv();
  const schema = buildArticlePageSchema({
    title: "How ShipBoost works",
    description:
      "Learn how ShipBoost works: weekly launch cohorts, free vs Premium Launch rules, ranking, approval, and what founders can expect after submitting.",
    url: `${env.NEXT_PUBLIC_APP_URL}/how-it-works`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="How it works"
        title="How ShipBoost works"
        description="ShipBoost is built for bootstrapped SaaS founders who want a cleaner launch system, clearer rules, and stronger distribution than a noisy daily feed."
      >
        <section className="grid gap-6">
        {steps.map((step) => (
          <article
            key={step.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-foreground ">
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
          <article
            key={rule.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-foreground ">
              {rule.title}
            </h2>
            <ul className="mt-6 space-y-3">
              {rule.points.map((point) => (
                <li
                  key={point}
                  className="text-sm font-medium leading-relaxed text-muted-foreground"
                >
                  {point}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground ">
          How ranking works
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
          The top three spots are earned by the most upvotes in the active
          week. After that, Premium Launches appear ahead of free launches,
          which gives paid launches stronger baseline placement without removing
          the vote-driven leaderboard.
        </p>
      </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground ">
          What happens after submission
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
          Founders can track review status, payment state, and launch date from
          the dashboard. Once scheduled, the launch date stays visible on the
          submission card so there is no ambiguity about timing.
        </p>
        <div className="mt-6">
          <Link
            href="/faqs"
            className="text-sm font-black text-foreground hover:underline underline-offset-4"
          >
            Read the founder FAQs →
          </Link>
        </div>
        </section>
      </ContentPageShell>
    </>
  );
}
