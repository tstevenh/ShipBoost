// One-off cleanup script.
// Usage:
//   node scripts/run-with-env.mjs node scripts/cleanup-test-data.mjs
//   node scripts/run-with-env.mjs node scripts/cleanup-test-data.mjs --apply
//
// Default is dry-run. Pass --apply to actually write.

import { PrismaClient } from "@prisma/client";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient();

async function main() {
  console.log(APPLY ? "=== APPLY MODE ===" : "=== DRY RUN (pass --apply to write) ===");

  const FOUNDER_EMAIL = "tsth02035@gmail.com";
  const founder = await prisma.user.findUnique({
    where: { email: FOUNDER_EMAIL },
    select: { id: true, email: true },
  });
  if (!founder) {
    throw new Error(`Founder not found for email ${FOUNDER_EMAIL}`);
  }
  console.log(`Scoping test-tool reset to founder ${founder.email} (${founder.id})`);

  // 1) Reset these tools owned by the founder back to DRAFT
  const TOOL_NAMES = ["Sheepie"];
  const testTools = await prisma.tool.findMany({
    where: {
      name: { in: TOOL_NAMES, mode: "insensitive" },
      ownerUserId: founder.id,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      moderationStatus: true,
      publicationStatus: true,
      submissions: {
        select: { id: true, reviewStatus: true, paymentStatus: true, submissionType: true },
      },
      launches: { select: { id: true, launchType: true, status: true, launchDate: true } },
    },
  });

  console.log("\n--- 'test' tools ---");
  console.dir(testTools, { depth: null });

  // 2) Show all sponsor placements (so we can pick the one to keep)
  const placements = await prisma.sponsorPlacement.findMany({
    select: {
      id: true,
      slot: true,
      status: true,
      createdAt: true,
      endsAt: true,
      disabledAt: true,
      tool: { select: { id: true, name: true, slug: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  console.log("\n--- All sponsor placements ---");
  console.dir(placements, { depth: null });

  // Keep the IndoorClimbingGym SIDEBAR placement.
  const keep = placements.find(
    (p) =>
      p.tool.name.toLowerCase().includes("indoorclimbinggym") &&
      p.slot === "SIDEBAR" &&
      p.status === "ACTIVE",
  );
  console.log("\n--- Will KEEP placement ---");
  console.dir(keep, { depth: null });

  const toDelete = placements.filter((p) => p.id !== keep?.id);
  console.log(`\n--- Will DELETE ${toDelete.length} placement(s) ---`);
  console.dir(
    toDelete.map((p) => ({ id: p.id, tool: p.tool.name, slot: p.slot, status: p.status })),
    { depth: null },
  );

  if (!APPLY) {
    console.log("\nDry run complete. Re-run with --apply to write.");
    return;
  }

  // --- WRITE ---

  // Delete unwanted placements
  if (toDelete.length > 0) {
    const result = await prisma.sponsorPlacement.deleteMany({
      where: { id: { in: toDelete.map((p) => p.id) } },
    });
    console.log(`Deleted ${result.count} sponsor placement(s).`);
  }

  // Reset each "test" tool back to draft state
  for (const tool of testTools) {
    // Delete launches (they reference the tool; only test data)
    if (tool.launches.length > 0) {
      const delLaunches = await prisma.launch.deleteMany({ where: { toolId: tool.id } });
      console.log(`Tool ${tool.slug}: deleted ${delLaunches.count} launch(es).`);
    }

    // Reset tool publication + moderation
    await prisma.tool.update({
      where: { id: tool.id },
      data: {
        moderationStatus: "DRAFT",
        publicationStatus: "UNPUBLISHED",
        currentLaunchType: null,
      },
    });
    console.log(`Tool ${tool.slug}: reset to DRAFT / UNPUBLISHED.`);

    // Reset all submissions on this tool back to DRAFT, clear payment/badge state
    for (const sub of tool.submissions) {
      await prisma.submission.update({
        where: { id: sub.id },
        data: {
          reviewStatus: "DRAFT",
          paymentStatus: "NOT_REQUIRED",
          submissionType: "LISTING_ONLY",
          paidAt: null,
          polarOrderId: null,
          polarCheckoutId: null,
          preferredLaunchDate: null,
          badgeVerification: "NOT_REQUIRED",
          badgeFooterUrl: null,
          founderVisibleNote: null,
          internalReviewNote: null,
        },
      });
      console.log(`Tool ${tool.slug}: submission ${sub.id} reset to DRAFT.`);
    }

    // Wipe spotlight briefs if any (testing artifact)
    const delBriefs = await prisma.submissionSpotlightBrief.deleteMany({
      where: { submission: { toolId: tool.id } },
    });
    if (delBriefs.count > 0) {
      console.log(`Tool ${tool.slug}: deleted ${delBriefs.count} spotlight brief(s).`);
    }
  }

  console.log("\nDone.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
