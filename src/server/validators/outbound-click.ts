import { z } from "zod";

export const outboundClickParamsSchema = z.object({
  toolId: z.string().trim().min(1, "Tool id is required."),
});

export const outboundClickQuerySchema = z.object({
  target: z.enum(["website", "affiliate"]),
  source: z.enum([
    "tool_page",
    "tool_page_related",
    "launch_board",
    "category_page",
    "category_featured",
    "best_tag_page",
    "alternatives_page",
  ]),
});
