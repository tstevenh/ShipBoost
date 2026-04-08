import { z } from "zod";

export const publicToolSearchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
});

export type PublicToolSearchQuery = z.infer<typeof publicToolSearchQuerySchema>;
