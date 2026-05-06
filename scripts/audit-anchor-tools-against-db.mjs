import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const [, , inputPath, outputPath, uploadCandidatesPath] = process.argv;

if (!inputPath || !outputPath) {
  console.error(
    "Usage: node scripts/audit-anchor-tools-against-db.mjs <anchor-tools.csv> <output-audit.csv> [upload-candidates.csv]",
  );
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];

  for (const line of text.trim().split(/\r?\n/)) {
    const row = [];
    let current = "";
    let quoted = false;

    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];

      if (char === "\"") {
        if (quoted && line[index + 1] === "\"") {
          current += "\"";
          index += 1;
        } else {
          quoted = !quoted;
        }
      } else if (char === "," && !quoted) {
        row.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    row.push(current);
    rows.push(row);
  }

  return rows;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, "\"\"")}"` : text;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function host(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, "").toLowerCase();
    const pathname = parsed.pathname.replace(/\/$/, "");
    return `${parsed.protocol}//${hostname}${pathname}`.toLowerCase();
  } catch {
    return "";
  }
}

const prisma = new PrismaClient();

try {
  const rows = parseCsv(fs.readFileSync(inputPath, "utf8"));
  const header = rows[0];
  const records = rows
    .slice(1)
    .map((row) =>
      Object.fromEntries(header.map((column, index) => [column, row[index] ?? ""])),
    );

  const tools = await prisma.tool.findMany({
    select: {
      id: true,
      slug: true,
      name: true,
      websiteUrl: true,
      moderationStatus: true,
      publicationStatus: true,
    },
  });

  const bySlug = new Map(tools.map((tool) => [tool.slug.toLowerCase(), tool]));
  const byName = new Map(tools.map((tool) => [tool.name.toLowerCase(), tool]));
  const byUrl = new Map(
    tools
      .map((tool) => [normalizeUrl(tool.websiteUrl), tool])
      .filter(([normalizedUrl]) => normalizedUrl),
  );
  const byHost = new Map();

  for (const tool of tools) {
    const toolHost = host(tool.websiteUrl);
    if (toolHost && !byHost.has(toolHost)) {
      byHost.set(toolHost, tool);
    }
  }

  const output = [
    [
      "cluster",
      "name",
      "proposed_slug",
      "url",
      "url_host",
      "db_match_type",
      "existing_tool_id",
      "existing_slug",
      "existing_name",
      "existing_url",
      "moderation_status",
      "publication_status",
      "upload_action",
    ],
  ];
  const uploadCandidateRows = [header];

  for (const record of records) {
    const proposedSlug = slugify(record.name);
    const urlHost = host(record.url);
    let match = bySlug.get(proposedSlug);
    let matchType = match ? "slug" : "";

    if (!match) {
      match = byName.get(record.name.toLowerCase());
      matchType = match ? "name" : "";
    }

    if (!match) {
      match = byUrl.get(normalizeUrl(record.url));
      matchType = match ? "exact_url" : "";
    }

    let uploadAction = match ? "do_not_upload_duplicate" : "new_tool_candidate";

    if (!match && urlHost) {
      match = byHost.get(urlHost);
      matchType = match ? "url_host" : "";
      uploadAction = match ? "manual_review_possible_duplicate" : uploadAction;
    }

    output.push([
      record.cluster,
      record.name,
      proposedSlug,
      record.url,
      urlHost,
      matchType,
      match?.id ?? "",
      match?.slug ?? "",
      match?.name ?? "",
      match?.websiteUrl ?? "",
      match?.moderationStatus ?? "",
      match?.publicationStatus ?? "",
      uploadAction,
    ]);

    if (uploadAction !== "do_not_upload_duplicate") {
      uploadCandidateRows.push(header.map((column) => record[column] ?? ""));
    }
  }

  fs.writeFileSync(
    outputPath,
    `${output.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`,
  );

  if (uploadCandidatesPath) {
    fs.writeFileSync(
      uploadCandidatesPath,
      `${uploadCandidateRows.map((row) => row.map(csvEscape).join(",")).join("\n")}\n`,
    );
  }

  const duplicateCount = output
    .slice(1)
    .filter((row) => row[12] === "do_not_upload_duplicate").length;
  const reviewCount = output
    .slice(1)
    .filter((row) => row[12] === "manual_review_possible_duplicate").length;

  console.log(
    JSON.stringify(
      {
        proposed: records.length,
        existing: duplicateCount,
        manual_review: reviewCount,
        new_candidates: records.length - duplicateCount - reviewCount,
        total_db_tools: tools.length,
      },
      null,
      2,
    ),
  );
} finally {
  await prisma.$disconnect();
}
