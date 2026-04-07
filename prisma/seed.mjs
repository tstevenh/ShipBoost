import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
  const categories = [
    {
      slug: "distribution",
      name: "Distribution",
      description: "Tools that help bootstrapped founders acquire reach and attention.",
      seoIntro: "Distribution tools for bootstrapped SaaS founders who need more than one launch-day spike.",
      sortOrder: 1,
    },
    {
      slug: "marketing",
      name: "Marketing",
      description: "Products that help founders attract, convert, and retain customers.",
      seoIntro: "Marketing software for lean SaaS teams that need traction without an in-house growth team.",
      sortOrder: 2,
    },
    {
      slug: "analytics",
      name: "Analytics",
      description: "Tools for understanding user behavior, performance, and conversion.",
      seoIntro: "Analytics tools for bootstrapped founders who need signal, not dashboard theater.",
      sortOrder: 3,
    },
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: category,
      create: category,
    });
  }
}

async function seedTags() {
  const tags = [
    { slug: "bootstrapped", name: "Bootstrapped" },
    { slug: "launch", name: "Launch" },
    { slug: "growth", name: "Growth" },
    { slug: "marketing", name: "Marketing" },
    { slug: "seo", name: "SEO" },
    { slug: "founder-tools", name: "Founder Tools" },
  ];

  for (const tag of tags) {
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
