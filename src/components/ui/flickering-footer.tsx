import { ChevronRightIcon } from "@radix-ui/react-icons";
import Image from "next/image";
import Link from "next/link";

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
        { id: 3, title: "Analytics", url: "/categories/analytics" },
        { id: 4, title: "Development", url: "/categories/development" },
        { id: 5, title: "Support", url: "/categories/support" },
        { id: 6, title: "View all", url: "/categories" },
      ],
    },
    {
      title: "Alternatives",
      links: [
        { id: 7, title: "ShipFast Alternatives", url: "/alternatives/shipfast" },
        { id: 8, title: "DirStarter Alternatives", url: "/alternatives/dirstarter" },
        { id: 9, title: "Tapfiliate Alternatives", url: "/alternatives/tapfiliate" },
        { id: 10, title: "Frase Alternatives", url: "/alternatives/frase" },
        { id: 11, title: "Vista Social Alternatives", url: "/alternatives/vista-social" },
        { id: 12, title: "Browse all", url: "/alternatives" },
      ],
    },
    {
      title: "Best Tags",
      links: [
        { id: 13, title: "AI-Powered", url: "/best/tag/ai" },
        { id: 14, title: "Open Source", url: "/best/tag/open-source" },
        { id: 15, title: "Bootstrapped", url: "/best/tag/bootstrapped" },
        { id: 16, title: "Next.js Boilerplates", url: "/best/tag/nextjs" },
        { id: 17, title: "Indie Hackers", url: "/best/tag/indie-hackers" },
        { id: 18, title: "View all", url: "/tags" },
      ],
    },
    {
      title: "Company",
      links: [
        { id: 19, title: "About", url: "/about" },
        { id: 20, title: "Pricing", url: "/pricing" },
        { id: 21, title: "Blog", url: "/blog" },
        { id: 22, title: "Submit Product", url: "/submit" },
        { id: 23, title: "How It Works", url: "/how-it-works" },
        { id: 24, title: "Launch Guide", url: "/launch-guide" },
        { id: 25, title: "Startup Directories", url: "/resources/startup-directories" },
        { id: 26, title: "FAQs", url: "/faqs" },
        { id: 27, title: "Contact", url: "/contact" },
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
  width?: number;
  height?: number;
  rel?: string;
  title?: string;
  imageStyle?: React.CSSProperties;
};

const featuredBadges: FeaturedBadge[] = [
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
              <a
                key={`${badge.id}-${index}`}
                href={badge.href}
                target="_blank"
                rel={badge.rel}
                title={badge.title}
                className="flex h-12 min-w-[118px] items-center justify-center rounded-lg border border-border/70 bg-background/95 px-2.5 py-1.5 shadow-[0_10px_40px_-28px_rgba(10,10,10,0.9)] transition-transform duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-background"
              >
                {badge.src ? (
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
              </a>
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
        <div className="pt-5 md:pt-0 md:w-2/3 lg:w-3/4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 lg:pl-10">
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
