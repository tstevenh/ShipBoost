"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Megaphone,
  Sparkles,
  Users,
  X,
} from "lucide-react";

import { cn } from "@/lib/utils";
import type { SponsorEligibilityResponse } from "@/app/api/sponsor/eligibility/route";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { captureBrowserPostHogEvent } from "@/lib/posthog-browser";
import type { SponsorSlot } from "@prisma/client";

const SLOT_LABELS: Record<SponsorSlot, string> = {
  SIDEBAR: "Sidebar",
  INLINE_BANNER: "Banner",
  INLINE_PRODUCT: "Product ad",
};

const SLOT_DESCRIPTIONS: Record<SponsorSlot, string> = {
  SIDEBAR:
    "Your product card cycles in the high-attention sidebar slot across all discovery pages — homepage, categories, tags, and launchboards — for 30 days.",
  INLINE_BANNER:
    "An animated inline banner injected in the launchboard feed. Prominent placement that stops the scroll.",
  INLINE_PRODUCT:
    "A native-style product row in the launchboard feed. Looks like an organic listing — founders actually read it.",
};

const SPONSOR_SLOTS = new Set<SponsorSlot>([
  "SIDEBAR",
  "INLINE_BANNER",
  "INLINE_PRODUCT",
]);

type SponsorAdvertiseModalProps = {
  slot: SponsorSlot;
  triggerClassName?: string;
  triggerContent: React.ReactNode;
};

type EligibilityState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "loaded"; data: SponsorEligibilityResponse }
  | { kind: "error"; message: string };

function toErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Something went wrong.";
}

export function readSponsorSlotParam(value: string | null): SponsorSlot | null {
  return value && SPONSOR_SLOTS.has(value as SponsorSlot)
    ? (value as SponsorSlot)
    : null;
}

export function shouldAutoOpenSponsorModal(
  slot: SponsorSlot,
  searchParams: Pick<URLSearchParams, "get"> | null | undefined,
) {
  if (!searchParams) return false;

  const sponsorState = searchParams.get("sponsor");
  if (sponsorState === "success" || sponsorState === "error") {
    return (readSponsorSlotParam(searchParams.get("placement_slot")) ?? "SIDEBAR") === slot;
  }

  if (searchParams.get("advertise") === "1") {
    return (readSponsorSlotParam(searchParams.get("advertise_slot")) ?? "SIDEBAR") === slot;
  }

  return false;
}

