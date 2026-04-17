import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const FROM_DATE = new Date("2026-05-01T00:00:00.000Z");
const TO_DATE = new Date("2026-05-04T00:00:00.000Z");

async function main() {
  const confirm = process.argv.includes("--confirm");

  const launches = await prisma.launch.findMany({
    where: {
      launchType: "FREE",
      launchDate: FROM_DATE,
    },
    select: {
      id: true,
      toolId: true,
      launchDate: true,
      startAt: true,
      status: true,
    },
  });

  if (launches.length === 0) {
    console.log("No free launches found at 2026-05-01T00:00:00.000Z.");
    return;
  }

  console.log(`Found ${launches.length} free launch(es) to move:`);
  launches.forEach((launch) => {
    console.log(`- ${launch.id} (${launch.toolId}) ${launch.launchDate.toISOString()}`);
  });

  if (!confirm) {
    console.log("DRY RUN: rerun with --confirm to move them to 2026-05-04T00:00:00.000Z.");
    return;
  }

  const result = await prisma.launch.updateMany({
    where: {
      launchType: "FREE",
      launchDate: FROM_DATE,
    },
    data: {
      launchDate: TO_DATE,
      startAt: TO_DATE,
    },
  });

  console.log(`Updated ${result.count} free launch(es) to 2026-05-04T00:00:00.000Z.`);
}

main()
  .catch((error) => {
    console.error("Error shifting launchpad go-live date:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
