import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const votes = await prisma.toolVote.findMany({
    select: { userId: true, createdAt: true },
  });

  const buckets = new Map();
  for (const v of votes) {
    const day = new Date(
      Date.UTC(
        v.createdAt.getUTCFullYear(),
        v.createdAt.getUTCMonth(),
        v.createdAt.getUTCDate(),
      ),
    );
    const key = day.toISOString();
    if (!buckets.has(v.userId)) buckets.set(v.userId, new Set());
    buckets.get(v.userId).add(key);
  }

  let inserted = 0;
  for (const [userId, days] of buckets) {
    for (const dayIso of days) {
      try {
        await prisma.userStreakDay.create({
          data: { userId, day: new Date(dayIso) },
        });
        inserted++;
      } catch (err) {
        if (err.code !== "P2002") throw err;
      }
    }
  }
  console.log(
    `Backfilled ${inserted} streak day rows for ${buckets.size} users`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
