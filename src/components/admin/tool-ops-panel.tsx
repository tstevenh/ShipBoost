import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Plus, Search, ExternalLink, RefreshCw, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import {
  Field,
  SectionCard,
  StatusChip,
  textInputClassName,
  type Category,
  type Tag,
  type Tool,
  type ToolCreateForm,
} from "@/components/admin/admin-console-shared";

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

export function ToolOpsPanel({
  categories,
  tags,
  tools,
  toolDraft,
  setToolDraft,
  toolSearch,
  onToolSearchChange,
  toolError,
  toolNotes,
  setToolNotes,
  handleCategorySelection,
  handleTagSelection,
  handleCreateTool,
  handleToolStatusUpdate,
  getToolNote,
  hasPendingAction,
  isActionPending,
}: {
  categories: Category[];
  tags: Tag[];
  tools: Tool[];
  toolDraft: ToolCreateForm;
  setToolDraft: Dispatch<SetStateAction<ToolCreateForm>>;
  toolSearch: string;
  onToolSearchChange: (value: string) => void;
  toolError: string | null;
  toolNotes: Record<string, string>;
  setToolNotes: Dispatch<SetStateAction<Record<string, string>>>;
  handleCategorySelection: (categoryId: string) => void;
  handleTagSelection: (tagId: string) => void;
  handleCreateTool: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  handleToolStatusUpdate: (
    toolId: string,
    actionKey: string,
    payload: Partial<{
      moderationStatus: Tool["moderationStatus"];
      publicationStatus: Tool["publicationStatus"];
      isFeatured: boolean;
      internalNote: string;
    }>,
  ) => void | Promise<void>;
  getToolNote: (tool: Tool) => string;
  hasPendingAction: boolean;
  isActionPending: (actionKey: string) => boolean;
}) {
  const checkboxFields: Array<{
    id: "hasAffiliateProgram" | "publish" | "isFeatured";
    label: string;
  }> = [
    { id: "hasAffiliateProgram", label: "Affiliate" },
    { id: "publish", label: "Publish" },
    { id: "isFeatured", label: "Premium" },
  ];

  return (
    <SectionCard
      eyebrow="Inventory"
      title="Directory Tuning"
      description="Manage listings and premium placement."
    >
      <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <form onSubmit={handleCreateTool} className="space-y-6 bg-muted/20 p-6 rounded-2xl border border-border">
          <div className="space-y-1">
            <h3 className="text-xs font-black  tracking-widest text-foreground">Create New Listing</h3>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <input
                value={toolDraft.name}
                onChange={(event) =>
                  setToolDraft((current) => ({ ...current, name: event.target.value }))
                }
                className={textInputClassName()}
                required
                placeholder="Product Name"
              />
            </Field>
            <Field label="Slug (optional)">
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
              maxLength={60}
              required
              placeholder="Short catchy description"
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
                placeholder="https://..."
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
                placeholder="https://..."
              />
            </Field>
          </div>

          <Field label="Rich Description">
            <textarea
              value={toolDraft.richDescription}
              onChange={(event) =>
                setToolDraft((current) => ({
                  ...current,
                  richDescription: event.target.value,
                }))
              }
              rows={4}
              className={cn(textInputClassName(), "text-xs")}
              required
              placeholder="Detailed product overview..."
            />
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Pricing">
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
            <Field label="Screenshots" hint="One per line">
              <textarea
                value={toolDraft.screenshotUrls}
                onChange={(event) =>
                  setToolDraft((current) => ({
                    ...current,
                    screenshotUrls: event.target.value,
                  }))
                }
                rows={2}
                className={cn(textInputClassName(), "text-xs")}
                placeholder="https://..."
              />
            </Field>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-3 space-y-3">
              <p className="text-[10px] font-black  tracking-widest text-foreground">Categories</p>
              <div className="grid gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {categories.map((category) => (
                  <label key={category.id} className="flex items-center gap-2 text-[10px] font-bold text-foreground/70 cursor-pointer hover:text-primary">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary/20"
                      checked={toolDraft.categoryIds.includes(category.id)}
                      onChange={() => handleCategorySelection(category.id)}
                    />
                    {category.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-3 space-y-3">
              <p className="text-[10px] font-black  tracking-widest text-foreground">Tags</p>
              <div className="grid gap-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                {tags.map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 text-[10px] font-bold text-foreground/70 cursor-pointer hover:text-primary">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary/20"
                      checked={toolDraft.tagIds.includes(tag.id)}
                      onChange={() => handleTagSelection(tag.id)}
                    />
                    {tag.name}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {checkboxFields.map((cb) => (
              <label key={cb.id} className="flex items-center gap-2 text-[10px] font-black  tracking-widest text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  className="rounded border-border text-primary focus:ring-primary/20"
                  checked={toolDraft[cb.id]}
                  onChange={(event) =>
                    setToolDraft((current) => ({
                      ...current,
                      [cb.id]: event.target.checked,
                    }))
                  }
                />
                {cb.label}
              </label>
            ))}
          </div>

          {toolError && (
            <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-xs font-bold text-destructive  tracking-widest">
              {toolError}
            </div>
          )}

          <button
            type="submit"
            disabled={hasPendingAction}
            className="inline-flex items-center justify-center gap-2 w-full rounded-xl bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground shadow-xl shadow-black/10 transition hover:opacity-90 disabled:opacity-50"
          >
            {isActionPending("tool:create") ? (
              <RefreshCw className="animate-spin" size={14} />
            ) : (
              <Plus size={14} />
            )}
            Create Listing
          </button>
        </form>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              value={toolSearch}
              onChange={(event) => onToolSearchChange(event.target.value)}
              placeholder="Search directory..."
              className={cn(textInputClassName(), "pl-10 py-2 text-xs")}
            />
          </div>

          <div className="grid gap-3 max-h-[1000px] overflow-y-auto pr-2 custom-scrollbar">
            {tools.map((tool) => (
              <article
                key={tool.id}
                className="rounded-2xl border border-border bg-muted/20 p-4 hover:border-primary/20 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-black text-foreground">{tool.name}</h3>
                      {tool.isFeatured && (
                        <StatusChip label="Premium" tone="amber" />
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-muted-foreground line-clamp-1">{tool.tagline}</p>
                  </div>
                  <a
                    href={tool.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-primary transition-colors shadow-sm"
                  >
                    <ExternalLink size={14} />
                  </a>
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Field label="Mod">
                    <select
                      value={tool.moderationStatus}
                      onChange={(event) =>
                        void handleToolStatusUpdate(tool.id, `tool:${tool.id}:moderation`, {
                          moderationStatus:
                            event.target.value as Tool["moderationStatus"],
                        })
                      }
                      disabled={hasPendingAction}
                      className={cn(textInputClassName(), "text-[10px] py-1")}
                    >
                      {moderationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Pub">
                    <select
                      value={tool.publicationStatus}
                      onChange={(event) =>
                        void handleToolStatusUpdate(tool.id, `tool:${tool.id}:publication`, {
                          publicationStatus:
                            event.target.value as Tool["publicationStatus"],
                        })
                      }
                      disabled={hasPendingAction}
                      className={cn(textInputClassName(), "text-[10px] py-1")}
                    >
                      {publicationStatuses.map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border">
                  <label className="flex items-center gap-2 text-[10px] font-black  tracking-widest text-foreground cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-border text-primary focus:ring-primary/20"
                      checked={tool.isFeatured}
                      onChange={(event) =>
                        void handleToolStatusUpdate(tool.id, `tool:${tool.id}:featured`, {
                          isFeatured: event.target.checked,
                        })
                      }
                      disabled={hasPendingAction}
                    />
                    Premium
                  </label>
                  <div className="text-[10px] font-black  tracking-widest text-muted-foreground/40">
                    {tool.toolCategories.length}C • {tool.toolTags.length}T
                  </div>
                </div>

                <div className="mt-4 space-y-2">
                  <textarea
                    value={toolNotes[tool.id] ?? getToolNote(tool)}
                    onChange={(event) =>
                      setToolNotes((current) => ({
                        ...current,
                        [tool.id]: event.target.value,
                      }))
                    }
                    rows={1}
                    className={cn(textInputClassName(), "text-[10px] py-1.5")}
                    placeholder="Admin note..."
                  />
                  <button
                    type="button"
                    onClick={() =>
                      void handleToolStatusUpdate(tool.id, `tool:${tool.id}:note`, {
                        internalNote: getToolNote(tool),
                      })
                    }
                    disabled={hasPendingAction}
                    className="inline-flex items-center justify-center gap-2 w-full rounded-lg border border-border bg-card px-3 py-1.5 text-[10px] font-black  tracking-widest text-foreground hover:bg-muted transition-all disabled:opacity-50 shadow-sm"
                  >
                    {isActionPending(`tool:${tool.id}:note`) ? (
                      <RefreshCw className="animate-spin" size={10} />
                    ) : (
                      <Check size={10} />
                    )}
                    Save Note
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
