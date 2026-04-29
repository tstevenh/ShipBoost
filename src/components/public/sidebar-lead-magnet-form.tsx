"use client";

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { startupDirectoriesMarketingCountLabel } from "@/content/resources/startup-directories-meta";
import { requestStartupDirectoriesAccess } from "@/lib/startup-directories-access";
import { cn } from "@/lib/utils";

const source = "homepage_sidebar_directory_list";
const leadMagnet = "startup-directories-800";

export function SidebarLeadMagnetForm({ className }: { className?: string }) {
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
      const searchParams =
        typeof window === "undefined"
          ? new URLSearchParams()
          : new URLSearchParams(window.location.search);

      await requestStartupDirectoriesAccess({
        email,
        source,
        leadMagnet,
        utmSource: searchParams.get("utm_source") ?? undefined,
        utmMedium: searchParams.get("utm_medium") ?? undefined,
        utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        utmContent: searchParams.get("utm_content") ?? undefined,
        utmTerm: searchParams.get("utm_term") ?? undefined,
      });

      setSuccessMessage("Check your inbox for the full list.");
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
    <div
      className={cn(
        "relative w-full max-w-full overflow-hidden rounded-xl border border-border bg-card p-4 shadow-sm xl:max-w-[250px]",
        className,
      )}
    >
      <h3 className="relative mb-3 text-[9px] font-bold tracking-[0.18em] text-foreground/40">
        Founder resource
      </h3>
      <h4 className="relative mb-2 text-base font-black leading-tight">
        Search {startupDirectoriesMarketingCountLabel} startup directories in
        one place.
      </h4>
      <p className="relative mb-4 text-[11px] leading-relaxed text-muted-foreground">
        Get the hosted ShipBoost resource and work through founder distribution
        research faster.
      </p>

      <form onSubmit={handleSubmit} className="relative space-y-2.5">
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@startup.com"
          className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2.5 text-xs font-medium outline-none transition-all focus:border-foreground"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-primary py-2.5 text-[11px] font-black text-primary-foreground shadow-lg shadow-black/10 transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Get the directory list"}
        </button>
      </form>

      <p className="mt-3 text-[9px] font-black tracking-[0.12em] text-muted-foreground/45">
        {startupDirectoriesMarketingCountLabel} directories and launch sites.
        Access link sent by email.
      </p>

      {successMessage ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-3 py-2.5 text-[10px] font-bold text-emerald-700">
          <Check size={14} />
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-[10px] font-bold text-destructive">
          <AlertCircle size={14} />
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
