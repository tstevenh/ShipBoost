import type { Metadata } from "next";
import Link from "next/link";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildContactPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = {
  title: "Contact ShipBoost | ShipBoost",
  description:
    "Contact ShipBoost for founder support, listing questions, partnerships, or launch help at support@shipboost.io.",
};

const contactTopics = [
  {
    title: "Founder support",
    body:
      "Questions about submissions, launch weeks, dashboard access, or listing management.",
  },
  {
    title: "Partnerships",
    body:
      "Reach out for distribution partnerships, affiliate opportunities, or founder-friendly collaborations.",
  },
  {
    title: "Listing issues",
    body:
      "Use this if you found a broken listing, duplicate product, wrong details, or another catalog issue.",
  },
];

export default function ContactPage() {
  const env = getEnv();
  const schema = buildContactPageSchema({
    title: "Contact ShipBoost",
    description:
      "Contact ShipBoost for founder support, listing questions, partnerships, or launch help at support@shipboost.io.",
    url: `${env.NEXT_PUBLIC_APP_URL}/contact`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="Contact"
        title="Get in touch with ShipBoost"
        description="The fastest way to reach us is email. Use support@shipboost.io for founder questions, launch support, listing issues, or partnerships."
        primaryCtaLabel="Email support"
        primaryCtaHref="mailto:support@shipboost.io"
        secondaryCtaLabel="Submit your product"
        secondaryCtaHref="/submit"
        finalCtaTitle="Ready to launch instead?"
        finalCtaDescription="If your product is ready, go straight to submission or review pricing before you pick a launch path."
      >
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <h2 className="text-3xl font-black tracking-tight text-foreground">
          Main contact
        </h2>
        <div className="mt-6 rounded-2xl border border-border bg-muted/20 p-6">
          <p className="text-[10px] font-black tracking-[0.2em] text-muted-foreground/60">
            Email
          </p>
          <a
            href="mailto:support@shipboost.io"
            className="mt-3 inline-flex text-2xl font-black tracking-tight text-foreground hover:opacity-70 transition-opacity"
          >
            support@shipboost.io
          </a>
          <p className="mt-4 text-sm font-medium leading-relaxed text-muted-foreground">
            Use this for founder support, partnerships, listing questions, and
            anything else related to ShipBoost.
          </p>
        </div>
      </section>

        <section className="grid gap-6 lg:grid-cols-3">
        {contactTopics.map((topic) => (
          <article
            key={topic.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-2xl font-black tracking-tight text-foreground">
              {topic.title}
            </h2>
            <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
              {topic.body}
            </p>
          </article>
        ))}
      </section>

        <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Response expectations
          </h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
            ShipBoost is run with an operator mindset. We aim to keep replies
            clear and useful, especially for founders actively working through a
            launch or listing issue.
          </p>
        </article>

        <article className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            Looking for launch details first?
          </h2>
          <p className="mt-4 text-base font-medium leading-relaxed text-muted-foreground/80">
            Start with our practical guides if you are still evaluating how the
            platform works.
          </p>
          <div className="mt-6 space-y-2 text-sm font-black">
            <Link
              href="/how-it-works"
              className="block text-foreground hover:underline underline-offset-4"
            >
              Read How It Works →
            </Link>
            <Link
              href="/faqs"
              className="block text-foreground hover:underline underline-offset-4"
            >
              Read Founder FAQs →
            </Link>
          </div>
        </article>
        </section>
      </ContentPageShell>
    </>
  );
}
