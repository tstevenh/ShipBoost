"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { 
  Rocket, ShieldCheck, Star, Zap, Info, ArrowLeft, Loader2, Check, 
  ChevronDown, Layout, Image as ImageIcon, Share2, DollarSign, ExternalLink,
  ChevronRight, Trophy, Search, X, ArrowRight, Trash2
} from "lucide-react";

import { MarkdownTextarea } from "@/components/forms/markdown-textarea";
import { cn } from "@/lib/utils";

type CategoryOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type TagOption = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
};

type SubmissionType =
  | "LISTING_ONLY"
  | "FREE_LAUNCH"
  | "FEATURED_LAUNCH"
  | "RELAUNCH";
type PricingModel = "FREE" | "FREEMIUM" | "PAID" | "CUSTOM" | "CONTACT_SALES";
type PricingModelSelection = PricingModel | "";
type BadgeTheme = "light" | "dark";

type SubmitProductFormProps = {
  categories: CategoryOption[];
  tags: TagOption[];
  appUrl: string;
  founderEmail: string;
  supportEmail: string;
};

type FormState = {
  submissionType: SubmissionType;
  requestedSlug: string;
  preferredLaunchDate: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  richDescription: string;
  pricingModel: PricingModelSelection;
  affiliateUrl: string;
  affiliateSource: string;
  hasAffiliateProgram: boolean;
  founderXUrl: string;
  founderGithubUrl: string;
  founderLinkedinUrl: string;
  founderFacebookUrl: string;
  categoryIds: string[];
  tagIds: string[];
};

type LocalImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type FieldErrors = Record<string, string[] | undefined>;

type ApiErrorPayload = {
  error?: string;
  details?: {
    fieldErrors?: FieldErrors;
    formErrors?: string[];
    duplicateTool?: {
      id: string;
      slug: string;
      name: string;
      ownedByYou: boolean;
      ctaHref: string | null;
      ctaLabel: string | null;
    };
  };
};

type SavedSubmission = {
  id: string;
  submissionType: SubmissionType;
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
};

const pricingModels: PricingModel[] = [
  "FREE",
  "FREEMIUM",
  "PAID",
  "CUSTOM",
  "CONTACT_SALES",
];

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

