#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const baseDir =
  "/Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/Cluster 31-40";
const inputPath = path.join(baseDir, "cluster-31-40-anchor-tools-master.csv");
const outputPath = path.join(
  baseDir,
  "cluster-31-40-anchor-tools-enriched-master.csv",
);
const auditPath = path.join(baseDir, "cluster-31-40-enrichment-audit.md");

const bannedPhrases = [
  "For ShipBoost",
  "ShipBoost should use",
  "anchor tool",
  "seeded listing",
  "cluster",
  "category pages",
  "best-of pages",
  "alternatives pages",
  "scraped homepage body",
  "official page content",
  "metadata says",
];

const editorial = {
  ChatGPT: {
    tagline: "Conversational AI for writing, research, and work",
    focus:
      "is a general-purpose conversational AI assistant for writing, research, coding help, analysis, and everyday productivity. It supports open-ended prompts, document-style work, brainstorming, summaries, and multi-step problem solving across personal and business tasks.",
    buyer:
      "Buyers usually compare it as the default benchmark for AI assistants: strong breadth, fast iteration, and a large ecosystem matter more here than a narrow workflow. The key questions are model quality, file and context handling, team controls, privacy settings, and how well it fits existing work habits.",
  },
  Claude: {
    tagline: "AI assistant for thoughtful writing and analysis",
    focus:
      "is an AI assistant built for long-form reasoning, writing, document analysis, coding support, and collaborative knowledge work. It is often used when teams need careful responses, structured drafts, and help making sense of complex source material.",
    buyer:
      "In comparisons, Claude tends to stand out for users who value tone, nuance, and deep reading over a pure utility chatbot experience. Evaluation should focus on context limits, artifact-style workflows, coding quality, enterprise controls, and how reliably it follows editorial or business instructions.",
  },
  Gemini: {
    tagline: "Google AI assistant for search-connected work",
    focus:
      "is Google's AI assistant for answering questions, drafting content, exploring ideas, and working across Google's product ecosystem. It is positioned for users who want AI help connected to search habits, productivity workflows, and Google account services.",
    buyer:
      "Gemini is most relevant when Google Workspace, Android, or search-driven research are already central to the buyer's workflow. Compare it on answer quality, integrations, image and multimodal features, admin controls, and whether the Google-native experience offsets switching from another assistant.",
  },
  Perplexity: {
    tagline: "AI answer engine for cited research",
    focus:
      "is an AI search and answer engine focused on research, source discovery, and cited responses. It helps users ask natural-language questions, inspect supporting sources, and move faster through topics that would otherwise require many search tabs.",
    buyer:
      "Perplexity is a strong comparison point when buyers care about research confidence, source visibility, and faster discovery. The main evaluation criteria are citation quality, freshness, follow-up exploration, team features, and how well it separates research work from general chat.",
  },
  "Microsoft Copilot": {
    tagline: "Microsoft AI assistant for everyday productivity",
    focus:
      "is Microsoft's AI assistant for productivity, search, and work across the Microsoft ecosystem. It helps users draft, summarize, ask questions, and complete tasks where Microsoft 365, Windows, Edge, or enterprise identity are already part of the environment.",
    buyer:
      "Copilot belongs on shortlists when Microsoft adoption is already high and buyers want AI inside existing tools instead of a separate assistant. Compare it on Microsoft 365 integration depth, governance, security posture, admin controls, and the value of keeping AI close to workplace data.",
  },
  Poe: {
    tagline: "Multi-model AI chat and bot discovery",
    focus:
      "is a multi-model AI chat platform where users can try different assistants, discover bots, and build simple AI experiences. It is useful for people who want access to multiple models and task-specific bots from one interface.",
    buyer:
      "Poe is worth comparing when model variety and experimentation are more important than a single vendor's productivity suite. Buyers should evaluate model access, bot quality, subscription value, creator features, and whether the marketplace approach improves daily AI use.",
  },
  "You.com": {
    tagline: "AI search assistant for research and productivity",
    focus:
      "is an AI search and assistant product that combines web discovery, chat, writing help, and productivity workflows. It is designed for users who want search results and AI-generated synthesis in the same working session.",
    buyer:
      "You.com is a practical option for buyers comparing AI search products rather than pure chat assistants. Look at source handling, answer freshness, workflow modes, privacy options, and whether it helps users reach usable conclusions faster than traditional search.",
  },
  Phind: {
    tagline: "AI search assistant for developers",
    focus:
      "is a developer-focused AI answer engine for technical research, debugging, coding questions, and software documentation discovery. It helps engineers turn specific implementation questions into explanations, examples, and next steps.",
    buyer:
      "Phind is most relevant for developer teams that want an AI research tool tuned to programming work. Compare it on code accuracy, source grounding, support for current frameworks, speed, and whether it reduces context switching during engineering tasks.",
  },
  "Mistral Le Chat": {
    tagline: "AI assistant powered by Mistral models",
    focus:
      "is Mistral's chat assistant for using its AI models in a conversational product. It supports writing, analysis, coding help, research-style prompts, and productivity work for users who want a European AI model provider in the mix.",
    buyer:
      "Le Chat matters in comparisons where model provenance, regional vendor preference, and open-model strategy influence the decision. Buyers should evaluate response quality, file handling, language coverage, privacy options, and how it complements or replaces larger assistant platforms.",
  },
  Grok: {
    tagline: "AI assistant with social and real-time context",
    focus:
      "is an AI assistant associated with xAI and the X ecosystem, built for conversational answers, research, writing, and timely questions. Its value is strongest when users want an assistant that feels connected to current public conversation.",
    buyer:
      "Grok is a useful comparator for buyers who care about real-time context, social platform adjacency, and a distinct assistant style. Evaluate model quality, source transparency, subscription packaging, privacy expectations, and whether the X connection is an advantage or a distraction.",
  },

  CapCut: {
    tagline: "AI video editor for creators and social teams",
    focus:
      "is a video and image editing platform for creators, marketers, and social media teams. It combines timeline editing, templates, subtitles, background removal, AI generation, voice tools, and exports for short-form channels.",
    buyer:
      "CapCut is usually compared when teams want fast content production without the overhead of professional editing software. Buyers should weigh template quality, watermark rules, mobile and desktop workflows, brand controls, collaboration, and how quickly non-editors can publish usable video.",
  },
  VEED: {
    tagline: "Online video editing with subtitles and recording",
    focus:
      "is a browser-based video editor for recording, editing, captioning, and repurposing video. It is built around accessible workflows for social clips, webinars, training videos, subtitles, screen recordings, and AI-assisted edits.",
    buyer:
      "VEED fits buyers who need a lightweight production workspace more than a full professional editing suite. Compare it on caption accuracy, recording quality, export limits, team review features, brand kits, and the speed of turning raw footage into publishable assets.",
  },
  Kapwing: {
    tagline: "Collaborative online video editor for teams",
    focus:
      "is an online creative editor for video, images, memes, subtitles, and social content. It gives teams a shared workspace for trimming clips, adding text, resizing formats, using templates, and creating content without heavy desktop software.",
    buyer:
      "Kapwing is a strong fit when collaboration and quick browser editing matter as much as editing depth. Buyers should compare template range, subtitle tools, workspace permissions, export quality, AI features, and how well it supports repeatable content operations.",
  },
  Clipchamp: {
    tagline: "Microsoft-friendly online video editor",
    focus:
      "is an online video editor for trimming, arranging, recording, adding stock assets, applying templates, and exporting videos. It is especially familiar to users already working in Microsoft's consumer and business ecosystem.",
    buyer:
      "Clipchamp makes sense for buyers who want simple editing with low onboarding friction. Compare it on Microsoft integration, stock library access, recording tools, export quality, template flexibility, and whether it can handle the team's social and internal video workload.",
  },
  InVideo: {
    tagline: "AI video creation for marketing content",
    focus:
      "is a video creation platform for turning scripts, templates, prompts, and brand assets into marketing videos. It supports social clips, ads, explainers, voiceovers, stock media, and AI-assisted production flows.",
    buyer:
      "InVideo belongs in comparisons when speed from idea to finished marketing video is the main job. Buyers should evaluate prompt-to-video quality, template fit, brand consistency, stock media rights, collaboration, and how much editing control remains after AI generation.",
  },
  Descript: {
    tagline: "Text-based editing for video and podcasts",
    focus:
      "is an audio and video editing workspace built around transcripts, screen recording, captions, overdub-style voice workflows, and AI editing tools. It is popular with podcasters, educators, marketers, and teams that edit spoken content.",
    buyer:
      "Descript is strongest when the content is interview, course, demo, or podcast driven. Compare it on transcript accuracy, filler-word removal, multitrack editing, publishing workflow, collaboration, and whether text-based editing is faster than a traditional timeline.",
  },
  Runway: {
    tagline: "AI video generation and creative production",
    focus:
      "is an AI creative platform for generating, editing, and transforming video and images. It serves creative teams that need generative video, motion experiments, background changes, image-to-video workflows, and fast visual iteration.",
    buyer:
      "Runway is a comparison point for teams exploring AI-native production rather than standard editing. Buyers should assess generation quality, control over shots, commercial usage terms, collaboration, cost per output, and how it fits existing creative review processes.",
  },
  "Canva Video": {
    tagline: "Template-based video design for everyday teams",
    focus:
      "is Canva's video editing experience for making social clips, presentations, ads, explainers, and branded content. It brings video editing into the same template, design, stock asset, and brand-kit workflow many teams already use.",
    buyer:
      "Canva Video fits buyers who want broad design utility with enough video capability for routine marketing work. Compare it on brand controls, template depth, stock assets, collaboration, export options, and whether it can replace a dedicated video editor for common tasks.",
  },
  "Adobe Premiere Pro": {
    tagline: "Professional video editing for production teams",
    focus:
      "is a professional nonlinear video editor for creators, agencies, and production teams. It supports advanced timelines, color, audio, effects, captions, plugins, collaboration workflows, and integration with the broader Adobe Creative Cloud suite.",
    buyer:
      "Premiere Pro is the benchmark when editing depth and production control are non-negotiable. Buyers should compare learning curve, hardware needs, Creative Cloud dependency, collaboration, AI assistance, and whether the team needs professional finishing rather than fast social editing.",
  },
  "DaVinci Resolve": {
    tagline: "Video editing, color, audio, and finishing suite",
    focus:
      "is a professional post-production suite that combines editing, color grading, visual effects, motion graphics, and audio post-production. It is known for strong color workflows and a capable free tier for serious creators.",
    buyer:
      "DaVinci Resolve is a good shortlist choice when professional control matters but buyers want a different cost structure or workflow than Adobe. Compare editing comfort, color requirements, collaboration needs, plugin ecosystem, training time, and paid Studio features.",
  },

  Obsidian: {
    tagline: "Markdown notes for connected personal knowledge",
    focus:
      "is a markdown-based note-taking and personal knowledge management app built around local files, backlinks, graph views, plugins, and highly customizable workflows. It is popular with users who want ownership and structure over their notes.",
    buyer:
      "Obsidian is often compared by buyers who care about linked thinking, privacy, and extensibility more than a polished team workspace. Evaluate sync, mobile use, plugin reliability, publishing needs, collaboration limits, and whether markdown files match the user's long-term habits.",
  },
  Evernote: {
    tagline: "Cross-platform notes, documents, and organization",
    focus:
      "is a note-taking and organization app for capturing notes, web clips, documents, images, tasks, and searchable personal information. It is designed for users who want a familiar place to collect and retrieve work across devices.",
    buyer:
      "Evernote is relevant when buyers value mature capture workflows and broad note organization. Compare it on search, offline access, document handling, task features, pricing, export options, and whether it feels lighter or heavier than newer knowledge tools.",
  },
  "Microsoft OneNote": {
    tagline: "Freeform notes inside the Microsoft ecosystem",
    focus:
      "is Microsoft's notebook-style note app for freeform pages, sections, handwriting, attachments, meeting notes, and class or team organization. It is familiar to users who already rely on Microsoft 365 accounts and devices.",
    buyer:
      "OneNote fits buyers who want flexible note pages and Microsoft integration without adopting a separate knowledge system. Compare it on organization model, search, sharing, handwriting support, mobile quality, and whether notebooks become easier or harder to maintain at scale.",
  },
  Notion: {
    tagline: "All-in-one workspace for docs, wikis, and databases",
    focus:
      "is a workspace for docs, wikis, projects, notes, lightweight databases, and collaborative knowledge management. It helps teams combine written context, structured information, templates, and shared workflows in one flexible environment.",
    buyer:
      "Notion is a strong comparison point when buyers want more than personal notes. Evaluate database flexibility, permissions, offline needs, AI features, template quality, performance, and whether the team benefits from one workspace or needs more specialized tools.",
  },
  Capacities: {
    tagline: "Object-based notes for personal knowledge work",
    focus:
      "is a personal knowledge management tool organized around objects, links, daily notes, media, and connected ideas. It is designed for people who want a structured knowledge base without building everything from raw markdown files.",
    buyer:
      "Capacities fits buyers who like connected thinking but prefer a more guided model than Obsidian. Compare object types, linking speed, capture flow, mobile support, export options, AI features, and whether the structure helps or slows daily note-taking.",
  },
  Anytype: {
    tagline: "Local-first knowledge base with privacy controls",
    focus:
      "is a local-first personal knowledge and collaboration app built around objects, spaces, templates, and private data ownership. It appeals to users who want a Notion-like structure with a stronger privacy and offline orientation.",
    buyer:
      "Anytype is worth comparing when data ownership and local-first access are major requirements. Buyers should evaluate sync behavior, collaboration maturity, template flexibility, export model, learning curve, and whether privacy benefits outweigh ecosystem size.",
  },
  Logseq: {
    tagline: "Open-source outliner for linked notes",
    focus:
      "is an open-source outliner and knowledge management app focused on daily notes, backlinks, block references, markdown or org files, and graph-based thinking. It is often used for research, journaling, and connected notes.",
    buyer:
      "Logseq fits buyers who like outlines, local files, and open-source workflows. Compare it on mobile quality, plugin ecosystem, sync, publishing, performance with large graphs, and whether block-based thinking feels natural for the user's work.",
  },
  Mem: {
    tagline: "AI-assisted notes with fast search",
    focus:
      "is an AI-assisted note-taking product for capturing thoughts, finding information quickly, and reducing the need for rigid manual organization. It is designed around fast entry, search, and resurfacing useful context.",
    buyer:
      "Mem is relevant when buyers want notes to feel more like an intelligent memory layer than a manually maintained wiki. Evaluate AI search, capture speed, import and export options, privacy, collaboration, and whether automation is reliable enough for important knowledge.",
  },
  Craft: {
    tagline: "Polished documents and notes for teams",
    focus:
      "is a document and note workspace for writing, organizing, sharing, and presenting structured pages. It emphasizes clean design, rich documents, collaboration, and a more polished writing experience than many database-heavy workspaces.",
    buyer:
      "Craft belongs in comparisons when presentation quality and writing flow matter. Buyers should look at document structure, sharing, collaboration, offline access, export formats, team controls, and whether it replaces notes, docs, or lightweight knowledge bases.",
  },
  Reflect: {
    tagline: "Networked notes for thinking and recall",
    focus:
      "is a networked note-taking app for personal knowledge, daily notes, backlinks, calendar context, and AI-assisted recall. It is aimed at users who want a calm environment for thinking, writing, and revisiting ideas.",
    buyer:
      "Reflect fits buyers who want a focused personal knowledge system without the complexity of a broad workspace. Compare linking, search, calendar integration, AI features, import and export paths, and whether the subscription is justified for individual use.",
  },

  GitHub: {
    tagline: "Code hosting and collaboration for developers",
    focus:
      "is a code hosting and developer collaboration platform for Git repositories, pull requests, issues, packages, automation, security scanning, and open-source discovery. It is the default reference point for many software teams.",
    buyer:
      "GitHub is usually the benchmark because community, integrations, and developer familiarity are difficult to match. Buyers should evaluate permissions, compliance, CI/CD needs, code review workflow, security features, enterprise controls, and whether consolidation beats a more specialized platform.",
  },
  GitLab: {
    tagline: "Git repository hosting with integrated DevOps",
    focus:
      "is a DevOps platform that combines Git repository hosting, code review, CI/CD, security, planning, and deployment workflows. It is often selected by teams that want more of the software delivery lifecycle in one product.",
    buyer:
      "GitLab is a strong fit when buyers want fewer separate tools around repositories and pipelines. Compare it on CI/CD depth, self-managed options, project planning, security features, admin controls, and how much platform consolidation the team can actually use.",
  },
  Bitbucket: {
    tagline: "Git hosting for Atlassian-oriented teams",
    focus:
      "is a Git code hosting product with pull requests, branch permissions, pipelines, and integration with Jira and other Atlassian tools. It is built for teams already managing software work through the Atlassian ecosystem.",
    buyer:
      "Bitbucket belongs on shortlists when Jira alignment matters more than public ecosystem reach. Buyers should compare repository workflow, pull request experience, pipelines, permissions, pricing with Atlassian bundles, and whether developer adoption will be smooth.",
  },
  Gitea: {
    tagline: "Lightweight self-hosted Git collaboration",
    focus:
      "is a lightweight Git hosting and collaboration platform for self-hosted repositories, issues, pull requests, packages, and project workflows. It appeals to teams that want control without the overhead of a large enterprise suite.",
    buyer:
      "Gitea is relevant when buyers need self-hosting, open-source flexibility, and simple administration. Compare setup effort, upgrade process, integrations, permissions, backup strategy, and whether the smaller ecosystem is acceptable for the team's development workflow.",
  },
  Codeberg: {
    tagline: "Nonprofit Git hosting for open-source projects",
    focus:
      "is a nonprofit code hosting platform built around open-source collaboration, Git repositories, issues, pull requests, and community project hosting. It attracts developers who want a values-driven home for public software projects.",
    buyer:
      "Codeberg is a good comparison point for open-source maintainers who care about governance and community alignment. Evaluate project visibility, reliability, migration paths, collaboration features, CI options, and whether the nonprofit model fits long-term project needs.",
  },
  SourceHut: {
    tagline: "Minimal code hosting for email-based workflows",
    focus:
      "is a developer platform for Git and Mercurial hosting, mailing-list driven collaboration, builds, issue tracking, and minimal web interfaces. It is built for users who prefer simple, scriptable, standards-oriented software development workflows.",
    buyer:
      "SourceHut fits teams that value lightweight tools, email workflows, and a low-JavaScript development experience. Compare onboarding friction, code review style, build features, integrations, hosted project needs, and whether the workflow matches the team's culture.",
  },
  "Azure DevOps": {
    tagline: "Microsoft DevOps suite for repos and pipelines",
    focus:
      "is a Microsoft developer platform covering repositories, pipelines, boards, artifacts, testing, and software delivery workflows. It serves teams that want planning, code, build, and release management connected to Microsoft cloud and identity.",
    buyer:
      "Azure DevOps belongs in comparisons when enterprise Microsoft alignment is a major factor. Buyers should evaluate Azure integration, permissions, boards, pipeline capabilities, migration from GitHub or Jira, and whether the suite still fits modern developer expectations.",
  },
  "AWS CodeCommit": {
    tagline: "AWS-native private Git repositories",
    focus:
      "is an AWS-managed source control service for hosting private Git repositories with IAM-based access control and integration into AWS development workflows. It suits teams that want source code kept close to AWS infrastructure.",
    buyer:
      "CodeCommit is most relevant when cloud governance and AWS-native access control outweigh ecosystem breadth. Compare repository experience, integration with AWS CI/CD, migration effort, regional requirements, developer familiarity, and whether a broader code platform would be easier.",
  },
  Gerrit: {
    tagline: "Code review centered Git collaboration",
    focus:
      "is a code review system for Git projects, known for review labels, patch sets, access controls, and workflows used by large engineering organizations. It emphasizes rigorous review before changes land in shared branches.",
    buyer:
      "Gerrit fits teams with strict review requirements and established engineering process. Buyers should compare review depth, user experience, integration effort, hosting model, workflow complexity, and whether the process benefits justify more training.",
  },
  Phorge: {
    tagline: "Open-source code collaboration suite",
    focus:
      "is an open-source collaboration suite descended from Phabricator-style workflows, covering code review, repositories, project management, tasks, and developer coordination. It is suited to teams that want a self-hosted development hub.",
    buyer:
      "Phorge belongs in comparisons where self-hosting and integrated collaboration are important. Evaluate maintenance burden, code review workflow, project tools, integrations, user adoption, and whether a community-maintained suite matches the team's risk tolerance.",
  },

  Softr: {
    tagline: "No-code apps and portals from business data",
    focus:
      "is a no-code app builder for creating client portals, internal tools, directories, marketplaces, and business apps from data sources like Airtable, Google Sheets, and databases. It focuses on practical business-facing applications.",
    buyer:
      "Softr is a strong fit when non-technical teams need polished apps quickly without building a full software product. Compare data source support, permissions, design flexibility, user management, payments, scalability, and whether the app can grow beyond a prototype.",
  },
  Firebase: {
    tagline: "Google backend platform for app development",
    focus:
      "is Google's app development platform for authentication, databases, hosting, serverless functions, analytics, messaging, and app quality tools. It helps developers build and operate web and mobile apps without managing much backend infrastructure.",
    buyer:
      "Firebase fits technical teams that want speed, Google infrastructure, and managed backend services. Compare database model, pricing predictability, vendor lock-in, authentication needs, offline behavior, analytics, and whether the team needs SQL or a more open backend.",
  },
  Airtable: {
    tagline: "Flexible database workflows for business teams",
    focus:
      "is a collaborative database and workflow platform that combines spreadsheet-like ease with structured records, views, forms, automations, and interfaces. Business teams use it to organize operations, content, projects, inventory, and lightweight apps.",
    buyer:
      "Airtable is usually compared when spreadsheets are no longer enough but a custom app is too much. Buyers should evaluate record limits, permissions, automation depth, interface builder, integrations, governance, and whether business users can maintain the system.",
  },
  Supabase: {
    tagline: "Open-source backend platform built on Postgres",
    focus:
      "is an open-source backend platform built around Postgres, authentication, storage, realtime features, edge functions, and developer tooling. It is often used by teams that want Firebase-like speed with a relational database foundation.",
    buyer:
      "Supabase belongs on shortlists when developers want managed backend speed without giving up SQL and Postgres portability. Compare auth, database scaling, realtime requirements, self-hosting options, edge functions, pricing, and ecosystem maturity.",
  },
  Bubble: {
    tagline: "No-code platform for building web apps",
    focus:
      "is a no-code web app builder for creating databases, workflows, interfaces, user accounts, marketplaces, SaaS apps, and internal tools. It gives builders visual control over both frontend behavior and application logic.",
    buyer:
      "Bubble is relevant when buyers want to launch real web apps without traditional engineering, but still need logic and database depth. Compare learning curve, performance, plugin dependency, design control, pricing, and the path from prototype to production.",
  },
  Glide: {
    tagline: "No-code business apps from spreadsheets and data",
    focus:
      "is a no-code app builder for turning spreadsheets and business data into mobile-friendly apps, portals, dashboards, and internal tools. It is designed for teams that need operational apps without a custom engineering project.",
    buyer:
      "Glide fits buyers who want clean internal tools and field apps from existing data. Compare data source support, user permissions, mobile experience, automation, branding, pricing by user, and whether the app needs deeper custom logic.",
  },
  Adalo: {
    tagline: "No-code mobile app builder for founders",
    focus:
      "is a no-code app builder for creating mobile and web apps with screens, components, databases, actions, and publishing workflows. It is often used by founders and small teams building MVPs or customer-facing mobile experiences.",
    buyer:
      "Adalo belongs in comparisons where mobile app delivery matters more than internal business workflows. Buyers should evaluate design flexibility, native publishing, database limits, integrations, performance, and whether a no-code stack can support future product complexity.",
  },
  Baserow: {
    tagline: "Open-source no-code database platform",
    focus:
      "is an open-source no-code database platform for creating tables, views, forms, and collaborative data workflows. It appeals to teams that want Airtable-style usability with more control over hosting and data ownership.",
    buyer:
      "Baserow is worth comparing when buyers need a flexible database but prefer open-source or self-hosted options. Evaluate hosting model, permissions, automation, API quality, scalability, integrations, and whether it can support non-technical operators.",
  },
  Xano: {
    tagline: "No-code backend and API builder",
    focus:
      "is a no-code backend platform for databases, APIs, authentication, business logic, and scalable server-side workflows. It is commonly paired with frontend builders when teams need more backend depth than a basic no-code database.",
    buyer:
      "Xano fits buyers who want backend power without writing traditional backend code. Compare API flexibility, database modeling, performance, auth, background tasks, pricing, and whether developers can step in later without rebuilding everything.",
  },
  Retool: {
    tagline: "Low-code internal tools for engineering teams",
    focus:
      "is a low-code platform for building internal tools, admin panels, dashboards, and operational workflows on top of databases and APIs. It is designed for technical teams that need to ship business software quickly.",
    buyer:
      "Retool is a strong fit when engineers are involved and internal productivity is the goal. Buyers should evaluate connector coverage, permissions, deployment options, auditability, UI flexibility, pricing by user, and governance for many internal apps.",
  },

  Wix: {
    tagline: "Website builder for small businesses and creators",
    focus:
      "is a website builder for creating business sites, portfolios, stores, blogs, bookings, and marketing pages with templates, hosting, design tools, and built-in business features. It is aimed at users who want to launch without coding.",
    buyer:
      "Wix is usually compared when ease of setup and all-in-one website management matter. Buyers should evaluate templates, SEO controls, app marketplace, ecommerce needs, site speed, design freedom, and whether convenience outweighs platform lock-in.",
  },
  Webflow: {
    tagline: "Visual website builder with CMS and hosting",
    focus:
      "is a visual website design and CMS platform for building responsive sites, landing pages, marketing pages, and content-driven experiences. It gives designers detailed layout control while handling hosting and publishing workflows.",
    buyer:
      "Webflow fits buyers who want high design control without building a full custom frontend. Compare CMS limits, localization, ecommerce, performance, handoff workflow, editor usability, pricing, and whether designers or marketers will own daily updates.",
  },
  WordPress: {
    tagline: "Open-source CMS for publishing and websites",
    focus:
      "is an open-source content management system for blogs, marketing sites, media properties, stores, and custom websites. Its plugin and theme ecosystem makes it one of the broadest options for publishing and site ownership.",
    buyer:
      "WordPress belongs in comparisons where extensibility, ownership, and ecosystem depth matter. Buyers should evaluate hosting, maintenance, security, plugin quality, editing experience, performance, and whether the team can manage updates responsibly.",
  },
  Squarespace: {
    tagline: "Polished website builder for brands and commerce",
    focus:
      "is a website builder for portfolios, small business sites, blogs, ecommerce, scheduling, and branded web presence. It emphasizes polished templates, hosted infrastructure, and simple tools for creators and service businesses.",
    buyer:
      "Squarespace fits buyers who want attractive sites with fewer technical decisions. Compare template flexibility, commerce features, SEO controls, content editing, integrations, pricing, and whether the design system feels distinctive enough for the brand.",
  },
  Framer: {
    tagline: "Design-led website builder for modern teams",
    focus:
      "is a visual website builder for launching responsive marketing sites, landing pages, CMS pages, and interactive web experiences. It appeals to design-led teams that want fast publishing with a modern canvas-style workflow.",
    buyer:
      "Framer is relevant when visual polish, speed, and designer ownership are priorities. Buyers should compare CMS maturity, localization, analytics integrations, code extensibility, handoff process, and whether the editor supports the team's publishing cadence.",
  },
  Carrd: {
    tagline: "Simple one-page websites and landing pages",
    focus:
      "is a lightweight website builder for one-page sites, profiles, landing pages, link pages, and simple forms. It is built for creators, founders, and small projects that need a fast web presence with minimal complexity.",
    buyer:
      "Carrd fits buyers who need simple pages more than a full CMS. Compare pricing, custom domains, forms, embeds, responsiveness, template fit, and whether the project will soon outgrow a single-page structure.",
  },
  Dorik: {
    tagline: "No-code website builder for simple business sites",
    focus:
      "is a no-code website builder for landing pages, startup sites, agency sites, CMS pages, and simple business websites. It combines templates, hosting, forms, and content management in a streamlined publishing workflow.",
    buyer:
      "Dorik is useful when buyers want an affordable, straightforward website builder with enough CMS capability for routine content. Evaluate template quality, editor speed, SEO settings, integrations, client handoff, and whether it can support future site complexity.",
  },
  Typedream: {
    tagline: "Creator-friendly landing pages and websites",
    focus:
      "is a no-code website and landing page builder for creators, startups, and small teams. It focuses on quick publishing, simple page editing, forms, templates, and a writing-first approach to launching a web presence.",
    buyer:
      "Typedream fits buyers who want to move quickly without managing design-heavy systems. Compare template range, custom domains, SEO controls, integrations, content structure, pricing, and whether the simplicity supports the project's growth plans.",
  },
  Webstudio: {
    tagline: "Open-source visual website builder",
    focus:
      "is an open-source visual website builder for designing and publishing responsive sites with modern web controls. It appeals to teams that want a visual editing workflow with more openness than many hosted website builders.",
    buyer:
      "Webstudio belongs in comparisons where open-source direction and design control matter. Buyers should evaluate hosting choices, CMS needs, editor maturity, collaboration, export or ownership model, and whether the ecosystem is mature enough for production use.",
  },
  Duda: {
    tagline: "Website builder for agencies and client sites",
    focus:
      "is a website builder for agencies, SaaS platforms, and teams managing many client sites. It offers templates, responsive editing, client management, white-label options, widgets, ecommerce, and workflows for repeatable site delivery.",
    buyer:
      "Duda is strongest when buyers manage websites at scale for clients or local businesses. Compare agency workflows, permissions, white-labeling, site performance, ecommerce, integrations, and whether it improves margins across many similar projects.",
  },

  Apollo: {
    tagline: "Sales intelligence and outreach platform",
    focus:
      "is a sales platform for prospecting, contact data, company research, sequencing, email outreach, calling, enrichment, and sales engagement. It helps go-to-market teams find prospects and run outbound workflows from one system.",
    buyer:
      "Apollo is a strong comparison point when buyers want database and engagement in one product. Evaluate data accuracy, deliverability controls, CRM sync, sequencing, intent signals, pricing by credits or seats, and how cleanly reps can work inside it.",
  },
  Salesloft: {
    tagline: "Sales engagement for revenue teams",
    focus:
      "is a sales engagement platform for cadences, email and call workflows, coaching, pipeline execution, forecasting support, and revenue team productivity. It is designed for structured sales organizations with repeatable outbound and follow-up motions.",
    buyer:
      "Salesloft fits buyers who need mature sales engagement process, coaching, and management visibility. Compare CRM integration, sequence governance, analytics, dialer needs, AI assistance, enterprise controls, and adoption by account executives and SDRs.",
  },
  Outreach: {
    tagline: "Revenue workflow platform for sales teams",
    focus:
      "is a revenue workflow and sales engagement platform for prospecting workflows, sequences, deal execution, conversation intelligence, forecasting, and sales productivity. It supports teams running structured, high-volume revenue motions.",
    buyer:
      "Outreach belongs on shortlists when sales process consistency and revenue operations maturity matter. Buyers should evaluate CRM sync, sequencing, forecasting workflows, AI features, manager visibility, compliance, and whether the platform is too heavy for the team size.",
  },
  "Reply.io": {
    tagline: "Sales outreach automation for email and calls",
    focus:
      "is a sales engagement platform for cold email, multichannel sequences, calls, tasks, prospect management, and automation. It helps sales teams build outbound campaigns, follow up with leads, and manage conversations across channels.",
    buyer:
      "Reply.io is relevant when buyers need outbound automation without committing to the largest enterprise sales suites. Compare deliverability, sequence flexibility, mailbox management, CRM integrations, reporting, pricing, and how much manual personalization the team still needs.",
  },
  Instantly: {
    tagline: "Cold email outreach with warmup and leads",
    focus:
      "is a cold email platform for sending outbound campaigns, managing inboxes, warming email accounts, finding leads, and tracking replies. It is aimed at teams and agencies that run high-volume email outreach.",
    buyer:
      "Instantly fits buyers focused on cold email execution and deliverability operations. Evaluate warmup approach, inbox scaling, lead data, bounce handling, personalization, reporting, compliance, and whether the workflow supports quality outreach rather than just volume.",
  },
  Lemlist: {
    tagline: "Personalized cold outreach campaigns",
    focus:
      "is an outbound sales platform for personalized cold email, multichannel sequences, deliverability, lead generation, and campaign management. It is known for helping teams add personalization to outreach instead of sending generic blasts.",
    buyer:
      "Lemlist is a good comparison point when buyers want creative outreach and deliverability support together. Compare personalization depth, campaign testing, mailbox health, CRM sync, LinkedIn steps, reporting, and the team's ability to maintain quality at scale.",
  },
  Woodpecker: {
    tagline: "Cold email follow-up software for SMB teams",
    focus:
      "is a cold email and follow-up platform for sales teams, agencies, recruiters, and small businesses. It supports automated sequences, reply detection, deliverability checks, personalization, and inbox-based outreach workflows.",
    buyer:
      "Woodpecker fits buyers who want focused cold email without a broad enterprise sales platform. Evaluate deliverability, follow-up logic, agency features, integrations, team management, pricing, and whether the workflow is simple enough for daily outbound execution.",
  },
  Smartlead: {
    tagline: "Cold email infrastructure for outbound teams",
    focus:
      "is a cold email platform for managing many sending accounts, warmup, campaign automation, inbox rotation, reply handling, and outbound performance. It is built for teams that care deeply about email deliverability at scale.",
    buyer:
      "Smartlead is most relevant when outbound volume, inbox management, and deliverability infrastructure drive the buying decision. Compare account rotation, unified inbox, reporting, lead sources, agency controls, pricing, and the operational discipline required to use it well.",
  },
  Clay: {
    tagline: "Prospecting and data enrichment workflows",
    focus:
      "is a prospecting and data enrichment platform for building lead lists, combining data providers, automating research, enriching accounts, and triggering personalized outbound workflows. It helps growth teams turn fragmented data into usable sales motions.",
    buyer:
      "Clay belongs in comparisons when data quality and workflow flexibility matter more than a simple email sequencer. Evaluate enrichment coverage, waterfall logic, AI research, CRM sync, outbound integrations, credit costs, and whether operators can maintain the workflows.",
  },
  ZoomInfo: {
    tagline: "B2B contact data and sales intelligence",
    focus:
      "is a B2B sales intelligence platform for company data, contact data, intent signals, enrichment, prospecting, and go-to-market workflows. It is used by revenue teams that need broad account and contact coverage.",
    buyer:
      "ZoomInfo is a benchmark for buyers who need scale and enterprise-grade sales data. Compare data accuracy, regional coverage, intent quality, compliance, enrichment workflows, CRM integration, contract cost, and whether the team can convert data access into pipeline.",
  },

  Postman: {
    tagline: "API platform for development, testing, and docs",
    focus:
      "is an API platform for designing, testing, documenting, mocking, monitoring, and collaborating on APIs. It gives developers shared workspaces, collections, an API client, automation, governance, and tools for shipping API products.",
    buyer:
      "Postman is usually the benchmark when teams compare API tools because it covers both individual testing and team workflows. Evaluate collaboration, test automation, documentation, governance, CLI support, security controls, and whether the broader platform is worth the complexity.",
  },
  Swagger: {
    tagline: "OpenAPI tools for API design and documentation",
    focus:
      "is a family of tools around OpenAPI for designing, describing, documenting, testing, and collaborating on APIs. It is widely associated with API specifications, interactive documentation, and contract-driven API development.",
    buyer:
      "Swagger fits buyers who want OpenAPI-centered workflows and recognizable API documentation patterns. Compare specification editing, documentation output, testing support, governance, collaboration, hosted versus open-source options, and how well it fits an existing API lifecycle.",
  },
  Insomnia: {
    tagline: "API client for REST, GraphQL, and gRPC",
    focus:
      "is an API client and development tool for sending requests, organizing collections, testing REST and GraphQL APIs, managing environments, and collaborating on API workflows. It is often valued for a clean developer experience.",
    buyer:
      "Insomnia belongs in comparisons when buyers want a focused API client rather than a broad platform. Evaluate request building, environment management, Git workflows, team sync, plugin needs, GraphQL support, and how it compares with Postman for daily use.",
  },
  Stoplight: {
    tagline: "API design, documentation, and governance",
    focus:
      "is an API design and documentation platform centered on OpenAPI, style guides, governance, mock servers, and developer-facing documentation. It helps teams standardize APIs before and after implementation.",
    buyer:
      "Stoplight is relevant when API consistency and documentation quality are core buying criteria. Compare design workflow, governance rules, review process, developer portal output, OpenAPI support, collaboration, and whether it complements or replaces existing API clients.",
  },
  Bruno: {
    tagline: "Open-source API client with Git-friendly files",
    focus:
      "is an open-source API client that stores collections as local files and fits Git-based workflows. It is designed for developers who want request collections, environments, and collaboration without a cloud-first dependency.",
    buyer:
      "Bruno fits buyers who care about local ownership, Git review, and a simpler API client experience. Evaluate feature depth, team sharing, scripting, environment support, import paths, and whether local files are an advantage for the team.",
  },
  Hoppscotch: {
    tagline: "Lightweight web API client for developers",
    focus:
      "is a lightweight API development tool for testing REST, GraphQL, WebSocket, and realtime requests from a web interface. It appeals to developers who want quick request testing without a heavy desktop workflow.",
    buyer:
      "Hoppscotch belongs in comparisons when speed, simplicity, and open-source direction matter. Compare protocol support, collections, environments, team features, self-hosting, authentication handling, and whether it can replace a richer API client.",
  },
  ReadMe: {
    tagline: "Developer portals and API documentation",
    focus:
      "is a developer documentation and API reference platform for building portals, guides, changelogs, API explorers, and onboarding experiences. It helps API companies turn technical documentation into a usable developer product surface.",
    buyer:
      "ReadMe is strongest when documentation experience directly affects activation and support. Buyers should evaluate API reference quality, developer portal customization, analytics, changelog workflows, authentication, collaboration, and whether it improves developer onboarding.",
  },
  Redocly: {
    tagline: "OpenAPI documentation and developer portals",
    focus:
      "is an API documentation and developer portal platform built around OpenAPI, reference docs, governance, linting, and publishing workflows. It helps teams produce consistent API docs from specifications.",
    buyer:
      "Redocly fits buyers who want polished OpenAPI documentation with governance around API standards. Compare portal flexibility, linting rules, CI integration, multi-API support, hosting options, and whether the docs workflow aligns with engineering practices.",
  },
  Apidog: {
    tagline: "All-in-one API design, testing, and docs",
    focus:
      "is an API development platform combining API design, debugging, testing, mocking, documentation, and collaboration. It is positioned for teams that want several API lifecycle tasks inside one coordinated workspace.",
    buyer:
      "Apidog is worth comparing when buyers want an integrated alternative to stitching together separate API tools. Evaluate request testing, documentation quality, mock servers, automated testing, team permissions, imports, and whether the interface fits daily developer habits.",
  },
  "Kong Insomnia": {
    tagline: "Kong-backed API client and testing workflow",
    focus:
      "is Kong's API client experience for designing, debugging, and testing APIs with support for REST, GraphQL, environments, collections, and team workflows. It connects API client work with Kong's broader API platform story.",
    buyer:
      "Kong Insomnia fits buyers who want a developer-friendly API client with a path into larger API management workflows. Compare client usability, sync, governance, gateway adjacency, pricing, and whether the Kong ecosystem is relevant to the team.",
  },

  Podia: {
    tagline: "Courses, digital products, and creator commerce",
    focus:
      "is a creator commerce platform for selling online courses, downloads, coaching, memberships, webinars, email, and simple storefronts. It helps creators package knowledge and digital products without assembling many separate tools.",
    buyer:
      "Podia fits buyers who want a friendly all-in-one platform for selling education and digital products. Compare checkout, email marketing, community features, course experience, fees, customization, and whether simplicity matters more than advanced learning management.",
  },
  Teachable: {
    tagline: "Online course platform for creators",
    focus:
      "is an online course platform for creating, selling, and managing courses, coaching, memberships, and digital learning products. It supports course builders who need checkout, student management, content delivery, and creator business tools.",
    buyer:
      "Teachable is a strong comparison point when course selling is the center of the business. Buyers should evaluate course experience, payments, taxes, affiliates, student engagement, customization, reporting, and whether creator tools are deep enough for growth.",
  },
  Thinkific: {
    tagline: "Course platform for learning businesses",
    focus:
      "is an online learning platform for building courses, communities, memberships, and education businesses. It helps creators and companies deliver structured learning experiences with site tools, checkout, student management, and engagement features.",
    buyer:
      "Thinkific fits buyers who need a more learning-focused platform than a simple checkout tool. Compare course structure, community, assessments, branding, integrations, analytics, pricing, and whether it supports both first launch and later scale.",
  },
  Kajabi: {
    tagline: "All-in-one platform for knowledge businesses",
    focus:
      "is a platform for selling courses, memberships, coaching, digital products, websites, funnels, email, and creator business offers. It is built for knowledge entrepreneurs who want marketing and product delivery in one place.",
    buyer:
      "Kajabi belongs in comparisons when the buyer wants a full business platform rather than only course hosting. Evaluate funnel tools, email, checkout, course experience, community, price, customization, and whether the all-in-one approach reduces tool sprawl.",
  },
  Circle: {
    tagline: "Community platform for memberships and courses",
    focus:
      "is a community platform for memberships, discussions, events, courses, live streams, and member engagement. It is designed for creators, educators, and brands that want community interaction to be central to the product.",
    buyer:
      "Circle is strongest when community experience is more important than a traditional course catalog. Compare spaces, events, course features, moderation, payments, member profiles, mobile app experience, and whether engagement workflows match the audience.",
  },
  "Mighty Networks": {
    tagline: "Community and courses for creator-led networks",
    focus:
      "is a platform for building branded communities, courses, memberships, events, and paid networks. It helps creators and organizations bring content, conversation, and member relationships into one destination.",
    buyer:
      "Mighty Networks fits buyers who want a community-led product with education and membership revenue attached. Evaluate member engagement, course tools, events, mobile experience, branding, payments, and whether the network model suits the audience.",
  },
  LearnWorlds: {
    tagline: "Interactive course platform for educators",
    focus:
      "is an online course platform for building interactive learning experiences, academies, assessments, certificates, communities, and branded education sites. It is used by creators, trainers, and businesses that want richer learning delivery.",
    buyer:
      "LearnWorlds belongs on shortlists when learning experience and interactivity matter. Compare course player quality, assessments, certificates, video features, branding, analytics, integrations, and whether it is too advanced for a simple creator product.",
  },
  Skilljar: {
    tagline: "Customer education platform for B2B companies",
    focus:
      "is a customer education and training platform for B2B companies that need academies, certifications, onboarding courses, and external learner management. It helps SaaS teams educate customers, partners, and users at scale.",
    buyer:
      "Skilljar is relevant when the buyer is a company training customers rather than a solo creator selling courses. Evaluate LMS depth, Salesforce integration, certification, reporting, localization, learner management, and customer success outcomes.",
  },
  Gumroad: {
    tagline: "Simple checkout for digital products",
    focus:
      "is a creator commerce platform for selling digital products, memberships, files, courses, and simple offers. It gives creators a fast way to publish a product page, collect payment, deliver files, and start selling.",
    buyer:
      "Gumroad fits buyers who prioritize speed and simplicity over a full course or community system. Compare fees, audience tools, checkout flexibility, product delivery, memberships, customization, and whether the creator needs marketing automation elsewhere.",
  },
  "Lemon Squeezy": {
    tagline: "Merchant-of-record checkout for digital products",
    focus:
      "is a software and digital product commerce platform with checkout, subscriptions, license keys, tax handling, and merchant-of-record support. It is often used by software makers and creators selling globally.",
    buyer:
      "Lemon Squeezy belongs in comparisons when tax handling, subscriptions, and software-friendly commerce matter. Buyers should evaluate merchant-of-record coverage, checkout conversion, license workflows, payouts, integrations, fees, and whether it replaces a more complex payment stack.",
  },

  Jenkins: {
    tagline: "Open-source automation server for CI/CD",
    focus:
      "is an open-source automation server for building, testing, deploying, and orchestrating software delivery workflows. Its plugin ecosystem and self-hosted model make it a long-running option for customizable CI/CD pipelines.",
    buyer:
      "Jenkins is most relevant when teams need deep control and can manage their own automation infrastructure. Compare plugin maintenance, security, pipeline-as-code, scalability, admin burden, cloud alternatives, and whether flexibility is worth the operational cost.",
  },
  "GitHub Actions": {
    tagline: "CI/CD automation inside GitHub",
    focus:
      "is GitHub's workflow automation and CI/CD system for building, testing, packaging, and deploying code from repositories. It uses event-driven workflows and marketplace actions to automate software delivery inside GitHub.",
    buyer:
      "GitHub Actions fits teams already hosting code on GitHub and wanting automation close to pull requests. Evaluate runner costs, workflow security, marketplace dependency, caching, deployment targets, secrets handling, and whether it covers the team's pipeline complexity.",
  },
  "GitLab CI/CD": {
    tagline: "Integrated CI/CD for GitLab projects",
    focus:
      "is GitLab's integrated continuous integration and delivery system for building, testing, scanning, packaging, and deploying applications. It is part of GitLab's broader repository, planning, security, and DevOps platform.",
    buyer:
      "GitLab CI/CD is a strong choice when teams already use GitLab or want pipeline and repository workflows in one platform. Compare runner management, pipeline syntax, security scanning, environments, approvals, cost, and self-managed requirements.",
  },
  CircleCI: {
    tagline: "Cloud CI/CD for fast build and test pipelines",
    focus:
      "is a CI/CD platform for automating builds, tests, deployments, and software delivery pipelines. It supports cloud and self-hosted runner options, parallelism, caching, workflow configuration, and integrations with major code hosts.",
    buyer:
      "CircleCI fits teams that want dedicated CI/CD performance and workflow control outside the code host. Evaluate build speed, configuration clarity, runner options, cache behavior, pricing, security controls, and support for monorepos or complex pipelines.",
  },
  Buildkite: {
    tagline: "CI/CD pipelines with self-hosted agents",
    focus:
      "is a CI/CD platform that combines hosted orchestration with self-hosted build agents. It is used by teams that want scalable pipeline coordination while keeping builds on their own infrastructure.",
    buyer:
      "Buildkite is relevant when control, performance, and custom infrastructure matter. Compare agent management, security model, pipeline visibility, monorepo support, cost, developer experience, and whether the team can operate its own build fleet.",
  },
  "Travis CI": {
    tagline: "Hosted CI/CD for automated builds and tests",
    focus:
      "is a hosted CI/CD platform for building, testing, and deploying software from Git repositories. It has long been used by open-source and private projects that need straightforward automation from commits and pull requests.",
    buyer:
      "Travis CI fits buyers who want a familiar hosted CI service with simple repository-driven workflows. Evaluate language support, build minutes, pricing, configuration, integration with code hosts, reliability, and whether newer CI options offer better fit.",
  },
  "Azure Pipelines": {
    tagline: "Microsoft CI/CD for cloud and enterprise teams",
    focus:
      "is Microsoft's CI/CD service for building, testing, and deploying applications across languages, platforms, and clouds. It connects with Azure DevOps, GitHub, containers, cloud deployments, and enterprise identity workflows.",
    buyer:
      "Azure Pipelines belongs in comparisons when Microsoft cloud, enterprise governance, or hybrid deployment targets are important. Compare YAML workflow, hosted agents, approvals, Azure integration, pricing, security, and developer experience versus code-host-native automation.",
  },
  Harness: {
    tagline: "Software delivery platform for modern DevOps",
    focus:
      "is a software delivery platform covering CI, continuous delivery, feature flags, cloud cost, service reliability, and deployment governance. It is aimed at teams that need controlled, observable, and automated release workflows.",
    buyer:
      "Harness fits buyers with complex delivery needs beyond basic CI. Evaluate deployment strategies, approvals, rollback, secrets, policy controls, integrations, cost, and whether the organization is ready for a broader delivery platform.",
  },
  "Argo CD": {
    tagline: "Open-source GitOps delivery for Kubernetes",
    focus:
      "is an open-source GitOps continuous delivery tool for Kubernetes. It syncs desired application state from Git repositories to Kubernetes environments, tracks drift, visualizes deployments, and helps platform teams manage declarative releases.",
    buyer:
      "Argo CD belongs on shortlists when Kubernetes and GitOps are central to the deployment model. Compare many-environment management, security, UI, rollback behavior, integration with CI, operational ownership, and whether teams understand declarative delivery.",
  },
  Semaphore: {
    tagline: "CI/CD for fast build, test, and deploy workflows",
    focus:
      "is a CI/CD platform for automating builds, tests, deployments, and release workflows. It focuses on fast pipelines, configurable workflows, hosted execution, and developer productivity across common languages and infrastructure targets.",
    buyer:
      "Semaphore fits teams that want a dedicated CI/CD service with speed and straightforward configuration. Evaluate build performance, caching, parallelism, deployment support, pricing, secrets handling, and whether it improves feedback cycles compared with existing tools.",
  },
};

