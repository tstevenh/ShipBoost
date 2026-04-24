import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { apiRequestMock } = vi.hoisted(() => ({
  apiRequestMock: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/admin/admin-console-shared", async () => {
  const actual = await vi.importActual<
    typeof import("@/components/admin/admin-console-shared")
  >("@/components/admin/admin-console-shared");

  return {
    ...actual,
    apiRequest: apiRequestMock,
  };
});

vi.mock("@/components/admin/blog-panel", () => ({
  BlogPanel: () => <div data-testid="blog-panel" />,
}));

vi.mock("@/components/admin/catalog-panel", () => ({
  CatalogPanel: () => <div data-testid="catalog-panel" />,
}));

vi.mock("@/components/admin/launch-schedule-panel", () => ({
  LaunchSchedulePanel: () => <div data-testid="launch-schedule-panel" />,
}));

vi.mock("@/components/admin/listing-claim-panel", () => ({
  ListingClaimPanel: () => <div data-testid="listing-claim-panel" />,
}));

vi.mock("@/components/admin/submission-review-panel", () => ({
  SubmissionReviewPanel: () => <div data-testid="submission-review-panel" />,
}));

vi.mock("@/components/admin/tool-ops-panel", () => ({
  ToolOpsPanel: () => <div data-testid="tool-ops-panel" />,
}));

import { AdminConsole } from "@/components/admin/admin-console";

describe("AdminConsole", () => {
  it("loads each admin boot endpoint once on initial mount", async () => {
    apiRequestMock.mockResolvedValue([]);

    render(<AdminConsole />);

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/categories");
      expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/tags");
      expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/tools");
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/admin/submissions?reviewStatus=PENDING",
      );
      expect(apiRequestMock).toHaveBeenCalledWith(
        "/api/admin/listing-claims?status=PENDING",
      );
      expect(apiRequestMock).toHaveBeenCalledWith("/api/admin/launches");
    });

    await waitFor(() => {
      expect(apiRequestMock).toHaveBeenCalledTimes(6);
    });
  });
});
