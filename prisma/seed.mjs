import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { normalizedTags } from "../scripts/tag-taxonomy.mjs";

const prisma = new PrismaClient();

const canonicalCategories = [
  {
    slug: "marketing",
    name: "Marketing",
    description: "Tools for attracting, converting, and retaining customers.",
    seoIntro: "Marketing tools for SaaS teams that need clearer traction and stronger distribution.",
    sortOrder: 1,
  },
  {
    slug: "sales",
    name: "Sales",
    description: "Software for pipeline management, outreach, demos, and closing revenue.",
    seoIntro: "Sales tools for founders who need to move from interest to revenue without a bulky stack.",
    sortOrder: 2,
  },
  {
    slug: "analytics",
    name: "Analytics",
    description: "Products for measuring behavior, performance, attribution, and conversion.",
    seoIntro: "Analytics tools for founders who need signal, not dashboard theater.",
    sortOrder: 3,
  },
  {
    slug: "support",
    name: "Support",
    description: "Tools for customer service, help docs, live chat, and issue resolution.",
    seoIntro: "Support software for teams that want fast response loops and cleaner customer operations.",
    sortOrder: 4,
  },
  {
    slug: "productivity",
    name: "Productivity",
    description: "Apps that help teams organize work, automate tasks, and stay aligned.",
    seoIntro: "Productivity tools for lean teams that need better execution without extra overhead.",
    sortOrder: 5,
  },
  {
    slug: "development",
    name: "Development",
    description: "Developer tools for building, shipping, testing, and maintaining software.",
    seoIntro: "Development tools for modern SaaS builders shipping fast with small teams.",
    sortOrder: 6,
  },
  {
    slug: "design",
    name: "Design",
    description: "Products for UI design, prototyping, creative assets, and visual systems.",
    seoIntro: "Design tools for teams that care about product polish, speed, and consistency.",
    sortOrder: 7,
  },
  {
    slug: "finance",
    name: "Finance",
    description: "Software for billing, accounting, cash flow, pricing, and financial operations.",
    seoIntro: "Finance tools for founders managing revenue, cash, and operational clarity.",
    sortOrder: 8,
  },
];

function loadDotenvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const text = fs.readFileSync(envPath, "utf8");

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL ?? "admin@example.com";
  const name = process.env.ADMIN_NAME ?? "Shipboost Admin";

  return prisma.user.upsert({
    where: { email },
    update: {
      name,
      role: "ADMIN",
      emailVerified: true,
    },
    create: {
      email,
      name,
      role: "ADMIN",
      emailVerified: true,
    },
  });
}

async function seedCategories() {
  for (const category of canonicalCategories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }

  await prisma.category.deleteMany({
    where: {
      slug: {
        notIn: canonicalCategories.map((category) => category.slug),
      },
    },
  });
}

async function seedTags() {
  for (const tag of normalizedTags) {
    await prisma.tag.upsert({
      where: { slug: tag.slug },
      update: tag,
      create: tag,
    });
  }
}

async function main() {
  loadDotenvLocal();

  const admin = await seedAdmin();
  await seedCategories();
  await seedTags();

  console.log(`Seeded admin user ${admin.email} and starter catalog records.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
