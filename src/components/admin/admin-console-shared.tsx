import type { ReactNode } from "react";

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
  reviewedBy: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  tool: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    websiteUrl: string;
    ownerUserId: string | null;
    logoMedia: { url: string } | null;
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

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-black/72">{label}</span>
      {children}
    </label>
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
            : "bg-black/[0.04] text-black/70 border-black/10";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold tracking-[0.16em] uppercase ${className}`}
    >
      {label}
    </span>
  );
}

export function textInputClassName() {
  return "w-full rounded-2xl border border-black/10 bg-[#fffdf8] px-4 py-3 text-sm outline-none transition focus:border-[#9f4f1d] focus:ring-4 focus:ring-[#9f4f1d]/10";
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
