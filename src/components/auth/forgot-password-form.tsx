"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

function inputClassName() {
  return "w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-base outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10";
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          setErrorMessage(null);
          const origin = window.location.origin;
          const response = await fetch("/api/auth/request-password-reset", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              redirectTo: `${origin}/reset-password`,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } | string; message?: string }
            | null;

          if (!response.ok) {
            throw new Error(
              typeof payload?.error === "string"
                ? payload.error
                : payload?.error?.message ?? "Unable to send reset email.",
            );
          }

          setSuccessMessage(
            payload?.message ??
              "If this email exists, a password reset link is on the way.",
          );
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to send reset email.",
          );
        }
      })();
    });
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#9f4f1d] uppercase">
          Reset password
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Get a secure reset link
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-black/65 sm:text-lg">
          Enter your founder account email and Shipboost will send you a secure
          password reset link.
        </p>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-black/80">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClassName()}
              placeholder="you@example.com"
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
            disabled={isPending}
            className="w-full rounded-2xl bg-[#143f35] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <p className="mt-6 text-sm text-black/60">
          Remembered it?{" "}
          <Link
            href="/sign-in"
            className="font-semibold text-[#9f4f1d] underline decoration-[#9f4f1d]/35 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>

      <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.25)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
          Security
        </p>
        <div className="mt-8 space-y-4 text-sm leading-7 text-[#f8efe3]/78">
          <p>Password reset links are time-limited and single-use.</p>
          <p>If the address exists, Shipboost always returns a generic success message to avoid leaking account data.</p>
          <p>Once you reset the password, you will get a confirmation email as well.</p>
        </div>
      </aside>
    </section>
  );
}
