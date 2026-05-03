import { beforeEach, describe, expect, it, vi } from "vitest";

const { revalidatePathMock, revalidateTagMock } = vi.hoisted(() => ({
  revalidatePathMock: vi.fn(),
  revalidateTagMock: vi.fn(),
}));

vi.mock("next/cache", () => ({
  cache: (callback: unknown) => callback,
  revalidatePath: revalidatePathMock,
  revalidateTag: revalidateTagMock,
  unstable_cache: (callback: unknown) => callback,
}));

import {
  PUBLIC_CACHE_TAGS,
  revalidatePublicVoteContent,
} from "@/server/cache/public-content";

describe("revalidatePublicVoteContent", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("expires only lightweight vote-sensitive public caches", () => {
    revalidatePublicVoteContent();

    expect(revalidateTagMock).toHaveBeenCalledWith(PUBLIC_CACHE_TAGS.home, {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledWith(
      PUBLIC_CACHE_TAGS.launchBoards,
      { expire: 0 },
    );
    expect(revalidateTagMock).toHaveBeenCalledWith(PUBLIC_CACHE_TAGS.tools, {
      expire: 0,
    });
    expect(revalidateTagMock).toHaveBeenCalledTimes(3);

    expect(revalidatePathMock).toHaveBeenCalledWith("/");
    expect(revalidatePathMock).toHaveBeenCalledWith(
      "/launches/[board]",
      "page",
    );
    expect(revalidatePathMock).toHaveBeenCalledWith("/tools/[slug]", "page");
    expect(revalidatePathMock).toHaveBeenCalledTimes(3);
  });
});
