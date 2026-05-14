import { PrismaClient } from "@prisma/client";
import { unlockMilestoneReward } from "@/server/services/streak-service";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findFirst({
    where: { name: { contains: "Steven", mode: "insensitive" } },
  });
  if (!user) {
    console.log("Steven not found");
    return;
  }
  console.log("Found Steven:", user.id);

  for (const m of [10, 25] as const) {
    console.log(`Unlocking milestone ${m}…`);
    const r = await unlockMilestoneReward(user.id, m);
    if (r) {
      console.log(`  ✓ code=${r.code} dodoId=${r.dodoDiscountId}`);
    } else {
      console.log("  (already exists, skipped)");
    }
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
