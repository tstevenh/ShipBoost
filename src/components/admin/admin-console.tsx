"use client";

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from "react";

import {
  apiRequest,
  type ListingClaim,
  toErrorMessage,
  type Category,
  type CategoryDraft,
  type Submission,
  type Tag,
  type TagDraft,
  type Tool,
  type ToolCreateForm,
} from "@/components/admin/admin-console-shared";
import { CatalogPanel } from "@/components/admin/catalog-panel";
import { ListingClaimPanel } from "@/components/admin/listing-claim-panel";
import { SubmissionReviewPanel } from "@/components/admin/submission-review-panel";
import { ToolOpsPanel } from "@/components/admin/tool-ops-panel";

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

export function AdminConsole() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tools, setTools] = useState<Tool[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [claims, setClaims] = useState<ListingClaim[]>([]);

  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [toolError, setToolError] = useState<string | null>(null);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);

  const [toolSearch, setToolSearch] = useState("");
  const [submissionSearch, setSubmissionSearch] = useState("");
  const [claimSearch, setClaimSearch] = useState("");
  const deferredToolSearch = useDeferredValue(toolSearch);
  const deferredSubmissionSearch = useDeferredValue(submissionSearch);
  const deferredClaimSearch = useDeferredValue(claimSearch);

  const [categoryDraft, setCategoryDraft] = useState<CategoryDraft>(emptyCategoryDraft);
  const [tagDraft, setTagDraft] = useState<TagDraft>(emptyTagDraft);
  const [toolDraft, setToolDraft] = useState<ToolCreateForm>(emptyToolForm);

  const [editingCategories, setEditingCategories] = useState<Record<string, CategoryDraft>>({});
  const [editingTags, setEditingTags] = useState<Record<string, TagDraft>>({});
  const [toolNotes, setToolNotes] = useState<Record<string, string>>({});
  const [submissionNotes, setSubmissionNotes] = useState<
    Record<string, { founderVisibleNote: string; internalReviewNote: string }>
  >({});
  const [claimNotes, setClaimNotes] = useState<
    Record<string, { founderVisibleNote: string; internalAdminNote: string }>
  >({});
  const [submissionFilter, setSubmissionFilter] = useState<"" | Submission["reviewStatus"]>("PENDING");
  const [claimFilter, setClaimFilter] = useState<"" | ListingClaim["status"]>("PENDING");

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
  const pendingClaimCount = useMemo(
    () => claims.filter((claim) => claim.status === "PENDING").length,
    [claims],
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

  async function refreshClaims(
    search = deferredClaimSearch,
    status = claimFilter,
  ) {
    const params = new URLSearchParams();

    if (search.trim()) {
      params.set("search", search.trim());
    }

    if (status) {
      params.set("status", status);
    }

    const nextClaims = await apiRequest<ListingClaim[]>(
      `/api/admin/listing-claims${params.toString() ? `?${params.toString()}` : ""}`,
    );

    setClaims(nextClaims);
  }

  const syncToolsSearch = useEffectEvent(async (search: string) => {
    await refreshTools(search);
  });

  const syncSubmissionsSearch = useEffectEvent(
    async (search: string, status: "" | Submission["reviewStatus"]) => {
      await refreshSubmissions(search, status);
    },
  );
  const syncClaimsSearch = useEffectEvent(
    async (search: string, status: "" | ListingClaim["status"]) => {
      await refreshClaims(search, status);
    },
  );

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [nextCategories, nextTags, nextTools, nextSubmissions, nextClaims] =
          await Promise.all([
            apiRequest<Category[]>("/api/admin/categories"),
            apiRequest<Tag[]>("/api/admin/tags"),
            apiRequest<Tool[]>("/api/admin/tools"),
            apiRequest<Submission[]>("/api/admin/submissions?reviewStatus=PENDING"),
            apiRequest<ListingClaim[]>("/api/admin/listing-claims?status=PENDING"),
          ]);

        if (cancelled) {
          return;
        }

        setCategories(nextCategories);
        setTags(nextTags);
        setTools(nextTools);
        setSubmissions(nextSubmissions);
        setClaims(nextClaims);
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

  useEffect(() => {
    void syncClaimsSearch(deferredClaimSearch, claimFilter);
  }, [claimFilter, deferredClaimSearch]);

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

  async function handleClaimReview(
    claimId: string,
    action: "APPROVE" | "REJECT",
  ) {
    if (hasPendingAction) {
      return;
    }

    setClaimError(null);
    setPendingAction(`claim:${claimId}:${action}`);

    try {
      const draft =
        claimNotes[claimId] ?? {
          founderVisibleNote: "",
          internalAdminNote: "",
        };

      await apiRequest<ListingClaim>(`/api/admin/listing-claims/${claimId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          founderVisibleNote: draft.founderVisibleNote || undefined,
          internalAdminNote: draft.internalAdminNote || undefined,
        }),
      });

      await Promise.all([refreshClaims(), refreshTools()]);
    } catch (error) {
      setClaimError(toErrorMessage(error));
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
      <div className="grid gap-4 md:grid-cols-5">
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
        <div className="rounded-[1.75rem] border border-black/10 bg-[#eef6ff] p-5">
          <p className="text-sm text-black/55">Pending claims</p>
          <p className="mt-2 text-3xl font-semibold text-black">{pendingClaimCount}</p>
        </div>
      </div>

      <ListingClaimPanel
        claims={claims}
        claimSearch={claimSearch}
        onClaimSearchChange={setClaimSearch}
        claimFilter={claimFilter}
        onClaimFilterChange={setClaimFilter}
        claimError={claimError}
        claimNotes={claimNotes}
        setClaimNotes={setClaimNotes}
        handleClaimReview={handleClaimReview}
        hasPendingAction={hasPendingAction}
        isActionPending={isActionPending}
      />

      <SubmissionReviewPanel
        submissionSearch={submissionSearch}
        onSubmissionSearchChange={setSubmissionSearch}
        submissionFilter={submissionFilter}
        onSubmissionFilterChange={setSubmissionFilter}
        submissionError={submissionError}
        submissions={submissions}
        submissionNotes={submissionNotes}
        setSubmissionNotes={setSubmissionNotes}
        handleSubmissionReview={handleSubmissionReview}
        hasPendingAction={hasPendingAction}
        isActionPending={isActionPending}
      />

      <ToolOpsPanel
        categories={categories}
        tags={tags}
        tools={tools}
        toolDraft={toolDraft}
        setToolDraft={setToolDraft}
        toolSearch={toolSearch}
        onToolSearchChange={setToolSearch}
        toolError={toolError}
        toolNotes={toolNotes}
        setToolNotes={setToolNotes}
        handleCategorySelection={handleCategorySelection}
        handleTagSelection={handleTagSelection}
        handleCreateTool={handleCreateTool}
        handleToolStatusUpdate={handleToolStatusUpdate}
        getToolNote={getToolNote}
        hasPendingAction={hasPendingAction}
        isActionPending={isActionPending}
        isActionGroupPending={isActionGroupPending}
      />

      <CatalogPanel
        categories={categories}
        tags={tags}
        categoryDraft={categoryDraft}
        setCategoryDraft={setCategoryDraft}
        tagDraft={tagDraft}
        setTagDraft={setTagDraft}
        setEditingCategories={setEditingCategories}
        setEditingTags={setEditingTags}
        catalogError={catalogError}
        handleCreateCategory={handleCreateCategory}
        handleCreateTag={handleCreateTag}
        handleSaveCategory={handleSaveCategory}
        handleDeleteCategory={handleDeleteCategory}
        handleSaveTag={handleSaveTag}
        handleDeleteTag={handleDeleteTag}
        getCategoryDraft={getCategoryDraft}
        getTagDraft={getTagDraft}
        hasPendingAction={hasPendingAction}
        isActionPending={isActionPending}
      />
    </div>
  );
}
