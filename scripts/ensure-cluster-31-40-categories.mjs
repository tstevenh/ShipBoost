#!/usr/bin/env node
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    slug: "ai",
    name: "AI",
    description:
      "AI tools for chat, research, automation, writing, coding, and productivity workflows.",
    seoIntro:
      "Explore AI tools for founders and operators comparing assistants, AI search products, creative AI, and workflow copilots.",
    metaTitle: "Best AI Tools for Founders and Operators | ShipBoost",
    metaDescription:
      "Compare AI software for chat, research, writing, coding, creative work, and productivity on ShipBoost.",
    sortOrder: 15,
  },
];

async function main() {
  const results = [];

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        seoIntro: category.seoIntro,
        metaTitle: category.metaTitle,
        metaDescription: category.metaDescription,
        isActive: true,
      },
      create: {
        ...category,
        isActive: true,
      },
      select: { slug: true, name: true, isActive: true },
    });

    results.push(saved);
  }

  console.log(JSON.stringify({ categories: results }, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
