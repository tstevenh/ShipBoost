import type { getAdminSubmissionDetail } from "@/server/services/submission-service";

import {
  StatusChip,
  formatDate,
  getSubmissionBadgeLabel,
  getSubmissionLifecycle,
  type Submission,
} from "@/components/admin/admin-console-shared";

type AdminSubmissionDetail = Awaited<ReturnType<typeof getAdminSubmissionDetail>>;

function buildSubmissionSummary(submission: AdminSubmissionDetail): Submission {
  return {
    id: submission.id,
    submissionType: submission.submissionType,
    reviewStatus: submission.reviewStatus,
    preferredLaunchDate: submission.preferredLaunchDate?.toISOString() ?? null,
    paymentStatus: submission.paymentStatus,
    badgeFooterUrl: submission.badgeFooterUrl,
    badgeVerification: submission.badgeVerification,
    founderVisibleNote: submission.founderVisibleNote,
    internalReviewNote: submission.internalReviewNote,
    createdAt: submission.createdAt.toISOString(),
    updatedAt: submission.updatedAt.toISOString(),
    spotlightBrief: submission.spotlightBrief
      ? {
          status: submission.spotlightBrief.status,
          updatedAt: submission.spotlightBrief.updatedAt.toISOString(),
          publishedAt: submission.spotlightBrief.publishedAt?.toISOString() ?? null,
          publishedArticle: submission.spotlightBrief.publishedArticle,
        }
      : null,
    user: {
      id: submission.user.id,
      name: submission.user.name,
      email: submission.user.email,
    },
    tool: {
      id: submission.tool.id,
      slug: submission.tool.slug,
      name: submission.tool.name,
      tagline: submission.tool.tagline,
      websiteUrl: submission.tool.websiteUrl,
      logoMedia: submission.tool.logoMedia
        ? {
            url: submission.tool.logoMedia.url,
          }
        : null,
      launches: submission.tool.launches.map((launch) => ({
        id: launch.id,
        launchType: launch.launchType,
        status: launch.status,
        launchDate: launch.launchDate.toISOString(),
      })),
    },
  };
}

export function SubmissionDetailView({
  submission,
}: {
  submission: AdminSubmissionDetail;
}) {
  const summary = buildSubmissionSummary(submission);
  const lifecycle = getSubmissionLifecycle(summary);
  const latestLaunch = submission.tool.launches[0] ?? null;
  const screenshots = submission.tool.media.filter(
    (media) => media.type === "SCREENSHOT",
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <div className="flex flex-wrap gap-2">
          <StatusChip label={lifecycle.label} tone={lifecycle.tone} />
          <StatusChip label={summary.submissionType} tone="neutral" />
          <StatusChip
            label={`Pay: ${summary.paymentStatus}`}
            tone="neutral"
          />
          <StatusChip label={getSubmissionBadgeLabel(summary)} tone="neutral" />
        </div>

        <div className="mt-6 flex items-start gap-4">
          <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-border bg-muted">
            {submission.tool.logoMedia ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={submission.tool.logoMedia.url}
                alt={`${submission.tool.name} logo`}
                className="h-full w-full object-cover"
              />
            ) : null}
          </div>
          <div className="min-w-0">
            <h2 className="text-3xl font-black tracking-tight">
              {submission.tool.name}
            </h2>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {submission.tool.tagline}
            </p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <div>
            <dt className="text-[10px] font-black tracking-widest text-muted-foreground">
              Founder
            </dt>
            <dd className="mt-1 text-sm font-medium">{submission.user.email}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black tracking-widest text-muted-foreground">
              Slug
            </dt>
            <dd className="mt-1 text-sm font-medium">{submission.tool.slug}</dd>
          </div>
          <div>
            <dt className="text-[10px] font-black tracking-widest text-muted-foreground">
              Website
            </dt>
            <dd className="mt-1 break-all text-sm font-medium">
              {submission.tool.websiteUrl}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-black tracking-widest text-muted-foreground">
              Created
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDate(summary.createdAt)}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] font-black tracking-widest text-muted-foreground">
              Last updated
            </dt>
            <dd className="mt-1 text-sm font-medium">
              {formatDate(summary.updatedAt)}
            </dd>
          </div>
          {latestLaunch ? (
            <div>
              <dt className="text-[10px] font-black tracking-widest text-muted-foreground">
                Launch date
              </dt>
              <dd className="mt-1 text-sm font-medium">
                {formatDate(latestLaunch.launchDate.toISOString())}
              </dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="rounded-3xl border border-border bg-card p-8 shadow-xl shadow-black/5">
        <h3 className="text-xl font-black">Saved submission data</h3>
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                Pricing model
              </p>
              <p className="mt-1 text-sm font-medium">
                {submission.tool.pricingModel}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                Description
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                {submission.tool.richDescription}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                Categories
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {submission.tool.toolCategories.map((item) => (
                  <span
                    key={item.categoryId}
                    className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] font-black tracking-widest"
                  >
                    {item.category.name}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                Tags
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {submission.tool.toolTags.map((item) => (
                  <span
                    key={item.tagId}
                    className="rounded-full border border-border bg-muted/30 px-3 py-1 text-[10px] font-black tracking-widest"
                  >
                    {item.tag.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                Social links
              </p>
              <div className="mt-2 space-y-2 text-sm font-medium">
                {submission.tool.founderXUrl ? <p>{submission.tool.founderXUrl}</p> : null}
                {submission.tool.founderGithubUrl ? <p>{submission.tool.founderGithubUrl}</p> : null}
                {submission.tool.founderLinkedinUrl ? <p>{submission.tool.founderLinkedinUrl}</p> : null}
                {submission.tool.founderFacebookUrl ? <p>{submission.tool.founderFacebookUrl}</p> : null}
                {!submission.tool.founderXUrl &&
                !submission.tool.founderGithubUrl &&
                !submission.tool.founderLinkedinUrl &&
                !submission.tool.founderFacebookUrl ? (
                  <p className="text-muted-foreground">No social links saved.</p>
                ) : null}
              </div>
            </div>
            {submission.preferredLaunchDate ? (
              <div>
                <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                  Preferred launch date
                </p>
                <p className="mt-1 text-sm font-medium">
                  {formatDate(submission.preferredLaunchDate.toISOString())}
                </p>
              </div>
            ) : null}
            {submission.founderVisibleNote ? (
              <div>
                <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                  Founder note
                </p>
                <p className="mt-1 text-sm font-medium">
                  {submission.founderVisibleNote}
                </p>
              </div>
            ) : null}
            {submission.internalReviewNote ? (
              <div>
                <p className="text-[10px] font-black tracking-widest text-muted-foreground">
                  Internal review note
                </p>
                <p className="mt-1 text-sm font-medium">
                  {submission.internalReviewNote}
                </p>
              </div>
            ) : null}
          </div>
        </div>

        {screenshots.length > 0 ? (
          <div className="mt-8">
            <p className="text-[10px] font-black tracking-widest text-muted-foreground">
              Screenshots
            </p>
            <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {screenshots.map((media) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={media.id}
                  src={media.url}
                  alt={`${submission.tool.name} screenshot`}
                  className="h-44 w-full rounded-2xl border border-border object-cover"
                />
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
