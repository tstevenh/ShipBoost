import { z } from "zod";

export const launchesQuerySchema = z.object({
  board: z.enum(["weekly", "monthly", "yearly"]).default("weekly"),
});
