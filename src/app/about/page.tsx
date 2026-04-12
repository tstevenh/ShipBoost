import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildSimpleWebPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = {
  title: "About ShipBoost | ShipBoost",
  description:
    "Learn what ShipBoost is, who it is for, and why it is built around trust, weekly launches, and real distribution for bootstrapped SaaS founders.",
};

const pillars = [
  {
    title: "Trust first",
    body:
      "Founders do not just need exposure. They need a product page, a launch surface, and a surrounding context that makes them look credible when the right people arrive.",
  },
  {
    title: "Distribution over vanity",
    body:
      "A launch is not useful if all it creates is a short spike and no follow-through. ShipBoost is built to help launch turn into ongoing discovery and momentum.",
  },
  {
    title: "Quality over junk",
    body:
      "ShipBoost is meant to feel filtered, not bloated. The goal is a cleaner directory, stronger launch signals, and a better experience for both founders and buyers.",
  },
];

export default function AboutPage() {
  const env = getEnv();
  const schema = buildSimpleWebPageSchema({
    type: "AboutPage",
    title: "About ShipBoost",
    description:
      "Learn what ShipBoost is, who it is for, and why it is built around trust, weekly launches, and real distribution for bootstrapped SaaS founders.",
    url: `${env.NEXT_PUBLIC_APP_URL}/about`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="About"
        title="Built for founders who want more than vanity launches"
        description="ShipBoost is a launch and distribution platform for bootstrapped SaaS founders who want trust, visibility, and real momentum instead of noise."
        finalCtaTitle="Launch with a cleaner system"
        finalCtaDescription="Submit your product when you are ready, or compare the free and Premium Launch paths before you decide."
      >
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          What ShipBoost is
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
          ShipBoost helps bootstrapped SaaS founders earn trust and
          distribution. It is a launch system, a directory, and a founder
          workspace built around clearer rules and better visibility.
        </p>
      </section>

        <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            What ShipBoost is not
          </h2>
          <ul className="mt-6 space-y-3 text-sm font-medium leading-relaxed text-muted-foreground">
            <li>Not a random startup cemetery.</li>
            <li>Not a Product Hunt clone.</li>
            <li>Not a generic AI tools list.</li>
            <li>Not a low-trust SEO farm.</li>
          </ul>
        </article>

        <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Why weekly launches
          </h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
            Weekly cohorts give founders more room to be seen and compared.
            They reduce the churn of a daily reset and create a fairer structure
            for both free and Premium Launches.
          </p>
        </article>
      </section>

        <section className="grid gap-6 lg:grid-cols-3">
        {pillars.map((pillar) => (
          <article
            key={pillar.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {pillar.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {pillar.body}
            </p>
          </article>
        ))}
      </section>

        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Built for bootstrapped SaaS founders
        </h2>
        <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
          ShipBoost is designed for founders who care about efficient growth,
          practical distribution, and clean positioning. The product favors
          signal, structure, and credibility over hype.
        </p>
        </section>
      </ContentPageShell>
    </>
  );
}
