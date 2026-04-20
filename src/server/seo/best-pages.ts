import type { BestHubSection, BestPageEntry } from "@/server/seo/types";

const SUPPORT_TOOLS = {
  zendesk: "zendesk",
  freshdesk: "freshdesk",
  helpScout: "help-scout",
  intercom: "intercom",
  gorgias: "gorgias",
  crisp: "crisp",
  front: "front",
  zohoDesk: "zoho-desk",
  liveAgent: "liveagent",
  tidio: "tidio",
} as const;

const CRM_TOOLS = {
  hubspot: "hubspot",
  attio: "attio",
  pipedrive: "pipedrive",
  close: "close",
  zohoCrm: "zoho-crm",
  salesflare: "salesflare",
  folk: "folk",
  freshsales: "freshsales",
  mondayCrm: "monday-crm",
  nutshell: "nutshell",
  capsuleCrm: "capsulecrm",
  copper: "copper",
  apollo: "apollo",
} as const;

export const bestPagesRegistry: Record<string, BestPageEntry> = {
  "help-desk-software": {
    slug: "help-desk-software",
    targetKeyword: "best help desk software",
    title: "Best Help Desk Software",
    metaTitle: "Best Help Desk Software for Growing Teams | ShipBoost",
    metaDescription:
      "Compare the best help desk software for growing teams, with clear verdicts, buyer-fit guidance, and practical tradeoffs across leading support platforms.",
    intro:
      "The best help desk software is not always the biggest brand. The right choice depends on how much ticket structure, automation, collaboration, and multichannel support your team actually needs right now.",
    whoItsFor:
      "This page is for founders, operators, and support leads choosing a system to manage tickets, customer conversations, and support workflows as volume grows beyond a shared inbox.",
    howWeEvaluated: [
      "How quickly a lean team can get productive",
      "Ticketing depth, routing, and workflow control",
      "Knowledge base and self-serve support coverage",
      "Automation, reporting, and multichannel support",
      "Overall fit for startup and small-business support teams",
    ],
    comparisonTable: [
      {
        label: "Best for",
        valuesByToolSlug: {
          [SUPPORT_TOOLS.zendesk]: "Scaling support operations",
          [SUPPORT_TOOLS.freshdesk]: "Balanced feature depth",
          [SUPPORT_TOOLS.helpScout]: "Simple, human support",
          [SUPPORT_TOOLS.intercom]: "Messaging-first support",
          [SUPPORT_TOOLS.gorgias]: "Ecommerce support teams",
          [SUPPORT_TOOLS.front]: "Shared inbox collaboration",
          [SUPPORT_TOOLS.zohoDesk]: "Budget-conscious service teams",
          [SUPPORT_TOOLS.liveAgent]: "All-in-one multichannel support",
        },
      },
      {
        label: "Pricing posture",
        valuesByToolSlug: {
          [SUPPORT_TOOLS.zendesk]: "Premium",
          [SUPPORT_TOOLS.freshdesk]: "Mid-market friendly",
          [SUPPORT_TOOLS.helpScout]: "Straightforward paid plans",
          [SUPPORT_TOOLS.intercom]: "Premium",
          [SUPPORT_TOOLS.gorgias]: "Premium for ecommerce",
          [SUPPORT_TOOLS.front]: "Premium collaboration pricing",
          [SUPPORT_TOOLS.zohoDesk]: "Budget-friendly",
          [SUPPORT_TOOLS.liveAgent]: "Accessible paid plans",
        },
      },
      {
        label: "Support style",
        valuesByToolSlug: {
          [SUPPORT_TOOLS.zendesk]: "Ticket-first",
          [SUPPORT_TOOLS.freshdesk]: "Ticket-first",
          [SUPPORT_TOOLS.helpScout]: "Inbox-first",
          [SUPPORT_TOOLS.intercom]: "Messaging-first",
          [SUPPORT_TOOLS.gorgias]: "Commerce-first support",
          [SUPPORT_TOOLS.front]: "Shared inbox-first",
          [SUPPORT_TOOLS.zohoDesk]: "Structured ticketing",
          [SUPPORT_TOOLS.liveAgent]: "Mixed channels",
        },
      },
    ],
    rankedTools: [
      {
        toolSlug: SUPPORT_TOOLS.freshdesk,
        rank: 1,
        verdict:
          "Freshdesk is the strongest all-rounder for most growing teams because it balances help-desk depth, usability, and a more approachable ramp than heavier enterprise-first systems.",
        bestFor: "Teams that want strong ticketing and automation without jumping straight into enterprise complexity.",
        notIdealFor: "Companies that want the lightest possible support stack or a pure messaging-led workflow.",
        criteriaHighlights: ["Balanced feature depth", "Automation", "SMB fit"],
      },
      {
        toolSlug: SUPPORT_TOOLS.helpScout,
        rank: 2,
        verdict:
          "Help Scout is the best fit when the goal is cleaner, more human support rather than maximum admin complexity. It stays simple without feeling flimsy.",
        bestFor: "SaaS and service teams that care about support quality, inbox collaboration, and a lower-friction rollout.",
        notIdealFor: "Teams that need the deepest enterprise routing, admin controls, or channel sprawl.",
        criteriaHighlights: ["Ease of use", "Shared inbox", "Knowledge base"],
      },
      {
        toolSlug: SUPPORT_TOOLS.zendesk,
        rank: 3,
        verdict:
          "Zendesk remains the benchmark for scaled support operations. It earns its place when you need mature ticketing, reporting, and admin control more than simplicity.",
        bestFor: "Larger or fast-growing support teams that need robust workflows, reporting, and long-term operational depth.",
        notIdealFor: "Small teams that want lighter setup, lower cost, or less operational overhead.",
        criteriaHighlights: ["Scalability", "Workflow depth", "Reporting"],
      },
      {
        toolSlug: SUPPORT_TOOLS.intercom,
        rank: 4,
        verdict:
          "Intercom is strongest when support and messaging are tightly connected. It is especially compelling if your support experience is chat-heavy and customer engagement matters too.",
        bestFor: "SaaS teams that want conversational support, AI workflows, and customer messaging in one platform.",
        notIdealFor: "Teams that mainly want classic ticketing at a lower price point.",
        criteriaHighlights: ["Messaging", "AI support", "Modern UX"],
      },
      {
        toolSlug: SUPPORT_TOOLS.gorgias,
        rank: 5,
        verdict:
          "Gorgias is a high-value niche choice for ecommerce. It should rank lower in a general help-desk page, but it can outperform broader tools for merchant support workflows.",
        bestFor: "Ecommerce support teams that need order context and store-connected support workflows.",
        notIdealFor: "Non-commerce businesses that do not benefit from the ecommerce specialization.",
        criteriaHighlights: ["Ecommerce fit", "Automation", "Support context"],
      },
      {
        toolSlug: SUPPORT_TOOLS.front,
        rank: 6,
        verdict:
          "Front stands out when the team wants collaborative customer communication that still feels like email. It is a better fit for some workflows than a ticket-first desk.",
        bestFor: "Teams that manage high-value conversations across support, success, and operations in a shared inbox model.",
        notIdealFor: "Support orgs that want a classic help-desk system first and foremost.",
        criteriaHighlights: ["Collaboration", "Shared inbox", "Operations fit"],
      },
      {
        toolSlug: SUPPORT_TOOLS.zohoDesk,
        rank: 7,
        verdict:
          "Zoho Desk is a practical value pick. It gives structured ticketing and automation without the same cost posture as premium incumbents.",
        bestFor: "Small and mid-sized teams that want stronger service workflows while controlling software spend.",
        notIdealFor: "Teams optimizing for polished UX or premium support experience above all else.",
        criteriaHighlights: ["Value", "Ticketing", "Cost control"],
      },
      {
        toolSlug: SUPPORT_TOOLS.liveAgent,
        rank: 8,
        verdict:
          "LiveAgent makes sense when breadth matters more than elegance. It covers multiple support channels well enough to be a credible all-in-one option.",
        bestFor: "Teams that want ticketing, chat, and broader support-channel coverage in one stack.",
        notIdealFor: "Teams that care most about modern UX or a cleaner operational model.",
        criteriaHighlights: ["Multichannel", "Breadth", "All-in-one"],
      },
    ],
    faq: [
      {
        question: "What is the difference between help desk software and customer support software?",
        answer:
          "Help desk software usually refers to ticketing, queues, routing, and operational support workflows. Customer support software is broader and can also include chat, knowledge bases, automation, inbox collaboration, and customer messaging.",
      },
      {
        question: "Is Zendesk still the best help desk software?",
        answer:
          "Zendesk is still one of the strongest platforms for scaled support operations, but it is not automatically the best fit for every team. Smaller teams often prefer lighter tools like Help Scout or more balanced options like Freshdesk.",
      },
      {
        question: "What should a startup prioritize when choosing help desk software?",
        answer:
          "Startups should prioritize speed to value, clear workflows, sane pricing, automation for repetitive support work, and whether the tool matches the way the team already handles customer conversations.",
      },
    ],
    internalLinks: [
      {
        href: "/categories/support",
        label: "Browse support tools",
        description: "Explore the broader support category on ShipBoost.",
      },
      {
        href: "/alternatives/zendesk",
        label: "Compare Zendesk alternatives",
        description: "See which tools compete most directly with Zendesk.",
      },
      {
        href: "/tags/help-desk",
        label: "More help desk tools",
        description: "Browse support products grouped by help-desk intent.",
      },
    ],
    primaryCategorySlug: "support",
    supportingTagSlugs: ["help-desk", "customer-support", "ticketing"],
    customSections: [
      {
        heading: "How to use this ranking",
        body:
          "If your team is still small, do not overbuy for imagined future complexity. If support volume is already rising fast, lean toward systems with stronger routing, reporting, and self-serve support from the start.",
      },
    ],
  },
  "customer-support-software": {
    slug: "customer-support-software",
    targetKeyword: "best customer support software",
    title: "Best Customer Support Software",
    metaTitle: "Best Customer Support Software for Modern Teams | ShipBoost",
    metaDescription:
      "Compare the best customer support software for modern teams, including ticketing, messaging, shared inbox, and multichannel support options.",
    intro:
      "Customer support software is broader than a help desk alone. The best tools combine ticketing, collaboration, knowledge base, and customer communication in a way that fits how your team actually serves customers.",
    whoItsFor:
      "This page is for teams evaluating the wider support stack, not just ticket queues. If chat, inbox collaboration, messaging, or support experience matters alongside ticketing, this is the right comparison set.",
    howWeEvaluated: [
      "How well the product supports real customer conversations",
      "Coverage across ticketing, messaging, inbox, and self-serve support",
      "Team collaboration and workflow quality",
      "Flexibility across different support models",
      "Overall buyer fit for modern digital businesses",
    ],
    comparisonTable: [
      {
        label: "Strongest angle",
        valuesByToolSlug: {
          [SUPPORT_TOOLS.intercom]: "Messaging + support",
          [SUPPORT_TOOLS.freshdesk]: "Balanced support platform",
          [SUPPORT_TOOLS.helpScout]: "Human support experience",
          [SUPPORT_TOOLS.front]: "Collaborative inbox workflows",
          [SUPPORT_TOOLS.crisp]: "Chat-led support",
          [SUPPORT_TOOLS.tidio]: "Simple live chat + bots",
          [SUPPORT_TOOLS.zendesk]: "Scaled support operations",
          [SUPPORT_TOOLS.gorgias]: "Ecommerce support",
        },
      },
      {
        label: "Best fit",
        valuesByToolSlug: {
          [SUPPORT_TOOLS.intercom]: "SaaS and product-led teams",
          [SUPPORT_TOOLS.freshdesk]: "General support teams",
          [SUPPORT_TOOLS.helpScout]: "Service-focused teams",
          [SUPPORT_TOOLS.front]: "Cross-functional customer teams",
          [SUPPORT_TOOLS.crisp]: "Lean SaaS teams",
          [SUPPORT_TOOLS.tidio]: "Small businesses and stores",
          [SUPPORT_TOOLS.zendesk]: "Large support orgs",
          [SUPPORT_TOOLS.gorgias]: "Online stores",
        },
      },
    ],
    rankedTools: [
      {
        toolSlug: SUPPORT_TOOLS.intercom,
        rank: 1,
        verdict:
          "Intercom leads this broader category because customer support software is no longer just about tickets. It combines support, messaging, automation, and customer engagement better than most platforms.",
        bestFor: "Digital businesses that want support and customer communication to live in the same operating layer.",
        notIdealFor: "Teams that just want traditional ticketing at a lower price.",
        criteriaHighlights: ["Messaging", "AI", "Support breadth"],
      },
      {
        toolSlug: SUPPORT_TOOLS.freshdesk,
        rank: 2,
        verdict:
          "Freshdesk is the safest recommendation for buyers who want strong all-round support software without overcommitting to a messaging-first or enterprise-only platform.",
        bestFor: "Teams that want balanced coverage across ticketing, automation, and multichannel support.",
        notIdealFor: "Buyers who specifically want support to feel like a premium messaging experience.",
        criteriaHighlights: ["All-round fit", "Automation", "Usability"],
      },
      {
        toolSlug: SUPPORT_TOOLS.helpScout,
        rank: 3,
        verdict:
          "Help Scout ranks highly because customer support quality is often about clarity and responsiveness, not feature overload. It keeps the support experience clean for both teams and customers.",
        bestFor: "Teams that care about a calm, service-oriented support workflow.",
        notIdealFor: "Support orgs that need maximum routing complexity or deeper channel sprawl.",
        criteriaHighlights: ["Human support", "Inbox collaboration", "Knowledge base"],
      },
      {
        toolSlug: SUPPORT_TOOLS.front,
        rank: 4,
        verdict:
          "Front is one of the best tools in this category when customer support overlaps heavily with account management, operations, or success. It is not a standard help desk, but that is the point.",
        bestFor: "Cross-functional teams managing high-value customer conversations beyond classic support queues.",
        notIdealFor: "Teams that want a pure support desk and nothing else.",
        criteriaHighlights: ["Shared inbox", "Team collaboration", "Customer ops"],
      },
      {
        toolSlug: SUPPORT_TOOLS.crisp,
        rank: 5,
        verdict:
          "Crisp gives lean teams a convincing support-and-messaging stack without the premium posture of Intercom. It is especially attractive when live chat matters.",
        bestFor: "Startups that want strong chat-led support with enough help-desk structure to stay organized.",
        notIdealFor: "Larger support teams that need deeper operational controls.",
        criteriaHighlights: ["Chat-led support", "Startup fit", "Value"],
      },
      {
        toolSlug: SUPPORT_TOOLS.zendesk,
        rank: 6,
        verdict:
          "Zendesk still belongs in the shortlist because it is powerful, but this broader category rewards flexibility and experience design more than ticketing alone.",
        bestFor: "Teams that expect support complexity to scale quickly and want a proven operational platform.",
        notIdealFor: "Teams optimizing for simplicity or more conversational support workflows.",
        criteriaHighlights: ["Scale", "Process control", "Mature ecosystem"],
      },
      {
        toolSlug: SUPPORT_TOOLS.gorgias,
        rank: 7,
        verdict:
          "Gorgias rises when the business is ecommerce-heavy. For general customer support software, it is more specialized, which is both its strength and its limit.",
        bestFor: "Ecommerce teams that need support connected to order and store context.",
        notIdealFor: "Software companies or service businesses without commerce-specific workflows.",
        criteriaHighlights: ["Ecommerce", "Support context", "Automation"],
      },
      {
        toolSlug: SUPPORT_TOOLS.tidio,
        rank: 8,
        verdict:
          "Tidio is a practical lightweight choice for businesses that want fast live chat, bots, and simple support coverage without deploying a heavier support stack.",
        bestFor: "Small businesses that need immediate customer communication coverage with a simple interface.",
        notIdealFor: "Teams that need more mature service operations or detailed ticket workflows.",
        criteriaHighlights: ["Live chat", "Accessibility", "Small-business fit"],
      },
    ],
    faq: [
      {
        question: "What should be included in customer support software?",
        answer:
          "Good customer support software usually includes ticketing, customer communication, internal collaboration, automation, reporting, and some form of self-serve support such as a help center or knowledge base.",
      },
      {
        question: "Is customer support software the same as live chat software?",
        answer:
          "No. Live chat is one channel. Customer support software is the wider system used to manage conversations, workflows, team collaboration, and support history across channels.",
      },
      {
        question: "What is the best customer support software for SaaS companies?",
        answer:
          "For many SaaS companies, Intercom, Freshdesk, and Help Scout are the strongest starting points because they cover the most relevant mix of messaging, support workflows, and self-serve support.",
      },
    ],
    internalLinks: [
      {
        href: "/best/help-desk-software",
        label: "Best help desk software",
        description: "See the stricter ticketing-focused ranking.",
      },
      {
        href: "/alternatives/intercom",
        label: "Compare Intercom alternatives",
        description: "Explore tools that compete most directly with Intercom.",
      },
      {
        href: "/tags/customer-support",
        label: "Browse customer support tools",
        description: "See more products grouped by customer-support intent.",
      },
    ],
    primaryCategorySlug: "support",
    supportingTagSlugs: ["customer-support", "live-chat", "shared-inbox"],
  },
  "customer-support-software-for-small-business": {
    slug: "customer-support-software-for-small-business",
    targetKeyword: "best customer support software for small business",
    title: "Best Customer Support Software for Small Business",
    metaTitle:
      "Best Customer Support Software for Small Business | ShipBoost",
    metaDescription:
      "Compare the best customer support software for small businesses that need strong support workflows without enterprise complexity or oversized pricing.",
    intro:
      "Small businesses rarely need the most complex support platform on the market. The better question is which software gives your team enough structure, automation, and customer visibility without creating operational drag.",
    whoItsFor:
      "This page is for small businesses, early-stage SaaS teams, agencies, and online stores that need a credible support system but still care about simplicity, adoption speed, and pricing sanity.",
    howWeEvaluated: [
      "Time to value for small teams",
      "Pricing posture and plan accessibility",
      "Ease of setup and day-to-day use",
      "Enough support structure to scale past email alone",
      "Fit for lean teams without dedicated admins",
    ],
    comparisonTable: [
      {
        label: "Best small-business fit",
        valuesByToolSlug: {
          [SUPPORT_TOOLS.helpScout]: "Simple but credible support stack",
          [SUPPORT_TOOLS.freshdesk]: "Best balanced option",
          [SUPPORT_TOOLS.zohoDesk]: "Budget-conscious teams",
          [SUPPORT_TOOLS.tidio]: "Small teams needing chat fast",
          [SUPPORT_TOOLS.crisp]: "Lean SaaS and support messaging",
          [SUPPORT_TOOLS.liveAgent]: "Broad channel coverage",
          [SUPPORT_TOOLS.intercom]: "Premium choice if budget allows",
          [SUPPORT_TOOLS.zendesk]: "Usually overkill early",
        },
      },
    ],
    rankedTools: [
      {
        toolSlug: SUPPORT_TOOLS.helpScout,
        rank: 1,
        verdict:
          "Help Scout is the best overall fit for many small businesses because it delivers a real support system without the overhead, clutter, or enterprise feel that slows lean teams down.",
        bestFor: "Small businesses that want a calm, professional support workflow with shared inbox, docs, and chat support.",
        notIdealFor: "Teams that already need large-scale routing complexity or deeper channel sprawl.",
        criteriaHighlights: ["Simplicity", "Small-team fit", "Support quality"],
      },
      {
        toolSlug: SUPPORT_TOOLS.freshdesk,
        rank: 2,
        verdict:
          "Freshdesk is the strongest balanced pick when a small business wants room to grow without paying the complexity penalty immediately.",
        bestFor: "Teams that want approachable ticketing and automation with a clearer upgrade path as support volume grows.",
        notIdealFor: "Tiny teams that want the absolute lightest setup possible.",
        criteriaHighlights: ["Balanced growth path", "Automation", "Usability"],
      },
      {
        toolSlug: SUPPORT_TOOLS.zohoDesk,
        rank: 3,
        verdict:
          "Zoho Desk earns a high spot because cost matters more for small businesses. It gives structured support workflows without pushing buyers toward premium pricing too early.",
        bestFor: "Cost-conscious businesses that still want ticketing, knowledge base, and automation coverage.",
        notIdealFor: "Teams that care most about polished UX or a more premium overall product experience.",
        criteriaHighlights: ["Value", "Structure", "Budget fit"],
      },
      {
        toolSlug: SUPPORT_TOOLS.tidio,
        rank: 4,
        verdict:
          "Tidio works well for small businesses that need fast customer communication, especially when live chat and automation matter more than a heavyweight service desk.",
        bestFor: "Small teams that want quick website chat, bots, and simple support coverage.",
        notIdealFor: "Businesses that need deeper ticketing and service operations.",
        criteriaHighlights: ["Live chat", "Accessibility", "Fast setup"],
      },
      {
        toolSlug: SUPPORT_TOOLS.crisp,
        rank: 5,
        verdict:
          "Crisp is a compelling option for lean teams that want customer messaging and support in one place, especially if chat is the center of the workflow.",
        bestFor: "Small SaaS teams and digital businesses that want support plus messaging without premium enterprise overhead.",
        notIdealFor: "Teams needing more mature formal ticketing and service reporting.",
        criteriaHighlights: ["Messaging", "Startup fit", "Value"],
      },
      {
        toolSlug: SUPPORT_TOOLS.liveAgent,
        rank: 6,
        verdict:
          "LiveAgent is a useful small-business option when broad channel coverage matters more than product elegance.",
        bestFor: "Businesses that want one support stack covering ticketing, chat, and broader channels.",
        notIdealFor: "Teams optimizing for cleaner UX and lower operational clutter.",
        criteriaHighlights: ["Coverage", "Breadth", "SMB fit"],
      },
      {
        toolSlug: SUPPORT_TOOLS.intercom,
        rank: 7,
        verdict:
          "Intercom can still make sense for a small business, but it is usually the premium route rather than the default recommendation in this segment.",
        bestFor: "Small digital businesses that want a premium messaging-led support experience and can justify the spend.",
        notIdealFor: "Price-sensitive teams that mainly need practical support operations.",
        criteriaHighlights: ["Premium", "Messaging", "Modern UX"],
      },
      {
        toolSlug: SUPPORT_TOOLS.zendesk,
        rank: 8,
        verdict:
          "Zendesk is still credible, but for many small businesses it is more platform than they need at the beginning. It belongs on the page more as a benchmark than a default choice.",
        bestFor: "Small businesses that expect support complexity to ramp quickly and want a long-term operational platform.",
        notIdealFor: "Lean teams that want simpler setup, lower cost, and less admin overhead.",
        criteriaHighlights: ["Benchmark", "Scale", "Operational depth"],
      },
    ],
    faq: [
      {
        question: "What is the best customer support software for a small business?",
        answer:
          "For many small businesses, the best options are Help Scout, Freshdesk, and Zoho Desk because they offer strong support workflows without the same level of complexity or pricing pressure as larger enterprise platforms.",
      },
      {
        question: "Do small businesses need a help desk or just live chat?",
        answer:
          "If support requests are already arriving through multiple channels or multiple teammates are responding, a real support platform is usually worth it. Live chat alone is rarely enough once support volume grows.",
      },
      {
        question: "How much support software should a small business buy upfront?",
        answer:
          "Buy enough software to organize your support process today with a bit of room to grow. Overbuying for imagined future complexity usually slows adoption and creates unnecessary cost.",
      },
    ],
    internalLinks: [
      {
        href: "/best/customer-support-software",
        label: "Best customer support software",
        description: "See the broader ranking beyond the small-business lens.",
      },
      {
        href: "/alternatives/freshdesk",
        label: "Compare Freshdesk alternatives",
        description: "Explore support tools competing with Freshdesk.",
      },
      {
        href: "/categories/support",
        label: "Browse support tools",
        description: "See the broader support category on ShipBoost.",
      },
    ],
    primaryCategorySlug: "support",
    supportingTagSlugs: ["customer-support", "help-desk", "live-chat"],
  },
  "crm-software": {
    slug: "crm-software",
    targetKeyword: "best crm software",
    title: "Best CRM Software",
    metaTitle: "Best CRM Software for Growing Teams | ShipBoost",
    metaDescription:
      "Compare the best CRM software for startups and growing sales teams, with buyer-focused verdicts, tradeoffs, and clear fit across leading CRM platforms.",
    intro:
      "The best CRM software depends on how structured your sales motion is, how much automation you need, and whether you are optimizing for startup speed, operational depth, or broader revenue workflows.",
    whoItsFor:
      "This page is for founders, revenue operators, and sales teams evaluating CRM platforms that can manage contacts, pipelines, and customer data without forcing them into the wrong operating model.",
    howWeEvaluated: [
      "Ease of adoption for lean sales teams",
      "Pipeline and contact-management depth",
      "Automation, reporting, and workflow flexibility",
      "Fit for startup and SMB sales motions",
      "Overall balance between power, usability, and price posture",
    ],
    comparisonTable: [
      {
        label: "Best for",
        valuesByToolSlug: {
          [CRM_TOOLS.hubspot]: "All-round CRM breadth",
          [CRM_TOOLS.attio]: "Modern startup CRM",
          [CRM_TOOLS.pipedrive]: "Pipeline-focused sales teams",
          [CRM_TOOLS.close]: "High-velocity outbound",
          [CRM_TOOLS.zohoCrm]: "Value-focused CRM buyers",
          [CRM_TOOLS.salesflare]: "Lean B2B teams",
          [CRM_TOOLS.folk]: "Relationship-driven workflows",
          [CRM_TOOLS.freshsales]: "Balanced SMB CRM",
        },
      },
      {
        label: "Operating style",
        valuesByToolSlug: {
          [CRM_TOOLS.hubspot]: "Platform CRM",
          [CRM_TOOLS.attio]: "Flexible data model",
          [CRM_TOOLS.pipedrive]: "Pipeline-first",
          [CRM_TOOLS.close]: "Outbound-first",
          [CRM_TOOLS.zohoCrm]: "Traditional CRM suite",
          [CRM_TOOLS.salesflare]: "Automated B2B CRM",
          [CRM_TOOLS.folk]: "Relationship CRM",
          [CRM_TOOLS.freshsales]: "Sales CRM with automation",
        },
      },
      {
        label: "Pricing posture",
        valuesByToolSlug: {
          [CRM_TOOLS.hubspot]: "Scales into premium",
          [CRM_TOOLS.attio]: "Premium modern CRM",
          [CRM_TOOLS.pipedrive]: "Mid-market friendly",
          [CRM_TOOLS.close]: "Premium sales-focused",
          [CRM_TOOLS.zohoCrm]: "Budget-friendly",
          [CRM_TOOLS.salesflare]: "SMB-friendly",
          [CRM_TOOLS.folk]: "Premium relationship CRM",
          [CRM_TOOLS.freshsales]: "Accessible paid plans",
        },
      },
    ],
    rankedTools: [
      {
        toolSlug: CRM_TOOLS.hubspot,
        rank: 1,
        verdict:
          "HubSpot remains the strongest all-round recommendation for teams that want a CRM with broad functionality, strong usability, and room to grow into marketing, support, and revenue operations.",
        bestFor: "Teams that want one CRM platform to cover a broad range of sales and growth workflows.",
        notIdealFor: "Buyers who want the lightest possible CRM or who are highly sensitive to expansion pricing.",
        criteriaHighlights: ["All-round breadth", "Usability", "Scalability"],
      },
      {
        toolSlug: CRM_TOOLS.attio,
        rank: 2,
        verdict:
          "Attio is one of the best modern CRM choices for startups because it feels flexible and collaborative without inheriting the heavy feel of older enterprise CRM systems.",
        bestFor: "Startups and modern sales teams that want a more adaptable CRM and cleaner working experience.",
        notIdealFor: "Teams that want a more conventional, process-heavy CRM out of the box.",
        criteriaHighlights: ["Modern UX", "Startup fit", "Flexibility"],
      },
      {
        toolSlug: CRM_TOOLS.pipedrive,
        rank: 3,
        verdict:
          "Pipedrive earns its place because it is still one of the clearest pipeline-first CRM options for teams that want selling focus without broader platform sprawl.",
        bestFor: "Sales-led teams that want a straightforward pipeline CRM with strong day-to-day usability.",
        notIdealFor: "Teams that want a broader revenue platform beyond pipeline management.",
        criteriaHighlights: ["Pipeline focus", "Sales usability", "Clarity"],
      },
      {
        toolSlug: CRM_TOOLS.close,
        rank: 4,
        verdict:
          "Close stands out when outbound matters. It is one of the strongest CRM options for teams that live inside calls, sequences, and high-velocity sales execution.",
        bestFor: "Outbound-heavy sales teams that want a CRM tightly aligned to active selling workflows.",
        notIdealFor: "Relationship-led teams that do not want the product centered around outbound execution.",
        criteriaHighlights: ["Outbound sales", "Execution speed", "Sales workflow"],
      },
      {
        toolSlug: CRM_TOOLS.zohoCrm,
        rank: 5,
        verdict:
          "Zoho CRM is one of the most practical value picks in the category. It covers a lot of CRM ground without forcing buyers into a premium price posture too early.",
        bestFor: "Small businesses and growing teams that want broad CRM functionality with stronger cost control.",
        notIdealFor: "Teams optimizing for the cleanest UX or the most modern product feel.",
        criteriaHighlights: ["Value", "Breadth", "SMB fit"],
      },
      {
        toolSlug: CRM_TOOLS.salesflare,
        rank: 6,
        verdict:
          "Salesflare is a strong B2B CRM for lean teams that want useful automation and less admin burden than many traditional CRM tools create.",
        bestFor: "Small B2B sales teams that want a CRM with automation and lower manual overhead.",
        notIdealFor: "Teams that need the deepest custom workflows or a much broader platform ecosystem.",
        criteriaHighlights: ["Automation", "Lean team fit", "B2B sales"],
      },
      {
        toolSlug: CRM_TOOLS.folk,
        rank: 7,
        verdict:
          "Folk works best when CRM is more about relationship management and collaboration than classic sales-operating-rhythm dashboards.",
        bestFor: "Relationship-driven teams that want a more flexible, collaborative CRM model.",
        notIdealFor: "Teams that need a more traditional, pipeline-heavy CRM operating system.",
        criteriaHighlights: ["Relationship management", "Collaboration", "Flexibility"],
      },
      {
        toolSlug: CRM_TOOLS.freshsales,
        rank: 8,
        verdict:
          "Freshsales is a credible SMB CRM pick when teams want strong core sales workflows with enough automation and less complexity than broader enterprise systems.",
        bestFor: "Growing SMB sales teams that want a practical CRM with modern automation features.",
        notIdealFor: "Teams seeking the strongest modern design layer or very advanced sales customization.",
        criteriaHighlights: ["SMB fit", "Automation", "Practicality"],
      },
    ],
    faq: [
      {
        question: "What is the best CRM software for most small teams?",
        answer:
          "For many small teams, HubSpot, Pipedrive, and Attio are the strongest starting points because they cover the broadest mix of usability, pipeline management, and growth potential.",
      },
      {
        question: "Should startups choose a modern CRM or a traditional CRM?",
        answer:
          "It depends on the sales motion. Startups with fast-moving, flexible workflows often prefer modern options like Attio or Folk, while teams that want a more structured, proven CRM model may prefer HubSpot, Pipedrive, or Zoho CRM.",
      },
      {
        question: "What matters most when comparing CRM software?",
        answer:
          "The main factors are how your team actually sells, how much structure or automation you need, how easily the team will adopt the system, and whether the platform will still fit once the sales process becomes more complex.",
      },
    ],
    internalLinks: [
      {
        href: "/categories/sales",
        label: "Browse sales tools",
        description: "Explore the broader sales category on ShipBoost.",
      },
      {
        href: "/alternatives/hubspot",
        label: "Compare HubSpot alternatives",
        description: "See which CRM platforms compete most directly with HubSpot.",
      },
      {
        href: "/tags/crm",
        label: "Browse CRM tools",
        description: "See more CRM products grouped by CRM intent.",
      },
    ],
    primaryCategorySlug: "sales",
    supportingTagSlugs: ["crm", "sales-pipeline", "contact-management"],
  },
  "crm-for-startups": {
    slug: "crm-for-startups",
    targetKeyword: "best crm for startups",
    title: "Best CRM for Startups",
    metaTitle: "Best CRM for Startups and Lean Sales Teams | ShipBoost",
    metaDescription:
      "Compare the best CRM for startups, with clear recommendations for lean teams that need speed, flexibility, and a CRM that matches a modern sales motion.",
    intro:
      "The best CRM for startups is rarely the heaviest system on the market. Startup teams need a CRM that the team will actually use, that adapts to evolving workflows, and that does not create more admin than leverage.",
    whoItsFor:
      "This page is for founders and lean revenue teams choosing a CRM while sales processes are still being shaped and adoption speed matters as much as feature depth.",
    howWeEvaluated: [
      "How fast a startup team can adopt the CRM",
      "Flexibility as the sales motion evolves",
      "Balance between structure and admin burden",
      "Practical fit for founder-led and lean sales workflows",
      "Long-term upside without early complexity overload",
    ],
    comparisonTable: [
      {
        label: "Strongest fit",
        valuesByToolSlug: {
          [CRM_TOOLS.attio]: "Modern startup teams",
          [CRM_TOOLS.close]: "Outbound startup sales",
          [CRM_TOOLS.hubspot]: "Broad startup CRM needs",
          [CRM_TOOLS.folk]: "Relationship-led startup workflows",
          [CRM_TOOLS.salesflare]: "Lean B2B startups",
          [CRM_TOOLS.pipedrive]: "Pipeline-first teams",
          [CRM_TOOLS.copper]: "Google Workspace-heavy teams",
          [CRM_TOOLS.mondayCrm]: "Workflow-oriented teams",
        },
      },
      {
        label: "Why teams choose it",
        valuesByToolSlug: {
          [CRM_TOOLS.attio]: "Flexibility and modern UX",
          [CRM_TOOLS.close]: "Execution speed for outbound",
          [CRM_TOOLS.hubspot]: "Breadth and familiarity",
          [CRM_TOOLS.folk]: "Relationship management",
          [CRM_TOOLS.salesflare]: "Automation with less admin",
          [CRM_TOOLS.pipedrive]: "Pipeline clarity",
          [CRM_TOOLS.copper]: "Google-native workflow fit",
          [CRM_TOOLS.mondayCrm]: "Custom workflow flexibility",
        },
      },
    ],
    rankedTools: [
      {
        toolSlug: CRM_TOOLS.attio,
        rank: 1,
        verdict:
          "Attio is the strongest startup CRM recommendation because it matches how startup teams actually work: evolving process, collaborative context, and a need for flexibility without legacy CRM drag.",
        bestFor: "Startups that want a modern CRM they can shape around a changing sales or relationship workflow.",
        notIdealFor: "Teams that want a more traditional CRM model with stronger process defaults from day one.",
        criteriaHighlights: ["Startup fit", "Modern UX", "Flexibility"],
      },
      {
        toolSlug: CRM_TOOLS.close,
        rank: 2,
        verdict:
          "Close ranks highly when the startup motion is sales-led and outbound-heavy. It is one of the best CRM options when execution speed matters more than broader platform sprawl.",
        bestFor: "Lean teams doing active outbound sales and wanting a CRM built around revenue execution.",
        notIdealFor: "Teams that need a broader CRM for cross-functional relationship management rather than outbound focus.",
        criteriaHighlights: ["Outbound", "Execution speed", "Sales motion fit"],
      },
      {
        toolSlug: CRM_TOOLS.hubspot,
        rank: 3,
        verdict:
          "HubSpot is still a strong startup CRM because it is easy to understand, widely adopted, and gives startups a path to grow into a broader revenue stack when needed.",
        bestFor: "Startups that want a broadly capable CRM with strong usability and room to expand.",
        notIdealFor: "Teams that want to avoid platform expansion complexity or future pricing escalation.",
        criteriaHighlights: ["Breadth", "Usability", "Growth path"],
      },
      {
        toolSlug: CRM_TOOLS.folk,
        rank: 4,
        verdict:
          "Folk fits startups where CRM is closer to relationship management than classic pipeline discipline. It feels lighter and more collaborative than traditional systems.",
        bestFor: "Startups with partner, investor, community, or relationship-heavy workflows.",
        notIdealFor: "Teams that need a more rigid pipeline and sales-forecasting structure.",
        criteriaHighlights: ["Relationship CRM", "Collaboration", "Flexibility"],
      },
      {
        toolSlug: CRM_TOOLS.salesflare,
        rank: 5,
        verdict:
          "Salesflare is a practical startup choice for B2B teams that want useful automation without drowning in CRM admin work too early.",
        bestFor: "B2B startups that want helpful automation and a leaner CRM operating model.",
        notIdealFor: "Teams that need more bespoke workflows or a larger platform ecosystem.",
        criteriaHighlights: ["Automation", "Startup B2B fit", "Lower admin"],
      },
      {
        toolSlug: CRM_TOOLS.pipedrive,
        rank: 6,
        verdict:
          "Pipedrive remains a credible startup CRM when the team wants immediate pipeline clarity and a simpler, more sales-specific tool than a broader platform CRM.",
        bestFor: "Startups that want a straightforward sales CRM with strong pipeline usability.",
        notIdealFor: "Teams whose CRM needs are broader than active deal flow management.",
        criteriaHighlights: ["Pipeline clarity", "Sales focus", "Usability"],
      },
      {
        toolSlug: CRM_TOOLS.copper,
        rank: 7,
        verdict:
          "Copper becomes a stronger startup fit when the team already lives in Google Workspace and wants the CRM to feel more integrated with that environment.",
        bestFor: "Google Workspace-heavy startups that value tighter workflow continuity.",
        notIdealFor: "Teams that do not care about that ecosystem fit or want a more modern CRM experience.",
        criteriaHighlights: ["Google Workspace", "Relationship fit", "Integration"],
      },
      {
        toolSlug: CRM_TOOLS.mondayCrm,
        rank: 8,
        verdict:
          "monday CRM is a useful option when startup teams want CRM plus broader workflow flexibility, especially if they already think in boards and operational systems rather than classic CRM views.",
        bestFor: "Startups that want sales workflows tied into a broader work-management style product.",
        notIdealFor: "Teams that want a more purpose-built classic CRM experience.",
        criteriaHighlights: ["Workflow flexibility", "Collaboration", "Startup operations"],
      },
    ],
    faq: [
      {
        question: "What is the best CRM for a startup?",
        answer:
          "For many startups, Attio, Close, and HubSpot are the strongest starting points because they balance adoption speed, workflow flexibility, and room to grow without forcing a heavy enterprise process too early.",
      },
      {
        question: "Do startups need a full CRM right away?",
        answer:
          "Not always. But once customer relationships, deals, and follow-ups stop fitting cleanly in spreadsheets or inboxes, a CRM becomes valuable because it creates shared visibility and a more repeatable sales process.",
      },
      {
        question: "What makes a CRM startup-friendly?",
        answer:
          "A startup-friendly CRM should be easy to adopt, flexible as the process changes, and strong enough to create leverage without demanding a lot of admin overhead from a small team.",
      },
    ],
    internalLinks: [
      {
        href: "/best/crm-software",
        label: "Best CRM software",
        description: "See the broader CRM ranking across all team sizes.",
      },
      {
        href: "/alternatives/attio",
        label: "Compare Attio alternatives",
        description: "Explore CRM tools that compete most directly with Attio.",
      },
      {
        href: "/tags/startup-crm",
        label: "Browse startup CRM tools",
        description: "See more products grouped by startup-CRM intent.",
      },
    ],
    primaryCategorySlug: "sales",
    supportingTagSlugs: ["crm", "startup-crm", "sales-pipeline"],
    customSections: [
      {
        heading: "How to choose a startup CRM",
        body:
          "Pick the CRM your team will actually use next month, not the one that looks best for an imaginary enterprise future. Startup CRM decisions usually fail because the system outruns the team’s current operating rhythm.",
      },
    ],
  },
  "crm-software-for-small-business": {
    slug: "crm-software-for-small-business",
    targetKeyword: "best crm software for small business",
    title: "Best CRM Software for Small Business",
    metaTitle: "Best CRM Software for Small Business | ShipBoost",
    metaDescription:
      "Compare the best CRM software for small businesses that need customer visibility, sales pipeline structure, and automation without enterprise overhead.",
    intro:
      "Small businesses need a CRM that creates clarity, not complexity. The best CRM software in this segment helps teams manage leads, contacts, and follow-ups without turning the sales process into an admin project.",
    whoItsFor:
      "This page is for small businesses that want a real CRM system to organize sales workflows, customer context, and deal tracking without paying for enterprise complexity they will not use.",
    howWeEvaluated: [
      "Ease of setup and daily adoption for small teams",
      "Pipeline, lead, and contact-management practicality",
      "Useful automation without excess complexity",
      "Value relative to feature depth",
      "Overall fit for SMB sales workflows",
    ],
    comparisonTable: [
      {
        label: "Best fit",
        valuesByToolSlug: {
          [CRM_TOOLS.hubspot]: "Broad small-business CRM needs",
          [CRM_TOOLS.zohoCrm]: "Value-focused SMBs",
          [CRM_TOOLS.pipedrive]: "Pipeline-led teams",
          [CRM_TOOLS.freshsales]: "Modern SMB sales teams",
          [CRM_TOOLS.nutshell]: "Simple team CRM",
          [CRM_TOOLS.capsuleCrm]: "Lightweight relationship CRM",
          [CRM_TOOLS.salesflare]: "Lean B2B SMBs",
          [CRM_TOOLS.mondayCrm]: "Workflow-centric teams",
        },
      },
      {
        label: "Why it stands out",
        valuesByToolSlug: {
          [CRM_TOOLS.hubspot]: "Usability and breadth",
          [CRM_TOOLS.zohoCrm]: "Value for feature depth",
          [CRM_TOOLS.pipedrive]: "Pipeline clarity",
          [CRM_TOOLS.freshsales]: "Automation and accessibility",
          [CRM_TOOLS.nutshell]: "Small-team practicality",
          [CRM_TOOLS.capsuleCrm]: "Simplicity",
          [CRM_TOOLS.salesflare]: "Low admin automation",
          [CRM_TOOLS.mondayCrm]: "Flexible workflow design",
        },
      },
    ],
    rankedTools: [
      {
        toolSlug: CRM_TOOLS.hubspot,
        rank: 1,
        verdict:
          "HubSpot is the best SMB CRM for many buyers because it balances usability, breadth, and growth potential better than most alternatives in the category.",
        bestFor: "Small businesses that want a broadly capable CRM with room to expand over time.",
        notIdealFor: "Teams that want to optimize more aggressively for budget discipline or a narrower CRM use case.",
        criteriaHighlights: ["Breadth", "Usability", "Growth path"],
      },
      {
        toolSlug: CRM_TOOLS.zohoCrm,
        rank: 2,
        verdict:
          "Zoho CRM is one of the strongest SMB value picks. It gives small businesses a lot of CRM capability without demanding a premium platform budget.",
        bestFor: "Budget-conscious small businesses that still need a full-featured CRM.",
        notIdealFor: "Teams that prioritize cleaner UX and a more modern product feel above value.",
        criteriaHighlights: ["Value", "Feature depth", "SMB fit"],
      },
      {
        toolSlug: CRM_TOOLS.pipedrive,
        rank: 3,
        verdict:
          "Pipedrive is excellent for small businesses that care most about pipeline visibility and day-to-day sales execution rather than broader platform complexity.",
        bestFor: "Small teams that want a clear, sales-first CRM built around active deal flow.",
        notIdealFor: "Businesses that want broader CRM coverage outside core pipeline management.",
        criteriaHighlights: ["Pipeline focus", "Usability", "Sales execution"],
      },
      {
        toolSlug: CRM_TOOLS.freshsales,
        rank: 4,
        verdict:
          "Freshsales is a strong SMB recommendation for teams that want modern automation and a practical CRM without heavy setup.",
        bestFor: "Small businesses looking for a modern sales CRM with approachable automation.",
        notIdealFor: "Teams that want the strongest relationship-focused CRM or a broader ecosystem platform.",
        criteriaHighlights: ["Automation", "Practicality", "Modern SMB fit"],
      },
      {
        toolSlug: CRM_TOOLS.nutshell,
        rank: 5,
        verdict:
          "Nutshell works well for small teams that want a straightforward CRM that feels built for practical everyday selling rather than platform ambition.",
        bestFor: "Small sales teams that want a simple, approachable CRM with enough structure to stay organized.",
        notIdealFor: "Buyers that want stronger flexibility or broader ecosystem expansion.",
        criteriaHighlights: ["Small-team fit", "Simplicity", "Practicality"],
      },
      {
        toolSlug: CRM_TOOLS.capsuleCrm,
        rank: 6,
        verdict:
          "Capsule CRM is a credible option when the small business wants relationship management and core sales organization without much overhead.",
        bestFor: "Small businesses that want a lighter CRM centered on contacts, relationships, and manageable pipelines.",
        notIdealFor: "Teams that need more advanced automation or a broader feature set.",
        criteriaHighlights: ["Simplicity", "Relationship management", "Lightweight CRM"],
      },
      {
        toolSlug: CRM_TOOLS.salesflare,
        rank: 7,
        verdict:
          "Salesflare remains a strong SMB choice for B2B teams that want useful automation and a CRM that does more of the background work automatically.",
        bestFor: "B2B small businesses that want lower admin burden and helpful automation.",
        notIdealFor: "Teams that want a more conventional CRM interface or broader platform features.",
        criteriaHighlights: ["Automation", "B2B fit", "Lower admin"],
      },
      {
        toolSlug: CRM_TOOLS.mondayCrm,
        rank: 8,
        verdict:
          "monday CRM makes sense for small businesses that want CRM plus operational workflow flexibility in one system rather than a classic CRM experience alone.",
        bestFor: "Teams that think in workflows, boards, and operational systems as much as sales pipelines.",
        notIdealFor: "Teams that want a more focused traditional CRM.",
        criteriaHighlights: ["Workflow flexibility", "Collaboration", "SMB operations"],
      },
    ],
    faq: [
      {
        question: "What is the best CRM software for a small business?",
        answer:
          "For many small businesses, HubSpot, Zoho CRM, and Pipedrive are the strongest options because they balance usability, feature depth, and practical day-to-day sales value.",
      },
      {
        question: "Should a small business choose a simple CRM or a full-featured CRM?",
        answer:
          "Choose the lightest CRM that still supports your actual sales process. Too little structure creates chaos, but too much complexity slows adoption and adds admin burden for a small team.",
      },
      {
        question: "What does a small business need from a CRM first?",
        answer:
          "The essentials are lead and contact organization, a clear pipeline, follow-up visibility, and enough automation to remove repetitive work without making the system hard to use.",
      },
    ],
    internalLinks: [
      {
        href: "/best/crm-software",
        label: "Best CRM software",
        description: "See the broader CRM ranking across teams and sales motions.",
      },
      {
        href: "/alternatives/zoho-crm",
        label: "Compare Zoho CRM alternatives",
        description: "Explore CRM tools competing most directly with Zoho CRM.",
      },
      {
        href: "/categories/sales",
        label: "Browse sales tools",
        description: "See the broader sales category on ShipBoost.",
      },
    ],
    primaryCategorySlug: "sales",
    supportingTagSlugs: ["crm", "small-business", "lead-management"],
  },
};

