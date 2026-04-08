import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { HomeSearchModal } from "@/components/public/home-search-modal";

describe("HomeSearchModal", () => {
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.useRealTimers();
    window.history.replaceState({}, "", "/");
  });

  it("shows idle copy before the minimum query length", () => {
    render(<HomeSearchModal />);

    fireEvent.click(screen.getByRole("button", { name: "Open search" }));

    expect(
      screen.getByText("Start typing to search published products."),
    ).toBeInTheDocument();
  });

  it("requests results after debounce when the query reaches two characters", async () => {
    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          data: [
            {
              id: "1",
              slug: "calm-sea",
              name: "Calm Sea",
              tagline: "Clearer finance for founders",
              logoUrl: null,
              isFeatured: false,
              categories: [],
              tags: [],
            },
          ],
        }),
      ),
    );

    render(<HomeSearchModal />);

    fireEvent.click(screen.getByRole("button", { name: "Open search" }));
    fireEvent.change(screen.getByPlaceholderText("Search published products"), {
      target: { value: "se" },
    });

    await act(async () => {
      await new Promise((resolve) => window.setTimeout(resolve, 300));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/tools/search?q=se", {
      signal: expect.any(AbortSignal),
    });
    expect(await screen.findByText("Calm Sea")).toBeInTheDocument();
    expect(window.location.search).toBe("?q=se");
  });
});
