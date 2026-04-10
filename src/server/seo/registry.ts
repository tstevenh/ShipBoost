import type {
  AlternativesSeoEntry,
  BestTagSeoEntry,
} from "@/server/seo/types";

// Intentionally code-managed. Alternatives pages are required manual entries.
export const alternativesSeoRegistry: Record<string, AlternativesSeoEntry> = {
  shipfast: {
    slug: "shipfast",
    anchorToolSlug: "shipfast",
    title: "Best ShipFast Alternatives",
    intro: "Explore the best ShipFast alternatives. Compare top SaaS boilerplates and starter kits to launch your next product faster.",
    metaTitle: "7+ Best ShipFast Alternatives (SaaS Boilerplates) | Shipboost",
    metaDescription: "Looking for ShipFast alternatives? Compare Makerkit, MkSaaS, supastarter, and more high-quality SaaS boilerplates for your next project.",
    toolSlugs: ["makerkit", "mksaas", "supastarter", "monokit", "saasbrella", "goilerplate"],
  },
  dirstarter: {
    slug: "dirstarter",
    anchorToolSlug: "dirstarter",
    title: "Best DirStarter Alternatives",
    intro: "Compare the best DirStarter alternatives for building SEO-ready directory businesses and resource hubs.",
    metaTitle: "Best DirStarter Alternatives for Directory Sites | Shipboost",
    metaDescription: "Find the best DirStarter alternatives like Directify, DirectoryFast, and more to launch your niche directory business fast.",
    toolSlugs: ["directify", "mksaas-directoryfast", "supastarter-directoryeasy", "saasbrella-directorystack", "goilerplate-next-js-directory"],
  },
  tapfiliate: {
    slug: "tapfiliate",
    anchorToolSlug: "tapfiliate",
    title: "Best Tapfiliate Alternatives",
    intro: "Compare Tapfiliate alternatives for managing your affiliate, referral, and partner programs.",
    metaTitle: "Best Tapfiliate Alternatives for Affiliate Management | Shipboost",
    metaDescription: "Explore Tapfiliate alternatives like Rewardful, Tolt, and PromoteKit to scale your SaaS partnership revenue.",
    toolSlugs: ["rewardful", "trackdesk", "promotekit", "partnero", "tolt", "affonso", "tracknow"],
  },
  frase: {
    slug: "frase",
    anchorToolSlug: "frase",
    title: "Best Frase Alternatives",
    intro: "Looking for Frase alternatives? Compare the best AI SEO platforms to improve your search rankings and content performance.",
    metaTitle: "Best Frase Alternatives for AI SEO & Writing | Shipboost",
    metaDescription: "Compare Frase alternatives like Surfer, Scalenut, and Outranking to automate your SEO content workflow.",
    toolSlugs: ["scalenut", "surfer", "outranking", "rankability", "aiseo", "seoengine", "blogseo"],
  },
  "vista-social": {
    slug: "vista-social",
    anchorToolSlug: "vista-social",
    title: "Best Vista Social Alternatives",
    intro: "Compare Vista Social alternatives for scheduling, managing, and growing your social media presence across channels.",
    metaTitle: "Best Vista Social Alternatives for Social Management | Shipboost",
    metaDescription: "Explore Vista Social alternatives like Buffer, Sked Social, and Manychat to manage your social media workflows.",
    toolSlugs: ["sked-social", "sociamonials", "buffer", "manychat", "socialrails", "waalaxy", "octolens"],
  },
  pipedrive: {
    slug: "pipedrive",
    anchorToolSlug: "pipedrive",
    title: "Best Pipedrive Alternatives",
    intro: "Compare Pipedrive alternatives for managing your sales pipeline, prospecting, and outbound workflows.",
    metaTitle: "Best Pipedrive Alternatives for Sales CRM | Shipboost",
    metaDescription: "Find the best Pipedrive alternatives like Close, Salesflare, and Apollo to streamline your sales engagement.",
    toolSlugs: ["close", "salesflare", "capsulecrm", "nutshell", "apollo", "reply", "folk"],
  },
  livechat: {
    slug: "livechat",
    anchorToolSlug: "livechat",
    title: "Best LiveChat Alternatives",
    intro: "Compare LiveChat alternatives for handling customer support, ticketing, and chat-based sales.",
    metaTitle: "Best LiveChat Alternatives for Support & Sales | Shipboost",
    metaDescription: "Explore LiveChat alternatives like Intercom, Tidio, and HelpDesk to improve your customer communication.",
    toolSlugs: ["intercom", "tidio", "helpdesk", "chatbot", "jivochat", "sleekflow", "respond-io"],
  },
};

// Optional override layer for best-by-tag pages. Tools auto-load from DB tag membership.
export const bestTagSeoRegistry: Record<string, BestTagSeoEntry> = {};
