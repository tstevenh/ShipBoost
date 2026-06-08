export const MIN_INDEXABLE_TAG_TOOL_COUNT = 3;

export function isTagPageIndexable(toolCount: number) {
  return toolCount >= MIN_INDEXABLE_TAG_TOOL_COUNT;
}
