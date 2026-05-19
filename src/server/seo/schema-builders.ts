import {
  type BreadcrumbInput,
  type ListItemInput,
  type SoftwareApplicationInput,
} from "@/server/seo/schema-types";
import { shipBoostSiteSchema } from "@/server/seo/site-schema";

export function buildOrganization() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: shipBoostSiteSchema.name,
    url: shipBoostSiteSchema.url,
    logo: shipBoostSiteSchema.logoUrl,
    email: shipBoostSiteSchema.supportEmail,
  };
}

export function buildWebSite() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: shipBoostSiteSchema.name,
    url: shipBoostSiteSchema.url,
  };
}

export function buildItemList(items: ListItemInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      url: item.url,
    })),
  };
}

export function buildBreadcrumbList(items: BreadcrumbInput[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildCollectionPage(input: {
  name: string;
  description: string;
  url: string;
  mainEntity: Record<string, unknown>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: input.name,
    description: input.description,
    url: input.url,
    mainEntity: input.mainEntity,
  };
}

export function buildSoftwareApplication(input: SoftwareApplicationInput) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: input.name,
    description: input.description,
    url: input.url,
    image: input.image,
    applicationCategory: input.applicationCategory,
    operatingSystem: input.operatingSystem ?? "Web",
    ...(input.offers ? { offers: input.offers } : {}),
  };
}

export function buildFaqSchema(input: {
  name: string;
  description: string;
  url: string;
  questions: { question: string; answer: string }[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    name: input.name,
    description: input.description,
    url: input.url,
    mainEntity: input.questions.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function buildHowToSchema(input: {
  name: string;
  description: string;
  steps: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: input.name,
    description: input.description,
    step: input.steps.map((step, index) => ({
      "@type": "HowToStep",
      position: index + 1,
      text: step,
    })),
  };
}
