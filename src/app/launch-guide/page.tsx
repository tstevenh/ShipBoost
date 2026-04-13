import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildArticlePageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "SaaS Launch Guide for Bootstrapped Founders | ShipBoost",
  description:
    "A practical SaaS launch guide for founders: what to prepare, what to avoid, and how to turn launch day into long-term momentum.",
  url: "/launch-guide",
  openGraphType: "article",
});

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
  const env = getEnv();
  const schema = buildArticlePageSchema({
    title: "Launch Guide For Bootstrapped SaaS Founders",
    description:
      "A practical launch guide for bootstrapped SaaS founders: what to prepare, what to avoid, how weekly launches work, and how to turn launch into momentum.",
    url: `${env.NEXT_PUBLIC_APP_URL}/launch-guide`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="Launch guide"
        title="A launch guide for founders who want momentum, not noise"
        description="Most launch advice is built around short-term spikes. This guide focuses on trust, positioning, and distribution so a launch keeps working after day one."
        finalCtaTitle="Put the guide into practice"
        finalCtaDescription="If your product is ready, submit it to ShipBoost or compare free and Premium Launch options."
      >
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground ">
          The launch mistakes that waste good products
        </h2>
        <ul className="mt-6 space-y-4">
          {mistakes.map((mistake) => (
            <li
              key={mistake}
              className="text-base font-medium leading-relaxed text-muted-foreground/80"
            >
              {mistake}
            </li>
          ))}
        </ul>
      </section>

        <section className="grid gap-6 lg:grid-cols-3">
        {[
          {
            title: "1. Prepare trust signals",
            body:
              "Before launch, tighten the tagline, screenshots, pricing clarity, and founder links. Distribution works better when the product already looks credible.",
          },
          {
            title: "2. Pick the right launch channel",
            body:
              "Not every launch surface is equal. Daily feeds reward noise. Weekly cohorts give better products more room to be seen and compared.",
          },
          {
            title: "3. Keep distributing after launch",
            body:
              "A launch should lead into directory submissions, social proof, founder outreach, and a public listing that keeps compounding.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-foreground ">
              {item.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {item.body}
            </p>
          </article>
        ))}
      </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground ">
          Weekly launch checklist
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {checklist.map((item) => (
            <div
              key={item}
              className="rounded-2xl border border-border bg-muted/20 p-5 text-sm font-bold text-foreground"
            >
              {item}
            </div>
          ))}
        </div>
      </section>

        <section className="grid gap-6 lg:grid-cols-2">
        {[
          {
            title: "When free launch is enough",
            body:
              "Use the free option when you want visibility, can complete badge verification, and are comfortable joining the next available weekly cohort.",
          },
          {
            title: "When Premium Launch makes sense",
            body:
              "Use Premium Launch when timing matters, you want to reserve a specific week, or you want stronger baseline placement in the board.",
          },
        ].map((item) => (
          <article
            key={item.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-foreground ">
              {item.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {item.body}
            </p>
          </article>
        ))}
        </section>
      </ContentPageShell>
    </>
  );
}
