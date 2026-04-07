import type { NextRequest } from "next/server";
import { headers } from "next/headers";

import type { AuthSession } from "@/lib/auth";
import { auth } from "@/lib/auth";
import { AppError } from "@/server/http/app-error";

export async function getSessionFromRequest(request: NextRequest) {
  return auth.api.getSession({
    headers: request.headers,
  });
}

export async function getServerSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireSession(
  request: NextRequest,
): Promise<NonNullable<AuthSession>> {
  const session = await getSessionFromRequest(request);

  if (!session) {
    throw new AppError(401, "Authentication required.");
  }

  return session;
}

export async function requireRole(
  request: NextRequest,
  role: "ADMIN" | "FOUNDER",
) {
  const session = await requireSession(request);

  if (session.user.role !== role) {
    throw new AppError(403, `${role} access required.`);
  }

  return session;
}
