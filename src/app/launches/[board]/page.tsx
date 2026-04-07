import { notFound } from "next/navigation";

import { LaunchBoard } from "@/components/public/launch-board";
import { listLaunchBoard } from "@/server/services/launch-service";

type RouteContext = {
  params: Promise<{ board: string }>;
};

export default async function LaunchBoardPage(context: RouteContext) {
  const { board } = await context.params;

  if (!["daily", "weekly", "monthly"].includes(board)) {
    notFound();
  }

  const launches = await listLaunchBoard(board as "daily" | "weekly" | "monthly");

  return (
    <section className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-16 sm:py-20">
      <LaunchBoard
        board={board as "daily" | "weekly" | "monthly"}
        launches={launches}
      />
    </section>
  );
}