export function SponsorAdvertiseModal({
  slot,
  triggerClassName,
  triggerContent,
}: SponsorAdvertiseModalProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  useBodyScrollLock(isOpen);
  const [eligibility, setEligibility] = useState<EligibilityState>({
    kind: "idle",
  });
  const [selectedToolId, setSelectedToolId] = useState<string>("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const sponsorSuccess = searchParams?.get("sponsor") === "success";
  const sponsorError = searchParams?.get("sponsor") === "error";
  const placementStatus = searchParams?.get("placement_status");
  const placementSlot = searchParams?.get("placement_slot") as SponsorSlot | null;

  const successMessage = sponsorSuccess
    ? placementStatus === "ACTIVE"
      ? `Payment received. Your ${placementSlot ? SLOT_LABELS[placementSlot] : "sponsor"} placement is active.`
      : placementStatus === "PAID_WAITLISTED"
        ? "Payment received. Your placement is reserved and will start when a slot opens."
        : "Payment received. Your placement is being set up and will appear shortly."
    : null;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (shouldAutoOpenSponsorModal(slot, searchParams)) setIsOpen(true);
  }, [searchParams, slot]);

  useEffect(() => {
    if (!isOpen) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") closeAndCleanUrl();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (eligibility.kind === "loading" || eligibility.kind === "loaded") return;
    setEligibility({ kind: "loading" });
    fetch("/api/sponsor/eligibility", { cache: "no-store" })
      .then(async (response) => {
        const payload = (await response.json().catch(() => null)) as
          | { data?: SponsorEligibilityResponse; error?: string }
          | null;
        if (!response.ok || !payload?.data) {
          throw new Error(payload?.error ?? "Could not load eligibility.");
        }
        setEligibility({ kind: "loaded", data: payload.data });
        const first = payload.data.tools.find(
          (t) => !t.activeSlots.includes(slot),
        );
        if (first) setSelectedToolId(first.id);
      })
      .catch((error) =>
        setEligibility({ kind: "error", message: toErrorMessage(error) }),
      );
  }, [isOpen, eligibility.kind, slot]);

  function closeAndCleanUrl() {
    setIsOpen(false);
    if (!searchParams) return;
    const next = new URLSearchParams(searchParams.toString());
    let mutated = false;
    for (const key of [
      "advertise",
      "advertise_slot",
      "sponsor",
      "status",
      "placement_status",
      "placement_slot",
    ]) {
      if (next.has(key)) {
        next.delete(key);
        mutated = true;
      }
    }
    if (mutated) {
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  }

  async function startCheckout() {
    if (eligibility.kind !== "loaded") return;
    if (!selectedToolId) return;
    setCheckoutError(null);
    setIsCheckingOut(true);
    try {
      const response = await fetch("/api/dodo/checkout/sponsor-placement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toolId: selectedToolId, slot }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { data?: { checkoutUrl: string }; error?: string }
        | null;
      if (!response.ok || !payload?.data?.checkoutUrl) {
        throw new Error(payload?.error ?? "Could not open checkout.");
      }
      captureBrowserPostHogEvent("sponsor_placement_checkout_started", {
        tool_id: selectedToolId,
        sponsor_slot: slot,
        source_surface: "sponsor_modal",
      });
      window.location.href = payload.data.checkoutUrl;
    } catch (error) {
      setCheckoutError(toErrorMessage(error));
      setIsCheckingOut(false);
    }
  }

  const selectedTool = useMemo(() => {
    if (eligibility.kind !== "loaded") return null;
    return (
      eligibility.data.tools.find((tool) => tool.id === selectedToolId) ?? null
    );
  }, [eligibility, selectedToolId]);

  const slotData = useMemo(() => {
    if (eligibility.kind !== "loaded") return null;
    return eligibility.data.slots.find((s) => s.slot === slot) ?? null;
  }, [eligibility, slot]);

  const modal =
    isOpen && isMounted
      ? createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sponsor-advertise-title"
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
            onClick={closeAndCleanUrl}
          >
            <div
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-black/20"
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close advertise details"
                onClick={closeAndCleanUrl}
                className="absolute right-4 top-4 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                <X size={14} />
              </button>

              <div className="max-h-[85vh] overflow-y-auto p-6 sm:p-7">
                {/* Header */}
                <div className="pr-10">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                    {SLOT_LABELS[slot]} placement
                  </p>
                  <h3
                    id="sponsor-advertise-title"
                    className="mt-2 text-2xl font-bold tracking-tight text-foreground"
                  >
                    Advertise on ShipBoost
                  </h3>
                  <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                    {SLOT_DESCRIPTIONS[slot]}
                  </p>
                </div>

                {/* Success / error banners */}
                {successMessage ? (
                  <div className="mt-5 flex items-start gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-[13px] font-medium leading-snug text-emerald-700">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                    {successMessage}
                  </div>
                ) : null}
                {sponsorError ? (
                  <div className="mt-5 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-[13px] font-medium leading-snug text-destructive">
                    We couldn&apos;t finish syncing your payment. If the charge
                    succeeded, it&apos;ll appear in your dashboard within a
                    minute.
                  </div>
                ) : null}

                {/* Metric chips */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      <Users size={12} />
                      Reach
                    </div>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                      Founders &amp; buyers
                    </p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      {slot === "SIDEBAR"
                        ? "Every discovery page"
                        : "Launchboard feed"}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border/70 bg-card p-3">
                    <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
                      <CalendarDays size={12} />
                      Pricing
                    </div>
                    <p className="mt-1.5 text-xl font-bold tracking-tight text-foreground">
                      {slotData ? `$${slotData.priceUsd}` : "—"}
                    </p>
                    <p className="text-[11px] font-normal text-muted-foreground">
                      Flat · 30 days
                    </p>
                  </div>
                </div>

                {/* Inventory badge */}
                {slotData && !slotData.soldOut ? (
                  <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                    {slotData.inventoryCap - slotData.activeCount} of{" "}
                    {slotData.inventoryCap} slots open
                  </div>
                ) : null}

                {/* Action area */}
                <div className="mt-6">
                  <SlotActionArea
                    slot={slot}
                    slotData={slotData}
                    eligibility={eligibility}
                    selectedToolId={selectedToolId}
                    selectedTool={selectedTool}
                    setSelectedToolId={(id) => {
                      setSelectedToolId(id);
                      setDropdownOpen(false);
                    }}
                    dropdownOpen={dropdownOpen}
                    setDropdownOpen={setDropdownOpen}
                    checkoutError={checkoutError}
                    isCheckingOut={isCheckingOut}
                    onCheckout={startCheckout}
                    onCloseModal={closeAndCleanUrl}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={triggerClassName}
        aria-label={`Advertise on ShipBoost — ${SLOT_LABELS[slot]} placement`}
      >
        {triggerContent}
      </button>
      {modal}
    </>
  );
}

function SlotActionArea({
  slot,
  slotData,
  eligibility,
  selectedToolId,
  selectedTool,
  setSelectedToolId,
  dropdownOpen,
  setDropdownOpen,
  checkoutError,
  isCheckingOut,
  onCheckout,
  onCloseModal,
}: {
  slot: SponsorSlot;
  slotData: SponsorEligibilityResponse["slots"][number] | null;
  eligibility: EligibilityState;
  selectedToolId: string;
  selectedTool: SponsorEligibilityResponse["tools"][number] | null;
  setSelectedToolId: (id: string) => void;
  dropdownOpen: boolean;
  setDropdownOpen: (next: boolean) => void;
  checkoutError: string | null;
  isCheckingOut: boolean;
  onCheckout: () => void;
  onCloseModal: () => void;
}) {
  if (eligibility.kind === "idle" || eligibility.kind === "loading") {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-border/60 bg-card py-4 text-sm font-medium text-muted-foreground">
        <Loader2 size={14} className="animate-spin" />
        Loading your tools…
      </div>
    );
  }

  if (eligibility.kind === "error") {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-3 text-sm font-medium text-destructive">
        {eligibility.message}
      </div>
    );
  }

  const { data } = eligibility;

  if (!data.isSignedIn) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Sparkles size={16} />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Sign in to sponsor your tool
            </p>
            <p className="mt-1 text-[12px] font-normal leading-relaxed text-muted-foreground">
              Sponsor placements are available for tools you own on ShipBoost.
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={`/sign-in?redirect=${encodeURIComponent(`/?advertise=1&advertise_slot=${slot}`)}`}
            onClick={onCloseModal}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold tracking-tight text-primary-foreground transition hover:opacity-90"
          >
            Sign in
            <ArrowRight size={13} />
          </Link>
          <Link
            href="/submit"
            onClick={onCloseModal}
            className="inline-flex items-center rounded-lg border border-border bg-background px-3.5 py-2 text-[13px] font-semibold tracking-tight text-foreground transition hover:bg-muted"
          >
            Submit your tool
          </Link>
        </div>
      </div>
    );
  }

  if (slotData?.soldOut) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          {SLOT_LABELS[slot]} placements are sold out right now.
        </p>
        <p className="mt-1 text-[12px] font-normal leading-relaxed text-muted-foreground">
          Check back when a placement expires.
        </p>
      </div>
    );
  }

  const toolsForSlot = data.tools.map((tool) => ({
    ...tool,
    alreadyActiveInSlot: tool.activeSlots.includes(slot),
  }));

  const eligibleTools = toolsForSlot.filter((t) => !t.alreadyActiveInSlot);

  if (eligibleTools.length === 0 && data.tools.length === 0) {
    return (
      <div className="rounded-xl border border-border/70 bg-card p-4">
        <p className="text-sm font-semibold text-foreground">
          No eligible tools yet.
        </p>
        <p className="mt-1 text-[12px] font-normal leading-relaxed text-muted-foreground">
          Approved live or scheduled tools can buy a sponsor placement. If your
          tool is still waiting for review, finish that first.
        </p>
        <Link
          href="/submit"
          onClick={onCloseModal}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-[13px] font-semibold tracking-tight text-primary-foreground transition hover:opacity-90"
        >
          Submit your tool
          <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const isToolAlreadyInSlot = selectedTool?.activeSlots.includes(slot) ?? false;

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
        Pick the tool to sponsor
      </p>
      <div className="relative">
        <button
          type="button"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          aria-expanded={dropdownOpen}
          aria-haspopup="listbox"
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5 text-left transition-colors hover:border-foreground/30"
        >
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-tight text-foreground">
              {selectedTool?.name ?? "Choose a tool"}
            </span>
            <span className="mt-0.5 block truncate text-[11px] font-normal text-muted-foreground">
              {selectedTool?.tagline ?? "Pick the product you want to promote"}
            </span>
          </span>
          <ChevronDown
            size={15}
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              dropdownOpen && "rotate-180",
            )}
          />
        </button>

        {dropdownOpen ? (
          <div
            role="listbox"
            className="absolute z-20 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border border-border bg-card p-1.5 shadow-xl shadow-black/10"
          >
            {toolsForSlot.map((tool) => {
              const selected = tool.id === selectedToolId;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  onClick={() => setSelectedToolId(tool.id)}
                  disabled={tool.alreadyActiveInSlot}
                  className={cn(
                    "flex w-full items-start justify-between gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                    !tool.alreadyActiveInSlot && "hover:bg-muted",
                  )}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-[13px] font-semibold tracking-tight text-foreground">
                      {tool.name}
                      {tool.alreadyActiveInSlot ? (
                        <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
                          · already sponsored here
                        </span>
                      ) : null}
                    </span>
                    <span className="mt-0.5 block line-clamp-2 text-[11px] font-normal leading-snug text-muted-foreground">
                      {tool.tagline}
                    </span>
                  </span>
                  {selected ? (
                    <Check size={14} className="mt-0.5 shrink-0 text-primary" />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {checkoutError ? (
        <p className="text-[12px] font-medium text-destructive">
          {checkoutError}
        </p>
      ) : null}

      <button
        type="button"
        onClick={onCheckout}
        disabled={isCheckingOut || !selectedToolId || isToolAlreadyInSlot}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold tracking-tight text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
      >
        {isCheckingOut ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Opening checkout…
          </>
        ) : (
          <>
            <Megaphone size={14} />
            Get started (${slotData?.priceUsd ?? "—"} / 30 days)
          </>
        )}
      </button>
      <p className="text-center text-[11px] font-normal text-muted-foreground/80">
        Secure checkout via Dodo Payments.
      </p>
    </div>
  );
}
