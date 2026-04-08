export type ToolOutboundTarget = "website" | "affiliate";
export type ToolOutboundSource =
  | "tool_page"
  | "tool_page_related"
  | "launch_board"
  | "category_page"
  | "category_featured"
  | "best_tag_page"
  | "alternatives_page";

export function buildTrackedToolOutboundUrl(
  toolId: string,
  target: ToolOutboundTarget,
  source: ToolOutboundSource,
) {
  const searchParams = new URLSearchParams({
    target,
    source,
  });

  return `/api/outbound/tool/${toolId}?${searchParams.toString()}`;
}
