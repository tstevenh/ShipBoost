import type { Metadata } from "next";

import { JsonLdScript } from "@/components/seo/json-ld";
import { ContentPageShell } from "@/components/marketing/content-page-shell";
import {
  FaqAccordion,
  type FaqGroup,
} from "@/components/marketing/faq-accordion";
import { getEnv } from "@/server/env";
import { buildPublicPageMetadata } from "@/server/seo/page-metadata";
import { buildFaqPageSchema } from "@/server/seo/page-schema";

export const metadata: Metadata = buildPublicPageMetadata({
  title: "ShipBoost Founder FAQs | Launch Questions Answered",
  description:
    "Get answers to common ShipBoost questions about submissions, launch weeks, Free vs Premium Launch, payments, and ranking.",
  url: "/faqs",
});

const groups: FaqGroup[] = [
  {
    title: "Submission basics",
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
    title: "Free vs Premium",
    items: [
      {
        question: "What is the difference between Free Launch and Premium Launch?",
        answer:
          "Free Launch goes through review, requires badge verification, and is queued into the next available weekly cohort. Premium Launch lets you reserve a launch week, skips badge verification, and gets stronger baseline placement.",
      },
      {
        question: "Do I need badge verification for Premium Launch?",
        answer:
          "No. Badge verification is required for free launches, not Premium Launches.",
      },
    ],
  },
  {
    title: "Scheduling and ranking",
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
    title: "Payments and edits",
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
  const env = getEnv();
  const questions = groups.flatMap((group) =>
    group.items.map((item) => ({
      question: item.question,
      answer: item.answer,
    })),
  );
  const schema = buildFaqPageSchema({
    title: "Founder FAQs",
    description:
      "Answers to the most common ShipBoost founder questions about submissions, free vs Premium Launch, launch weeks, ranking, payments, and listing visibility.",
    url: `${env.NEXT_PUBLIC_APP_URL}/faqs`,
    questions,
  });

  return (
    <>
      <JsonLdScript data={schema} />
      <ContentPageShell
        eyebrow="Founder FAQs"
        title="The practical questions founders ask before they launch"
        description="Straight answers on submission rules, launch weeks, ranking, payments, and what to expect after you submit to ShipBoost."
        finalCtaTitle="Still deciding?"
        finalCtaDescription="Review pricing or start your submission and see which launch path fits your product."
      >
        <FaqAccordion groups={groups} />
      </ContentPageShell>
    </>
  );
}
