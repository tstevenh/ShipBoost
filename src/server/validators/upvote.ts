import { z } from "zod";

export const toolVoteRouteParamsSchema = z.object({
  toolId: z.string().trim().min(1, "Tool id is required."),
});
