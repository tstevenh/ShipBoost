"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

function inputClassName() {
  return "w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-base outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10";
}

export function ResetPasswordForm({
  token,
  initialError,
}: {
  token?: string;
  initialError?: string | null;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(
    initialError ?? null,
  );
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setErrorMessage("Missing reset token. Request a new password reset link.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Use a password with at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    startTransition(() => {
      void (async () => {
        try {
          setErrorMessage(null);
          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              token,
              newPassword: password,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } | string }
            | null;

          if (!response.ok) {
            throw new Error(
              typeof payload?.error === "string"
                ? payload.error
                : payload?.error?.message ?? "Unable to reset password.",
            );
          }

          setSuccessMessage("Password updated. Redirecting to sign in...");
          window.setTimeout(() => {
            router.push("/sign-in?reset=1");
            router.refresh();
          }, 900);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to reset password.",
          );
        }
      })();
    });
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#9f4f1d] uppercase">
          Choose a new password
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Reset your password
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-black/65 sm:text-lg">
          Set a new password for your Shipboost founder account.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-black/80">New password</span>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClassName()}
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-black/80">
              Confirm password
            </span>
            <input
              required
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              className={inputClassName()}
              placeholder="Repeat your new password"
            />
          </label>

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isPending || !token}
            className="w-full rounded-2xl bg-[#143f35] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Updating..." : "Update password"}
          </button>
        </form>

        <p className="mt-6 text-sm text-black/60">
          Need a fresh link?{" "}
          <Link
            href="/forgot-password"
            className="font-semibold text-[#9f4f1d] underline decoration-[#9f4f1d]/35 underline-offset-4"
          >
            Request another reset email
          </Link>
        </p>
      </div>

      <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.25)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
          Good passwords
        </p>
        <div className="mt-8 space-y-4 text-sm leading-7 text-[#f8efe3]/78">
          <p>Use a unique password you do not reuse across other tools or accounts.</p>
          <p>After a successful reset, Shipboost can revoke existing sessions if you choose to tighten that later.</p>
          <p>Invalid or expired links will need a new reset request.</p>
        </div>
      </aside>
    </section>
  );
}
