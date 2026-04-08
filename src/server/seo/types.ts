export type SeoFaqItem = {
  question: string;
  answer: string;
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