function ensureHttps(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function isValidUrl(value: string) {
  const normalized = ensureHttps(value);

  if (!normalized || normalized === "https://") {
    return false;
  }

  try {
    new URL(normalized);
    return true;
  } catch {
    return false;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function emptyForm(): FormState {
  return {
    submissionType: "FREE_LAUNCH",
    requestedSlug: "",
    preferredLaunchDate: "",
    name: "",
    tagline: "",
    websiteUrl: "https://",
    richDescription: "",
    pricingModel: "",
    affiliateUrl: "",
    affiliateSource: "",
    hasAffiliateProgram: false,
    founderXUrl: "",
    founderGithubUrl: "",
    founderLinkedinUrl: "",
    founderFacebookUrl: "",
    categoryIds: [],
    tagIds: [],
  };
}

function inputClassName() {
  return "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5 disabled:opacity-50";
}

function LocalPreview({
  label,
  image,
  onRemove,
}: {
  label: string;
  image: LocalImage;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-xs font-bold text-foreground">{label}</p>
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            {(image.file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-[10px] font-black uppercase tracking-widest text-muted-foreground transition hover:text-destructive"
        >
          Remove
        </button>
      </div>
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.previewUrl} alt={label} className="h-32 w-full object-cover" />
      </div>
    </div>
  );
}

export function SubmitProductForm({
  categories,
  tags,
  appUrl,
  founderEmail,
  supportEmail,
}: SubmitProductFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [activeTab, setActiveTab] = useState<"general" | "media" | "socials">("general");
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logo, setLogo] = useState<LocalImage | null>(null);
  const [screenshots, setScreenshots] = useState<LocalImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [slugStatus, setSlugStatus] = useState<string>("");
  const [isSlugLoading, setIsSlugLoading] = useState(false);
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null);
  const [draftBadgeVerification, setDraftBadgeVerification] = useState<SavedSubmission["badgeVerification"]>("PENDING");
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>("light");
  const [copiedBadgeSnippet, setCopiedBadgeSnippet] = useState(false);
  
  const [catSearch, setCatSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  const isBusy = isSavingDraft || isSubmittingDraft || isVerifyingBadge;
  const normalizedAppUrl = appUrl.replace(/\/$/, "");
  const shipboostUrl = "https://shipboost.io";
  const badgeAssetPath =
    badgeTheme === "light"
      ? "/ShipBoost-Badge/ShipBoost-Light-Badge.svg"
      : "/ShipBoost-Badge/ShipBoost-Dark-Badge.svg";
  const badgePreviewSrc = badgeAssetPath;
  const freeLaunchBadgeSnippet = `<a href="${shipboostUrl}" data-shipboost-badge="free-launch" target="_blank" rel="noopener">
  <img src="${normalizedAppUrl}${badgeAssetPath}" alt="Launching soon on Shipboost" style="height: 54px; width: auto;" />
</a>`;
  const submissionChecklist = [
    { label: "Name", complete: form.name.trim().length >= 2 },
    { label: "Slug", complete: form.requestedSlug.trim().length > 0 },
    { label: "URL", complete: isValidUrl(form.websiteUrl) },
    { label: "Pricing", complete: Boolean(form.pricingModel) },
    { label: "Category", complete: form.categoryIds.length > 0 },
    { label: "Tags", complete: form.tagIds.length > 0 },
    { label: "Tagline", complete: form.tagline.trim().length >= 10 },
    { label: "Rich Description", complete: form.richDescription.trim().length >= 40 },
    { label: "Logo", complete: Boolean(logo) },
  ];
  const incompleteChecklistItems = submissionChecklist
    .filter((item) => !item.complete)
    .map((item) => item.label);
  const minFeaturedLaunchDate = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!form.name.trim()) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setIsSlugLoading(true);
      try {
        const response = await fetch(`/api/tools/slug-suggestion?value=${encodeURIComponent(form.name)}`, { signal: controller.signal });
        const payload = await response.json();
        if (response.ok && payload.data?.slug) {
          setForm(prev => ({ ...prev, requestedSlug: payload.data.slug }));
          setSlugStatus(`Suggested: ${payload.data.slug}`);
        }
      } catch (err) {} finally { setIsSlugLoading(false); }
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [form.name]);

  async function handleCopyBadgeSnippet() {
    try {
      await navigator.clipboard.writeText(freeLaunchBadgeSnippet);
      setCopiedBadgeSnippet(true);
      window.setTimeout(() => setCopiedBadgeSnippet(false), 1500);
    } catch {
      setErrorMessage("Unable to copy the badge snippet.");
    }
  }

  async function saveDraft(overrides: Partial<FormState> = {}) {
    if (!logo) throw new Error("Please upload a logo first.");
    const nextForm = { ...form, ...overrides };
    setIsSavingDraft(true);

    try {
      const formData = new FormData();
      formData.append("submissionId", draftSubmissionId ?? "");
      formData.append("submissionType", nextForm.submissionType);
      formData.append("requestedSlug", nextForm.requestedSlug);
      formData.append("preferredLaunchDate", nextForm.preferredLaunchDate);
      formData.append("name", nextForm.name);
      formData.append("tagline", nextForm.tagline);
      formData.append("websiteUrl", ensureHttps(nextForm.websiteUrl));
      formData.append("richDescription", nextForm.richDescription);
      formData.append("pricingModel", nextForm.pricingModel);
      formData.append("categoryIds", JSON.stringify(nextForm.categoryIds));
      formData.append("tagIds", JSON.stringify(nextForm.tagIds));
      formData.append("affiliateUrl", ensureHttps(nextForm.affiliateUrl));
      formData.append("affiliateSource", nextForm.affiliateSource);
      formData.append("hasAffiliateProgram", String(nextForm.hasAffiliateProgram));
      formData.append("founderXUrl", ensureHttps(nextForm.founderXUrl));
      formData.append("founderGithubUrl", ensureHttps(nextForm.founderGithubUrl));
      formData.append("founderLinkedinUrl", ensureHttps(nextForm.founderLinkedinUrl));
      formData.append("founderFacebookUrl", ensureHttps(nextForm.founderFacebookUrl));
      formData.append("logo", logo.file);
      screenshots.forEach((s) => formData.append("screenshots", s.file));

      const response = await fetch("/api/submissions", {
        method: "POST",
        body: formData,
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Save failed.");
      setForm(nextForm);
      setDraftSubmissionId(payload.data.id);
      setDraftBadgeVerification(payload.data.badgeVerification);
      return payload.data as SavedSubmission & { id: string };
    } finally {
      setIsSavingDraft(false);
    }
  }

  async function handleProceedToPlan() {
    setErrorMessage(null);
    try {
      if (incompleteChecklistItems.length > 0) {
        throw new Error(
          `Please complete: ${incompleteChecklistItems.join(", ")}.`,
        );
      }
      await saveDraft({
        submissionType: "FREE_LAUNCH",
        preferredLaunchDate: "",
      });
      setStep(2);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to save your draft."));
    }
  }

  async function handleVerifyBadge() {
    if (!draftSubmissionId) return;
    setIsVerifyingBadge(true);
    try {
      const res = await fetch(`/api/submissions/${draftSubmissionId}/verify-badge`, { method: "POST" });
      const payload = await res.json();
      setDraftBadgeVerification(payload.data.submission.badgeVerification);
      if (payload.data.verified) setSuccessMessage(payload.data.message);
      else setErrorMessage(payload.data.message || "Badge not found. Make sure it's in your footer.");
    } catch (err) { setErrorMessage("Verification failed."); }
    finally { setIsVerifyingBadge(false); }
  }

  async function handleFinalSubmit(type: SubmissionType) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingDraft(true);

    try {
      if (type === "FEATURED_LAUNCH") {
        if (!form.preferredLaunchDate) {
          throw new Error("Please choose your preferred launch date first.");
        }

        const savedDraft = await saveDraft({
          submissionType: type,
          preferredLaunchDate: form.preferredLaunchDate,
        });
        const response = await fetch("/api/polar/checkout/featured-launch", {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ submissionId: savedDraft.id }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to start checkout.");
        }

        window.location.href = payload.data.checkoutUrl;
        return;
      }

      const savedDraft = await saveDraft({
        submissionType: "FREE_LAUNCH",
        preferredLaunchDate: "",
      });

      if (savedDraft.badgeVerification !== "VERIFIED") {
        throw new Error("Badge must be verified for free launch.");
      }

      const response = await fetch(`/api/submissions/${savedDraft.id}/submit`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to submit your launch.");
      }

      setSuccessMessage("Launch submitted for review.");
      router.push("/dashboard");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to continue with this launch option."));
    }
    finally { setIsSubmittingDraft(false); }
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-10">
      {/* Multi-step Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors", step >= 1 ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>1</div>
            <span className={cn("text-sm font-black uppercase tracking-widest", step >= 1 ? "text-foreground" : "text-muted-foreground")}>Details</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors", step >= 2 ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>2</div>
            <span className={cn("text-sm font-black uppercase tracking-widest", step >= 2 ? "text-foreground" : "text-muted-foreground")}>Choose Plan</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          <Rocket size={12} /> Step {step} of 2
        </div>
      </div>

      {step === 1 ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
          <div className="bg-card border border-border rounded-[2rem] overflow-hidden shadow-xl shadow-black/5">
            {/* Tabs */}
            <div className="flex border-b border-border bg-muted/30">
              {([
                { id: "general", label: "General", icon: Layout },
                { id: "media", label: "Media", icon: ImageIcon },
                { id: "socials", label: "Socials", icon: Share2 },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={cn(
                    "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition-all border-b-2",
                    activeTab === t.id ? "bg-card border-foreground text-foreground" : "border-transparent text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  <t.icon size={14} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              ))}
            </div>

            <div className="p-8 sm:p-10 space-y-8">
              {activeTab === "general" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Name *</label>
                      <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClassName()} placeholder="Acme SaaS" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Slug *</label>
                      <input value={form.requestedSlug} onChange={e => setForm({...form, requestedSlug: slugify(e.target.value)})} className={inputClassName()} />
                      <p className="text-[10px] font-bold text-muted-foreground/60">{slugStatus}</p>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Website URL *</label>
                      <input required value={form.websiteUrl} onChange={e => setForm({...form, websiteUrl: e.target.value})} className={inputClassName()} placeholder="https://acme.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Pricing Model *</label>
                      <select value={form.pricingModel} onChange={e => setForm({...form, pricingModel: e.target.value as PricingModelSelection})} className={inputClassName()}>
                        <option value="">Select pricing model</option>
                        {pricingModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tagline * (10-140 chars)</label>
                    <input required maxLength={140} value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} className={inputClassName()} placeholder="Short, punchy description of what you do" />
                  </div>
                  
                  {/* Category Dropdown */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Category * (Pick 1)</label>
                    <button 
                      type="button"
                      onClick={() => setIsCatOpen(!isCatOpen)}
                      className={cn(inputClassName(), "flex items-center justify-between text-left")}
                    >
                      <span className={cn(!form.categoryIds[0] && "text-muted-foreground/40")}>
                        {categories.find(c => c.id === form.categoryIds[0])?.name || "Select a category"}
                      </span>
                      <ChevronDown size={16} />
                    </button>
                    {isCatOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 p-2 space-y-2 max-h-60 overflow-y-auto">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input 
                            value={catSearch} 
                            onChange={e => setCatSearch(e.target.value)} 
                            className="w-full bg-muted/50 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/10" 
                            placeholder="Search categories..."
                          />
                        </div>
                        <div className="grid gap-1">
                          {categories.filter(c => c.name.toLowerCase().includes(catSearch.toLowerCase())).map(c => (
                            <button 
                              key={c.id} 
                              onClick={() => { setForm({...form, categoryIds: [c.id]}); setIsCatOpen(false); }}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors flex items-center justify-between group"
                            >
                              {c.name}
                              {form.categoryIds.includes(c.id) && <Check size={14} className="text-foreground" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tags Dropdown */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Tags (Pick up to 5)</label>
                    <button 
                      type="button"
                      onClick={() => setIsTagOpen(!isTagOpen)}
                      className={cn(inputClassName(), "flex items-center justify-between text-left min-h-[46px] h-auto flex-wrap gap-2 py-2")}
                    >
                      <div className="flex flex-wrap gap-1.5 flex-1">
                        {form.tagIds.length > 0 ? (
                          form.tagIds.map(tid => (
                            <span key={tid} className="bg-muted text-foreground text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 border border-border">
                              {tags.find(t => t.id === tid)?.name}
                              <X size={10} className="cursor-pointer hover:text-destructive" onClick={(e) => { e.stopPropagation(); setForm({...form, tagIds: form.tagIds.filter(id => id !== tid)}); }} />
                            </span>
                          ))
                        ) : (
                          <span className="text-muted-foreground/40">Select up to 5 tags</span>
                        )}
                      </div>
                      <ChevronDown size={16} className="shrink-0" />
                    </button>
                    {isTagOpen && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-xl shadow-2xl z-50 p-2 space-y-2 max-h-60 overflow-y-auto">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                          <input 
                            value={tagSearch} 
                            onChange={e => setTagSearch(e.target.value)} 
                            className="w-full bg-muted/50 rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-foreground/10" 
                            placeholder="Search tags..."
                          />
                        </div>
                        <div className="grid gap-1">
                          {tags.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase())).map(t => (
                            <button 
                              key={t.id} 
                              disabled={form.tagIds.length >= 5 && !form.tagIds.includes(t.id)}
                              onClick={() => {
                                const nextTags = form.tagIds.includes(t.id) 
                                  ? form.tagIds.filter(id => id !== t.id)
                                  : [...form.tagIds, t.id];
                                setForm({...form, tagIds: nextTags});
                              }}
                              className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-muted transition-colors flex items-center justify-between group disabled:opacity-30"
                            >
                              {t.name}
                              {form.tagIds.includes(t.id) && <Check size={14} className="text-foreground" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Product Description * (40-5000 chars)</label>
                    <MarkdownTextarea value={form.richDescription} onChange={v => setForm({...form, richDescription: v})} rows={6} placeholder="Describe your product outcomes..." />
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Logo Section */}
                  <div className="space-y-4">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Logo *</label>
                    <div className="flex items-start gap-6">
                      {logo && (
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                            <img src={logo.previewUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setLogo(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <label className={cn(
                        "flex-1 max-w-[320px] aspect-square rounded-2xl border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-foreground/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center p-6",
                        logo && "hidden sm:flex"
                      )}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files?.[0]) {
                              setLogo({ id: 'logo', file: e.target.files[0], previewUrl: URL.createObjectURL(e.target.files[0]) });
                            }
                          }}
                        />
                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                          <ImageIcon size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-foreground">Drop image or click to upload</p>
                        </div>
                      </label>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      Use a square format, at least 128x128px.
                    </p>
                  </div>

                  {/* Screenshots Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Images</label>
                      <p className="text-[10px] font-bold text-muted-foreground leading-relaxed uppercase tracking-widest">
                        Showcase your product with 1 to 3 images. Any dimensions work, but we recommend keeping the same aspect ratio for consistency. Click the preview button on the left to see how they&apos;ll look!
                      </p>
                    </div>

                    <div className="flex flex-col gap-6">
                      {screenshots.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {screenshots.map(s => (
                            <div key={s.id} className="relative group">
                              <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                                <img src={s.previewUrl} alt="Screenshot preview" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setScreenshots(prev => prev.filter(x => x.id !== s.id))}
                                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {screenshots.length < 3 && (
                        <label className="w-full aspect-video rounded-[2rem] border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-foreground/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center p-8">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={e => {
                              if (e.target.files) {
                                const newFiles = Array.from(e.target.files).map(f => ({
                                  id: Math.random().toString(),
                                  file: f,
                                  previewUrl: URL.createObjectURL(f)
                                }));
                                setScreenshots(prev => [...prev, ...newFiles].slice(0, 3));
                              }
                            }}
                          />
                          <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                            <ImageIcon size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-foreground">Drop images or click to upload</p>
                            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{3 - screenshots.length} left</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "socials" && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">X (Twitter)</label>
                      <input value={form.founderXUrl} onChange={e => setForm({...form, founderXUrl: e.target.value})} className={inputClassName()} placeholder="https://x.com/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">LinkedIn</label>
                      <input value={form.founderLinkedinUrl} onChange={e => setForm({...form, founderLinkedinUrl: e.target.value})} className={inputClassName()} placeholder="https://linkedin.com/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">GitHub</label>
                      <input value={form.founderGithubUrl} onChange={e => setForm({...form, founderGithubUrl: e.target.value})} className={inputClassName()} placeholder="https://github.com/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Facebook</label>
                      <input value={form.founderFacebookUrl} onChange={e => setForm({...form, founderFacebookUrl: e.target.value})} className={inputClassName()} placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-10 border-t border-border flex justify-between items-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                  * Required fields
                </p>
                <button
                  onClick={handleProceedToPlan}
                  disabled={isBusy}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-2xl font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isBusy ? <Loader2 size={18} className="animate-spin" /> : "Save & Choose Plan"}
                  {!isBusy && <ArrowRight size={18} />}
                </button>
              </div>
              {errorMessage && <p className="mt-4 text-xs font-bold text-destructive text-center">{errorMessage}</p>}
            </div>
          </div>

          <aside className="space-y-6">
            <div className="bg-primary p-8 rounded-[2rem] text-primary-foreground shadow-2xl shadow-black/10">
              <h3 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-6">Preview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                    {logo ? <img src={logo.previewUrl} className="w-full h-full object-cover" /> : <Rocket size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{form.name || "Product Name"}</p>
                    <p className="text-[10px] font-bold opacity-60 uppercase">{form.pricingModel || "Pricing"}</p>
                  </div>
                </div>
                <p className="text-xs font-medium opacity-80 leading-relaxed line-clamp-2">
                  {form.tagline || "Your product tagline will appear here."}
                </p>
              </div>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-2xl">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Submission Guide</h4>
              <ul className="space-y-4">
                {[
                  "Use high-quality PNG for logo",
                  "Pick the most relevant category",
                  "Describe outcomes, not features"
                ].map((txt, i) => (
                  <li key={i} className="flex gap-2 text-xs font-bold text-muted-foreground leading-relaxed">
                    <span className="text-foreground font-black">•</span> {txt}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-card border border-border p-6 rounded-2xl">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
                  Completion Checklist
                </h4>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                  {submissionChecklist.filter((item) => item.complete).length}/{submissionChecklist.length}
                </span>
              </div>
              <ul className="space-y-3">
                {submissionChecklist.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center justify-between gap-3 text-xs font-bold"
                  >
                    <span className={cn(item.complete ? "text-foreground" : "text-muted-foreground")}>
                      {item.label}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest",
                        item.complete
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700",
                      )}
                    >
                      {item.complete ? <Check size={12} /> : <X size={12} />}
                      {item.complete ? "Done" : "Missing"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>
      ) : (
        /* STEP 2: CHOOSE PLAN */
        <div className="space-y-12 animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center space-y-4">
            <h2 className="text-4xl font-black tracking-tight lowercase">Choose your launch path</h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
              Ready to go live? Choose a plan that fits your goals. 
              Verified badges help you build authority with our community.
            </p>
          </div>

          {errorMessage ? (
            <div className="max-w-4xl mx-auto rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="max-w-4xl mx-auto rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            {/* FREE PLAN */}
            <div className={cn(
              "p-8 rounded-[2.5rem] border transition-all flex flex-col h-full",
              form.submissionType === "FREE_LAUNCH" ? "border-foreground bg-card ring-4 ring-foreground/5 shadow-2xl" : "border-border bg-card hover:border-foreground/30"
            )}
            onClick={() => setForm({ ...form, submissionType: "FREE_LAUNCH" })}
            >
              <div className="flex items-center justify-between mb-8">
                <div className="bg-muted text-foreground p-3 rounded-2xl border border-border"><Zap size={24} /></div>
                <span className="text-4xl font-black">$0</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Free Launch</h3>
              <p className="text-sm text-muted-foreground font-medium mb-8 flex-1">
                Launch for free by including our trust badge on your website. 
                Best for early-stage bootstrapped founders.
              </p>
              <ul className="space-y-4 mb-10">
                {["Public listing forever", "Category placement", "Founder verified badge", "Requires backlink"].map(p => (
                  <li key={p} className="flex gap-3 text-sm font-bold text-foreground/80">
                    <Check size={16} className="text-emerald-500 mt-0.5" /> {p}
                  </li>
                ))}
              </ul>
              
              <button 
                onClick={() => handleFinalSubmit("FREE_LAUNCH")}
                disabled={draftBadgeVerification !== "VERIFIED" || isBusy}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-sm transition-all",
                  draftBadgeVerification === "VERIFIED" && !isBusy
                    ? "bg-primary text-primary-foreground shadow-xl shadow-black/10 hover:opacity-90 active:scale-95" 
                    : "bg-muted text-muted-foreground/50 cursor-not-allowed border border-border"
                )}
              >
                {isSubmittingDraft
                  ? "Submitting..."
                  : draftBadgeVerification === "VERIFIED"
                    ? "Submit Free Launch"
                    : "Verify Badge First"}
              </button>
            </div>

            {/* PREMIUM PLAN */}
            <div className={cn(
              "p-8 rounded-[2.5rem] border transition-all flex flex-col h-full relative",
              form.submissionType === "FEATURED_LAUNCH" ? "border-foreground bg-card ring-4 ring-foreground/5 shadow-2xl" : "border-border bg-card hover:border-foreground/30"
            )}
            onClick={() => setForm({ ...form, submissionType: "FEATURED_LAUNCH" })}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-lg">Most Popular</div>
              <div className="flex items-center justify-between mb-8">
                <div className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-xl shadow-black/10"><Star size={24} /></div>
                <span className="text-4xl font-black">$9</span>
              </div>
              <h3 className="text-2xl font-black mb-2">Featured Boost</h3>
              <p className="text-sm text-muted-foreground font-medium mb-8 flex-1">
                Get priority placement, scheduled launch date, and higher visibility 
                across the entire platform. No badge required.
              </p>
              <ul className="space-y-4 mb-10">
                {["Priority weighting", "Scheduled launch date", "Featured badge", "No backlink required", "Direct distribution support"].map(p => (
                  <li key={p} className="flex gap-3 text-sm font-bold text-foreground/80">
                    <Check size={16} className="text-foreground mt-0.5" /> {p}
                  </li>
                ))}
              </ul>
              <div className="mb-6 space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Preferred launch date *
                </label>
                <input
                  type="date"
                  min={minFeaturedLaunchDate}
                  value={form.preferredLaunchDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      submissionType: "FEATURED_LAUNCH",
                      preferredLaunchDate: event.target.value,
                    })
                  }
                  className={inputClassName()}
                />
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  This is only required for the featured plan.
                </p>
              </div>
              <button 
                onClick={() => handleFinalSubmit("FEATURED_LAUNCH")}
                disabled={isBusy}
                className="w-full py-4 rounded-2xl bg-foreground text-background font-black text-sm shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
              >
                {isSubmittingDraft ? "Starting checkout..." : "Featured Launch & Pay"}
              </button>
            </div>
          </div>

          {/* Badge Verification Section */}
          <div className="max-w-4xl mx-auto bg-muted/20 border border-border rounded-[2.5rem] p-10 space-y-8">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-xl font-black">Free Launch Badge</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  To launch for free, please add our trust badge to your website footer. 
                  We verify the same website URL you entered in step 1.
                </p>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">
                    Website URL being checked
                  </p>
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground">
                    <span className="truncate">{ensureHttps(form.websiteUrl) || "Add your website URL in step 1"}</span>
                    {isValidUrl(form.websiteUrl) ? (
                      <a
                        href={ensureHttps(form.websiteUrl)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-muted-foreground transition hover:text-foreground"
                      >
                        <ExternalLink size={16} />
                      </a>
                    ) : null}
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Badge theme
                  </p>
                  <div className="flex flex-wrap gap-5 text-sm font-bold text-foreground">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="badge-theme"
                        checked={badgeTheme === "light"}
                        onChange={() => setBadgeTheme("light")}
                      />
                      Light badge
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="badge-theme"
                        checked={badgeTheme === "dark"}
                        onChange={() => setBadgeTheme("dark")}
                      />
                      Dark badge
                    </label>
                  </div>
                </div>
                <div className="pt-4 flex flex-wrap gap-4 justify-center md:justify-start">
                  <button 
                    onClick={handleVerifyBadge}
                    disabled={isVerifyingBadge || !draftSubmissionId || !isValidUrl(form.websiteUrl)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl font-black text-xs shadow-lg shadow-black/10 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    {isVerifyingBadge ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                    {isVerifyingBadge ? "Verifying..." : "Verify Badge Now"}
                  </button>
                  <Link href={`mailto:${supportEmail}`} className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition-colors">
                    Need help? Contact support →
                  </Link>
                </div>
              </div>
                <div className="shrink-0 space-y-4 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Badge Preview</p>
                <div className={cn("w-72 rounded-2xl border border-border p-6", badgeTheme === "dark" ? "bg-white" : "bg-background")}>
                  <a href={shipboostUrl} target="_blank" rel="noopener">
                    <img src={badgePreviewSrc} alt={`${badgeTheme} Shipboost badge preview`} className="mx-auto h-auto max-h-16 w-auto" />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Badge Snippet</p>
                  <button
                    type="button"
                    onClick={() => void handleCopyBadgeSnippet()}
                    className="text-[10px] font-black uppercase tracking-widest text-foreground underline decoration-border underline-offset-4"
                  >
                    {copiedBadgeSnippet ? "Copied" : "Copy"}
                  </button>
                </div>
                <textarea 
                  readOnly 
                  value={freeLaunchBadgeSnippet} 
                  className="w-72 h-32 rounded-xl bg-background border border-border p-4 text-[10px] font-mono text-muted-foreground/60 leading-relaxed outline-none focus:border-foreground"
                />
              </div>
            </div>
            
            <div className="pt-8 border-t border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                <span className="text-muted-foreground/60">Status:</span>
                <span className={cn(draftBadgeVerification === "VERIFIED" ? "text-emerald-500" : "text-foreground")}>
                  {draftBadgeVerification}
                </span>
              </div>
              <button onClick={() => setStep(1)} className="text-xs font-bold text-muted-foreground hover:text-foreground underline decoration-border underline-offset-4">
                Back to Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
