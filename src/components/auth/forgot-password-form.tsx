"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Loader2, ArrowRight } from "lucide-react";

import { AuthBrand } from "@/components/auth/auth-brand";

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
    <div className="flex w-full max-w-md flex-col items-center justify-center py-12 mx-auto">
      <AuthBrand />

      <div className="w-full space-y-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          Reset password
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          Enter your email to receive a secure reset link.
        </p>
      </div>

      <div className="mt-10 w-full space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Email
            </label>
            <input
              required
              type="email"
              disabled={isPending}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="you@email.com"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-bold text-destructive">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-bold text-primary">
              {successMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                Send reset link
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] font-medium text-muted-foreground">
          Remembered it?{" "}
          <Link href="/sign-in" className="font-bold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
