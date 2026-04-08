import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock, getToolByOwnerMock, deleteImageFromCloudinaryMock } = vi.hoisted(
  () => ({
    prismaMock: {
      tool: {
        delete: vi.fn(),
      },
    },
    getToolByOwnerMock: vi.fn(),
    deleteImageFromCloudinaryMock: vi.fn(),
  }),
);

vi.mock("@/server/db/client", () => ({
  prisma: prismaMock,
}));

vi.mock("@/server/repositories/tool-repository", () => ({
  getToolByOwner: getToolByOwnerMock,
  getToolById: vi.fn(),
  listTools: vi.fn(),
  listToolsByOwner: vi.fn(),
  replaceToolCategories: vi.fn(),
  replaceToolTags: vi.fn(),
}));

vi.mock("@/server/cloudinary", () => ({
  deleteImageFromCloudinary: deleteImageFromCloudinaryMock,
}));

import { deleteFounderTool } from "@/server/services/tool-service";

describe("deleteFounderTool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("permanently deletes an owned tool and cleans up media", async () => {
    getToolByOwnerMock.mockResolvedValueOnce({
      id: "tool_1",
      slug: "stackbase",
      name: "Stackbase",
      logoMedia: { publicId: "logos/stackbase" },
      media: [
        { id: "media_1", publicId: "screens/stackbase-1" },
        { id: "media_2", publicId: null },
      ],
    });
    prismaMock.tool.delete.mockResolvedValueOnce({ id: "tool_1" });
    deleteImageFromCloudinaryMock.mockResolvedValue(undefined);

    const result = await deleteFounderTool("user_1", "tool_1");

    expect(prismaMock.tool.delete).toHaveBeenCalledWith({
      where: { id: "tool_1" },
    });
    expect(deleteImageFromCloudinaryMock).toHaveBeenCalledTimes(2);
    expect(deleteImageFromCloudinaryMock).toHaveBeenNthCalledWith(
      1,
      "logos/stackbase",
    );
    expect(deleteImageFromCloudinaryMock).toHaveBeenNthCalledWith(
      2,
      "screens/stackbase-1",
    );
    expect(result).toEqual({
      id: "tool_1",
      slug: "stackbase",
      name: "Stackbase",
    });
  });

  it("rejects deleting a tool the founder does not own", async () => {
    getToolByOwnerMock.mockResolvedValueOnce(null);

    await expect(deleteFounderTool("user_1", "tool_missing")).rejects.toMatchObject({
      statusCode: 404,
      message: "Tool not found.",
    });
    expect(prismaMock.tool.delete).not.toHaveBeenCalled();
    expect(deleteImageFromCloudinaryMock).not.toHaveBeenCalled();
  });
});
