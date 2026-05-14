import { unstable_cache } from "next/cache";
import { prisma } from "@/server/db/client";

export interface LeaderboardEntry {
  userId: string;
  name: string | null;
  image: string | null;
  streakCount: number;
  rank: number;
}

async function loadTop(limit: number): Promise<LeaderboardEntry[]> {
  const rows = await prisma.$queryRaw<Array<{
    userId: string;
    name: string | null;
    image: string | null;
    streakCount: bigint;
  }>>`
    SELECT u.id as "userId", u.name, u.image, COUNT(s.id) as "streakCount"
    FROM "User" u
    JOIN "UserStreakDay" s ON s."userId" = u.id
    WHERE u."hideFromLeaderboard" = false
    GROUP BY u.id
    ORDER BY COUNT(s.id) DESC, u."createdAt" ASC
    LIMIT ${limit}
  `;
  return rows.map((r, i) => ({
    userId: r.userId,
    name: r.name,
    image: r.image,
    streakCount: Number(r.streakCount),
    rank: i + 1,
  }));
}

export const getStreakLeaderboard = unstable_cache(
  async (limit = 50) => loadTop(limit),
  ["streak-leaderboard", "v1"],
  { revalidate: 300 },
);

export async function getUserRank(userId: string): Promise<LeaderboardEntry | null> {
  const myCount = await prisma.userStreakDay.count({ where: { userId } });
  if (myCount === 0) return null;

  const ahead = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*) as count FROM (
      SELECT u.id, COUNT(s.id) as c
      FROM "User" u
      JOIN "UserStreakDay" s ON s."userId" = u.id
      WHERE u."hideFromLeaderboard" = false AND u.id != ${userId}
      GROUP BY u.id
      HAVING COUNT(s.id) > ${myCount}
    ) sub
  `;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, image: true },
  });
  if (!user) return null;

  return {
    userId: user.id,
    name: user.name,
    image: user.image,
    streakCount: myCount,
    rank: Number(ahead[0].count) + 1,
  };
}
