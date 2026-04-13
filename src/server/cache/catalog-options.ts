import { unstable_cache } from "next/cache";
import { cache } from "react";

import { listCategories, listTags } from "@/server/services/catalog-service";

export const CATALOG_OPTIONS_REVALIDATE = 3600;

export const CATALOG_CACHE_TAGS = {
  categories: "catalog:categories",
  tags: "catalog:tags",
} as const;

const getCachedCategoriesLoader = unstable_cache(
  () => listCategories(),
  ["catalog-options", "v1", "categories"],
  {
    revalidate: CATALOG_OPTIONS_REVALIDATE,
    tags: [CATALOG_CACHE_TAGS.categories],
  },
);

const getCachedTagsLoader = unstable_cache(() => listTags(), ["catalog-options", "v1", "tags"], {
  revalidate: CATALOG_OPTIONS_REVALIDATE,
  tags: [CATALOG_CACHE_TAGS.tags],
});

export const getCachedCatalogCategories = cache(async () =>
  getCachedCategoriesLoader(),
);

export const getCachedCatalogTags = cache(async () => getCachedTagsLoader());

export const getCachedCatalogOptions = cache(async () => {
  const [categories, tags] = await Promise.all([
    getCachedCatalogCategories(),
    getCachedCatalogTags(),
  ]);

  return {
    categories,
    tags,
  };
});
