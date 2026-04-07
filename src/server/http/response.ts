import { NextResponse } from "next/server";
import { ZodError } from "zod";

import { AppError } from "@/server/http/app-error";

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

