"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
  initialNotice?: string | null;
  redirectTo?: string;
};

function getTitle(mode: AuthMode) {
  return mode === "sign-up"
    ? "Create your founder account"
    : "Sign in to Shipboost";
}

function getSubtitle(mode: AuthMode) {
  return mode === "sign-up"
    ? "Get access to submissions, launch workflows, and founder-only distribution tools."
    : "Pick up where you left off and manage listings, launches, and distribution requests.";
}

function getCta(mode: AuthMode) {
  return mode === "sign-up" ? "Create account" : "Sign in";
}

function getPendingCta(mode: AuthMode) {
  return mode === "sign-up" ? "Creating account..." : "Signing in...";
}

export function AuthForm({
  mode,
  initialNotice,
  redirectTo = "/dashboard",
}: AuthFormProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(
    initialNotice ?? null,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      if (mode === "sign-up") {
        const result = await authClient.signUp.email({
          name,
          email,
          password,
          callbackURL: redirectTo,
        });

        if (result.error) {
          setErrorMessage(
            result.error.message ?? "Unable to create your account right now.",
          );
          return;
        }

        router.push(
          `/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`,
        );
        router.refresh();
        return;
      }

      const result = await authClient.signIn.email({
        email,
        password,
        callbackURL: redirectTo,
      });

      if (result.error) {
        if (
          result.error.status === 403 ||
          result.error.message?.toLowerCase().includes("verify")
        ) {
          router.push(
            `/verify-email?email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirectTo)}`,
          );
          router.refresh();
          return;
        }

        setErrorMessage(
          result.error.message ?? "Unable to sign you in right now.",
        );
        return;
      }

      router.push(redirectTo);
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
        <div className="space-y-3">
          <p className="text-sm font-semibold tracking-[0.25em] text-[#9f4f1d] uppercase">
            Founder access
          </p>
          <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-black sm:text-5xl">
            {getTitle(mode)}
          </h1>
          <p className="max-w-xl text-base leading-7 text-black/65 sm:text-lg">
            {getSubtitle(mode)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-10 space-y-5" aria-busy={isSubmitting}>
          {mode === "sign-up" ? (
            <label className="block space-y-2">
              <span className="text-sm font-medium text-black/80">Name</span>
              <input
                required
                disabled={isSubmitting}
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-base outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10"
                placeholder="Your name"
              />
            </label>
          ) : null}

          <label className="block space-y-2">
            <span className="text-sm font-medium text-black/80">Email</span>
            <input
              required
              type="email"
              autoComplete="email"
              disabled={isSubmitting}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-base outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10"
              placeholder="you@example.com"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-black/80">Password</span>
            <input
              required
              type="password"
              autoComplete={
                mode === "sign-up" ? "new-password" : "current-password"
              }
              minLength={8}
              disabled={isSubmitting}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-base outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10"
              placeholder="At least 8 characters"
            />
          </label>

          {mode === "sign-in" ? (
            <div className="flex justify-end">
              <Link
                href="/forgot-password"
                aria-disabled={isSubmitting}
                className="text-sm font-medium text-[#9f4f1d] underline decoration-[#9f4f1d]/35 underline-offset-4 aria-disabled:pointer-events-none aria-disabled:opacity-50"
              >
                Forgot password?
              </Link>
            </div>
          ) : null}

          {noticeMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {noticeMessage}
            </div>
          ) : null}

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {isSubmitting ? (
            <div className="rounded-2xl border border-[#d9c7aa] bg-[#fff8ea] px-4 py-3 text-sm text-[#8a4b1b]">
              {mode === "sign-up"
                ? "Creating your account and preparing verification."
                : "Signing you in now. Shipboost is checking your session."}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {getPendingCta(mode)}
              </>
            ) : (
              getCta(mode)
            )}
          </button>
        </form>

        <p className="mt-6 text-sm text-black/60">
          {mode === "sign-up" ? "Already have an account?" : "New here?"}{" "}
          <Link
            href={
              mode === "sign-up"
                ? `/sign-in?redirect=${encodeURIComponent(redirectTo)}`
                : `/sign-up?redirect=${encodeURIComponent(redirectTo)}`
            }
            aria-disabled={isSubmitting}
            className="font-semibold text-[#9f4f1d] underline decoration-[#9f4f1d]/35 underline-offset-4 aria-disabled:pointer-events-none aria-disabled:opacity-50"
          >
            {mode === "sign-up" ? "Sign in" : "Create an account"}
          </Link>
        </p>
      </div>

      <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.25)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
          What you unlock
        </p>
        <div className="mt-8 space-y-8">
          <div>
            <h2 className="text-2xl font-semibold">Founder workflow first</h2>
            <p className="mt-3 text-base leading-7 text-[#f8efe3]/75">
              Track submissions, prepare a launch, and move into distribution
              services from one account instead of juggling spreadsheets and
              DMs.
            </p>
          </div>
          <div className="space-y-4 text-sm leading-7 text-[#f8efe3]/78">
            <p>
              Free launch submissions with badge requirement to compound trust
              and visibility.
            </p>
            <p>
              Done-for-you distribution requests designed for bootstrapped SaaS
              teams that need leverage, not more busywork.
            </p>
            <p>
              Featured launch slots and affiliate-ready listings once your
              product profile is live.
            </p>
          </div>
        </div>
      </aside>
    </section>
  );
}
