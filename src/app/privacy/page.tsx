import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildSimpleWebPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Privacy Policy | ShipBoost",
  description:
    "Read the ShipBoost privacy policy and how we handle account, submission, payment, and analytics data.",
  url: "/privacy",
});

const sections = [
  {
    title: "What We Collect",
    body: [
      "We collect information you provide directly, such as your name, email address, account details, submission content, screenshots, logos, launch preferences, billing-related metadata, and support messages.",
      "We also collect operational data such as log information, device or browser details, referral data, page activity, outbound click activity, and analytics about how people interact with ShipBoost.",
    ],
  },
  {
    title: "How We Use Information",
    body: [
      "We use data to run ShipBoost, authenticate accounts, process submissions, operate launch scheduling, deliver paid placements or digital services, improve directory quality, support founders, and maintain security.",
      "We may also use contact details to send service-related emails, such as sign-in links, submission updates, launch status notifications, receipts, support replies, and other transactional messages related to your account or purchase.",
    ],
  },
  {
    title: "Payments and Third Parties",
    body: [
      "If you purchase a paid launch product or digital service, payment information is handled by our payment providers. ShipBoost does not store your full payment card details.",
      "We may rely on third-party services for hosting, analytics, email delivery, authentication, payment processing, fraud prevention, and other operational needs. Those providers may process data on our behalf.",
    ],
  },
  {
    title: "Cookies and Analytics",
    body: [
      "ShipBoost may use cookies and similar technologies to keep you signed in, remember preferences, understand product usage, measure outbound clicks, and improve the service.",
      "We use analytics tools, including Google Analytics, to understand traffic, page usage, referral sources, and product interaction patterns. Those tools may collect browser, device, and usage data according to their own technologies and settings.",
      "If you disable certain cookies or browser storage, parts of the founder experience may not work correctly.",
    ],
  },
  {
    title: "How We Share Information",
    body: [
      "We do not sell personal data. We may share information with service providers who help us operate ShipBoost, process payments, analyze usage, or prevent abuse, or if required by law, legal process, or to protect the platform and its users.",
      "Content you choose to submit for public listing, launch placement, featured listing, or distribution support may be published publicly or shared with third-party launch or directory platforms as part of the service you request.",
    ],
  },
  {
    title: "Retention and Security",
    body: [
      "We keep data for as long as needed to operate ShipBoost, comply with legal obligations, resolve disputes, and enforce our policies.",
      "We use reasonable technical and organizational measures to protect information, but no system is completely secure.",
    ],
  },
  {
    title: "Your Choices",
    body: [
      "You can contact us to ask about your account data, request corrections, or request deletion, subject to legal and operational limits.",
      "If you no longer want to receive non-essential communications, you can opt out where available or contact support.",
    ],
  },
  {
    title: "Changes and Contact",
    body: [
      "We may update this Privacy Policy from time to time. If the policy changes materially, we will update the effective date here.",
      "For privacy questions or requests, contact support@shipboost.io.",
    ],
  },
];

export default function PrivacyPage() {
  const env = getEnv();
  const schema = buildSimpleWebPageSchema({
    type: "WebPage",
    title: "Privacy",
    description:
      "Read how ShipBoost collects, uses, stores, and protects personal data across accounts, submissions, payments, launches, and analytics.",
    url: `${env.NEXT_PUBLIC_APP_URL}/privacy`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="Legal"
        title="Privacy"
        description="This page explains what data ShipBoost collects, how we use it, when we share it, how payments and analytics are handled, and how founders can contact us about privacy-related questions."
        primaryCtaLabel="Contact support"
        primaryCtaHref="mailto:support@shipboost.io"
        secondaryCtaLabel="Read terms"
        secondaryCtaHref="/terms"
        finalCtaTitle="Questions about your data?"
        finalCtaDescription="If you need help with account data, submission records, or privacy requests, email support and we will review it."
      >
        <section className="rounded-[2rem] border border-border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium leading-relaxed text-muted-foreground">
          Effective date: April 11, 2026
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
