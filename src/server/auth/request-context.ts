import type { NextRequest } from "next/server";

import { getEnv } from "@/server/env";
import { AppError } from "@/server/http/app-error";
import { getSessionFromRequest } from "@/server/auth/session";

export type RequestRole = "FOUNDER" | "ADMIN";

export type RequestContext = {
  userId: string | null;
  email: string | null;
  role: RequestRole;
};

function getDevelopmentHeaderContext(request: NextRequest): RequestContext | null {
  const roleHeader = request.headers.get("x-shipboost-role");
  const userId = request.headers.get("x-shipboost-user-id");
  const email = request.headers.get("x-shipboost-user-email");

  if (!roleHeader && !userId && !email) {
    return null;
  }

  return {
    userId,
    email,
    role: roleHeader === "ADMIN" ? "ADMIN" : "FOUNDER",
  };
}

export async function getRequestContext(
  request: NextRequest,
): Promise<RequestContext | null> {
  const session = await getSessionFromRequest(request);

  if (session) {
    return {
      userId: session.user.id,
      email: session.user.email,
      role: session.user.role === "ADMIN" ? "ADMIN" : "FOUNDER",
    };
  }

  if (getEnv().APP_ENV === "development") {
    return getDevelopmentHeaderContext(request);
  }

  return null;
}

export async function requireAdmin(request: NextRequest) {
  const context = await getRequestContext(request);

  if (!context || context.role !== "ADMIN") {
    throw new AppError(
      401,
      "Admin access required.",
    );
  }

  return context;
}

export async function requireAdminUserId(request: NextRequest) {
  const context = await requireAdmin(request);

  if (!context.userId) {
    throw new AppError(
      401,
      "Admin user id is required.",
    );
  }

  return context.userId;
}
