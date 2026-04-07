"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";

function getInitials(name: string | null | undefined) {
  if (!name) {
    return "SB";
  }

  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function AppHeader() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSigningOut, startSignOutTransition] = useTransition();

  function handleSignOut() {
    startSignOutTransition(() => {
      void (async () => {
        setErrorMessage(null);

        const result = await authClient.signOut();

        if (result.error) {
          setErrorMessage(result.error.message ?? "Unable to sign out right now.");
          return;
        }

        router.push("/");
        router.refresh();
      })();
    });
  }

  const isBusy = isPending || isSigningOut;

  return (
    <header className="border-b border-black/10 bg-[#fffdf7]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <div className="space-y-1">
          <Link
            href="/"
            className="inline-flex items-center gap-3 text-sm font-semibold tracking-[0.28em] text-[#9f4f1d] uppercase"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#9f4f1d] text-sm tracking-normal text-white">
              SB
            </span>
            Shipboost
          </Link>
          <p className="text-sm text-black/60">
            Distribution workflows for bootstrapped SaaS founders.
          </p>
        </div>

        <nav className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black"
          >
            Dashboard
          </Link>
          <Link
            href="/admin"
            className="rounded-full px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black"
          >
            Admin
          </Link>

          {session ? (
            <div className="flex items-center gap-3 rounded-full border border-black/10 bg-white px-2 py-2 shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#143f35] text-sm font-semibold text-[#f8efe3]">
                {getInitials(session.user.name)}
              </div>
              <div className="hidden pr-2 sm:block">
                <p className="text-sm font-semibold text-black">
                  {session.user.name}
                </p>
                <p className="text-xs text-black/55">
                  {session.user.role === "ADMIN" ? "Admin" : "Founder"}
                </p>
              </div>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={isBusy}
                className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white transition hover:bg-black/85 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSigningOut ? "Signing out..." : "Sign out"}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/sign-in"
                className="rounded-full px-4 py-2 text-sm font-medium text-black/70 transition hover:bg-black/5 hover:text-black"
              >
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="rounded-full bg-[#9f4f1d] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#874218]"
              >
                Create account
              </Link>
            </div>
          )}
        </nav>
      </div>

      {errorMessage ? (
        <div className="border-t border-rose-200 bg-rose-50 px-6 py-3 text-center text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </header>
  );
}
