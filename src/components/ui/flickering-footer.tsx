import { ChevronRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";

import { TrackedExternalLink } from "@/components/analytics/tracked-external-link";
import { FlickeringGridLogo } from "@/components/ui/flickering-grid-logo";
import { cn } from "@/lib/utils";

const siteConfig = {
  hero: {
    description:
      "ShipBoost helps bootstrapped SaaS founders earn trust, visibility, and real distribution — not vanity launches.",
  },
  footerLinks: [
    {
      title: "Categories",
      links: [
        { id: 1, title: "Marketing", url: "/categories/marketing" },
        { id: 2, title: "Sales", url: "/categories/sales" },
        { id: 3, title: "Support", url: "/categories/support" },
        { id: 4, title: "Development", url: "/categories/development" },
        { id: 5, title: "View all", url: "/categories" },
      ],
    },
    {
      title: "Tags",
      links: [
        { id: 7, title: "AI-Powered", url: "/tags/ai" },
        { id: 8, title: "Customer Support", url: "/tags/customer-support" },
        { id: 9, title: "Bootstrapped", url: "/tags/bootstrapped" },
        { id: 10, title: "Next.js Boilerplates", url: "/tags/nextjs" },
        { id: 11, title: "Indie Hackers", url: "/tags/indie-hackers" },
        { id: 12, title: "View all", url: "/tags" },
      ],
    },
    {
      title: "Best Pages",
      links: [
        { id: 14, title: "Best Help Desk Software", url: "/best/help-desk-software" },
        { id: 15, title: "Best Customer Support Software", url: "/best/customer-support-software" },
        { id: 16, title: "Best Support Software for SMB", url: "/best/customer-support-software-for-small-business" },
        { id: 17, title: "Best CRM Software", url: "/best/crm-software" },
        { id: 18, title: "Best CRM for Startups", url: "/best/crm-for-startups" },
        { id: 19, title: "View all", url: "/best" },
      ],
    },
    {
      title: "Alternatives",
      links: [
        { id: 20, title: "HubSpot Alternatives", url: "/alternatives/hubspot" },
        { id: 21, title: "Zendesk Alternatives", url: "/alternatives/zendesk" },
        { id: 22, title: "Intercom Alternatives", url: "/alternatives/intercom" },
        { id: 23, title: "Freshdesk Alternatives", url: "/alternatives/freshdesk" },
        { id: 24, title: "Pipedrive Alternatives", url: "/alternatives/pipedrive" },
        { id: 25, title: "Browse all", url: "/alternatives" },
      ],
    },
    {
      title: "Company",
      links: [
        { id: 26, title: "About", url: "/about" },
        { id: 27, title: "Pricing", url: "/pricing" },
        { id: 28, title: "Blog", url: "/blog" },
        { id: 29, title: "Submit Product", url: "/submit" },
        { id: 30, title: "How It Works", url: "/how-it-works" },
        { id: 31, title: "Launch Guide", url: "/launch-guide" },
        { id: 32, title: "Startup Directories", url: "/resources/startup-directories" },
        { id: 33, title: "FAQs", url: "/faqs" },
        { id: 34, title: "Contact", url: "/contact" },
      ],
    },
  ],
};

type FeaturedBadge = {
  id: string;
  href: string;
  alt: string;
  src?: string;
  label?: string;
  content?: React.ReactNode;
  width?: number;
  height?: number;
  rel?: string;
  title?: string;
  imageStyle?: React.CSSProperties;
};

const featuredBadges: FeaturedBadge[] = [
  {
    id: "saaspa",
    href: "https://saaspa.ge/product/cmo13x4mv000el104b3hzaxrt",
    src: "https://saaspa.ge/api/embed/product/cmo13x4mv000el104b3hzaxrt/badge.png?theme=orange",
    alt: "Featured on Saaspa.ge",
    width: 200,
    height: 60,
    rel: "nofollow",
  },
  {
    id: "web-review",
    href: "https://web-review.com",
    src: "https://web-review.com/badge.png",
    alt: "Featured on Web Review",
    width: 200,
    height: 54,
    rel: "dofollow",
  },
  {
    id: "saas-bison",
    href: "http://saasbison.com",
    src: "http://saasbison.com/badge.png",
    alt: "Featured on SaaSBison",
    width: 200,
    height: 54,
    rel: "dofollow",
  },
  {
    id: "makerhunt",
    href: "https://makerhunt.io/project/shipboost",
    src: "https://makerhunt.io/badges/makerhunt-badge-light.svg",
    alt: "Featured on MakerHunt",
    width: 200,
    height: 60,
    rel: "noopener",
  },
  {
    id: "next-launch",
    href: "https://nextlaunch.io/projects/shipboost",
    src: "https://nextlaunch.io/images/badges/nextlaunch-badge-light.svg",
    alt: "Featured on Next Launch",
    title: "Featured on Next Launch",
    imageStyle: { width: 175, height: "auto" },
  },
  {
    id: "sumodir",
    href: "https://sumodir.com",
    src: "https://sumodir.com/badge.png",
    alt: "Featured on SumoDir",
    width: 200,
    height: 54,
    rel: "dofollow",
  },
  {
    id: "dododirectory",
    href: "https://dododirectory.com",
    src: "https://dododirectory.com/badge-light.png",
    alt: "Featured on DodoDirectory",
    width: 200,
    height: 54,
    rel: "dofollow",
  },
  {
    id: "saasgrow",
    href: "https://saasgrow.app?ref=shipboost.io",
    src: "https://saasgrow.app/api/badge?type=featured&style=light",
    alt: "ShipBoost on SaaSGrow",
    width: 240,
    height: 54,
    rel: "noopener",
  },
  {
    id: "listmysaas",
    href: "https://listmysaas.xyz/",
    src: "https://listmysaas.xyz/listmysaasbadgenormal.svg",
    alt: "Featured on ListMySaaS",
    width: 125,
    height: 44,
    rel: "dofollow noopener",
  },
  {
    id: "auraplusplus",
    href: "https://auraplusplus.com/projects/shipboost",
    src: "https://auraplusplus.com/images/badges/featured-on-light.svg",
    alt: "Featured on Aura++",
    width: 265,
    height: 58,
    rel: "noopener",
  },
  {
    id: "startup-fame",
    href: "https://startupfa.me/s/shipboost?utm_source=shipboost.io",
    src: "https://startupfa.me/badges/featured-badge.webp",
    alt: "ShipBoost - Featured on Startup Fame",
    width: 171,
    height: 54,
  },
  {
    id: "twelve-tools",
    href: "https://twelve.tools",
    src: "https://twelve.tools/badge0-white.svg",
    alt: "Featured on Twelve Tools",
    width: 200,
    height: 54,
  },
  {
    id: "dang-ai",
    href: "https://dang.ai/",
    src: "https://cdn.prod.website-files.com/63d8afd87da01fb58ea3fbcb/6487e2868c6c8f93b4828827_dang-badge.png",
    alt: "Dang.ai",
    width: 150,
    height: 54,
    imageStyle: { width: 150, height: 54 },
  },
  {
    id: "findly-tools",
    href: "https://findly.tools/shipboost?utm_source=shipboost",
    src: "https://findly.tools/badges/findly-tools-badge-light.svg",
    alt: "Featured on Findly.tools",
    width: 175,
    height: 55,
    rel: "noopener noreferrer",
  },
  {
    id: "turbo0",
    href: "https://turbo0.com/item/shipboost",
    src: "https://img.turbo0.com/badge-listed-light.svg",
    alt: "Listed on Turbo0",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "fazier",
    href: "https://fazier.com/launches/shipboost.io",
    src: "https://fazier.com/api/v1//public/badges/launch_badges.svg?badge_type=launched&theme=light",
    alt: "Fazier badge",
    width: 120,
  },
  {
    id: "launchigniter",
    href: "https://launchigniter.com/product/shipboost?ref=badge-shipboost",
    src: "https://launchigniter.com/api/badge/shipboost?theme=neutral",
    alt: "Featured on LaunchIgniter",
    width: 212,
    height: 55,
  },
  {
    id: "wired-business",
    href: "https://wired.business",
    src: "https://wired.business/badge0-white.svg",
    alt: "Featured on Wired Business",
    width: 200,
    height: 54,
  },
  {
    id: "submit-ai-tools",
    href: "https://submitaitools.org",
    src: "https://submitaitools.org/static_submitaitools/images/submitaitools.png",
    alt: "Submit AI Tools",
    imageStyle: { borderRadius: 10, width: 200, height: 60 },
  },
  {
    id: "good-ai-tools",
    href: "https://goodaitools.com/ai/shipboost",
    src: "https://goodaitools.com/assets/images/badge.png",
    alt: "Badge",
    height: 54,
  },
  {
    id: "neeed-directory",
    href: "https://neeed.directory/products/shipboost?utm_source=shipboost",
    src: "https://neeed.directory/badges/neeed-badge-light.svg",
    alt: "Featured on neeed.directory",
    width: 139,
    rel: "noopener",
  },
  {
    id: "dofollow-tools",
    href: "https://dofollow.tools",
    src: "https://dofollow.tools/badge/badge_transparent.svg",
    alt: "Featured on Dofollow.Tools",
    width: 200,
    height: 54,
  },
  {
    id: "startup-fast",
    href: "https://startupfa.st",
    src: "https://startupfa.st/images/badges/powered-by-light.svg",
    alt: "Powered by Startup Fast",
    width: 150,
    height: 44,
    title: "Powered by Startup Fast",
  },
  {
    id: "similarlabs",
    href: "https://similarlabs.com",
    src: "https://similarlabs.com/similarlabs-embed-badge-light.svg",
    alt: "Featured on SimilarLabs",
    width: 124,
    height: 40,
  },
  {
    id: "toolfame",
    href: "https://toolfame.com/item/shipboost",
    src: "https://toolfame.com/badge-light.svg",
    alt: "Featured on toolfame.com",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "yo-directory",
    href: "https://yo.directory/",
    src: "https://cdn.prod.website-files.com/65c1546fa73ea974db789e3d/65e1e171f89ebfa7bd0129ac_yodirectory-featured.png",
    alt: "yo.directory",
    width: 150,
    height: 54,
    imageStyle: { width: 150, height: 54 },
  },
  {
    id: "acid-tools",
    href: "https://acidtools.com",
    src: "https://acidtools.com/assets/images/badge.png",
    alt: "Acid Tools",
    height: 54,
  },
  {
    id: "foundrlist",
    href: "https://www.foundrlist.com/product/shipboost?utm_source=badge&utm_medium=embed",
    src: "https://www.foundrlist.com/api/badge/shipboost",
    alt: "Featured on FoundrList",
    width: 150,
    height: 48,
    rel: "noopener",
  },
  {
    id: "newtool-site",
    href: "https://newtool.site/item/shipboost",
    src: "https://newtool.site/badges/newtool-light.svg",
    alt: "Featured on NewTool.site",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "super-launch",
    href: "https://www.superlaun.ch/products/2204",
    src: "https://www.superlaun.ch/badge.png",
    alt: "Featured on Super Launch",
    width: 300,
    height: 300,
    rel: "noopener",
  },
  {
    id: "bestsky-tools",
    href: "https://bestsky.tools?utm_source=badge",
    src: "https://assets.bestsky.tools/badges/featured-light.svg",
    alt: "Featured on BestskyTools",
    width: 150,
  },
  {
    id: "ai-tool-trek",
    href: "https://aitooltrek.com",
    alt: "AI Tool Trek",
    title: "AI Tool Trek",
    label: "AI Tool Trek",
  },
  {
    id: "starter-best",
    href: "https://starterbest.com",
    src: "https://starterbest.com/badages-awards.svg",
    alt: "Featured on Starter Best",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "aitop10-tools",
    href: "https://aitop10.tools/",
    alt: "AiTop10 Tools",
    label: "AiTop10 Tools",
  },
  {
    id: "days-launch",
    href: "https://dayslaunch.com",
    src: "https://dayslaunch.com/badages-awards.svg",
    alt: "Featured on Days Launch",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "topfreeaitools",
    href: "https://topfreeaitools.com/ai/shipboost",
    src: "https://ff65dcf08ebd5eb1c022b44dd88016ac.cdn.bubble.io/f1724746111294x515859147102912600/badge%20black.png?_gl=1*1w65k5q*_gcl_au*MTg3MzI0ODMyLjE3MjE2MjAzNjA.*_ga*NTIyODE4MzEyLjE3MDU5OTg0MTc.*_ga_BFPVR2DEE2*MTcyNDc0NTM2OS4yMjkuMS4xNzI0NzQ2ODQ2LjYuMC4w",
    alt: "Top Free AI Tools",
    width: 230,
    height: 54,
    imageStyle: { width: 230, height: 54 },
  },
  {
    id: "marketingdb",
    href: "https://marketingdb.live",
    src: "https://marketingdb.live/badge.svg",
    alt: "Listed on MarketingDB",
    width: 190,
    height: 44,
  },
  {
    id: "uno-directory",
    href: "https://uno.directory",
    src: "https://uno.directory/uno-directory.svg",
    alt: "Listed on Uno Directory",
    width: 120,
    height: 30,
    rel: "noopener",
  },
  {
    id: "openhunts",
    href: "https://openhunts.com",
    src: "https://cdn.openhunts.com/badges/club.webp",
    alt: "OpenHunts Club Member",
    width: 486,
    height: 105,
    title: "OpenHunts Club",
    imageStyle: { width: 195, height: "auto" },
  },
  {
    id: "startup-benchmarks",
    href: "https://startupbenchmarks.com",
    src: "https://startupbenchmarks.com/assets/images/badge.png",
    alt: "Startup Benchmarks",
    height: 54,
  },
  {
    id: "unite-list",
    href: "https://unitelist.com",
    src: "https://unitelist.com/assets/images/badge.png",
    alt: "Unite List",
    height: 54,
  },
  {
    id: "toolfio",
    href: "https://toolfio.com",
    src: "https://toolfio.com/toolfio-light-badge.png",
    alt: "Featured on Toolfio",
    width: 200,
    height: 54,
    rel: "dofollow",
  },
  {
    id: "aitechviral",
    href: "https://aitechviral.com",
    src: "https://aitechviral.com/assets/images/badge.png",
    alt: "AI Tech Viral",
    height: 54,
  },
  {
    id: "indiehunt",
    href: "https://indiehunt.io/project/shipboost",
    src: "https://indiehunt.io/badges/indiehunt-badge-light.svg",
    alt: "Featured on IndieHunt",
    width: 265,
    height: 58,
    rel: "noopener",
  },
  {
    id: "mylaunchstash",
    href: "https://mylaunchstash.com",
    src: "https://mylaunchstash.com/assets/images/badge.png",
    alt: "My Launch Stash",
    height: 54,
  },
  {
    id: "aihuntlist",
    href: "https://aihuntlist.com/tool/shipboost",
    src: "https://aihuntlist.com/badge-light.svg",
    alt: "Featured on aihuntlist.com",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "poweruptools",
    href: "https://poweruptools.com",
    src: "https://poweruptools.com/assets/images/badge.png",
    alt: "Power Up Tools",
    height: 54,
  },
  {
    id: "trustiner",
    href: "https://trustiner.com",
    src: "https://trustiner.com/assets/images/badge.png",
    alt: "Trustiner",
    height: 54,
  },
  {
    id: "besttoolvault",
    href: "https://besttoolvault.com",
    src: "https://besttoolvault.com/assets/images/badge.png",
    alt: "Best Tool Vault",
    height: 54,
  },
  {
    id: "toolsunderradar",
    href: "https://toolsunderradar.com",
    src: "https://toolsunderradar.com/assets/images/badge.png",
    alt: "Tools Under Radar",
    height: 54,
  },
  {
    id: "milliondothomepage",
    href: "https://milliondothomepage.com/product/shipboost",
    src: "https://milliondothomepage.com/assets/images/badge.png",
    alt: "Badge",
    height: 54,
  },
  {
    id: "launchclash",
    href: "https://launchclash.com/product/shipboost",
    src: "https://launchclash.com/static/images/badge.png",
    alt: "Featured on Submit Your Product - LaunchClash",
    imageStyle: { height: 54 },
  },
  {
    id: "shinylaunch",
    href: "https://shinylaunch.com/product/shipboost",
    src: "https://shinylaunch.com/static/images/badge.png",
    alt: "Submit Your",
    height: 54,
  },
  {
    id: "aixcollection",
    href: "https://aixcollection.com",
    src: "https://aixcollection.com/assets/images/badge.png",
    alt: "AI X Collection",
    height: 54,
  },
  {
    id: "latestaiupdates",
    href: "https://latestaiupdates.com",
    src: "https://latestaiupdates.com/assets/images/badge.png",
    alt: "Latest AI Updates",
    height: 54,
  },
  {
    id: "productwing",
    href: "https://productwing.com",
    src: "https://productwing.com/assets/images/badge.png",
    alt: "Product Wing",
    height: 54,
  },
  {
    id: "saasroots",
    href: "https://saasroots.com",
    src: "https://saasroots.com/assets/images/badge.png",
    alt: "SaaS Roots",
    height: 54,
  },
  {
    id: "startupaideas",
    href: "https://startupaideas.com",
    src: "https://startupaideas.com/assets/images/badge.png",
    alt: "Startup AIdeas",
    height: 54,
  },
  {
    id: "theapptools",
    href: "https://theapptools.com",
    src: "https://theapptools.com/assets/images/badge.png",
    alt: "The App Tools",
    height: 54,
  },
  {
    id: "themegatools",
    href: "https://themegatools.com",
    src: "https://themegatools.com/assets/images/badge.png",
    alt: "The Mega Tools",
    height: 54,
  },
  {
    id: "toolslisthq",
    href: "https://toolslisthq.com",
    src: "https://toolslisthq.com/assets/images/badge.png",
    alt: "Tools List HQ",
    height: 54,
  },
  {
    id: "showmysites",
    href: "https://www.showmysites.com",
    alt: "ShowMySites",
    label: "ShowMySites",
    rel: "noopener noreferrer",
  },
  {
    id: "showmebest-ai",
    href: "https://showmebest.ai",
    src: "https://showmebest.ai/badge/feature-badge-white.webp",
    alt: "Featured on ShowMeBestAI",
    width: 220,
    height: 60,
  },
  {
    id: "shipstry",
    href: "https://shipstry.com",
    src: "https://shipstry.com/badges/featured.svg",
    alt: "Featured on Shipstry",
    width: 220,
    height: 52,
    rel: "noopener noreferrer",
  },
  {
    id: "spotstartups",
    href: "https://spotstartups.com",
    src: "https://spotstartups.com/badges/spotstartups.com_badge_light.svg",
    alt: "Featured on SpotStartups",
    width: 175,
    height: 55,
  },
  {
    id: "directoryhunt",
    href: "https://directoryhunt.org/",
    src: "https://directoryhunt.org/assets/Badges/featured.svg",
    alt: "Featured on DirectoryHunt.org",
    width: 225,
    height: 61,
    rel: "noopener noreferrer",
  },
  {
    id: "saasscout",
    href: "https://saasscout.org",
    src: "https://saasscout.org/badge.svg",
    alt: "Featured on SaaS Scout",
    width: 200,
    height: 60,
    rel: "noopener",
  },
  {
    id: "earlylaunch",
    href: "https://earlylaunch.online",
    alt: "EarlyLaunch",
    label: "EarlyLaunch",
  },
  {
    id: "saasfame",
    href: "https://saasfame.com/item/shipboost",
    src: "https://saasfame.com/badge-light.svg",
    alt: "Featured on saasfame.com",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "submitmysaas",
    href: "https://submitmysaas.com",
    src: "https://submitmysaas.com/featured-badge.png",
    alt: "Featured on SubmitMySaas",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "collectai",
    href: "https://collectai.tools/item/shipboost",
    src: "https://img.collectai.tools/badge-light.svg",
    alt: "Listed on CollectAI",
    rel: "dofollow",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "saascubes",
    href: "https://saascubes.com",
    src: "https://saascubes.com/images/badges/badge-gold.png",
    alt: "Listed on SaaS Cubes",
    width: 175,
    height: 54,
    rel: "noopener",
    title: "Listed on SaaS Cubes",
  },
  {
    id: "aitrovex",
    href: "https://aitrovex.com/item/shipboost",
    src: "https://aitrovex.com/badge-listed-light.svg",
    alt: "Listed on AITroveX",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "shipgrowth",
    href: "https://shipgrowth.dev/item/shipboost",
    src: "https://storage.shipgrowth.dev/badge-light.png",
    alt: "Featured on ShipGrowth",
    rel: "noopener noreferrer",
    imageStyle: { height: 64, width: "auto" },
  },
  {
    id: "indieshowcase",
    href: "https://indieshowcase.io",
    src: "https://indieshowcase.io/badge/featured-light.svg",
    alt: "Featured on IndieShowcase",
  },
  {
    id: "kickproduct",
    href: "https://kickproduct.com/products/69ddc553a67151165ad3856b",
    src: "https://www.kickproduct.com/listedbadge.png",
    alt: "Listed on Kick Product",
    width: 250,
    rel: "noopener noreferrer",
  },
  {
    id: "launchvoid",
    href: "https://launchvoid.com",
    alt: "Featured on LaunchVoid",
    label: "LaunchVoid",
    rel: "noopener",
    title: "Featured on LaunchVoid",
  },
  {
    id: "ufind-best",
    href: "https://ufind.best/products/shipboost?utm_source=ufind.best",
    src: "https://ufind.best/badges/ufind-best-badge-light.svg",
    alt: "Featured on ufind.best",
    width: 150,
    rel: "noopener",
  },
  {
    id: "launch-list",
    href: "https://launch-list.org/product/shipboost",
    src: "https://launch-list.org/badges/svg/launch_list_badge_live.svg",
    alt: "Launch List Badge",
    imageStyle: { height: 50, width: "auto" },
  },
  {
    id: "deeplaunch",
    href: "https://deeplaunch.io",
    src: "https://deeplaunch.io/badge/badge_dark.svg",
    alt: "Featured on DeepLaunch.io",
    width: 200,
    height: 54,
  },
  {
    id: "saascity",
    href: "https://saascity.io/live/shipboost",
    src: "https://saascity.io/badges/featured-dark.svg",
    alt: "Featured on SaaSCity",
    width: 150,
    height: 54,
    rel: "noopener",
  },
  {
    id: "saasdb",
    href: "https://saasdb.net",
    src: "https://saasdb.net/badge/featured-light.svg",
    alt: "Featured on SaasDB",
    width: 300,
    rel: "dofollow",
  },
  {
    id: "softwarebolt",
    href: "https://softwarebolt.com",
    src: "https://softwarebolt.com/assets/images/badge.png",
    alt: "Software Bolt",
    height: 54,
  },
  {
    id: "solvertools",
    href: "https://solvertools.com",
    src: "https://solvertools.com/assets/images/badge.png",
    alt: "Solver Tools",
    height: 54,
  },
  {
    id: "startupvessel",
    href: "https://startupvessel.com",
    src: "https://startupvessel.com/assets/images/badge.png",
    alt: "Startup Vessel",
    height: 54,
  },
  {
    id: "aigc160",
    href: "https://aigc160.com",
    src: "https://aigc160.com/assets/images/badge.png",
    alt: "AIGC 160",
    height: 54,
  },
  {
    id: "drchecker",
    href: "https://drchecker.net/item/shipboost.io",
    src: "https://drchecker.net/api/badge?domain=shipboost.io",
    alt: "Monitor your Domain Rating with DRChecker",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "appalist",
    href: "https://appalist.com",
    src: "https://appalist.com/assets/images/badge.png",
    alt: "Appa List",
    height: 54,
  },
  {
    id: "ideakiln",
    href: "https://ideakiln.com/ideas/shipboost",
    src: "https://ideakiln.com/light.svg",
    alt: "Featured on Idea Kiln",
    width: 200,
    height: 54,
    rel: "noopener",
  },
  {
    id: "saaswheel",
    href: "https://saaswheel.com",
    src: "https://saaswheel.com/assets/images/badge.png",
    alt: "SaaS Wheel",
    height: 54,
  },
  {
    id: "toolfinddir",
    href: "https://toolfinddir.com",
    src: "https://toolfinddir.com/assets/images/badge.png",
    alt: "Tool Find Dir",
    height: 54,
  },
  {
    id: "aitoolzs",
    href: "https://aitoolzs.com",
    src: "https://aitoolzs.com/assets/images/badge.png",
    alt: "AI Toolz",
    height: 54,
  },
  {
    id: "appsytools",
    href: "https://appsytools.com",
    src: "https://appsytools.com/assets/images/badge.png",
    alt: "Appsy Tools",
    height: 54,
  },
  {
    id: "huntfortools",
    href: "https://huntfortools.com",
    src: "https://huntfortools.com/assets/images/badge.png",
    alt: "Hunt for Tools",
    height: 54,
  },
  {
    id: "saasfield",
    href: "https://saasfield.com",
    src: "https://saasfield.com/assets/images/badge.png",
    alt: "SaaS Field",
    height: 54,
  },
  {
    id: "startupdirectory",
    href: "https://startupdirectory.net",
    src: "https://startupdirectory.net/badge/featured-light.svg",
    alt: "Featured",
  },
  {
    id: "toshilist",
    href: "https://toshilist.com",
    src: "https://toshilist.com/assets/images/badge.png",
    alt: "Toshi List",
    height: 54,
  },
  {
    id: "weliketools",
    href: "https://weliketools.com",
    src: "https://weliketools.com/assets/images/badge.png",
    alt: "We Like Tools",
    height: 54,
  },
  {
    id: "ashlist",
    href: "https://ashlist.com",
    src: "https://ashlist.com/assets/images/badge.png",
    alt: "Ash List",
    height: 54,
  },
  {
    id: "launchscroll",
    href: "https://launchscroll.com",
    src: "https://launchscroll.com/assets/images/badge.png",
    alt: "Launch Scroll",
    height: 54,
  },
  {
    id: "productlistdir",
    href: "https://productlistdir.com",
    src: "https://productlistdir.com/assets/images/badge.png",
    alt: "Product List Dir",
    height: 54,
  },
  {
    id: "thatappshow",
    href: "https://thatappshow.com",
    src: "https://thatappshow.com/assets/images/badge.png",
    alt: "That App Show",
    height: 54,
  },
  {
    id: "beamtools",
    href: "https://beamtools.com",
    src: "https://beamtools.com/assets/images/badge.png",
    alt: "Beam Tools",
    height: 54,
  },
  {
    id: "betterlaunch",
    href: "https://www.betterlaunch.co",
    src: "https://www.betterlaunch.co/badge.svg",
    alt: "Featured on Better Launch",
    imageStyle: { width: 200, height: "auto" },
  },
  {
    id: "mystarttools",
    href: "https://mystarttools.com",
    src: "https://mystarttools.com/assets/images/badge.png",
    alt: "My Start Tools",
    height: 54,
  },
  {
    id: "saashubdirectory",
    href: "https://saashubdirectory.com",
    src: "https://saashubdirectory.com/assets/images/badge.png",
    alt: "SaaS Hub Directory",
    height: 54,
  },
  {
    id: "sourcedir",
    href: "https://sourcedir.com",
    src: "https://sourcedir.com/assets/images/badge.png",
    alt: "Source Dir",
    height: 54,
  },
  {
    id: "stackdirectory",
    href: "https://stackdirectory.com",
    src: "https://stackdirectory.com/assets/images/badge.png",
    alt: "Stack Directory",
    height: 54,
  },
  {
    id: "toptrendtools",
    href: "https://toptrendtools.com",
    src: "https://toptrendtools.com/assets/images/badge.png",
    alt: "Top Trend Tools",
    height: 54,
  },
  {
    id: "smartkithub",
    href: "https://smartkithub.com",
    src: "https://smartkithub.com/assets/images/badge.png",
    alt: "Smart Kit Hub",
    height: 54,
  },
  {
    id: "saastoolsdir",
    href: "https://saastoolsdir.com",
    src: "https://saastoolsdir.com/assets/images/badge.png",
    alt: "SaaS Tools Dir",
    height: 54,
  },
  {
    id: "thekeytools",
    href: "https://thekeytools.com",
    src: "https://thekeytools.com/assets/images/badge.png",
    alt: "The Key Tools",
    height: 54,
  },
  {
    id: "toolsignal",
    href: "https://toolsignal.com",
    src: "https://toolsignal.com/assets/images/badge.png",
    alt: "Tool Signal",
    height: 54,
  },
  {
    id: "thecoretools",
    href: "https://thecoretools.com",
    src: "https://thecoretools.com/assets/images/badge.png",
    alt: "The Core Tools",
    height: 54,
  },
  {
    id: "superaiboom",
    href: "https://superaiboom.com",
    src: "https://superaiboom.com/assets/images/badge.png",
    alt: "Super AI Boom",
    height: 54,
  },
  {
    id: "tinytoolhub",
    href: "https://tinytoolhub.com",
    src: "https://tinytoolhub.com/assets/images/badge.png",
    alt: "Tiny Tool Hub",
    height: 54,
  },
  {
    id: "tooljourney",
    href: "https://tooljourney.com",
    src: "https://tooljourney.com/assets/images/badge.png",
    alt: "Tool Journey",
    height: 54,
  },
  {
    id: "toolprism",
    href: "https://toolprism.com",
    src: "https://toolprism.com/assets/images/badge.png",
    alt: "Tool Prism",
    height: 54,
  },
  {
    id: "toolcosmos",
    href: "https://toolcosmos.com",
    src: "https://toolcosmos.com/assets/images/badge.png",
    alt: "Tool Cosmos",
    height: 54,
  },
  {
    id: "bowora",
    href: "https://bowora.com/?via=bsymoghx",
    alt: "Featured on Bowora",
    content: (
      <div className="flex items-center gap-2">
        <svg
          width="24"
          height="24"
          viewBox="0 0 150 150"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0"
        >
          <g transform="translate(31.1875, 18.1874)" fill="currentColor">
            <path d="M87.5343464,15.4046144 C88.0800499,16.2992254 87.7980596,17.4698555 86.9050901,18.0165331 C86.0121207,18.5633415 84.8423829,18.2806539 84.2966794,17.3859122 C81.7117678,13.1474282 78.0968081,9.80172458 73.4648555,7.33755659 L73.4485366,7.32879615 C68.8772902,4.83909213 63.5398394,3.61244746 57.444409,3.61244746 L9.3017365,3.61244746 C7.67506992,3.61244746 6.3960609,3.83953898 5.49238625,4.41819874 L5.45674581,4.4405444 C4.79524344,4.84409996 4.32995935,5.45833757 4.0239476,6.27503287 C3.73947677,7.26368123 3.60644521,8.42777375 3.60644521,9.76432926 L3.60644521,103.544841 C3.60644521,104.950303 3.75631787,106.263062 4.0658545,107.495669 C4.27578065,108.239391 4.6709588,108.810258 5.28428782,109.184211 L5.31979771,109.20657 C6.22347236,109.785151 7.50248138,110.012269 9.12927851,110.012269 L59.1699028,110.012269 C63.7602097,110.012269 68.0783175,109.267239 72.1226597,107.769727 C76.1497692,106.173758 79.6895314,103.98404 82.7378993,101.19469 C83.5107618,100.487317 84.7118318,100.541579 85.4181132,101.315897 C86.1243946,102.090216 86.0708687,103.293142 85.2967007,104.000384 C81.9088999,107.100795 77.9767011,109.539466 73.4985376,111.311429 L73.4602862,111.326073 C68.9979194,112.981273 64.2351545,113.8126 59.1699028,113.8126 L9.12927851,113.8126 C6.62504751,113.8126 4.6896276,113.307371 3.2936448,112.419559 C1.8549718,111.536324 0.878319095,110.227096 0.397499432,108.466901 L0.387969203,108.430944 C0.00649891912,106.918395 -0.1875,105.289999 -0.1875,103.544841 L-0.1875,9.76432926 C-0.1875,7.97589194 0.0187707215,6.42738608 0.409379582,5.11588281 L0.444889478,5.00826015 C1.06187393,3.31376875 2.08082518,2.0552073 3.46675555,1.20522233 C4.8626078,0.317842042 6.79815825,-0.1874 9.3017365,-0.1874 L57.444409,-0.1874 C64.2296714,-0.1874 70.1626962,1.21570871 75.252361,3.98591679 C80.5093922,6.78394907 84.5995579,10.5933023 87.5343464,15.4046144 Z"></path>
            <path
              d="M18.1870648,100.8126 C16.6872227,100.8126 15.520287,100.518396 14.687172,99.9299894 C13.9369898,99.4256779 13.4369118,98.6692106 13.1873299,97.6604566 C12.9372256,96.567738 12.8125,95.3909238 12.8125,94.130538 L12.8125,19.2423752 C12.8125,17.9815965 12.9372256,16.8888779 13.1873299,15.9647434 C13.5207588,14.9559894 14.0622378,14.1995221 14.8124201,13.6952106 C15.6459269,13.1068035 16.8124708,12.8126 18.3128353,12.8126 L53.1886048,12.8126 C57.8554332,12.8126 61.9387285,13.8632708 65.4386213,15.9647434 C69.0219693,18.066085 71.8139951,20.9235009 73.8135234,24.537515 C75.8135741,28.1519222 76.7720677,32.1020566 76.688482,36.3885735 C76.7720677,38.5740106 76.5218328,40.7170071 75.9382997,42.8183487 C75.3548972,44.9198213 74.4798587,46.8946265 73.3134454,48.7439434 C72.2298343,50.5090336 70.8552402,51.9800514 69.188096,53.1563416 C71.438251,54.5853115 73.3548465,56.4346284 74.9381438,58.7036372 C76.5213104,60.9731699 77.729386,63.4943345 78.5626316,66.2681788 C79.3971832,69.0416301 79.8125,71.9416177 79.8125,74.9670938 C79.7302203,78.5811079 79.0628402,81.9848831 77.8129717,85.1790743 C76.5631033,88.2891699 74.771364,91.0204424 72.4380151,93.3735468 C70.1045356,95.7271752 67.3963567,97.576361 64.3126949,98.9208424 C61.2291637,100.181752 57.9374518,100.8126 54.437559,100.8126 L18.186673,100.8126 L18.1870648,100.8126 Z"
              fillRule="nonzero"
            ></path>
          </g>
        </svg>
        <div className="flex flex-col leading-tight">
          <span className="text-[8px] font-medium opacity-70">Featured on</span>
          <span className="text-xs font-bold">Bowora</span>
        </div>
      </div>
    ),
  },
  {
    id: "buildvoyage",
    href: "https://buildvoyage.com/products/shipboost?ref=badge",
    src: "https://buildvoyage.com/images/featured_badge.png",
    alt: "Featured on BuildVoyage",
    width: 200,
  },
  {
    id: "showmeyoursite",
    href: "https://showmeyour.site/site/08eea775-1f1f-41fa-aa68-0dac2a3e7248",
    src: "https://showmeyour.site/badge.svg",
    alt: "Listed on ShowMeYourSite",
    rel: "dofollow",
    width: 200,
    height: 56,
  },
  {
    id: "indieai",
    href: "https://indieai.directory/",
    label: "IndieAI Directory",
    alt: "Listed on IndieAI Directory",
  },
  {
    id: "tooldisk",
    href: "https://tooldisk.com",
    src: "https://tooldisk.com/badge/badge_dark.svg",
    alt: "Featured on ToolDisk.com",
    width: 200,
    height: 54,
  },
  {
    id: "product-hot",
    href: "https://producthot.com",
    src: "https://producthot.com/badages-awards.svg",
    alt: "Featured on Product Hot",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "startup-to-startup",
    href: "https://startuptostartup.com",
    src: "https://startuptostartup.com/badages-awards.svg",
    alt: "Featured on Startup To Startup",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "same-product",
    href: "https://sameproduct.com",
    src: "https://sameproduct.com/badages-awards.svg",
    alt: "Featured on Same Product",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
  {
    id: "the-one-startup",
    href: "https://theonestartup.com",
    src: "https://theonestartup.com/badages-awards.svg",
    alt: "Featured on The One Startup",
    rel: "noopener noreferrer",
    imageStyle: { height: 54, width: "auto" },
  },
];

function FeaturedBadgeRail() {
  const marqueeBadges = [...featuredBadges, ...featuredBadges];

  return (
    <div className="border-t border-border/80 bg-muted/20 py-5">
      <div className="mx-auto flex max-w-7xl flex-col gap-2.5 px-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground/60">
            Featured on
          </p>
          <p className="hidden text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground md:block">
            Trusted by startup directories and launch communities
          </p>
        </div>
        <div
          className="marquee-group overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
          aria-label="Featured badges"
        >
          <div className="marquee-track flex w-max items-center gap-4">
            {marqueeBadges.map((badge, index) => (
              <TrackedExternalLink
                key={`${badge.id}-${index}`}
                href={badge.href}
                target="_blank"
                rel={badge.rel}
                title={badge.title}
                sourceSurface="footer"
                linkContext="footer"
                linkText={badge.title ?? badge.label ?? badge.alt}
                className="flex h-12 min-w-[118px] items-center justify-center rounded-lg border border-border/70 bg-background/95 px-2.5 py-1.5 shadow-[0_10px_40px_-28px_rgba(10,10,10,0.9)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-background"
              >
                {badge.content ? (
                  badge.content
                ) : badge.src ? (
                  <>
                    {/* Use plain img tags so badge crawlers can verify the original asset URLs directly. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={badge.src}
                      alt={badge.alt}
                      width={badge.width}
                      height={badge.height}
                      style={badge.imageStyle}
                      className="max-h-[30px] w-auto shrink-0 object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                  </>
                ) : (
                  <span className="text-[10px] font-black tracking-[0.1em] text-foreground/80">
                    {badge.label}
                  </span>
                )}
              </TrackedExternalLink>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FooterLogo() {
  return (
    <div className="flex items-center gap-4 group h-14">
      <div className="relative h-14 w-14 shrink-0">
        <Image
          src="/logos/logo-black.png"
          alt=""
          fill
          sizes="56px"
          className="object-contain block dark:hidden transition-transform group-hover:scale-110"
        />
        <Image
          src="/logos/logo-white.png"
          alt=""
          fill
          sizes="56px"
          className="object-contain hidden dark:block transition-transform group-hover:scale-110"
        />
      </div>
      <span className="text-3xl font-black tracking-tighter text-foreground font-heading leading-none">
        ShipBoost
      </span>
    </div>
  );
}

type FlickeringFooterProps = {
  className?: string;
} & Omit<React.ComponentProps<"footer">, "children">;

export function FlickeringFooter({ className, ...props }: FlickeringFooterProps) {
  return (
    <footer
      id="footer"
      className={cn("w-full pb-0 border-t border-border bg-background", className)}
      {...props}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between p-10 max-w-7xl mx-auto">
        <div className="flex flex-col items-start justify-start gap-y-5 max-w-xs mx-0">
          <Link href="/">
            <FooterLogo />
          </Link>
          <p className="text-sm tracking-tight text-muted-foreground font-medium leading-relaxed">
            {siteConfig.hero.description}
          </p>
        </div>
        <div className="pt-5 md:pt-0 md:flex-1">
          <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-5 lg:pl-10">
            {siteConfig.footerLinks.map((column) => (
              <ul key={column.title} className="flex flex-col gap-y-2">
                <li className="mb-2 text-[10px] font-black tracking-widest text-foreground/70">
                  {column.title}
                </li>
                {column.links.map((link) => (
                  <li
                    key={link.id}
                    className="group inline-flex cursor-pointer items-center justify-start gap-1 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Link href={link.url}>{link.title}</Link>
                    <div className="flex size-3 items-center justify-center border border-border rounded translate-x-0 transform opacity-0 transition-all duration-300 ease-out group-hover:translate-x-1 group-hover:opacity-100">
                      <ChevronRightIcon className="h-3 w-3 " />
                    </div>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </div>
      </div>
      <div className="w-full h-48 md:h-64 relative mt-12 z-0">
        <div className="absolute inset-0 bg-gradient-to-t from-transparent to-background z-10 from-40%" />
        <div className="absolute inset-0 mx-6">
          <FlickeringGridLogo />
        </div>
      </div>
      <FeaturedBadgeRail />
      <div className="flex flex-col items-center justify-center gap-3 border-t border-border bg-muted/30 p-6 relative z-20 sm:flex-row sm:gap-4">
        <p className="text-muted-foreground text-[10px] font-bold tracking-widest">
          © {new Date().getFullYear()} ShipBoost. All rights reserved.
        </p>
        <div className="flex items-center gap-4 text-[10px] font-bold tracking-widest text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy
          </Link>
          <Link href="/affiliate" className="hover:text-foreground transition-colors">
            Affiliate
          </Link>
        </div>
      </div>
    </footer>
  );
}
