"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { 
  Rocket, Mail, Shield, Activity, CreditCard,
  ExternalLink, Edit, RefreshCw, Check, AlertCircle, Star,
  Layout, Package, Fingerprint, Megaphone,
  type LucideIcon,
} from "lucide-react";
import {
  premiumLaunchAvailable,
  premiumLaunchUnavailableMessage,
} from "@/lib/premium-launch";
import { captureBrowserPostHogEvent } from "@/lib/posthog-browser";
import { cn } from "@/lib/utils";

type FounderSubmission = {
  id: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  preferredLaunchDate: string | null;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  spotlightBrief: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "READY" | "PUBLISHED";
    updatedAt: string;
    publishedAt: string | null;
    publishedArticle: { slug: string; title: string } | null;
  } | null;
  tool: {
    id: string;
    slug: string;
    name: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    launches: Array<{
      id: string;
      launchType: "FREE" | "FEATURED" | "RELAUNCH";
      status: "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";
      launchDate: string;
    }>;
  };
};

type FounderToolSummary = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  publicationStatus: "UNPUBLISHED" | "PUBLISHED" | "ARCHIVED";
  logoMedia: { url: string } | null;
};

type FounderListingClaim = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  websiteDomain: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    logoMedia: { url: string } | null;
  };
};

type FounderSponsorPlacement = {
  id: string;
  status: "PENDING_PAYMENT" | "ACTIVE" | "PAID_WAITLISTED" | "EXPIRED" | "DISABLED";
  startsAt: string | null;
  endsAt: string | null;
  paidAt: string | null;
  createdAt: string;
  tool: {
    id: string;
    slug: string;
    name: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
  };
};

type SubmissionStateSummary = {
  label: string;
  tone: "green" | "amber" | "rose" | "slate";
};

type FounderNavItem = {
  id: "overview" | "products" | "claims";
  label: string;
  icon: LucideIcon;
  count?: number;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getSubmissionState(submission: FounderSubmission): SubmissionStateSummary {
  const currentLaunch = submission.tool.launches[0];
  if (submission.reviewStatus === "DRAFT") {
    if (submission.submissionType === "FREE_LAUNCH" && submission.badgeVerification === "VERIFIED") {
      return { label: "Ready to submit", tone: "green" };
    }
    return { label: "Draft", tone: "slate" };
  }
  if (submission.reviewStatus === "REJECTED") {
    return { label: "Needs changes", tone: "rose" };
  }
  if (submission.submissionType === "FEATURED_LAUNCH" && submission.paymentStatus === "PENDING") {
    return { label: "Awaiting payment", tone: "amber" };
  }
  if (currentLaunch?.status === "LIVE") {
    return { label: "Live", tone: "green" };
  }
  if (currentLaunch?.status === "APPROVED") {
    return { label: "Scheduled", tone: "green" };
  }
  if (submission.reviewStatus === "APPROVED") {
    return { label: "Approved", tone: "green" };
  }
  return { label: "Pending review", tone: "amber" };
}

function submissionStateTone(tone: SubmissionStateSummary["tone"]) {
  if (tone === "green") return "bg-emerald-50 border-emerald-200 text-emerald-700";
  if (tone === "rose") return "bg-rose-50 border-rose-200 text-rose-700";
  if (tone === "slate") return "bg-slate-100 border-slate-200 text-slate-700";
  return "bg-amber-50 border-amber-200 text-amber-700";
}

function spotlightStatusTone(status: NonNullable<FounderSubmission["spotlightBrief"]>["status"]) {
  if (status === "READY" || status === "PUBLISHED") {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }

  if (status === "IN_PROGRESS") {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }

  return "bg-slate-100 border-slate-200 text-slate-700";
}

function spotlightStatusLabel(status: NonNullable<FounderSubmission["spotlightBrief"]>["status"]) {
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

function sponsorStatusLabel(status: FounderSponsorPlacement["status"]) {
  if (status === "ACTIVE") return "Active";
  if (status === "PAID_WAITLISTED") return "Reserved";
  if (status === "PENDING_PAYMENT") return "Awaiting payment";
  if (status === "EXPIRED") return "Expired";
  return "Disabled";
}

function sponsorStatusTone(status: FounderSponsorPlacement["status"]) {
  if (status === "ACTIVE") return "green";
  if (status === "PAID_WAITLISTED" || status === "PENDING_PAYMENT") return "amber";
  if (status === "EXPIRED") return "slate";
  return "rose";
}

function getSubmissionTypeLabel(submissionType: FounderSubmission["submissionType"]) {
  if (submissionType === "FEATURED_LAUNCH") {
    return "Premium Launch";
  }
  if (submissionType === "FREE_LAUNCH") {
    return "Free Launch";
  }
  if (submissionType === "LISTING_ONLY") {
    return "Listing Only";
  }
  return "Relaunch";
}

async function apiRequest<T>(input: RequestInfo, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  const payload = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.error ?? "Request failed.");
  }
  return payload?.data as T;
}

