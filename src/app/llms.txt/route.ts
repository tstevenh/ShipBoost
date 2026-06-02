import { buildLlmsTxt } from "@/server/seo/llms";
import { getEnv } from "@/server/env";

export const revalidate = 3600;

export function GET() {
  return new Response(buildLlmsTxt(getEnv().NEXT_PUBLIC_APP_URL), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
