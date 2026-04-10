import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Identifying tools without an owner...");

  const unownedTools = await prisma.tool.findMany({
    where: {
      ownerUserId: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });

  if (unownedTools.length === 0) {
    console.log("No unowned tools found. Nothing to delete.");
    return;
  }

  console.log(`Found ${unownedTools.length} unowned tools:`);
  unownedTools.forEach((tool) => {
    console.log(`- ${tool.name} (${tool.slug}) [ID: ${tool.id}]`);
  });

  const confirmDelete = process.argv.includes("--confirm");

  if (!confirmDelete) {
    console.log("\nDRY RUN: Run with '--confirm' to actually delete these tools.");
    return;
  }

  console.log("\nDeleting tools...");
  const deleteResult = await prisma.tool.deleteMany({
    where: {
      ownerUserId: null,
    },
  });

  console.log(`Successfully deleted ${deleteResult.count} tools.`);
}

main()
  .catch((error) => {
    console.error("Error pruning unowned tools:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
