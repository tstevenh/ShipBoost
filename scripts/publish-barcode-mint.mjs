// Publish the "Barcode Mint" tool listing (+ SIDEBAR and INLINE_PRODUCT ads).
//
// Run:  node scripts/run-with-env.mjs node scripts/publish-barcode-mint.mjs
// Add --dry to preview without writing.
//
// Idempotent: if a tool with slug "barcode-mint" already exists it exits without
// changes. Delete that row to re-run.
//
// Tweak the CONFIG block below (publish vs draft, image URLs, ad duration, etc).
import { PrismaClient } from "@prisma/client";

const DRY = process.argv.includes("--dry");
// Use the direct (unpooled) connection: interactive transactions don't work over
// Neon's PgBouncer pooled URL ("Transaction not found").
const dbUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
const prisma = new PrismaClient({ datasources: { db: { url: dbUrl } } });

const CONFIG = {
  slug: "barcode-mint",
  name: "Barcode Mint",
  tagline: "Free barcode & QR generator with a REST API", // 10-60 chars
  websiteUrl: "https://barcodemint.com",
  pricingModel: "FREEMIUM", // FREE | FREEMIUM | PAID | CUSTOM | CONTACT_SALES
  richDescription: [
    "Barcode Mint is a free online barcode and QR code generator that produces production-ready codes in seconds — no signup and no watermark. Choose from 100+ symbologies, including QR, Data Matrix, PDF417, Aztec, Code 128, Code 39, EAN-13, UPC-A and the full GS1 family, then fine-tune size, colors and error correction with a live preview.",
    "Built for online sellers, warehouses and marketers, Barcode Mint exports crisp PNG and SVG files and generates codes in bulk from a CSV — ideal for product labels, inventory tags and print runs. Every code is encoded with a reference-grade engine (BWIPP), so your GS1, retail and postal barcodes scan reliably the first time.",
    "Developers can add barcode and QR generation to any app with the Barcode Mint REST API — one request returns a PNG or SVG image, with commercial licensing and higher volumes on paid plans. Start free in the browser and upgrade only when you need bulk output, vector export or the API at scale.",
  ].join("\n\n"),
  metaTitle: "Barcode Mint — Free Barcode & QR Code Generator",
  metaDescription: "Generate barcodes and QR codes free — 100+ types (QR, Code 128, EAN, UPC, GS1), bulk from CSV, PNG/SVG export, plus a REST API. No signup, no watermark.",
  canonicalUrl: "https://barcodemint.com",

  logoUrl: "https://barcodemint.com/logo.png",
  screenshotUrls: ["https://barcodemint.com/og/og-default.png"], // OG image as media

  categorySlugs: ["development", "productivity"], // 1-3, must exist
  tagSlugs: ["api", "developer-tools", "free-tools", "no-code", "web-app"], // 1-5, must exist

  publish: true, // true => APPROVED + PUBLISHED (live). false => DRAFT + UNPUBLISHED.
  isFeatured: false,

  adSlots: ["SIDEBAR", "INLINE_PRODUCT"], // sidebar ad + product ad
  adDurationDays: 365,
};

async function main() {
  const existing = await prisma.tool.findUnique({ where: { slug: CONFIG.slug }, select: { id: true } });
  if (existing) {
    console.log(`Tool "${CONFIG.slug}" already exists (${existing.id}). Nothing to do.`);
    return;
  }

  const cats = await prisma.category.findMany({ where: { slug: { in: CONFIG.categorySlugs } }, select: { id: true, slug: true } });
  const tags = await prisma.tag.findMany({ where: { slug: { in: CONFIG.tagSlugs } }, select: { id: true, slug: true } });
  const missingCats = CONFIG.categorySlugs.filter((s) => !cats.some((c) => c.slug === s));
  const missingTags = CONFIG.tagSlugs.filter((s) => !tags.some((t) => t.slug === s));
  if (missingCats.length) throw new Error("Missing categories: " + missingCats.join(", "));
  if (missingTags.length) throw new Error("Missing tags: " + missingTags.join(", "));

  const now = new Date();
  const endsAt = new Date(now.getTime() + CONFIG.adDurationDays * 24 * 60 * 60 * 1000);

  if (DRY) {
    console.log("[dry run] would create tool:", CONFIG.name, "(" + CONFIG.slug + ")");
    console.log("  status:", CONFIG.publish ? "APPROVED + PUBLISHED" : "DRAFT + UNPUBLISHED");
    console.log("  categories:", cats.map((c) => c.slug).join(", "));
    console.log("  tags:", tags.map((t) => t.slug).join(", "));
    console.log("  logo:", CONFIG.logoUrl, "| media:", CONFIG.screenshotUrls.join(", "));
    console.log("  ads:", CONFIG.adSlots.join(" + "), "ACTIVE for", CONFIG.adDurationDays, "days");
    return;
  }

  const result = await prisma.$transaction(async (tx) => {
    const tool = await tx.tool.create({
      data: {
        slug: CONFIG.slug,
        name: CONFIG.name,
        tagline: CONFIG.tagline,
        websiteUrl: CONFIG.websiteUrl,
        richDescription: CONFIG.richDescription,
        pricingModel: CONFIG.pricingModel,
        moderationStatus: CONFIG.publish ? "APPROVED" : "DRAFT",
        publicationStatus: CONFIG.publish ? "PUBLISHED" : "UNPUBLISHED",
        isFeatured: CONFIG.isFeatured,
        metaTitle: CONFIG.metaTitle,
        metaDescription: CONFIG.metaDescription,
        canonicalUrl: CONFIG.canonicalUrl,
        internalNote: "Created via scripts/publish-barcode-mint.mjs",
      },
    });

    const logo = await tx.toolMedia.create({
      data: { toolId: tool.id, type: "LOGO", url: CONFIG.logoUrl, sortOrder: 0 },
    });
    await tx.tool.update({ where: { id: tool.id }, data: { logoMediaId: logo.id } });

    for (let i = 0; i < CONFIG.screenshotUrls.length; i++) {
      await tx.toolMedia.create({
        data: { toolId: tool.id, type: "SCREENSHOT", url: CONFIG.screenshotUrls[i], sortOrder: i },
      });
    }

    for (let i = 0; i < cats.length; i++) {
      await tx.toolCategory.create({ data: { toolId: tool.id, categoryId: cats[i].id, sortOrder: i } });
    }
    for (let i = 0; i < tags.length; i++) {
      await tx.toolTag.create({ data: { toolId: tool.id, tagId: tags[i].id, sortOrder: i } });
    }

    for (const slot of CONFIG.adSlots) {
      await tx.sponsorPlacement.create({
        data: { toolId: tool.id, slot, status: "ACTIVE", startsAt: now, endsAt, paidAt: now },
      });
    }

    return tool;
  }, { timeout: 20000, maxWait: 10000 });

  console.log(`Published "${CONFIG.name}" (${result.id})`);
  console.log(`  ${CONFIG.publish ? "LIVE (APPROVED + PUBLISHED)" : "DRAFT"} · ads: ${CONFIG.adSlots.join(" + ")} ACTIVE until ${endsAt.toISOString().slice(0, 10)}`);
  console.log(`  view: /tools/${CONFIG.slug}`);
}

main()
  .catch((e) => { console.error("FAILED:", e.message); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
