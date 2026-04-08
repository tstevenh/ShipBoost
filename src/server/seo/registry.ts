import type {
  AlternativesSeoEntry,
  BestTagSeoEntry,
} from "@/server/seo/types";

// Intentionally code-managed. Alternatives pages are required manual entries.
export const alternativesSeoRegistry: Record<string, AlternativesSeoEntry> = {};

// Optional override layer for best-by-tag pages. Tools auto-load from DB tag membership.
export const bestTagSeoRegistry: Record<string, BestTagSeoEntry> = {};
