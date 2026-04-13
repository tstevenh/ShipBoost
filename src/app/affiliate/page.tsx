import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildSimpleWebPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Affiliate Disclosure | ShipBoost",
  description:
    "Read how ShipBoost handles affiliate relationships, partner links, and related disclosures.",
  url: "/affiliate",
});

const sections = [
  {
    title: "How affiliate links work on ShipBoost",
    body: [
      "Some tools, products, and partner links featured on ShipBoost may include affiliate links. If you click one of those links and later make a purchase or sign up, ShipBoost may earn a commission.",
      "That commission helps support the operation of the platform, including directory maintenance, founder tooling, and launch infrastructure.",
    ],
  },
  {
    title: "Editorial independence",
    body: [
      "Affiliate availability does not guarantee a product will be listed, ranked, or recommended. ShipBoost aims to keep editorial and curation decisions separate from whether a commission exists.",
      "We care more about trust, usefulness, and category fit than adding more monetized links.",
    ],
  },
  {
    title: "Where affiliate links may appear",
    body: [
      "Affiliate links may appear on product listings, category pages, comparison pages, recommendation modules, newsletters, or other distribution surfaces operated by ShipBoost.",
      "Not every outbound link is an affiliate link. Some are plain references added for context, citations, or product discovery.",
    ],
  },
  {
    title: "Click tracking and measurement",
    body: [
      "To understand performance and maintain the platform, ShipBoost may track outbound clicks and referral activity related to affiliate or non-affiliate links.",
      "That tracking is used for analytics, attribution, fraud prevention, and product improvement.",
    ],
  },
  {
    title: "Questions",
    body: [
      "If you have questions about an affiliate relationship or how we handle outbound links, email support@shipboost.io.",
    ],
  },
];

export default function AffiliatePage() {
  const env = getEnv();
  const schema = buildSimpleWebPageSchema({
    type: "WebPage",
    title: "Affiliate Disclosure",
    description:
      "Read how ShipBoost handles affiliate links, commissions, editorial independence, and click tracking across directory listings and recommendations.",
    url: `${env.NEXT_PUBLIC_APP_URL}/affiliate`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="Disclosure"
        title="Affiliate Disclosure"
        description="ShipBoost may earn commissions from some outbound links. This page explains how those links work and how we think about trust, tracking, and editorial independence."
        primaryCtaLabel="Contact support"
        primaryCtaHref="mailto:support@shipboost.io"
        secondaryCtaLabel="Read privacy"
        secondaryCtaHref="/privacy"
        finalCtaTitle="Want the full legal context?"
        finalCtaDescription="Read our Terms and Privacy pages if you need the broader rules around data, submissions, and platform use."
      >
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">
          Last updated: April 11, 2026
        </p>
        </section>

        {sections.map((section) => (
          <section
            key={section.title}
            className="rounded-[2rem] border border-border bg-card p-8 shadow-sm"
          >
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              {section.title}
            </h2>
            <div className="mt-4 space-y-4">
              {section.body.map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-base font-medium leading-relaxed text-muted-foreground/80"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        ))}
      </ContentPageShell>
    </>
  );
}
