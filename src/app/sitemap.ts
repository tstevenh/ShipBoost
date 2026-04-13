import type { MetadataRoute } from "next";

import {
  getAlternativesStaticParams,
  getCachedBestTagStaticParams,
  getCachedCategoryStaticParams,
  getCachedToolStaticParams,
  getLaunchBoardStaticParams,
} from "@/server/cache/public-content";
import { getEnv } from "@/server/env";

function toAbsoluteUrl(path: string, appUrl: string) {
  return new URL(path, appUrl).toString();
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const env = getEnv();
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  const now = new Date();

  const [categoryParams, bestTagParams, toolParams] = await Promise.all([
    getCachedCategoryStaticParams(),
    getCachedBestTagStaticParams(),
    getCachedToolStaticParams(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: appUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: toAbsoluteUrl("/pricing", appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/submit", appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/categories", appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/tags", appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/alternatives", appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: toAbsoluteUrl("/how-it-works", appUrl),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/launch-guide", appUrl),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: toAbsoluteUrl("/faqs", appUrl),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: toAbsoluteUrl("/about", appUrl),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: toAbsoluteUrl("/contact", appUrl),
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: toAbsoluteUrl("/affiliate", appUrl),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: toAbsoluteUrl("/privacy", appUrl),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: toAbsoluteUrl("/terms", appUrl),
      lastModified: now,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: toAbsoluteUrl("/resources/startup-directories", appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
  ];

  const launchBoardRoutes: MetadataRoute.Sitemap = getLaunchBoardStaticParams().map(
    ({ board }) => ({
      url: toAbsoluteUrl(`/launches/${board}`, appUrl),
      lastModified: now,
      changeFrequency: "daily",
      priority: board === "weekly" ? 0.9 : 0.7,
    }),
  );

  const categoryRoutes: MetadataRoute.Sitemap = categoryParams.map(({ slug }) => ({
    url: toAbsoluteUrl(`/categories/${slug}`, appUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const bestTagRoutes: MetadataRoute.Sitemap = bestTagParams.map(({ slug }) => ({
    url: toAbsoluteUrl(`/best/tag/${slug}`, appUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const alternativeRoutes: MetadataRoute.Sitemap = getAlternativesStaticParams().map(
    ({ slug }) => ({
      url: toAbsoluteUrl(`/alternatives/${slug}`, appUrl),
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    }),
  );

  const toolRoutes: MetadataRoute.Sitemap = toolParams.map(({ slug }) => ({
    url: toAbsoluteUrl(`/tools/${slug}`, appUrl),
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [
    ...staticRoutes,
    ...launchBoardRoutes,
    ...categoryRoutes,
    ...bestTagRoutes,
    ...alternativeRoutes,
    ...toolRoutes,
  ];
}
