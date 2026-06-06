"use client";

import { useState, useEffect, useRef } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowLeft,
  Check,
  X,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdPreviewButton } from "@/components/public/ad-preview-modal";
import {
  FreeLaunchRequirementsPanel,
  type BadgePreviewOption,
} from "@/components/founder/free-launch-requirements-panel";
import type { SponsorEligibilitySlot } from "@/app/api/sponsor/eligibility/route";
import type { SponsorSlot } from "@prisma/client";
import type { FreeLaunchRequirements } from "@/server/services/free-launch-requirements";

type PremiumLaunchWeek = { value: string; label: string };

type ScheduledLaunch = {
  id: string;
  launchType: "FREE" | "FEATURED";
  status: string;
  launchDate: string;
};

type SavedSubmission = {
  id: string;
  toolId?: string;
  submissionType: string;
  reviewStatus: string;
  paymentStatus: string;
  badgeVerification: string;
};

export type LaunchSectionProps = {
  submissionId: string;
  toolId: string | null;
  freeLaunchEstimateDate: string | null;
  premiumLaunchWeeks: PremiumLaunchWeek[];
  foundingPremiumSpotsLeft: number;
  foundingPremiumLaunchLimit: number;
  currentScheduledLaunch: ScheduledLaunch | null;
  isPremiumScheduled: boolean;
  isFreeScheduled: boolean;
  onBack: () => void;
  onFreeScheduled: (launch: ScheduledLaunch, submission: SavedSubmission) => void;
  badges: BadgePreviewOption[];
  freeLaunchRequirements: FreeLaunchRequirements | null;
};

const PREMIUM_FEATURES = [
  "Hand-written editorial article about your product on the ShipBoost blog",
  "Reserve a specific launch week (you pick the date)",
  "Featured placement on the launchboard that week",
  "Indexed in category and tag pages",
  "Guaranteed dofollow link from your listing and editorial article",
];

const FREE_FEATURES = [
  "One week on the launchboard",
  "Permanent public listing",
  "Indexed in category and tag pages",
  "Public listing with a link to your site",
];

const FREE_NOT_INCLUDED = [
  "Reserved launch week",
  "Hand-written editorial article on the ShipBoost blog",
  "Guaranteed dofollow link",
];

const SLOT_FEATURES: Record<string, string[]> = {
  SIDEBAR: [
    "Highest impression rate of any slot",
    "Best for tools targeting active builders",
    "30 days across all discovery pages",
    "Full product card with logo, title & tagline",
    "Sponsored badge for trust & credibility",
    "Limited spots for exclusivity",
  ],
  INLINE_BANNER: [
    "Full-width in-feed placement",
    "High first-visit visibility",
    "30 days featured in the launchboard",
    "Full product card with logo, title & tagline",
    "Exclusive — 1 sponsor at a time",
  ],
  INLINE_PRODUCT: [
    "Highest-intent audience on ShipBoost",
    "30 days in the launchboard feed",
    "Full product card with logo, title & tagline",
    "Founders actively evaluating tools",
    "Limited to 2 slots for exclusivity",
  ],
};

