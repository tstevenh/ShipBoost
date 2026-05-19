import type { NextRequest } from "next/server";
import { z } from "zod";

import { requireSession } from "@/server/auth/session";
import { prisma } from "@/server/db/client";
import { AppError } from "@/server/http/app-error";
import { errorResponse, ok } from "@/server/http/response";
import { getPubliclyVisibleToolWhere } from "@/server/services/public-tool-visibility";
import { recordStreakActivity } from "@/server/services/streak-service";

const outboundStreakActivitySchema = z.object({
  toolId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await requireSession(request);
    const body = outboundStreakActivitySchema.parse(await request.json());

    const tool = await prisma.tool.findFirst({
      where: {
        id: body.toolId,
        ...getPubliclyVisibleToolWhere(),
      },
      select: {
        id: true,
      },
    });

    if (!tool) {
      throw new AppError(404, "Tool not found.");
    }

    const result = await recordStreakActivity(session.user.id);

    return ok(result);
  } catch (error) {
    return errorResponse(error);
  }
}
