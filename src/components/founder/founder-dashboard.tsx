"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Rocket, Mail, Shield, Activity, CreditCard, ClipboardList, 
  ExternalLink, Edit, RefreshCw, Check, Clock, AlertCircle, Zap, Star,
  Layout, Package, Send, Fingerprint, ChevronRight, Info,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

type FounderSubmission = {
  id: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  preferredLaunchDate: string | null;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
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

type SubmissionStateSummary = {
  label: string;
  tone: "green" | "amber" | "rose" | "slate";
};

type FounderNavItem = {
  id: "overview" | "products" | "submissions" | "claims";
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

function badgeTone(status: FounderSubmission["badgeVerification"]) {
  if (status === "VERIFIED") {
    return "bg-emerald-50 border-emerald-200 text-emerald-700";
  }
  if (status === "FAILED") {
    return "bg-rose-50 border-rose-200 text-rose-700";
  }
  if (status === "PENDING") {
    return "bg-amber-50 border-amber-200 text-amber-700";
  }
  return "bg-muted/30 border-border text-muted-foreground";
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
  if (submission.submissionType === "FEATURED_LAUNCH" && submission.paymentStatus === "PAID" && currentLaunch?.status === "APPROVED") {
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

function getPaymentLabel(submission: FounderSubmission) {
  if (submission.submissionType === "FEATURED_LAUNCH" && submission.paymentStatus === "PENDING") {
    return "Awaiting payment";
  }
  return submission.paymentStatus;
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

function toDateInputValue(value: string) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isFutureFeaturedLaunch(submission: FounderSubmission) {
  if (submission.submissionType !== "FEATURED_LAUNCH" || submission.paymentStatus !== "PAID") {
    return false;
  }
  const featuredLaunch = submission.tool.launches.find(l => l.launchType === "FEATURED");
  if (!featuredLaunch) return false;
  const launchDate = new Date(featuredLaunch.launchDate);
  return featuredLaunch.status !== "LIVE" && featuredLaunch.status !== "ENDED" && launchDate > new Date();
}

type NavSection = "overview" | "products" | "submissions" | "claims";

export function FounderDashboard({
  initialSubmissions,
  initialTools,
  initialClaims,
  founderEmail,
  founderRole,
  initialSuccessMessage,
}: {
  initialSubmissions: FounderSubmission[];
  initialTools: FounderToolSummary[];
  initialClaims: FounderListingClaim[];
  founderEmail: string;
  founderRole: string;
  initialSuccessMessage?: string | null;
}) {
  const [activeNav, setActiveNav] = useState<NavSection>("overview");
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [tools, setTools] = useState(initialTools);
  const [claims, setClaims] = useState(initialClaims);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialSuccessMessage ?? null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(null);
  const [pendingVerificationId, setPendingVerificationId] = useState<string | null>(null);
  const [pendingSubmitId, setPendingSubmitId] = useState<string | null>(null);
  const [pendingRescheduleId, setPendingRescheduleId] = useState<string | null>(null);
  const [rescheduleDrafts, setRescheduleDrafts] = useState<Record<string, string>>(() =>
    Object.fromEntries(initialSubmissions.filter(s => s.preferredLaunchDate).map(s => [s.id, toDateInputValue(s.preferredLaunchDate as string)]))
  );

  const pendingCount = submissions.filter(s => getSubmissionState(s).label === "Pending review").length;
  const awaitingPaymentCount = submissions.filter(s => getSubmissionState(s).label === "Awaiting payment").length;
  const pendingClaimCount = claims.filter(c => c.status === "PENDING").length;

  function refresh() {
    if (isRefreshing) return;
    setIsRefreshing(true);
    void (async () => {
      try {
        setErrorMessage(null);
        setSuccessMessage(null);
        const [nextSub, nextTools, nextClaims] = await Promise.all([
          apiRequest<FounderSubmission[]>("/api/submissions"),
          apiRequest<FounderToolSummary[]>("/api/founder/tools"),
          apiRequest<FounderListingClaim[]>("/api/listing-claims"),
        ]);
        setSubmissions(nextSub);
        setTools(nextTools);
        setClaims(nextClaims);
        setRescheduleDrafts(Object.fromEntries(nextSub.filter(s => s.preferredLaunchDate).map(s => [s.id, toDateInputValue(s.preferredLaunchDate as string)])));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to refresh status.");
      } finally {
        setIsRefreshing(false);
      }
    })();
  }

  function beginFeaturedCheckout(submissionId: string) {
    if (pendingCheckoutId) return;
    setPendingCheckoutId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        const result = await apiRequest<{ checkoutUrl: string }>("/api/polar/checkout/featured-launch", {
          method: "POST",
          body: JSON.stringify({ submissionId }),
        });
        window.location.href = result.checkoutUrl;
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to start checkout.");
        setPendingCheckoutId(null);
      }
    })();
  }

  function verifyDraftBadge(submissionId: string) {
    if (pendingVerificationId) return;
    setPendingVerificationId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        const result = await apiRequest<{ verified: boolean; message: string; submission: FounderSubmission }>(`/api/submissions/${submissionId}/verify-badge`, {
          method: "POST",
        });
        setSubmissions(prev => prev.map(s => s.id === result.submission.id ? result.submission : s));
        if (result.verified) setSuccessMessage(result.message);
        else setErrorMessage(result.message);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to verify badge.");
      } finally {
        setPendingVerificationId(null);
      }
    })();
  }

  function submitDraft(submissionId: string) {
    if (pendingSubmitId) return;
    setPendingSubmitId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        const result = await apiRequest<FounderSubmission>(`/api/submissions/${submissionId}/submit`, { method: "POST" });
        setSubmissions(prev => prev.map(s => s.id === result.id ? result : s));
        setSuccessMessage("Launch submitted for review.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to submit draft.");
      } finally {
        setPendingSubmitId(null);
      }
    })();
  }

  function rescheduleFeaturedLaunch(submissionId: string) {
    const preferredLaunchDate = rescheduleDrafts[submissionId];
    if (!preferredLaunchDate || pendingRescheduleId) return;
    setPendingRescheduleId(submissionId);
    void (async () => {
      try {
        setErrorMessage(null);
        const updated = await apiRequest<FounderSubmission>(`/api/submissions/${submissionId}/reschedule`, {
          method: "PATCH",
          body: JSON.stringify({ preferredLaunchDate }),
        });
        setSubmissions(prev => prev.map(s => s.id === submissionId ? updated : s));
        setSuccessMessage("Featured launch rescheduled.");
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Unable to reschedule.");
      } finally {
        setPendingRescheduleId(null);
      }
    })();
  }

  const navItems: FounderNavItem[] = [
    { id: "overview", label: "Overview", icon: Layout },
    { id: "products", label: "My Products", icon: Package, count: tools.length },
    { id: "submissions", label: "Submissions", icon: Send, count: submissions.length },
    { id: "claims", label: "Ownership", icon: Fingerprint, count: claims.length },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Sidebar Navigation */}
      <aside className="w-full lg:w-64 shrink-0 space-y-4 lg:sticky lg:top-32">
        <div className="rounded-3xl border border-border bg-card p-2 shadow-sm">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveNav(item.id)}
              className={cn(
                "w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all group",
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
          <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Account Status</h4>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Mail size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Email</p>
                <p className="text-xs font-bold text-foreground truncate">{founderEmail}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-muted flex items-center justify-center text-foreground">
                <Shield size={14} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Role</p>
                <p className="text-xs font-bold text-foreground uppercase tracking-widest">{founderRole}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 w-full space-y-8">
        {errorMessage && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} /> {errorMessage}
          </div>
        )}
        {successMessage && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700 uppercase tracking-widest flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
            <Check size={16} /> {successMessage}
          </div>
        )}

        {activeNav === "overview" && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <section className="rounded-[2.5rem] border border-border bg-card p-8 sm:p-12 shadow-xl shadow-black/5">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black tracking-[0.3em] text-primary uppercase mb-4">Founder workspace</p>
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

            <div className="grid gap-6 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <Activity size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Active Reviews</p>
                </div>
                <p className="text-3xl font-black text-foreground">{pendingCount}</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <CreditCard size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Awaiting Pay</p>
                </div>
                <p className="text-3xl font-black text-foreground">{awaitingPaymentCount}</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
                <div className="flex items-center gap-3 text-muted-foreground mb-3">
                  <Fingerprint size={16} />
                  <p className="text-[10px] font-black uppercase tracking-widest">Open Claims</p>
                </div>
                <p className="text-3xl font-black text-foreground">{pendingClaimCount}</p>
              </div>
            </div>
          </div>
        )}

        {activeNav === "products" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Public Profiles</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Manage your active listings</p>
              </div>
            </div>
            <div className="grid gap-4">
              {tools.map((tool) => (
                <article key={tool.id} className="rounded-[2rem] border border-border bg-card p-6 hover:shadow-xl hover:shadow-black/5 transition-all">
                  <div className="flex flex-col sm:flex-row gap-6 items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-2xl bg-muted border border-border overflow-hidden shrink-0">
                        {tool.logoMedia ? <img src={tool.logoMedia.url} className="w-full h-full object-cover" /> : <Package size={24} className="m-5 text-muted-foreground" />}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-black">{tool.name}</h3>
                          <StatusChip label={tool.publicationStatus} tone={tool.publicationStatus === 'PUBLISHED' ? 'green' : 'slate'} />
                        </div>
                        <p className="text-sm font-medium text-muted-foreground line-clamp-1">{tool.tagline}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <Link href={`/dashboard/tools/${tool.id}`} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 py-2.5 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90">
                        <Edit size={14} /> Edit
                      </Link>
                      <Link href={`/tools/${tool.slug}`} target="_blank" className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 border border-border bg-card px-5 py-2.5 rounded-xl text-xs font-black hover:bg-muted">
                        <ExternalLink size={14} /> View
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
              {tools.length === 0 && <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/30 px-5 py-16 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">No listings yet.</div>}
            </div>
          </div>
        )}

        {activeNav === "submissions" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Launch Queue</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Track your submission status</p>
              </div>
            </div>
            <div className="grid gap-4">
              {submissions.map((sub) => {
                const state = getSubmissionState(sub);
                return (
                  <article key={sub.id} className="rounded-[2rem] border border-border bg-card p-6 space-y-6">
                    <div className="flex flex-col lg:flex-row justify-between gap-6">
                      <div className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          <span className={cn("px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest", submissionStateTone(state.tone))}>{state.label}</span>
                          <span className="px-3 py-1 rounded-full border border-border bg-muted/30 text-[10px] font-black uppercase tracking-widest text-muted-foreground">{sub.submissionType}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
                            {sub.tool.logoMedia ? <img src={sub.tool.logoMedia.url} className="w-full h-full object-cover" /> : <Rocket size={20} className="m-3 text-muted-foreground" />}
                          </div>
                          <div>
                            <h3 className="font-black text-foreground">{sub.tool.name}</h3>
                            <p className="text-xs text-muted-foreground uppercase tracking-widest">Slug: {sub.tool.slug}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-start">
                        {sub.reviewStatus === "DRAFT" && (
                          <Link href={`/dashboard/tools/${sub.tool.id}`} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90">
                            <Edit size={14} /> Resume Draft
                          </Link>
                        )}
                        {sub.submissionType === "FEATURED_LAUNCH" && sub.paymentStatus !== "PAID" && (
                          <button onClick={() => beginFeaturedCheckout(sub.id)} className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90">
                            <Star size={14} /> Pay & Launch
                          </button>
                        )}
                        <a href={sub.tool.websiteUrl} target="_blank" className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-xl text-xs font-black hover:bg-muted">
                          <ExternalLink size={14} /> Site
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
              {submissions.length === 0 && <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/30 px-5 py-16 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">No submissions yet.</div>}
            </div>
          </div>
        )}

        {activeNav === "claims" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-end justify-between px-2">
              <div className="space-y-1">
                <h2 className="text-3xl font-black tracking-tight">Ownership Claims</h2>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Listing takeover requests</p>
              </div>
            </div>
            <div className="grid gap-4">
              {claims.map((claim) => (
                <article key={claim.id} className="rounded-[2rem] border border-border bg-card p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-muted border border-border overflow-hidden shrink-0">
                      {claim.tool.logoMedia ? <img src={claim.tool.logoMedia.url} className="w-full h-full object-cover" /> : <Fingerprint size={20} className="m-3 text-muted-foreground" />}
                    </div>
                    <div>
                      <h3 className="font-black">{claim.tool.name}</h3>
                      <p className="text-xs text-muted-foreground uppercase tracking-widest">{claim.websiteDomain}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <StatusChip label={claim.status} tone={claim.status === 'APPROVED' ? 'green' : claim.status === 'PENDING' ? 'amber' : 'rose'} />
                    <Link href={`/tools/${claim.tool.slug}`} target="_blank" className="inline-flex items-center gap-2 border border-border bg-card px-4 py-2 rounded-xl text-xs font-black hover:bg-muted">
                      <ExternalLink size={14} /> View
                    </Link>
                  </div>
                </article>
              ))}
              {claims.length === 0 && <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/30 px-5 py-16 text-center text-sm font-bold text-muted-foreground uppercase tracking-widest">No claims found.</div>}
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
  return <span className={cn("px-2 py-0.5 rounded-full border text-[10px] font-black uppercase tracking-widest", styles[tone])}>{label}</span>;
}