function WeekDropdown({
  weeks,
  value,
  onChange,
}: {
  weeks: PremiumLaunchWeek[];
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = weeks.find((w) => w.value === value) ?? weeks[0];

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground transition hover:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span>{selected?.label ?? "Select a week"}</span>
        <ChevronDown
          size={16}
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-50 max-h-64 overflow-y-auto rounded-2xl border border-border bg-card shadow-xl">
          {weeks.map((week) => (
            <button
              key={week.value}
              type="button"
              onClick={() => {
                onChange(week.value);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-muted/60",
                week.value === value
                  ? "text-primary font-semibold"
                  : "text-foreground",
              )}
            >
              {week.value === value && (
                <Check size={13} strokeWidth={3} className="shrink-0 text-primary" />
              )}
              <span className={week.value === value ? "" : "ml-[21px]"}>{week.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function getDaysFromNow(dateStr: string): number {
  const target = new Date(dateStr);
  const now = new Date();
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatEstimatedSlot(dateStr: string): string {
  const days = getDaysFromNow(dateStr);
  const formatted = new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `~${days} days from now · ${formatted}`;
}

export function LaunchSection({
  submissionId,
  toolId,
  freeLaunchEstimateDate,
  premiumLaunchWeeks,
  foundingPremiumSpotsLeft,
  foundingPremiumLaunchLimit,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  currentScheduledLaunch: _currentScheduledLaunch,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isPremiumScheduled: _isPremiumScheduled,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  isFreeScheduled: _isFreeScheduled,
  onBack,
  onFreeScheduled,
  badges,
  freeLaunchRequirements,
}: LaunchSectionProps) {
  const [selectedLaunch, setSelectedLaunch] = useState<"FREE" | "FEATURED">("FEATURED");
  const [preferredDate, setPreferredDate] = useState<string>(
    premiumLaunchWeeks[0]?.value ?? "",
  );
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [expandedSlot, setExpandedSlot] = useState<string | null>(null);
  const [slots, setSlots] = useState<SponsorEligibilitySlot[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [freeRequirementsMet, setFreeRequirementsMet] = useState(false);
  const requirementsRef = useRef<HTMLDivElement>(null);
  const [shakeRequirements, setShakeRequirements] = useState(false);
  // The server only passes requirements when the draft id is in the URL. During
  // the fresh submit flow the id lives in client state, so fetch them by id.
  const [requirements, setRequirements] = useState(freeLaunchRequirements);

  useEffect(() => {
    if (selectedLaunch !== "FREE" || !submissionId || requirements) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await fetch(`/api/submissions/${submissionId}/requirements`);
        if (!res.ok) return;
        const payload = await res.json();
        if (!cancelled) setRequirements(payload.data);
      } catch {
        // Panel stays hidden; the server-side schedule gate still enforces the rules.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedLaunch, submissionId, requirements]);

  useEffect(() => {
    if (!toolId) return;
    fetch("/api/sponsor/eligibility")
      .then((r) => r.json())
      .then((data) => {
        if (data?.data?.slots) setSlots(data.data.slots as SponsorEligibilitySlot[]);
      })
      .catch(() => {});
  }, [toolId]);

  function toggleSlot(slot: string) {
    setSelectedSlots((prev) =>
      prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot],
    );
  }

  const selectedSponsorPrice = slots
    .filter((s) => selectedSlots.includes(s.slot))
    .reduce((sum, s) => sum + s.priceUsd, 0);

  const premiumPrice = foundingPremiumSpotsLeft > 0 ? 9 : 19;
  const premiumCompareAt = foundingPremiumSpotsLeft > 0 ? 19 : 29;
  const totalPrice =
    selectedLaunch === "FEATURED"
      ? premiumPrice + selectedSponsorPrice
      : selectedSponsorPrice;

  async function handleConfirm() {
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/dodo/checkout/launch-bundle", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          submissionId,
          launchType: selectedLaunch,
          preferredLaunchDate: selectedLaunch === "FEATURED" ? preferredDate : undefined,
          sponsorSlots: selectedSlots,
        }),
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error((payload?.error as string | undefined) ?? "Something went wrong.");
      }

      const data = payload.data as {
        checkoutUrl: string | null;
        launchScheduled: boolean;
        scheduledLaunch: ScheduledLaunch | null;
        submission: SavedSubmission | null;
      };

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      if (data.launchScheduled && data.scheduledLaunch && data.submission) {
        onFreeScheduled(data.scheduledLaunch, data.submission);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  const spotsLabel =
    foundingPremiumSpotsLeft > 0
      ? `${foundingPremiumSpotsLeft} of ${foundingPremiumLaunchLimit} founding spots left`
      : "Early access pricing — rising to $29 soon";

  const isConfirmDisabled =
    isLoading || (selectedLaunch === "FEATURED" && !preferredDate);

  const freeBlocked = selectedLaunch === "FREE" && !freeRequirementsMet;

  function handleScheduleClick() {
    if (freeBlocked) {
      requirementsRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      setShakeRequirements(true);
      window.setTimeout(() => setShakeRequirements(false), 700);
      return;
    }
    void handleConfirm();
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft size={16} />
          Back
        </button>
      </div>

      {errorMessage && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-medium text-destructive">
          {errorMessage}
        </div>
      )}

      {/* Launch tier cards */}
      <div>
        <p className="mb-4 text-[10px] font-black tracking-[0.3em] text-foreground/40">
          Launch plans
        </p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Premium card */}
          <button
            type="button"
            onClick={() => setSelectedLaunch("FEATURED")}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-card p-7 text-left transition-all",
              selectedLaunch === "FEATURED"
                ? "border-primary ring-4 ring-primary/5"
                : "border-border hover:border-primary/40",
            )}
          >
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-primary px-4 py-1 text-[10px] font-black tracking-widest text-primary-foreground shadow-lg shadow-black/20">
              {selectedLaunch === "FEATURED" ? "Selected ✓" : "Recommended"}
            </div>
            <div className="flex items-center justify-between">
              <p className={cn(
                "text-[10px] font-black tracking-[0.2em]",
                selectedLaunch === "FEATURED" ? "text-primary" : "text-foreground/40",
              )}>
                Premium launch
              </p>
            </div>
            <div className="mt-5 flex items-end gap-3">
              <span className="text-xl font-black text-muted-foreground line-through">${premiumCompareAt}</span>
              <span className="text-5xl font-black tracking-tighter text-foreground">
                ${premiumPrice}
              </span>
              <span className="pb-1 text-sm font-bold text-muted-foreground">/ launch</span>
            </div>
            {spotsLabel && (
              <p className="mt-1.5 text-[10px] font-black tracking-widest text-primary">
                {spotsLabel}
              </p>
            )}
            <ul className="mt-6 flex-1 space-y-3">
              {PREMIUM_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-foreground/70">
                  <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </button>

          {/* Free card */}
          <button
            type="button"
            onClick={() => setSelectedLaunch("FREE")}
            className={cn(
              "relative flex flex-col rounded-3xl border bg-card p-7 text-left transition-all",
              selectedLaunch === "FREE"
                ? "border-border ring-2 ring-border"
                : "border-border hover:border-border/80",
            )}
          >
            {selectedLaunch === "FREE" && (
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-card px-4 py-1 text-[10px] font-black tracking-widest text-foreground shadow-sm">
                Selected ✓
              </div>
            )}
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-black tracking-[0.2em] text-foreground/40">
                Free launch
              </p>
            </div>
            <div className="mt-5">
              <span className="text-5xl font-black tracking-tighter text-foreground">$0</span>
              <span className="ml-2 text-sm font-bold text-muted-foreground">forever</span>
            </div>

            {freeLaunchEstimateDate && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground">
                <Calendar size={12} className="shrink-0" />
                <span>{formatEstimatedSlot(freeLaunchEstimateDate)}</span>
              </div>
            )}

            <ul className="mt-6 flex-1 space-y-3">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-foreground/70">
                  <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
              {FREE_NOT_INCLUDED.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm font-medium text-muted-foreground/50">
                  <X size={13} strokeWidth={3} className="mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li>• Add the ShipBoost badge to your site and verify it</li>
              <li>• Upvote 3 other launches this week</li>
            </ul>
          </button>
        </div>
      </div>

      {/* Premium date picker — always show when FEATURED selected */}
      {selectedLaunch === "FEATURED" && (
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="mb-3 text-[10px] font-black tracking-[0.2em] text-foreground/40">
            Launch week
          </p>
          {premiumLaunchWeeks.length > 0 ? (
            <WeekDropdown
              weeks={premiumLaunchWeeks}
              value={preferredDate}
              onChange={setPreferredDate}
            />
          ) : (
            <p className="text-sm font-medium text-muted-foreground">
              No launch weeks available right now. Check back soon.
            </p>
          )}
        </div>
      )}

      {/* Sponsor add-ons */}
      {slots.length > 0 && (
        <div>
          <p className="mb-4 text-[10px] font-black tracking-[0.3em] text-foreground/40">
            Sponsor placements
          </p>
          <p className="mb-4 text-sm font-medium text-muted-foreground">
            Reach founders who are actively evaluating tools. Optional — added at checkout.
          </p>

          <div className="space-y-3">
            {slots.map((slotInfo) => {
              const isSelected = selectedSlots.includes(slotInfo.slot);
              const isExpanded = expandedSlot === slotInfo.slot;
              const features = SLOT_FEATURES[slotInfo.slot] ?? [];

              return (
                <div
                  key={slotInfo.slot}
                  className={cn(
                    "rounded-2xl border transition-all",
                    isSelected
                      ? "border-primary ring-2 ring-primary/5"
                      : "border-border",
                    slotInfo.soldOut && "opacity-50",
                  )}
                >
                  <div className="flex items-center gap-3 p-4">
                    <input
                      type="checkbox"
                      id={`slot-${slotInfo.slot}`}
                      checked={isSelected}
                      disabled={slotInfo.soldOut}
                      onChange={() => toggleSlot(slotInfo.slot)}
                      className="h-4 w-4 rounded border-border accent-primary"
                    />
                    <label
                      htmlFor={`slot-${slotInfo.slot}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-black text-foreground">
                          {slotInfo.label}
                        </span>
                        {slotInfo.soldOut && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-black text-muted-foreground">
                            SOLD OUT
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                        {slotInfo.description}
                      </p>
                    </label>
                    <div className="flex shrink-0 items-center gap-3">
                      <div className="text-right">
                        <span className="text-sm font-black text-foreground">
                          ${slotInfo.priceUsd}
                        </span>
                        <span className="text-xs font-medium text-muted-foreground"> / 30 days</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpandedSlot(isExpanded ? null : slotInfo.slot)}
                        aria-label={`${isExpanded ? "Hide" : "Show"} details for ${slotInfo.label}`}
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-border px-4 pb-5 pt-4">
                      <ul className="space-y-2">
                        {features.map((f) => (
                          <li
                            key={f}
                            className="flex items-start gap-2.5 text-sm font-medium text-foreground/70"
                          >
                            <Check size={13} strokeWidth={3} className="mt-0.5 shrink-0 text-primary" />
                            {f}
                          </li>
                        ))}
                      </ul>
                      <div className="mt-4 flex items-center justify-between">
                        <p className="text-xs font-medium text-muted-foreground">
                          {slotInfo.inventoryCap - slotInfo.activeCount} of {slotInfo.inventoryCap} spots open
                        </p>
                        <AdPreviewButton
                          slot={slotInfo.slot as SponsorSlot as "INLINE_PRODUCT" | "INLINE_BANNER" | "SIDEBAR"}
                          className={cn(
                            slotInfo.slot === "SIDEBAR" ? "text-primary/60 hover:text-primary" : undefined,
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Free-launch requirements — below sponsor so founders see placements first */}
      {selectedLaunch === "FREE" && requirements ? (
        <div ref={requirementsRef} className={shakeRequirements ? "sb-shake" : undefined}>
          <FreeLaunchRequirementsPanel
            submissionId={submissionId}
            badges={badges}
            initialBadgeVerification={requirements.badgeVerification}
            tools={requirements.boardTools}
            initialEligibleCount={requirements.eligibleCount}
            requiredCount={requirements.requiredCount}
            onRequirementsMet={setFreeRequirementsMet}
          />
        </div>
      ) : null}

      {/* Total + CTA */}
      <div className="sticky bottom-0 rounded-2xl border border-border bg-card/95 p-4 shadow-lg backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted-foreground">
            {selectedLaunch === "FEATURED" ? "Premium Launch" : "Free Launch"}
            {selectedSlots.length > 0
              ? ` + ${selectedSlots.length} placement${selectedSlots.length > 1 ? "s" : ""}`
              : ""}
          </span>
          <span className="text-lg font-black text-foreground">
            {totalPrice === 0 ? "Free" : `$${totalPrice}`}
          </span>
        </div>
        <button
          type="button"
          onClick={handleScheduleClick}
          disabled={isConfirmDisabled}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-black text-primary-foreground shadow-xl shadow-black/20 transition hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:active:scale-100"
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : selectedLaunch === "FREE" && selectedSlots.length === 0 ? (
            "Schedule free launch"
          ) : (
            `Continue to checkout — ${totalPrice === 0 ? "Free" : `$${totalPrice}`}`
          )}
        </button>
        {selectedLaunch === "FREE" && !freeRequirementsMet ? (
          <p className="mt-2 text-center text-xs text-muted-foreground">
            Verify your badge and support {requirements?.requiredCount ?? 3} fellow founders to continue.
          </p>
        ) : null}
      </div>
    </div>
  );
}
