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

type PricingModel = "FREE" | "FREEMIUM" | "PAID" | "CUSTOM" | "CONTACT_SALES";

type ExistingImage = {
  id: string;
  url: string;
  format: string | null;
  width: number | null;
  height: number | null;
};

type ToolEditorData = {
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
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  logoMedia: ExistingImage | null;
  screenshots: ExistingImage[];
  toolCategories: Array<{ categoryId: string }>;
  toolTags: Array<{ tagId: string }>;
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

type FormState = {
  slug: string;
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
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  categoryIds: string[];
  tagIds: string[];
};

const pricingModels: PricingModel[] = [
  "FREE",
  "FREEMIUM",
  "PAID",
  "CUSTOM",
  "CONTACT_SALES",
];

function createFormState(tool: ToolEditorData): FormState {
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    richDescription: tool.richDescription,
    pricingModel: tool.pricingModel,
    affiliateUrl: tool.affiliateUrl ?? "",
    affiliateSource: tool.affiliateSource ?? "",
    hasAffiliateProgram: tool.hasAffiliateProgram,
    founderXUrl: tool.founderXUrl ?? "",
    founderGithubUrl: tool.founderGithubUrl ?? "",
    founderLinkedinUrl: tool.founderLinkedinUrl ?? "",
    founderFacebookUrl: tool.founderFacebookUrl ?? "",
    metaTitle: tool.metaTitle ?? "",
    metaDescription: tool.metaDescription ?? "",
    canonicalUrl: tool.canonicalUrl ?? "",
    categoryIds: tool.toolCategories.map((item) => item.categoryId),
    tagIds: tool.toolTags.map((item) => item.tagId),
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
      "Unable to save listing.",
  };
}

function ExistingMediaPreview({
  label,
  image,
  onRemove,
}: {
  label: string;
  image: ExistingImage;
  onRemove: () => void;
}) {
  return (
    <div className="rounded-[1.25rem] border border-black/10 bg-white p-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-black">{label}</p>
          <p className="mt-1 text-xs text-black/48">
            {image.format?.toUpperCase() ?? "IMAGE"}
            {image.width && image.height ? ` • ${image.width}x${image.height}` : ""}
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
        <img src={image.url} alt={label} className="h-40 w-full object-cover" />
      </div>
    </div>
  );
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
            {image.file.type || "image"} • {(image.file.size / 1024 / 1024).toFixed(2)} MB
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
        <img src={image.previewUrl} alt={label} className="h-40 w-full object-cover" />
      </div>
    </div>
  );
}

