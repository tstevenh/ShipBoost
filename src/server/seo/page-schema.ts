import {
  buildBreadcrumbList,
  buildCollectionPage,
  buildItemList,
  buildOrganization,
  buildSoftwareApplication,
  buildWebSite,
} from "@/server/seo/schema-builders";

export function buildHomePageSchema(input: {
  title: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    buildOrganization(),
    buildWebSite(),
    list,
    buildCollectionPage({
      name: input.title,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}

export function buildToolPageSchema(input: {
  name: string;
  description: string;
  url: string;
  image?: string;
  categoryName?: string | null;
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: input.name, url: input.url },
    ]),
    buildSoftwareApplication({
      name: input.name,
      description: input.description,
      url: input.url,
      image: input.image,
      applicationCategory: input.categoryName ?? "BusinessApplication",
      operatingSystem: "Web",
    }),
  ];
}

export function buildCollectionListingSchema(input: {
  name: string;
  description: string;
  url: string;
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    list,
    buildCollectionPage({
      name: input.name,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}

export function buildCollectionWithBreadcrumbSchema(input: {
  name: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    buildBreadcrumbList(input.breadcrumbs),
    list,
    buildCollectionPage({
      name: input.name,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}

export function buildArticlePageSchema(input: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: input.title, url: input.url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: input.title,
      description: input.description,
      url: input.url,
    },
  ];
}

export function buildBlogArticlePageSchema(input: {
  title: string;
  description: string;
  url: string;
  authorName: string;
  image?: string | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  categoryName?: string | null;
  categoryUrl?: string | null;
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: "Blog", url: "https://shipboost.io/blog" },
      ...(input.categoryName && input.categoryUrl
        ? [{ name: input.categoryName, url: input.categoryUrl }]
        : []),
      { name: input.title, url: input.url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: input.title,
      description: input.description,
      url: input.url,
      image: input.image ?? undefined,
      datePublished: input.publishedAt ?? undefined,
      dateModified: input.updatedAt ?? input.publishedAt ?? undefined,
      author: {
        "@type": "Person",
        name: input.authorName,
      },
      articleSection: input.categoryName ?? undefined,
    },
  ];
}

export function buildBlogArchivePageSchema(input: {
  title: string;
  description: string;
  url: string;
  breadcrumbs: { name: string; url: string }[];
  items: { name: string; url: string }[];
}) {
  const list = buildItemList(input.items);

  return [
    buildBreadcrumbList(input.breadcrumbs),
    list,
    buildCollectionPage({
      name: input.title,
      description: input.description,
      url: input.url,
      mainEntity: list,
    }),
  ];
}

export function buildFaqPageSchema(input: {
  title: string;
  description: string;
  url: string;
  questions: { question: string; answer: string }[];
}) {
  return [
    buildBreadcrumbList([
      { name: "Home", url: "https://shipboost.io" },
      { name: input.title, url: input.url },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      name: input.title,
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
    },
  ];
}

export function buildPricingPageSchema(input: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Service",
      name: input.title,
      description: input.description,
      url: input.url,
      provider: buildOrganization(),
    },
  ];
}

export function buildContactPageSchema(input: {
  title: string;
  description: string;
  url: string;
}) {
  return [
    buildOrganization(),
    {
      "@context": "https://schema.org",
      "@type": "ContactPage",
      name: input.title,
      description: input.description,
      url: input.url,
    },
  ];
}

export function buildSimpleWebPageSchema(input: {
  type?: "WebPage" | "AboutPage";
  title: string;
  description: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": input.type ?? "WebPage",
    name: input.title,
    description: input.description,
    url: input.url,
  };
}
