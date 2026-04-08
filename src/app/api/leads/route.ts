import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { created, errorResponse, ok } from "@/server/http/response";
import { captureLead } from "@/server/services/lead-service";
import { leadCaptureSchema } from "@/server/validators/lead";

export async function POST(request: NextRequest) {
  try {
    getEnv();
    const body = leadCaptureSchema.parse(await request.json());
    const result = await captureLead(body);
    const payload = {
      id: result.lead.id,
      email: result.lead.email,
      status: result.lead.status,
    };

    return result.created ? created(payload) : ok(payload);
  } catch (error) {
    return errorResponse(error);
  }
}
