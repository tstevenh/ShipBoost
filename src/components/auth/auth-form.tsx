"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, ArrowRight } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { AuthBrand } from "@/components/auth/auth-brand";

type AuthMode = "sign-in" | "sign-up";

type AuthFormProps = {
  mode: AuthMode;
  initialNotice?: string | null;
  redirectTo?: string;
  googleEnabled?: boolean;
};

function getTitle(mode: AuthMode) {
  return mode === "sign-up"
    ? "Create your account"
    : "Login to ShipBoost";
}

function getSubtitle(mode: AuthMode) {
  return mode === "sign-up"
    ? "Already have an account?"
    : "Don't have an account?";
}

function getCta(mode: AuthMode) {
  return mode === "sign-up" ? "Continue" : "Continue";
}

export function AuthForm({
  mode,
  initialNotice,
  redirectTo = "/dashboard",
  googleEnabled = false,
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

  async function handleGoogleSignIn() {
    if (isSubmitting || !googleEnabled) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setNoticeMessage(null);

    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: redirectTo,
      });

      if (result.error) {
        setErrorMessage(
          result.error.message ?? "Unable to start Google sign-in right now.",
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex w-full max-w-md flex-col items-center justify-center py-12 mx-auto">
      <AuthBrand />

      <div className="w-full space-y-2 text-center">
        <h1 className="text-4xl font-black tracking-tight text-foreground">
          {getTitle(mode)}
        </h1>
        <p className="text-sm font-medium text-muted-foreground">
          {getSubtitle(mode)}{" "}
          <Link
            href={mode === "sign-up" ? "/sign-in" : "/sign-up"}
            className="text-primary font-bold hover:underline"
          >
            {mode === "sign-up" ? "Login" : "Sign up"}
          </Link>
        </p>
      </div>

      <div className="mt-10 w-full space-y-6">
        {googleEnabled && (
          <button
            type="button"
            onClick={() => void handleGoogleSignIn()}
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-bold transition-all hover:bg-muted active:scale-[0.98] disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.48-.98 7.31-2.64l-3.57-2.77c-.99.66-2.26 1.06-3.74 1.06-2.87 0-5.29-1.94-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.16H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.84l3.66-2.75z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.16l3.66 2.84c.87-2.6 3.3-4.62 6.16-4.62z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        )}

        <div className="relative flex items-center">
          <div className="h-px flex-1 bg-border" />
          <span className="mx-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
            or
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "sign-up" && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Name
              </label>
              <input
                required
                disabled={isSubmitting}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
                placeholder="Full name"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">
              Email
            </label>
            <input
              required
              type="email"
              disabled={isSubmitting}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="you@email.com"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between px-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                Password
              </label>
              {mode === "sign-in" && (
                <Link
                  href="/forgot-password"
                  className="text-[10px] font-bold text-primary hover:underline"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <input
              required
              type="password"
              disabled={isSubmitting}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
              placeholder="••••••••"
            />
          </div>

          {errorMessage && (
            <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs font-bold text-destructive">
              {errorMessage}
            </div>
          )}

          {noticeMessage && (
            <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 text-xs font-bold text-primary">
              {noticeMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                {getCta(mode)}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-[10px] font-medium text-muted-foreground">
          By signing in, you agree to our{" "}
          <Link href="/terms" className="font-bold text-foreground hover:underline">
            Terms of Service
          </Link>.
        </p>
      </div>
    </div>
  );
}
