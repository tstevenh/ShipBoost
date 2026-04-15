"use client";

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { requestStartupDirectoriesAccess } from "@/lib/startup-directories-access";

const source = "resource_preview_unlock";
const leadMagnet = "startup-directories-800";

export function ResourceUnlockPanel() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await requestStartupDirectoriesAccess({
        email,
        source,
        leadMagnet,
      });

      setSuccessMessage("Check your inbox for your directories access link.");
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to send your access link right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section
      id="resource-unlock-panel"
      className="rounded-[2rem] border border-border bg-card/95 p-6 shadow-xl shadow-black/5 sm:p-8"
    >
      <div className="max-w-3xl space-y-4">
        <p className="text-[10px] font-black tracking-[0.28em] text-foreground/40">
          Unlock the full resource
        </p>
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
          Unlock the full searchable list of 300+ startup directories.
        </h2>
        <p className="text-sm font-medium leading-7 text-muted-foreground sm:text-base">
          Get the complete hosted list inside ShipBoost so you can search, sort,
          and work through distribution research faster instead of juggling
          spreadsheets and scattered bookmarks.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mt-6 flex flex-col gap-3 sm:flex-row"
      >
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@startup.com"
          className="min-w-0 flex-1 rounded-2xl border border-border bg-muted/20 px-5 py-4 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/5"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-primary px-6 py-4 text-sm font-black text-primary-foreground transition-all hover:opacity-90 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Email me the full list"}
        </button>
      </form>

      <p className="mt-4 text-xs font-bold tracking-widest text-muted-foreground/45">
        * Access link via email. Open the full hosted list after sign-in.
      </p>

      {successMessage ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-bold text-emerald-700">
          <Check size={18} />
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-4 text-sm font-bold text-destructive">
          <AlertCircle size={18} />
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
