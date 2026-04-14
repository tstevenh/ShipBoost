"use client";

import { useState } from "react";
import { AlertCircle, Check } from "lucide-react";

import { requestStartupDirectoriesAccess } from "@/lib/startup-directories-access";

const source = "homepage_sidebar_directory_list";
const leadMagnet = "startup-directories-800";

export function SidebarLeadMagnetForm() {
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
    <div className="bg-card border border-border rounded-2xl p-6 shadow-sm overflow-hidden relative">
      <h3 className="font-bold text-[10px] tracking-[0.2em] text-foreground/40 mb-4 relative">
        Founder resource
      </h3>
      <h4 className="font-black text-lg mb-3 relative leading-tight">
        Launch faster with 300+ startup directories.
      </h4>
      <p className="text-xs text-muted-foreground mb-6 leading-relaxed relative">
        Get the curated directory list ShipBoost uses to find real submission
        opportunities faster.
      </p>

      <form onSubmit={handleSubmit} className="space-y-3 relative">
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@startup.com"
          className="w-full px-4 py-3 bg-muted/20 border border-border rounded-xl text-sm font-medium outline-none focus:border-foreground transition-all"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 bg-primary text-primary-foreground text-xs font-black rounded-xl shadow-lg shadow-black/10 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50"
        >
          {isSubmitting ? "Sending..." : "Get the directory list"}
        </button>
      </form>

      <p className="mt-4 text-[10px] font-black tracking-[0.14em] text-muted-foreground/45">
        300+ directories. Access link sent by email.
      </p>

      {successMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-[11px] font-bold text-emerald-700">
          <Check size={14} />
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-[11px] font-bold text-destructive">
          <AlertCircle size={14} />
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}
