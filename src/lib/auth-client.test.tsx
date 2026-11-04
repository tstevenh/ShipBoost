// @vitest-environment jsdom
import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useHydratedSession } from "@/lib/auth-client";

const { useSessionMock } = vi.hoisted(() => ({
  useSessionMock: vi.fn(),
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({ useSession: useSessionMock }),
}));

function HeaderStub() {
  const { data: session } = useHydratedSession();
  return <p>{session ? `Hi ${session.user.name}` : "Sign in"}</p>;
}

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("useHydratedSession", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    document.body.innerHTML = "";
  });

  it("hydrates signed-out markup even when the session already loaded, then shows the user", async () => {
    // The server has no client session; the browser fetched it before hydration.
    useSessionMock.mockReturnValue({ data: null, isPending: true });
    const container = document.createElement("div");
    container.innerHTML = renderToString(<HeaderStub />);
    document.body.appendChild(container);
    expect(container.textContent).toBe("Sign in");

    useSessionMock.mockReturnValue({
      data: { user: { name: "Tim" } },
      isPending: false,
    });
    const recoverableErrors: unknown[] = [];
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    await act(async () => {
      hydrateRoot(container, <HeaderStub />, {
        onRecoverableError: (error) => recoverableErrors.push(error),
      });
    });

    expect(recoverableErrors).toEqual([]);
    expect(consoleError).not.toHaveBeenCalled();
    expect(container.textContent).toBe("Hi Tim");
  });
});
