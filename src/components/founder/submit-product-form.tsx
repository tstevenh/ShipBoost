"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Rocket, ShieldCheck, Star, Zap, Loader2, Check,
  ChevronDown, Layout, Image as ImageIcon, Share2, ExternalLink,
  Search, X, ArrowRight, Trash2
} from "lucide-react";

import { MarkdownTextarea } from "@/components/forms/markdown-textarea";
import {
  premiumLaunchAvailable,
  premiumLaunchUnavailableMessage,
} from "@/lib/premium-launch";
import { captureBrowserPostHogEvent } from "@/lib/posthog-browser";
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
  supportEmail: string;
  premiumLaunchWeeks: Array<{
    value: string;
    label: string;
  }>;
  initialDraft?: {
    id: string;
    submissionType: SubmissionType;
    reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
    paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
    badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
    preferredLaunchDate: string | null;
    tool: {
      id: string;
      slug: string;
      name: string;
      tagline: string;
      websiteUrl: string;
      richDescription: string;
      pricingModel: PricingModel;
      affiliateUrl: string | null;
      affiliateSource: string | null;
      hasAffiliateProgram: boolean;
      founderXUrl: string | null;
      founderGithubUrl: string | null;
      founderLinkedinUrl: string | null;
      founderFacebookUrl: string | null;
      logoMedia: UploadedMediaAsset | null;
      screenshots: UploadedMediaAsset[];
      categoryIds: string[];
      tagIds: string[];
    };
  } | null;
  isPrelaunch?: boolean;
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

type UploadedMediaAsset = {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
};

type DraftImage = {
  id: string;
  previewUrl: string;
  file?: File;
  asset?: UploadedMediaAsset;
};

type SavedSubmission = {
  id: string;
  submissionType: SubmissionType;
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
};

type UploadedDraftMediaPayload = {
  logo?: UploadedMediaAsset;
  screenshots: UploadedMediaAsset[];
};