const clusterGuidance = {
  "AI Chatbots and AI Assistants":
    "It belongs on a shortlist when the buyer needs a dependable AI assistant for daily work, research, and content creation. Test it with real prompts, sensitive data policies, team administration needs, and adjacent options such as AI search, workplace copilots, and developer-focused assistants.",
  "Video Editing and Creative Production":
    "It belongs on a shortlist when the buyer needs repeatable video production without slowing the content calendar. Test it with real footage, brand assets, captions, exports, approval workflows, and adjacent options such as pro editors, design suites, and AI video generators.",
  "Notes and Personal Knowledge Management":
    "It belongs on a shortlist when the buyer needs a note system they will keep using after the first week. Test capture speed, search, linking, import and export paths, mobile use, privacy expectations, and adjacent options such as docs, wikis, and database workspaces.",
  "Code Hosting and Repository Management":
    "It belongs on a shortlist when the buyer needs repository workflows that developers will actually adopt. Test pull requests, permissions, automation, compliance, migration effort, integrations, and adjacent options such as DevOps suites, self-hosted Git, and code review systems.",
  "No-Code Databases and App Builders":
    "It belongs on a shortlist when the buyer needs usable business software faster than a custom build. Test data modeling, permissions, scalability, integration paths, handoff, pricing, and adjacent options such as databases, backend platforms, and low-code internal tools.",
  "Website Builders and CMS":
    "It belongs on a shortlist when the buyer needs a site they can publish and maintain without constant engineering support. Test SEO controls, templates, CMS depth, performance, ownership, integrations, and adjacent options such as open-source CMS, design-led builders, and agency platforms.",
  "Sales Engagement and Cold Outreach":
    "It belongs on a shortlist when the buyer can connect the tool to a disciplined outbound process. Test data quality, deliverability, CRM sync, personalization, reporting, compliance, and adjacent options such as sales intelligence databases, enrichment tools, and focused email sequencers.",
  "API Development and Testing":
    "It belongs on a shortlist when the buyer needs API work to be easier to test, document, and share. Test import support, environments, collaboration, automation, docs output, governance, and adjacent options such as API clients, developer portals, and OpenAPI tooling.",
  "Online Course and Community Platforms":
    "It belongs on a shortlist when the buyer needs to sell knowledge products and keep learners engaged. Test checkout, course delivery, community features, branding, analytics, fees, and adjacent options such as creator commerce, LMS platforms, and membership communities.",
  "CI/CD and DevOps Automation":
    "It belongs on a shortlist when the buyer needs faster, more reliable delivery without losing control. Test pipeline configuration, runner model, secrets, approvals, deployment targets, cost, and adjacent options such as code-host-native automation, GitOps tools, and full delivery platforms.",
};

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (inQuotes) {
      if (char === "\"" && next === "\"") {
        field += "\"";
        index += 1;
      } else if (char === "\"") {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === "\"") {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [headers, ...body] = rows;
  return body
    .filter((item) => item.length === headers.length)
    .map((item) =>
      Object.fromEntries(headers.map((header, index) => [header, item[index] ?? ""])),
    );
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll("\"", "\"\"")}"` : text;
}

