"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, ArrowRight } from "lucide-react";

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
    <div className="flex w-full max-w-md flex-col items-center justify-center py-12 mx-auto">
      <div className="mb-12 flex items-center gap-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-black text-primary-foreground text-xl">
          S
        </span>
        <span className="text-2xl font-black tracking-tight text-foreground lowercase">
          ShipBoost
        </span>
      </div>

      <div className="w-full space-y-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          New password
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Choose a secure new password for your account.
        </p>
      </div>

      <div className="mt-10 w-full space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              New Password
            </label>
            <input
              required
              type="password"
              disabled={isPending}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5"
              placeholder="At least 8 characters"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Confirm Password
            </label>
            <input
              required
              type="password"
              disabled={isPending}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5"
              placeholder="Repeat your password"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-bold text-destructive">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs font-bold text-emerald-700">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending || !token}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Update password
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] font-medium text-muted-foreground">
          Need a fresh link?{" "}
          <Link href="/forgot-password" accent-foreground className="font-bold text-foreground hover:underline">
            Request another
          </Link>
        </p>
      </div>
    </div>
  );
}
