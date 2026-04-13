export type JsonLd =
  | Record<string, unknown>
  | Array<Record<string, unknown>>;

export type BreadcrumbInput = {
  name: string;
  url: string;
};

export type ListItemInput = {
  name: string;
  url: string;
};

export type SoftwareApplicationInput = {
  name: string;
  description: string;
  url: string;
  image?: string;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: Record<string, unknown>;
};
