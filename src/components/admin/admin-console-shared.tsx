import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type Category = {
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

export type Tag = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export type Tool = {
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

export type Submission = {
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
  spotlightBrief: {
    status: "NOT_STARTED" | "IN_PROGRESS" | "READY" | "PUBLISHED";
    updatedAt: string;
    publishedAt: string | null;
    publishedArticle: {
      slug: string;
      title: string;
    } | null;
  } | null;
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

export type ListingClaim = {
  id: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELED";
  claimEmail: string;
  claimDomain: string;
  websiteDomain: string;
  founderVisibleNote: string | null;
  internalAdminNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  claimantUser: {
    id: string;
    name: string | null;
    email: string;
  };
  tool: {
    id: string;
    slug: string;
    name: string;
    logoMedia: { url: string } | null;
  };
};

export type SubmissionReviewResult = {
  submission: Submission;
  tool: {
    id: string;
    moderationStatus: Tool["moderationStatus"];
    publicationStatus: Tool["publicationStatus"];
  };
};

export type ToolCreateForm = {
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

export type CategoryDraft = {
  name: string;
  slug: string;
  description: string;
  seoIntro: string;
  sortOrder: string;
  isActive: boolean;
};

export type TagDraft = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
};

export type BlogAuthor = {
  id: string;
  slug: string;
  name: string;
  role: string | null;
  bio: string;
  imageUrl: string | null;
  xUrl: string | null;
  linkedinUrl: string | null;
  websiteUrl: string | null;
  isActive: boolean;
};

export type BlogCategory = {
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

export type BlogTag = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  isActive: boolean;
};

export type BlogArticle = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  markdownContent: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  publishedAt: string | null;
  updatedAt: string;
  lastUpdatedAt: string | null;
  coverImageUrl: string | null;
  coverImagePublicId: string | null;
  coverImageAlt: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  canonicalUrl: string | null;
  ogImageUrl: string | null;
  author: BlogAuthor;
  primaryCategory: BlogCategory;
  articleTags: Array<{
    tagId: string;
    tag: BlogTag;
  }>;
};

export type BlogMediaUpload = {
  url: string;
  publicId: string;
  format?: string;
  width?: number;
  height?: number;
  markdown: string;
};

export function SectionCard({
  title,
  eyebrow,
  description,
  children,
}: {
  title: string;
  eyebrow: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card p-6 sm:p-8 shadow-xl shadow-black/5">
      <div className="max-w-3xl">
        <p className="text-[10px] font-black tracking-[0.3em] text-foreground/40  mb-2">
          {eyebrow}
        </p>
        <h2 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl ">
          {title}
        </h2>
        <p className="mt-2 text-sm font-medium leading-relaxed text-muted-foreground/80">
          {description}
        </p>
      </div>
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-black  tracking-widest text-muted-foreground ml-1">
        {label}
      </label>
      {hint && (
        <p className="text-[10px] font-bold text-muted-foreground/60  tracking-widest ml-1">
          {hint}
        </p>
      )}
      {children}
    </div>
  );
}

export function StatusChip({
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
            : "bg-muted/30 text-muted-foreground border-border";

  return (
    <span
      className={cn(
        "inline-flex rounded-full border px-3 py-1 text-[10px] font-black tracking-widest ",
        className
      )}
    >
      {label}
    </span>
  );
}

export function textInputClassName() {
  return "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm font-medium outline-none transition focus:border-foreground focus:ring-4 focus:ring-foreground/5 disabled:opacity-50";
}

export function pendingSpinnerClassName() {
  return "inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/25 border-t-current";
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function getSubmissionLifecycle(submission: Submission) {
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

export function getPaymentStatusLabel(submission: Submission) {
  if (
    submission.submissionType === "FEATURED_LAUNCH" &&
    submission.paymentStatus === "PENDING"
  ) {
    return "Awaiting payment";
  }

  return submission.paymentStatus;
}

export function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong.";
}

export async function apiRequest<T>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> {
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

export async function apiUpload<T>(
  input: RequestInfo,
  formData: FormData,
  init?: Omit<RequestInit, "body" | "headers">,
): Promise<T> {
  const response = await fetch(input, {
    method: "POST",
    ...init,
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as
    | { data?: T; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? "Upload failed.");
  }

  return payload?.data as T;
}
