import type { MetadataRoute } from "next";

import { getEnv } from "@/server/env";

export default function robots(): MetadataRoute.Robots {
  const env = getEnv();

  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin",
          "/dashboard",
          "/dashboard/",
          "/api/",
        ],
      },
    ],
    sitemap: `${env.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
    host: env.NEXT_PUBLIC_APP_URL,
  };
}
