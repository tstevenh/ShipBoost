import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

const {
  clearPendingAuthIntentMock,
  pushMock,
  refreshMock,
  setPendingAuthIntentMock,
  signInMagicLinkMock,
  signInEmailMock,
  signInSocialMock,
  signUpEmailMock,
} = vi.hoisted(() => ({
  clearPendingAuthIntentMock: vi.fn(),
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
  setPendingAuthIntentMock: vi.fn(),
  signInMagicLinkMock: vi.fn(),
  signInEmailMock: vi.fn(),
  signInSocialMock: vi.fn(),
  signUpEmailMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    refresh: refreshMock,
  }),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    signIn: {
      magicLink: signInMagicLinkMock,
      email: signInEmailMock,
      social: signInSocialMock,
    },
    signUp: {
      email: signUpEmailMock,
    },
  },
}));

vi.mock("@/lib/posthog-browser", () => ({
  clearPendingAuthIntent: clearPendingAuthIntentMock,
  setPendingAuthIntent: setPendingAuthIntentMock,
}));

describe("AuthForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders a magic-link CTA on sign-in", () => {
    render(<AuthForm mode="sign-in" redirectTo="/dashboard" googleEnabled />);

    expect(
      screen.getByRole("button", { name: /email me a sign-in link/i }),
    ).toBeInTheDocument();
  });

  it("submits a magic link with the requested callback URL", async () => {
    signInMagicLinkMock.mockResolvedValueOnce({});

    render(
      <AuthForm mode="sign-in" redirectTo="/resources/startup-directories" />,
    );

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "founder@example.com" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /email me a sign-in link/i }),
    );

    await waitFor(() => {
      expect(signInMagicLinkMock).toHaveBeenCalledWith({
        email: "founder@example.com",
        callbackURL: "/resources/startup-directories",
      });
    });

    expect(setPendingAuthIntentMock).toHaveBeenCalledWith({
      intent: "sign-in",
      method: "magic_link",
      email: "founder@example.com",
      redirectTo: "/resources/startup-directories",
      source: "auth_form",
    });
  });

  it("stores a pending sign-in intent for email/password login", async () => {
    signInEmailMock.mockResolvedValueOnce({});

    render(<AuthForm mode="sign-in" redirectTo="/dashboard" />);

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "founder@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "TestPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(signInEmailMock).toHaveBeenCalledWith({
        email: "founder@example.com",
        password: "TestPass123!",
        callbackURL: "/dashboard",
      });
    });

    expect(setPendingAuthIntentMock).toHaveBeenCalledWith({
      intent: "sign-in",
      method: "email",
      email: "founder@example.com",
      redirectTo: "/dashboard",
      source: "auth_form",
    });
  });

  it("stores a pending sign-up intent for account creation", async () => {
    signUpEmailMock.mockResolvedValueOnce({});

    render(<AuthForm mode="sign-up" redirectTo="/dashboard" />);

    fireEvent.change(screen.getByPlaceholderText(/full name/i), {
      target: { value: "Founder" },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: "founder@example.com" },
    });
    fireEvent.change(document.querySelector('input[type="password"]')!, {
      target: { value: "TestPass123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^continue$/i }));

    await waitFor(() => {
      expect(signUpEmailMock).toHaveBeenCalledWith({
        name: "Founder",
        email: "founder@example.com",
        password: "TestPass123!",
        callbackURL: "/dashboard",
      });
    });

    expect(setPendingAuthIntentMock).toHaveBeenCalledWith({
      intent: "sign-up",
      method: "email",
      email: "founder@example.com",
      redirectTo: "/dashboard",
      source: "auth_form",
    });
  });
});
