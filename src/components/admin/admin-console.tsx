"use client";

import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from "react";

type Category = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  seoIntro: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Tag = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

type Tool = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  websiteUrl: string;
  moderationStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "HIDDEN";
  publicationStatus: "UNPUBLISHED" | "PUBLISHED" | "ARCHIVED";
  pricingModel: "FREE" | "FREEMIUM" | "PAID" | "CUSTOM" | "CONTACT_SALES";
  isFeatured: boolean;
  hasAffiliateProgram: boolean;
  affiliateUrl: string | null;
  affiliateSource: string | null;
  createdAt: string;
  internalNote: string | null;
  logoMedia: {
    url: string;
  } | null;
  owner: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  } | null;
  toolCategories: Array<{
    categoryId: string;
    category: { id: string; name: string; slug: string };
  }>;
  toolTags: Array<{
    tagId: string;
    tag: { id: string; name: string; slug: string };
  }>;
  submissions: Array<{
    id: string;
    reviewStatus: string;
  }>;
  launches: Array<{
    id: string;
    launchType: string;
    status: string;
    launchDate: string;
  }>;
};

type Submission = {
  id: string;
  submissionType: "LISTING_ONLY" | "FREE_LAUNCH" | "FEATURED_LAUNCH" | "RELAUNCH";
  reviewStatus: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED";
  preferredLaunchDate: string | null;
  paymentStatus: "NOT_REQUIRED" | "PENDING" | "PAID" | "FAILED" | "REFUNDED";
  badgeFooterUrl: string | null;
  badgeVerification: "NOT_REQUIRED" | "PENDING" | "VERIFIED" | "FAILED";
  founderVisibleNote: string | null;
  internalReviewNote: string | null;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
  };
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    logoMedia: { url: string } | null;
    launches: Array<{
      id: string;
      launchType: string;
      status: string;
      launchDate: string;
    }>;
  };
};

type ToolCreateForm = {
  name: string;
  slug: string;
  tagline: string;
  websiteUrl: string;
  richDescription: string;
  pricingModel: Tool["pricingModel"];
  logoUrl: string;
  screenshotUrls: string;
  affiliateUrl: string;
  affiliateSource: string;
  hasAffiliateProgram: boolean;
  founderXUrl: string;
  founderGithubUrl: string;
  founderLinkedinUrl: string;
  founderFacebookUrl: string;
  categoryIds: string[];
  tagIds: string[];
  publish: boolean;
  isFeatured: boolean;
};

type CategoryDraft = {
  name: string;
  slug: string;
  description: string;
  seoIntro: string;
  sortOrder: string;
  isActive: boolean;
};

type TagDraft = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

const moderationStatuses = [
  "DRAFT",
  "PENDING",
  "APPROVED",
  "REJECTED",
  "HIDDEN",
] as const;

const publicationStatuses = [
  "UNPUBLISHED",
  "PUBLISHED",
  "ARCHIVED",
] as const;

const pricingModels = [
  "FREE",
  "FREEMIUM",
  "PAID",
  "CUSTOM",
  "CONTACT_SALES",
] as const;

function emptyToolForm(): ToolCreateForm {
  return {
    name: "",
    slug: "",
    tagline: "",
    websiteUrl: "",
    richDescription: "",
    pricingModel: "FREEMIUM",
    logoUrl: "",
    screenshotUrls: "",
    affiliateUrl: "",
    affiliateSource: "",
    hasAffiliateProgram: false,
    founderXUrl: "",
    founderGithubUrl: "",
    founderLinkedinUrl: "",
    founderFacebookUrl: "",
    categoryIds: [],
    tagIds: [],
    publish: true,
    isFeatured: false,
  };
}

function emptyCategoryDraft(): CategoryDraft {
  return {
    name: "",
    slug: "",
    description: "",
    seoIntro: "",
    sortOrder: "0",
    isActive: true,
  };
}

