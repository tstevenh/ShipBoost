"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { MarkdownTextarea } from "@/components/forms/markdown-textarea";

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

type SubmissionType = "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH";
type PricingModel = "FREE" | "FREEMIUM" | "PAID" | "CUSTOM" | "CONTACT_SALES";

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
  pricingModel: PricingModel;
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

  if (!trimmed) {
    return "";
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function emptyForm(): FormState {
  return {
    submissionType: "FREE_LAUNCH",
    requestedSlug: "",
    preferredLaunchDate: "",
    name: "",
    tagline: "",
    websiteUrl: "",
    richDescription: "",
    pricingModel: "FREEMIUM",
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
  return "w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10";
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-black/72">{label}</span>
      {hint ? <span className="block text-xs text-black/48">{hint}</span> : null}
      {children}
      {error ? (
        <span className="block text-xs font-medium text-rose-700">{error}</span>
      ) : null}
    </label>
  );
}

function readValidationErrors(payload: ApiErrorPayload | null) {
  const fieldErrors = payload?.details?.fieldErrors ?? {};
  const formErrors = payload?.details?.formErrors ?? [];
  const firstFieldError = Object.values(fieldErrors).flat().find(Boolean);

  return {
    fieldErrors,
    message:
      formErrors[0] ??
      firstFieldError ??
      payload?.error ??
      "Unable to submit your product.",
  };
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
    <div className="rounded-[1.25rem] border border-black/10 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{label}</p>
          <p className="mt-1 text-xs text-black/48">
            {image.file.type || "image"} •{" "}
            {(image.file.size / 1024 / 1024).toFixed(2)} MB
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-xs font-semibold text-black/45 transition hover:text-rose-700"
        >
          Remove
        </button>
      </div>
      <div className="mt-3 overflow-hidden rounded-2xl border border-black/10 bg-[#f3f0ea]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.previewUrl}
          alt={label}
          className="h-40 w-full object-cover"
        />
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
  const [form, setForm] = useState<FormState>(emptyForm);
  const [logo, setLogo] = useState<LocalImage | null>(null);
  const [screenshots, setScreenshots] = useState<LocalImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);
  const [isVerifyingBadge, setIsVerifyingBadge] = useState(false);
  const [slugStatus, setSlugStatus] = useState<string>("Slug will appear here.");
  const [isSlugLoading, setIsSlugLoading] = useState(false);
  const actionLockRef = useRef(false);
  const logoRef = useRef<LocalImage | null>(null);
  const screenshotsRef = useRef<LocalImage[]>([]);
  const slugEditedRef = useRef(false);
  const [draftSubmissionId, setDraftSubmissionId] = useState<string | null>(null);
  const [draftBadgeVerification, setDraftBadgeVerification] = useState<
    SavedSubmission["badgeVerification"]
  >("PENDING");

  const isBusy = isSavingDraft || isSubmittingDraft || isVerifyingBadge;
  const manualVerificationHref = `mailto:${encodeURIComponent(
    supportEmail,
  )}?subject=${encodeURIComponent(
    `Manual Shipboost badge verification for ${form.name || "my launch draft"}`,
  )}&body=${encodeURIComponent(
    [
      "Hi Shipboost,",
      "",
      "Automatic badge verification did not work. Please review this free launch badge manually.",
      "",
      `Founder email: ${founderEmail}`,
      `Product name: ${form.name || "-"}`,
      `Website URL: ${ensureHttps(form.websiteUrl) || "-"}`,
      `Draft submission ID: ${draftSubmissionId ?? "-"}`,
      "",
      "Thanks.",
    ].join("\n"),
  )}`;
  const freeLaunchBadgeSnippet = `<a href="${appUrl}" data-shipboost-badge="free-launch" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;padding:10px 14px;border-radius:999px;border:1px solid rgba(20,63,53,0.18);background:#143f35;color:#fff8ef;font:600 13px/1.2 Inter,sans-serif;text-decoration:none;">Launching soon on Shipboost</a>`;

  useEffect(() => {
    logoRef.current = logo;
    screenshotsRef.current = screenshots;
  }, [logo, screenshots]);

  useEffect(() => {
    return () => {
      if (logoRef.current) {
        URL.revokeObjectURL(logoRef.current.previewUrl);
      }

      screenshotsRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (slugEditedRef.current) {
      setSlugStatus("Custom slug will be checked again on submit.");

      return;
    }

    const localSlug = slugify(form.name) || "tool";
    setSlugStatus(localSlug ? `Suggested slug: ${localSlug}` : "Slug will appear here.");

    if (!form.name.trim()) {
      setForm((current) =>
        current.requestedSlug === "" ? current : { ...current, requestedSlug: "" },
      );
      setIsSlugLoading(false);
      setSlugStatus("Slug will appear here.");
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSlugLoading(true);

      void (async () => {
        try {
          const response = await fetch(
            `/api/tools/slug-suggestion?value=${encodeURIComponent(form.name)}`,
            {
              signal: controller.signal,
            },
          );
          const payload = (await response.json().catch(() => null)) as
            | { data?: { slug?: string }; error?: string }
            | null;

          if (!response.ok) {
            throw new Error(payload?.error ?? "Unable to generate slug.");
          }

          const nextSlug = payload?.data?.slug ?? localSlug;

          setForm((current) => ({ ...current, requestedSlug: nextSlug }));
          setSlugStatus(`Suggested slug: ${nextSlug}`);
        } catch (error) {
          if (controller.signal.aborted) {
            return;
          }

          setForm((current) => ({ ...current, requestedSlug: localSlug }));
          setSlugStatus(
            error instanceof Error
              ? error.message
              : `Suggested slug: ${localSlug}`,
          );
        } finally {
          if (!controller.signal.aborted) {
            setIsSlugLoading(false);
          }
        }
      })();
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [form.name]);

  function toggleCategory(categoryId: string) {
    setFieldErrors((current) => ({ ...current, categoryIds: undefined }));
    setForm((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId].slice(0, 3),
    }));
  }

  function toggleTag(tagId: string) {
    setFieldErrors((current) => ({ ...current, tagIds: undefined }));
    setForm((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((id) => id !== tagId)
        : [...current.tagIds, tagId].slice(0, 5),
    }));
  }

  function replaceLogo(fileList: FileList | null) {
    if (!fileList?.[0]) {
      return;
    }

    const file = fileList[0];

    if (logo) {
      URL.revokeObjectURL(logo.previewUrl);
    }

    setLogo({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    });
  }

  function appendScreenshots(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const incoming = Array.from(fileList);

    if (screenshots.length + incoming.length > 3) {
      setErrorMessage("You can upload up to 3 screenshots.");
      return;
    }

    setErrorMessage(null);
    setFieldErrors((current) => ({ ...current, screenshots: undefined }));

    const nextImages = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setScreenshots((current) => [...current, ...nextImages]);
  }

  function removeLogo() {
    if (!logo) {
      return;
    }

    URL.revokeObjectURL(logo.previewUrl);
    setLogo(null);
  }

  function removeScreenshot(imageId: string) {
    setScreenshots((current) => {
      const target = current.find((image) => image.id === imageId);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((image) => image.id !== imageId);
    });
  }

  function buildMultipartFormData(submissionId?: string | null) {
    const formData = new FormData();
    const normalizedWebsiteUrl = ensureHttps(form.websiteUrl);

    formData.append("submissionId", submissionId ?? "");
    formData.append("submissionType", form.submissionType);
    formData.append("requestedSlug", form.requestedSlug);
    formData.append("preferredLaunchDate", form.preferredLaunchDate);
    formData.append("name", form.name);
    formData.append("tagline", form.tagline);
    formData.append("websiteUrl", normalizedWebsiteUrl);
    formData.append("richDescription", form.richDescription);
    formData.append("pricingModel", form.pricingModel);
    formData.append("categoryIds", JSON.stringify(form.categoryIds));
    formData.append("tagIds", JSON.stringify(form.tagIds));
    formData.append("affiliateUrl", form.affiliateUrl);
    formData.append("affiliateSource", form.affiliateSource);
    formData.append("hasAffiliateProgram", String(form.hasAffiliateProgram));
    formData.append("founderXUrl", form.founderXUrl);
    formData.append("founderGithubUrl", form.founderGithubUrl);
    formData.append("founderLinkedinUrl", form.founderLinkedinUrl);
    formData.append("founderFacebookUrl", form.founderFacebookUrl);
    formData.append("logo", logo!.file);

    screenshots.forEach((image) => {
      formData.append("screenshots", image.file);
    });

    return formData;
  }

  async function saveDraft() {
    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    if (!logo) {
      throw new Error("Upload a logo before saving your draft.");
    }

    setIsSavingDraft(true);
    const response = await fetch("/api/submissions", {
      method: "POST",
      body: buildMultipartFormData(draftSubmissionId),
    });

    const payload = (await response.json().catch(() => null)) as
      | ({ data?: SavedSubmission } & ApiErrorPayload)
      | null;

    if (!response.ok) {
      const next = readValidationErrors(payload);
      setFieldErrors(next.fieldErrors);
      throw new Error(next.message);
    }

    const savedDraft = payload?.data;

    if (!savedDraft) {
      throw new Error("Draft saved but could not be reloaded.");
    }

    setDraftSubmissionId(savedDraft.id);
    setDraftBadgeVerification(savedDraft.badgeVerification);
    setSuccessMessage("Draft saved. You can come back to it later from your dashboard.");

    return savedDraft;
  }

  function runAction(task: () => Promise<void>) {
    if (actionLockRef.current || isBusy) {
      return;
    }

    actionLockRef.current = true;
    void task().finally(() => {
      actionLockRef.current = false;
      setIsSavingDraft(false);
      setIsSubmittingDraft(false);
      setIsVerifyingBadge(false);
    });
  }

  function handleSaveDraft() {
    runAction(async () => {
      try {
        await saveDraft();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to save your draft.",
        );
      }
    });
  }

  function handleVerifyBadge() {
    runAction(async () => {
      try {
        const draft = await saveDraft();
        setIsVerifyingBadge(true);
        const result = await apiRequest<{
          verified: boolean;
          message: string;
          submission: SavedSubmission;
        }>(`/api/submissions/${draft.id}/verify-badge`, {
          method: "POST",
        });

        setDraftSubmissionId(result.submission.id);
        setDraftBadgeVerification(result.submission.badgeVerification);

        if (result.verified) {
          setSuccessMessage(result.message);
          setErrorMessage(null);
        } else {
          setSuccessMessage(null);
          setErrorMessage(result.message);
        }
      } catch (error) {
        setSuccessMessage(null);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to verify the Shipboost badge.",
        );
      }
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    runAction(async () => {
      try {
        const draft = await saveDraft();
        setDraftSubmissionId(draft.id);

        if (form.submissionType === "FEATURED_LAUNCH") {
          setIsSubmittingDraft(true);
          const result = await apiRequest<{
            checkoutUrl: string;
            checkoutId: string;
          }>("/api/polar/checkout/featured-launch", {
            method: "POST",
            body: JSON.stringify({ submissionId: draft.id }),
          });

          window.location.href = result.checkoutUrl;
          return;
        }

        if (
          form.submissionType === "FREE_LAUNCH" &&
          draftBadgeVerification !== "VERIFIED" &&
          draft.badgeVerification !== "VERIFIED"
        ) {
          throw new Error(
            "Verify the Shipboost badge on your website before submitting the free launch.",
          );
        }

        setIsSubmittingDraft(true);
        await apiRequest<SavedSubmission>(
          `/api/submissions/${draft.id}/submit`,
          {
            method: "POST",
          },
        );

        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to continue with this launch.",
        );
      }
    });
  }

  function getFieldError(field: keyof FormState | "logo" | "screenshots") {
    return fieldErrors[field]?.[0] ?? null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10"
        aria-busy={isBusy}
      >
        <p className="text-sm font-semibold tracking-[0.25em] text-[#9f4f1d] uppercase">
          Founder submission
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          Submit your SaaS to Shipboost
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-black/66">
          Shipboost stores a draft first, then only sends your launch into
          review or checkout when the required preconditions pass.
        </p>

        <fieldset
          disabled={isBusy}
          className="mt-8 space-y-6 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <Field label="Submission type">
            <div className="grid gap-3">
              {[
                {
                  value: "FREE_LAUNCH" as const,
                  title: "Free launch with badge",
                  body: "Best default. Save a draft, install the Shipboost badge on your homepage, verify it, then submit for review.",
                },
                {
                  value: "FEATURED_LAUNCH" as const,
                  title: "Featured launch request",
                  body: "Save the launch as a draft, pick your launch date, then jump straight to payment when you are ready.",
                },
                {
                  value: "LISTING_ONLY" as const,
                  title: "Listing only",
                  body: "Create a profile without placing the product on a launch board.",
                },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`rounded-[1.5rem] border p-4 transition ${
                    form.submissionType === option.value
                      ? "border-[#9f4f1d] bg-[#fff7ea]"
                      : "border-black/10 bg-[#fffdf8]"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="submissionType"
                      value={option.value}
                      checked={form.submissionType === option.value}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          submissionType: option.value,
                          preferredLaunchDate:
                            option.value === "FEATURED_LAUNCH"
                              ? current.preferredLaunchDate
                              : "",
                        }))
                      }
                    />
                    <div>
                      <p className="text-sm font-semibold text-black">
                        {option.title}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-black/58">
                        {option.body}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Product name" error={getFieldError("name")}>
              <input
                required
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                className={inputClassName()}
              />
            </Field>
            <Field
              label="Requested slug"
              hint="Generated from your product name by default. You can still edit it before submitting."
              error={getFieldError("requestedSlug")}
            >
              <input
                value={form.requestedSlug}
                onChange={(event) => {
                  slugEditedRef.current = true;
                  setForm((current) => ({
                    ...current,
                    requestedSlug: slugify(event.target.value),
                  }));
                }}
                className={inputClassName()}
              />
              <div className="flex items-center justify-between gap-3 text-xs text-black/48">
                <span>{isSlugLoading ? "Checking slug..." : slugStatus}</span>
                <button
                  type="button"
                  onClick={() => {
                    slugEditedRef.current = false;
                    setForm((current) => ({
                      ...current,
                      requestedSlug: slugify(current.name),
                    }));
                  }}
                  className="font-semibold text-[#9f4f1d] transition hover:text-[#7d3f17]"
                >
                  Reset from name
                </button>
              </div>
            </Field>
          </div>

          <Field
            label="Tagline"
            hint="Used on cards and launch boards. Minimum 10 characters."
            error={getFieldError("tagline")}
          >
            <input
              required
              value={form.tagline}
              onChange={(event) =>
                setForm((current) => ({ ...current, tagline: event.target.value }))
              }
              className={inputClassName()}
            />
          </Field>

          {form.submissionType === "FEATURED_LAUNCH" ? (
            <Field
              label="Preferred launch date"
              hint="Pick the day you want the featured launch to go live once payment and approval are complete."
              error={getFieldError("preferredLaunchDate")}
            >
              <input
                required
                type="date"
                min={new Date().toISOString().slice(0, 10)}
                value={form.preferredLaunchDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferredLaunchDate: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
          ) : null}

          <Field
            label="Website URL"
            hint="Type your domain only if you want. Shipboost will add https:// for you."
            error={getFieldError("websiteUrl")}
          >
            <div className="flex overflow-hidden rounded-2xl border border-black/10 bg-[#fffdf8] focus-within:border-[#9f4f1d] focus-within:ring-4 focus-within:ring-[#9f4f1d]/10">
              <span className="flex items-center border-r border-black/10 bg-[#f7f0e3] px-4 text-sm font-medium text-black/55">
                https://
              </span>
              <input
                required
                type="text"
                inputMode="url"
                value={form.websiteUrl.replace(/^https?:\/\//i, "")}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    websiteUrl: event.target.value,
                  }))
                }
                onBlur={(event) =>
                  setForm((current) => ({
                    ...current,
                    websiteUrl: ensureHttps(event.target.value),
                  }))
                }
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none"
                placeholder="yourproduct.com"
              />
            </div>
          </Field>

          <Field
            label="Rich description"
            hint="Used on your product page. Supports Markdown. Minimum 40 characters."
            error={getFieldError("richDescription")}
          >
            <MarkdownTextarea
              value={form.richDescription}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  richDescription: value,
                }))
              }
              rows={8}
              placeholder="Explain what your SaaS does, who it helps, and the core workflows or outcomes."
              error={getFieldError("richDescription")}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Pricing model" error={getFieldError("pricingModel")}>
              <select
                value={form.pricingModel}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    pricingModel: event.target.value as PricingModel,
                  }))
                }
                className={inputClassName()}
              >
                {pricingModels.map((pricingModel) => (
                  <option key={pricingModel} value={pricingModel}>
                    {pricingModel}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Affiliate URL" error={getFieldError("affiliateUrl")}>
              <input
                type="url"
                value={form.affiliateUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    affiliateUrl: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
          </div>

          <Field label="Affiliate source">
            <input
              value={form.affiliateSource}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  affiliateSource: event.target.value,
                }))
              }
              className={inputClassName()}
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Founder X URL">
              <input
                type="url"
                value={form.founderXUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    founderXUrl: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
            <Field label="Founder GitHub URL">
              <input
                type="url"
                value={form.founderGithubUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    founderGithubUrl: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Founder LinkedIn URL">
              <input
                type="url"
                value={form.founderLinkedinUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    founderLinkedinUrl: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
            <Field label="Founder Facebook URL">
              <input
                type="url"
                value={form.founderFacebookUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    founderFacebookUrl: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
          </div>

          {form.submissionType === "FREE_LAUNCH" ? (
            <div className="rounded-[1.5rem] border border-black/10 bg-[#fff7ea] p-5">
              <p className="text-sm font-semibold text-black">Install the Shipboost badge</p>
              <p className="mt-2 text-sm leading-6 text-black/62">
                Put this badge snippet on your homepage footer, then click
                <span className="font-semibold text-black"> Verify badge now</span>.
                Free launches only unlock submission after the badge is verified.
              </p>
              <textarea
                readOnly
                value={freeLaunchBadgeSnippet}
                rows={5}
                className="mt-4 w-full rounded-2xl border border-black/10 bg-white px-4 py-3 font-mono text-xs text-black/72 outline-none"
              />
              <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={handleVerifyBadge}
                  disabled={isBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#9f4f1d]/20 bg-white px-5 py-3 text-sm font-semibold text-[#9f4f1d] transition hover:bg-[#fff2df] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isVerifyingBadge ? (
                    <>
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-[#9f4f1d]/30 border-t-[#9f4f1d]" />
                      Verifying badge...
                    </>
                  ) : (
                    "Verify badge now"
                  )}
                </button>
                <a
                  href={manualVerificationHref}
                  className="inline-flex items-center justify-center rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03]"
                >
                  Having trouble? Contact us for manual verification
                </a>
              </div>
              <p className="mt-3 text-xs font-medium text-black/52">
                Current badge state: {draftBadgeVerification}
              </p>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
              <p className="text-sm font-semibold text-black">Categories</p>
              <p className="mt-1 text-xs text-black/48">Pick up to 3.</p>
              {getFieldError("categoryIds") ? (
                <p className="mt-2 text-xs font-medium text-rose-700">
                  {getFieldError("categoryIds")}
                </p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {categories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-start gap-3 text-sm text-black/70"
                  >
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span>
                      <span className="font-medium text-black">
                        {category.name}
                      </span>
                      {category.description ? (
                        <span className="mt-1 block text-xs text-black/48">
                          {category.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
              <p className="text-sm font-semibold text-black">Tags</p>
              <p className="mt-1 text-xs text-black/48">Pick up to 5.</p>
              {getFieldError("tagIds") ? (
                <p className="mt-2 text-xs font-medium text-rose-700">
                  {getFieldError("tagIds")}
                </p>
              ) : null}
              <div className="mt-3 grid gap-2">
                {tags.map((tag) => (
                  <label
                    key={tag.id}
                    className="flex items-start gap-3 text-sm text-black/70"
                  >
                    <input
                      type="checkbox"
                      checked={form.tagIds.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    <span>
                      <span className="font-medium text-black">{tag.name}</span>
                      {tag.description ? (
                        <span className="mt-1 block text-xs text-black/48">
                          {tag.description}
                        </span>
                      ) : null}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
              <Field
                label="Logo upload"
                hint="Upload PNG, JPEG, or WebP. WebP is the delivery format; founders can still upload a PNG source."
                error={getFieldError("logo")}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => replaceLogo(event.target.files)}
                  className={inputClassName()}
                />
              </Field>
              <p className="mt-2 text-xs text-black/48">
                {logo ? "Logo ready for submit." : "No logo selected yet."}
              </p>
              {logo ? (
                <div className="mt-4">
                  <LocalPreview
                    label="Logo"
                    image={logo}
                    onRemove={removeLogo}
                  />
                </div>
              ) : null}
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
              <Field
                label="Screenshot uploads"
                hint="Upload up to 3 screenshots. They stay local until final submit."
                error={getFieldError("screenshots")}
              >
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(event) => appendScreenshots(event.target.files)}
                  className={inputClassName()}
                />
              </Field>
              <p className="mt-2 text-xs text-black/48">
                {screenshots.length}/3 screenshots selected.
              </p>
              {screenshots.length > 0 ? (
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {screenshots.map((image, index) => (
                    <LocalPreview
                      key={image.id}
                      label={`Screenshot ${index + 1}`}
                      image={image}
                      onRemove={() => removeScreenshot(image.id)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <label className="flex items-center gap-3 text-sm text-black/70">
            <input
              type="checkbox"
              checked={form.hasAffiliateProgram}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hasAffiliateProgram: event.target.checked,
                }))
              }
            />
            This product already has an affiliate program
          </label>

          {errorMessage ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMessage}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMessage}
            </div>
          ) : null}

          {isBusy ? (
            <div className="rounded-2xl border border-[#9f4f1d]/15 bg-[#fff7ea] px-4 py-3 text-sm text-[#7d3f17]">
              {isVerifyingBadge
                ? "Shipboost is checking your website for the launch badge now."
                : isSubmittingDraft
                  ? form.submissionType === "FEATURED_LAUNCH"
                    ? "Creating your launch draft and opening Polar checkout."
                    : "Submitting your launch draft into the review queue."
                  : "Saving your draft and syncing media to Cloudinary."}
            </div>
          ) : null}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isBusy}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSavingDraft && !isSubmittingDraft && !isVerifyingBadge ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-black/20 border-t-black/70" />
                  Saving draft...
                </>
              ) : (
                "Save draft"
              )}
            </button>
            <button
              type="submit"
              disabled={
                isBusy ||
                (form.submissionType === "FREE_LAUNCH" &&
                  draftBadgeVerification !== "VERIFIED")
              }
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingDraft ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  {form.submissionType === "FEATURED_LAUNCH"
                    ? "Opening checkout..."
                    : "Submitting..."}
                </>
              ) : (
                form.submissionType === "FEATURED_LAUNCH"
                  ? "Launch and pay"
                  : "Submit for review"
              )}
            </button>
            <Link
              href="/dashboard"
              aria-disabled={isBusy}
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03] aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Back to dashboard
            </Link>
          </div>
        </fieldset>
      </form>

      <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.24)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
          Submission guidance
        </p>

        <div className="mt-8 space-y-6">
          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-lg font-semibold text-white">Why this flow is cleaner</p>
            <p className="mt-2 text-sm leading-7 text-[#f8efe3]/78">
              Media is only uploaded if the founder actually submits. That
              avoids abandoned Cloudinary assets and removes the need for a
              pre-submit delete endpoint.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-lg font-semibold text-white">Logo format</p>
            <p className="mt-2 text-sm leading-7 text-[#f8efe3]/78">
              For now, founders should upload a high-quality PNG if they have
              one. Shipboost will deliver a WebP version. WebP is fine for
              raster logos, but SVG is still the sharpest option if you later
              choose to support vector logos separately.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
            <p className="text-lg font-semibold text-white">Free launch</p>
            <p className="mt-2 text-sm leading-7 text-[#f8efe3]/78">
              Best starting point for bootstrapped founders. Install the
              Shipboost badge on your homepage, verify it, then submit the
              launch draft into the free queue.
            </p>
          </div>
        </div>
      </aside>
    </div>
  );
}
