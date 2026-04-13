import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ResourceUnlockPanel } from "@/components/resources/resource-unlock-panel";

const { signInMagicLinkMock } = vi.hoisted(() => ({
  signInMagicLinkMock: vi.fn(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: signInMagicLinkMock,
    },
  },
}));

describe("ResourceUnlockPanel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the lead and requests the directories-access email flow", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "lead_2",
          email: "preview@example.com",
          status: "ACTIVE",
        }),
        { status: 201 },
      ),
    );

    signInMagicLinkMock.mockResolvedValueOnce({});

    render(<ResourceUnlockPanel />);

    fireEvent.change(screen.getByPlaceholderText("you@startup.com"), {
      target: { value: "preview@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /email me access/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/leads",
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    await waitFor(() => {
      expect(signInMagicLinkMock).toHaveBeenCalledWith({
        email: "preview@example.com",
        callbackURL: "/resources/startup-directories",
        metadata: {
          intent: "directories-access",
          resource: "startup-directories",
        },
      });
    });

    fetchMock.mockRestore();
  });
});
