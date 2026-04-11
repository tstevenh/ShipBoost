import { Prisma } from "@prisma/client";

const publicToolCategoriesArgs = {
  orderBy: {
    sortOrder: "asc" as const,
  },
  select: {
    category: {
      select: {
        id: true,
        name: true,
        slug: true,
      },
    },
  },
} as const;

const publicToolTagsArgs = {
  orderBy: {
    sortOrder: "asc" as const,
  },
  select: {
    tag: {
      select: {
        id: true,
        name: true,
        slug: true,
        isActive: true,
      },
    },
  },
} as const;

const publicToolVoteCountArgs = {
  select: {
    toolVotes: true,
  },
} as const;

export const publicToolCardSelect = Prisma.validator<Prisma.ToolSelect>()({
  id: true,
  slug: true,
  name: true,
  tagline: true,
  createdAt: true,
  pricingModel: true,
  affiliateUrl: true,
  isFeatured: true,
  logoMedia: {
    select: {
      url: true,
    },
  },
  toolCategories: publicToolCategoriesArgs,
  toolTags: publicToolTagsArgs,
  _count: publicToolVoteCountArgs,
});

export const publicToolDetailSelect = Prisma.validator<Prisma.ToolSelect>()({
  id: true,
  slug: true,
  name: true,
  tagline: true,
  richDescription: true,
  pricingModel: true,
  metaTitle: true,
  metaDescription: true,
  canonicalUrl: true,
  createdAt: true,
  logoMedia: {
    select: {
      url: true,
    },
  },
  media: {
    where: {
      type: "SCREENSHOT",
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      url: true,
    },
  },
  toolCategories: publicToolCategoriesArgs,
  toolTags: publicToolTagsArgs,
  _count: publicToolVoteCountArgs,
});

export const publicRelatedToolSelect = Prisma.validator<Prisma.ToolSelect>()({
  id: true,
  slug: true,
  name: true,
  tagline: true,
  logoMedia: {
    select: {
      url: true,
    },
  },
});

const publicLaunchToolSelect = {
  id: true,
  slug: true,
  name: true,
  tagline: true,
  logoMedia: {
    select: {
      url: true,
    },
  },
  toolCategories: publicToolCategoriesArgs,
  _count: publicToolVoteCountArgs,
} as const;

export const publicLaunchCardSelect = Prisma.validator<Prisma.LaunchSelect>()({
  id: true,
  toolId: true,
  launchType: true,
  status: true,
  launchDate: true,
  priorityWeight: true,
  tool: {
    select: publicLaunchToolSelect,
  },
});
