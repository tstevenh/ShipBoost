"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { ImagePlus, LoaderCircle, X } from "lucide-react";

import {
  LAUNCH_VIDEO_AVOID_NOTE_MAX_LENGTH,
  LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH,
  LAUNCH_VIDEO_HIGHLIGHT_MAX_LENGTH,
  type LaunchVideoBrief,
  type LaunchVideoScreenshot,
  type LaunchVideoScreenshotRole,
} from "@/lib/launch-video";
import { cn } from "@/lib/utils";

type BriefDraft = Pick<
  LaunchVideoBrief,
  "focusNote" | "highlightClaim" | "avoidNote" | "screenshots"
>;

const SCREENSHOT_SLOTS: Array<{ role: LaunchVideoScreenshotRole; label: string; hint: string }> = [
  { role: "before", label: "Before the action", hint: "The screen right before the click." },
  { role: "after", label: "After the action", hint: "The result your product produces." },
];

function toDraft(brief: LaunchVideoBrief): BriefDraft {
  return {
    focusNote: brief.focusNote,
    highlightClaim: brief.highlightClaim,
    avoidNote: brief.avoidNote,
    screenshots: brief.screenshots,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatSavedAt(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(value),
  );
}

async function readError(response: Response, fallback: string) {
  const payload = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof payload?.error === "string" ? payload.error : fallback;
}

function inputClassName() {
  return "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5 disabled:opacity-60";
}

function ScreenshotSlot({
  label,
  hint,
  screenshot,
  disabled,
  onUpload,
  onRemove,
}: {
  label: string;
  hint: string;
  screenshot: LaunchVideoScreenshot | undefined;
  disabled: boolean;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setIsUploading(true);
    try {
      await onUpload(file);
    } finally {
      setIsUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs font-black tracking-widest text-muted-foreground">{label}</p>
      {screenshot ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-background">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={screenshot.url} alt={label} className="aspect-video w-full object-cover" />
          {!disabled ? (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${label.toLowerCase()} screenshot`}
              className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled || isUploading}
          onClick={() => inputRef.current?.click()}
          className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background text-xs font-bold text-muted-foreground transition hover:border-foreground/40 hover:text-foreground disabled:opacity-60"
        >
          {isUploading ? (
            <LoaderCircle size={18} className="animate-spin" />
          ) : (
            <ImagePlus size={18} />
          )}
          {isUploading ? "Uploading..." : "Upload screenshot"}
        </button>
      )}
      <p className="text-xs text-muted-foreground">{hint}</p>
      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />
    </div>
  );
}

export function LaunchVideoBriefCard({ initialBrief }: { initialBrief: LaunchVideoBrief }) {
  const [brief, setBrief] = useState(initialBrief);
  const [draft, setDraft] = useState<BriefDraft>(() => toDraft(initialBrief));
  const [savedDraft, setSavedDraft] = useState<BriefDraft>(() => toDraft(initialBrief));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = brief.status === "DELIVERED";
  const isDirty = useMemo(
    () => JSON.stringify(draft) !== JSON.stringify(savedDraft),
    [draft, savedDraft],
  );
  const deliveryLabel = brief.standalone
    ? `Due by ${brief.deliverBy ? formatDate(brief.deliverBy) : "7 days after your order"}`
    : `Delivered during your launch week of ${formatDate(brief.launchWeekStart)}`;

  const saveDraft = useEffectEvent(async () => {
    if (locked || isSaving) return;

    setIsSaving(true);
    setError(null);
    const sent = draft;
    try {
      const response = await fetch(`/api/submissions/${brief.submissionId}/launch-video-brief`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sent),
      });
      if (!response.ok) {
        throw new Error(await readError(response, "Could not save the brief."));
      }
      const payload = (await response.json()) as { data: LaunchVideoBrief };
      setBrief(payload.data);
      setSavedDraft(sent);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the brief.");
    } finally {
      setIsSaving(false);
    }
  });

  // Re-runs when a save finishes, so edits typed during that save are saved next.
  useEffect(() => {
    if (!isDirty || locked || isSaving) return;
    const timeout = window.setTimeout(() => void saveDraft(), 800);
    return () => window.clearTimeout(timeout);
  }, [draft, isDirty, locked, isSaving]);

  async function uploadScreenshot(role: LaunchVideoScreenshotRole, file: File) {
    setError(null);
    const formData = new FormData();
    formData.append("screenshots", file);
    const response = await fetch("/api/submissions/media", { method: "POST", body: formData });
    if (!response.ok) {
      setError(await readError(response, "Could not upload the screenshot."));
      return;
    }
    const payload = (await response.json()) as {
      data: { screenshots: Array<{ url: string; publicId: string }> };
    };
    const uploaded = payload.data.screenshots[0];
    if (!uploaded) return;
    setDraft((current) => ({
      ...current,
      screenshots: [
        ...current.screenshots.filter((shot) => shot.role !== role),
        { role, url: uploaded.url, publicId: uploaded.publicId },
      ],
    }));
  }

  function removeScreenshot(role: LaunchVideoScreenshotRole) {
    setDraft((current) => ({
      ...current,
      screenshots: current.screenshots.filter((shot) => shot.role !== role),
    }));
  }

  return (
    <section className="rounded-[1.75rem] border border-border bg-muted/30 p-5 sm:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <span
            className={cn(
              "inline-block rounded-full border px-3 py-1 text-[10px] font-black tracking-widest",
              locked
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : "border-border bg-card text-foreground",
            )}
          >
            {locked ? "Delivered" : deliveryLabel}
          </span>
          <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground/80">
            {locked
              ? "This video has been delivered. The brief below is what we worked from."
              : "We build the video from your site, your listing and this brief. Every field is optional."}
          </p>
        </div>
        <div className="min-w-[180px] rounded-2xl border border-border bg-card px-4 py-3 text-sm">
          <p className="text-[10px] font-black tracking-widest text-muted-foreground">
            Save status
          </p>
          <p className="mt-1 text-sm font-bold text-foreground">
            {isSaving
              ? "Saving..."
              : error
                ? "Save needs attention"
                : isDirty
                  ? "Changes pending"
                  : brief.briefUpdatedAt
                    ? "Saved"
                    : "Not started"}
          </p>
          {brief.briefUpdatedAt ? (
            <p className="mt-1 text-xs font-medium text-muted-foreground/70">
              Last saved {formatSavedAt(brief.briefUpdatedAt)}
            </p>
          ) : null}
        </div>
      </div>

      {error ? (
        <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-bold text-destructive">
          {error}
        </div>
      ) : null}

      <div className="mt-5 space-y-6">
        <label className="block space-y-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            What should people see your product do?
          </span>
          <input
            value={draft.focusNote}
            maxLength={LAUNCH_VIDEO_FOCUS_NOTE_MAX_LENGTH}
            disabled={locked}
            onChange={(event) =>
              setDraft((current) => ({ ...current, focusNote: event.target.value }))
            }
            placeholder="Example: upload a CSV and get a clean chart back"
            className={inputClassName()}
          />
          <span className="block text-xs text-muted-foreground">
            One action and its result. The whole video is built around it.
          </span>
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {SCREENSHOT_SLOTS.map((slot) => (
            <ScreenshotSlot
              key={slot.role}
              label={slot.label}
              hint={slot.hint}
              screenshot={draft.screenshots.find((shot) => shot.role === slot.role)}
              disabled={locked}
              onUpload={(file) => uploadScreenshot(slot.role, file)}
              onRemove={() => removeScreenshot(slot.role)}
            />
          ))}
        </div>
        <p className="-mt-3 text-xs text-muted-foreground">
          PNG, JPEG or WebP, up to 8MB. Use these when your site does not show the product in
          action, so the video shows your real interface.
        </p>

        <label className="block space-y-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            One number or claim to show
          </span>
          <input
            value={draft.highlightClaim}
            maxLength={LAUNCH_VIDEO_HIGHLIGHT_MAX_LENGTH}
            disabled={locked}
            onChange={(event) =>
              setDraft((current) => ({ ...current, highlightClaim: event.target.value }))
            }
            placeholder="Example: 2,000 teams use it"
            className={inputClassName()}
          />
          <span className="block text-xs text-muted-foreground">
            It appears on screen, so only what is true today.
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-xs font-black tracking-widest text-muted-foreground">
            Anything we should not show?
          </span>
          <textarea
            value={draft.avoidNote}
            maxLength={LAUNCH_VIDEO_AVOID_NOTE_MAX_LENGTH}
            disabled={locked}
            rows={3}
            onChange={(event) =>
              setDraft((current) => ({ ...current, avoidNote: event.target.value }))
            }
            placeholder="Unreleased features, old pricing, wording you avoid"
            className={cn(inputClassName(), "min-h-24 resize-y")}
          />
        </label>
      </div>

      {!locked ? (
        <p className="mt-5 text-xs font-bold tracking-wide text-muted-foreground">
          {isSaving ? (
            <span className="inline-flex items-center gap-2 text-foreground">
              <LoaderCircle size={14} className="animate-spin" />
              Saving brief...
            </span>
          ) : (
            "Autosave is on. Style, music and length are fixed by the format, so there is nothing to choose there."
          )}
        </p>
      ) : null}
    </section>
  );
}