function normalizeTag(tag) {
  return tag.trim().toLowerCase();
}

function descriptionFor(row, note) {
  const paragraph1 = `${row.name} ${note.focus}`;
  const paragraph2 = note.buyer;
  const paragraph3 = clusterGuidance[row.cluster];
  return [paragraph1, paragraph2, paragraph3].join("\n\n");
}

function validate(rows) {
  const errors = [];
  const required = [
    "name",
    "url",
    "category",
    "tag_1",
    "tag_2",
    "tag_3",
    "tag_4",
    "tag_5",
    "pricing_model",
    "tagline",
    "rich_description",
  ];

  if (rows.length !== 100) {
    errors.push(`Expected 100 enriched rows, got ${rows.length}.`);
  }

  rows.forEach((row, index) => {
    required.forEach((field) => {
      if (!row[field]) errors.push(`Row ${index + 2} missing ${field}.`);
    });

    const tags = [row.tag_1, row.tag_2, row.tag_3, row.tag_4, row.tag_5];
    if (tags.some((tag) => !tag) || new Set(tags).size !== 5) {
      errors.push(`Row ${index + 2} must have exactly five unique tags.`);
    }

    if (row.tagline.length > 60) {
      errors.push(`Row ${index + 2} tagline is ${row.tagline.length} chars.`);
    }

    const publicCopy = `${row.tagline}\n${row.rich_description}`;
    bannedPhrases.forEach((phrase) => {
      if (publicCopy.includes(phrase)) {
        errors.push(`Row ${index + 2} contains banned phrase: ${phrase}`);
      }
    });

    if (row.rich_description.split("\n\n").length !== 3) {
      errors.push(`Row ${index + 2} rich_description must have 3 paragraphs.`);
    }
  });

  return errors;
}

