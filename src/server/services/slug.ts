import { prisma } from "@/server/db/client";

type ToolLookupClient = {
  tool: {
    findUnique: typeof prisma.tool.findUnique;
  };
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function createUniqueToolSlug(
  baseValue: string,
  db: ToolLookupClient = prisma,
) {
  const baseSlug = slugify(baseValue);
  let slug = baseSlug || "tool";
  let suffix = 1;

  // Small loop is fine here because admin/submission writes are low throughput.
  while (await db.tool.findUnique({ where: { slug } })) {
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }

  return slug;
}
