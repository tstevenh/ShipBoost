import { PrismaClient } from "@prisma/client";

const SLUG = "launch-spotlights";

const FIELDS = {
  description:
    "Hand-written articles about products launched on ShipBoost — written during launch week, indexed for the long tail.",
  seoIntro:
    "Launch Spotlights are hand-written editorial articles about products that launched on ShipBoost. Each one is written by our editor during launch week — covering what the product does, who it's for, and why it matters in its category. Unlike a one-day feed, these articles stay indexed: a permanent third-party page the founder can share, link to, and rank for in search long after launch week ends.",
  metaTitle: "Launch Spotlights — SaaS Product Articles | ShipBoost",
  metaDescription:
    "Hand-written editorial articles about SaaS and bootstrapped products launched on ShipBoost. Each piece is a permanent, indexed third-party page.",
};

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.blogCategory.findUnique({
    where: { slug: SLUG },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoIntro: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  if (!existing) {
    console.error(`Category "${SLUG}" not found.`);
    process.exit(1);
  }

  console.log("Before:", JSON.stringify(existing, null, 2));

  const updated = await prisma.blogCategory.update({
    where: { slug: SLUG },
    data: FIELDS,
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      seoIntro: true,
      metaTitle: true,
      metaDescription: true,
    },
  });

  console.log("After:", JSON.stringify(updated, null, 2));
  console.log(`\nDone. Updated 4 fields on category "${SLUG}".`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
