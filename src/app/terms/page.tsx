import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildSimpleWebPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "Terms of Service | ShipBoost",
  description:
    "Read the ShipBoost terms covering platform use, submissions, launch placements, payments, refunds, and founder responsibilities.",
  url: "/terms",
});

const sections = [
  {
    title: "Scope",
    body: [
      "These Terms govern your access to and use of ShipBoost, including our public directory, launch surfaces, founder dashboard, submissions, paid placements, digital services, and related software tools.",
      "By using ShipBoost, creating an account, or submitting a product, you agree to these Terms. If you do not agree, do not use the service.",
    ],
  },
  {
    title: "Accounts and Eligibility",
    body: [
      "You must provide accurate information when creating an account or submitting a product. You are responsible for activity that happens under your account.",
      "You may not use ShipBoost to submit fraudulent, misleading, unlawful, or harmful products, or to impersonate another person or company.",
    ],
  },
  {
    title: "Submissions, Listings, and Digital Services",
    body: [
      "You keep ownership of the content you submit, but you grant ShipBoost permission to host, display, edit for formatting, and distribute that content as needed to operate the platform.",
      "ShipBoost may offer free launches, premium launch placements, featured listings, distribution support, directory submission services, and other digital founder tools or software features.",
      "We may review, reject, edit, hide, reschedule, or remove submissions that do not meet our quality standards, violate these Terms, or create trust issues for users.",
    ],
  },
  {
    title: "Launch Scheduling and Payments",
    body: [
      "Free launches are scheduled according to ShipBoost's launch queue and review rules. Premium Launches are scheduled according to the launch week you select and the availability we present at checkout.",
      "Payments for paid launch products, featured placements, and other digital services are processed by our payment providers. ShipBoost does not directly store full payment card details.",
      "You are responsible for providing accurate billing information and for any taxes, duties, or similar charges that apply to your purchase unless the payment provider collects and remits them on our behalf.",
    ],
  },
  {
    title: "Refunds, Cancellation, and Subscription Terms",
    body: [
      "Paid launch queue priority, featured placements, and promotional or distribution services are refundable if ShipBoost rejects the submission before publication or if we are unable to deliver the purchased service.",
      "Once a launch placement, featured listing, or other digital service has been published or substantially delivered, payments are non-refundable except in cases of duplicate payment, billing error, fraud, technical delivery failure caused by ShipBoost, or where required by law.",
      "If a delivery issue can reasonably be corrected, ShipBoost may offer rescheduling, replacement placement, or service credit instead of a cash refund.",
      "If ShipBoost offers subscription products in the future, subscriptions may be canceled before renewal to stop future billing. Cancellation does not automatically create a refund for the current billing period unless required by law or expressly stated by ShipBoost.",
    ],
  },
  {
    title: "Acceptable Use",
    body: [
      "You may not misuse ShipBoost by attempting to scrape restricted areas, interfere with the service, inflate votes or engagement, manipulate rankings, abuse referral systems, or submit spam.",
      "You also may not use ShipBoost to distribute malware, deceptive offers, unlawful content, or content that infringes the rights of others.",
    ],
  },
  {
    title: "Third-Party Services and Links",
    body: [
      "ShipBoost may link to third-party websites, products, and services. We do not control those third parties and are not responsible for their content, conduct, or policies.",
      "Some links on ShipBoost may be affiliate links. Our separate Affiliate Disclosure explains how those links work.",
    ],
  },
  {
    title: "No Guarantee and Limitation of Liability",
    body: [
      "ShipBoost is provided on an as-is and as-available basis. We do not guarantee uninterrupted availability, acceptance of a submission, ranking position, traffic, conversions, revenue, business outcomes, or approval by third-party directories or launch platforms.",
      "To the maximum extent allowed by law, ShipBoost will not be liable for indirect, incidental, special, consequential, or punitive damages arising from your use of the service.",
    ],
  },
  {
    title: "Changes and Contact",
    body: [
      "We may update these Terms from time to time. If we make material changes, we may update the effective date and publish the revised version here.",
      "If you have questions about these Terms, contact support@shipboost.io.",
    ],
  },
];

export default function TermsPage() {
  const env = getEnv();
  const schema = buildSimpleWebPageSchema({
    type: "WebPage",
    title: "Terms",
    description:
      "Read the terms that govern ShipBoost, including submissions, launch scheduling, paid placements, payments, refunds, listings, and acceptable use.",
    url: `${env.NEXT_PUBLIC_APP_URL}/terms`,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="Legal"
        title="Terms"
        description="These terms explain how ShipBoost works, what founders can submit, how launch placements and digital services are handled, and the refund and payment rules for using the platform."
        primaryCtaLabel="Contact support"
        primaryCtaHref="mailto:support@shipboost.io"
        secondaryCtaLabel="Read privacy"
        secondaryCtaHref="/privacy"
        finalCtaTitle="Need clarification before you submit?"
        finalCtaDescription="If you have a question about launch rules, payments, or listing policies, email support before you commit."
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
