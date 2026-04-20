export type SeoFaqItem = {
  question: string;
  answer: string;
};

export type BestPageComparisonRow = {
  label: string;
  valuesByToolSlug: Record<string, string>;
};

export type BestPageRankedTool = {
  toolSlug: string;
  rank: number;
  verdict: string;
  bestFor: string;
  notIdealFor: string;
  criteriaHighlights?: string[];
};

export type BestPageInternalLink = {
  href: string;
  label: string;
  description: string;
};

export type BestPageCustomSection = {
  heading: string;
  body: string;
};

export type BestHubSupportingLink = {
  href: string;
  label: string;
  description: string;
};

export type BestHubSection = {
  slug: string;
  title: string;
  intro: string;
  pageSlugs: string[];
  supportingLinks: BestHubSupportingLink[];
};

export type BestPageEntry = {
  slug: string;
  targetKeyword: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  intro: string;
  whoItsFor: string;
  howWeEvaluated: string[];
  comparisonTable: BestPageComparisonRow[];
  rankedTools: BestPageRankedTool[];
  faq: SeoFaqItem[];
  internalLinks: BestPageInternalLink[];
  primaryCategorySlug: string;
  supportingTagSlugs: string[];
  customSections?: BestPageCustomSection[];
};

export type AlternativesSeoEntry = {
  slug: string;
  anchorToolSlug: string;
  title: string;
  intro: string;
  metaTitle: string;
  metaDescription: string;
  toolSlugs: string[];
  faq?: SeoFaqItem[];
};

export type BestTagSeoEntry = {
  slug: string;
  title?: string;
  intro?: string;
  metaTitle?: string;
  metaDescription?: string;
  faq?: SeoFaqItem[];
};