type NavSection = "overview" | "products" | "submissions" | "claims";
type ActiveNavSection = Exclude<NavSection, "submissions">;

function isVisibleOwnershipClaim(claim: FounderListingClaim) {
  return claim.status === "PENDING" || claim.status === "APPROVED";
}

function normalizeInitialNav(
  nav: NavSection,
  hasOwnershipClaims: boolean,
): ActiveNavSection {
  if (nav === "submissions") {
    return "products";
  }

  if (nav === "claims" && !hasOwnershipClaims) {
    return "overview";
  }

  return nav;
}

export function FounderDashboard({
  initialSubmissions,
  initialTools,
  initialClaims,
  initialSponsorPlacements = [],
  founderEmail,
  founderRole,
  initialSuccessMessage,
  initialActiveNav = "overview",
}: {
  initialSubmissions: FounderSubmission[];
  initialTools: FounderToolSummary[];
  initialClaims: FounderListingClaim[];
  initialSponsorPlacements?: FounderSponsorPlacement[];
  founderEmail: string;
  founderRole: string;
  initialSuccessMessage?: string | null;
  initialActiveNav?: NavSection;
}) {
  const initialHasOwnershipClaims = initialClaims.some(isVisibleOwnershipClaim);
  const [activeNav, setActiveNav] = useState<ActiveNavSection>(
    normalizeInitialNav(initialActiveNav, initialHasOwnershipClaims),
  );
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [tools, setTools] = useState(initialTools);
  const [claims, setClaims] = useState(initialClaims);
  const [sponsorPlacements, setSponsorPlacements] = useState(initialSponsorPlacements);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialSuccessMessage ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(null);

  const pendingCount = submissions.filter(s => getSubmissionState(s).label === "Pending review").length;
  const awaitingPaymentCount = submissions.filter(s => getSubmissionState(s).label === "Awaiting payment").length;
  const pendingClaimCount = claims.filter(c => c.status === "PENDING").length;
  const activeSponsorCount = sponsorPlacements.filter((placement) => placement.status === "ACTIVE").length;
  const ownershipClaims = claims.filter(isVisibleOwnershipClaim);
  const showOwnershipTab = ownershipClaims.length > 0;
  const toolsById = new Map(tools.map((tool) => [tool.id, tool]));
  const productItems = (() => {
    const latestSubmissionByToolId = new Map<string, FounderSubmission>();

    submissions.forEach((submission) => {
      if (!latestSubmissionByToolId.has(submission.tool.id)) {
        latestSubmissionByToolId.set(submission.tool.id, submission);
      }
    });

    return [
      ...Array.from(latestSubmissionByToolId.values()).map((submission) => ({
        key: submission.tool.id,
        submission,
        tool: toolsById.get(submission.tool.id),
      })),
      ...tools
        .filter((tool) => !latestSubmissionByToolId.has(tool.id))
        .map((tool) => ({
          key: tool.id,
          submission: null,
          tool,
        })),
    ];
  })();
  const sponsorPlacementsByToolId = new Map<string, FounderSponsorPlacement[]>();

  sponsorPlacements.forEach((placement) => {
    sponsorPlacementsByToolId.set(placement.tool.id, [
      ...(sponsorPlacementsByToolId.get(placement.tool.id) ?? []),
      placement,
    ]);
  });

  useEffect(() => {
    if (activeNav === "claims" && !showOwnershipTab) {
      setActiveNav("overview");
    }
  }, [activeNav, showOwnershipTab]);

  function refresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const [nextSub, nextTools, nextClaims, nextSponsorPlacements] = await Promise.all([
          apiRequest<FounderSubmission[]>("/api/submissions"),
          apiRequest<FounderToolSummary[]>("/api/founder/tools"),
          apiRequest<FounderListingClaim[]>("/api/listing-claims"),
          apiRequest<FounderSponsorPlacement[]>("/api/founder/sponsor-placements"),
        ]);
        setSubmissions(nextSub);
        setTools(nextTools);
        setClaims(nextClaims.filter(isVisibleOwnershipClaim));
        setSponsorPlacements(nextSponsorPlacements);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to refresh status.");
      } finally {
        setIsRefreshing(false);
      }
    })();
  }

  function beginPremiumCheckout(submissionId: string) {
    if (pendingCheckoutId) return;
    setPendingCheckoutId(submissionId);
    void (async () => {
      try {
        if (!premiumLaunchAvailable) {
          throw new Error(premiumLaunchUnavailableMessage);
        }

        setErrorMessage(null);
        const result = await apiRequest<{ checkoutUrl: string }>("/api/dodo/checkout/premium-launch", {
          method: "POST",
          body: JSON.stringify({ submissionId }),
        });
        captureBrowserPostHogEvent("premium_launch_checkout_started", {
          submission_id: submissionId,
          source_surface: "founder_dashboard",
        });
        window.location.href = result.checkoutUrl;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout.");
        setPendingCheckoutId(null);
      }
    })();
  }

  const navItems: FounderNavItem[] = [
    { id: "overview", label: "Overview", icon: Layout },
    { id: "products", label: "Products", icon: Package, count: productItems.length },
    ...(showOwnershipTab
      ? [
          {
            id: "claims" as const,
            label: "Ownership",
            icon: Fingerprint,
            count: ownershipClaims.length,
          },
        ]
      : []),
  ];

  return (
    <div className="flex min-w-0 flex-col items-start gap-6 lg:flex-row lg:gap-8">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-32">
        <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black  tracking-widest transition-all group",
                activeNav === item.id
                  ? "bg-primary text-primary-foreground shadow-lg shadow-black/10"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-3">
                <item.icon size={16} />
                <span>{item.label}</span>
              </div>
              {item.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-lg text-[10px]",
                  activeNav === item.id ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground group-hover:bg-background"
                )}>
                  {item.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm hidden lg:block">
          <h4 className="text-[10px] font-black  tracking-widest text-muted-foreground/60 mb-4">Account Status</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Mail size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black  tracking-widest text-muted-foreground/60">Email</p>
                <p className="text-xs font-bold text-foreground truncate">{founderEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Shield size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black  tracking-widest text-muted-foreground/60">Role</p>
                <p className="text-xs font-bold text-foreground  tracking-widest">{founderRole}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full min-w-0 space-y-8">
        {errorMessage && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive  tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700  tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Check size={16} /> {successMessage}
          </div>
        )}

        {activeNav === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section className="rounded-[2.5rem] border border-border bg-card p-6 sm:p-8 lg:p-12 shadow-xl shadow-black/5">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black tracking-[0.3em] text-primary  mb-4">Founder workspace</p>
                <h1 className="text-4xl font-black tracking-tight text-foreground sm:text-5xl">Mission Control</h1>
                <p className="mt-6 text-lg font-medium leading-relaxed text-muted-foreground/80">
                  Track your launch pipeline, manage directory profiles, and monitor your distribution loops.
                </p>
                <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                  <Link href="/submit" className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 active:scale-95">
                    <Rocket size={18} /> Submit a product
                  </Link>
                  <button onClick={refresh} disabled={isRefreshing} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted disabled:opacity-50">
                    <RefreshCw size={18} className={cn(isRefreshing && "animate-spin")} /> {isRefreshing ? "Refreshing..." : "Refresh status"}
                  </button>
                </div>
              </div>
            </section>

            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <Activity size={16} />
                  <p className="text-[10px] font-black  tracking-widest">Active Reviews</p>
                </div>
                <p className="text-3xl font-black text-foreground">{pendingCount}</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <CreditCard size={16} />
                  <p className="text-[10px] font-black  tracking-widest">Awaiting Pay</p>
                </div>
                <p className="text-3xl font-black text-foreground">{awaitingPaymentCount}</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <Megaphone size={16} />
                  <p className="text-[10px] font-black  tracking-widest">Sponsors</p>
                </div>
                <p className="text-3xl font-black text-foreground">{activeSponsorCount}</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <Fingerprint size={16} />
                  <p className="text-[10px] font-black  tracking-widest">Open Claims</p>
                </div>
                <p className="text-3xl font-black text-foreground">{pendingClaimCount}</p>
              </div>
            </div>

            <section className="rounded-[2rem] border border-border bg-card p-5 shadow-sm sm:p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black tracking-[0.24em] text-primary">
                    SPONSORSHIPS
                  </p>
                  <h2 className="mt-2 text-xl font-black tracking-tight text-foreground">
                    Sidebar sponsor placements
                  </h2>
                </div>
                <Link
                  href="/advertise"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 hover:opacity-90"
                >
                  <Megaphone size={14} />
                  Advertise
                </Link>
              </div>
              <div className="mt-5 grid gap-3">
                {sponsorPlacements.length > 0 ? (
                  sponsorPlacements.slice(0, 3).map((placement) => (
                    <div
                      key={placement.id}
                      className="flex flex-col gap-4 rounded-2xl border border-border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
                          {placement.tool.logoMedia ? (
                            <>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={placement.tool.logoMedia.url}
                                alt={`${placement.tool.name} logo`}
                                className="h-full w-full object-cover"
                              />
                            </>
                          ) : (
                            <Megaphone size={16} className="m-3 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-black text-foreground">
                            {placement.tool.name}
                          </p>
                          <p className="truncate text-xs font-bold text-muted-foreground">
                            {placement.endsAt
                              ? `Ends ${formatDate(placement.endsAt)}`
                              : `Created ${formatDate(placement.createdAt)}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusChip
                          label={sponsorStatusLabel(placement.status)}
                          tone={sponsorStatusTone(placement.status)}
                        />
                        <Link
                          href={placement.tool.websiteUrl}
                          target="_blank"
                          className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs font-black hover:bg-muted"
                        >
                          <ExternalLink size={13} />
                          Website
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-5 text-sm font-bold text-muted-foreground">
                    No sponsor placements yet.
                  </div>
                )}
              </div>
            </section>
          </div>
        )}

        {activeNav === "products" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex min-w-0 items-end justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Products</h2>
                <p className="text-xs font-bold text-muted-foreground  tracking-widest">Manage drafts, launches, and live listings</p>
              </div>
            </div>
            <div className="grid gap-4">
              {productItems.map((item) => {
                const sub = item.submission;
                const tool = item.tool;
                const state = sub ? getSubmissionState(sub) : null;
                const latestLaunch = sub?.tool.launches[0] ?? null;
                const sponsorPlacement = sponsorPlacementsByToolId.get(item.key)?.[0] ?? null;
                const name = sub?.tool.name ?? tool?.name ?? "Untitled product";
                const slug = sub?.tool.slug ?? tool?.slug ?? "";
                const logoMedia = sub?.tool.logoMedia ?? tool?.logoMedia ?? null;
                const description =
                  tool?.tagline ??
                  (sub ? `${getSubmissionTypeLabel(sub.submissionType)} submission` : "");

                return (
                  <article key={item.key} className="rounded-[2rem] border border-border bg-card p-5 sm:p-6 space-y-6">
                    <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:justify-between">
                      <div className="min-w-0 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {state ? (
                            <span className={cn("px-3 py-1 rounded-full border text-[10px] font-black  tracking-widest", submissionStateTone(state.tone))}>{state.label}</span>
                          ) : tool ? (
                            <StatusChip label={tool.publicationStatus} tone={tool.publicationStatus === 'PUBLISHED' ? 'green' : 'slate'} />
                          ) : null}
                          {sub ? (
                            <span className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-black  tracking-widest text-muted-foreground">{getSubmissionTypeLabel(sub.submissionType)}</span>
                          ) : null}
                          {latestLaunch ? (
                            <span className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-black  tracking-widest text-muted-foreground">
                              Launch date:{" "}
                              <span className="text-foreground">
                                {formatDate(latestLaunch.launchDate)}
                              </span>
                            </span>
                          ) : null}
                          {sponsorPlacement ? (
                            <StatusChip
                              label={`Sponsor: ${sponsorStatusLabel(sponsorPlacement.status)}`}
                              tone={sponsorStatusTone(sponsorPlacement.status)}
                            />
                          ) : null}
                        </div>
                        <div className="flex min-w-0 items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
                            {logoMedia ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={logoMedia.url} alt={`${name} logo`} className="w-full h-full object-cover" />
                              </>
                            ) : <Rocket size={20} className="m-3 text-muted-foreground" />}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <h3 className="truncate font-black text-foreground">{name}</h3>
                            <p className="truncate text-xs text-muted-foreground  tracking-widest">Slug: {slug}</p>
                            {description ? (
                              <p className="text-sm font-medium text-muted-foreground line-clamp-2 break-words">{description}</p>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-start">
                        {sub?.reviewStatus === "DRAFT" ? (
                          <Link href={`/submit?draft=${sub.id}`} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90">
                            <Edit size={14} /> Continue Submission
                          </Link>
                        ) : null}
                        {sub && sub.reviewStatus !== "DRAFT" && sub.submissionType === "FEATURED_LAUNCH" && sub.paymentStatus !== "PAID" && (
                          premiumLaunchAvailable ? (
                            <button onClick={() => beginPremiumCheckout(sub.id)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90">
                              <Star size={14} /> Reserve Premium Launch
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-4 py-2 text-xs font-black text-muted-foreground/70">
                              <Star size={14} /> Temporarily unavailable
                            </span>
                          )
                        )}
                        {tool && sub?.reviewStatus !== "DRAFT" ? (
                          <Link href={`/dashboard/tools/${tool.id}`} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90">
                            <Edit size={14} /> Edit listing
                          </Link>
                        ) : null}
                        {tool && sub?.reviewStatus !== "DRAFT" ? (
                          <Link href={`/dashboard/tools/${tool.id}/preview`} target="_blank" className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-xl text-xs font-black hover:bg-muted">
                            <ExternalLink size={14} /> Preview
                          </Link>
                        ) : null}
                      </div>
                  </div>
                    {sub?.submissionType === "FEATURED_LAUNCH" &&
                    sub.paymentStatus === "PAID" ? (
                      <div className="rounded-[1.5rem] border border-border bg-muted/20 p-4 sm:p-5">
                        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                          <div className="space-y-2">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[10px] font-black tracking-[0.2em] text-primary">
                                Founding bonus
                              </span>
                              <span
                                className={cn(
                                  "rounded-full border px-3 py-1 text-[10px] font-black tracking-widest",
                                  spotlightStatusTone(
                                    sub.spotlightBrief?.status ?? "NOT_STARTED",
                                  ),
                                )}
                              >
                                Spotlight:{" "}
                                {spotlightStatusLabel(
                                  sub.spotlightBrief?.status ?? "NOT_STARTED",
                                )}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-black tracking-tight text-foreground">
                                Editorial launch spotlight
                              </h4>
                              <p className="max-w-2xl text-sm font-medium leading-relaxed text-muted-foreground/80">
                                Keep the dashboard clean here and finish the
                                short spotlight brief on its own page.
                              </p>
                              {sub.spotlightBrief?.updatedAt ? (
                                <p className="text-xs font-bold tracking-widest text-muted-foreground">
                                  Last updated {formatDate(sub.spotlightBrief.updatedAt)}
                                </p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 md:min-w-[220px]">
                            {sub.spotlightBrief?.publishedArticle ? (
                              <Link
                                href={`/blog/${sub.spotlightBrief.publishedArticle.slug}`}
                                target="_blank"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-xs font-black hover:bg-muted"
                              >
                                <ExternalLink size={14} />
                                View spotlight
                              </Link>
                            ) : null}
                            {sub.spotlightBrief?.status !== "PUBLISHED" ? (
                              <Link
                                href={`/dashboard/submissions/${sub.id}/spotlight`}
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-black text-primary-foreground shadow-lg shadow-black/10 hover:opacity-90"
                              >
                                <Edit size={14} />
                                {sub.spotlightBrief?.status === "IN_PROGRESS"
                                  ? "Continue spotlight brief"
                                  : "Open spotlight brief"}
                              </Link>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </article>
                );
              })}
              {productItems.length === 0 && <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/30 px-5 py-16 text-center text-sm font-bold text-muted-foreground  tracking-widest">No products yet.</div>}
            </div>
          </div>
        )}

        {activeNav === "claims" && showOwnershipTab && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex min-w-0 items-end justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Ownership Claims</h2>
                <p className="text-xs font-bold text-muted-foreground  tracking-widest">Listing takeover requests</p>
              </div>
            </div>
            <div className="grid gap-4">
              {ownershipClaims.map((claim) => (
                <article key={claim.id} className="rounded-[2rem] border border-border bg-card p-5 sm:p-6 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
                  <div className="flex min-w-0 items-center gap-4 sm:gap-6">
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
                      {claim.tool.logoMedia ? (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={claim.tool.logoMedia.url} alt={`${claim.tool.name} logo`} className="w-full h-full object-cover" />
                        </>
                      ) : <Fingerprint size={20} className="m-3 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate font-black">{claim.tool.name}</h3>
                      <p className="truncate text-xs text-muted-foreground  tracking-widest">{claim.websiteDomain}</p>
                    </div>
                  </div>
                  <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                    <StatusChip label={claim.status} tone={claim.status === 'APPROVED' ? 'green' : claim.status === 'PENDING' ? 'amber' : 'rose'} />
                    <Link href={`/tools/${claim.tool.slug}`} target="_blank" className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-xl text-xs font-black hover:bg-muted">
                      <ExternalLink size={14} /> View
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusChip({ label, tone }: { label: string; tone: 'green' | 'amber' | 'rose' | 'slate' }) {
  const styles = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    slate: "bg-muted/30 text-muted-foreground border-border"
  };
  return <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-black  tracking-widest", styles[tone])}>{label}</span>;
}
