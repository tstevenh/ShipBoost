export const toolDetailsInclude = {
  owner: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
  logoMedia: true,
  media: {
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  toolCategories: {
    include: {
      category: true,
    },
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  toolTags: {
    include: {
      tag: true,
    },
    orderBy: {
      sortOrder: "asc" as const,
    },
  },
  submissions: {
    orderBy: {
      createdAt: "desc" as const,
    },
  },
  launches: {
    orderBy: {
      launchDate: "desc" as const,
    },
  },
};