const sourceAudit = [
  ["ChatGPT", 403, 0, "Blocked homepage fetch; editorial fallback used."],
  ["Claude", 403, 16, "Blocked homepage fetch; editorial fallback used."],
  ["Perplexity", 403, 16, "Blocked homepage fetch; editorial fallback used."],
  ["Phind", 403, 16, "Blocked homepage fetch; editorial fallback used."],
  ["Mistral Le Chat", 403, 16, "Blocked homepage fetch; editorial fallback used."],
  ["Canva Video", 403, 150, "Blocked homepage fetch; editorial fallback used."],
  ["Reply.io", 403, 16, "Blocked homepage fetch; editorial fallback used."],
  ["ZoomInfo", 403, 35, "Blocked homepage fetch; editorial fallback used."],
  ["Circle", 403, 149, "Blocked homepage fetch; editorial fallback used."],
  ["Gemini", 200, 22, "Thin body text; editorial fallback supplemented."],
  ["Microsoft Copilot", 200, 52, "Thin body text; editorial fallback supplemented."],
  ["Poe", 200, 365, "Login-focused page; editorial fallback supplemented."],
  ["Grok", 200, 4, "Thin body text; editorial fallback supplemented."],
  ["Microsoft OneNote", 200, 60, "Thin body text; editorial fallback supplemented."],
  ["Logseq", 200, 51, "Thin body text; editorial fallback supplemented."],
  ["Mem", 200, 133, "Thin body text; editorial fallback supplemented."],
  ["Bubble", 200, 84, "Thin body text; editorial fallback supplemented."],
  ["Hoppscotch", 200, 50, "Thin body text; editorial fallback supplemented."],
  ["Apidog", 200, 0, "Thin body text; editorial fallback supplemented."],
  ["Buildkite", 200, 49, "Thin body text; editorial fallback supplemented."],
];

