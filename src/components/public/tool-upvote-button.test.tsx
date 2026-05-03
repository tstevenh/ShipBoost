import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ToolUpvoteButton } from "@/components/public/tool-upvote-button";

const { pushMock, useViewerVoteStateMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  useViewerVoteStateMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/launches/weekly",
  useRouter: () => ({
    push: pushMock,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({
      data: {
        user: {
          id: "user_1",
        },
      },
    }),
  },
}));

vi.mock("@/components/public/viewer-vote-state-provider", () => ({
  useViewerVoteState: useViewerVoteStateMock,
}));

describe("ToolUpvoteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useViewerVoteStateMock.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      hasUpvoted: false,
      dailyVotesRemaining: 3,
      applyVoteResult: vi.fn(),
    });
  });

  it("updates the visible count optimistically before the vote response resolves", async () => {
    let resolveVote: (response: Response) => void = () => {};
    const votePromise = new Promise<Response>((resolve) => {
      resolveVote = resolve;
    });
    const fetchMock = vi
      .spyOn(global, "fetch")
      .mockReturnValueOnce(votePromise as Promise<Response>);

    render(
      <ToolUpvoteButton
        toolId="tool_1"
        initialCount={0}
        initialDailyVotesRemaining={3}
        variant="card"
      />,
    );

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByText("1")).toBeInTheDocument();

    resolveVote(
      new Response(
        JSON.stringify({
          data: {
            hasUpvoted: true,
            upvoteCount: 2,
            dailyVotesRemaining: 2,
          },
        }),
        { status: 200 },
      ),
    );

    await waitFor(() => {
      expect(screen.getByText("2")).toBeInTheDocument();
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/tools/tool_1/vote", {
      method: "POST",
    });

    fetchMock.mockRestore();
  });
});
