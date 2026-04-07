import { PrismaClient } from "@prisma/client";

declare global {
  var __shipboostPrisma__: PrismaClient | undefined;
}

export const prisma =
  globalThis.__shipboostPrisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.__shipboostPrisma__ = prisma;
}
