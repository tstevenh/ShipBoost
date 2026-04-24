import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AuthForm } from "@/components/auth/auth-form";

const {
  pushMock,
  refreshMock,
  signInMagicLinkMock,
  signInEmailMock,
  signInSocialMock,
  signUpEmailMock,
} = vi.hoisted(() => ({
  pushMock: vi.fn(),
  refreshMock: vi.fn(),
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

    expect(
      screen.getByText(/check your inbox for your sign-in link/i),
    ).toBeInTheDocument();
  });

  it("signs in with email and password", async () => {
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

    expect(pushMock).toHaveBeenCalledWith("/dashboard");
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });

  it("creates an account and sends the founder to email verification", async () => {
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

    expect(pushMock).toHaveBeenCalledWith(
      "/verify-email?email=founder%40example.com&redirect=%2Fdashboard",
    );
    expect(refreshMock).toHaveBeenCalledTimes(1);
  });
});
