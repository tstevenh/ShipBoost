import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/server/http/app-error";

type RouteTiming = {
  label: string;
  startedAt: number;
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function errorResponse(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed.",
        details: error.flatten(),
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        details: error.details,
      },
      { status: error.statusCode },
    );
  }

  console.error(error);

  return NextResponse.json(
    { error: "Internal server error." },
    { status: 500 },
  );
}

export function startRouteTiming(label: string): RouteTiming {
  return {
    label,
    startedAt: performance.now(),
  };
}

export function withRouteTiming<T extends Response>(
  response: T,
  timing: RouteTiming,
) {
  const duration = Math.max(0, performance.now() - timing.startedAt);
  const serverTimingLabel = timing.label.replaceAll('"', "'");

  response.headers.append(
    "Server-Timing",
    `app;dur=${duration.toFixed(1)};desc="${serverTimingLabel}"`,
  );
  response.headers.set("X-ShipBoost-Route-Time-Ms", duration.toFixed(1));

  return response;
}
