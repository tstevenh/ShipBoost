import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { HomeLeadMagnetForm } from "@/components/public/home-lead-magnet-form";

const { signInMagicLinkMock } = vi.hoisted(() => ({
  signInMagicLinkMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("utm_source=twitter"),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: signInMagicLinkMock,
    },
  },
}));

describe("HomeLeadMagnetForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("captures the lead before sending the resource magic link", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: "lead_1",
          email: "founder@example.com",
          status: "ACTIVE",
        }),
        { status: 201 },
      ),
    );

    signInMagicLinkMock.mockResolvedValueOnce({});

    render(<HomeLeadMagnetForm />);

    fireEvent.change(screen.getByPlaceholderText("you@startup.com"), {
      target: { value: "founder@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /get access now/i }));

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
        email: "founder@example.com",
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
