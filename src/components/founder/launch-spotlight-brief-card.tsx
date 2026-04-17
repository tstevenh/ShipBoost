"use client";

import Link from "next/link";
import { useEffect, useEffectEvent, useMemo, useState } from "react";
import { ExternalLink, FileText, LoaderCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type SpotlightStatus =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY"
  | "PUBLISHED";

type SpotlightFormDraft = {
  audience: string;
  problem: string;
  differentiator: string;
  emphasis: string;
  primaryCtaUrl: string;
  founderQuote: string;
  wordingToAvoid: string;
};

type SpotlightArticleSummary = {
  slug: string;
  title: string;
} | null;

type SpotlightBriefResponse = {
  submissionId: string;
  toolName: string;
  launchDate: string | null;
  status: SpotlightStatus;
  audience: string | null;
  problem: string | null;
  differentiator: string | null;
  emphasis: string | null;
  primaryCtaUrl: string | null;
  founderQuote: string | null;
  wordingToAvoid: string | null;
  updatedAt: string;
  publishedAt: string | null;
  publishedArticle: SpotlightArticleSummary;
};

type LaunchSpotlightBriefCardProps = {
  submissionId: string;
  status: SpotlightStatus;
  initialPublishedArticle?: SpotlightArticleSummary;
  initialBrief?: SpotlightBriefResponse;
};

function emptyDraft(): SpotlightFormDraft {
  return {
    audience: "",
    problem: "",
    differentiator: "",
    emphasis: "",
    primaryCtaUrl: "",
    founderQuote: "",
    wordingToAvoid: "",
  };
}

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function toDraft(response: SpotlightBriefResponse): SpotlightFormDraft {
  return {
    audience: response.audience ?? "",
    problem: response.problem ?? "",
    differentiator: response.differentiator ?? "",
    emphasis: response.emphasis ?? "",
    primaryCtaUrl: response.primaryCtaUrl ?? "",
    founderQuote: response.founderQuote ?? "",
    wordingToAvoid: response.wordingToAvoid ?? "",
  };
}

function serializeDraft(draft: SpotlightFormDraft) {
  return JSON.stringify(draft);
}

function statusTone(status: SpotlightStatus) {
  if (status === "READY" || status === "PUBLISHED") {
    return "bg-emerald-50 text-emerald-700 border-emerald-200";
  }

  if (status === "IN_PROGRESS") {
    return "bg-amber-50 text-amber-700 border-amber-200";
  }

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function statusLabel(status: SpotlightStatus) {
  if (status === "NOT_STARTED") {
    return "Not started";
  }

  if (status === "IN_PROGRESS") {
    return "In progress";
  }

  if (status === "READY") {
    return "Ready";
  }

  return "Published";
}

async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
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

function textInputClassName() {
  return "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5 disabled:opacity-60";
}

export function LaunchSpotlightBriefCard({
  submissionId,
  status: initialStatus,
  initialPublishedArticle = null,
  initialBrief,
}: LaunchSpotlightBriefCardProps) {
  const initialDraft = initialBrief ? toDraft(initialBrief) : emptyDraft();
  const initialSavedAtLabel = initialBrief
    ? new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(initialBrief.updatedAt))
    : null;

  const [draft, setDraft] = useState<SpotlightFormDraft>(initialDraft);
  const [savedDraft, setSavedDraft] = useState<SpotlightFormDraft>(initialDraft);
  const [status, setStatus] = useState<SpotlightStatus>(
    initialBrief?.status ?? initialStatus,
  );
  const [publishedArticle, setPublishedArticle] =
    useState<SpotlightArticleSummary>(
      initialBrief?.publishedArticle ?? initialPublishedArticle,
    );
  const [toolName, setToolName] = useState<string>(
    initialBrief?.toolName ?? "your product",
  );
  const [launchDate, setLaunchDate] = useState<string | null>(
    initialBrief?.launchDate ?? null,
  );
  const [isLoading, setIsLoading] = useState(!initialBrief);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [savedAtLabel, setSavedAtLabel] = useState<string | null>(
    initialSavedAtLabel,
  );

  const isDirty = useMemo(
    () => serializeDraft(draft) !== serializeDraft(savedDraft),
    [draft, savedDraft],
  );

  const syncFromResponse = useEffectEvent((response: SpotlightBriefResponse) => {
    const nextDraft = toDraft(response);

    setDraft(nextDraft);
    setSavedDraft(nextDraft);
    setStatus(response.status);
    setPublishedArticle(response.publishedArticle);
    setToolName(response.toolName);
    setLaunchDate(response.launchDate);
    setSavedAtLabel(
      new Intl.DateTimeFormat("en", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(response.updatedAt)),
    );
  });

  useEffect(() => {
    if (initialBrief) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        setLoadError(null);
        const response = await apiRequest<SpotlightBriefResponse>(
          `/api/submissions/${submissionId}/spotlight-brief`,
        );

        if (cancelled) {
          return;
        }

        syncFromResponse(response);
      } catch (error) {
        if (!cancelled) {
          setLoadError(toErrorMessage(error));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [initialBrief, submissionId]);

  const saveDraft = useEffectEvent(async () => {
    if (status === "PUBLISHED" || isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setSaveError(null);
      const response = await apiRequest<SpotlightBriefResponse>(
        `/api/submissions/${submissionId}/spotlight-brief`,
        {
          method: "PATCH",
          body: JSON.stringify(draft),
        },
      );
      syncFromResponse(response);
    } catch (error) {
      setSaveError(toErrorMessage(error));
    } finally {
      setIsSaving(false);
    }
  });

  useEffect(() => {
    if (isLoading || !isDirty || status === "PUBLISHED") {
      return;
    }

    const timeout = window.setTimeout(() => {
      void saveDraft();
    }, 800);

    return () => window.clearTimeout(timeout);
  }, [draft, isDirty, isLoading, status]);

  const launchWindowLabel = launchDate
    ? new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(
        new Date(launchDate),
      )
    : "your scheduled launch week";

  return (
    <section className="rounded-[1.75rem] border border-border bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-primary">
              Founding bonus
            </span>
            <span
              className={cn(
                "rounded-full border px-3 py-1 text-[10px] font-black tracking-widest",
                statusTone(status),
              )}
            >
              {statusLabel(status)}
            </span>
          </div>
          <div className="space-y-2">
            <h4 className="text-lg font-black tracking-tight text-foreground">
              Editorial launch spotlight
            </h4>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground/80">
              Complete this short brief for {toolName}. ShipBoost uses it to
              publish one standardized editorial launch spotlight during{" "}
              {launchWindowLabel}. If you leave it unfinished, ShipBoost can
              still publish using your existing listing details.
            </p>
          </div>
        </div>

        <div className="min-w-[180px] space-y-2 text-sm">
          <div className="rounded-2xl border border-border bg-card px-4 py-3">
            <p className="text-[10px] font-black tracking-widest text-muted-foreground">
              Save status
            </p>
            <p className="mt-1 text-sm font-bold text-foreground">
              {isLoading
                ? "Loading brief..."
                : isSaving
                  ? "Saving draft..."
                  : saveError
                    ? "Save needs attention"
                    : isDirty
                      ? "Changes pending"
                      : "Saved"}
            </p>
            {savedAtLabel ? (
              <p className="mt-1 text-xs font-medium text-muted-foreground/70">
                Last saved {savedAtLabel}
              </p>
            ) : null}
          </div>
          {publishedArticle ? (
            <Link
              href={`/blog/${publishedArticle.slug}`}
              target="_blank"
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-xs font-black tracking-widest text-foreground transition hover:bg-background"
            >
              <FileText size={14} />
              View spotlight
              <ExternalLink size={12} />
            </Link>
          ) : null}
        </div>
      </div>

      {loadError ? (
        <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {loadError}
        </div>
      ) : null}

      {saveError ? (
        <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {saveError}
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            Who is this for?
          </span>
          <input
            value={draft.audience}
            onChange={(event) =>
              setDraft((current) => ({ ...current, audience: event.target.value }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            placeholder="Founders, operators, recruiters, agencies..."
            className={textInputClassName()}
          />
        </label>

        <label className="space-y-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            Primary CTA URL
          </span>
          <input
            value={draft.primaryCtaUrl}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                primaryCtaUrl: event.target.value,
              }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            placeholder="https://your-product.com/signup"
            className={textInputClassName()}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            What problem does it solve?
          </span>
          <textarea
            value={draft.problem}
            onChange={(event) =>
              setDraft((current) => ({ ...current, problem: event.target.value }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            rows={4}
            placeholder="Explain the problem in plain language."
            className={cn(textInputClassName(), "min-h-28 resize-y")}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            What makes it stand out?
          </span>
          <textarea
            value={draft.differentiator}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                differentiator: event.target.value,
              }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            rows={3}
            placeholder="Share the strongest one or two differentiators."
            className={cn(textInputClassName(), "min-h-24 resize-y")}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            What should ShipBoost emphasize?
          </span>
          <textarea
            value={draft.emphasis}
            onChange={(event) =>
              setDraft((current) => ({ ...current, emphasis: event.target.value }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            rows={3}
            placeholder="Tell ShipBoost what angle to lean into."
            className={cn(textInputClassName(), "min-h-24 resize-y")}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            Founder quote (optional)
          </span>
          <textarea
            value={draft.founderQuote}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                founderQuote: event.target.value,
              }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            rows={2}
            placeholder="Optional quote ShipBoost can use."
            className={cn(textInputClassName(), "min-h-20 resize-y")}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            Wording to avoid (optional)
          </span>
          <textarea
            value={draft.wordingToAvoid}
            onChange={(event) =>
              setDraft((current) => ({
                ...current,
                wordingToAvoid: event.target.value,
              }))
            }
            disabled={isLoading || status === "PUBLISHED"}
            rows={2}
            placeholder="Optional terms or framing to avoid."
            className={cn(textInputClassName(), "min-h-20 resize-y")}
          />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3 text-xs font-bold tracking-wide text-muted-foreground">
        {isSaving ? (
          <span className="inline-flex items-center gap-2 text-foreground">
            <LoaderCircle size={14} className="animate-spin" />
            Saving spotlight brief...
          </span>
        ) : (
          <span>
            Autosave is on. ShipBoost saves this brief as you work.
          </span>
        )}
        <span>
          The editorial launch spotlight is a standardized ShipBoost founder
          feature, not a custom commissioned article.
        </span>
      </div>
    </section>
  );
}
