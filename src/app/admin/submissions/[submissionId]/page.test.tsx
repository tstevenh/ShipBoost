import { describe, expect, it, vi } from "vitest";

import { AppError } from "@/server/http/app-error";

const { getAdminSubmissionDetailMock, notFoundMock } = vi.hoisted(() => ({
  getAdminSubmissionDetailMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
}));

vi.mock("@/server/services/submission-service", () => ({
  getAdminSubmissionDetail: getAdminSubmissionDetailMock,
}));

vi.mock("@/components/admin/submission-detail-view", () => ({
  SubmissionDetailView: () => <div>submission detail view</div>,
}));

import AdminSubmissionDetailPage from "@/app/admin/submissions/[submissionId]/page";

describe("admin submission detail page", () => {
  it("calls notFound for an unknown submission", async () => {
    getAdminSubmissionDetailMock.mockRejectedValueOnce(
      new AppError(404, "Submission not found."),
    );

    await expect(
      AdminSubmissionDetailPage({
        params: Promise.resolve({ submissionId: "missing_submission" }),
      }),
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFoundMock).toHaveBeenCalledTimes(1);
  });
});
