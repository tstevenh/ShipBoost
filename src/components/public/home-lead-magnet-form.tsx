"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { startupDirectoriesMarketingCountLabel } from "@/content/resources/startup-directories-meta";
import { requestStartupDirectoriesAccess } from "@/lib/startup-directories-access";

const source = "homepage_directory_list";
const leadMagnet = "startup-directories-800";

export function HomeLeadMagnetForm() {
  const searchParams = useSearchParams();
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
        utmSource: searchParams.get("utm_source") ?? undefined,
        utmMedium: searchParams.get("utm_medium") ?? undefined,
        utmCampaign: searchParams.get("utm_campaign") ?? undefined,
        utmContent: searchParams.get("utm_content") ?? undefined,
        utmTerm: searchParams.get("utm_term") ?? undefined,
      });

      setSuccessMessage(
        "Check your inbox. We sent your access link to the startup directories resource.",
      );
      setEmail("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to join the list right now.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="rounded-[2.5rem] border border-border bg-card p-10 sm:p-12 shadow-2xl shadow-black/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-muted/20 blur-3xl -mr-32 -mt-32 rounded-full" />
      
      <div className="relative">
        <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40  mb-4">
          Founder resource
        </p>
        <h2 className="text-3xl font-black tracking-tight text-foreground mb-6 ">
          Get {startupDirectoriesMarketingCountLabel} startup directories and
          launch sites in one searchable list.
        </h2>
        <p className="text-lg font-medium leading-relaxed text-muted-foreground/80 max-w-2xl mb-10">
          Use the hosted ShipBoost resource to search, sort, and plan founder
          distribution faster without bouncing between tabs, random
          spreadsheets, or low-signal lists.
        </p>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 sm:flex-row max-w-xl"
        >
          <input
            required
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@startup.com"
            className="flex-1 rounded-2xl border border-border bg-muted/20 px-6 py-4 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5"
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-primary px-10 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? "Sending..." : "Get the directory list"}
          </button>
        </form>

        <p className="mt-8 text-xs font-bold text-muted-foreground/40  tracking-widest">
          * {startupDirectoriesMarketingCountLabel} directories and launch
          sites. Searchable inside ShipBoost. Access link sent by email.
        </p>

        {successMessage ? (
          <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-6 py-4 text-sm font-bold text-emerald-700  tracking-widest flex items-center gap-3">
            <Check size={18} />
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/10 px-6 py-4 text-sm font-bold text-destructive  tracking-widest flex items-center gap-3">
            <AlertCircle size={18} />
            {errorMessage}
          </div>
        ) : null}
      </div>
    </section>
  );
}
