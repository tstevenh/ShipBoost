import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { errorResponse } from "@/server/http/response";
import { resolveTrackedToolOutboundClick } from "@/server/services/outbound-click-service";
import {
  outboundClickParamsSchema,
  outboundClickQuerySchema,
} from "@/server/validators/outbound-click";

type RouteContext = {
  params: Promise<{ toolId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { toolId } = outboundClickParamsSchema.parse(await context.params);
    const { target, source } = outboundClickQuerySchema.parse({
      target: request.nextUrl.searchParams.get("target"),
      source: request.nextUrl.searchParams.get("source"),
    });
    const result = await resolveTrackedToolOutboundClick({
      toolId,
      target,
      source,
      referer: request.headers.get("referer"),
      request,
    });

    return NextResponse.redirect(result.destinationUrl);
  } catch (error) {
    return errorResponse(error);
  }
}