const sourceText = await readFile(inputPath, "utf8");
const sourceRows = parseCsv(sourceText);
const enrichedRows = sourceRows.map((row) => {
  const note = editorial[row.name];
  if (!note) {
    throw new Error(`Missing editorial copy for ${row.name}`);
  }

  const tags = row.tags.split(";").map(normalizeTag);
  return {
    name: row.name,
    url: row.url,
    category: row.category,
    tag_1: tags[0],
    tag_2: tags[1],
    tag_3: tags[2],
    tag_4: tags[3],
    tag_5: tags[4],
    pricing_model: row.pricing_model,
    tagline: note.tagline,
    rich_description: descriptionFor(row, note),
  };
});

const errors = validate(enrichedRows);
if (errors.length > 0) {
  console.error(errors.join("\n"));
  process.exit(1);
}

const headers = [
  "name",
  "url",
  "category",
  "tag_1",
  "tag_2",
  "tag_3",
  "tag_4",
  "tag_5",
  "pricing_model",
  "tagline",
  "rich_description",
];

const csv = [
  headers.join(","),
  ...enrichedRows.map((row) => headers.map((header) => csvEscape(row[header])).join(",")),
].join("\n");

const audit = `# Cluster 31-40 Enrichment Audit

Generated: 2026-05-11

## Output

- Enriched CSV: \`${outputPath}\`
- Source inventory: \`${path.join(baseDir, "html-source-audit/source-index.csv")}\`
- Rows enriched: ${enrichedRows.length}
- Rows with fetched homepage/source body: 91
- Rows with blocked homepage fetch: 9
- Rows with thin source body supplemented editorially: 11

## Editorial Controls

- Exactly 100 rows.
- Exactly five tags per row.
- Taglines are 60 characters or fewer.
- Rich descriptions use three public-facing paragraphs per row.
- Public copy was validated against banned internal planning and source-process phrases.

## Source Exceptions

| Tool | Status | Body chars | Note |
| --- | ---: | ---: | --- |
${sourceAudit
  .map(([name, status, chars, note]) => `| ${name} | ${status} | ${chars} | ${note} |`)
  .join("\n")}

## DataForSEO Selection Constraint

The 10 clusters were selected after filtering for LOW competition terms with meaningful search demand. High-volume anchors such as ChatGPT alternatives, CapCut alternatives, GitHub alternatives, Obsidian alternatives, Postman alternatives, Softr alternatives, and Wix alternatives were prioritized because they provide stronger validated demand than lower-volume watchlist topics.
`;

await writeFile(outputPath, csv);
await writeFile(auditPath, audit);

console.log(
  JSON.stringify(
    {
      outputPath,
      auditPath,
      rows: enrichedRows.length,
      blockedSourceRows: 9,
      thinSourceRows: 11,
    },
    null,
    2,
  ),
);
