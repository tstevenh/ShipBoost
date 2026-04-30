"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  Copy,
  Image as ImageIcon,
  Layout,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

import { MarkdownTextarea } from "@/components/forms/markdown-textarea";
import { NativeSelect } from "@/components/forms/native-select";
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
type LaunchType = "FREE" | "FEATURED" | "RELAUNCH";
type LaunchStatus = "PENDING" | "APPROVED" | "LIVE" | "ENDED" | "REJECTED";

type SubmitProductFormProps = {
  categories: CategoryOption[];
  tags: TagOption[];
  appUrl: string;
  supportEmail: string;
  premiumLaunchWeeks: Array<{
    value: string;
    label: string;
  }>;
  estimatedFreeLaunchDate?: string | null;
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
      launches?: ScheduledLaunch[];
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
  toolId?: string;
  submissionType: SubmissionType;
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
};

type UploadedDraftMediaPayload = {
  logo?: UploadedMediaAsset;
  screenshots: UploadedMediaAsset[];
};

type ScheduledLaunch = {
  id: string;
  launchType: LaunchType;
  status: LaunchStatus;
  launchDate: string;
};

const foundingPremiumPrice = {
  original: "$19",
  discounted: "$9",
  label: "Founding price for the first 100 founders",
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
  let normalized = value.trim();
  if (!normalized) return "";

  while (/^https?:\/\/https?:\/\//i.test(normalized)) {
    normalized = normalized.replace(/^https?:\/\//i, "");
  }

  if (/^https?:\/\//i.test(normalized)) return normalized;
  return `https://${normalized}`;
}

function isValidUrl(value: string) {
  const normalized = ensureHttps(value);

  if (!normalized || normalized === "https://") {
    return false;
  }

  try {
    const url = new URL(normalized);
    if (url.hostname === "http" || url.hostname === "https") {
      return false;
    }
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

function findActiveScheduledLaunch(
  draft: SubmitProductFormProps["initialDraft"],
) {
  const launches = draft?.tool.launches ?? [];
  const activeLaunch = launches.find(
    (launch) => launch.status !== "REJECTED" && launch.status !== "ENDED",
  );

  if (activeLaunch) {
    return activeLaunch;
  }

  if (draft?.preferredLaunchDate && draft.submissionType !== "LISTING_ONLY") {
    return {
      id: draft.id,
      launchType:
        draft.submissionType === "FEATURED_LAUNCH" ? "FEATURED" : "FREE",
      status: draft.reviewStatus === "REJECTED" ? "REJECTED" : "APPROVED",
      launchDate: draft.preferredLaunchDate,
    } satisfies ScheduledLaunch;
  }

  return null;
}

function formatLaunchDate(value: string | null | undefined) {
  if (!value) {
    return "your scheduled launch week";
  }

  return new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(value));
}

function formatLaunchWait(value: string | null | undefined) {
  if (!value) {
    return "~100 days";
  }

  const launchTime = new Date(value).getTime();

  if (Number.isNaN(launchTime)) {
    return "~100 days";
  }

  const days = Math.max(
    0,
    Math.ceil((launchTime - Date.now()) / (24 * 60 * 60 * 1000)),
  );

  if (days === 0) {
    return "less than 1 day";
  }

  return `~${days} ${days === 1 ? "day" : "days"}`;
}

export function SubmitProductForm({
  categories,
  tags,
  appUrl,
  supportEmail,
  premiumLaunchWeeks,
  estimatedFreeLaunchDate = null,
  initialDraft = null,
}: SubmitProductFormProps) {
  const router = useRouter();
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
  const [isDeletingProduct, setIsDeletingProduct] = useState(false);
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [isBadgePromptOpen, setIsBadgePromptOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [scheduleModalView, setScheduleModalView] = useState<"plans" | "premium-date">("plans");
  const [badgePromptSubmissionId, setBadgePromptSubmissionId] = useState<string | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [slugStatus, setSlugStatus] = useState<string>("");
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(
    initialDraft?.id ?? null,
  );
  const [toolId, setToolId] = useState<string | null>(
    initialDraft?.tool.id ?? null,
  );
  const [, setDraftBadgeVerification] = useState<SavedSubmission["badgeVerification"]>(
    initialDraft?.badgeVerification ?? "PENDING",
  );
  const [lastSavedDraft, setLastSavedDraft] = useState<SavedSubmission | null>(
    initialDraft
      ? {
          id: initialDraft.id,
          toolId: initialDraft.tool.id,
          submissionType: initialDraft.submissionType,
          reviewStatus: initialDraft.reviewStatus,
          paymentStatus: initialDraft.paymentStatus,
          badgeVerification: initialDraft.badgeVerification,
        }
      : null,
  );
  const [currentScheduledLaunch, setCurrentScheduledLaunch] =
    useState<ScheduledLaunch | null>(() => findActiveScheduledLaunch(initialDraft));
  const [lastSavedPayloadSignature, setLastSavedPayloadSignature] = useState<string | null>(null);
  const [badgeTheme, setBadgeTheme] = useState<BadgeTheme>("light");
  const [copiedBadgeTheme, setCopiedBadgeTheme] = useState<BadgeTheme | null>(null);
  const [catSearch, setCatSearch] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [isCatOpen, setIsCatOpen] = useState(false);
  const [isTagOpen, setIsTagOpen] = useState(false);

  const isBusy =
    isSavingDraft || isSubmittingDraft || isVerifyingBadge || isDeletingProduct;
  const isPremiumScheduled =
    currentScheduledLaunch?.launchType === "FEATURED" ||
    lastSavedDraft?.paymentStatus === "PAID";
  const isFreeScheduled =
    currentScheduledLaunch?.launchType === "FREE" && !isPremiumScheduled;
  const scheduledLaunchDate =
    currentScheduledLaunch?.launchDate ??
    (lastSavedDraft?.reviewStatus === "PENDING" ? form.preferredLaunchDate : null);
  const freeLaunchEstimateDate =
    currentScheduledLaunch?.launchType === "FREE"
      ? currentScheduledLaunch.launchDate
      : estimatedFreeLaunchDate;
  const selectedCategory = categories.find((category) => category.id === form.categoryIds[0]);
  const selectedTags = form.tagIds.flatMap((tagId) => {
    const tag = tags.find((item) => item.id === tagId);
    return tag ? [tag] : [];
  });
  const shipboostUrl = appUrl.replace(/\/$/, "");
  const shipboostHost = shipboostUrl.replace(/^https?:\/\//, "");
  const getBadgeAssetPath = (theme: BadgeTheme) =>
    theme === "light"
      ? "/ShipBoost-Badge/ShipBoost-Light-Badge.svg"
      : "/ShipBoost-Badge/ShipBoost-Dark-Badge.svg";
  const getBadgePreviewSrc = (theme: BadgeTheme) => `${shipboostUrl}${getBadgeAssetPath(theme)}`;
  const getFreeLaunchBadgeSnippet = (theme: BadgeTheme) => `<a href="${shipboostUrl}" data-shipboost-badge="free-launch" target="_blank" rel="noopener">
  <img src="${getBadgePreviewSrc(theme)}" alt="Featured on ShipBoost" style="height: 54px; width: auto;" />
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
  const requiredFieldsComplete = incompleteChecklistItems.length === 0;

  const filteredCategories = useMemo(
    () =>
      categories.filter((category) =>
        category.name.toLowerCase().includes(catSearch.toLowerCase()),
      ),
    [catSearch, categories],
  );
  const filteredTags = useMemo(
    () =>
      tags.filter((tag) =>
        tag.name.toLowerCase().includes(tagSearch.toLowerCase()),
      ),
    [tagSearch, tags],
  );

  useEffect(() => {
    if (!form.name.trim() || draftSubmissionId) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/tools/slug-suggestion?value=${encodeURIComponent(form.name)}`, { signal: controller.signal });
        const payload = await response.json();
        if (response.ok && payload.data?.slug) {
          setForm((prev) => ({ ...prev, requestedSlug: payload.data.slug }));
          setSlugStatus(`Suggested: ${payload.data.slug}`);
        }
      } catch {}
    }, 250);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [draftSubmissionId, form.name]);

  async function handleCopyBadgeSnippet(theme: BadgeTheme = badgeTheme) {
    try {
      await navigator.clipboard.writeText(getFreeLaunchBadgeSnippet(theme));
      setCopiedBadgeTheme(theme);
      window.setTimeout(() => setCopiedBadgeTheme(null), 1500);
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

      if (
        draftSubmissionId &&
        payloadSignature === lastSavedPayloadSignature &&
        lastSavedDraft
      ) {
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
      if (savedDraft.toolId) {
        setToolId(savedDraft.toolId);
      }
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

  async function handleSaveProduct() {
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await saveDraft();
      setSuccessMessage("Product saved.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to save your product."));
    }
  }

  async function handleDeleteProduct() {
    if (!toolId || isBusy) {
      return;
    }

    setDeleteConfirmationText("");
    setIsDeleteModalOpen(true);
  }

  async function confirmDeleteProduct() {
    if (!toolId || isBusy || deleteConfirmationText.trim() !== form.name) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeletingProduct(true);

    try {
      const response = await fetch(`/api/founder/tools/${toolId}`, {
        method: "DELETE",
      });
      const payload = await response.json().catch(() => null) as
        | { error?: string }
        | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete your product.");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to delete your product."));
      setIsDeletingProduct(false);
    }
  }

  async function handleOpenScheduleModal(view: "plans" | "premium-date" = "plans") {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (incompleteChecklistItems.length > 0) {
      setErrorMessage(`Please complete: ${incompleteChecklistItems.join(", ")}.`);
      return;
    }

    if (
      view === "premium-date" &&
      currentScheduledLaunch &&
      draftSubmissionId
    ) {
      setScheduleModalView(view);
      setIsScheduleModalOpen(true);
      return;
    }

    try {
      await saveDraft({
        submissionType: isPremiumScheduled ? "FEATURED_LAUNCH" : form.submissionType,
      });
      setScheduleModalView(view);
      setIsScheduleModalOpen(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to save before scheduling."));
    }
  }

  async function handleJoinFreeQueue() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingDraft(true);

    try {
      const savedDraft = await saveDraft({
        submissionType: "FREE_LAUNCH",
        preferredLaunchDate: "",
      });
      const response = await fetch(`/api/submissions/${savedDraft.id}/schedule-free`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to schedule your free launch.");
      }

      const data = payload.data as {
        submission: SavedSubmission & {
          preferredLaunchDate: string | null;
          tool?: { launches?: ScheduledLaunch[] };
        };
        launch: ScheduledLaunch;
      };

      setLastSavedDraft({
        id: data.submission.id,
        submissionType: data.submission.submissionType,
        reviewStatus: data.submission.reviewStatus,
        paymentStatus: data.submission.paymentStatus,
        badgeVerification: data.submission.badgeVerification,
      });
      setDraftSubmissionId(data.submission.id);
      setDraftBadgeVerification(data.submission.badgeVerification);
      setCurrentScheduledLaunch(data.launch);
      setForm((current) => ({
        ...current,
        submissionType: "FREE_LAUNCH",
        preferredLaunchDate:
          data.submission.preferredLaunchDate?.slice(0, 10) ??
          data.launch.launchDate.slice(0, 10),
      }));
      setBadgePromptSubmissionId(data.submission.id);
      setIsScheduleModalOpen(false);
      setIsBadgePromptOpen(true);
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to schedule your launch."));
    } finally {
      setIsSubmittingDraft(false);
    }
  }

  async function handleUnscheduleFreeLaunch() {
    if (!draftSubmissionId) return;
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingDraft(true);

    try {
      const response = await fetch(`/api/submissions/${draftSubmissionId}/unschedule-free`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Unable to unschedule your launch.");
      }

      const submission = payload.data as SavedSubmission & {
        preferredLaunchDate: string | null;
      };
      setLastSavedDraft({
        id: submission.id,
        submissionType: submission.submissionType,
        reviewStatus: submission.reviewStatus,
        paymentStatus: submission.paymentStatus,
        badgeVerification: submission.badgeVerification,
      });
      setCurrentScheduledLaunch(null);
      setForm((current) => ({ ...current, preferredLaunchDate: "" }));
      setSuccessMessage("Launch unscheduled.");
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to unschedule your launch."));
    } finally {
      setIsSubmittingDraft(false);
    }
  }

  async function handleVerifyBadge() {
    if (!badgePromptSubmissionId && !draftSubmissionId) return;
    setIsVerifyingBadge(true);
    setErrorMessage(null);

    try {
      const submissionId = badgePromptSubmissionId ?? draftSubmissionId;
      const response = await fetch(`/api/submissions/${submissionId}/verify-badge`, {
        method: "POST",
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Verification failed.");
      }

      const nextBadgeVerification = payload.data.submission.badgeVerification;
      setDraftBadgeVerification(nextBadgeVerification);
      setLastSavedDraft((current) =>
        current
          ? {
              ...current,
              badgeVerification: nextBadgeVerification,
            }
          : current,
      );
      if (payload.data.verified) {
        setSuccessMessage(payload.data.message);
        setIsBadgePromptOpen(false);
      } else {
        setErrorMessage(payload.data.message || "Badge not found. Make sure it is in your footer.");
      }
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Verification failed."));
    } finally {
      setIsVerifyingBadge(false);
    }
  }

  async function handleContinueWithoutBadge() {
    setIsBadgePromptOpen(false);
    setBadgePromptSubmissionId(null);
    setSuccessMessage("Launch scheduled.");
  }

  async function handlePremiumLaunch() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmittingDraft(true);

    try {
      if (!premiumLaunchAvailable) {
        throw new Error(premiumLaunchUnavailableMessage);
      }

      if (!form.preferredLaunchDate) {
        throw new Error("Please choose your preferred launch week first.");
      }

      if (lastSavedDraft?.paymentStatus === "PAID" && draftSubmissionId) {
        const response = await fetch(`/api/submissions/${draftSubmissionId}/reschedule`, {
          method: "PATCH",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify({ preferredLaunchDate: form.preferredLaunchDate }),
        });
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.error || "Unable to change launch date.");
        }

        setCurrentScheduledLaunch({
          id: currentScheduledLaunch?.id ?? draftSubmissionId,
          launchType: "FEATURED",
          status: "APPROVED",
          launchDate: form.preferredLaunchDate,
        });
        setIsScheduleModalOpen(false);
        setSuccessMessage("Premium launch date updated.");
        return;
      }

      const savedDraft =
        currentScheduledLaunch && draftSubmissionId
          ? { id: draftSubmissionId }
          : await saveDraft({
              submissionType: "FEATURED_LAUNCH",
              preferredLaunchDate: form.preferredLaunchDate,
            });
      const response = await fetch("/api/dodo/checkout/premium-launch", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          submissionId: savedDraft.id,
          preferredLaunchDate: form.preferredLaunchDate,
        }),
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
    } catch (error) {
      setErrorMessage(getErrorMessage(error, "Unable to continue with premium launch."));
    } finally {
      setIsSubmittingDraft(false);
    }
  }

  function choosePremiumDate(value: string) {
    setForm((current) => ({
      ...current,
      submissionType: "FEATURED_LAUNCH",
      preferredLaunchDate: value,
    }));
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {isDeleteModalOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-product-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
              <h3 id="delete-product-title" className="text-lg font-black tracking-tight text-foreground">
                Delete your product
              </h3>
              <button
                type="button"
                onClick={() => {
                  if (isDeletingProduct) return;
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText("");
                }}
                disabled={isDeletingProduct}
                className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
                aria-label="Close delete confirmation"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">
              <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                This permanently removes your listing, launch schedule, and submission data.
                Type <span className="font-black text-foreground">{form.name}</span> to confirm.
              </p>
              <input
                value={deleteConfirmationText}
                onChange={(event) => setDeleteConfirmationText(event.target.value)}
                className={cn(inputClassName(), "mt-5")}
                placeholder="Type product name"
                autoFocus
              />
              <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (isDeletingProduct) return;
                    setIsDeleteModalOpen(false);
                    setDeleteConfirmationText("");
                  }}
                  disabled={isDeletingProduct}
                  className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-3 text-sm font-black text-foreground transition hover:bg-muted disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDeleteProduct()}
                  disabled={
                    isDeletingProduct ||
                    deleteConfirmationText.trim() !== form.name
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-destructive px-5 py-3 text-sm font-black text-destructive-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isDeletingProduct ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Trash2 size={14} />
                  )}
                  Confirm delete
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isScheduleModalOpen ? (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-launch-title"
            className="w-full max-w-2xl rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-center justify-between gap-4 border-b border-border px-6 py-4">
              <h3 id="schedule-launch-title" className="text-lg font-black tracking-tight text-foreground">
                {scheduleModalView === "plans"
                  ? "Schedule your launch"
                  : "Skip the line and launch your product"}
              </h3>
              <button
                type="button"
                onClick={() => setIsScheduleModalOpen(false)}
                className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close schedule modal"
              >
                <X size={16} />
              </button>
            </div>

            {scheduleModalView === "plans" ? (
              <div className="space-y-4 p-6">
                <button
                  type="button"
                  onClick={() => void handleJoinFreeQueue()}
                  disabled={isSubmittingDraft}
                  className="w-full rounded-2xl border border-border bg-card p-5 text-left transition hover:border-foreground/40 disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl border border-border bg-background p-2 text-muted-foreground">
                      <CalendarDays size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-black text-foreground">
                          Join the waiting line (Free)
                        </h4>
                        <span className="text-sm font-black text-foreground">$0</span>
                      </div>
                      <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                        Get the next free launch slot. Free launches are capped at 10 per week.
                      </p>
                      <p className="mt-2 text-xs font-bold text-muted-foreground">
                        Estimated launch: in {formatLaunchWait(freeLaunchEstimateDate)}.
                      </p>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setScheduleModalView("premium-date")}
                  disabled={!premiumLaunchAvailable}
                  className="w-full rounded-2xl border border-primary/30 bg-primary/5 p-5 text-left transition hover:border-primary disabled:opacity-50"
                >
                  <div className="flex items-start gap-4">
                    <div className="rounded-xl bg-primary p-2 text-primary-foreground">
                      <Sparkles size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-base font-black text-foreground">
                          Premium Launch
                        </h4>
                        <span className="text-sm font-black text-foreground">
                          <span className="mr-2 text-muted-foreground line-through">
                            {foundingPremiumPrice.original}
                          </span>
                          {foundingPremiumPrice.discounted}
                        </span>
                      </div>
                      <p className="mt-1 text-[10px] font-black tracking-widest text-primary">
                        {foundingPremiumPrice.label}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm font-bold text-foreground/80">
                        {[
                          "Reserve a specific launch week",
                          "Get stronger baseline board placement",
                          "Includes one editorial launch spotlight during launch period",
                        ].map((item) => (
                          <li key={item} className="flex gap-2">
                            <Check size={15} className="mt-0.5 text-primary" />
                            {item}
                          </li>
                        ))}
                      </ul>
                      {!premiumLaunchAvailable ? (
                        <p className="mt-3 text-xs font-bold text-amber-700">
                          {premiumLaunchUnavailableMessage}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="grid gap-3 sm:grid-cols-2">
                  {premiumLaunchWeeks.map((week) => (
                    <button
                      key={week.value}
                      type="button"
                      onClick={() => choosePremiumDate(week.value)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-sm font-black transition",
                        form.preferredLaunchDate === week.value
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-foreground hover:border-foreground/40",
                      )}
                    >
                      {week.label}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setScheduleModalView("plans")}
                    className="text-sm font-bold text-muted-foreground transition hover:text-foreground"
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    onClick={() => void handlePremiumLaunch()}
                    disabled={isSubmittingDraft || !form.preferredLaunchDate}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmittingDraft ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} />
                    )}
                    {lastSavedDraft?.paymentStatus === "PAID"
                      ? "Change launch date"
                      : `Launch for ${foundingPremiumPrice.discounted}`}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isBadgePromptOpen ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/55 px-4 py-8 backdrop-blur-sm">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="badge-priority-title"
            className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
              <div>
                <p className="inline-flex items-center gap-2 text-[10px] font-black tracking-[0.18em] text-primary">
                  <ShieldCheck size={13} />
                  Optional badge verification
                </p>
                <h3 id="badge-priority-title" className="mt-2 text-xl font-black tracking-tight text-foreground">
                  Be approved faster with badge verification
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBadgePromptOpen(false)}
                className="rounded-xl border border-border bg-card p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Close badge prompt"
              >
                <X size={16} />
              </button>
            </div>

            <div className="p-6">
              <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                Your free launch is scheduled. Add a small ShipBoost badge to
                your homepage or footer if you want priority review within
                24-48 hours.
              </p>

              {errorMessage ? (
                <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                  {errorMessage}
                </p>
              ) : null}

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                {(["light", "dark"] as const).map((theme) => (
                  <div
                    key={theme}
                    className={cn(
                      "relative rounded-xl border border-border p-3 pt-9",
                      theme === "dark" ? "bg-white" : "bg-muted/20",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void handleCopyBadgeSnippet(theme)}
                      className={cn(
                        "absolute right-2 top-2 inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black transition",
                        theme === "dark"
                          ? "border-slate-200 bg-slate-50 text-slate-700"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <Copy size={12} />
                      {copiedBadgeTheme === theme ? "Copied" : "Copy"}
                    </button>
                    <a href={shipboostUrl} target="_blank" rel="noopener">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getBadgePreviewSrc(theme)}
                        alt={`${theme} ShipBoost badge preview`}
                        className="h-auto w-44 max-w-full"
                      />
                    </a>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void handleVerifyBadge()}
                  disabled={isVerifyingBadge || !isValidUrl(form.websiteUrl)}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isVerifyingBadge ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
                  {isVerifyingBadge ? "Verifying..." : "I added it, verify now"}
                </button>
                <button
                  type="button"
                  onClick={() => void handleContinueWithoutBadge()}
                  className="rounded-xl border border-border bg-background px-4 py-3 text-sm font-black text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  Continue without badge
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="grid w-full items-start gap-8 xl:grid-cols-[minmax(0,1fr)_320px] 2xl:grid-cols-[minmax(0,1120px)_320px]">
        <aside className="order-2 space-y-4 xl:sticky xl:top-28 xl:self-start">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            {currentScheduledLaunch ? (
              <>
                <h3 className="text-lg font-black text-foreground">
                  Launch Scheduled
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                  {isPremiumScheduled
                    ? `You skipped the waiting line. Your product is scheduled to launch on ${formatLaunchDate(scheduledLaunchDate)}.`
                    : `Your product is estimated to launch in ${formatLaunchWait(scheduledLaunchDate)}.`}
                </p>
                <div className="mt-5 space-y-3">
                  <button
                    type="button"
                    onClick={() => void handleOpenScheduleModal("premium-date")}
                    disabled={isBusy}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                  >
                    {isPremiumScheduled ? "Change launch date" : "Skip the waiting line"}
                  </button>
                  {isFreeScheduled ? (
                    <button
                      type="button"
                      onClick={() => void handleUnscheduleFreeLaunch()}
                      disabled={isBusy}
                      className="inline-flex w-full items-center justify-center rounded-xl border border-destructive/50 bg-background px-4 py-3 text-sm font-black text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
                    >
                      Unschedule your launch
                    </button>
                  ) : null}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-black text-foreground">
                  Schedule your launch
                </h3>
                <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                  When you are ready, choose your free launch slot or skip the
                  waiting line with Premium Launch.
                </p>
                <button
                  type="button"
                  onClick={() => void handleOpenScheduleModal()}
                  disabled={isBusy || !requiredFieldsComplete}
                  className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {isBusy ? <Loader2 size={14} className="animate-spin" /> : <CalendarDays size={14} />}
                  Schedule your launch
                </button>
              </>
            )}
          </div>

          {currentScheduledLaunch ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <h3 className="text-lg font-black text-foreground">
                Add a badge to your website
              </h3>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                Build anticipation by displaying a badge on your website.
              </p>
              <div className="mt-5 space-y-3">
                {(["light", "dark"] as const).map((theme) => (
                  <div
                    key={theme}
                    className={cn(
                      "relative rounded-lg border p-3 pt-9 transition",
                      theme === "dark" ? "bg-white" : "bg-background",
                      badgeTheme === theme ? "border-primary" : "border-border",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => void handleCopyBadgeSnippet(theme)}
                      className={cn(
                        "absolute right-2 top-2 inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[10px] font-black transition",
                        theme === "dark"
                          ? "border-slate-200 bg-slate-50 text-slate-700"
                          : "border-border bg-card text-foreground",
                      )}
                    >
                      <Copy size={11} />
                      {copiedBadgeTheme === theme ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      onClick={() => setBadgeTheme(theme)}
                      className="block w-full"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={getBadgePreviewSrc(theme)}
                        alt={`${theme} ShipBoost badge`}
                        className="h-auto w-40 max-w-full"
                      />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {!requiredFieldsComplete ? (
            <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-lg font-black text-foreground">
                  Incomplete
                </h3>
                <span className="text-xs font-black text-muted-foreground">
                  {submissionChecklist.filter((item) => item.complete).length}/{submissionChecklist.length}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground">
                Complete your product before scheduling it.
              </p>
              <ul className="mt-5 grid grid-cols-2 gap-x-4 gap-y-2">
                {submissionChecklist.map((item) => (
                  <li
                    key={item.label}
                    className="flex items-center gap-2 text-sm font-medium text-foreground"
                  >
                    <span
                      className={cn(
                        "inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px]",
                        item.complete
                          ? "bg-emerald-500 text-white"
                          : "bg-destructive text-destructive-foreground",
                      )}
                    >
                      {item.complete ? <Check size={12} /> : <X size={12} />}
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => void handleSaveProduct()}
              disabled={isBusy}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
            >
              {isSavingDraft ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {isSavingDraft ? "Saving..." : successMessage === "Product saved." ? "Saved" : "Save your product"}
            </button>
            {toolId ? (
              <button
                type="button"
                onClick={() => void handleDeleteProduct()}
                disabled={isBusy}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/50 bg-background px-4 py-3 text-sm font-black text-destructive transition hover:bg-destructive/5 disabled:opacity-50"
              >
                {isDeletingProduct ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isDeletingProduct ? "Deleting..." : "Delete your product"}
              </button>
            ) : null}
          </div>
        </aside>

        <div className="order-1 min-w-0 rounded-xl border border-border bg-card shadow-sm">
          <div className="grid min-h-[58px] grid-cols-3 gap-2 rounded-t-xl border-b border-border bg-muted/30 p-2">
            {([
              { id: "general", label: "General", icon: Layout },
              { id: "media", label: "Media", icon: ImageIcon },
              { id: "socials", label: "Socials", icon: ShieldCheck },
            ] as const).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "inline-flex min-w-0 items-center justify-center gap-2 rounded-lg px-3 py-3 text-sm font-bold transition",
                  tab.id === activeTab
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                )}
              >
                <tab.icon size={15} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <div className="min-h-[720px] p-6 sm:p-8">
            {errorMessage ? (
              <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
                {errorMessage}
              </p>
            ) : null}
            {successMessage ? (
              <p className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            {activeTab === "general" ? (
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Name *</label>
                    <input
                      required
                      value={form.name}
                      onChange={(event) => setForm({ ...form, name: event.target.value })}
                      className={inputClassName()}
                      placeholder="Acme SaaS"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-bold text-foreground">Slug *</label>
                      <span className="text-xs font-medium text-muted-foreground">
                        {shipboostHost}/tools/{form.requestedSlug || "your-product"}
                      </span>
                    </div>
                    <input
                      value={form.requestedSlug}
                      onChange={(event) =>
                        setForm({ ...form, requestedSlug: slugify(event.target.value) })
                      }
                      className={inputClassName()}
                    />
                    {slugStatus ? (
                      <p className="text-xs font-medium text-muted-foreground">{slugStatus}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">URL *</label>
                    <input
                      required
                      value={form.websiteUrl}
                      onChange={(event) =>
                        setForm({ ...form, websiteUrl: event.target.value })
                      }
                      className={inputClassName()}
                      placeholder="https://acme.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-foreground">Pricing *</label>
                    <NativeSelect
                      value={form.pricingModel}
                      onChange={(event) =>
                        setForm({
                          ...form,
                          pricingModel: event.target.value as PricingModelSelection,
                        })
                      }
                      className={inputClassName()}
                    >
                      <option value="">Select pricing model</option>
                      {pricingModels.map((model) => (
                        <option key={model} value={model}>
                          {model}
                        </option>
                      ))}
                    </NativeSelect>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="relative space-y-2">
                    <label className="text-sm font-bold text-foreground">Category *</label>
                    <button
                      type="button"
                      onClick={() => setIsCatOpen((value) => !value)}
                      className={cn(inputClassName(), "flex items-center justify-between text-left")}
                    >
                      <span className={cn(!selectedCategory && "text-muted-foreground")}>
                        {selectedCategory?.name ?? "Select a category"}
                      </span>
                      <Search size={15} />
                    </button>
                    {isCatOpen ? (
                      <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-2xl">
                        <input
                          value={catSearch}
                          onChange={(event) => setCatSearch(event.target.value)}
                          className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                          placeholder="Search categories"
                        />
                        {filteredCategories.map((category) => (
                          <button
                            key={category.id}
                            type="button"
                            onClick={() => {
                              setForm({ ...form, categoryIds: [category.id] });
                              setIsCatOpen(false);
                            }}
                            className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted"
                          >
                            {category.name}
                            {form.categoryIds.includes(category.id) ? <Check size={14} /> : null}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div className="relative space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-sm font-bold text-foreground">Tags *</label>
                      <span className="text-xs font-medium text-muted-foreground">
                        {selectedTags.map((tagItem) => tagItem.name).join(", ")}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsTagOpen((value) => !value)}
                      className={cn(inputClassName(), "flex min-h-[46px] items-center justify-between gap-2 text-left")}
                    >
                      <span className={cn(selectedTags.length === 0 && "text-muted-foreground")}>
                        {selectedTags.length > 0
                          ? selectedTags.map((tagItem) => tagItem.name).join(", ")
                          : "Select up to 5 tags"}
                      </span>
                      <Search size={15} />
                    </button>
                    {isTagOpen ? (
                      <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-2xl">
                        <input
                          value={tagSearch}
                          onChange={(event) => setTagSearch(event.target.value)}
                          className="mb-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
                          placeholder="Search tags"
                        />
                        {filteredTags.map((tagItem) => {
                          const selected = form.tagIds.includes(tagItem.id);
                          return (
                            <button
                              key={tagItem.id}
                              type="button"
                              disabled={form.tagIds.length >= 5 && !selected}
                              onClick={() => {
                                const nextTags = selected
                                  ? form.tagIds.filter((id) => id !== tagItem.id)
                                  : [...form.tagIds, tagItem.id];
                                setForm({ ...form, tagIds: nextTags });
                              }}
                              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-muted disabled:opacity-40"
                            >
                              {tagItem.name}
                              {selected ? <Check size={14} /> : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-bold text-foreground">Tagline *</label>
                    <span className="text-xs font-medium text-muted-foreground">
                      {form.tagline.length}/60
                    </span>
                  </div>
                  <textarea
                    required
                    maxLength={60}
                    rows={2}
                    value={form.tagline}
                    onChange={(event) => setForm({ ...form, tagline: event.target.value })}
                    className={inputClassName()}
                    placeholder="Short, punchy description of what you do"
                  />
                  <p className="text-xs font-medium text-muted-foreground">
                    Used on your product card.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Rich Description *</label>
                  <MarkdownTextarea
                    value={form.richDescription}
                    onChange={(value) => setForm({ ...form, richDescription: value })}
                    rows={9}
                    placeholder="Describe your product outcomes..."
                  />
                </div>
              </div>
            ) : null}

            {activeTab === "media" ? (
              <div className="space-y-10">
                <div className="space-y-4">
                  <label className="text-sm font-bold text-foreground">Logo *</label>
                  <div className="flex flex-wrap items-start gap-6">
                    {logo ? (
                      <div className="relative">
                        <div className="h-32 w-32 overflow-hidden rounded-xl border border-border bg-background">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={logo.previewUrl} alt="Logo preview" className="h-full w-full object-cover" />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            maybeRevokeObjectUrl(logo.previewUrl);
                            setLogo(null);
                          }}
                          className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                          aria-label="Remove logo"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ) : null}
                    <label className="flex h-32 w-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition hover:bg-muted/50">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files?.[0]) {
                            if (logo) {
                              maybeRevokeObjectUrl(logo.previewUrl);
                            }
                            setLogo(createDraftImage(event.target.files[0]));
                          }
                        }}
                      />
                      <ImageIcon size={24} className="text-muted-foreground" />
                      <span className="text-sm font-black text-foreground">
                        Upload logo
                      </span>
                    </label>
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-sm font-bold text-foreground">Images</label>
                  {screenshots.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-3">
                      {screenshots.map((screenshot) => (
                        <div key={screenshot.id} className="relative">
                          <div className="aspect-video overflow-hidden rounded-xl border border-border bg-background">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={screenshot.previewUrl}
                              alt="Screenshot preview"
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setScreenshots((current) => {
                                maybeRevokeObjectUrl(screenshot.previewUrl);
                                return current.filter((item) => item.id !== screenshot.id);
                              })
                            }
                            className="absolute -right-2 -top-2 inline-flex h-8 w-8 items-center justify-center rounded-full bg-destructive text-destructive-foreground"
                            aria-label="Remove screenshot"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                  {screenshots.length < 3 ? (
                    <label className="flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border bg-muted/30 text-center transition hover:bg-muted/50">
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => {
                          if (event.target.files) {
                            const nextFiles = Array.from(event.target.files).map(createDraftImage);
                            setScreenshots((current) => [...current, ...nextFiles].slice(0, 3));
                          }
                        }}
                      />
                      <ImageIcon size={28} className="text-muted-foreground" />
                      <span className="text-sm font-black text-foreground">
                        Upload product images
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {3 - screenshots.length} left
                      </span>
                    </label>
                  ) : null}
                </div>
              </div>
            ) : null}

            {activeTab === "socials" ? (
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">X (Twitter)</label>
                  <input
                    value={form.founderXUrl}
                    onChange={(event) => setForm({ ...form, founderXUrl: event.target.value })}
                    className={inputClassName()}
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">LinkedIn</label>
                  <input
                    value={form.founderLinkedinUrl}
                    onChange={(event) => setForm({ ...form, founderLinkedinUrl: event.target.value })}
                    className={inputClassName()}
                    placeholder="https://linkedin.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">GitHub</label>
                  <input
                    value={form.founderGithubUrl}
                    onChange={(event) => setForm({ ...form, founderGithubUrl: event.target.value })}
                    className={inputClassName()}
                    placeholder="https://github.com/..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-foreground">Facebook</label>
                  <input
                    value={form.founderFacebookUrl}
                    onChange={(event) => setForm({ ...form, founderFacebookUrl: event.target.value })}
                    className={inputClassName()}
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div className="md:col-span-2">
                  <Link
                    href={`mailto:${supportEmail}`}
                    className="text-sm font-bold text-muted-foreground underline underline-offset-4 transition hover:text-foreground"
                  >
                    Need help? Contact support
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
