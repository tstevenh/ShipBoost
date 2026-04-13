"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { 
  Save, Trash2, ArrowLeft, RefreshCw, Check, 
  ExternalLink, Info, Image as ImageIcon, AlertCircle,
  Layout, Share2, Settings, DollarSign
} from "lucide-react";
import { cn } from "@/lib/utils";

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

type UploadedMediaAsset = {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
};

type ToolEditorData = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  richDescription: string;
  pricingModel: PricingModel;
  hasAffiliateProgram: boolean;
  founderXUrl: string | null;
  founderGithubUrl: string | null;
  founderLinkedinUrl: string | null;
  founderFacebookUrl: string | null;
  logoMedia: ExistingImage | null;
  screenshots: ExistingImage[];
  toolCategories: Array<{ categoryId: string }>;
  toolTags: Array<{ tagId: string }>;
};

type EditableImage = {
  id: string;
  file?: File;
  asset?: UploadedMediaAsset;
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

type UploadedToolMediaPayload = {
  logo?: UploadedMediaAsset;
  screenshots: UploadedMediaAsset[];
};

type FormState = {
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  richDescription: string;
  pricingModel: PricingModel;
  hasAffiliateProgram: boolean;
  founderXUrl: string;
  founderGithubUrl: string;
  founderLinkedinUrl: string;
  founderFacebookUrl: string;
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

function toOptionalString(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function revokePreviewUrl(url: string) {
  if (url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

function createFormState(tool: ToolEditorData): FormState {
  return {
    slug: tool.slug,
    name: tool.name,
    tagline: tool.tagline,
    websiteUrl: tool.websiteUrl,
    richDescription: tool.richDescription,
    pricingModel: tool.pricingModel,
    hasAffiliateProgram: tool.hasAffiliateProgram,
    founderXUrl: tool.founderXUrl ?? "",
    founderGithubUrl: tool.founderGithubUrl ?? "",
    founderLinkedinUrl: tool.founderLinkedinUrl ?? "",
    founderFacebookUrl: tool.founderFacebookUrl ?? "",
    categoryIds: tool.toolCategories.map((item) => item.categoryId),
    tagIds: tool.toolTags.map((item) => item.tagId),
  };
}

function inputClassName() {
  return "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-50";
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
    <div className="space-y-2">
      <label className="text-xs font-black  tracking-widest text-muted-foreground ml-1">{label}</label>
      {hint ? <p className="text-[10px] font-bold text-muted-foreground/60  tracking-widest ml-1">{hint}</p> : null}
      {children}
      {error ? (
        <p className="text-[10px] font-bold text-destructive  tracking-widest ml-1">{error}</p>
      ) : null}
    </div>
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

function buildToolUpdatePayload(
  form: FormState,
  existingScreenshots: ExistingImage[],
  logo?: UploadedMediaAsset,
  screenshots: UploadedMediaAsset[] = [],
) {
  return {
    slug: toOptionalString(form.slug),
    name: form.name,
    tagline: form.tagline,
    websiteUrl: form.websiteUrl,
    richDescription: form.richDescription,
    pricingModel: form.pricingModel,
    categoryIds: form.categoryIds,
    tagIds: form.tagIds,
    hasAffiliateProgram: form.hasAffiliateProgram,
    founderXUrl: toOptionalString(form.founderXUrl),
    founderGithubUrl: toOptionalString(form.founderGithubUrl),
    founderLinkedinUrl: toOptionalString(form.founderLinkedinUrl),
    founderFacebookUrl: toOptionalString(form.founderFacebookUrl),
    existingScreenshotIds: existingScreenshots.map((image) => image.id),
    logo,
    screenshots,
  };
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
  const [activeTab, setActiveTab] = useState<"general" | "media" | "socials" | "settings">("general");
  const [form, setForm] = useState<FormState>(() => createFormState(tool));
  const [existingLogo, setExistingLogo] = useState<ExistingImage | null>(
    tool.logoMedia,
  );
  const [newLogo, setNewLogo] = useState<EditableImage | null>(null);
  const [existingScreenshots, setExistingScreenshots] = useState<ExistingImage[]>(
    tool.screenshots,
  );
  const [newScreenshots, setNewScreenshots] = useState<EditableImage[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const submitLockRef = useRef(false);
  const newLogoRef = useRef<EditableImage | null>(null);
  const newScreenshotsRef = useRef<EditableImage[]>([]);

  useEffect(() => {
    newLogoRef.current = newLogo;
    newScreenshotsRef.current = newScreenshots;
  }, [newLogo, newScreenshots]);

  useEffect(() => {
    return () => {
      if (newLogoRef.current) {
        revokePreviewUrl(newLogoRef.current.previewUrl);
      }

      newScreenshotsRef.current.forEach((image) => {
        revokePreviewUrl(image.previewUrl);
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
      revokePreviewUrl(newLogo.previewUrl);
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

  async function uploadPendingMedia(
    currentLogo: EditableImage | null,
    currentScreenshots: EditableImage[],
  ) {
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

    const response = await fetch(`/api/founder/tools/${tool.id}/media`, {
      method: "POST",
      body: formData,
    });
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Unable to upload media.");
    }

    const uploaded = payload.data as UploadedToolMediaPayload;

    if (pendingLogo && !uploaded.logo) {
      throw new Error("Logo upload did not complete.");
    }

    if (uploaded.screenshots.length !== pendingScreenshots.length) {
      throw new Error("Screenshot upload did not complete.");
    }

    const nextLogo: EditableImage | null =
      pendingLogo && uploaded.logo && currentLogo
        ? {
            ...currentLogo,
            asset: uploaded.logo,
            previewUrl: uploaded.logo.url,
            file: undefined,
          }
        : currentLogo;

    if (pendingLogo && currentLogo) {
      revokePreviewUrl(currentLogo.previewUrl);
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
      revokePreviewUrl(image.previewUrl);

      return {
        ...image,
        asset: uploadedAsset,
        previewUrl: uploadedAsset.url,
        file: undefined,
      };
    });

    setNewLogo(nextLogo);
    setNewScreenshots(nextScreenshots);

    return {
      logo: nextLogo,
      screenshots: nextScreenshots,
    };
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
        revokePreviewUrl(target.previewUrl);
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
        const uploadedMedia = await uploadPendingMedia(newLogo, newScreenshots);
        const requestPayload = buildToolUpdatePayload(
          form,
          existingScreenshots,
          uploadedMedia.logo?.asset,
          uploadedMedia.screenshots.flatMap((image) =>
            image.asset ? [image.asset] : [],
          ),
        );

        const response = await fetch(`/api/founder/tools/${tool.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
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

        if (newLogo?.file) {
          revokePreviewUrl(newLogo.previewUrl);
        }
        newScreenshots
          .filter((image) => image.file)
          .forEach((image) => revokePreviewUrl(image.previewUrl));

        setForm(createFormState(updated));
        setExistingLogo(updated.logoMedia);
        setNewLogo(null);
        setExistingScreenshots(updated.screenshots);
        setNewScreenshots([]);
        setSuccessMessage("Listing updated.");
        submitLockRef.current = false;
        setIsSubmitting(false);
      } catch (error) {
        submitLockRef.current = false;
        setIsSubmitting(false);
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to save listing.",
        );
      }
    })();
  }

  function handleDeleteListing() {
    if (isSubmitting || isDeleting) {
      return;
    }
    setDeleteConfirmationText("");
    setIsDeleteModalOpen(true);
  }

  function confirmDeleteListing() {
    if (
      isSubmitting ||
      isDeleting ||
      deleteConfirmationText.trim() !== tool.name
    ) {
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDeleting(true);

    void (async () => {
      try {
        const response = await fetch(`/api/founder/tools/${tool.id}`, {
          method: "DELETE",
        });
        const payload = (await response.json().catch(() => null)) as ApiErrorPayload | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? "Unable to delete listing.");
        }

        setIsDeleteModalOpen(false);
        router.push("/dashboard");
        router.refresh();
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to delete listing.",
        );
        setIsDeleting(false);
      }
    })();
  }

  function getFieldError(field: keyof FormState | "logo" | "screenshots") {
    return fieldErrors[field]?.[0] ?? null;
  }

  const tabs = [
    { id: "general", label: "General", icon: Layout },
    { id: "media", label: "Media", icon: ImageIcon },
    { id: "socials", label: "Socials", icon: Share2 },
    { id: "settings", label: "Settings", icon: Settings },
  ] as const;

  return (
    <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
      <div className="min-w-0 space-y-8">
        <div className="rounded-[2.5rem] border border-border bg-card shadow-xl shadow-black/5 overflow-hidden">
          {/* Header */}
          <div className="border-b border-border bg-muted/10 p-6 sm:p-8 lg:p-12">
            <div className="max-w-2xl min-w-0">
              <p className="text-[10px] font-black tracking-[0.3em] text-primary  mb-4">
                Founder listing editor
              </p>
              <h1 className="max-w-full break-words text-3xl font-black tracking-tight text-foreground [overflow-wrap:anywhere] sm:text-5xl">
                Edit {tool.name}
              </h1>
              <p className="mt-6 text-lg font-medium leading-relaxed text-muted-foreground/80">
                Update your listing copy, links, taxonomy, and media. Changes reflect 
                immediately on your public profile.
              </p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="border-b border-border bg-muted/5 px-4 py-4 sm:px-6 lg:px-12">
            <div className="-mx-1 flex overflow-x-auto px-1 pb-1 sm:flex-wrap sm:overflow-visible">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "mr-2 inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-black tracking-widest transition-all last:mr-0 sm:mr-0",
                    activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-lg shadow-black/10"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <tab.icon size={14} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 lg:p-12">
            <fieldset disabled={isSubmitting || isDeleting} className="space-y-8 disabled:opacity-50">
              {activeTab === "general" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
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
                    hint="Used on cards and launch boards. Keep it between 10 and 60 characters."
                    error={getFieldError("tagline")}
                  >
                    <input
                      required
                      maxLength={60}
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
                    hint="Used on your public tool page. Supports Markdown."
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
                      rows={10}
                      placeholder="Describe the product, who it serves, and the workflows it improves."
                    />
                  </Field>

                  <div className="grid gap-6 md:grid-cols-2">
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
                  </div>

                  <div className="grid gap-6 lg:grid-cols-2">
                    <div className="min-w-0 rounded-2xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black  tracking-widest text-foreground">Categories</p>
                        <p className="text-[10px] font-bold text-muted-foreground  tracking-widest">Pick up to 3.</p>
                      </div>
                      {getFieldError("categoryIds") && (
                        <p className="text-[10px] font-bold text-destructive  tracking-widest">
                          {getFieldError("categoryIds")}
                        </p>
                      )}
                      <div className="grid gap-2">
                        {categories.map((category) => (
                          <label key={category.id} className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer group">
                            <input
                              type="checkbox"
                              className="rounded border-border text-primary focus:ring-primary/20"
                              checked={form.categoryIds.includes(category.id)}
                              onChange={() => toggleCategory(category.id)}
                            />
                            <span className="group-hover:text-primary transition-colors">{category.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-border bg-muted/20 p-5 sm:p-6 space-y-4">
                      <div className="space-y-1">
                        <p className="text-xs font-black  tracking-widest text-foreground">Tags</p>
                        <p className="text-[10px] font-bold text-muted-foreground  tracking-widest">Pick up to 5.</p>
                      </div>
                      {getFieldError("tagIds") && (
                        <p className="text-[10px] font-bold text-destructive  tracking-widest">
                          {getFieldError("tagIds")}
                        </p>
                      )}
                      <div className="grid gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar text-foreground">
                        {tags.map((tag) => (
                          <label key={tag.id} className="flex items-center gap-3 text-sm font-medium text-foreground cursor-pointer group">
                            <input
                              type="checkbox"
                              className="rounded border-border text-primary focus:ring-primary/20"
                              checked={form.tagIds.includes(tag.id)}
                              onChange={() => toggleTag(tag.id)}
                            />
                            <span className="group-hover:text-primary transition-colors">{tag.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-12 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  {/* Logo Section */}
                  <div className="space-y-4">
                    <label className="text-xs font-black  tracking-widest text-muted-foreground ml-1">Logo *</label>
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-6">
                      {(newLogo || existingLogo) && (
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={newLogo?.previewUrl ?? existingLogo?.url} alt="Logo preview" className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (newLogo) {
                                revokePreviewUrl(newLogo.previewUrl);
                                setNewLogo(null);
                              } else {
                                setExistingLogo(null);
                              }
                            }}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                      <label className={cn(
                        "flex w-full flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-6 text-center transition-all hover:border-primary/50 hover:bg-muted/50 sm:flex-1 sm:max-w-[320px] sm:aspect-square",
                        (newLogo || existingLogo) && "hidden sm:flex"
                      )}>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => replaceLogo(e.target.files)}
                        />
                        <div className="w-12 h-12 rounded-xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                          <ImageIcon size={24} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-foreground">Drop image or click to upload</p>
                        </div>
                      </label>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground  tracking-widest ml-1">
                      Use a square format, at least 128x128px.
                    </p>
                  </div>

                  {/* Screenshots Section */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-xs font-black  tracking-widest text-muted-foreground ml-1">Images</label>
                      <p className="text-[10px] font-bold text-muted-foreground leading-relaxed  tracking-widest ml-1">
                        Showcase your product with 1 to 3 images. Recommended 16:9 aspect ratio.
                      </p>
                    </div>

                    <div className="flex flex-col gap-6">
                      {(existingScreenshots.length > 0 || newScreenshots.length > 0) && (
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          {existingScreenshots.map((s) => (
                            <div key={s.id} className="relative group">
                              <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={s.url} alt="Screenshot" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeExistingScreenshot(s.id)}
                                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                          {newScreenshots.map((s) => (
                            <div key={s.id} className="relative group">
                              <div className="aspect-video rounded-2xl overflow-hidden border border-border bg-background shadow-sm">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={s.previewUrl} alt="Screenshot" className="w-full h-full object-cover" />
                              </div>
                              <button
                                type="button"
                                onClick={() => removeNewScreenshot(s.id)}
                                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all z-10"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {(existingScreenshots.length + newScreenshots.length) < 3 && (
                        <label className="w-full aspect-video rounded-[2rem] border-2 border-dashed border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-4 text-center p-8">
                          <input
                            type="file"
                            multiple
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => appendScreenshots(e.target.files)}
                          />
                          <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                            <ImageIcon size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-lg font-black text-foreground">Drop images or click to upload</p>
                            <p className="text-xs font-bold text-muted-foreground  tracking-widest">{3 - (existingScreenshots.length + newScreenshots.length)} left</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "socials" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid gap-6 md:grid-cols-2">
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
                        placeholder="https://x.com/..."
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
                        placeholder="https://github.com/..."
                      />
                    </Field>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
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
                        placeholder="https://linkedin.com/..."
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
                        placeholder="https://facebook.com/..."
                      />
                    </Field>
                  </div>
                </div>
              )}

              {activeTab === "settings" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="rounded-2xl border border-border bg-muted/20 p-5 sm:p-8 space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black  tracking-widest text-foreground flex items-center gap-2">
                        <DollarSign size={16} /> Affiliate Program
                      </h3>
                      <p className="text-[10px] font-bold text-muted-foreground  tracking-widest">Help users know if you offer rewards for referrals.</p>
                    </div>
                    
                    <label className="flex items-center gap-3 text-sm font-bold text-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        className="rounded border-border text-primary focus:ring-primary/20"
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
                  </div>

                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5 sm:p-8 space-y-6">
                    <div className="space-y-1">
                      <h3 className="text-sm font-black  tracking-widest text-destructive flex items-center gap-2">
                        <Trash2 size={16} /> Danger Zone
                      </h3>
                      <p className="text-[10px] font-bold text-destructive/60  tracking-widest">This action is permanent and cannot be undone.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleDeleteListing}
                      className="inline-flex items-center justify-center gap-2 bg-destructive text-destructive-foreground px-6 py-3 rounded-xl text-xs font-black shadow-lg shadow-black/10 hover:opacity-90 transition-all"
                    >
                      Delete product listing
                    </button>
                  </div>
                </div>
              )}

              {/* Status Messages */}
              <div className="space-y-4">
                {isSubmitting && (
                  <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs font-bold text-primary  tracking-widest">
                    <div className="flex items-center gap-2">
                      <RefreshCw size={14} className="animate-spin" />
                      Saving and syncing media...
                    </div>
                  </div>
                )}

                {errorMessage && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs font-bold text-destructive  tracking-widest">
                    <div className="flex items-center gap-2">
                      <AlertCircle size={14} />
                      {errorMessage}
                    </div>
                  </div>
                )}

                {successMessage && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-700  tracking-widest">
                    <div className="flex items-center gap-2">
                      <Check size={14} />
                      {successMessage}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-col gap-3 sm:flex-row pt-8 border-t border-border">
                <button
                  type="submit"
                  disabled={isSubmitting || isDeleting}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-8 py-4 text-sm font-black text-primary-foreground shadow-xl shadow-primary/20 transition hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                  {isSubmitting ? "Saving..." : "Save changes"}
                </button>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border bg-muted/50 px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted"
                >
                  <ArrowLeft size={18} />
                  Back to Dashboard
                </Link>
              </div>
            </fieldset>
          </form>
        </div>
      </div>

      {/* Sidebar Info */}
      <aside className="min-w-0 space-y-6">
        <div className="rounded-[2rem] bg-primary p-6 sm:p-8 text-primary-foreground shadow-2xl shadow-primary/20">
          <div className="flex items-center gap-3 mb-6">
            <Info size={16} />
            <p className="text-[10px] font-black tracking-[0.2em]  opacity-60">
              Editing notes
            </p>
          </div>
          <div className="space-y-6 text-xs font-medium opacity-80 leading-relaxed">
            <p>Logo and screenshot replacements are uploaded only when you save the form.</p>
            <p>Removed screenshots and replaced logos are deleted from our servers after the save succeeds.</p>
            <p>Use high-quality images to ensure your product looks its best on the launchpad.</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-5 sm:p-6">
          <h4 className="text-[10px] font-black  tracking-widest text-muted-foreground/60 mb-4">Preview Listing</h4>
          <Link
            href={`/dashboard/tools/${tool.id}/preview`}
            target="_blank"
            className="flex items-center justify-center gap-2 w-full bg-foreground text-background px-5 py-3 rounded-xl text-xs font-black hover:opacity-90 transition-all"
          >
            <ExternalLink size={14} /> Open Founder Preview
          </Link>
        </div>
      </aside>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm px-4">
          <div className="w-full max-w-xl rounded-[2.5rem] border border-border bg-card p-6 sm:p-10 shadow-2xl">
            <p className="text-[10px] font-black tracking-[0.3em] text-destructive  mb-4">
              Delete listing
            </p>
            <h2 className="text-3xl font-black tracking-tight text-foreground">
              Delete {tool.name} permanently?
            </h2>
            <p className="mt-6 text-sm font-medium leading-relaxed text-muted-foreground">
              This permanently removes the listing, launches, submissions, votes,
              claims, and stored media. Type <span className="font-black text-foreground">{tool.name}</span> to confirm.
            </p>

            <div className="mt-8">
              <input
                value={deleteConfirmationText}
                onChange={(event) => setDeleteConfirmationText(event.target.value)}
                className={inputClassName()}
                placeholder="Type product name here..."
                autoFocus
              />
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (isDeleting) return;
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationText("");
                }}
                disabled={isDeleting}
                className="inline-flex items-center justify-center rounded-2xl border border-border bg-muted/50 px-8 py-4 text-sm font-black text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteListing}
                disabled={isDeleting || deleteConfirmationText.trim() !== tool.name}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-destructive text-destructive-foreground px-8 py-4 text-sm font-black shadow-xl shadow-destructive/20 transition hover:opacity-90 disabled:opacity-50"
              >
                {isDeleting ? <RefreshCw size={18} className="animate-spin" /> : <Trash2 size={18} />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
