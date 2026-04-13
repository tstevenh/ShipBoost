"use client";

import { useDeferredValue, useEffect, useEffectEvent, useMemo, useState } from "react";
import { 
  Activity, Layers, Rocket, ClipboardList,
  Shield, AlertCircle, RefreshCw,
  Layout, Package,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

import {
  apiRequest,
  type ListingClaim,
  toErrorMessage,
  type Category,
  type CategoryDraft,
  type Submission,
  type SubmissionReviewResult,
  type Tag as TagType,
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

type AdminNavSection = "overview" | "moderate" | "inventory" | "taxonomy";
type AdminNavItem = {
  id: AdminNavSection;
  label: string;
  icon: LucideIcon;
  count?: number;
};

export function AdminConsole() {
  const [activeNav, setActiveNav] = useState<AdminNavSection>("overview");
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
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

  function matchesSubmissionFilters(
    submission: Submission,
    search: string,
    status: "" | Submission["reviewStatus"],
  ) {
    const normalizedSearch = search.trim().toLowerCase();

    if (status && submission.reviewStatus !== status) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      submission.user.email,
      submission.user.name ?? "",
      submission.tool.name,
      submission.tool.slug,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  }

  function matchesClaimFilters(
    claim: ListingClaim,
    search: string,
    status: "" | ListingClaim["status"],
  ) {
    const normalizedSearch = search.trim().toLowerCase();

    if (status && claim.status !== status) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    return [
      claim.claimEmail,
      claim.tool.name,
      claim.tool.slug,
    ].some((value) => value.toLowerCase().includes(normalizedSearch));
  }

  async function refreshCatalog() {
    const [nextCategories, nextTags] = await Promise.all([
      apiRequest<Category[]>("/api/admin/categories"),
      apiRequest<TagType[]>("/api/admin/tags"),
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
            apiRequest<TagType[]>("/api/admin/tags"),
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

  function getTagDraft(tag: TagType) {
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
      await apiRequest<TagType>("/api/admin/tags", {
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

      await apiRequest<TagType>(`/api/admin/tags/${tagId}`, {
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

      const result = await apiRequest<SubmissionReviewResult>(
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
      setSubmissions((current) =>
        current
          .map((submission) =>
            submission.id === result.submission.id
              ? result.submission
              : submission,
          )
          .filter((submission) =>
            matchesSubmissionFilters(
              submission,
              deferredSubmissionSearch,
              submissionFilter,
            ),
          ),
      );
      setTools((current) =>
        current.map((tool) =>
          tool.id === result.tool.id
            ? {
                ...tool,
                moderationStatus: result.tool.moderationStatus,
                publicationStatus: result.tool.publicationStatus,
              }
            : tool,
        ),
      );
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

      const claim = await apiRequest<ListingClaim>(`/api/admin/listing-claims/${claimId}`, {
        method: "PATCH",
        body: JSON.stringify({
          action,
          founderVisibleNote: draft.founderVisibleNote || undefined,
          internalAdminNote: draft.internalAdminNote || undefined,
        }),
      });
      setClaims((current) =>
        current
          .map((item) => (item.id === claim.id ? claim : item))
          .filter((item) =>
            matchesClaimFilters(item, deferredClaimSearch, claimFilter),
          ),
      );
    } catch (error) {
      setClaimError(toErrorMessage(error));
    } finally {
      setPendingAction(null);
    }
  }

  if (bootError) {
    return (
      <div className="rounded-[2rem] border border-destructive/20 bg-destructive/10 p-8 text-destructive  tracking-widest text-xs font-bold">
        <div className="flex items-center gap-3">
          <AlertCircle size={20} />
          {bootError}
        </div>
      </div>
    );
  }

  const navItems: AdminNavItem[] = [
    { id: "overview", label: "Dashboard", icon: Layout },
    { id: "moderate", label: "Moderate", icon: Shield, count: totalPending + pendingClaimCount },
    { id: "inventory", label: "Inventory", icon: Package, count: tools.length },
    { id: "taxonomy", label: "Taxonomy", icon: Layers, count: categories.length + tags.length },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Admin Sidebar */}
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

        <div className="rounded-3xl border border-border bg-card p-5 shadow-sm hidden lg:block">
          <h4 className="text-[10px] font-black  tracking-widest text-muted-foreground/60 mb-4">Internal Stats</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black  tracking-widest text-muted-foreground/60">Live tools</span>
              <span className="text-xs font-black text-foreground">{publishedCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black  tracking-widest text-muted-foreground/60">Categories</span>
              <span className="text-xs font-black text-foreground">{categories.length}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black  tracking-widest text-muted-foreground/60">Tags</span>
              <span className="text-xs font-black text-foreground">{tags.length}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Admin Content Area */}
      <div className="flex-1 w-full space-y-10">
        {activeNav === "overview" && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Reviews", val: totalPending, icon: Activity },
                { label: "Published", val: publishedCount, icon: Rocket },
                { label: "Claims", val: pendingClaimCount, icon: ClipboardList },
                { label: "Actions", val: submissions.length + claims.length, icon: RefreshCw }
              ].map((s, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex items-center gap-3 text-muted-foreground mb-2">
                    <s.icon size={14} />
                    <p className="text-[10px] font-black  tracking-widest">{s.label}</p>
                  </div>
                  <p className="text-xl font-black text-foreground">{s.val}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl border border-border bg-primary p-8 sm:p-10 text-primary-foreground shadow-2xl shadow-black/20">
              <div className="max-w-2xl">
                <p className="text-[10px] font-black tracking-[0.3em]  opacity-60 mb-3">Admin Console</p>
                <h1 className="text-3xl font-black tracking-tight sm:text-4xl">Moderation Hub</h1>
                <p className="mt-4 text-base font-medium opacity-80 leading-relaxed">
                  Manage the ShipBoost directory, review founder submissions, and maintain the catalog taxonomy from one unified surface.
                </p>
              </div>
            </div>
          </div>
        )}

        {activeNav === "moderate" && (
          <div className="space-y-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
          </div>
        )}

        {activeNav === "inventory" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
            />
          </div>
        )}

        {activeNav === "taxonomy" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
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
        )}
      </div>
    </div>
  );
}
