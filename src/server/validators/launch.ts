import { z } from "zod";

export const launchesQuerySchema = z.object({
  board: z.enum(["daily", "weekly", "monthly"]).default("daily"),
});

