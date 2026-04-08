"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

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
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          source,
          leadMagnet,
          utmSource: searchParams.get("utm_source") ?? undefined,
          utmMedium: searchParams.get("utm_medium") ?? undefined,
          utmCampaign: searchParams.get("utm_campaign") ?? undefined,
          utmContent: searchParams.get("utm_content") ?? undefined,
          utmTerm: searchParams.get("utm_term") ?? undefined,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to join the list right now.");
      }

      setSuccessMessage(
        "Check your inbox. Shipboost is sending the startup directories list now.",
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
    <section className="rounded-[2rem] border border-black/10 bg-[#fff9ef] p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10">
      <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
        Free founder resource
      </p>
      <h2 className="mt-4 text-3xl font-semibold tracking-tight text-black">
        Get the 800+ startup directories list
      </h2>
      <p className="mt-4 max-w-2xl text-base leading-7 text-black/66">
        Join the Shipboost newsletter and get the directory list founders use to
        find more submission opportunities without paying for another tool.
      </p>

      <form
        onSubmit={handleSubmit}
        className="mt-8 flex flex-col gap-3 sm:flex-row"
      >
        <input
          required
          type="email"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@startup.com"
          className="w-full rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10"
        />
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Get the list"}
        </button>
      </form>

      <p className="mt-4 text-sm leading-6 text-black/58">
        Get the 800+ startup directories list plus occasional startup growth
        emails. Unsubscribe anytime.
      </p>

      {successMessage ? (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}