const foundingPremiumPrice = {
  original: "$19",
  discounted: "$9",
  label: "Founding price for the first 100 premium launches",
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

function createDraftImage(file: File): DraftImage {
  return {
    id: crypto.randomUUID(),
    file,
    previewUrl: URL.createObjectURL(file),
  };
}

function createDraftImageFromAsset(asset: UploadedMediaAsset): DraftImage {
  return {
    id: crypto.randomUUID(),
    previewUrl: asset.url,
    asset,
  };
}

function maybeRevokeObjectUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function buildSubmissionPayload(
  form: FormState,
  submissionId: string | null,
  logo: UploadedMediaAsset,
  screenshots: UploadedMediaAsset[],
) {
  return {
    submissionId: submissionId ?? undefined,
    submissionType: form.submissionType,
    requestedSlug: form.requestedSlug || undefined,
    preferredLaunchDate: form.preferredLaunchDate || undefined,
    name: form.name,
    tagline: form.tagline,
    websiteUrl: ensureHttps(form.websiteUrl),
    richDescription: form.richDescription,
    pricingModel: form.pricingModel,
    categoryIds: form.categoryIds,
    tagIds: form.tagIds,
    affiliateUrl: ensureHttps(form.affiliateUrl) || undefined,
    affiliateSource: form.affiliateSource || undefined,
    hasAffiliateProgram: form.hasAffiliateProgram,
    founderXUrl: ensureHttps(form.founderXUrl) || undefined,
    founderGithubUrl: ensureHttps(form.founderGithubUrl) || undefined,
    founderLinkedinUrl: ensureHttps(form.founderLinkedinUrl) || undefined,
    founderFacebookUrl: ensureHttps(form.founderFacebookUrl) || undefined,
    logo,
    screenshots,
  };
}

function createFormFromDraft(
  draft: NonNullable<SubmitProductFormProps["initialDraft"]>,
): FormState {
  return {
    submissionType: draft.submissionType,
    requestedSlug: draft.tool.slug,
    preferredLaunchDate: draft.preferredLaunchDate
      ? draft.preferredLaunchDate.slice(0, 10)
      : "",
    name: draft.tool.name,
    tagline: draft.tool.tagline,
    websiteUrl: draft.tool.websiteUrl,
    richDescription: draft.tool.richDescription,
    pricingModel: draft.tool.pricingModel,
    affiliateUrl: draft.tool.affiliateUrl ?? "",
    affiliateSource: draft.tool.affiliateSource ?? "",
    hasAffiliateProgram: draft.tool.hasAffiliateProgram,
    founderXUrl: draft.tool.founderXUrl ?? "",
    founderGithubUrl: draft.tool.founderGithubUrl ?? "",
    founderLinkedinUrl: draft.tool.founderLinkedinUrl ?? "",
    founderFacebookUrl: draft.tool.founderFacebookUrl ?? "",
    categoryIds: draft.tool.categoryIds,
    tagIds: draft.tool.tagIds,
  };
}

export function SubmitProductForm({
  categories,
  tags,
  supportEmail,
  premiumLaunchWeeks,
  initialDraft = null,
  isPrelaunch = false,
}: SubmitProductFormProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(initialDraft ? 2 : 1);
  const [activeTab, setActiveTab] = useState<"general" | "media" | "socials">("general");
  const [form, setForm] = useState<FormState>(
    initialDraft ? createFormFromDraft(initialDraft) : emptyForm(),
  );
  const [logo, setLogo] = useState<DraftImage | null>(
    initialDraft?.tool.logoMedia
      ? createDraftImageFromAsset(initialDraft.tool.logoMedia)
      : null,
  );
  const [screenshots, setScreenshots] = useState<DraftImage[]>(
    initialDraft?.tool.screenshots.map(createDraftImageFromAsset) ?? [],
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [slugStatus, setSlugStatus] = useState<string>("");
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(
    initialDraft?.id ?? null,
  );
  const [draftBadgeVerification, setDraftBadgeVerification] = useState<SavedSubmission["badgeVerification"]>(
    initialDraft?.badgeVerification ?? "PENDING",
  );
  const [lastSavedDraft, setLastSavedDraft] = useState<SavedSubmission | null>(
    initialDraft
      ? {
          id: initialDraft.id,
          submissionType: initialDraft.submissionType,
          reviewStatus: initialDraft.reviewStatus,
          paymentStatus: initialDraft.paymentStatus,
          badgeVerification: initialDraft.badgeVerification,
        }
      : null,
  );
  const [lastSavedPayloadSignature, setLastSavedPayloadSignature] = useState<string | null>(null);
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>("light");
  const [copiedBadgeSnippet, setCopiedBadgeSnippet] = useState(false);
  
  const [catSearch, setCatSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  const isBusy = isSavingDraft || isSubmittingDraft || isVerifyingBadge;
  const shipboostUrl = "https://shipboost.io";
  const badgeAssetPath =
    badgeTheme === "light"
      ? "/ShipBoost-Badge/ShipBoost-Light-Badge.svg"
      : "/ShipBoost-Badge/ShipBoost-Dark-Badge.svg";
  const badgePreviewSrc = `${shipboostUrl}${badgeAssetPath}`;
  const freeLaunchBadgeSnippet = `<a href="${shipboostUrl}" data-shipboost-badge="free-launch" target="_blank" rel="noopener">
  <img src="${badgePreviewSrc}" alt="Launching soon on ShipBoost" style="height: 54px; width: auto;" />
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
  useEffect(() => {
    if (!form.name.trim() || draftSubmissionId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/tools/slug-suggestion?value=${encodeURIComponent(form.name)}`, { signal: controller.signal });
        const payload = await response.json();
        if (response.ok && payload.data?.slug) {
          setForm(prev => ({ ...prev, requestedSlug: payload.data.slug }));
          setSlugStatus(`Suggested: ${payload.data.slug}`);
        }
      } catch {}
    }, 250);
    return () => { controller.abort(); clearTimeout(timer); };
  }, [draftSubmissionId, form.name]);

  async function handleCopyBadgeSnippet() {
    try {
      await navigator.clipboard.writeText(freeLaunchBadgeSnippet);
      setCopiedBadgeSnippet(true);
      window.setTimeout(() => setCopiedBadgeSnippet(false), 1500);
    } catch {
      setErrorMessage("Unable to copy the badge snippet.");
    }
  }

  async function uploadPendingMedia(currentLogo: DraftImage | null, currentScreenshots: DraftImage[]) {
    const pendingLogo = currentLogo?.file && !currentLogo.asset ? currentLogo : null;
    const pendingScreenshots = currentScreenshots.filter(
      (image) => image.file && !image.asset,
    );

    if (!pendingLogo && pendingScreenshots.length === 0) {
      return {
        logo: currentLogo,
        screenshots: currentScreenshots,
      };
    }

    const formData = new FormData();

    if (pendingLogo?.file) {
      formData.append("logo", pendingLogo.file);
    }

    pendingScreenshots.forEach((image) => {
      if (image.file) {
        formData.append("screenshots", image.file);
      }
    });

    const response = await fetch("/api/submissions/media", {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to upload media.");
    }

    const uploaded = payload.data as UploadedDraftMediaPayload;

    if (pendingLogo && !uploaded.logo) {
      throw new Error("Logo upload did not complete.");
    }

    if (uploaded.screenshots.length !== pendingScreenshots.length) {
      throw new Error("Screenshot upload did not complete.");
    }

    const nextLogo: DraftImage | null =
      pendingLogo && uploaded.logo && currentLogo
        ? {
            ...currentLogo,
            asset: uploaded.logo,
            previewUrl: uploaded.logo.url,
            file: undefined,
          }
        : currentLogo;

    if (pendingLogo && currentLogo) {
      maybeRevokeObjectUrl(currentLogo.previewUrl);
    }

    let uploadedScreenshotIndex = 0;
    const nextScreenshots = currentScreenshots.map((image) => {
      if (!image.file || image.asset) {
        return image;
      }

      const uploadedAsset = uploaded.screenshots[uploadedScreenshotIndex];

      if (!uploadedAsset) {
        throw new Error("Screenshot upload did not complete.");
      }

      uploadedScreenshotIndex += 1;
      maybeRevokeObjectUrl(image.previewUrl);

      return {
        ...image,
        asset: uploadedAsset,
        previewUrl: uploadedAsset.url,
        file: undefined,
      };
    });

    setLogo(nextLogo);
    setScreenshots(nextScreenshots);

    return {
      logo: nextLogo,
      screenshots: nextScreenshots,
    };
  }

  async function saveDraft(overrides: Partial<FormState> = {}) {
    if (!logo) throw new Error("Please upload a logo first.");
    const nextForm = { ...form, ...overrides };
    setIsSavingDraft(true);

    try {
      const uploadedMedia = await uploadPendingMedia(logo, screenshots);

      if (!uploadedMedia.logo?.asset) {
        throw new Error("Please upload a logo first.");
      }

      const payloadBody = buildSubmissionPayload(
        nextForm,
        draftSubmissionId,
        uploadedMedia.logo.asset,
        uploadedMedia.screenshots.flatMap((image) =>
          image.asset ? [image.asset] : [],
        ),
      );
      const payloadSignature = JSON.stringify(payloadBody);

      if (draftSubmissionId && payloadSignature === lastSavedPayloadSignature && lastSavedDraft) {
        setForm(nextForm);
        setDraftBadgeVerification(lastSavedDraft.badgeVerification);
        return lastSavedDraft;
      }

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify(payloadBody),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Save failed.");
      const savedDraft = payload.data as SavedSubmission;

      setForm(nextForm);
      setDraftSubmissionId(savedDraft.id);
      setDraftBadgeVerification(savedDraft.badgeVerification);
      setLastSavedDraft(savedDraft);
      setLastSavedPayloadSignature(
        JSON.stringify({
          ...payloadBody,
          submissionId: savedDraft.id,
        }),
      );
      return savedDraft;
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
      setLastSavedDraft((current) =>
        current && current.id === draftSubmissionId
          ? {
              ...current,
              badgeVerification: payload.data.submission.badgeVerification,
            }
          : current,
      );
      if (payload.data.verified) setSuccessMessage(payload.data.message);
      else setErrorMessage(payload.data.message || "Badge not found. Make sure it's in your footer.");
    } catch { setErrorMessage("Verification failed."); }
    finally { setIsVerifyingBadge(false); }
  }

  async function handleFinalSubmit(type: SubmissionType) {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingDraft(true);

    try {
      if (type === "FEATURED_LAUNCH") {
        if (!premiumLaunchAvailable) {
          throw new Error(premiumLaunchUnavailableMessage);
        }

        if (!form.preferredLaunchDate) {
          throw new Error("Please choose your preferred launch week first.");
        }

        const savedDraft = await saveDraft({
          submissionType: type,
          preferredLaunchDate: form.preferredLaunchDate,
        });
        const response = await fetch("/api/dodo/checkout/premium-launch", {
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

        captureBrowserPostHogEvent("premium_launch_checkout_started", {
          submission_id: savedDraft.id,
          source_surface: "submit_product_form",
        });
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
            <span className={cn("text-sm font-black  tracking-widest", step >= 1 ? "text-foreground" : "text-muted-foreground")}>Details</span>
          </div>
          <div className="h-px w-12 bg-border" />
          <div className="flex items-center gap-3">
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-colors", step >= 2 ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>2</div>
            <span className={cn("text-sm font-black  tracking-widest", step >= 2 ? "text-foreground" : "text-muted-foreground")}>Choose Plan</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-black  tracking-[0.2em] text-muted-foreground/40">
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
                    "flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black  tracking-widest transition-all border-b-2",
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
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">Product Name *</label>
                      <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputClassName()} placeholder="Acme SaaS" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">Slug *</label>
                      <input value={form.requestedSlug} onChange={e => setForm({...form, requestedSlug: slugify(e.target.value)})} className={inputClassName()} />
                      <p className="text-[10px] font-bold text-muted-foreground/60">{slugStatus}</p>
                    </div>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">Website URL *</label>
                      <input required value={form.websiteUrl} onChange={e => setForm({...form, websiteUrl: e.target.value})} className={inputClassName()} placeholder="https://acme.com" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">Pricing Model *</label>
                      <select value={form.pricingModel} onChange={e => setForm({...form, pricingModel: e.target.value as PricingModelSelection})} className={inputClassName()}>
                        <option value="">Select pricing model</option>
                        {pricingModels.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black  tracking-widest text-muted-foreground">Tagline * (10-60 chars)</label>
                    <input required maxLength={60} value={form.tagline} onChange={e => setForm({...form, tagline: e.target.value})} className={inputClassName()} placeholder="Short, punchy description of what you do" />
                  </div>
                  
                  {/* Category Dropdown */}
                  <div className="space-y-2 relative">
                    <label className="text-xs font-black  tracking-widest text-muted-foreground">Category * (Pick 1)</label>
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
                    <label className="text-xs font-black  tracking-widest text-muted-foreground">Tags (Pick up to 5)</label>
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
                    <label className="text-xs font-black  tracking-widest text-muted-foreground">Product Description * (40-5000 chars)</label>
                    <MarkdownTextarea value={form.richDescription} onChange={v => setForm({...form, richDescription: v})} rows={6} placeholder="Describe your product outcomes..." />
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Logo Section */}
                  <div className="space-y-4">
                    <label className="text-xs font-black  tracking-widest text-muted-foreground">Logo *</label>
                    <div className="flex items-start gap-6">
                      {logo && (
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={logo.previewUrl} alt="Logo preview" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              maybeRevokeObjectUrl(logo.previewUrl);
                              setLogo(null);
                            }}
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
                              if (logo) {
                                maybeRevokeObjectUrl(logo.previewUrl);
                              }

                              setLogo(createDraftImage(e.target.files[0]));
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
                    <p className="text-[10px] font-bold text-muted-foreground  tracking-widest">
                      Use a square format, at least 128x128px.
                    </p>
                  </div>

                  {/* Screenshots Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">Images</label>
                      <p className="text-[10px] font-bold text-muted-foreground leading-relaxed  tracking-widest">
                        Showcase your product with 1 to 3 images. Any dimensions work, but we recommend keeping the same aspect ratio for consistency. Click the preview button on the left to see how they&apos;ll look!
                      </p>
                    </div>

                    <div className="flex flex-col gap-6">
                      {screenshots.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {screenshots.map(s => (
                            <div key={s.id} className="relative group">
                              <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={s.previewUrl} alt="Screenshot preview" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  setScreenshots((prev) => {
                                    maybeRevokeObjectUrl(s.previewUrl);
                                    return prev.filter((x) => x.id !== s.id);
                                  })
                                }
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
                                const newFiles = Array.from(e.target.files).map(createDraftImage);
                                setScreenshots(prev => [...prev, ...newFiles].slice(0, 3));
                              }
                            }}
                          />
                          <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-foreground transition-colors">
                            <ImageIcon size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-foreground">Drop images or click to upload</p>
                            <p className="text-xs font-bold text-muted-foreground  tracking-widest">{3 - screenshots.length} left</p>
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
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">X (Twitter)</label>
                      <input value={form.founderXUrl} onChange={e => setForm({...form, founderXUrl: e.target.value})} className={inputClassName()} placeholder="https://x.com/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">LinkedIn</label>
                      <input value={form.founderLinkedinUrl} onChange={e => setForm({...form, founderLinkedinUrl: e.target.value})} className={inputClassName()} placeholder="https://linkedin.com/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">GitHub</label>
                      <input value={form.founderGithubUrl} onChange={e => setForm({...form, founderGithubUrl: e.target.value})} className={inputClassName()} placeholder="https://github.com/..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground">Facebook</label>
                      <input value={form.founderFacebookUrl} onChange={e => setForm({...form, founderFacebookUrl: e.target.value})} className={inputClassName()} placeholder="https://facebook.com/..." />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-10 border-t border-border flex justify-between items-center">
                <p className="text-[10px] font-bold text-muted-foreground  tracking-widest">
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
              <h3 className="text-[10px] font-black  tracking-widest opacity-60 mb-6">Preview</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center overflow-hidden">
                    {logo ? (
                      <>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={logo.previewUrl} alt="Product logo preview" className="w-full h-full object-cover" />
                      </>
                    ) : <Rocket size={20} />}
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-sm truncate">{form.name || "Product Name"}</p>
                    <p className="text-[10px] font-bold opacity-60 ">{form.pricingModel || "Pricing"}</p>
                  </div>
                </div>
                <p className="text-xs font-medium opacity-80 leading-relaxed line-clamp-2">
                  {form.tagline || "Your product tagline will appear here."}
                </p>
              </div>
            </div>
            
            <div className="bg-card border border-border p-6 rounded-2xl">
              <h4 className="text-[10px] font-black  tracking-widest text-muted-foreground/60 mb-4">Submission Guide</h4>
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
                <h4 className="text-[10px] font-black  tracking-widest text-muted-foreground/60">
                  Completion Checklist
                </h4>
                <span className="text-[10px] font-black  tracking-widest text-muted-foreground">
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
                        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black  tracking-widest",
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
            <h2 className="text-4xl font-black tracking-tight ">Choose your launch path</h2>
            <p className="text-muted-foreground font-medium max-w-xl mx-auto">
              Choose the path that fits your product stage. Free Launch is best
              if you are flexible and happy to verify the badge. Premium Launch
              is best if timing, lower friction, and stronger baseline placement
              matter more.
            </p>
          </div>

          {isPrelaunch ? (
            <div className="max-w-4xl mx-auto rounded-[2rem] border border-primary/20 bg-primary/5 px-6 py-5 text-center">
              <p className="text-[10px] font-black  tracking-[0.3em] text-primary">
                Prelaunch Mode
              </p>
              <p className="mt-3 text-sm font-bold leading-relaxed text-foreground">
                ShipBoost opens on May 4, 2026 UTC. Free launches are queued
                into weekly cohorts, and premium launches can reserve a launch
                week ahead of the opening.
              </p>
            </div>
          ) : null}

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
                {isPrelaunch
                  ? "Best for founders who want a credible public listing and weekly launch visibility, and are comfortable qualifying through badge verification before the May opening cohort."
                  : "Best for founders who want a credible public listing and weekly launch visibility, and are comfortable qualifying through badge verification."}
              </p>
              <ul className="space-y-4 mb-10">
                {["Weekly launchpad placement", "Public listing on ShipBoost", "Founder trust signal", "Requires badge verification"].map(p => (
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
              form.submissionType === "FEATURED_LAUNCH"
                ? "border-foreground bg-card ring-4 ring-foreground/5 shadow-2xl"
                : premiumLaunchAvailable
                  ? "border-border bg-card hover:border-foreground/30"
                  : "border-border bg-card opacity-80"
            )}
            onClick={() => {
              if (!premiumLaunchAvailable) {
                return;
              }

              setForm({ ...form, submissionType: "FEATURED_LAUNCH" });
            }}
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-foreground text-background text-[10px] font-black  tracking-widest px-4 py-1 rounded-full shadow-lg">Most Popular</div>
              <div className="flex items-center justify-between mb-8">
                <div className="bg-primary text-primary-foreground p-3 rounded-2xl shadow-xl shadow-black/10"><Star size={24} /></div>
                <div className="text-right">
                  <div className="text-sm font-black text-muted-foreground line-through">
                    {foundingPremiumPrice.original}
                  </div>
                  <span className="text-4xl font-black">{foundingPremiumPrice.discounted}</span>
                </div>
              </div>
              <h3 className="text-2xl font-black mb-2">Premium Launch</h3>
              <p className="text-[10px] font-black  tracking-widest text-primary mb-3">
                {foundingPremiumPrice.label}
              </p>
              <p className="text-sm text-muted-foreground font-medium mb-8 flex-1">
                Best for founders who care about timing, lower friction,
                stronger placement, and an editorial launch spotlight during
                launch week.
              </p>
              {!premiumLaunchAvailable ? (
                <p className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-700">
                  {premiumLaunchUnavailableMessage}
                </p>
              ) : null}
              <ul className="space-y-4 mb-10">
                {[
                  "Reserve a specific launch week",
                  "Skip badge verification and launch faster",
                  "Stronger baseline board placement",
                  "Keep a permanent public listing",
                  "Includes one editorial launch spotlight during launch week",
                ].map((p) => (
                  <li key={p} className="flex gap-3 text-sm font-bold text-foreground/80">
                    <Check size={16} className="text-foreground mt-0.5" /> {p}
                  </li>
                ))}
              </ul>
              <div className="mb-6 space-y-2">
                <label className="text-xs font-black  tracking-widest text-muted-foreground">
                  Preferred launch week *
                </label>
                <select
                  value={form.preferredLaunchDate}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      submissionType: "FEATURED_LAUNCH",
                      preferredLaunchDate: event.target.value,
                    })
                  }
                  disabled={!premiumLaunchAvailable}
                  className={inputClassName()}
                >
                  <option value="">Select a launch week</option>
                  {premiumLaunchWeeks.map((week) => (
                    <option key={week.value} value={week.value}>
                      {week.label}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] font-bold  tracking-widest text-muted-foreground">
                  {isPrelaunch
                    ? "Choose one of the available weekly launch windows starting May 4, 2026 UTC."
                    : "Premium launches are reserved by week, not by day."}
                </p>
              </div>
              <button 
                onClick={() => handleFinalSubmit("FEATURED_LAUNCH")}
                disabled={isBusy || !premiumLaunchAvailable}
                className={cn(
                  "w-full py-4 rounded-2xl font-black text-sm transition-all",
                  premiumLaunchAvailable
                    ? "bg-foreground text-background shadow-xl shadow-black/10 hover:opacity-90 active:scale-95 disabled:opacity-50"
                    : "bg-muted text-muted-foreground/50 cursor-not-allowed border border-border"
                )}
              >
                {premiumLaunchAvailable
                  ? isSubmittingDraft
                    ? "Starting checkout..."
                    : "Reserve Premium Launch"
                  : "Temporarily unavailable"}
              </button>
              <p className="mt-3 text-[10px] font-bold tracking-widest text-muted-foreground">
                After checkout, ShipBoost reserves your week, opens your
                spotlight brief in the dashboard, and publishes the editorial
                launch spotlight during launch week.
              </p>
            </div>
          </div>

          {/* Badge Verification Section */}
          <div className="max-w-4xl mx-auto bg-muted/20 border border-border rounded-[2.5rem] p-10 space-y-8">
            <div className="flex flex-col md:flex-row gap-10 items-center">
              <div className="flex-1 space-y-4 text-center md:text-left">
                <h3 className="text-xl font-black">Free Launch Badge</h3>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed">
                  To launch for free, please add our trust badge to your website
                  footer. We verify the same website URL you entered in step 1.
                  This keeps the free launch surface more credible and filters
                  low-intent submissions.
                </p>
                <p className="text-xs font-bold leading-relaxed text-muted-foreground/80">
                  Premium Launch skips badge verification. You can also update
                  your listing later, and one category plus a few tags is enough
                  to get started.
                </p>
                <div className="rounded-2xl border border-border bg-background p-4">
                  <p className="text-[10px] font-black  tracking-widest text-muted-foreground mb-2">
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
                  <p className="text-[10px] font-black  tracking-widest text-muted-foreground">
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
                  <p className="text-[10px] font-black  tracking-widest text-muted-foreground">Badge Preview</p>
                <div className={cn("w-72 rounded-2xl border border-border p-6", badgeTheme === "dark" ? "bg-white" : "bg-background")}>
                  <a href={shipboostUrl} target="_blank" rel="noopener">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={badgePreviewSrc} alt={`${badgeTheme} ShipBoost badge preview`} className="mx-auto h-auto max-h-16 w-auto" />
                  </a>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black  tracking-widest text-muted-foreground">Badge Snippet</p>
                  <button
                    type="button"
                    onClick={() => void handleCopyBadgeSnippet()}
                    className="text-[10px] font-black  tracking-widest text-foreground underline decoration-border underline-offset-4"
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
              <div className="flex items-center gap-2 text-xs font-black  tracking-widest">
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
