import type { Dispatch, FormEvent, SetStateAction } from "react";

import {
  Field,
  SectionCard,
  StatusChip,
  pendingSpinnerClassName,
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
  isActionGroupPending,
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
  isActionGroupPending: (prefix: string) => boolean;
}) {
  return (
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
                  <label
                    key={category.id}
                    className="flex items-center gap-3 text-sm text-black/70"
                  >
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
                  <label
                    key={tag.id}
                    className="flex items-center gap-3 text-sm text-black/70"
                  >
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
            onChange={(event) => onToolSearchChange(event.target.value)}
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
                        void handleToolStatusUpdate(tool.id, `tool:${tool.id}:moderation`, {
                          moderationStatus:
                            event.target.value as Tool["moderationStatus"],
                        })
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
                        void handleToolStatusUpdate(tool.id, `tool:${tool.id}:publication`, {
                          publicationStatus:
                            event.target.value as Tool["publicationStatus"],
                        })
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
                    {tool.toolCategories.map((item) => item.category.name).join(", ") ||
                      "None"}
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
                      value={toolNotes[tool.id] ?? getToolNote(tool)}
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
  );
}
