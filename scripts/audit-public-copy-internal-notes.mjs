import { PrismaClient } from "@prisma/client";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const prisma = new PrismaClient();

const patterns = [
  "For ShipBoost",
  "for ShipBoost",
  "ShipBoost should use",
  "For ShipBoost,",
  "As an anchor tool",
  "anchor tool",
  "support tool",
  "supporting tool",
  "cluster",
  "seeded listing",
  "comparison surface",
  "category pages",
  "alternatives pages",
  "best-of pages",
  "supports pages around",
  "ShipBoost should use",
];

const highConfidencePatterns = [
  "For ShipBoost",
  "for ShipBoost",
  "ShipBoost should use",
  "For ShipBoost,",
  "As an anchor tool",
  "core anchor tool",
  "anchor tool for",
  "supporting tool for",
  "support tool for",
  "seeded listing",
  "comparison surface",
  "best-of pages",
  "category pages",
  "alternatives pages",
  "supports pages around",
];

function excerpt(value, pattern) {
  const lowerValue = value.toLowerCase();
  const lowerPattern = pattern.toLowerCase();
  const index = lowerValue.indexOf(lowerPattern);
  if (index === -1) {
    return "";
  }

  const start = Math.max(0, index - 140);
  const end = Math.min(value.length, index + pattern.length + 260);
  return value.slice(start, end).replace(/\s+/g, " ").trim();
}

async function main() {
  const outputDir = process.argv[2];
  const tools = await prisma.tool.findMany({
    where: {
      OR: patterns.map((pattern) => ({
        richDescription: {
          contains: pattern,
          mode: "insensitive",
        },
      })),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      publicationStatus: true,
      moderationStatus: true,
      richDescription: true,
      internalNote: true,
      updatedAt: true,
    },
    orderBy: [{ publicationStatus: "asc" }, { name: "asc" }],
  });

  const matches = tools.map((tool) => {
    const matchedPatterns = patterns.filter((pattern) =>
      tool.richDescription.toLowerCase().includes(pattern.toLowerCase()),
    );
    const highConfidenceMatchedPatterns = highConfidencePatterns.filter((pattern) =>
      tool.richDescription.toLowerCase().includes(pattern.toLowerCase()),
    );
    return {
      id: tool.id,
      slug: tool.slug,
      name: tool.name,
      publicationStatus: tool.publicationStatus,
      moderationStatus: tool.moderationStatus,
      matchedPatterns,
      highConfidenceMatchedPatterns,
      isHighConfidenceInternalNote: highConfidenceMatchedPatterns.length > 0,
      excerpt: excerpt(tool.richDescription, matchedPatterns[0]),
      internalNote: tool.internalNote,
      updatedAt: tool.updatedAt.toISOString(),
    };
  });

  const publicMatches = matches.filter(
    (tool) => tool.publicationStatus === "PUBLISHED",
  );
  const highConfidencePublicMatches = publicMatches.filter(
    (tool) => tool.isHighConfidenceInternalNote,
  );

  const result = {
    totalMatches: matches.length,
    publishedMatches: publicMatches.length,
    highConfidencePublishedMatches: highConfidencePublicMatches.length,
    unpublishedMatches: matches.length - publicMatches.length,
    highConfidencePublishedSlugs: highConfidencePublicMatches.map((tool) => tool.slug),
    matches,
  };

  if (outputDir) {
    await mkdir(outputDir, { recursive: true });
    await writeFile(
      path.join(outputDir, "internal-copy-audit.json"),
      JSON.stringify(result, null, 2),
    );
    await writeFile(
      path.join(outputDir, "internal-copy-audit.csv"),
      [
        [
          "slug",
          "name",
          "publicationStatus",
          "moderationStatus",
          "isHighConfidenceInternalNote",
          "matchedPatterns",
          "highConfidenceMatchedPatterns",
          "excerpt",
          "updatedAt",
        ].join(","),
        ...matches.map((tool) =>
          [
            tool.slug,
            tool.name,
            tool.publicationStatus,
            tool.moderationStatus,
            String(tool.isHighConfidenceInternalNote),
            tool.matchedPatterns.join(";"),
            tool.highConfidenceMatchedPatterns.join(";"),
            tool.excerpt.replaceAll('"', '""'),
            tool.updatedAt,
          ]
            .map((value) => `"${String(value).replaceAll('"', '""')}"`)
            .join(","),
        ),
      ].join("\n"),
    );
  }

  console.log(
    JSON.stringify(
      result,
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
