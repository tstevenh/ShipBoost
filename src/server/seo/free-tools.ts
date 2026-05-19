export type FreeToolSlug =
  | "reaction-time-test"
  | "fake-notification-generator";

export type FreeToolFaq = {
  question: string;
  answer: string;
};

export type FreeToolRelatedLink = {
  label: string;
  href: string;
};

export type FreeToolEntry = {
  slug: FreeToolSlug;
  title: string;
  shortTitle: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  applicationCategory: string;
  indexCard: {
    eyebrow: string;
    description: string;
  };
  relatedLinks: FreeToolRelatedLink[];
  faq: FreeToolFaq[];
  howTo?: {
    name: string;
    description: string;
    steps: string[];
  };
};

export const freeToolsRegistry: Record<FreeToolSlug, FreeToolEntry> = {
  "reaction-time-test": {
    slug: "reaction-time-test",
    title: "Reaction Time Test",
    shortTitle: "Reaction test",
    metaTitle: "Reaction Time Test Online | Human Benchmark Reflex Test",
    metaDescription:
      "Take a free reaction time test online, compare your score with Human Benchmark-style ranges, and track your best and average reflex time across five rounds.",
    intro:
      "Measure how quickly you can respond to a visual cue with a simple five-round reaction time test built for browsers, keyboards, touch screens, and quick benchmark checks.",
    primaryKeyword: "reaction time test",
    supportingKeywords: [
      "human benchmark",
      "reaction time test online",
      "human benchmark reaction time",
      "reflex test",
    ],
    applicationCategory: "GameApplication",
    indexCard: {
      eyebrow: "Benchmark",
      description:
        "Run a five-round reflex test with best score, average score, and simple result interpretation.",
    },
    relatedLinks: [
      { label: "Fake notification generator", href: "/free-tools/fake-notification-generator" },
      { label: "Startup directories resource", href: "/resources/startup-directories" },
      { label: "Launch guide", href: "/launch-guide" },
    ],
    faq: [
      {
        question: "What is a good reaction time test score?",
        answer:
          "Many casual online reaction time tests place typical desktop scores around 200 to 300 milliseconds. Hardware, display refresh rate, input device, sleep, and attention can all affect the result.",
      },
      {
        question: "Is this the same as Human Benchmark?",
        answer:
          "This tool uses a similar browser-based reflex test format, but it is an independent ShipBoost free tool. Use it for quick entertainment and benchmarking, not clinical measurement.",
      },
      {
        question: "Can I use the reaction time test on mobile?",
        answer:
          "Yes. Tap the test panel when it turns green. Mobile touch latency can differ from mouse and keyboard latency, so compare scores on the same device when tracking improvement.",
      },
      {
        question: "How many rounds does the test use?",
        answer:
          "The tool keeps the latest five rounds, then calculates your best and average reaction time from that session history.",
      },
    ],
  },
  "fake-notification-generator": {
    slug: "fake-notification-generator",
    title: "Fake Notification Generator",
    shortTitle: "Notification generator",
    metaTitle: "Fake Notification Generator | Instagram, Discord & App Mockups",
    metaDescription:
      "Create fake notification mockups for Instagram, Discord, Stripe, Shopify, Gmail, TikTok, Snapchat, PayPal, LinkedIn, or a custom app and export them as PNG assets.",
    intro:
      "Design clean notification mockups for demos, landing pages, social posts, product storytelling, and creative assets without pretending they are real alerts.",
    primaryKeyword: "fake notification generator",
    supportingKeywords: [
      "fake notification",
      "fake notification instagram",
      "fake instagram notification maker",
      "discord fake notification",
      "fake text notification",
    ],
    applicationCategory: "DesignApplication",
    indexCard: {
      eyebrow: "Mockup maker",
      description:
        "Build iPhone-style notification mockups with platform presets, theme controls, positioning, and PNG export.",
    },
    relatedLinks: [
      { label: "Reaction time test", href: "/free-tools/reaction-time-test" },
      { label: "Submit your product", href: "/submit" },
      { label: "Compare launch pricing", href: "/pricing" },
    ],
    howTo: {
      name: "How to create a fake notification mockup",
      description:
        "Use the generator to create a notification mockup for design, demo, and creative use.",
      steps: [
        "Choose a platform preset such as Instagram, Discord, Stripe, Shopify, Gmail, TikTok, Snapchat, PayPal, LinkedIn, or custom app.",
        "Edit the app title, message, timestamp, status text, theme, wallpaper, and notification position.",
        "Review the preview and export a deterministic PNG mockup for use in creative assets.",
      ],
    },
    faq: [
      {
        question: "What is a fake notification generator for?",
        answer:
          "It is for creating notification mockups for product demos, landing pages, social content, design examples, and creative assets. It should not be used to mislead people.",
      },
      {
        question: "Can I make a fake Instagram notification?",
        answer:
          "Yes. Choose the Instagram preset, then edit the title, message, time, theme, and background before exporting the mockup as a PNG.",
      },
      {
        question: "Can I make a Discord fake notification?",
        answer:
          "Yes. The Discord preset gives you a Discord-style starting point that you can customize for mockups, tutorials, and illustrative assets.",
      },
      {
        question: "Does PNG export require a screenshot service?",
        answer:
          "No. The export is rendered locally in your browser with a deterministic canvas renderer, so no screenshot dependency or account is needed.",
      },
    ],
  },
};

export const freeTools = Object.values(freeToolsRegistry).sort((left, right) =>
  left.title.localeCompare(right.title),
);

export function getFreeTool(slug: FreeToolSlug) {
  return freeToolsRegistry[slug];
}

export function getFreeToolPath(slug: FreeToolSlug) {
  return `/free-tools/${slug}`;
}