function emptyTagDraft(): TagDraft {
  return {
    name: "",
    slug: "",
    description: "",
    isActive: true,
  };
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
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

function SectionCard({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-black/10 bg-white p-6 shadow-[0_24px_80px_rgba(0,0,0,0.08)] sm:p-8">
      <p className="text-sm font-semibold tracking-[0.24em] text-[#9f4f1d] uppercase">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-black">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-black/62">
        {description}
      </p>
      <div className="mt-8">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-black/72">{label}</span>
      {children}
    </label>
  );
}

function StatusChip({
  label,
  tone,
}: {
  label: string;
  tone: "neutral" | "green" | "amber" | "rose" | "slate";
}) {
  const className =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : tone === "amber"
        ? "bg-amber-50 text-amber-700 border-amber-200"
        : tone === "rose"
          ? "bg-rose-50 text-rose-700 border-rose-200"
          : tone === "slate"
            ? "bg-slate-100 text-slate-700 border-slate-200"
            : "bg-black/[0.04] text-black/70 border-black/10";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${className}`}
    >
      {label}
    </span>
  );
}

function textInputClassName() {
  return "w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10";
}

function pendingSpinnerClassName() {
  return "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current";
}

function getSubmissionLifecycle(submission: Submission) {
  if (submission.reviewStatus === "REJECTED") {
    return { label: "Needs changes", tone: "rose" as const };
  }

  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PENDING"
  ) {
    return { label: "Awaiting payment", tone: "amber" as const };
  }

  if (submission.reviewStatus === "APPROVED") {
    return { label: "Approved", tone: "green" as const };
  }

  return { label: "Pending review", tone: "amber" as const };
}

function getPaymentStatusLabel(submission: Submission) {
  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PENDING"
  ) {
    return "Awaiting payment";
  }

  return submission.paymentStatus;
}

export function AdminConsole() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);

  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [toolSearch, setToolSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const deferredToolSearch = useDeferredValue(toolSearch);
  const deferredSubmissionSearch = useDeferredValue(submissionSearch);

  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft);
  const [tagDraft, setTagDraft] = useState<TagDraft>(emptyTagDraft);
  const [toolDraft, setToolDraft] = useState<ToolCreateForm>(emptyToolForm);

  const [editingCategories, setEditingCategories] = useState<Record<string, CategoryDraft>>({});
  const [editingTags, setEditingTags] = useState<Record<string, TagDraft>>({});
  const [toolNotes, setToolNotes] = useState<Record<string, string>>({});
  const [submissionNotes, setSubmissionNotes] = useState<
    Record<string, { founderVisibleNote: string; internalReviewNote: string }>
  >({});
  const [submissionFilter, setSubmissionFilter] = useState<"" | Submission["reviewStatus"]>("PENDING");

  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [bootError, setBootError] = useState<string | null>(null);

  const totalPending = useMemo(
    () =>
      submissions.filter(
        (submission) =>
          submission.reviewStatus === "PENDING" &&
          !(
            submission.submissionType === "FEATURED_LAUNCH" &&
            submission.paymentStatus === "PENDING"
          ),
      ).length,
    [submissions],
  );

  const publishedCount = useMemo(
    () => tools.filter((tool) => tool.publicationStatus === "PUBLISHED").length,
    [tools],
  );

  const hasPendingAction = pendingAction !== null;

  function isActionPending(actionKey: string) {
    return pendingAction === actionKey;
  }

  function isActionGroupPending(prefix: string) {
    return pendingAction?.startsWith(prefix) ?? false;
  }

  async function refreshCatalog() {
    const [nextCategories, nextTags] = await Promise.all([
      apiRequest<Category[]>("/api/admin/categories"),
      apiRequest<Tag[]>("/api/admin/tags"),
    ]);

    setCategories(nextCategories);
    setTags(nextTags);
  }

  async function refreshTools(search = deferredToolSearch) {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    const nextTools = await apiRequest<Tool[]>(
      `/api/admin/tools${params.toString() ? `?${params.toString()}` : ""}`,
    );

    setTools(nextTools);
  }

  async function refreshSubmissions(
    search = deferredSubmissionSearch,
    status = submissionFilter,
  ) {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (status) {
      params.set("reviewStatus", status);
    }

    const nextSubmissions = await apiRequest<Submission[]>(
      `/api/admin/submissions${params.toString() ? `?${params.toString()}` : ""}`,
    );

    setSubmissions(nextSubmissions);
  }

  const syncToolsSearch = useEffectEvent(async (search: string) => {
    await refreshTools(search);
  });

  const syncSubmissionsSearch = useEffectEvent(
    async (search: string, status: "" | Submission["reviewStatus"]) => {
      await refreshSubmissions(search, status);
    },
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [nextCategories, nextTags, nextTools, nextSubmissions] =
          await Promise.all([
            apiRequest<Category[]>("/api/admin/categories"),
            apiRequest<Tag[]>("/api/admin/tags"),
            apiRequest<Tool[]>("/api/admin/tools"),
            apiRequest<Submission[]>("/api/admin/submissions?reviewStatus=PENDING"),
          ]);

        if (cancelled) {
          return;
        }

        setCategories(nextCategories);
        setTags(nextTags);
        setTools(nextTools);
        setSubmissions(nextSubmissions);
      } catch (error) {
        if (!cancelled) {
          setBootError(toErrorMessage(error));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    void syncToolsSearch(deferredToolSearch);
  }, [deferredToolSearch]);

  useEffect(() => {
    void syncSubmissionsSearch(deferredSubmissionSearch, submissionFilter);
  }, [deferredSubmissionSearch, submissionFilter]);

  function handleCategorySelection(categoryId: string) {
    setToolDraft((current) => ({
      ...current,
      categoryIds: current.categoryIds.includes(categoryId)
        ? current.categoryIds.filter((id) => id !== categoryId)
        : [...current.categoryIds, categoryId].slice(0, 3),
    }));
  }

  function handleTagSelection(tagId: string) {
    setToolDraft((current) => ({
      ...current,
      tagIds: current.tagIds.includes(tagId)
        ? current.tagIds.filter((id) => id !== tagId)
        : [...current.tagIds, tagId].slice(0, 5),
    }));
  }

  function getCategoryDraft(category: Category) {
    return (
      editingCategories[category.id] ?? {
        name: category.name,
        slug: category.slug,
        description: category.description ?? "",
        seoIntro: category.seoIntro ?? "",
        sortOrder: String(category.sortOrder),
        isActive: category.isActive,
      }
    );
  }

  function getTagDraft(tag: Tag) {
    return (
      editingTags[tag.id] ?? {
        name: tag.name,
        slug: tag.slug,
        description: tag.description ?? "",
        isActive: tag.isActive,
      }
    );
  }

  function getToolNote(tool: Tool) {
    return toolNotes[tool.id] ?? tool.internalNote ?? "";
  }

  function getSubmissionReviewDraft(submission: Submission) {
    return (
      submissionNotes[submission.id] ?? {
        founderVisibleNote: submission.founderVisibleNote ?? "",
        internalReviewNote: submission.internalReviewNote ?? "",
      }
    );
  }

  async function handleCreateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasPendingAction) {
      return;
    }

    setCatalogError(null);
    setPendingAction("category:create");

    try {
      await apiRequest<Category>("/api/admin/categories", {
        method: "POST",
        body: JSON.stringify({
          ...categoryDraft,
          sortOrder: Number(categoryDraft.sortOrder || "0"),
        }),
      });

      setCategoryDraft(emptyCategoryDraft());
      await refreshCatalog();
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasPendingAction) {
      return;
    }

    setCatalogError(null);
    setPendingAction("tag:create");

    try {
      await apiRequest<Tag>("/api/admin/tags", {
        method: "POST",
        body: JSON.stringify(tagDraft),
      });

      setTagDraft(emptyTagDraft());
      await refreshCatalog();
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveCategory(categoryId: string) {
    if (hasPendingAction) {
      return;
    }

    setCatalogError(null);
    setPendingAction(`category:${categoryId}:save`);

    try {
      const draft = editingCategories[categoryId];

      if (!draft) {
        return;
      }

      await apiRequest<Category>(`/api/admin/categories/${categoryId}`, {
        method: "PATCH",
        body: JSON.stringify({
          ...draft,
          sortOrder: Number(draft.sortOrder || "0"),
        }),
      });

      setEditingCategories((current) => {
        const next = { ...current };
        delete next[categoryId];
        return next;
      });
      await refreshCatalog();
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteCategory(categoryId: string) {
    if (hasPendingAction) {
      return;
    }

    setCatalogError(null);
    setPendingAction(`category:${categoryId}:delete`);

    try {
      await apiRequest<{ success: true }>(`/api/admin/categories/${categoryId}`, {
        method: "DELETE",
      });
      await refreshCatalog();
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSaveTag(tagId: string) {
    if (hasPendingAction) {
      return;
    }

    setCatalogError(null);
    setPendingAction(`tag:${tagId}:save`);

    try {
      const draft = editingTags[tagId];

      if (!draft) {
        return;
      }

      await apiRequest<Tag>(`/api/admin/tags/${tagId}`, {
        method: "PATCH",
        body: JSON.stringify(draft),
      });

      setEditingTags((current) => {
        const next = { ...current };
        delete next[tagId];
        return next;
      });
      await refreshCatalog();
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleDeleteTag(tagId: string) {
    if (hasPendingAction) {
      return;
    }

    setCatalogError(null);
    setPendingAction(`tag:${tagId}:delete`);

    try {
      await apiRequest<{ success: true }>(`/api/admin/tags/${tagId}`, {
        method: "DELETE",
      });
      await refreshCatalog();
    } catch (error) {
      setCatalogError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleCreateTool(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (hasPendingAction) {
      return;
    }

    setToolError(null);
    setPendingAction("tool:create");

    try {
      const screenshots = toolDraft.screenshotUrls
        .split("\n")
        .map((value) => value.trim())
        .filter(Boolean)
        .map((url) => ({ url }));

      await apiRequest<Tool>("/api/admin/tools", {
        method: "POST",
        body: JSON.stringify({
          name: toolDraft.name,
          slug: toolDraft.slug || undefined,
          tagline: toolDraft.tagline,
          websiteUrl: toolDraft.websiteUrl,
          richDescription: toolDraft.richDescription,
          pricingModel: toolDraft.pricingModel,
          categoryIds: toolDraft.categoryIds,
          tagIds: toolDraft.tagIds,
          logo: { url: toolDraft.logoUrl },
          screenshots,
          affiliateUrl: toolDraft.affiliateUrl || undefined,
          affiliateSource: toolDraft.affiliateSource || undefined,
          hasAffiliateProgram: toolDraft.hasAffiliateProgram,
          founderXUrl: toolDraft.founderXUrl || undefined,
          founderGithubUrl: toolDraft.founderGithubUrl || undefined,
          founderLinkedinUrl: toolDraft.founderLinkedinUrl || undefined,
          founderFacebookUrl: toolDraft.founderFacebookUrl || undefined,
          publish: toolDraft.publish,
          isFeatured: toolDraft.isFeatured,
        }),
      });

      setToolDraft(emptyToolForm());
      await refreshTools("");
    } catch (error) {
      setToolError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleToolStatusUpdate(
    toolId: string,
    actionKey: string,
    payload: Partial<{
      moderationStatus: Tool["moderationStatus"];
      publicationStatus: Tool["publicationStatus"];
      isFeatured: boolean;
      internalNote: string;
    }>,
  ) {
    if (hasPendingAction) {
      return;
    }

    setToolError(null);
    setPendingAction(actionKey);

    try {
      await apiRequest<Tool>(`/api/admin/tools/${toolId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });

      await refreshTools();
    } catch (error) {
      setToolError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  async function handleSubmissionReview(
    submissionId: string,
    action: "APPROVE" | "REJECT",
  ) {
    if (hasPendingAction) {
      return;
    }

    setSubmissionError(null);
    setPendingAction(`review:${submissionId}:${action}`);

    try {
      const draft = getSubmissionReviewDraft(
        submissions.find((submission) => submission.id === submissionId)!,
      );

      await apiRequest<Submission>(
        `/api/admin/submissions/${submissionId}/review`,
        {
          method: "POST",
          body: JSON.stringify({
            action,
            founderVisibleNote: draft.founderVisibleNote || undefined,
            internalReviewNote: draft.internalReviewNote || undefined,
            publishTool: true,
            goLiveNow: true,
          }),
        },
      );

      await Promise.all([refreshSubmissions(), refreshTools()]);
    } catch (error) {
      setSubmissionError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  if (bootError) {
    return (
      <div className="rounded-[2rem] border border-rose-200 bg-rose-50 p-8 text-rose-700">
        {bootError}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-[1.75rem] border border-black/10 bg-[#fff9ef] p-5">
          <p className="text-sm text-black/55">Pending reviews</p>
          <p className="mt-2 text-3xl font-semibold text-black">{totalPending}</p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#f3f8f6] p-5">
          <p className="text-sm text-black/55">Published tools</p>
          <p className="mt-2 text-3xl font-semibold text-black">{publishedCount}</p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#f6f2ff] p-5">
          <p className="text-sm text-black/55">Categories</p>
          <p className="mt-2 text-3xl font-semibold text-black">{categories.length}</p>
        </div>
        <div className="rounded-[1.75rem] border border-black/10 bg-[#fff6f2] p-5">
          <p className="text-sm text-black/55">Tags</p>
          <p className="mt-2 text-3xl font-semibold text-black">{tags.length}</p>
        </div>
      </div>

      <SectionCard
        eyebrow="Review queue"
        title="Moderate founder submissions"
        description="Approve launches, reject bad fits, and write the notes founders will actually see."
      >
        <div className="mb-6 flex flex-col gap-3 md:flex-row">
          <input
            value={submissionSearch}
            onChange={(event) => setSubmissionSearch(event.target.value)}
            placeholder="Search by founder, email, tool, or slug"
            className={textInputClassName()}
          />
          <select
            value={submissionFilter}
            onChange={(event) =>
              setSubmissionFilter(event.target.value as "" | Submission["reviewStatus"])
            }
            className={textInputClassName()}
          >
            <option value="PENDING">Pending only</option>
            <option value="APPROVED">Approved only</option>
            <option value="REJECTED">Rejected only</option>
            <option value="">All statuses</option>
          </select>
        </div>

        {submissionError ? (
          <div className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {submissionError}
          </div>
        ) : null}

        <div className="space-y-4">
          {submissions.map((submission) => {
            const draft = getSubmissionReviewDraft(submission);
            const lifecycle = getSubmissionLifecycle(submission);
            const requiresManualReview =
              submission.reviewStatus === "PENDING" &&
              !(
                submission.submissionType === "FEATURED_LAUNCH" &&
                submission.paymentStatus === "PENDING"
              );

            return (
              <article
                key={submission.id}
                className="rounded-[1.75rem] border border-black/10 bg-[#fffdf9] p-5"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusChip
                        label={lifecycle.label}
                        tone={lifecycle.tone}
                      />
                      <StatusChip label={submission.submissionType} tone="slate" />
                      <StatusChip label={getPaymentStatusLabel(submission)} tone="neutral" />
                      <StatusChip label={submission.badgeVerification} tone="neutral" />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold text-black">
                        {submission.tool.name}
                      </h3>
                      <p className="mt-1 text-sm text-black/58">
                        {submission.tool.tagline}
                      </p>
                    </div>

                    <div className="grid gap-2 text-sm text-black/62 sm:grid-cols-2">
                      <p>
                        Founder: {submission.user.name ?? "Unnamed founder"} ({submission.user.email})
                      </p>
                      <p>Submitted: {formatDate(submission.createdAt)}</p>
                      <p>Slug: {submission.tool.slug}</p>
                      {submission.preferredLaunchDate ? (
                        <p>
                          Preferred date: {formatDate(submission.preferredLaunchDate)}
                        </p>
                      ) : null}
                      {submission.submissionType === "FEATURED_LAUNCH" &&
                      submission.paymentStatus === "PENDING" ? (
                        <p className="sm:col-span-2">
                          This featured launch will auto-approve after payment. It does not need the normal review queue.
                        </p>
                      ) : null}
                      <p>
                        Badge URL: {submission.badgeFooterUrl ? "Provided" : "Not required"}
                      </p>
                    </div>
                  </div>

                  <a
                    href={submission.tool.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
                  >
                    Visit site
                  </a>
                </div>

                <div className="mt-5 grid gap-4 lg:grid-cols-2">
                  <Field label="Founder-visible note">
                    <textarea
                      value={draft.founderVisibleNote}
                      onChange={(event) =>
                        setSubmissionNotes((current) => ({
                          ...current,
                          [submission.id]: {
                            ...draft,
                            founderVisibleNote: event.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className={textInputClassName()}
                      placeholder="Optional note the founder will see."
                    />
                  </Field>
                  <Field label="Internal review note">
                    <textarea
                      value={draft.internalReviewNote}
                      onChange={(event) =>
                        setSubmissionNotes((current) => ({
                          ...current,
                          [submission.id]: {
                            ...draft,
                            internalReviewNote: event.target.value,
                          },
                        }))
                      }
                      rows={3}
                      className={textInputClassName()}
                      placeholder="Internal reasoning for your team."
                    />
                  </Field>
                </div>

                {requiresManualReview ? (
                  <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => handleSubmissionReview(submission.id, "APPROVE")}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`review:${submission.id}:APPROVE`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Approving...
                        </>
                      ) : (
                        "Approve and publish"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmissionReview(submission.id, "REJECT")}
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 bg-white px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`review:${submission.id}:REJECT`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Rejecting...
                        </>
                      ) : (
                        "Reject submission"
                      )}
                    </button>
                  </div>
                ) : null}
              </article>
            );
          })}

          {submissions.length === 0 ? (
            <div className="rounded-[1.75rem] border border-dashed border-black/15 bg-black/[0.02] px-5 py-10 text-center text-sm text-black/55">
              No submissions matched this filter.
            </div>
          ) : null}
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Tool ops"
        title="Create and tune directory listings"
        description="Seed listings manually, then use quick controls to keep publication state and featured placement aligned."
      >
        <div className="grid gap-8 xl:grid-cols-[1.1fr_0.9fr]">
          <form onSubmit={handleCreateTool} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tool name">
                <input
                  value={toolDraft.name}
                  onChange={(event) =>
                    setToolDraft((current) => ({ ...current, name: event.target.value }))
                  }
                  className={textInputClassName()}
                  required
                />
              </Field>
              <Field label="Optional slug">
                <input
                  value={toolDraft.slug}
                  onChange={(event) =>
                    setToolDraft((current) => ({ ...current, slug: event.target.value }))
                  }
                  className={textInputClassName()}
                  placeholder="shipboost"
                />
              </Field>
            </div>

            <Field label="Tagline">
              <input
                value={toolDraft.tagline}
                onChange={(event) =>
                  setToolDraft((current) => ({ ...current, tagline: event.target.value }))
                }
                className={textInputClassName()}
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Website URL">
                <input
                  type="url"
                  value={toolDraft.websiteUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      websiteUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                  required
                />
              </Field>
              <Field label="Logo URL">
                <input
                  type="url"
                  value={toolDraft.logoUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({ ...current, logoUrl: event.target.value }))
                  }
                  className={textInputClassName()}
                  required
                />
              </Field>
            </div>

            <Field label="Rich description">
              <textarea
                value={toolDraft.richDescription}
                onChange={(event) =>
                  setToolDraft((current) => ({
                    ...current,
                    richDescription: event.target.value,
                  }))
                }
                rows={5}
                className={textInputClassName()}
                required
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Pricing model">
                <select
                  value={toolDraft.pricingModel}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      pricingModel: event.target.value as Tool["pricingModel"],
                    }))
                  }
                  className={textInputClassName()}
                >
                  {pricingModels.map((pricingModel) => (
                    <option key={pricingModel} value={pricingModel}>
                      {pricingModel}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Screenshot URLs">
                <textarea
                  value={toolDraft.screenshotUrls}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      screenshotUrls: event.target.value,
                    }))
                  }
                  rows={3}
                  className={textInputClassName()}
                  placeholder="One URL per line"
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Affiliate URL">
                <input
                  type="url"
                  value={toolDraft.affiliateUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      affiliateUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
              <Field label="Affiliate source">
                <input
                  value={toolDraft.affiliateSource}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      affiliateSource: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Founder X URL">
                <input
                  type="url"
                  value={toolDraft.founderXUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      founderXUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
              <Field label="Founder GitHub URL">
                <input
                  type="url"
                  value={toolDraft.founderGithubUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      founderGithubUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Founder LinkedIn URL">
                <input
                  type="url"
                  value={toolDraft.founderLinkedinUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      founderLinkedinUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
              <Field label="Founder Facebook URL">
                <input
                  type="url"
                  value={toolDraft.founderFacebookUrl}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      founderFacebookUrl: event.target.value,
                    }))
                  }
                  className={textInputClassName()}
                />
              </Field>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
                <p className="text-sm font-semibold text-black">Categories</p>
                <div className="mt-3 grid gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center gap-3 text-sm text-black/70">
                      <input
                        type="checkbox"
                        checked={toolDraft.categoryIds.includes(category.id)}
                        onChange={() => handleCategorySelection(category.id)}
                      />
                      {category.name}
                    </label>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-4">
                <p className="text-sm font-semibold text-black">Tags</p>
                <div className="mt-3 grid gap-2">
                  {tags.map((tag) => (
                    <label key={tag.id} className="flex items-center gap-3 text-sm text-black/70">
                      <input
                        type="checkbox"
                        checked={toolDraft.tagIds.includes(tag.id)}
                        onChange={() => handleTagSelection(tag.id)}
                      />
                      {tag.name}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-5">
              <label className="flex items-center gap-3 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={toolDraft.hasAffiliateProgram}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      hasAffiliateProgram: event.target.checked,
                    }))
                  }
                />
                Has affiliate program
              </label>
              <label className="flex items-center gap-3 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={toolDraft.publish}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      publish: event.target.checked,
                    }))
                  }
                />
                Publish immediately
              </label>
              <label className="flex items-center gap-3 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={toolDraft.isFeatured}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      isFeatured: event.target.checked,
                    }))
                  }
                />
                Mark featured
              </label>
            </div>

            {toolError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {toolError}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={hasPendingAction}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isActionPending("tool:create") ? (
                <>
                  <span className={pendingSpinnerClassName()} />
                  Creating tool...
                </>
              ) : (
                "Create tool"
              )}
            </button>
          </form>

          <div className="space-y-4">
            <input
              value={toolSearch}
              onChange={(event) => setToolSearch(event.target.value)}
              placeholder="Search tools by name, slug, or tagline"
              className={textInputClassName()}
            />

            <div className="space-y-4">
              {tools.map((tool) => (
                <article
                  key={tool.id}
                  className="rounded-[1.5rem] border border-black/10 bg-[#fffdf8] p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-lg font-semibold text-black">{tool.name}</h3>
                        {tool.isFeatured ? (
                          <StatusChip label="Featured" tone="amber" />
                        ) : null}
                      </div>
                      <p className="mt-1 text-sm text-black/55">{tool.tagline}</p>
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-black/42">
                        {tool.slug}
                      </p>
                    </div>
                    <a
                      href={tool.websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-black transition hover:bg-black/[0.04]"
                    >
                      Open
                    </a>
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <Field label="Moderation">
                      <select
                        value={tool.moderationStatus}
                        onChange={(event) =>
                          void handleToolStatusUpdate(
                            tool.id,
                            `tool:${tool.id}:moderation`,
                            {
                              moderationStatus: event.target.value as Tool["moderationStatus"],
                            },
                          )
                        }
                        disabled={hasPendingAction}
                        className={textInputClassName()}
                      >
                        {moderationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Publication">
                      <select
                        value={tool.publicationStatus}
                        onChange={(event) =>
                          void handleToolStatusUpdate(
                            tool.id,
                            `tool:${tool.id}:publication`,
                            {
                              publicationStatus: event.target.value as Tool["publicationStatus"],
                            },
                          )
                        }
                        disabled={hasPendingAction}
                        className={textInputClassName()}
                      >
                        {publicationStatuses.map((status) => (
                          <option key={status} value={status}>
                            {status}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-black/68">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={tool.isFeatured}
                        onChange={(event) =>
                          void handleToolStatusUpdate(tool.id, `tool:${tool.id}:featured`, {
                            isFeatured: event.target.checked,
                          })
                        }
                        disabled={hasPendingAction}
                      />
                      Featured
                    </label>
                    <span>
                      Categories:{" "}
                      {tool.toolCategories.map((item) => item.category.name).join(", ") || "None"}
                    </span>
                    <span>
                      Tags: {tool.toolTags.map((item) => item.tag.name).join(", ") || "None"}
                    </span>
                  </div>

                  {isActionGroupPending(`tool:${tool.id}:`) ? (
                    <p className="text-sm font-medium text-[#8a4b1b]">
                      Saving tool changes...
                    </p>
                  ) : null}

                  <div className="mt-4 space-y-2">
                    <Field label="Internal note">
                      <textarea
                        value={getToolNote(tool)}
                        onChange={(event) =>
                          setToolNotes((current) => ({
                            ...current,
                            [tool.id]: event.target.value,
                          }))
                        }
                        rows={3}
                        className={textInputClassName()}
                      />
                    </Field>
                    <button
                      type="button"
                      onClick={() =>
                        void handleToolStatusUpdate(tool.id, `tool:${tool.id}:note`, {
                          internalNote: getToolNote(tool),
                        })
                      }
                      disabled={hasPendingAction}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isActionPending(`tool:${tool.id}:note`) ? (
                        <>
                          <span className={pendingSpinnerClassName()} />
                          Saving note...
                        </>
                      ) : (
                        "Save note"
                      )}
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        eyebrow="Catalog"
        title="Edit categories and tags"
        description="Keep the taxonomy narrow and intentional so the directory doesn’t turn into a generic dump."
      >
        <div className="grid gap-8 xl:grid-cols-2">
          <div className="space-y-6">
            <form onSubmit={handleCreateCategory} className="space-y-4 rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5">
              <h3 className="text-lg font-semibold text-black">Create category</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input
                    value={categoryDraft.name}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    className={textInputClassName()}
                    required
                  />
                </Field>
                <Field label="Slug">
                  <input
                    value={categoryDraft.slug}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({ ...current, slug: event.target.value }))
                    }
                    className={textInputClassName()}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={categoryDraft.description}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className={textInputClassName()}
                />
              </Field>
              <Field label="SEO intro">
                <textarea
                  value={categoryDraft.seoIntro}
                  onChange={(event) =>
                    setCategoryDraft((current) => ({
                      ...current,
                      seoIntro: event.target.value,
                    }))
                  }
                  rows={2}
                  className={textInputClassName()}
                />
              </Field>
              <div className="flex items-center gap-4">
                <Field label="Sort order">
                  <input
                    type="number"
                    value={categoryDraft.sortOrder}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({
                        ...current,
                        sortOrder: event.target.value,
                      }))
                    }
                    className={textInputClassName()}
                  />
                </Field>
                <label className="mt-7 flex items-center gap-3 text-sm text-black/70">
                  <input
                    type="checkbox"
                    checked={categoryDraft.isActive}
                    onChange={(event) =>
                      setCategoryDraft((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                  />
                  Active
                </label>
              </div>
              <button
                type="submit"
                disabled={hasPendingAction}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionPending("category:create") ? (
                  <>
                    <span className={pendingSpinnerClassName()} />
                    Saving category...
                  </>
                ) : (
                  "Save category"
                )}
              </button>
            </form>

            <div className="space-y-4">
              {categories.map((category) => {
                const draft = getCategoryDraft(category);

                return (
                  <article key={category.id} className="rounded-[1.75rem] border border-black/10 bg-white p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Name">
                        <input
                          value={draft.name}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: { ...draft, name: event.target.value },
                            }))
                          }
                          className={textInputClassName()}
                        />
                      </Field>
                      <Field label="Slug">
                        <input
                          value={draft.slug}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: { ...draft, slug: event.target.value },
                            }))
                          }
                          className={textInputClassName()}
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                      <Field label="Description">
                        <textarea
                          value={draft.description}
                          onChange={(event) =>
                            setEditingCategories((current) => ({
                              ...current,
                              [category.id]: {
                                ...draft,
                                description: event.target.value,
                              },
                            }))
                          }
                          rows={3}
                          className={textInputClassName()}
                        />
                      </Field>
                      <div className="space-y-4">
                        <Field label="Sort order">
                          <input
                            type="number"
                            value={draft.sortOrder}
                            onChange={(event) =>
                              setEditingCategories((current) => ({
                                ...current,
                                [category.id]: {
                                  ...draft,
                                  sortOrder: event.target.value,
                                },
                              }))
                            }
                            className={textInputClassName()}
                          />
                        </Field>
                        <label className="flex items-center gap-3 text-sm text-black/70">
                          <input
                            type="checkbox"
                            checked={draft.isActive}
                            onChange={(event) =>
                              setEditingCategories((current) => ({
                                ...current,
                                [category.id]: {
                                  ...draft,
                                  isActive: event.target.checked,
                                },
                              }))
                            }
                          />
                          Active
                        </label>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSaveCategory(category.id)}
                        disabled={hasPendingAction}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActionPending(`category:${category.id}:save`) ? (
                          <>
                            <span className={pendingSpinnerClassName()} />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteCategory(category.id)}
                        disabled={hasPendingAction}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActionPending(`category:${category.id}:delete`) ? (
                          <>
                            <span className={pendingSpinnerClassName()} />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleCreateTag} className="space-y-4 rounded-[1.75rem] border border-black/10 bg-[#fffdf8] p-5">
              <h3 className="text-lg font-semibold text-black">Create tag</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Name">
                  <input
                    value={tagDraft.name}
                    onChange={(event) =>
                      setTagDraft((current) => ({ ...current, name: event.target.value }))
                    }
                    className={textInputClassName()}
                    required
                  />
                </Field>
                <Field label="Slug">
                  <input
                    value={tagDraft.slug}
                    onChange={(event) =>
                      setTagDraft((current) => ({ ...current, slug: event.target.value }))
                    }
                    className={textInputClassName()}
                  />
                </Field>
              </div>
              <Field label="Description">
                <textarea
                  value={tagDraft.description}
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                  rows={3}
                  className={textInputClassName()}
                />
              </Field>
              <label className="flex items-center gap-3 text-sm text-black/70">
                <input
                  type="checkbox"
                  checked={tagDraft.isActive}
                  onChange={(event) =>
                    setTagDraft((current) => ({
                      ...current,
                      isActive: event.target.checked,
                    }))
                  }
                />
                Active
              </label>
              <button
                type="submit"
                disabled={hasPendingAction}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#143f35] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#0d2e26] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isActionPending("tag:create") ? (
                  <>
                    <span className={pendingSpinnerClassName()} />
                    Saving tag...
                  </>
                ) : (
                  "Save tag"
                )}
              </button>
            </form>

            {catalogError ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {catalogError}
              </div>
            ) : null}

            <div className="space-y-4">
              {tags.map((tag) => {
                const draft = getTagDraft(tag);

                return (
                  <article key={tag.id} className="rounded-[1.75rem] border border-black/10 bg-white p-5">
                    <div className="grid gap-4 md:grid-cols-2">
                      <Field label="Name">
                        <input
                          value={draft.name}
                          onChange={(event) =>
                            setEditingTags((current) => ({
                              ...current,
                              [tag.id]: { ...draft, name: event.target.value },
                            }))
                          }
                          className={textInputClassName()}
                        />
                      </Field>
                      <Field label="Slug">
                        <input
                          value={draft.slug}
                          onChange={(event) =>
                            setEditingTags((current) => ({
                              ...current,
                              [tag.id]: { ...draft, slug: event.target.value },
                            }))
                          }
                          className={textInputClassName()}
                        />
                      </Field>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-[1fr_180px]">
                      <Field label="Description">
                        <textarea
                          value={draft.description}
                          onChange={(event) =>
                            setEditingTags((current) => ({
                              ...current,
                              [tag.id]: {
                                ...draft,
                                description: event.target.value,
                              },
                            }))
                          }
                          rows={3}
                          className={textInputClassName()}
                        />
                      </Field>
                      <label className="mt-7 flex items-center gap-3 text-sm text-black/70">
                        <input
                          type="checkbox"
                          checked={draft.isActive}
                          onChange={(event) =>
                            setEditingTags((current) => ({
                              ...current,
                              [tag.id]: {
                                ...draft,
                                isActive: event.target.checked,
                              },
                            }))
                          }
                        />
                        Active
                      </label>
                    </div>
                    <div className="mt-4 flex gap-3">
                      <button
                        type="button"
                        onClick={() => void handleSaveTag(tag.id)}
                        disabled={hasPendingAction}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-black/10 px-4 py-2 text-sm font-semibold text-black transition hover:bg-black/[0.04] disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActionPending(`tag:${tag.id}:save`) ? (
                          <>
                            <span className={pendingSpinnerClassName()} />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteTag(tag.id)}
                        disabled={hasPendingAction}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-300 px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isActionPending(`tag:${tag.id}:delete`) ? (
                          <>
                            <span className={pendingSpinnerClassName()} />
                            Deleting...
                          </>
                        ) : (
                          "Delete"
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
