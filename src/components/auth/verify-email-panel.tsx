"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

function inputClassName() {
  return "w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-base outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10";
}

export function VerifyEmailPanel({
  initialEmail,
  redirectTo,
}: {
  initialEmail?: string;
  redirectTo?: string;
}) {
  const [email, setEmail] = useState(initialEmail ?? "");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialEmail
      ? `Verification email sent to ${initialEmail}.`
      : "Enter your email to send a fresh verification link.",
  );
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(() => {
      void (async () => {
        try {
          setErrorMessage(null);
          const origin = window.location.origin;
          const response = await fetch("/api/auth/send-verification-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email,
              callbackURL: `${origin}${redirectTo || "/dashboard"}`,
            }),
          });

          const payload = (await response.json().catch(() => null)) as
            | { error?: { message?: string } | string }
            | null;

          if (!response.ok) {
            throw new Error(
              typeof payload?.error === "string"
                ? payload.error
                : payload?.error?.message ?? "Unable to send verification email.",
            );
          }

          setSuccessMessage(`Verification email sent to ${email}.`);
        } catch (error) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to send verification email.",
          );
        }
      })();
    });
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#9f4f1d] uppercase">
          Verify account
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black sm:text-5xl">
          Check your inbox
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-black/65 sm:text-lg">
          You need to verify your email before Shipboost unlocks founder access.
          If the email did not arrive, send another link below.
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
            {isPending ? "Sending..." : "Send verification email"}
          </button>
        </form>

        <p className="mt-6 text-sm text-black/60">
          Already verified?{" "}
          <Link
            href={
              redirectTo
                ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}`
                : "/sign-in"
            }
            className="font-semibold text-[#9f4f1d] underline decoration-[#9f4f1d]/35 underline-offset-4"
          >
            Sign in
          </Link>
        </p>
      </div>

      <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.25)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
          Delivery notes
        </p>
        <div className="mt-8 space-y-4 text-sm leading-7 text-[#f8efe3]/78">
          <p>Use a real inbox you control. You will need it for password resets and launch notifications later.</p>
          <p>In local or early testing, Resend can still send to test inboxes before your branded domain is ready.</p>
          <p>Once you buy the domain, move transactional email to a sender like `auth@yourdomain.com` or `notify@yourdomain.com`.</p>
        </div>
      </aside>
    </section>
  );
}
