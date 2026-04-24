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
      {
        question: "Why submit to ShipBoost if the platform is still early?",
        answer:
          "Because the value is not only a one-day spike. ShipBoost gives founders a cleaner public listing, weekly board visibility, and discovery paths that can keep compounding through categories and alternatives pages over time.",
      },
    ],
  },
  {
    title: "Free vs Premium",
    items: [
      {
        question: "What is the difference between Free Launch and Premium Launch?",
        answer:
          "Free Launch goes through manual review and is queued into the next available weekly cohort. Founders can add the ShipBoost badge for priority review within 24-48 hours. Premium Launch lets you reserve a launch week and gets stronger baseline placement.",
      },
      {
        question: "Do I need badge verification for Premium Launch?",
        answer:
          "No. The badge is optional for Free Launch and not part of the Premium Launch flow.",
      },
      {
        question: "What is the editorial launch spotlight?",
        answer:
          "For the first 100 Premium Launches, ShipBoost includes one standardized editorial launch spotlight published during launch week. It is a founder feature linked to your listing, not a custom commissioned article.",
      },
      {
        question: "Why add the ShipBoost badge?",
        answer:
          "The badge helps visitors see where you launched, adds a simple trust signal to your site, and makes your free launch eligible for priority review within 24-48 hours.",
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
      {
        question: "Is Premium Launch still merit-based if votes decide the top three?",
        answer:
          "Yes. The top three positions are still earned by votes. Premium Launch improves your baseline placement after the leaderboard, but it does not replace the vote-driven top spots.",
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
      {
        question: "Do I keep my public listing after launch?",
        answer:
          "Yes. The goal is not just launch-day visibility. ShipBoost keeps the public listing available so it can continue working through categories, tags, and alternatives pages after launch week ends.",
      },
      {
        question: "Can I launch on ShipBoost even if I launch elsewhere too?",
        answer:
          "Yes. ShipBoost does not require exclusivity. Many founders will still use other launch channels. ShipBoost is designed to strengthen the public listing and long-tail discovery side of the launch, not replace every other surface.",
      },
    ],
  },
  {
    title: "Why ShipBoost",
    items: [
      {
        question: "How is ShipBoost different from a generic directory?",
        answer:
          "Generic directories usually give you a permanent listing but weak discovery context. ShipBoost combines a launch board, a cleaner public listing, and discovery surfaces like categories and alternatives so the listing has more structure and purpose.",
      },
      {
        question: "How is ShipBoost different from daily launch sites?",
        answer:
          "Daily launch sites can create a spike, but products get buried quickly when the board resets. ShipBoost uses weekly launch windows so products have more room, then keeps the listing useful after launch day through longer-term discovery surfaces.",
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
