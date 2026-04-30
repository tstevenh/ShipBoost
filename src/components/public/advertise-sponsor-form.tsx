"use client";

import { useState } from "react";
import { ArrowRight, Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";

type EligibleTool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  sponsorPlacements: Array<{ id: string; endsAt: string | null }>;
};

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

async function apiRequest<T>(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }

  return payload?.data as T;
}

export function AdvertiseSponsorForm({
  tools,
  soldOut,
}: {
  tools: EligibleTool[];
  soldOut: boolean;
}) {
  const [selectedToolId, setSelectedToolId] = useState(tools[0]?.id ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const selectedTool =
    tools.find((tool) => tool.id === selectedToolId) ?? tools[0] ?? null;

  async function startCheckout() {
    if (!selectedToolId || soldOut) {
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const response = await apiRequest<{ checkoutUrl: string }>(
        "/api/dodo/checkout/sponsor-placement",
        {
          method: "POST",
          body: JSON.stringify({ toolId: selectedToolId }),
        },
      );
      window.location.href = response.checkoutUrl;
    } catch (checkoutError) {
      setError(toErrorMessage(checkoutError));
      setLoading(false);
    }
  }

  if (soldOut) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-black text-foreground">
          Sponsor placements are sold out right now.
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
          Only three tools can be sponsored at the same time. Check back when a
          placement expires.
        </p>
      </div>
    );
  }

  if (tools.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <p className="text-sm font-black text-foreground">
          No eligible tools yet.
        </p>
        <p className="mt-2 text-sm font-semibold leading-relaxed text-muted-foreground">
          Approved live tools and approved scheduled launch tools can buy a
          sponsor placement. If your tool is still waiting for review, finish
          that first and come back here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-black tracking-tight text-foreground">
          Reserve your sponsor slot
        </h2>
        <p className="mt-1 text-sm font-semibold leading-relaxed text-muted-foreground">
          Pick the approved tool you want to promote. Your 30-day placement
          starts as soon as payment is confirmed.
        </p>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-black tracking-widest text-muted-foreground">
          Select tool
        </p>
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((current) => !current)}
            className="flex w-full items-center justify-between gap-4 rounded-xl border border-border bg-background px-4 py-3 text-left shadow-sm transition-colors hover:border-foreground/30"
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-black text-foreground">
                {selectedTool?.name ?? "Choose a tool"}
              </span>
              <span className="mt-1 block truncate text-xs font-semibold text-muted-foreground">
                {selectedTool?.tagline ?? "Pick the product you want to promote"}
              </span>
            </span>
            <ChevronDown
              size={17}
              className="shrink-0 text-muted-foreground"
            />
          </button>

          {dropdownOpen ? (
            <div
              role="listbox"
              className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-card p-2 shadow-xl shadow-black/10"
            >
              {tools.map((tool) => {
                const selected = tool.id === selectedToolId;

                return (
                  <button
                    key={tool.id}
                    type="button"
                    role="option"
                    aria-selected={selected}
                    onClick={() => {
                      setSelectedToolId(tool.id);
                      setDropdownOpen(false);
                    }}
                    className="flex w-full items-start justify-between gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-black text-foreground">
                        {tool.name}
                      </span>
                      <span className="mt-1 block line-clamp-2 text-xs font-semibold leading-relaxed text-muted-foreground">
                        {tool.tagline}
                      </span>
                    </span>
                    {selected ? (
                      <Check size={16} className="mt-0.5 shrink-0 text-primary" />
                    ) : null}
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>
      {error ? (
        <p className="text-sm font-semibold text-destructive">{error}</p>
      ) : null}
      <Button
        type="button"
        onClick={startCheckout}
        disabled={loading || !selectedToolId}
        className="w-full gap-2 sm:w-auto"
      >
        {loading ? "Opening checkout..." : "Buy 30-day placement for $59"}
        <ArrowRight size={15} />
      </Button>
    </div>
  );
}
