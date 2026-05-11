#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const outDir =
  "/Users/tsth/Coding/shipboost/ShipBoost-Docs/SEO-Plan/Cluster 31-40";
const outputPath = path.join(outDir, "cluster-31-40-anchor-tools-master.csv");

const rows = [
  ["AI Chatbots and AI Assistants", "ChatGPT", "https://chatgpt.com/", "anchor", "ai", "ai-chatbot;ai-assistant;productivity;research;writing", "freemium", "Validated high-volume alternatives anchor and category baseline"],
  ["AI Chatbots and AI Assistants", "Claude", "https://claude.ai/", "anchor", "ai", "ai-chatbot;ai-assistant;writing;research;coding", "freemium", "Major AI assistant buyers compare against ChatGPT and Perplexity"],
  ["AI Chatbots and AI Assistants", "Gemini", "https://gemini.google.com/", "anchor", "ai", "ai-chatbot;ai-assistant;google-workspace;research;productivity", "freemium", "Google AI assistant benchmark for broad alternatives pages"],
  ["AI Chatbots and AI Assistants", "Perplexity", "https://www.perplexity.ai/", "anchor", "ai", "ai-search;ai-assistant;research;citations;productivity", "freemium", "Validated LOW-competition alternatives term and research assistant anchor"],
  ["AI Chatbots and AI Assistants", "Microsoft Copilot", "https://copilot.microsoft.com/", "support", "ai", "ai-assistant;microsoft-365;productivity;business-ai;chatbot", "freemium", "Workplace AI assistant buyers expect in comparisons"],
  ["AI Chatbots and AI Assistants", "Poe", "https://poe.com/", "support", "ai", "ai-chatbot;multi-model;ai-assistant;creator-tools;bots", "freemium", "Multi-model AI chatbot marketplace option"],
  ["AI Chatbots and AI Assistants", "You.com", "https://you.com/", "support", "ai", "ai-search;ai-assistant;research;productivity;chatbot", "freemium", "AI search assistant for ChatGPT and Perplexity comparison depth"],
  ["AI Chatbots and AI Assistants", "Phind", "https://www.phind.com/", "support", "ai", "ai-search;developer-tools;coding;technical-research;ai-assistant", "freemium", "Developer-focused AI answer engine"],
  ["AI Chatbots and AI Assistants", "Mistral Le Chat", "https://chat.mistral.ai/", "support", "ai", "ai-chatbot;ai-assistant;open-models;productivity;research", "freemium", "European AI assistant and model-provider alternative"],
  ["AI Chatbots and AI Assistants", "Grok", "https://grok.com/", "support", "ai", "ai-chatbot;ai-assistant;research;productivity;social-ai", "freemium", "Recognizable AI chatbot option for broad alternatives pages"],

  ["Video Editing and Creative Production", "CapCut", "https://www.capcut.com/", "anchor", "marketing", "video-editing;creator-tools;social-video;templates;ai-video", "freemium", "Validated high-volume alternatives anchor"],
  ["Video Editing and Creative Production", "VEED", "https://www.veed.io/", "anchor", "marketing", "video-editing;online-video-editor;subtitles;recording;ai-video", "freemium", "Validated LOW-competition alternatives term"],
  ["Video Editing and Creative Production", "Kapwing", "https://www.kapwing.com/", "anchor", "marketing", "video-editing;online-video-editor;creator-tools;templates;collaboration", "freemium", "Validated LOW-competition alternatives term"],
  ["Video Editing and Creative Production", "Clipchamp", "https://clipchamp.com/", "anchor", "marketing", "video-editing;online-video-editor;microsoft;templates;creator-tools", "freemium", "Validated LOW-competition alternatives term"],
  ["Video Editing and Creative Production", "InVideo", "https://invideo.io/", "anchor", "marketing", "video-editing;ai-video;templates;social-video;creator-tools", "freemium", "Validated LOW-competition alternatives term"],
  ["Video Editing and Creative Production", "Descript", "https://www.descript.com/", "support", "marketing", "video-editing;podcast;transcription;ai-video;screen-recording", "freemium", "Existing video creation benchmark that strengthens editing pages"],
  ["Video Editing and Creative Production", "Runway", "https://runwayml.com/", "support", "marketing", "ai-video;video-editing;creative-production;generative-ai;creator-tools", "freemium", "AI video creation platform for creative comparisons"],
  ["Video Editing and Creative Production", "Canva Video", "https://www.canva.com/video-editor/", "support", "marketing", "video-editing;templates;design;social-video;creator-tools", "freemium", "Familiar creative suite for lightweight editing comparisons"],
  ["Video Editing and Creative Production", "Adobe Premiere Pro", "https://www.adobe.com/products/premiere.html", "support", "marketing", "video-editing;professional-video;creative-cloud;post-production;creator-tools", "paid", "Professional video editing benchmark"],
  ["Video Editing and Creative Production", "DaVinci Resolve", "https://www.blackmagicdesign.com/products/davinciresolve", "support", "marketing", "video-editing;color-grading;post-production;professional-video;creator-tools", "freemium", "Professional editing and color benchmark"],

  ["Notes and Personal Knowledge Management", "Obsidian", "https://obsidian.md/", "anchor", "productivity", "notes;knowledge-management;markdown;personal-wiki;productivity", "freemium", "Validated LOW-competition alternatives term with strong CPC"],
  ["Notes and Personal Knowledge Management", "Evernote", "https://evernote.com/", "anchor", "productivity", "notes;knowledge-management;documents;productivity;personal-organization", "freemium", "Validated high-volume alternatives anchor"],
  ["Notes and Personal Knowledge Management", "Microsoft OneNote", "https://www.onenote.com/", "anchor", "productivity", "notes;microsoft-365;knowledge-management;productivity;collaboration", "free", "Validated LOW-competition alternatives term"],
  ["Notes and Personal Knowledge Management", "Notion", "https://www.notion.so/", "support", "productivity", "notes;knowledge-management;workspace;docs;databases", "freemium", "Known workspace and notes comparator"],
  ["Notes and Personal Knowledge Management", "Capacities", "https://capacities.io/", "support", "productivity", "notes;knowledge-management;personal-crm;objects;productivity", "freemium", "Modern PKM option for Obsidian-style comparisons"],
  ["Notes and Personal Knowledge Management", "Anytype", "https://anytype.io/", "support", "productivity", "notes;knowledge-management;local-first;personal-wiki;privacy", "freemium", "Local-first personal knowledge base option"],
  ["Notes and Personal Knowledge Management", "Logseq", "https://logseq.com/", "support", "productivity", "notes;knowledge-management;outliner;markdown;open-source", "freemium", "Open-source outliner and PKM tool"],
  ["Notes and Personal Knowledge Management", "Mem", "https://mem.ai/", "support", "productivity", "notes;ai-notes;knowledge-management;productivity;search", "freemium", "AI notes tool for modern note-taking comparisons"],
  ["Notes and Personal Knowledge Management", "Craft", "https://www.craft.do/", "support", "productivity", "notes;documents;collaboration;knowledge-management;productivity", "freemium", "Polished document and notes workspace"],
  ["Notes and Personal Knowledge Management", "Reflect", "https://reflect.app/", "support", "productivity", "notes;networked-thought;ai-notes;productivity;knowledge-management", "paid", "Networked notes tool for PKM comparisons"],

  ["Code Hosting and Repository Management", "GitHub", "https://github.com/", "anchor", "development", "git;code-hosting;developer-tools;collaboration;repositories", "freemium", "Validated high-volume alternatives anchor"],
  ["Code Hosting and Repository Management", "GitLab", "https://about.gitlab.com/", "anchor", "development", "git;code-hosting;devops;ci-cd;repositories", "freemium", "Validated LOW-competition alternatives term"],
  ["Code Hosting and Repository Management", "Bitbucket", "https://bitbucket.org/product/", "anchor", "development", "git;code-hosting;atlassian;repositories;collaboration", "freemium", "Repository hosting incumbent buyers expect"],
  ["Code Hosting and Repository Management", "Gitea", "https://about.gitea.com/", "support", "development", "git;code-hosting;self-hosted;open-source;repositories", "freemium", "Self-hosted Git hosting option"],
  ["Code Hosting and Repository Management", "Codeberg", "https://codeberg.org/", "support", "development", "git;code-hosting;open-source;repositories;privacy", "free", "Nonprofit code hosting alternative"],
  ["Code Hosting and Repository Management", "SourceHut", "https://sourcehut.org/", "support", "development", "git;code-hosting;developer-tools;mailing-lists;open-source", "paid", "Minimal developer-focused code hosting platform"],
  ["Code Hosting and Repository Management", "Azure DevOps", "https://azure.microsoft.com/products/devops", "support", "development", "devops;code-hosting;ci-cd;project-management;repositories", "freemium", "Microsoft devops and repo management benchmark"],
  ["Code Hosting and Repository Management", "AWS CodeCommit", "https://aws.amazon.com/codecommit/", "support", "development", "git;code-hosting;aws;repositories;developer-tools", "paid", "AWS-native repository hosting comparator"],
  ["Code Hosting and Repository Management", "Gerrit", "https://www.gerritcodereview.com/", "support", "development", "code-review;git;developer-tools;open-source;repositories", "free", "Code review focused Git workflow option"],
  ["Code Hosting and Repository Management", "Phorge", "https://we.phorge.it/", "support", "development", "code-review;developer-tools;repositories;open-source;collaboration", "free", "Open-source code collaboration suite"],

  ["No-Code Databases and App Builders", "Softr", "https://www.softr.io/", "anchor", "development", "no-code;app-builder;client-portal;database;internal-tools", "freemium", "Validated high-volume alternatives anchor"],
  ["No-Code Databases and App Builders", "Firebase", "https://firebase.google.com/", "anchor", "development", "backend-as-a-service;database;app-development;hosting;authentication", "freemium", "Validated LOW-competition alternatives term"],
  ["No-Code Databases and App Builders", "Airtable", "https://www.airtable.com/", "anchor", "operations", "database;no-code;workflow;collaboration;app-builder", "freemium", "Recognizable no-code database benchmark"],
  ["No-Code Databases and App Builders", "Supabase", "https://supabase.com/", "anchor", "development", "backend-as-a-service;database;open-source;authentication;developer-tools", "freemium", "Developer-friendly Firebase alternative"],
  ["No-Code Databases and App Builders", "Bubble", "https://bubble.io/", "support", "development", "no-code;app-builder;web-apps;marketplace;database", "freemium", "No-code app builder incumbent"],
  ["No-Code Databases and App Builders", "Glide", "https://www.glideapps.com/", "support", "development", "no-code;app-builder;internal-tools;mobile-apps;database", "freemium", "No-code app builder for business apps"],
  ["No-Code Databases and App Builders", "Adalo", "https://www.adalo.com/", "support", "development", "no-code;app-builder;mobile-apps;database;marketplace", "freemium", "Mobile app builder option"],
  ["No-Code Databases and App Builders", "Baserow", "https://baserow.io/", "support", "operations", "database;no-code;open-source;collaboration;workflow", "freemium", "Open-source Airtable-style database"],
  ["No-Code Databases and App Builders", "Xano", "https://www.xano.com/", "support", "development", "backend-as-a-service;no-code;database;api;app-development", "paid", "No-code backend platform"],
  ["No-Code Databases and App Builders", "Retool", "https://retool.com/", "support", "development", "internal-tools;low-code;database;workflow;developer-tools", "paid", "Low-code internal tools platform"],

  ["Website Builders and CMS", "Wix", "https://www.wix.com/", "anchor", "marketing", "website-builder;no-code;templates;small-business;cms", "freemium", "Validated high-volume alternatives anchor"],
  ["Website Builders and CMS", "Webflow", "https://webflow.com/", "anchor", "marketing", "website-builder;no-code;cms;design;hosting", "freemium", "Validated LOW-competition alternatives term"],
  ["Website Builders and CMS", "WordPress", "https://wordpress.org/", "anchor", "marketing", "cms;website-builder;open-source;publishing;plugins", "free", "Website CMS benchmark"],
  ["Website Builders and CMS", "Squarespace", "https://www.squarespace.com/", "anchor", "marketing", "website-builder;templates;cms;small-business;commerce", "paid", "Known website builder comparator"],
  ["Website Builders and CMS", "Framer", "https://www.framer.com/", "support", "marketing", "website-builder;no-code;design;cms;hosting", "freemium", "Modern no-code website builder"],
  ["Website Builders and CMS", "Carrd", "https://carrd.co/", "support", "marketing", "website-builder;one-page-sites;no-code;landing-pages;small-business", "freemium", "Simple one-page website builder"],
  ["Website Builders and CMS", "Dorik", "https://dorik.com/", "support", "marketing", "website-builder;no-code;cms;landing-pages;small-business", "freemium", "No-code website builder for simple sites"],
  ["Website Builders and CMS", "Typedream", "https://typedream.com/", "support", "marketing", "website-builder;no-code;landing-pages;creator-tools;templates", "freemium", "Creator-friendly website builder"],
  ["Website Builders and CMS", "Webstudio", "https://webstudio.is/", "support", "marketing", "website-builder;open-source;design;cms;no-code", "freemium", "Open-source visual website builder"],
  ["Website Builders and CMS", "Duda", "https://www.duda.co/", "support", "marketing", "website-builder;agency-tools;templates;cms;small-business", "paid", "Agency-focused website builder"],

  ["Sales Engagement and Cold Outreach", "Apollo", "https://www.apollo.io/", "anchor", "sales", "sales-engagement;prospecting;cold-email;lead-database;outreach", "freemium", "Validated LOW-competition alternatives term"],
  ["Sales Engagement and Cold Outreach", "Salesloft", "https://www.salesloft.com/", "anchor", "sales", "sales-engagement;outreach;revenue-workflow;cadences;forecasting", "paid", "Validated LOW-competition alternatives term with high CPC"],
  ["Sales Engagement and Cold Outreach", "Outreach", "https://www.outreach.io/", "anchor", "sales", "sales-engagement;outreach;revenue-workflow;cadences;sales-ai", "paid", "Validated LOW-competition alternatives term with high CPC"],
  ["Sales Engagement and Cold Outreach", "Reply.io", "https://reply.io/", "anchor", "sales", "cold-email;sales-engagement;outreach;automation;prospecting", "paid", "Validated LOW-competition alternatives term"],
  ["Sales Engagement and Cold Outreach", "Instantly", "https://instantly.ai/", "anchor", "sales", "cold-email;outreach;lead-generation;email-warmup;sales-engagement", "paid", "Validated LOW-competition alternatives term"],
  ["Sales Engagement and Cold Outreach", "Lemlist", "https://www.lemlist.com/", "support", "sales", "cold-email;outreach;personalization;sales-engagement;lead-generation", "paid", "Recognized cold outreach tool"],
  ["Sales Engagement and Cold Outreach", "Woodpecker", "https://woodpecker.co/", "support", "sales", "cold-email;outreach;automation;follow-ups;lead-generation", "paid", "Cold email platform for SMB comparisons"],
  ["Sales Engagement and Cold Outreach", "Smartlead", "https://www.smartlead.ai/", "support", "sales", "cold-email;outreach;email-warmup;lead-generation;sales-engagement", "paid", "Modern cold email tool"],
  ["Sales Engagement and Cold Outreach", "Clay", "https://www.clay.com/", "support", "sales", "prospecting;data-enrichment;outreach;automation;lead-generation", "paid", "Prospecting and enrichment workflow tool"],
  ["Sales Engagement and Cold Outreach", "ZoomInfo", "https://www.zoominfo.com/", "support", "sales", "lead-database;prospecting;sales-intelligence;enrichment;outreach", "paid", "Sales intelligence benchmark"],

  ["API Development and Testing", "Postman", "https://www.postman.com/", "anchor", "development", "api-testing;api-client;developer-tools;api-documentation;collaboration", "freemium", "Validated high-volume alternatives anchor"],
  ["API Development and Testing", "Swagger", "https://swagger.io/", "anchor", "development", "api-documentation;api-design;openapi;developer-tools;testing", "freemium", "Validated LOW-competition alternatives term"],
  ["API Development and Testing", "Insomnia", "https://insomnia.rest/", "support", "development", "api-client;api-testing;developer-tools;open-source;graphql", "freemium", "API client alternative"],
  ["API Development and Testing", "Stoplight", "https://stoplight.io/", "support", "development", "api-design;api-documentation;openapi;developer-tools;governance", "paid", "API design and documentation platform"],
  ["API Development and Testing", "Bruno", "https://www.usebruno.com/", "support", "development", "api-client;api-testing;open-source;developer-tools;git", "freemium", "Open-source API client"],
  ["API Development and Testing", "Hoppscotch", "https://hoppscotch.io/", "support", "development", "api-client;api-testing;open-source;developer-tools;web-app", "freemium", "Lightweight API testing tool"],
  ["API Development and Testing", "ReadMe", "https://readme.com/", "support", "development", "api-documentation;developer-portal;api-reference;developer-tools;docs", "paid", "Developer portal and API docs platform"],
  ["API Development and Testing", "Redocly", "https://redocly.com/", "support", "development", "api-documentation;developer-portal;openapi;developer-tools;docs", "paid", "OpenAPI documentation platform"],
  ["API Development and Testing", "Apidog", "https://apidog.com/", "support", "development", "api-testing;api-documentation;api-design;developer-tools;mocking", "freemium", "All-in-one API development tool"],
  ["API Development and Testing", "Kong Insomnia", "https://konghq.com/products/insomnia", "support", "development", "api-client;api-testing;developer-tools;graphql;collaboration", "freemium", "Kong-backed API client option"],

  ["Online Course and Community Platforms", "Podia", "https://www.podia.com/", "anchor", "marketing", "online-courses;digital-products;community;creator-tools;checkout", "paid", "Validated LOW-competition alternatives term"],
  ["Online Course and Community Platforms", "Teachable", "https://teachable.com/", "anchor", "marketing", "online-courses;creator-tools;coaching;digital-products;checkout", "paid", "Validated LOW-competition alternatives term"],
  ["Online Course and Community Platforms", "Thinkific", "https://www.thinkific.com/", "anchor", "marketing", "online-courses;creator-tools;learning-management;community;checkout", "freemium", "Validated LOW-competition alternatives term"],
  ["Online Course and Community Platforms", "Kajabi", "https://kajabi.com/", "anchor", "marketing", "online-courses;membership-sites;marketing;creator-tools;checkout", "paid", "Recognized course platform comparator"],
  ["Online Course and Community Platforms", "Circle", "https://circle.so/", "anchor", "marketing", "community-platform;memberships;creator-tools;online-courses;events", "paid", "Community platform anchor"],
  ["Online Course and Community Platforms", "Mighty Networks", "https://www.mightynetworks.com/", "support", "marketing", "community-platform;online-courses;memberships;creator-tools;events", "paid", "Course and community platform"],
  ["Online Course and Community Platforms", "LearnWorlds", "https://www.learnworlds.com/", "support", "marketing", "online-courses;learning-management;creator-tools;checkout;education", "paid", "Course platform comparator"],
  ["Online Course and Community Platforms", "Skilljar", "https://www.skilljar.com/", "support", "marketing", "customer-education;online-courses;learning-management;b2b-saas;training", "paid", "B2B customer education platform"],
  ["Online Course and Community Platforms", "Gumroad", "https://gumroad.com/", "support", "marketing", "digital-products;creator-tools;checkout;memberships;online-courses", "paid", "Creator commerce option"],
  ["Online Course and Community Platforms", "Lemon Squeezy", "https://www.lemonsqueezy.com/", "support", "marketing", "digital-products;checkout;creator-tools;merchant-of-record;software-commerce", "paid", "Digital product checkout option"],

  ["CI/CD and DevOps Automation", "Jenkins", "https://www.jenkins.io/", "anchor", "development", "ci-cd;devops;automation;open-source;builds", "free", "Validated LOW-competition alternatives term"],
  ["CI/CD and DevOps Automation", "GitHub Actions", "https://github.com/features/actions", "anchor", "development", "ci-cd;devops;automation;github;developer-tools", "freemium", "Validated LOW-competition alternatives term"],
  ["CI/CD and DevOps Automation", "GitLab CI/CD", "https://about.gitlab.com/solutions/continuous-integration/", "anchor", "development", "ci-cd;devops;automation;gitlab;developer-tools", "freemium", "Recognized CI/CD suite"],
  ["CI/CD and DevOps Automation", "CircleCI", "https://circleci.com/", "anchor", "development", "ci-cd;devops;automation;builds;testing", "freemium", "CI/CD benchmark"],
  ["CI/CD and DevOps Automation", "Buildkite", "https://buildkite.com/", "support", "development", "ci-cd;devops;automation;builds;developer-tools", "paid", "CI/CD tool for high-control pipelines"],
  ["CI/CD and DevOps Automation", "Travis CI", "https://www.travis-ci.com/", "support", "development", "ci-cd;devops;automation;testing;builds", "paid", "Established CI/CD platform"],
  ["CI/CD and DevOps Automation", "Azure Pipelines", "https://azure.microsoft.com/products/devops/pipelines", "support", "development", "ci-cd;devops;automation;microsoft;builds", "freemium", "Microsoft CI/CD option"],
  ["CI/CD and DevOps Automation", "Harness", "https://www.harness.io/", "support", "development", "ci-cd;devops;deployment;automation;software-delivery", "paid", "Software delivery platform"],
  ["CI/CD and DevOps Automation", "Argo CD", "https://argo-cd.readthedocs.io/", "support", "development", "gitops;devops;kubernetes;deployment;open-source", "free", "GitOps deployment option"],
  ["CI/CD and DevOps Automation", "Semaphore", "https://semaphoreci.com/", "support", "development", "ci-cd;devops;automation;testing;builds", "paid", "CI/CD platform for build and test pipelines"]
];

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

const headers = ["cluster", "name", "url", "role", "category", "tags", "pricing_model", "why_anchor"];
await mkdir(outDir, { recursive: true });
await writeFile(
  outputPath,
  [headers.join(","), ...rows.map((row) => row.map(csvEscape).join(","))].join("\n"),
);
console.log(JSON.stringify({ outputPath, rows: rows.length }, null, 2));
