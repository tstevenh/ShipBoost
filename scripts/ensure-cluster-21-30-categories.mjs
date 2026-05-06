import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  {
    slug: "security",
    name: "Security",
    description: "Security, compliance, access control, and risk management software.",
    seoIntro:
      "Explore security and compliance tools for password management, SOC 2 readiness, trust operations, and business risk workflows.",
    metaTitle: "Best Security Software and Compliance Tools | ShipBoost",
    metaDescription:
      "Compare security software, password managers, SOC 2 compliance tools, and risk management platforms for modern teams.",
  },
  {
    slug: "product",
    name: "Product",
    description: "Product management, feedback, roadmapping, and release communication software.",
    seoIntro:
      "Explore product management tools for collecting feedback, prioritizing ideas, planning roadmaps, and communicating releases.",
    metaTitle: "Best Product Management Software and Roadmap Tools | ShipBoost",
    metaDescription:
      "Compare product management software, customer feedback tools, roadmap platforms, and changelog tools for product teams.",
  },
  {
    slug: "data",
    name: "Data",
    description: "Business intelligence, dashboards, reporting, and data visualization software.",
    seoIntro:
      "Explore data and reporting tools for dashboards, business intelligence, KPI tracking, and data visualization workflows.",
    metaTitle: "Best Business Intelligence and Dashboard Software | ShipBoost",
    metaDescription:
      "Compare business intelligence software, dashboard tools, reporting platforms, and data visualization products.",
  },
  {
    slug: "success",
    name: "Success",
    description: "Customer success, retention, product adoption, and account management software.",
    seoIntro:
      "Explore customer success tools for health scoring, onboarding, playbooks, renewals, and retention workflows.",
    metaTitle: "Best Customer Success Software and Retention Tools | ShipBoost",
    metaDescription:
      "Compare customer success software, retention platforms, health scoring tools, and product adoption software.",
  },
];

try {
  const results = [];

  for (const [index, category] of categories.entries()) {
    const result = await prisma.category.upsert({
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
        sortOrder: 100 + index,
      },
      select: { slug: true, name: true, isActive: true },
    });

    results.push(result);
  }

  console.log(JSON.stringify({ ensured: results }, null, 2));
} finally {
  await prisma.$disconnect();
}
