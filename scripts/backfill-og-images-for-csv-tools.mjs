import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const csvPath = process.argv[2] ? path.resolve(process.cwd(), process.argv[2]) : null;
const shouldExecute = process.argv.includes("--execute");
const shouldReplace = process.argv.includes("--replace");

if (!csvPath) {
  console.error("Usage: node scripts/backfill-og-images-for-csv-tools.mjs <enriched.csv> [--execute]");
  process.exit(1);
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        index += 1;
      }
      row.push(field);
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    if (row.some((cell) => cell.length > 0)) {
      rows.push(row);
    }
  }

  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])),
  );
}

try {
  const rows = parseCsv(fs.readFileSync(csvPath, "utf8"));
  const names = rows.map((row) => row.name);
  const tools = await prisma.tool.findMany({
    where: {
      name: { in: names },
      publicationStatus: "PUBLISHED",
      moderationStatus: "APPROVED",
    },
    select: { name: true, slug: true },
  });
  const slugByName = new Map(tools.map((tool) => [tool.name, tool.slug]));
  const missing = names.filter((name) => !slugByName.has(name));

  if (missing.length > 0) {
    console.error(JSON.stringify({ missing }, null, 2));
    process.exit(1);
  }

  const slugs = names.map((name) => slugByName.get(name)).join(",");
  const args = [
    "scripts/backfill-og-images-to-cloudinary.mjs",
    "--csv",
    csvPath,
    "--slugs",
    slugs,
  ];

  if (shouldExecute) {
    args.push("--execute");
  }

  if (shouldReplace) {
    args.push("--replace");
  }

  const result = spawnSync(process.execPath, args, {
    stdio: "inherit",
    env: process.env,
  });

  process.exit(result.status ?? 1);
} finally {
  await prisma.$disconnect();
}