export function FounderToolEditor({
  tool,
  categories,
  tags,
}: {
  tool: ToolEditorData;
  categories: CategoryOption[];
  tags: TagOption[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => createFormState(tool));
  const [existingLogo, setExistingLogo] = useState<ExistingImage | null>(
    tool.logoMedia,
  );
  const [newLogo, setNewLogo] = useState<LocalImage | null>(null);
  const [existingScreenshots, setExistingScreenshots] = useState<ExistingImage[]>(
    tool.screenshots,
  );
  const [newScreenshots, setNewScreenshots] = useState<LocalImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitLockRef = useRef(false);
  const newLogoRef = useRef<LocalImage | null>(null);
  const newScreenshotsRef = useRef<LocalImage[]>([]);

  useEffect(() => {
    newLogoRef.current = newLogo;
    newScreenshotsRef.current = newScreenshots;
  }, [newLogo, newScreenshots]);

  useEffect(() => {
    return () => {
      if (newLogoRef.current) {
        URL.revokeObjectURL(newLogoRef.current.previewUrl);
      }

      newScreenshotsRef.current.forEach((image) => {
        URL.revokeObjectURL(image.previewUrl);
      });
    };
  }, []);

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

    if (newLogo) {
      URL.revokeObjectURL(newLogo.previewUrl);
    }

    setNewLogo({
      id: crypto.randomUUID(),
      file: fileList[0],
      previewUrl: URL.createObjectURL(fileList[0]),
    });
  }

  function appendScreenshots(fileList: FileList | null) {
    if (!fileList?.length) {
      return;
    }

    const currentTotal = existingScreenshots.length + newScreenshots.length;
    const incoming = Array.from(fileList);

    if (currentTotal + incoming.length > 3) {
      setErrorMessage("You can keep or upload up to 3 screenshots total.");
      return;
    }

    setErrorMessage(null);
    setFieldErrors((current) => ({ ...current, screenshots: undefined }));

    const nextImages = incoming.map((file) => ({
      id: crypto.randomUUID(),
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setNewScreenshots((current) => [...current, ...nextImages]);
  }

  function removeExistingScreenshot(imageId: string) {
    setExistingScreenshots((current) =>
      current.filter((image) => image.id !== imageId),
    );
  }

  function removeNewScreenshot(imageId: string) {
    setNewScreenshots((current) => {
      const target = current.find((image) => image.id === imageId);

      if (target) {
        URL.revokeObjectURL(target.previewUrl);
      }

      return current.filter((image) => image.id !== imageId);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (submitLockRef.current || isSubmitting) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setFieldErrors({});

    if (!existingLogo && !newLogo) {
      setErrorMessage("Keep a logo or upload a replacement before saving.");
      return;
    }

    submitLockRef.current = true;
    setIsSubmitting(true);

    void (async () => {
      try {
        const formData = new FormData();

        formData.append("slug", form.slug);
        formData.append("name", form.name);
        formData.append("tagline", form.tagline);
        formData.append("websiteUrl", form.websiteUrl);
        formData.append("richDescription", form.richDescription);
        formData.append("pricingModel", form.pricingModel);
        formData.append("categoryIds", JSON.stringify(form.categoryIds));
        formData.append("tagIds", JSON.stringify(form.tagIds));
        formData.append("affiliateUrl", form.affiliateUrl);
        formData.append("affiliateSource", form.affiliateSource);
        formData.append(
          "hasAffiliateProgram",
          String(form.hasAffiliateProgram),
        );
        formData.append("founderXUrl", form.founderXUrl);
        formData.append("founderGithubUrl", form.founderGithubUrl);
        formData.append("founderLinkedinUrl", form.founderLinkedinUrl);
        formData.append("founderFacebookUrl", form.founderFacebookUrl);
        formData.append("metaTitle", form.metaTitle);
        formData.append("metaDescription", form.metaDescription);
        formData.append("canonicalUrl", form.canonicalUrl);
        formData.append(
          "existingScreenshotIds",
          JSON.stringify(existingScreenshots.map((image) => image.id)),
        );

        if (newLogo) {
          formData.append("logo", newLogo.file);
        }

        newScreenshots.forEach((image) => {
          formData.append("screenshots", image.file);
        });

        const response = await fetch(`/api/founder/tools/${tool.id}`, {
          method: "PATCH",
          body: formData,
        });

        const payload = (await response.json().catch(() => null)) as
          | ({ data?: ToolEditorData } & ApiErrorPayload)
          | null;

        if (!response.ok || !payload?.data) {
          const next = readValidationErrors(payload);
          setFieldErrors(next.fieldErrors);
          throw new Error(next.message);
        }

        const updated = payload.data;

        if (newLogo) {
          URL.revokeObjectURL(newLogo.previewUrl);
        }
        newScreenshots.forEach((image) => URL.revokeObjectURL(image.previewUrl));

        setForm(createFormState(updated));
        setExistingLogo(updated.logoMedia);
        setNewLogo(null);
        setExistingScreenshots(updated.screenshots);
        setNewScreenshots([]);
        setSuccessMessage("Listing updated.");
        submitLockRef.current = false;
        setIsSubmitting(false);
        router.refresh();
      } catch (error) {
        submitLockRef.current = false;
        setIsSubmitting(false);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to save listing.",
        );
      }
    })();
  }

  function getFieldError(field: keyof FormState | "logo" | "screenshots") {
    return fieldErrors[field]?.[0] ?? null;
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr]">
      <form
        onSubmit={handleSubmit}
        className="rounded-[2rem] border border-black/10 bg-white p-8 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-10"
        aria-busy={isSubmitting}
      >
        <p className="text-sm font-semibold tracking-[0.25em] text-[#9f4f1d] uppercase">
          Founder listing editor
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-black">
          Edit {tool.name}
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-black/66">
          Update your listing copy, links, taxonomy, and media. Replacing media
          will delete removed Cloudinary assets after the save succeeds.
        </p>

        <fieldset
          disabled={isSubmitting}
          className="mt-8 space-y-6 disabled:cursor-not-allowed disabled:opacity-70"
        >
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
            <Field label="Slug" error={getFieldError("slug")}>
              <input
                value={form.slug}
                onChange={(event) =>
                  setForm((current) => ({ ...current, slug: event.target.value }))
                }
                className={inputClassName()}
              />
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

          <Field label="Website URL" error={getFieldError("websiteUrl")}>
            <input
              required
              type="url"
              value={form.websiteUrl}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  websiteUrl: event.target.value,
                }))
              }
              className={inputClassName()}
            />
          </Field>

          <Field
            label="Rich description"
            hint="Used on your public tool page. Supports Markdown. Minimum 40 characters."
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
              placeholder="Describe the product, who it serves, and the workflows it improves."
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

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Meta title">
              <input
                value={form.metaTitle}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    metaTitle: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
            <Field label="Canonical URL">
              <input
                type="url"
                value={form.canonicalUrl}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    canonicalUrl: event.target.value,
                  }))
                }
                className={inputClassName()}
              />
            </Field>
          </div>

          <Field label="Meta description">
            <textarea
              value={form.metaDescription}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  metaDescription: event.target.value,
                }))
              }
              rows={3}
              className={inputClassName()}
            />
          </Field>

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
                  <label key={category.id} className="flex items-start gap-3 text-sm text-black/70">
                    <input
                      type="checkbox"
                      checked={form.categoryIds.includes(category.id)}
                      onChange={() => toggleCategory(category.id)}
                    />
                    <span>
                      <span className="font-medium text-black">{category.name}</span>
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
                  <label key={tag.id} className="flex items-start gap-3 text-sm text-black/70">
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

          <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
            <Field label="Replace logo" error={getFieldError("logo")}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={(event) => replaceLogo(event.target.files)}
                className={inputClassName()}
              />
            </Field>
            <div className="mt-4">
              {newLogo ? (
                <LocalPreview
                  label="New logo"
                  image={newLogo}
                  onRemove={() => {
                    URL.revokeObjectURL(newLogo.previewUrl);
                    setNewLogo(null);
                  }}
                />
              ) : existingLogo ? (
                <ExistingMediaPreview
                  label="Current logo"
                  image={existingLogo}
                  onRemove={() => setExistingLogo(null)}
                />
              ) : (
                <p className="text-sm text-black/48">No logo available.</p>
              )}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
            <Field label="Add screenshots" error={getFieldError("screenshots")}>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                multiple
                onChange={(event) => appendScreenshots(event.target.files)}
                className={inputClassName()}
              />
            </Field>
            <p className="mt-2 text-xs text-black/48">
              {existingScreenshots.length + newScreenshots.length}/3 screenshots selected.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {existingScreenshots.map((image, index) => (
                <ExistingMediaPreview
                  key={image.id}
                  label={`Current screenshot ${index + 1}`}
                  image={image}
                  onRemove={() => removeExistingScreenshot(image.id)}
                />
              ))}
              {newScreenshots.map((image, index) => (
                <LocalPreview
                  key={image.id}
                  label={`New screenshot ${index + 1}`}
                  image={image}
                  onRemove={() => removeNewScreenshot(image.id)}
                />
              ))}
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
            This product has an affiliate program
          </label>

          {isSubmitting ? (
            <div className="rounded-2xl border border-[#9f4f1d]/15 bg-[#fff7ea] px-4 py-3 text-sm text-[#7d3f17]">
              Saving now. Shipboost is updating your listing and syncing media changes.
            </div>
          ) : null}

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

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Saving...
                </>
              ) : (
                "Save changes"
              )}
            </button>
            <Link
              href="/dashboard"
              aria-disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-2xl border border-black/10 px-5 py-3 text-sm font-semibold text-black transition hover:bg-black/[0.03] aria-disabled:pointer-events-none aria-disabled:opacity-50"
            >
              Back to dashboard
            </Link>
          </div>
        </fieldset>
      </form>

      <aside className="rounded-[2rem] bg-[#143f35] p-8 text-[#f8efe3] shadow-[0_24px_80px_rgba(20,63,53,0.24)] sm:p-10">
        <p className="text-sm font-semibold tracking-[0.25em] text-[#f3c781] uppercase">
          Editing notes
        </p>
        <div className="mt-6 space-y-4 text-sm leading-7 text-[#f8efe3]/82">
          <p>Logo and screenshot replacements are uploaded only when you save the form.</p>
          <p>Removed screenshots and replaced logos are deleted from Cloudinary after the save succeeds.</p>
          <p>
            WebP is fine for raster logos. If you later want the sharpest
            possible logos, add SVG as a separate founder/admin upload path.
          </p>
        </div>
      </aside>
    </div>
  );
}