export const bestHubSections: BestHubSection[] = [
  {
    slug: "support",
    title: "Support",
    intro:
      "These pages help founders compare help desk, customer support, and service-platform options with clearer buying intent than a broad category directory.",
    pageSlugs: [
      "help-desk-software",
      "customer-support-software",
      "customer-support-software-for-small-business",
    ],
    supportingLinks: [
      {
        href: "/categories/support",
        label: "Browse support tools",
        description: "Explore the wider support category on ShipBoost.",
      },
      {
        href: "/alternatives",
        label: "Compare support alternatives",
        description: "See comparison pages for major support platforms.",
      },
    ],
  },
  {
    slug: "crm",
    title: "CRM",
    intro:
      "These pages narrow CRM decisions by buyer job, from general CRM evaluation to startup-fit and small-business operational needs.",
    pageSlugs: [
      "crm-software",
      "crm-for-startups",
      "crm-software-for-small-business",
    ],
    supportingLinks: [
      {
        href: "/categories/sales",
        label: "Browse sales tools",
        description: "Explore the broader sales and CRM category on ShipBoost.",
      },
      {
        href: "/alternatives",
        label: "Compare CRM alternatives",
        description: "See comparison pages for major CRM products.",
      },
    ],
  },
];

export function getBestHubPageEntries(pageSlugs: string[]) {
  return pageSlugs
    .map((slug) => bestPagesRegistry[slug])
    .filter((entry): entry is BestPageEntry => Boolean(entry));
}
